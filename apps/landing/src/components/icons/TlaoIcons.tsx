import { type SVGProps } from 'react'

/**
 * TLÁO Xi (Ξ) Symbol Icon
 * Three horizontal rounded bars representing the Greek Xi letter.
 * Styled with rounded corners, proper spacing, glow effect, and dot accent.
 */
export function TlaoXiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dot accent above */}
      <circle cx="32" cy="6" r="3.5" fill="currentColor" filter="url(#glow)" />

      {/* Xi (Ξ) bars - thinner with proper spacing */}
      <rect x="14" y="16" width="36" height="5" rx="2.5" fill="currentColor" filter="url(#glow)" />
      <rect
        x="14"
        y="29.5"
        width="36"
        height="5"
        rx="2.5"
        fill="currentColor"
        filter="url(#glow)"
      />
      <rect x="14" y="43" width="36" height="5" rx="2.5" fill="currentColor" filter="url(#glow)" />
    </svg>
  )
}

/**
 * TLÁO Á Accent Icon
 * Circle with a stylized letter Á inside.
 */
export function TlaoAIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" />
      {/* Letter A */}
      <path d="M32 18L20 46h5l2.5-6h9l2.5 6h5L32 18Z" fill="currentColor" />
      {/* A crossbar cutout */}
      <path
        d="M29 36l3-7.5 3 7.5H29Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0"
        className="fill-background"
      />
      {/* Accent mark (´) */}
      <line
        x1="35"
        y1="10"
        x2="31"
        y2="16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
