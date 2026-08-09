import { useRef } from 'react'

interface HoldHandlers {
  onPointerDown: (event: React.PointerEvent) => void
  onPointerUp: (event: React.PointerEvent) => void
  onPointerCancel: (event: React.PointerEvent) => void
  onPointerLeave: (event: React.PointerEvent) => void
  onPointerMove: (event: React.PointerEvent) => void
}

/**
 * Detecta pulsación larga mediante Pointer Events.
 * Devuelve los handlers a extender sobre el elemento y una ref
 * `fired` que vale true si la pulsación larga se completó.
 * El componente puede consultar `fired.current` en su manejador de
 * tap para ignorar ese gesto y reiniciar la ref.
 */
export function useHold(onLongPress: () => void, duration = 600): { handlers: HoldHandlers; fired: React.MutableRefObject<boolean> } {
  const fired = useRef(false)
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  const onPointerDown = (event: React.PointerEvent) => {
    fired.current = false
    start.current = { x: event.clientX, y: event.clientY }
    clear()
    timer.current = window.setTimeout(() => {
      fired.current = true
      onLongPress()
    }, duration)
  }

  const cancel = () => {
    clear()
    start.current = null
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (start.current && timer.current !== null) {
      const dx = event.clientX - start.current.x
      const dy = event.clientY - start.current.y
      if (Math.hypot(dx, dy) > 14) cancel()
    }
  }

  return {
    handlers: {
      onPointerDown,
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      onPointerMove,
    },
    fired,
  }
}
