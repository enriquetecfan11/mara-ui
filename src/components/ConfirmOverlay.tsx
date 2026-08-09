import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMaraStore } from '@/store/maraStore'
import { sendCommand } from '@/services/maraConnection'

/**
 * Overlay de confirmación para acciones críticas.
 * Compatible con teclado físico: Enter = aceptar, . = cancelar.
 * La UI solo devuelve la decisión a Mara OS; no ejecuta la acción.
 */
export function ConfirmOverlay() {
  const confirm = useMaraStore((s) => s.confirm)
  const resolveConfirm = useMaraStore((s) => s.resolveConfirm)

  useEffect(() => {
    if (!confirm) return

    const accept = () => {
      sendCommand({ type: 'mara:confirm-response', data: { id: confirm.id, accepted: true } })
      resolveConfirm()
    }
    const cancel = () => {
      sendCommand({ type: 'mara:confirm-response', data: { id: confirm.id, accepted: false } })
      resolveConfirm()
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        accept()
      } else if (event.key === '.' || event.key === 'Decimal') {
        event.preventDefault()
        cancel()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm, resolveConfirm])

  const accept = () => {
    if (!confirm) return
    sendCommand({ type: 'mara:confirm-response', data: { id: confirm.id, accepted: true } })
    resolveConfirm()
  }
  const cancel = () => {
    if (!confirm) return
    sendCommand({ type: 'mara:confirm-response', data: { id: confirm.id, accepted: false } })
    resolveConfirm()
  }

  return (
    <AnimatePresence>
      {confirm && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/60" onPointerDown={cancel} />

          <motion.div
            initial={{ scale: 0.94, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="relative w-full max-w-sm rounded-2xl border border-line bg-panel/95 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80">Acción crítica</p>
            <h2 className="mt-2 text-lg font-medium text-ink">{confirm.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-dim">{confirm.message}</p>

            <p className="mt-5 text-center text-[11px] tracking-[0.15em] text-faint">
              ENTER · Aceptar&ensp;&ensp;&ensp;. · Cancelar
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-xl border border-line px-4 py-3 text-sm text-dim transition-colors active:bg-panel active:text-ink"
                onClick={cancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-200 transition-colors active:bg-amber-300/20"
                onClick={accept}
              >
                Aceptar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
