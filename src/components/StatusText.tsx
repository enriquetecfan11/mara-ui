import { AnimatePresence, motion } from 'framer-motion'
import type { MaraState } from '@/types/mara'

const LABELS: Record<MaraState, string> = {
  idle: 'Esperando...',
  listening: 'Escuchando...',
  thinking: 'Pensando...',
  speaking: 'RESPONDIENDO...',
  seeing: 'Observando...',
  error: 'Hay un problema',
  offline: 'Sin conexión',
}

const stateClass: Record<MaraState, string> = {
  idle: 'text-dim',
  listening: 'text-ink',
  thinking: 'text-ink',
  speaking: 'text-ink',
  seeing: 'text-ink',
  error: 'text-amber-300/90',
  offline: 'text-faint',
}

export function StatusText({ state }: { state: MaraState }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={state}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`text-sm tracking-[0.25em] uppercase short:text-[13px] short:tracking-[0.2em] ${stateClass[state]}`}
      >
        {LABELS[state]}
      </motion.p>
    </AnimatePresence>
  )
}
