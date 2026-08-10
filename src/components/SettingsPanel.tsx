import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from '@/store/settingsStore'
import { useMaraStore } from '@/store/maraStore'
import { sendCommand } from '@/services/maraConnection'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { Icon } from '@/components/ui/Icon'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  micActive: boolean
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-dim">{label}</span>
      {children}
    </div>
  )
}

export function SettingsPanel({ open, onClose, micActive }: SettingsPanelProps) {
  const settings = useSettingsStore()
  const device = useMaraStore((s) => s.device)
  const connected = useMaraStore((s) => s.connected)

  const set = settings.set

  const sendSettings = (patch: Partial<typeof settings>) => {
    set(patch)
    sendCommand({ type: 'mara:settings', data: patch })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/50" onPointerDown={onClose} />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 400) onClose()
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-line bg-panel/95 px-6 pb-8 pt-3 shadow-[0_-16px_48px_rgba(0,0,0,0.55)] backdrop-blur"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium tracking-wide text-ink">Ajustes</h2>
              <button type="button" className="p-1 text-faint active:text-dim" onClick={onClose} aria-label="Cerrar ajustes">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Slider
                label="Volumen"
                value={settings.volume}
                onChange={(v) => set({ volume: v })}
                onCommit={(v) => sendSettings({ volume: v })}
              />
              <Slider
                label="Brillo"
                value={settings.brightness}
                onChange={(v) => set({ brightness: v })}
                onCommit={(v) => sendSettings({ brightness: v })}
              />

              <div className="h-px bg-line" />

              <Row label="Micrófono">
                <Toggle checked={settings.microphone} onChange={(v) => sendSettings({ microphone: v })} label="Micrófono" />
              </Row>
              <Row label="Cámara">
                <Toggle checked={settings.camera} onChange={(v) => sendSettings({ camera: v })} label="Cámara" />
              </Row>
              <Row label="Wake word">
                <Toggle checked={settings.wakeWord} onChange={(v) => sendSettings({ wakeWord: v })} label="Wake word" />
              </Row>

              <div className="h-px bg-line" />

              <div>
                <Row label="Micrófono del navegador">
                  <Toggle
                    checked={settings.browserMic}
                    onChange={(v) => set({ browserMic: v })}
                    label="Mic del navegador"
                  />
                </Row>
                <p className="-mt-1 pb-1 text-[11px] leading-relaxed text-faint">
                  Captura el audio del PC para probar voz sin Mara OS. Requiere
                  localhost o HTTPS.
                </p>
                {settings.browserMic && (
                  <p className="flex items-center gap-2 pb-1 text-[11px] text-dim" data-mic-status>
                    <span className={`h-2 w-2 rounded-full ${micActive ? 'animate-pulse bg-[#7dd3a0]' : 'bg-faint'}`} />
                    {micActive ? 'Capturando audio (16 kHz)…' : 'Activando micrófono…'}
                  </p>
                )}
              </div>

              <div className="h-px bg-line" />

              <Row label="Estado de Mara OS">
                <span className="flex items-center gap-2 text-xs text-dim">
                  <span className="h-2 w-2 rounded-full" style={{ background: connected ? '#7dd3a0' : '#5a6675', boxShadow: connected ? '0 0 6px rgba(125,211,160,0.9)' : 'none' }} />
                  {connected ? 'Conectado' : 'Desconectado'}
                  {device.temperature != null && device.temperature > 0 ? ` · ${Math.round(device.temperature)}°` : ''}
                </span>
              </Row>

              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-dim transition-colors active:bg-panel active:text-ink"
                onClick={() => window.location.reload()}
              >
                <Icon name="power" size={16} />
                Reiniciar interfaz
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}