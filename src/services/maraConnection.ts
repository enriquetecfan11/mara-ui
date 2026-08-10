import type { MaraCommand, MaraEventEnvelope } from '@/types/mara'
import { MaraWebSocket } from './maraSocket'

export interface MaraConnection {
  connect(): void
  disconnect(): void
  send(command: MaraCommand): void
  sendBinary(data: ArrayBuffer): void
  onEvent(listener: (event: MaraEventEnvelope) => void): () => void
  onStatus(listener: (connected: boolean) => void): () => void
}

function resolveWsUrl(): string {
  return import.meta.env.VITE_MARA_WS_URL ?? 'ws://localhost:8765'
}

let instance: MaraConnection | null = null

export function getConnection(): MaraConnection {
  if (instance) return instance

  instance = new MaraWebSocket(resolveWsUrl())

  return instance
}

export { resolveWsUrl }

/** Envía un comando hacia Mara OS (inicializa la conexión si es necesario). */
export function sendCommand(command: MaraCommand): void {
  getConnection().send(command)
}
