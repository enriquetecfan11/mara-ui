import { useClock } from '@/hooks/useClock'
import { useMaraStore } from '@/store/maraStore'
import { Icon } from '@/components/ui/Icon'

/** Barra superior discreta: hora, marca y telemetría técnica mínima. */
export function SystemBar({ micActive }: { micActive: boolean }) {
  const time = useClock()
  const device = useMaraStore((s) => s.device)
  const connected = useMaraStore((s) => s.connected)
  const temp = device.temperature != null ? Math.round(device.temperature) : null

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-5 pt-5 sm:px-7 sm:pt-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-2xl font-light leading-none tracking-[0.3em] text-ink/90 tabular-nums">
          {time}
        </span>
        <span className="text-[10px] uppercase tracking-[0.55em] text-faint">Mara</span>
      </div>

      <div className="flex items-center gap-4 text-dim">
        <span className="flex items-center gap-1.5 text-xs tabular-nums">
          <span className="flex h-2 w-2 rounded-full" style={{ background: connected ? '#7dd3a0' : '#5a6675' }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: connected ? '#7dd3a0' : '#5a6675',
                boxShadow: connected ? '0 0 6px rgba(125,211,160,0.9)' : 'none',
              }}
            />
          </span>
          {connected ? 'En línea' : 'Sin señal'}
        </span>

        <span className="flex items-center gap-1.5 text-xs tabular-nums">
          <Icon name="temp" size={15} />
          {temp != null && temp > 0 ? `${temp}°` : '--°'}
        </span>

        <span className={device.microphone ? 'text-ink/80' : 'text-faint'}>
          <Icon name={device.microphone ? 'mic' : 'mic-off'} size={15} />
        </span>

        <span className={device.camera ? 'text-ink/80' : 'text-faint'}>
          <Icon name={device.camera ? 'camera' : 'camera-off'} size={15} />
        </span>

        {micActive && (
          <span className="flex items-center gap-1.5 text-xs text-accent" data-mic="active">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#7dd3a0]" />
            Mic PC
          </span>
        )}
      </div>
    </header>
  )
}
