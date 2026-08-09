import { useState } from 'react'
import { Orb } from '@/components/Orb/Orb'
import { StatusText } from '@/components/StatusText'
import { MessageText } from '@/components/MessageText'
import { SystemBar } from '@/components/SystemBar'
import { Menu } from '@/components/Menu'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Overlays } from '@/components/Overlays'
import { ConfirmOverlay } from '@/components/ConfirmOverlay'
import { Icon } from '@/components/ui/Icon'
import { useMaraStore } from '@/store/maraStore'
import { useViewportSize } from '@/hooks/useViewportSize'
import { useHold } from '@/hooks/useHold'
import { useKeyboardNumpad } from '@/hooks/useKeyboardNumpad'
import { sendCommand } from '@/services/maraConnection'

export function MainScreen() {
  useKeyboardNumpad()

  const { width, height } = useViewportSize()
  const orbSize = Math.round(Math.min(width * 0.5, height * 0.46, 300))

  const state = useMaraStore((s) => s.state)
  const message = useMaraStore((s) => s.message)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { handlers, fired } = useHold(() => setMenuOpen(true), 600)

  const handleTap = () => {
    if (fired.current) {
      fired.current = false
      return
    }
    switch (state) {
      case 'idle':
        sendCommand({ type: 'mara:start-listening' })
        break
      case 'listening':
        sendCommand({ type: 'mara:stop-listening' })
        break
      case 'speaking':
      case 'thinking':
        sendCommand({ type: 'mara:interrupt' })
        break
      default:
        break
    }
  }

  const showHint = state === 'idle' && !message

  return (
    <div className="relative h-full w-full overflow-hidden bg-abyss">
      <div className="app-vignette pointer-events-none absolute inset-0" />

      <SystemBar />

      <main className="relative flex h-full flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-5 sm:gap-6">
          <div
            className="relative cursor-pointer"
            style={{ width: orbSize, height: orbSize }}
            {...handlers}
            onClick={handleTap}
            role="button"
            aria-label="Mara"
          >
            <Orb size={orbSize} />
          </div>

          <div className="flex min-h-[7rem] flex-col items-center justify-end gap-1 sm:min-h-[8rem]">
            <StatusText state={state} />
            <MessageText />
          </div>
        </div>
      </main>

      <button
        type="button"
        className="absolute bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-line/60 text-faint transition-colors active:border-accent/40 active:text-dim"
        onClick={() => setSettingsOpen(true)}
        aria-label="Ajustes"
      >
        <Icon name="gear" size={18} />
      </button>

      {showHint && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.2em] text-faint/70 uppercase">
          Toca el orb para hablar
        </p>
      )}

      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Overlays />
      <ConfirmOverlay />
    </div>
  )
}
