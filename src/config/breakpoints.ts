/** Espelho dos breakpoints definidos em src/styles/tokens.css. */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const mediaUp = (bp: keyof typeof BREAKPOINTS) => `(min-width: ${BREAKPOINTS[bp]}px)`
