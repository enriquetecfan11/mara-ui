import type { Variant } from 'framer-motion'
import type { MaraState } from '@/types/mara'

/**
 * Paleta por estado (variables CSS animadas).
 * El orb se construye con gradientes que referencian estas variables,
 * así el cambio de color se funde de forma fluida.
 */
interface OrbPalette {
  c1: string
  c2: string
  c3: string
  glow: string
}

export const orbPalettes: Record<MaraState, OrbPalette> = {
  idle: {
    c1: '#8ec9ff',
    c2: '#2f5f96',
    c3: '#0a1626',
    glow: 'rgba(80, 150, 220, 0.40)',
  },
  listening: {
    c1: '#aef1ff',
    c2: '#2f93c8',
    c3: '#08243a',
    glow: 'rgba(70, 200, 245, 0.50)',
  },
  thinking: {
    c1: '#c9b8ff',
    c2: '#6f4fd0',
    c3: '#181040',
    glow: 'rgba(140, 110, 245, 0.45)',
  },
  speaking: {
    c1: '#b8f7ff',
    c2: '#2fb0c4',
    c3: '#082b36',
    glow: 'rgba(70, 220, 235, 0.55)',
  },
  seeing: {
    c1: '#a9f3d2',
    c2: '#25a894',
    c3: '#072e28',
    glow: 'rgba(60, 200, 160, 0.45)',
  },
  error: {
    c1: '#ffd7a3',
    c2: '#c97f1e',
    c3: '#351f0d',
    glow: 'rgba(220, 140, 40, 0.45)',
  },
  offline: {
    c1: '#77838f',
    c2: '#3c4754',
    c3: '#10151b',
    glow: 'rgba(90, 100, 110, 0.20)',
  },
}

type V = Record<MaraState, Variant>

/** Variables de color del orb raíz: se animan en cada cambio de estado. */
export const orbRootVariants: V = {
  idle: {
    '--c1': orbPalettes.idle.c1,
    '--c2': orbPalettes.idle.c2,
    '--c3': orbPalettes.idle.c3,
    '--glow': orbPalettes.idle.glow,
    opacity: 1,
    transition: { duration: 1.4, ease: 'easeInOut' },
  },
  listening: {
    '--c1': orbPalettes.listening.c1,
    '--c2': orbPalettes.listening.c2,
    '--c3': orbPalettes.listening.c3,
    '--glow': orbPalettes.listening.glow,
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeInOut' },
  },
  thinking: {
    '--c1': orbPalettes.thinking.c1,
    '--c2': orbPalettes.thinking.c2,
    '--c3': orbPalettes.thinking.c3,
    '--glow': orbPalettes.thinking.glow,
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeInOut' },
  },
  speaking: {
    '--c1': orbPalettes.speaking.c1,
    '--c2': orbPalettes.speaking.c2,
    '--c3': orbPalettes.speaking.c3,
    '--glow': orbPalettes.speaking.glow,
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeInOut' },
  },
  seeing: {
    '--c1': orbPalettes.seeing.c1,
    '--c2': orbPalettes.seeing.c2,
    '--c3': orbPalettes.seeing.c3,
    '--glow': orbPalettes.seeing.glow,
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeInOut' },
  },
  error: {
    '--c1': orbPalettes.error.c1,
    '--c2': orbPalettes.error.c2,
    '--c3': orbPalettes.error.c3,
    '--glow': orbPalettes.error.glow,
    opacity: 1,
    transition: { duration: 1.4, ease: 'easeInOut' },
  },
  offline: {
    '--c1': orbPalettes.offline.c1,
    '--c2': orbPalettes.offline.c2,
    '--c3': orbPalettes.offline.c3,
    '--glow': orbPalettes.offline.glow,
    opacity: 0.55,
    transition: { duration: 1.6, ease: 'easeInOut' },
  },
}

