import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from '@/store/settingsStore'
import { sendCommand } from '@/services/maraConnection'
import { Icon, type IconName } from '@/components/ui/Icon'

interface MenuProps {
  open: boolean
  onClose: () => void
  onOpenSettings: () => void
}

interface ItemProps {
  icon: IconName
  label: string
  active?: boolean
  activeLabel?: string
  onTap: () => void
}

function Item({ icon, label, active, activeLabel, onTap }: ItemProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-dim transition-colors active:bg-panel"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onTap}
    >
      <Icon name={icon} size={18} className={active ? 'text-accent' : 'text-faint'} />
      <span className="flex-1">{label}</span>
      <span className="text-xs text-faint">{activeLabel}</span>
    </button>
  )
}

/** Mini menú abierto al mantener pulsado el orb. */
export function Menu({ open, onClose, onOpenSettings }: MenuProps) {
  const microphone = useSettingsStore((s) => s.microphone)
  const wakeWord = useSettingsStore((s) => s.wakeWord)
  const set = useSettingsStore((s) => s.set)

  const toggleMic = () => {
    const next = !microphone
    set({ microphone: next })
    sendCommand({ type: 'mara:settings', data: { microphone: next } })
    onClose()
  }

  const toggleWakeWord = () => {
    const next = !wakeWord
    set({ wakeWord: next })
    sendCommand({ type: 'mara:settings', data: { wakeWord: next } })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 flex items-start justify-center pt-[38vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0" onPointerDown={onClose} />
          <motion.div
            initial={{ scale: 0.92, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="relative w-64 overflow-hidden rounded-2xl border border-line bg-panel/90 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur"
          >
            <Item
              icon="spark"
              label="Wake word"
              active={wakeWord}
              activeLabel={wakeWord ? 'Activo' : 'Apagado'}
              onTap={toggleWakeWord}
            />
            <Item
              icon={microphone ? 'mic' : 'mic-off'}
              label="Micrófono"
              active={microphone}
              activeLabel={microphone ? 'Activo' : 'Mudo'}
              onTap={toggleMic}
            />
            <Item icon="gear" label="Ajustes" onTap={() => { onClose(); onOpenSettings() }} />
            <Item icon="power" label="Reiniciar interfaz" onTap={() => window.location.reload()} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
