import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { StoryCard } from '../../components/StoryCard'
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

export default function Home() {
  const { user, data } = useApp()
  const [notifOpen, setNotifOpen] = useState(false)
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

          <section className="section">
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
    </div>
  )
}
