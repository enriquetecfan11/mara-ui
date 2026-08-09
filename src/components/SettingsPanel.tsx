import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from '@/store/settingsStore'
import { useMaraStore } from '@/store/maraStore'
import {
  isMockMode,
  sendCommand,
  simulateConfirm,
  simulateEvent,
  simulateNumpad,
  simulateState,
} from '@/services/maraConnection'
import type { MaraState, NumpadKey } from '@/types/mara'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { Icon } from '@/components/ui/Icon'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-dim">{label}</span>
      {children}
    </div>
  )
}

const SIM_STATES: MaraState[] = ['idle', 'listening', 'thinking', 'speaking', 'seeing', 'error', 'offline']

const NUMPAD_KEYS: NumpadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

/** Panel de configuración deslizante desde la parte inferior. */
export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const settings = useSettingsStore()
  const device = useMaraStore((s) => s.device)
  const connected = useMaraStore((s) => s.connected)
  const mock = isMockMode()

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

              <Row label="Estado de Mara OS">
                <span className="flex items-center gap-2 text-xs text-dim">
                  <span className="h-2 w-2 rounded-full" style={{ background: connected ? '#7dd3a0' : '#5a6675', boxShadow: connected ? '0 0 6px rgba(125,211,160,0.9)' : 'none' }} />
                  {connected ? 'Conectado' : 'Desconectado'}
                  {device.temperature > 0 ? ` · ${Math.round(device.temperature)}°` : ''}
                </span>
              </Row>

              {mock && (
                <div className="space-y-5 pt-1">
                  <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.2em] text-faint">Simular estado</p>
                    <div className="grid grid-cols-4 gap-2">
                      {SIM_STATES.map((state) => (
                        <button
                          key={state}
                          type="button"
                          className="rounded-lg border border-line px-2 py-2 text-[11px] text-dim transition-colors active:border-accent/50 active:bg-panel active:text-ink"
                          onClick={() => simulateState(state)}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.2em] text-faint">
                      Teclado numérico <span className="normal-case tracking-normal">(futuro mara-device)</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {NUMPAD_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          className="rounded-lg border border-line px-2 py-2.5 font-mono text-sm text-dim transition-colors active:border-accent/50 active:bg-panel active:text-ink"
                          onClick={() => simulateNumpad(key, 'short')}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2 py-2.5 text-[11px] text-dim transition-colors active:border-accent/50 active:bg-panel active:text-ink"
                        onClick={() => simulateNumpad('power', 'long')}
                      >
                        Encendido (mantener)
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-amber-300/25 px-2 py-2.5 text-[11px] text-amber-200/80 transition-colors active:bg-panel"
                        onClick={simulateConfirm}
                      >
                        Confirmación crítica
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs uppercase tracking-[0.2em] text-faint">
                      Simular eventos <span className="normal-case tracking-normal">(Mara OS)</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2 py-2.5 text-[11px] text-dim transition-colors active:border-accent/50 active:bg-panel active:text-ink"
                        onClick={() => simulateEvent('mara:volume', { volume: 70 })}
                      >
                        Volumen 70
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2 py-2.5 text-[11px] text-dim transition-colors active:border-accent/50 active:bg-panel active:text-ink"
                        onClick={() => simulateEvent('mara:mute', { muted: true })}
                      >
                        Mute
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2 py-2.5 text-[11px] text-dim transition-colors active:border-accent/50 active:bg-panel active:text-ink"
                        onClick={() => simulateEvent('mara:camera', { enabled: false })}
                      >
                        Cámara off
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2 py-2.5 text-[11px] text-dim transition-colors active:border-accent/50 active:bg-panel active:text-ink"
                        onClick={() => simulateEvent('mara:network', { connected: false })}
                      >
                        Pérdida de red
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2 py-2.5 text-[11px] text-dim transition-colors active:border-accent/50 active:bg-panel active:text-ink"
                        onClick={() => simulateEvent('mara:network', { connected: true })}
                      >
                        Red recuperada
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
