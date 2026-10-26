import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { StoryCard } from '../../components/StoryCard'
import { catalog } from '../../services/catalog'
import { useCustomStories } from '../../services/customStories'
import { useApp } from '../../store/appContext'
import './library.css'

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'criadas', label: 'Criadas por mim' },
  { id: 'gratuitas', label: 'Gratuitas' },
  { id: 'favoritas', label: 'Favoritas' },
  { id: 'sono', label: 'Sono' },
  { id: 'idade', label: 'Para a idade' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function Library() {
  const { data, activeChild } = useApp()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('filtro') as FilterId) || 'todas'
  const query = params.get('q') ?? ''
  const { stories: created } = useCustomStories()

  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== fallback) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const stories = useMemo(() => {
    const q = normalize(query.trim())
    return catalog.all().filter((s) => {
      if (q && !normalize(`${s.title} ${s.summary}`).includes(q)) return false
      switch (filter) {
        case 'criadas':
          return s.custom
        case 'gratuitas':
          return s.free && !s.custom
        case 'favoritas':
          return data.favorites.includes(s.id)
        case 'sono':
          return s.tags.includes('sono')
        case 'idade':
          return !activeChild || (activeChild.age >= s.ageRange[0] && activeChild.age <= s.ageRange[1])
        default:
          return true
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `created` muda o resultado de catalog.all()
  }, [filter, query, data.favorites, activeChild, created])

  return (
    <div className="container page">
      <header className="library__head">
        <div>
          <h1 className="page-title">Histórias</h1>
          <p className="page-subtitle">
            {data.plan === 'free'
              ? 'Você tem 3 histórias gratuitas. As com coroa fazem parte dos planos completos.'
              : 'Toda a biblioteca liberada. Boa escolha para hoje!'}
          </p>
        </div>
        <Link to="/progresso" className="btn btn--secondary btn--sm library__progress">
          <Icon name="chart" size={18} />
          Seu progresso
        </Link>
      </header>

      <div className="library__tools">
        <label className="search">
          <Icon name="search" size={20} />
          <span className="sr-only">Buscar histórias</span>
          <input
            className="input search__input"
            type="search"
            placeholder="Buscar histórias…"
            value={query}
            onChange={(e) => setParam('q', e.target.value, '')}
          />
        </label>
        <div className="chips" role="radiogroup" aria-label="Filtrar histórias">
          {FILTERS.filter((f) => f.id !== 'idade' || activeChild).map((f) => (
            <button
              key={f.id}
              className="chip"
              role="radio"
              aria-checked={filter === f.id}
              onClick={() => setParam('filtro', f.id, 'todas')}
            >
              {f.id === 'idade' && activeChild ? `${activeChild.age} anos` : f.label}
            </button>
          ))}
        </div>
      </div>

      {stories.length ? (
        <div className="story-grid">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              locked={!catalog.canAccess(story, data.plan)}
              favorite={data.favorites.includes(story.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={filter === 'favoritas' ? 'star' : filter === 'criadas' ? 'sparkles' : 'search'}
          title={
            filter === 'favoritas' ? 'Nenhuma favorita ainda' : filter === 'criadas' ? 'Nenhuma história criada ainda' : 'Nenhuma história encontrada'
          }
          text={
            filter === 'favoritas'
              ? 'Toque na estrela de uma história para guardá-la aqui.'
              : filter === 'criadas'
                ? 'Conte um tema e a gente escreve uma história só para o seu filho.'
                : 'Tente outra palavra ou limpe os filtros.'
          }
          action={
            filter === 'criadas' ? (
              <Link to="/criar-historia" className="btn btn--primary btn--sm">
                Criar história
              </Link>
            ) : (
              <button className="btn btn--secondary btn--sm" onClick={() => setParams({}, { replace: true })}>
                Ver todas
              </button>
            )
          }
        />
      )}
    </div>
  )
}
