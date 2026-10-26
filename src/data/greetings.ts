/** Frases curtas narradas com a voz clonada (teste e boas-vindas). Compartilhadas entre app e servidor. */
export type GreetingKind = 'hero' | 'test'

/** Nome de criança aceito nas frases (letras, espaço, hífen e apóstrofo). */
export const isChildName = (name: string) => /^[\p{L}][\p{L} '-]{0,29}$/u.test(name)

export function greetingText(kind: GreetingKind, childName?: string) {
  const name = childName && isChildName(childName) ? `, ${childName}` : ''
  return kind === 'hero'
    ? `Oi${name}! Esta é a minha voz. Hoje à noite, eu vou te contar uma história.`
    : `Oi${name}! Sou eu. A partir de hoje, vou contar histórias para você todas as noites.`
}
