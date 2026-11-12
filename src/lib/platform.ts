/** Detecção de aparelho e navegador para o convite de instalação (PWA). */
const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent)

export const isIOS = () => /iPhone|iPad|iPod/i.test(ua()) || (/Macintosh/.test(ua()) && navigator.maxTouchPoints > 1)
export const isAndroid = () => /Android/i.test(ua())
export const isMobile = () => isIOS() || isAndroid()

/** Navegador embutido de apps (Instagram, Facebook, TikTok…): por ali não dá para instalar. */
export const inAppBrowser = (): 'instagram' | 'facebook' | 'tiktok' | 'outro' | null => {
  const u = ua()
  if (/Instagram/i.test(u)) return 'instagram'
  if (/FBAN|FBAV|FB_IAB|FBIOS|Messenger/i.test(u)) return 'facebook'
  if (/musical_ly|TikTok|BytedanceWebview/i.test(u)) return 'tiktok'
  if (/; wv\)|Line\/|Snapchat|Pinterest|GSA\//i.test(u)) return 'outro'
  return null
}

/** Já está aberto como app instalado. */
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

/** Link que tenta abrir a página atual no navegador do aparelho (sai do navegador do Instagram). */
export function externalBrowserUrl(path = window.location.pathname + window.location.search) {
  const url = `${window.location.host}${path}`
  if (isAndroid()) return `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`
  if (isIOS()) return `x-safari-https://${url}`
  return `https://${url}`
}
