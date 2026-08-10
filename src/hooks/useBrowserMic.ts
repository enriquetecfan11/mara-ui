import { useEffect, useRef, useState } from 'react'
import { startBrowserMic, type MicHandle } from '@/services/maraMic'
import { useMaraStore } from '@/store/maraStore'
import { useSettingsStore } from '@/store/settingsStore'

/**
 * Captura el micrófono del navegador mientras el orb esté en `listening`
 * (y el ajuste `browserMic` esté activo). Al entrar en `listening` emite
 * `mara:audio-start` y envía tramas PCM al bridge; al salir envía
 * `mara:audio-stop` para que MaraOS transcriba ese clip. No captura en
 * continuo: solo habla exactamente el período activo.
 */
export function useBrowserMic(capture: boolean): { active: boolean } {
  const enabled = useSettingsStore((s) => s.browserMic)
  const set = useSettingsStore((s) => s.set)
  const [active, setActive] = useState(false)
  const micRef = useRef<MicHandle | null>(null)

  useEffect(() => {
    if (!enabled || !capture) {
      micRef.current?.stop()
      micRef.current = null
      setActive(false)
      return
    }

    setActive(true)

    micRef.current = startBrowserMic({
      onError: (message) => {
        set({ browserMic: false })
        setActive(false)
        useMaraStore.getState().handleEvent({
          type: 'mara:error',
          version: 1,
          timestamp: Date.now(),
          data: { message },
        })
      },
    })

    return () => {
      micRef.current?.stop()
      micRef.current = null
      setActive(false)
    }
  }, [enabled, capture, set])

  return { active }
}