/** Respiración del núcleo esférico según el estado. */
export const sphereVariants: V = {
  idle: {
    scale: [1, 1.035, 1],
    transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
  },
  listening: {
    scale: [1, 1.1, 1],
    transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
  },
  thinking: {
    scale: [1, 1.055, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
  speaking: {
    scale: [1, 1.09, 1],
    transition: { duration: 0.95, repeat: Infinity, ease: 'easeInOut' },
  },
  seeing: {
    scale: [1, 1.02, 1],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
  error: {
    scale: [1, 1.03, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
  },
  offline: {
    scale: 1,
    opacity: 0.55,
  },
}

/** Pulso interior del núcleo. */
export const corePulseVariants: V = {
  idle: {
    opacity: [0.55, 0.9, 0.55],
    scale: [1, 1.06, 1],
    transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
  },
  listening: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.14, 1],
    transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
  },
  thinking: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.1, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
  speaking: {
    opacity: [0.55, 1, 0.55],
    scale: [1, 1.16, 1],
    transition: { duration: 0.95, repeat: Infinity, ease: 'easeInOut' },
  },
  seeing: {
    opacity: [0.5, 0.85, 0.5],
    scale: [1, 1.05, 1],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
  error: {
    opacity: [0.45, 0.75, 0.45],
    scale: [1, 1.04, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
  },
  offline: {
    opacity: 0.4,
    scale: 1,
  },
}

/** Anillo trasero: rotación continua lenta. */
export const backRingVariants: V = {
  idle: {
    rotate: [0, 360],
    scale: [1, 1.02, 1],
    opacity: 0.5,
    transition: { rotate: { duration: 48, repeat: Infinity, ease: 'linear' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } },
  },
  listening: {
    rotate: [0, 360],
    opacity: 0.85,
    transition: { duration: 18, repeat: Infinity, ease: 'linear' },
  },
  thinking: {
    rotate: [0, 360],
    scale: [1, 1.04, 1],
    opacity: 0.7,
    transition: { rotate: { duration: 7, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
  },
  speaking: {
    rotate: [0, 360],
    opacity: 0.7,
    transition: { duration: 14, repeat: Infinity, ease: 'linear' },
  },
  seeing: {
    rotate: [0, 360],
    opacity: 0.75,
    transition: { duration: 8, repeat: Infinity, ease: 'linear' },
  },
  error: {
    rotate: [0, 360],
    opacity: 0.45,
    transition: { duration: 26, repeat: Infinity, ease: 'linear' },
  },
  offline: {
    rotate: 0,
    opacity: 0.18,
  },
}

/** Anillo frontal: contra-rotación + respiración sutil. */
export const frontRingVariants: V = {
  idle: {
    rotate: [0, -360],
    opacity: 0.4,
    transition: { duration: 60, repeat: Infinity, ease: 'linear' },
  },
  listening: {
    rotate: [0, -360],
    scale: [1, 1.1, 1],
    opacity: 0.75,
    transition: { rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } },
  },
  thinking: {
    rotate: [0, -360],
    scale: [1, 1.07, 1],
    opacity: 0.6,
    transition: { rotate: { duration: 5, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } },
  },
  speaking: {
    rotate: [0, -360],
    scale: [1, 1.12, 1],
    opacity: 0.7,
    transition: { rotate: { duration: 9, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } },
  },
  seeing: {
    rotate: [0, -360],
    opacity: 0.6,
    transition: { duration: 5, repeat: Infinity, ease: 'linear' },
  },
  error: {
    rotate: 0,
    opacity: 0.35,
  },
  offline: {
    rotate: 0,
    opacity: 0.15,
  },
}

/** Anillo fino interior (giro rápido en thinking). */
export const innerRingVariants: V = {
  idle: {
    rotate: [0, 360],
    opacity: 0.3,
    transition: { duration: 30, repeat: Infinity, ease: 'linear' },
  },
  listening: {
    rotate: [0, 360],
    opacity: 0.6,
    transition: { duration: 6, repeat: Infinity, ease: 'linear' },
  },
  thinking: {
    rotate: [0, 360],
    opacity: 0.85,
    transition: { duration: 2.6, repeat: Infinity, ease: 'linear' },
  },
  speaking: {
    rotate: [0, 360],
    opacity: 0.55,
    transition: { duration: 5, repeat: Infinity, ease: 'linear' },
  },
  seeing: {
    rotate: [0, 360],
    opacity: 0.5,
    transition: { duration: 4, repeat: Infinity, ease: 'linear' },
  },
  error: {
    rotate: 0,
    opacity: 0.25,
  },
  offline: {
    rotate: 0,
    opacity: 0.12,
  },
}
