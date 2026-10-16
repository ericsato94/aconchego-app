import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Novas páginas abrem no topo; ao voltar, o navegador restaura a posição. */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const type = useNavigationType()
  useEffect(() => {
    if (type !== 'POP') window.scrollTo(0, 0)
  }, [pathname, type])
  return null
}
