import { motion, useTransform, type MotionValue } from 'framer-motion'
import { useAudioLevel } from '@/hooks/useAudioLevel'
import { useMaraStore } from '@/store/maraStore'
import {
  orbRootVariants,
  sphereVariants,
  corePulseVariants,
  backRingVariants,
  frontRingVariants,
  innerRingVariants,
} from '@/animations/orbVariants'
import './orb.css'

interface OrbProps {
  size?: number
}

/**
 * Núcleo visual de Mara. Se compone de capas independientes:
 * resplandor, anillos, ondas, esfera volumétrica, pulso de audio
 * y línea de escaneo. Cada estado de Mara redefine el perfil de
 * animación y la paleta de colores.
 */
export function Orb({ size = 240 }: OrbProps) {
  const state = useMaraStore((s) => s.state)
  const audio: MotionValue<number> = useAudioLevel()
  const audioScale = useTransform(audio, [0, 1], [1, 1.22])

  const hasWaves = state === 'listening' || state === 'speaking'
  const hasAudio = state === 'listening' || state === 'speaking'
  const hasScan = state === 'seeing'

  return (
    <div className="orb-root" style={{ width: size, height: size }}>
      <motion.div
        className="orb-root-vars"
        animate={state}
        variants={orbRootVariants}
        style={{ '--scan-distance': `${Math.round(size * 0.76)}px` } as React.CSSProperties}
      >
        <div className="orb-glow" />

        <motion.div
          className="orb-ring orb-ring-back"
          animate={state}
          variants={backRingVariants}
        />

        <div className={`orb-waves ${hasWaves ? 'is-active' : ''}`}>
          <span className="orb-wave" />
          <span className="orb-wave orb-wave--2" />
          <span className="orb-wave orb-wave--3" />
        </div>

        <div className="orb-sphere-wrap">
          <motion.div className="orb-sphere" animate={state} variants={sphereVariants}>
            <motion.div className="orb-core" animate={state} variants={corePulseVariants} />
            <div className="orb-highlight" />
            <div className="orb-sheen" />
          </motion.div>

          <motion.div
            className={`orb-audio ${hasAudio ? 'is-active' : ''}`}
            style={{ scale: audioScale }}
          />
        </div>

        <div className={`orb-scan ${hasScan ? 'is-active' : ''}`} />

        <motion.div
          className="orb-ring orb-ring-inner"
          animate={state}
          variants={innerRingVariants}
        />
        <motion.div
          className="orb-ring orb-ring-front"
          animate={state}
          variants={frontRingVariants}
        />
      </motion.div>
    </div>
  )
}
