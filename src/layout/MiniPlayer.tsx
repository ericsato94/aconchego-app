import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { StoryCover } from '../components/StoryCover'
import { catalog } from '../services/catalog'
import { usePlayer } from '../store/playerContext'
import './MiniPlayer.css'

/** Mantém a história tocando visível enquanto o usuário navega pelo app. */
export function MiniPlayer() {
  const player = usePlayer()
  const { pathname } = useLocation()
  const story = player.storyId ? catalog.byId(player.storyId) : undefined
  if (!story || player.status === 'idle' || player.sleep || pathname === `/historias/${story.id}`) return null
  const pct = player.total ? ((player.position + (player.status === 'playing' ? 0.5 : 0)) / player.total) * 100 : 0

  return (
    <div className="mini-player" role="region" aria-label="Reprodução atual">
      <Link to={`/historias/${story.id}`} className="mini-player__info">
        <StoryCover story={story} className="mini-player__cover" />
        <span className="mini-player__text">
          <strong>{story.title}</strong>
          <small>{player.loading ? 'Preparando a narração…' : player.status === 'playing' ? 'Tocando agora' : 'Pausada'}</small>
        </span>
      </Link>
      <button className="play-btn" onClick={player.toggle} aria-label={player.status === 'playing' ? 'Pausar' : 'Continuar'}>
        <Icon name={player.status === 'playing' ? 'pause' : 'play'} size={18} />
      </button>
      <button className="icon-btn mini-player__close" onClick={player.stop} aria-label="Fechar player">
        <Icon name="close" size={20} />
      </button>
      <span className="mini-player__progress" style={{ width: `${pct}%` }} />
    </div>
  )
}
