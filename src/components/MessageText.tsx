import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMaraStore } from '@/store/maraStore'
import type { MaraState } from '@/types/mara'

const MESSAGE_FULL_MS = 9000
const MESSAGE_DIM_MS = 4000
const MESSAGE_DIM_OPACITY = 0.35

/**
 * Respuesta de Mara bajo el orb.
 *
 * - Mientras `speaking`, se mantiene a opacidad completa (no se auto-oculta).
 * - Al volver de `speaking` a `idle`, baja a opacidad reducida durante unos
 *   segundos y luego se desvanece con el fade de AnimatePresence.
 * - Respuestas sin voz (sin TTS) conservan el auto-ocultado clásico.
 */
export function MessageText() {
  const message = useMaraStore((s) => s.message)
  const clearMessage = useMaraStore((s) => s.clearMessage)
  const state = useMaraStore((s) => s.state)

  const [dimmed, setDimmed] = useState(false)
  const prevState = useRef<MaraState>(state)

  useEffect(() => {
    const prev = prevState.current
    prevState.current = state
    if (prev === 'speaking' && state === 'idle' && message) {
      setDimmed(true)
    }
  }, [state, message])

  useEffect(() => {
    setDimmed(false)
  }, [message])

  useEffect(() => {
    if (!message) {
      setDimmed(false)
      return
    }
    if (state === 'speaking') {
      setDimmed(false)
      return
    }
    const id = window.setTimeout(clearMessage, dimmed ? MESSAGE_DIM_MS : MESSAGE_FULL_MS)
    return () => window.clearTimeout(id)
  }, [message, state, dimmed, clearMessage])

  return (
    <div className="flex h-[3.5rem] items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {message ? (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: dimmed ? MESSAGE_DIM_OPACITY : 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-[26rem] text-center text-base leading-snug text-ink/85 sm:max-w-[30rem] short:max-w-[22rem] short:text-[13px]"
          >
            {message}
          </motion.p>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
