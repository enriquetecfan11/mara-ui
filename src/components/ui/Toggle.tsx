import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="flex h-7 w-12 shrink-0 items-center rounded-full border border-line bg-panel px-0.5 transition-colors duration-200 active:scale-95"
      style={{ justifyContent: checked ? 'flex-end' : 'flex-start' }}
      onClick={() => onChange(!checked)}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        className="block h-6 w-6 rounded-full shadow-[0_0_8px_rgba(124,199,255,0.35)]"
        style={{
          background: checked
            ? 'linear-gradient(135deg, #8ec9ff, #2f5f96)'
            : 'linear-gradient(135deg, #3a4654, #232c38)',
        }}
      />
    </button>
  )
}
