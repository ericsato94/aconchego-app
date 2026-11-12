import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { StoryCard } from '../../components/StoryCard'
import { Tour, type TourStep } from '../../components/Tour'
import { firstName } from '../../lib/format'
import { catalog } from '../../services/catalog'
import { useCustomStories } from '../../services/customStories'
import { useApp } from '../../store/appContext'
import { NotificationsPanel } from '../notifications/NotificationsPanel'
import { ContinueCard } from './ContinueCard'
import { CreatePromo } from './CreatePromo'
import { ProgressSummary } from './ProgressSummary'
import { SleepPromo } from './SleepPromo'
import { VoiceHero } from './VoiceHero'
import './home.css'

/** Tour do primeiro acesso (passos sem elemento na tela são pulados). */
const TOUR: TourStep[] = [
  { target: '[data-tour="voice"]', title: 'Comece pela sua voz', text: 'Aqui você grava a sua voz uma vez. Depois, é ela que conta as histórias para o seu filho.' },
  { target: '[data-tour="stories"]', title: 'Escolha uma história', text: 'Toque em uma história e aperte o play. O texto acompanha a narração, parágrafo por parágrafo.' },
  { target: '[data-tour="create"]', title: 'Crie histórias novas', text: 'Conte um tema e a gente escreve uma história só para o seu filho, com ele como personagem.' },
  { target: '[data-tour="nav-moon"]', title: 'Hora de dormir', text: 'Tela escura, volume baixinho e um timer que desliga a história sozinho.' },
  { target: '[data-tour="nav-gear"]', title: 'Seu perfil', text: 'Ajuste a narração, veja o seu plano e encontre ajuda sempre que precisar.' },
]

export default function Home() {
  const { user, data, actions } = useApp()
  const [notifOpen, setNotifOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const tourDone = Boolean(data.settings.tourDoneAt)

  // Primeiro acesso: abre o tour depois que a tela se acomoda.
  useEffect(() => {
    if (tourDone) return
    const timer = window.setTimeout(() => setTourOpen(true), 700)
    return () => window.clearTimeout(timer)
  }, [tourDone])

  const finishTour = () => {
    setTourOpen(false)
    actions.updateSettings({ tourDoneAt: new Date().toISOString() })
  }
  useCustomStories()
  const unread = data.notifications.some((n) => !n.read)

  const inProgress = Object.entries(data.progress)
    .filter(([, p]) => !p.completedAt && p.position > 0)
    .sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))
    .map(([id]) => catalog.byId(id))
    .find((s) => s && catalog.canAccess(s, data.plan))

  const isFree = data.plan === 'free'
  const featured = isFree ? catalog.free() : catalog.all().filter((s) => !inProgress || s.id !== inProgress.id)

  return (
    <div className="container page home">
      <header className="home__header">
        <Link to="/perfil" className="home__greeting">
          <Avatar size={44} seed={user?.name} />
          <span>Olá, {firstName(user?.name ?? '')}!</span>
        </Link>
        <button className="icon-btn" onClick={() => setNotifOpen(true)} aria-label={`Notificações${unread ? ' (novas)' : ''}`}>
          <Icon name="bell" size={26} />
          {unread && <span className="icon-btn__dot" />}
        </button>
      </header>

      <div className="home__grid">
        <div className="home__main">
          <VoiceHero />
          <CreatePromo />

          {inProgress && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Continuar ouvindo</h2>
                <Link to="/historias" className="link-more">
                  Ver todos <Icon name="chevronRight" size={16} />
                </Link>
              </div>
              <ContinueCard story={inProgress} />
            </section>
          )}

          <section className="section" data-tour="stories">
            <div className="section-head">
              <h2 className="section-title">{isFree ? 'Histórias gratuitas' : 'Histórias para hoje'}</h2>
              <Link to="/historias" className="link-more home__more-desktop">
                Ver biblioteca <Icon name="chevronRight" size={16} />
              </Link>
            </div>
            <div className="h-scroll home__stories">
              {featured.map((story) => (
                <StoryCard key={story.id} story={story} favorite={data.favorites.includes(story.id)} />
              ))}
            </div>
          </section>
        </div>

        <aside className="home__aside">
          <SleepPromo />
          <ProgressSummary />
        </aside>
      </div>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      {tourOpen && !tourDone && <Tour steps={TOUR} onDone={finishTour} />}
    </div>
  )
}
