import { useEffect, useState, type FormEvent } from 'react'
import logo from '../../assets/logo.webp'
import { Icon } from '../../components/Icon'
import { QUESTIONS } from '../../quiz/config'
import { DailyChart } from './DailyChart'
import { adminApi, fmtInt, fmtMoney, fmtPct, pct, Unauthorized, type Metrics } from './metrics'
import './admin.css'

const PERIODS = [7, 30, 90] as const
const SERIES = [
  { key: 'started', label: 'Iniciaram' },
  { key: 'completed', label: 'Concluíram' },
  { key: 'leads', label: 'Cadastros' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'purchases', label: 'Compras' },
] as const

export default function AdminPage() {
  const [auth, setAuth] = useState<'checking' | 'out' | 'in'>('checking')

  useEffect(() => {
    document.title = 'Painel do quiz · Aconchego'
    adminApi.session().then((ok) => setAuth(ok ? 'in' : 'out')).catch(() => setAuth('out'))
  }, [])

  if (auth === 'checking') return <div className="admin admin--center" aria-busy="true" />
  if (auth === 'out') return <AdminLogin onDone={() => setAuth('in')} />
  return <Dashboard onLogout={() => setAuth('out')} />
}

function AdminLogin({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await adminApi.login(username, password)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
      setBusy(false)
    }
  }

  return (
    <div className="admin admin--center">
      <form className="admin-login card" onSubmit={submit}>
        <img src={logo} alt="Aconchego" className="admin-login__logo" />
        <h1 className="admin__title">Painel do quiz</h1>
        <p className="muted">Acesso restrito à equipe.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <label className="field">
          <span className="field__label">Usuário</span>
          <input className="input" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Senha</span>
          <input
            className="input"
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30)
  const [series, setSeries] = useState<(typeof SERIES)[number]['key']>('started')
  const [asTable, setAsTable] = useState(false)
  const [data, setData] = useState<Metrics | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let alive = true
    adminApi
      .metrics(days)
      .then((m) => {
        if (!alive) return
        setData(m)
        setError('')
      })
      .catch((err) => {
        if (!alive) return
        if (err instanceof Unauthorized) onLogout()
        else setError(err.message)
      })
    return () => {
      alive = false
    }
  }, [days, reloadKey, onLogout])

  const logout = async () => {
    await adminApi.logout().catch(() => undefined)
    onLogout()
  }

  const f = data?.funnel
  const funnel = f
    ? [
        { label: 'Iniciaram o quiz', value: f.started },
        { label: 'Concluíram o quiz', value: f.completed },
        { label: 'Cadastraram', value: f.leads },
        { label: 'Chegaram nas vendas', value: f.sales },
        { label: 'Iniciaram checkout', value: f.checkout },
        { label: 'Compraram', value: f.purchases },
      ]
    : []
  const seriesLabel = SERIES.find((s) => s.key === series)!.label

  return (
    <div className="admin">
      <header className="admin__header">
        <div className="admin__brand">
          <img src={logo} alt="" />
          <h1 className="admin__title">Painel do quiz</h1>
        </div>
        <div className="admin__filters">
          <div className="admin__seg" role="radiogroup" aria-label="Período">
            {PERIODS.map((p) => (
              <button key={p} role="radio" aria-checked={days === p} className="chip" onClick={() => setDays(p)}>
                {p} dias
              </button>
            ))}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setReloadKey((k) => k + 1)} aria-label="Atualizar">
            <Icon name="refresh" size={18} />
          </button>
          <button className="btn btn--secondary btn--sm" onClick={logout}>
            <Icon name="logout" size={18} /> Sair
          </button>
        </div>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!data ? (
        !error && <p className="muted admin__loading">Carregando métricas…</p>
      ) : (
        <main className="admin__grid">
          <section className="admin__kpis" aria-label="Resumo">
            <Kpi label="Iniciaram" value={fmtInt(data.funnel.started)} />
            <Kpi label="Concluíram" value={fmtInt(data.funnel.completed)} hint={fmtPct(pct(data.funnel.completed, data.funnel.started))} />
            <Kpi label="Cadastros" value={fmtInt(data.funnel.leads)} hint={fmtPct(pct(data.funnel.leads, data.funnel.started))} />
            <Kpi label="Compras" value={fmtInt(data.funnel.purchases)} hint={fmtPct(pct(data.funnel.purchases, data.funnel.started))} />
            <Kpi label="Receita" value={fmtMoney(Number(data.funnel.revenue))} />
          </section>

          <section className="admin-card admin__funnel">
            <h2 className="admin-card__title">Funil</h2>
            <p className="admin-card__sub">Pessoas em cada etapa e quantas passam para a seguinte</p>
            <ol className="funnel" role="list">
              {funnel.map((stage, i) => {
                const prev = i > 0 ? funnel[i - 1].value : null
                return (
                  <li key={stage.label} className="funnel__row">
                    <span className="funnel__label">{stage.label}</span>
                    <span className="funnel__track">
                      <span className="funnel__bar" style={{ width: `${pct(stage.value, funnel[0].value || 1)}%` }} />
                    </span>
                    <span className="funnel__value">{fmtInt(stage.value)}</span>
                    {prev !== null && (
                      <span className="funnel__step" title="Passagem da etapa anterior">
                        <Icon name="chevronDown" size={14} /> {fmtPct(pct(stage.value, prev))} da etapa anterior
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="admin-card admin__daily">
            <div className="admin-card__head">
              <div>
                <h2 className="admin-card__title">{seriesLabel} por dia</h2>
                <p className="admin-card__sub">Últimos {days} dias</p>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => setAsTable((v) => !v)}>
                {asTable ? 'Ver gráfico' : 'Ver tabela'}
              </button>
            </div>
            <div className="admin__seg admin__seg--wrap" role="radiogroup" aria-label="Métrica do gráfico">
              {SERIES.map((s) => (
                <button key={s.key} role="radio" aria-checked={series === s.key} className="chip" onClick={() => setSeries(s.key)}>
                  {s.label}
                </button>
              ))}
            </div>
            {asTable ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      {SERIES.map((s) => (
                        <th key={s.key}>{s.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.daily].reverse().map((d) => (
                      <tr key={d.day}>
                        <td>{d.day.split('-').reverse().join('/')}</td>
                        {SERIES.map((s) => (
                          <td key={s.key}>{fmtInt(d[s.key])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <DailyChart points={data.daily.map((d) => ({ day: d.day, value: d[series] }))} label={seriesLabel} />
            )}
          </section>

          <section className="admin-card admin__steps">
            <h2 className="admin-card__title">Onde as pessoas desistem</h2>
            <p className="admin-card__sub">Quantas responderam cada pergunta (base: quem iniciou)</p>
            <ol className="funnel funnel--compact" role="list">
              {QUESTIONS.map((q, i) => {
                const answered = data.steps.find((s) => s.questionId === q.id)?.sessions ?? 0
                const before = i === 0 ? data.funnel.started : (data.steps.find((s) => s.questionId === QUESTIONS[i - 1].id)?.sessions ?? 0)
                const lost = Math.max(0, before - answered)
                return (
                  <li key={q.id} className="funnel__row">
                    <span className="funnel__label">
                      <strong>P{i + 1}</strong> {q.title}
                    </span>
                    <span className="funnel__track">
                      <span className="funnel__bar" style={{ width: `${pct(answered, data.funnel.started || 1)}%` }} />
                    </span>
                    <span className="funnel__value">{fmtInt(answered)}</span>
                    <span className={`funnel__step${lost > 0 ? ' is-loss' : ''}`}>
                      {lost > 0 ? `${fmtInt(lost)} desistiram aqui (${fmtPct(pct(lost, before))})` : 'Sem desistências'}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="admin-card admin__sources">
            <h2 className="admin-card__title">Origem do tráfego</h2>
            <p className="admin-card__sub">Pelo parâmetro utm_source ou pelo site de origem</p>
            {data.sources.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Origem</th>
                      <th>Iniciaram</th>
                      <th>Cadastros</th>
                      <th>Compras</th>
                      <th>Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sources.map((s) => (
                      <tr key={s.source}>
                        <td>{s.source}</td>
                        <td>{fmtInt(s.sessions)}</td>
                        <td>{fmtInt(s.leads)}</td>
                        <td>{fmtInt(s.purchases)}</td>
                        <td>{fmtPct(pct(s.purchases, s.sessions))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">Ainda sem visitas no período.</p>
            )}
          </section>

          <section className="admin-card admin__answers">
            <h2 className="admin-card__title">Respostas por pergunta</h2>
            <div className="answers">
              {QUESTIONS.map((q, i) => {
                const rows = q.options.map((o) => ({
                  label: o.label,
                  value: data.answers.find((a) => a.questionId === q.id && a.answer === o.id)?.sessions ?? 0,
                }))
                const total = rows.reduce((n, r) => n + r.value, 0)
                return (
                  <div key={q.id} className="answers__q">
                    <h3>
                      <strong>P{i + 1}</strong> {q.title}
                    </h3>
                    <ul role="list">
                      {rows.map((r) => (
                        <li key={r.label}>
                          <span className="answers__label">{r.label}</span>
                          <span className="funnel__track">
                            <span className="funnel__bar" style={{ width: `${pct(r.value, total || 1)}%` }} />
                          </span>
                          <span className="answers__value">
                            {fmtInt(r.value)} · {fmtPct(pct(r.value, total))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kpi">
      <span className="kpi__label">{label}</span>
      <strong className="kpi__value">{value}</strong>
      {hint && <span className="kpi__hint">{hint} de quem iniciou</span>}
    </div>
  )
}
