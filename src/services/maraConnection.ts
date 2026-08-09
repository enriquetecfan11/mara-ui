import type {
  MaraCommand,
  MaraEventDataMap,
  MaraEventEnvelope,
  MaraState,
  NumpadKey,
  NumpadPress,
} from '@/types/mara'
import { MaraWebSocket } from './maraSocket'
import { MockMara } from '@/mocks/mockMara'

export interface MaraConnection {
  connect(): void
  disconnect(): void
  send(command: MaraCommand): void
  /** Suscribe a los eventos de Mara. Devuelve una función para cancelar. */
  onEvent(listener: (event: MaraEventEnvelope) => void): () => void
  /** Notifica cambios de conexión (true = conectado, false = desconectado). */
  onStatus(listener: (connected: boolean) => void): () => void
}

export type MaraMode = 'mock' | 'ws'

function resolveMode(): MaraMode {
  const raw = import.meta.env.VITE_MARA_MODE
  return raw === 'ws' ? 'ws' : 'mock'
}

function resolveWsUrl(): string {
  return import.meta.env.VITE_MARA_WS_URL ?? 'ws://localhost:8765'
}

let instance: MaraConnection | null = null

/**
 * Devuelve la conexión activa (singleton) según el modo configurado.
 * El resto de la aplicación no sabe si está hablando con un WebSocket
 * real o con el simulador.
 */
export function getConnection(): MaraConnection {
  if (instance) return instance

  const mode = resolveMode()
  instance = mode === 'ws' ? new MaraWebSocket(resolveWsUrl()) : new MockMara()

  return instance
}

export { resolveMode, resolveWsUrl }

/** Envía un comando hacia Mara OS (inicializa la conexión si es necesario). */
export function sendCommand(command: MaraCommand): void {
  getConnection().send(command)
}

/** True cuando la app está configurada en modo simulación. */
export function isMockMode(): boolean {
  return resolveMode() === 'mock'
}

/** Fuerza un estado visual en el simulador (solo modo mock). */
export function simulateState(state: MaraState): void {
  if (instance instanceof MockMara) {
    instance.simulate(state)
  }
}

/** Simula una pulsación del teclado numérico (solo modo mock). */
export function simulateNumpad(key: NumpadKey, press: NumpadPress = 'short'): void {
  if (instance instanceof MockMara) {
    instance.simulateNumpad(key, press)
  }
}

/** Simula una solicitud de confirmación de acción crítica (solo modo mock). */
export function simulateConfirm(): void {
  if (instance instanceof MockMara) {
    instance.simulateConfirm()
  }
}

/** Emite un evento arbitrario de Mara OS (solo modo mock, para overlays). */
export function simulateEvent<T extends keyof MaraEventDataMap>(type: T, data: MaraEventDataMap[T]): void {
  if (instance instanceof MockMara) {
    instance.simulateEvent(type, data)
  }
}
