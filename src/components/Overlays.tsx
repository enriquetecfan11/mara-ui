import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMaraStore } from '@/store/maraStore'
import type { OverlayData } from '@/types/mara'
import { Icon, type IconName } from '@/components/ui/Icon'

function VolumeContent({ overlay }: { overlay: OverlayData }) {
  const value = overlay.value ?? 0
  return (
    <div className="flex w-40 flex-col items-center gap-3">
      <span className="text-sm tracking-wide text-ink">{overlay.title}</span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-accent/80"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        />
      </div>
      <span className="text-xs text-dim tabular-nums">{value}</span>
    </div>
  )
}

function NumpadContent({ overlay }: { overlay: OverlayData }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-4xl font-light leading-none text-ink tabular-nums">{overlay.title}</span>
      {overlay.subtitle ? (
        <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-faint">{overlay.subtitle}</span>
      ) : null}
    </div>
  )
}

function OverlayContent({ overlay }: { overlay: OverlayData }) {
  if (overlay.kind === 'volume') return <VolumeContent overlay={overlay} />
  if (overlay.kind === 'numpad') return <NumpadContent overlay={overlay} />

  const icon = overlay.icon ? (
    <Icon name={overlay.icon as IconName} size={20} className={overlay.kind === 'error' ? 'text-amber-300' : 'text-accent'} />
  ) : null

  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex flex-col">
        <span className="text-sm tracking-wide text-ink">{overlay.title}</span>
        {overlay.subtitle ? <span className="text-xs text-dim">{overlay.subtitle}</span> : null}
      </div>
    </div>
  )
}

function OverlayItem({ overlay, onDone }: { overlay: OverlayData; onDone: () => void }) {
  useEffect(() => {
    if (overlay.ttl <= 0) return
    const id = window.setTimeout(onDone, overlay.ttl)
    return () => window.clearTimeout(id)
  }, [overlay.id, overlay.ttl, onDone])

  const isNetwork = overlay.kind === 'network'

  return (
    <motion.div
      data-overlay={overlay.kind}
      initial={{ opacity: 0, y: isNetwork ? 14 : -6, scale: isNetwork ? 0.98 : 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isNetwork ? 8 : -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className={
        isNetwork
          ? 'pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full border border-line bg-panel/90 px-5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur'
          : 'pointer-events-none rounded-2xl border border-line/80 bg-panel/90 px-5 py-3.5 shadow-[0_10px_36px_rgba(0,0,0,0.55)] backdrop-blur'
      }
    >
      <OverlayContent overlay={overlay} />
    </motion.div>
  )
}

/** Overlays temporales (volumen, mute, cámara, red, numpad, error). */
export function Overlays() {
  const overlays = useMaraStore((s) => s.overlays)
  const popOverlay = useMaraStore((s) => s.popOverlay)

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center gap-3 pt-[14vh]">
      <AnimatePresence>
        {overlays.map((overlay) => (
          <OverlayItem
            key={overlay.id}
            overlay={overlay}
            onDone={() => popOverlay(overlay.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
