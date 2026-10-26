import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { catalog } from '../services/catalog'
import { narrator } from '../services/narrator'
import { useApp } from './appContext'
import { PlayerContext, type PlayerApi, type PlayerState } from './playerContext'

const FADE_SECONDS = 45

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { data, actions } = useApp()
  const [state, setState] = useState<PlayerState>({ status: 'idle', position: 0, total: 0 })
  const stateRef = useRef(state)
  const listenStart = useRef<number | null>(null)
  const ctx = useRef({ data, actions })
  useEffect(() => {
    stateRef.current = state
    ctx.current = { data, actions }
  })

  const commitListen = useCallback(() => {
    const { storyId } = stateRef.current
    if (listenStart.current && storyId) {
      ctx.current.actions.addListen(storyId, (Date.now() - listenStart.current) / 1000)
    }
    listenStart.current = null
  }, [])

  const speakFrom = useCallback(
    function speakFrom(storyId: string, from: number) {
      const story = catalog.byId(storyId)
      if (!story) return
      const total = story.paragraphs.length
      const sleep = stateRef.current.sleep
      const start = from >= total ? 0 : from
      listenStart.current = Date.now()
      setState((s) => ({ ...s, storyId, status: 'playing', position: start, total, loading: false }))
      const { voice } = ctx.current.data
      narrator.speak(story.paragraphs, start, {
        rate: ctx.current.data.settings.narrationRate,
        cloud: voice.status === 'ready' && voice.voiceId ? { voiceId: voice.voiceId, ref: { storyId } } : undefined,
        volume: sleep && !sleep.finished ? sleep.volume : 1,
        onLoading: (loading) => setState((s) => ({ ...s, loading })),
        onIndex: (index) => {
          setState((s) => ({ ...s, position: index }))
          ctx.current.actions.saveProgress(storyId, index, total)
        },
        onEnd: () => {
          commitListen()
          ctx.current.actions.saveProgress(storyId, total, total, true)
          const current = stateRef.current.sleep
          if (current && !current.finished && current.autoNext) {
            const pool = catalog.all().filter((s) => catalog.canAccess(s, ctx.current.data.plan))
            const nextStory = pool[(pool.findIndex((s) => s.id === storyId) + 1) % pool.length]
            speakFrom(nextStory.id, 0)
            return
          }
          setState((s) => ({ ...s, status: 'paused', position: 0 }))
        },
      })
    },
    [commitListen],
  )

  const pause = useCallback(() => {
    if (stateRef.current.status !== 'playing') return
    narrator.stop()
    commitListen()
    setState((s) => ({ ...s, status: 'paused', loading: false }))
  }, [commitListen])

  const stop = useCallback(() => {
    narrator.stop()
    commitListen()
    setState({ status: 'idle', position: 0, total: 0 })
  }, [commitListen])

  const play = useCallback(
    (storyId: string, from?: number) => {
      if (stateRef.current.status === 'playing') {
        narrator.stop()
        commitListen()
      }
      const saved = ctx.current.data.progress[storyId]
      const resumeAt = from ?? (saved && !saved.completedAt ? saved.position : 0)
      speakFrom(storyId, resumeAt)
    },
    [commitListen, speakFrom],
  )

  const toggle = useCallback(() => {
    const { status, storyId, position } = stateRef.current
    if (!storyId) return
    if (status === 'playing') pause()
    else speakFrom(storyId, position)
  }, [pause, speakFrom])

  const seek = useCallback(
    (position: number) => {
      const { storyId, status, total } = stateRef.current
      if (!storyId) return
      const clamped = Math.max(0, Math.min(total - 1, position))
      if (status === 'playing') {
        narrator.stop()
        commitListen()
        speakFrom(storyId, clamped)
      } else {
        setState((s) => ({ ...s, position: clamped }))
        ctx.current.actions.saveProgress(storyId, clamped, total)
      }
    },
    [commitListen, speakFrom],
  )

  const startSleep = useCallback(
    (storyId: string, minutes: number, volume: number, autoNext: boolean) => {
      const sleep = { endsAt: Date.now() + minutes * 60_000, minutes, volume, autoNext, finished: false }
      stateRef.current = { ...stateRef.current, sleep }
      setState((s) => ({ ...s, sleep }))
      play(storyId)
    },
    [play],
  )

  const endSleep = useCallback(() => {
    narrator.setVolume(1)
    setState((s) => ({ ...s, sleep: undefined }))
  }, [])

  // Timer do modo hora de dormir: fade-out nos últimos segundos e parada automática.
  const sleepEndsAt = state.sleep && !state.sleep.finished ? state.sleep.endsAt : undefined
  useEffect(() => {
    if (!sleepEndsAt) return
    const tick = () => {
      const sleep = stateRef.current.sleep
      if (!sleep) return
      const remaining = (sleep.endsAt - Date.now()) / 1000
      if (remaining <= 0) {
        narrator.stop()
        commitListen()
        setState((s) => ({ ...s, status: 'paused', sleep: s.sleep && { ...s.sleep, finished: true } }))
      } else if (remaining < FADE_SECONDS) {
        narrator.setVolume(sleep.volume * (remaining / FADE_SECONDS))
      }
    }
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [sleepEndsAt, commitListen])

  // Para a narração ao sair da página.
  useEffect(() => () => narrator.stop(), [])

  const api = useMemo<PlayerApi>(
    () => ({ ...state, play, toggle, pause, seek, stop, startSleep, endSleep }),
    [state, play, toggle, pause, seek, stop, startSleep, endSleep],
  )

  return <PlayerContext.Provider value={api}>{children}</PlayerContext.Provider>
}
