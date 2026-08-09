import type { SVGProps } from 'react'

export type IconName =
  | 'mic'
  | 'mic-off'
  | 'camera'
  | 'camera-off'
  | 'gear'
  | 'wifi'
  | 'wifi-off'
  | 'temp'
  | 'warning'
  | 'power'
  | 'close'
  | 'chevron-down'
  | 'chevron-up'
  | 'spark'
  | 'volume'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

const paths: Record<IconName, React.ReactNode> = {
  mic: (
    <>
      <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </>
  ),
  'mic-off': (
    <>
      <path d="M9 5.7A3 3 0 0 1 15 6v5" />
      <path d="M12 18v3" />
      <path d="M5.5 9.5v1.5a6.5 6.5 0 0 0 9.8 5.6" />
      <path d="M19 10.5a7 7 0 0 1-1.4 4.2" />
      <path d="M3 3l18 18" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="13" height="10" rx="2" />
      <path d="m16 10.5 4-2.5v8l-4-2.5" />
      <circle cx="8.5" cy="12" r="2" />
    </>
  ),
  'camera-off': (
    <>
      <rect x="3" y="7" width="12" height="9" rx="2" />
      <path d="m16 11 5-3v8l-5-3" />
      <path d="M3 3l18 18" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.05a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.05a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 9a15.5 15.5 0 0 1 19 0" />
      <path d="M5.5 12.5a11 11 0 0 1 13 0" />
      <path d="M8.5 16a6.5 6.5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="0.5" />
    </>
  ),
  'wifi-off': (
    <>
      <path d="M2.5 9a15.5 15.5 0 0 1 5.3-2.9" />
      <path d="M9.6 3.9A15.5 15.5 0 0 1 21.5 9" />
      <path d="M5.5 12.5a11 11 0 0 1 4.3-2.3" />
      <path d="M14.4 10.2a11 11 0 0 1 4.1 2.3" />
      <path d="M8.5 16a6.5 6.5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="0.5" />
      <path d="M3 3l18 18" />
    </>
  ),
  temp: (
    <>
      <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" />
      <path d="M12 9v7" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 4.1 2.7 17.5A1.6 1.6 0 0 0 4.1 20h15.8a1.6 1.6 0 0 0 1.4-2.5L13.7 4.1a1.7 1.7 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </>
  ),
  power: (
    <>
      <path d="M12 2v8" />
      <path d="M18.4 6.6a8 8 0 1 1-12.8 0" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-up': <path d="m6 15 6-6 6 6" />,
  spark: (
    <>
      <path d="M12 3c.6 3.4 2.6 5.4 6 6-3.4.6-5.4 2.6-6 6-.6-3.4-2.6-5.4-6-6 3.4-.6 5.4-2.6 6-6Z" />
      <path d="M19 15c.3 1.5 1.2 2.4 2.6 2.7-1.4.3-2.3 1.2-2.6 2.6-.3-1.4-1.2-2.3-2.6-2.6 1.4-.3 2.3-1.2 2.6-2.7Z" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
