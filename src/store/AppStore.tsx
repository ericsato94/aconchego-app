import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppNotification, Child, UserData } from '../types'
import { VOICE } from '../config/app'
import { authService, toUser } from '../services/auth'
import { recordingsService } from '../services/recordings'
import { uid } from '../services/storage'
import { supabase } from '../services/supabase'
import { defaultUserData, demoUserData, userDataRepo } from '../services/userData'
import { voiceApi } from '../services/voiceApi'
import type { User } from '../types'
import { AppContext, type AppActions, type AppState } from './appContext'

function systemNotify(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  } catch {
    /* alguns navegadores móveis exigem service worker para notificar */
  }
}

const VOICE_READY = {
  title: 'Sua voz está pronta!',
  body: 'Ouça como ficou e aprove para começar as histórias.',
}
/** Se a criação na nuvem não responder nesse prazo (ex.: app fechado no meio), a gravação precisa ser refeita. */
const CLOUD_TIMEOUT_MS = 3 * 60_000

const notification = (title: string, body: string, link?: string): AppNotification => ({
  id: uid(),
  title,
  body,
  link,
  at: new Date().toISOString(),
  read: false,
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<UserData>(defaultUserData)
  const userRef = useRef<User | null>(null)
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const update = useCallback((fn: (prev: UserData) => UserData) => {
    setData((prev) => {
      const next = { ...fn(prev), savedAt: new Date().toISOString() }
      if (userRef.current) userDataRepo.save(userRef.current.id, next)
      return next
    })
  }, [])

  /**
   * Abre a conta: mostra na hora a cópia local e depois a versão do Supabase.
   * Primeiro acesso (sem dados na nuvem): grava `seed`.
   */
  const enter = useCallback(async (u: User, seed?: () => UserData) => {
    userRef.current = u
    voiceApi.reset()
    const cached = userDataRepo.cached(u.id)
    // Sem cópia local: espera os dados da nuvem antes de liberar as rotas (evita pedir o consentimento de novo).
    if (cached) setData(cached)
    else setStatus('loading')
    setUser(u)
    try {
      const remote = await userDataRepo.load(u.id)
      if (userRef.current?.id !== u.id) return
      if (!remote && !cached) {
        // Primeiro acesso: grava os dados iniciais.
        const initial = { ...(seed?.() ?? defaultUserData()), savedAt: new Date().toISOString() }
        setData(initial)
        userDataRepo.save(u.id, initial, true)
      } else {
        // Fica com a versão mais recente; se a do aparelho for mais nova (não chegou a subir), reenvia.
        const { data: latest, localIsNewer } = userDataRepo.pickLatest(cached, remote)
        if (latest) {
          const withConsent = { ...latest, consent: latest.consent ?? remote?.consent }
          setData(withConsent)
          if (localIsNewer) userDataRepo.save(u.id, withConsent, true)
          else userDataRepo.cacheOnly(u.id, withConsent)
        }
      }
    } catch {
      // Sem conexão: segue com a cópia local.
    } finally {
      if (userRef.current?.id === u.id) setStatus('ready')
    }
  }, [])

  const leave = useCallback(() => {
    userRef.current = null
    voiceApi.reset()
    setUser(null)
    setData(defaultUserData())
  }, [])

  // Sessão salva ao abrir o app + mudanças de sessão (expirou, saiu em outra aba…).
  useEffect(() => {
    let alive = true
    authService.currentUser().then(async (u) => {
      if (u) await enter(u)
      else if (alive) setStatus('ready')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') leave()
      else if (event === 'USER_UPDATED' && session) setUser(toUser(session.user))
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [enter, leave])

  // Geração da voz. Local: simulada até readyAt. Nuvem: o prazo é só uma salvaguarda.
  useEffect(() => {
    const { status, readyAt, startedAt, mode } = data.voice
    if (status !== 'processing') return
    const cloud = mode === 'cloud'
    const deadline = cloud ? new Date(startedAt ?? 0).getTime() + CLOUD_TIMEOUT_MS : new Date(readyAt ?? 0).getTime()
    const timer = window.setTimeout(() => {
      if (cloud) {
        update((d) =>
          d.voice.status !== 'processing'
            ? d
            : { ...d, voice: { status: 'none', error: 'A criação da voz foi interrompida. Grave novamente, por favor.' } },
        )
        return
      }
      update((d) => ({
        ...d,
        voice: { ...d.voice, status: 'review' },
        notifications: [notification(VOICE_READY.title, VOICE_READY.body, '/voz/teste'), ...d.notifications],
      }))
      systemNotify(VOICE_READY.title, VOICE_READY.body)
    }, Math.max(0, deadline - Date.now()))
    return () => window.clearTimeout(timer)
  }, [data.voice, update])

  // Lembrete da hora de dormir (enquanto o app estiver aberto; push real depende do backend).
  useEffect(() => {
    if (!user || !data.settings.bedtimeReminder) return
    let lastFired = ''
    const check = () => {
      const now = new Date()
      const hhmm = now.toTimeString().slice(0, 5)
      const today = now.toDateString()
      if (hhmm === data.settings.reminderTime && lastFired !== today) {
        lastFired = today
        const title = 'Hora da história 🌙'
        const body = 'Que tal uma história com a sua voz antes de dormir?'
        update((d) => ({ ...d, notifications: [notification(title, body, '/sono'), ...d.notifications] }))
        systemNotify(title, body)
      }
    }
    const timer = window.setInterval(check, 20_000)
    return () => window.clearInterval(timer)
  }, [user, data.settings.bedtimeReminder, data.settings.reminderTime, update])

  const actions = useMemo<AppActions>(
    () => ({
      async signUp(name, email, password, child) {
        const u = await authService.signUp(name, email, password)
        await enter(u, () => {
          const seed = defaultUserData()
          if (child?.name) {
            const c: Child = { id: uid(), ...child }
            seed.children = [c]
            seed.activeChildId = c.id
          }
          return seed
        })
      },
      async signIn(email, password) {
        await enter(await authService.signIn(email, password))
      },
      async signInWithGoogle() {
        // Redireciona para o Google; ao voltar, a sessão é retomada ao abrir o app.
        await authService.signInWithGoogle()
      },
      async signInDemo() {
        const { user: u } = await authService.signInDemo()
        await enter(u, () => demoUserData(u.id))
      },
      async signOut() {
        await authService.signOut()
        leave()
      },
      async updateProfile(name, email) {
        const { user: u, emailPending } = await authService.updateProfile(name, email)
        userRef.current = u
        setUser(u)
        return emailPending
      },
      async acceptConsent(items) {
        const userId = userRef.current?.id
        if (!userId) return
        const consent = await userDataRepo.recordConsent(userId, VOICE.consentVersion, items)
        update((d) => ({ ...d, consent }))
      },
      addChild(child) {
        const c = { id: uid(), ...child }
        update((d) => ({ ...d, children: [...d.children, c], activeChildId: d.activeChildId ?? c.id }))
      },
      updateChild(child) {
        update((d) => ({ ...d, children: d.children.map((c) => (c.id === child.id ? child : c)) }))
      },
      removeChild(id) {
        update((d) => {
          const children = d.children.filter((c) => c.id !== id)
          return { ...d, children, activeChildId: d.activeChildId === id ? children[0]?.id : d.activeChildId }
        })
      },
      setActiveChild(id) {
        update((d) => ({ ...d, activeChildId: id }))
      },
      toggleFavorite(storyId) {
        const added = !dataRef.current.favorites.includes(storyId)
        update((d) => ({
          ...d,
          favorites: added ? [...d.favorites, storyId] : d.favorites.filter((id) => id !== storyId),
        }))
        return added
      },
      saveProgress(storyId, position, total, completed) {
        const now = new Date().toISOString()
        update((d) => ({
          ...d,
          progress: {
            ...d.progress,
            [storyId]: completed
              ? { position: 0, total, updatedAt: now, completedAt: now }
              : { ...d.progress[storyId], position, total, updatedAt: now },
          },
        }))
      },
      addListen(storyId, seconds) {
        if (seconds < 5) return
        update((d) => {
          const [last] = d.history
          // Agrupa sessões seguidas da mesma história (pausar/retomar) num único registro.
          if (last && last.storyId === storyId && Date.now() - new Date(last.at).getTime() < 30 * 60_000) {
            const merged = { ...last, at: new Date().toISOString(), seconds: last.seconds + seconds }
            return { ...d, history: [merged, ...d.history.slice(1)] }
          }
          return {
            ...d,
            history: [{ id: uid(), storyId, at: new Date().toISOString(), seconds: Math.round(seconds) }, ...d.history],
          }
        })
      },
      setPlan(plan) {
        update((d) => ({ ...d, plan }))
      },
      updateSettings(patch) {
        update((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
      },
      async startVoice(phrase, quality) {
        const u = userRef.current
        if (!u) return
        const previous = dataRef.current.voice
        const previousId = previous.status === 'ready' ? previous.voiceId : undefined
        const now = Date.now()
        // Marca "preparando" na hora; o modo (nuvem/local) é decidido logo em seguida.
        update((d) => ({
          ...d,
          voice: {
            status: 'processing',
            mode: 'cloud',
            phrase,
            quality,
            startedAt: new Date(now).toISOString(),
            // Na nuvem a clonagem instantânea leva segundos; a estimativa só alimenta a barra de progresso.
            readyAt: new Date(now + 30_000).toISOString(),
          },
        }))
        const [phraseBlob, readingBlob] = await Promise.all([
          recordingsService.get(u.id, 'phrase'),
          recordingsService.get(u.id, 'reading'),
        ])
        const cloud = Boolean(phraseBlob?.size && readingBlob?.size) && (await voiceApi.isAvailable())
        if (!cloud) {
          update((d) => ({
            ...d,
            voice: { ...d.voice, mode: 'local', readyAt: new Date(now + VOICE.processingSeconds * 1000).toISOString() },
          }))
          return
        }

        try {
          const paths = await Promise.all([
            recordingsService.upload(u.id, 'phrase', phraseBlob!),
            recordingsService.upload(u.id, 'reading', readingBlob!),
          ])
          const voiceId = await voiceApi.createVoice(`Aconchego · ${u.name}`, paths)
          update((d) =>
            d.voice.status !== 'processing'
              ? d
              : {
                  ...d,
                  voice: { ...d.voice, status: 'review', voiceId, readyAt: new Date().toISOString() },
                  notifications: [notification(VOICE_READY.title, VOICE_READY.body, '/voz/teste'), ...d.notifications],
                },
          )
          systemNotify(VOICE_READY.title, VOICE_READY.body)
          // A voz anterior (regravação) não é mais usada: apaga também na ElevenLabs.
          if (previousId && previousId !== voiceId) voiceApi.deleteVoice(previousId).catch(() => undefined)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro desconhecido.'
          update((d) => ({
            ...d,
            // Regravação que falhou: mantém a voz anterior funcionando.
            voice: previousId ? { ...previous, error: message } : { status: 'none', error: message },
            notifications: [notification('Não conseguimos criar sua voz', message, '/gravar-voz'), ...d.notifications],
          }))
        }
      },
      approveVoice() {
        update((d) => ({ ...d, voice: { ...d.voice, status: 'ready', approvedAt: new Date().toISOString() } }))
      },
      async deleteVoice() {
        const { voiceId } = dataRef.current.voice
        // Exclui primeiro na ElevenLabs (LGPD): se falhar, nada é apagado e o erro chega à tela.
        if (voiceId) await voiceApi.deleteVoice(voiceId)
        if (userRef.current) await recordingsService.removeAll(userRef.current.id)
        update((d) => ({
          ...d,
          voice: { status: 'none' },
          notifications: [
            notification(
              'Voz excluída',
              voiceId
                ? 'Sua voz foi apagada da ElevenLabs, junto com as gravações e narrações.'
                : 'Sua voz e as gravações foram apagadas deste aparelho.',
            ),
            ...d.notifications,
          ],
        }))
      },
      markNotificationsRead() {
        update((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }))
      },
    }),
    [enter, leave, update],
  )

  const value = useMemo<AppState>(
    () => ({
      status,
      user,
      data,
      activeChild: data.children.find((c) => c.id === data.activeChildId) ?? data.children[0],
      actions,
    }),
    [status, user, data, actions],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
