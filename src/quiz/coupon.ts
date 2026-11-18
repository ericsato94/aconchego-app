import { QUIZ } from './config'

/**
 * Estado do cupom da roleta, guardado no aparelho:
 * - `shownAt`: a roleta já apareceu (não abre de novo sozinha);
 * - `expiresAt`: o cupom foi resgatado e vale na página até esse horário. Depois disso o cupom
 *   some da oferta e os preços voltam ao normal para esta pessoa.
 */
interface CouponState {
  shownAt?: number
  expiresAt?: number
}

const KEY = 'aconchego_coupon'
const C = QUIZ.offer.coupon

function read(): CouponState {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as CouponState
  } catch {
    return {}
  }
}

function write(state: CouponState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* navegação privada: segue só na memória da página */
  }
}

/** Preço com o desconto, no formato "R$ 8,97". */
export function discounted(value: number) {
  const cents = Math.round(value * (100 - C.percent))
  return 'R$ ' + (cents / 100).toFixed(2).replace('.', ',')
}

export const coupon = {
  config: C,
  /** A roleta ainda não apareceu para esta pessoa. */
  shouldShow: () => !read().shownAt,
  markShown: () => write({ ...read(), shownAt: Date.now() }),
  /** Começa os minutos do cupom (no resgate). */
  redeem: () => {
    const expiresAt = Date.now() + C.minutes * 60_000
    write({ ...read(), expiresAt })
    return expiresAt
  },
  /** Horário em que o cupom expira, ou null se não foi resgatado ou já expirou. */
  activeUntil: () => {
    const { expiresAt } = read()
    return expiresAt && expiresAt > Date.now() ? expiresAt : null
  },
}

/** Copia o código; devolve se deu certo (alguns navegadores bloqueiam a área de transferência). */
export async function copyCode() {
  try {
    await navigator.clipboard.writeText(C.code)
    return true
  } catch {
    const field = document.createElement('textarea')
    field.value = C.code
    field.setAttribute('readonly', '')
    field.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(field)
    field.select()
    const ok = document.execCommand('copy')
    field.remove()
    return ok
  }
}
