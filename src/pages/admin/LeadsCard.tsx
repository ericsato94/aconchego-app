import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { QUESTIONS } from '../../quiz/config'
import { adminApi, Unauthorized, type Lead, type LeadStage } from './metrics'

const STAGE_LABEL: Record<LeadStage, string> = {
  lead_submitted: 'Cadastrou',
  result_viewed: 'Viu o resultado',
  sales_viewed: 'Viu a oferta',
  offer_engaged: 'Viu os planos',
  checkout_started: 'Foi ao checkout',
  purchase: 'Comprou',
}

/** Rótulo da resposta (ex.: dor "avos" → "Os avós moram longe…"). */
function answerLabel(questionId: string, answer: string | undefined) {
  if (!answer) return '—'
  return QUESTIONS.find((q) => q.id === questionId)?.options.find((o) => o.id === answer)?.label ?? answer
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Número no formato do WhatsApp (com 55 do Brasil quando faltar). */
function waNumber(raw: string) {
  const digits = raw.replace(/\D/g, '')
  return digits.length <= 11 ? `55${digits}` : digits
}

function waLink(lead: Lead) {
  const first = lead.name.trim().split(/\s+/)[0]
  const text = `Oi, ${first}! Aqui é do Aconchego 💛 Vi que você fez o nosso quiz. Posso te ajudar com alguma dúvida?`
  return `https://wa.me/${waNumber(lead.whatsapp!)}?text=${encodeURIComponent(text)}`
}

function exportCsv(leads: Lead[]) {
  const head = ['Data', 'Nome', 'WhatsApp', 'E-mail', 'Aceitou contato', 'Etapa', 'Origem', 'Campanha', 'Dor', 'Objeção', 'Investimento', 'Idade']
  const rows = leads.map((l) => [
    fmtDate(l.createdAt),
    l.name,
    l.whatsapp ?? '',
    l.email ?? '',
    l.consent ? 'sim' : 'não',
    STAGE_LABEL[l.stage],
    l.source,
    l.campaign ?? '',
    answerLabel('dor', l.answers?.dor),
    answerLabel('objecao', l.answers?.objecao),
    answerLabel('investimento', l.answers?.investimento),
    answerLabel('idade', l.answers?.idade),
  ])
  const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-aconchego-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Quem deixou nome e contato no quiz, com origem, até onde chegou e atalho para o WhatsApp. */
export function LeadsCard({ days, reloadKey, onLogout }: { days: number; reloadKey: number; onLogout: () => void }) {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState('')
  const [onlyHot, setOnlyHot] = useState(false)

  useEffect(() => {
    let alive = true
    adminApi
      .leads(days)
      .then((list) => alive && (setLeads(list), setError('')))
      .catch((err) => {
        if (!alive) return
        if (err instanceof Unauthorized) onLogout()
        else setError(err.message)
      })
    return () => {
      alive = false
    }
  }, [days, reloadKey, onLogout])

  // "Quentes": viram a oferta (ou mais) e não compraram — os melhores para chamar.
  const shown = (leads ?? []).filter((l) => !onlyHot || (l.stage !== 'purchase' && ['sales_viewed', 'offer_engaged', 'checkout_started'].includes(l.stage)))

  return (
    <section className="admin-card admin__leads">
      <div className="admin__leads-head">
        <div>
          <h2 className="admin-card__title">Leads</h2>
          <p className="admin-card__sub">Quem deixou nome e contato no quiz. Só chame no WhatsApp quem aceitou receber contato.</p>
        </div>
        <div className="admin__leads-tools">
          <label className="admin__leads-filter">
            <input type="checkbox" checked={onlyHot} onChange={(e) => setOnlyHot(e.target.checked)} />
            Só quem viu a oferta e não comprou
          </label>
          <button className="btn btn--secondary btn--sm" onClick={() => leads && exportCsv(shown)} disabled={!shown.length}>
            <Icon name="download" size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {error ? (
        <p className="form-error">{error}</p>
      ) : !leads ? (
        <p className="muted">Carregando…</p>
      ) : !shown.length ? (
        <p className="muted">Nenhum lead no período.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table admin__leads-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Contato</th>
                <th>Etapa</th>
                <th>Origem</th>
                <th>Dor</th>
                <th>Objeção</th>
                <th>Investimento</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.id}>
                  <td>{fmtDate(l.createdAt)}</td>
                  <td>
                    <strong>{l.name}</strong>
                  </td>
                  <td>
                    {l.whatsapp && <div>{l.whatsapp}</div>}
                    {l.email && <div className="muted">{l.email}</div>}
                    {!l.consent && <small className="admin__leads-noconsent">não aceitou contato</small>}
                  </td>
                  <td>
                    <span className={`admin__stage admin__stage--${l.stage}`}>{STAGE_LABEL[l.stage]}</span>
                  </td>
                  <td title={l.campaign ?? undefined}>{l.source}</td>
                  <td>{answerLabel('dor', l.answers?.dor)}</td>
                  <td>{answerLabel('objecao', l.answers?.objecao)}</td>
                  <td>{answerLabel('investimento', l.answers?.investimento)}</td>
                  <td>
                    {l.consent && l.whatsapp && (
                      <a className="btn btn--sun btn--sm" href={waLink(l)} target="_blank" rel="noreferrer">
                        WhatsApp
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
