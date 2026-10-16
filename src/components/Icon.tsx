import type { SVGProps } from 'react'

/**
 * Conjunto de ícones do app, no estilo da Iconografia do Branding Book:
 * formas arredondadas, preenchidas na navegação e com traço 2px no restante.
 */
const filled = {
  home: (
    <path d="M10.6 3.5a2.2 2.2 0 0 1 2.8 0l7 5.7c.5.4.8 1 .8 1.7v8.4a2.2 2.2 0 0 1-2.2 2.2h-3.6v-5.2a1.4 1.4 0 0 0-1.4-1.4h-4a1.4 1.4 0 0 0-1.4 1.4v5.2H5a2.2 2.2 0 0 1-2.2-2.2v-8.4c0-.7.3-1.3.8-1.7l7-5.7Z" />
  ),
  books: (
    <path d="M2.5 5.6c0-.6.4-1.1 1-1.2 2.9-.5 5.4 0 7.6 1.5v14c-2.2-1.4-4.7-1.8-7.4-1.4a1 1 0 0 1-1.2-1V5.6Zm19 0c0-.6-.4-1.1-1-1.2-2.9-.5-5.4 0-7.6 1.5v14c2.2-1.4 4.7-1.8 7.4-1.4a1 1 0 0 0 1.2-1V5.6Z" />
  ),
  star: (
    <path d="M11.1 2.9a1 1 0 0 1 1.8 0l2.4 4.9 5.4.8a1 1 0 0 1 .6 1.7l-3.9 3.8.9 5.4a1 1 0 0 1-1.5 1l-4.8-2.5-4.8 2.5a1 1 0 0 1-1.5-1l.9-5.4-3.9-3.8a1 1 0 0 1 .6-1.7l5.4-.8 2.4-4.9Z" />
  ),
  moon: (
    <>
      <path d="M11.4 3.1a.8.8 0 0 0-.9-1A9.9 9.9 0 1 0 21.9 13.5a.8.8 0 0 0-1-.9 7.3 7.3 0 0 1-9.5-9.5Z" />
      <path d="M18 2.5l.6 1.4 1.4.6-1.4.6L18 6.5l-.6-1.4L16 4.5l1.4-.6.6-1.4Z" />
    </>
  ),
  gear: (
    <path
      fillRule="evenodd"
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.47.47 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.48.48 0 0 0-.12-.61l-2.01-1.58ZM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Z"
    />
  ),
  heart: (
    <path d="M12 20.7c-.3 0-.6-.1-.8-.3C5.6 15.7 2.5 12.6 2.5 8.7A5 5 0 0 1 7.6 3.6c1.8 0 3.4.9 4.4 2.3 1-1.4 2.6-2.3 4.4-2.3a5 5 0 0 1 5.1 5.1c0 3.9-3.1 7-8.7 11.7-.2.2-.5.3-.8.3Z" />
  ),
  shield: (
    <path d="M11.2 1.9c.5-.2 1.1-.2 1.6 0l7 2.6c.7.3 1.2 1 1.2 1.7v5.3c0 5-3.4 9.3-8.4 10.6-.4.1-.8.1-1.2 0C6.4 20.8 3 16.5 3 11.5V6.2c0-.7.5-1.4 1.2-1.7l7-2.6Zm.8 6.1-3 3 3 3 3-3-3-3Z" />
  ),
  play: <path d="M8 5.1v13.8a1 1 0 0 0 1.5.9l10.8-6.9a1 1 0 0 0 0-1.7L9.5 4.2A1 1 0 0 0 8 5.1Z" />,
  pause: (
    <>
      <rect x="6" y="4.5" width="4.2" height="15" rx="1.4" />
      <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4" />
    </>
  ),
  mic: (
    <>
      <rect x="8.5" y="2" width="7" height="12.5" rx="3.5" />
      <path d="M5.5 11a1 1 0 0 1 1 1 5.5 5.5 0 0 0 11 0 1 1 0 1 1 2 0 7.5 7.5 0 0 1-6.5 7.4V21h2.5a1 1 0 1 1 0 2h-7a1 1 0 1 1 0-2H11v-1.6A7.5 7.5 0 0 1 4.5 12a1 1 0 0 1 1-1Z" />
    </>
  ),
  crown: (
    <path d="M3 7.8a1 1 0 0 1 1.6-.8l3.6 2.8 3-4.5a1 1 0 0 1 1.6 0l3 4.5L19.4 7a1 1 0 0 1 1.6.8l-1.3 9.6a1.8 1.8 0 0 1-1.8 1.6H6.1a1.8 1.8 0 0 1-1.8-1.6L3 7.8Z" />
  ),
  music: (
    <path d="M20 3.2v11.6a3.2 3.2 0 1 1-2-3V7.6l-8 1.9v7.3a3.2 3.2 0 1 1-2-3V5.9c0-.5.3-.9.8-1l10-2.4c.6-.1 1.2.3 1.2.7Z" />
  ),
  google: (
    <>
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.1L6.4 14Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4 5.6-4Z" />
    </>
  ),
}

const stroked = {
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 4.2 1.4 6.4 2.3 7.4.3.4 0 1-.5 1H4.2c-.5 0-.8-.6-.5-1C4.6 15.4 6 13.2 6 9Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M7.5 13.5h1M11.5 13.5h1M15.5 13.5h1M7.5 16.8h1M11.5 16.8h1" strokeWidth={2.4} />
    </>
  ),
  trash: (
    <>
      <path d="M4 6.5h16M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7" />
      <path d="M6 6.5 7 19c.1 1 .9 1.8 1.9 1.8h6.2c1 0 1.8-.8 1.9-1.8L18 6.5M10 10.5v6M14 10.5v6" />
    </>
  ),
  shieldInfo: (
    <>
      <path d="M12 2.8 19.5 5.6v5.9c0 4.6-3.1 8.6-7.5 9.7-4.4-1.1-7.5-5.1-7.5-9.7V5.6L12 2.8Z" />
      <path d="M12 11v5M12 7.8v.2" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.2-2.5 3.7M12 16.8v.2" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" />
      <path d="M14.5 8 19 12l-4.5 4M19 12H9.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  rewind: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
      <path d="M4 3.5v4h4" />
    </>
  ),
  forward: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5" />
      <path d="M20 3.5v4h-4" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.8 4.2v4.3h-4.3" />
    </>
  ),
  wave: <path d="M2.5 12h2.5l2-5 3 11 3-14 2.5 11 2-5h4" />,
  volume: (
    <>
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" />
      <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  edit: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M5 19.5h14" />
    </>
  ),
  chart: <path d="M4 20h16M7 16.5V12M12 16.5V7M17 16.5v-6" />,
  sparkles: (
    <>
      <path d="M10 3.5 11.6 8 16 9.5 11.6 11 10 15.5 8.4 11 4 9.5 8.4 8 10 3.5Z" />
      <path d="M17.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
}

export type IconName = keyof typeof filled | keyof typeof stroked

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 24, ...rest }: IconProps) {
  const isFilled = name in filled
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke={isFilled ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {isFilled ? filled[name as keyof typeof filled] : stroked[name as keyof typeof stroked]}
    </svg>
  )
}
