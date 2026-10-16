import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { StoryCard } from '../../components/StoryCard'
import { catalog } from '../../services/catalog'
import { useApp } from '../../store/appContext'

export default function Favorites() {
  const { data } = useApp()
  const stories = data.favorites.map((id) => catalog.byId(id)).filter((s) => s !== undefined)

  return (
    <div className="container page">
      <header>
        <h1 className="page-title">Favoritos</h1>
        <p className="page-subtitle">As histórias que mais fazem sucesso na hora de dormir.</p>
      </header>
      {stories.length ? (
        <div className="story-grid">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} locked={!catalog.canAccess(story, data.plan)} favorite />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="star"
          title="Nenhuma favorita ainda"
          text="Toque na estrela de uma história para guardá-la aqui e encontrar rapidinho na hora de dormir."
          action={
            <Link to="/historias" className="btn btn--primary btn--sm">
              Explorar histórias
            </Link>
          }
        />
      )}
    </div>
  )
}
