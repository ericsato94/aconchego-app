import './Clouds.css'

/** Nuvens decorativas no estilo da marca ("cenários simples e lúdicos"). */
export function Clouds({ variant = 'sky' }: { variant?: 'sky' | 'night' }) {
  return (
    <div className={`clouds clouds--${variant}`} aria-hidden="true">
      <span className="cloud cloud--1" />
      <span className="cloud cloud--2" />
      <span className="cloud cloud--3" />
      <span className="cloud cloud--4" />
    </div>
  )
}
