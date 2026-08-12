import { useEffect } from 'react'
import { useMaraStore } from '@/store/maraStore'

/**
 * Reproduce en el dispositivo el WAV (base64) que Mara OS envía cuando
 * responde por voz al micrófono del navegador. La UI se mantiene en
 * `speaking` mientras suena y vuelve a `idle` al terminar (o ante error).
 */
export function useVoicePlayback(): void {
  const audio = useMaraStore((s) => s.audio)
  const voidAudio = useMaraStore((s) => s.voidAudio)

  useEffect(() => {
    if (!audio) return

    const player = new Audio(`data:audio/wav;base64,${audio}`)
    const done = () => voidAudio()
    player.addEventListener('ended', done)
    player.addEventListener('error', done)

    player.play().catch(() => {
      // Autoplay bloqueado o datos inválidos: no romper, solo volver a idle.
      done()
    })

    return () => {
      player.removeEventListener('ended', done)
      player.removeEventListener('error', done)
      player.pause()
    }
  }, [audio, voidAudio])
}