import { useEffect } from 'react'
import { isMockMode, simulateConfirm, simulateNumpad } from '@/services/maraConnection'
import type { NumpadKey } from '@/types/mara'

const NUMPAD_KEYS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'])

/**
 * En modo mock, el teclado físico actúa como el futuro mara-device:
 * dígitos, * y # simulan pulsaciones del teclado numérico; la tecla P
 * simula una solicitud de confirmación (acción crítica).
 */
export function useKeyboardNumpad(): void {
  useEffect(() => {
    if (!isMockMode()) return

    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return
      const key = event.key
      if (NUMPAD_KEYS.has(key)) {
        simulateNumpad(key as NumpadKey, 'short')
      } else if (key === 'p' || key === 'P') {
        simulateConfirm()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
