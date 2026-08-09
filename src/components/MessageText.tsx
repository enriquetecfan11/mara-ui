import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMaraStore } from '@/store/maraStore'

const MESSAGE_VISIBLE_MS = 9000

/** Respuesta temporal de Mara. Se oculta automáticamente. */
export function MessageText() {
  const message = useMaraStore((s) => s.message)
  const clearMessage = useMaraStore((s) => s.clearMessage)

  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(clearMessage, MESSAGE_VISIBLE_MS)
    return () => window.clearTimeout(id)
  }, [message, clearMessage])

  return (
    <div className="flex h-[3.5rem] items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {message ? (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-[26rem] text-center text-base leading-snug text-ink/85 sm:max-w-[30rem]"
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
