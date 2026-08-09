import { useEffect } from 'react'
import { useSpring, type MotionValue } from 'framer-motion'
import { useMaraStore } from '@/store/maraStore'

/**
 * Nivel de audio suavizado (MotionValue) para animaciones reactivas.
 * Aplica un spring para evitar saltos bruscos en el orb.
 */
export function useAudioLevel(): MotionValue<number> {
  const raw = useMaraStore((s) => s.audioLevel)
  const spring = useSpring(0, { stiffness: 140, damping: 26, mass: 0.6 })

  useEffect(() => {
    spring.set(raw)
  }, [raw, spring])

  return spring
}
