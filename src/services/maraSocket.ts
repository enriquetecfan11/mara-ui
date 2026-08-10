import type { MaraCommand, MaraEventEnvelope } from '@/types/mara'
import { normalizeEvent } from '@/types/mara'
import type { MaraConnection } from './maraConnection'

type Listener<T> = (value: T) => void

/**
 * Capa de comunicación con Mara OS vía WebSocket.
 * Es únicamente transporte: normaliza los mensajes al envelope del protocolo
 * v1 y los expone mediante un pequeño emisor interno. No contiene lógica.
 * Reintenta la conexión con backoff exponencial.
 */
export class MaraWebSocket implements MaraConnection {
  private url: string
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private attempts = 0
  private manualClose = false
  private eventListeners = new Set<Listener<MaraEventEnvelope>>()
  private statusListeners = new Set<Listener<boolean>>()
  private connected = false

  constructor(url: string) {
    this.url = url
  }

  connect(): void {
    this.manualClose = false
    this.open()
  }

  disconnect(): void {
    this.manualClose = true
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socket?.close()
    this.socket = null
    this.setConnected(false)
  }

  send(command: MaraCommand): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(command))
    }
  }

  /** Envía una trama binaria (audio PCM) hacia el bridge. */
  sendBinary(data: ArrayBuffer): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data)
    }
  }

  onEvent(listener: Listener<MaraEventEnvelope>): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  onStatus(listener: Listener<boolean>): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  private open(): void {
    if (this.manualClose) return

    const socket = new WebSocket(this.url)
    this.socket = socket

    socket.onopen = () => {
      this.attempts = 0
      this.setConnected(true)
    }

    socket.onmessage = (message) => {
      try {
        const raw = JSON.parse(message.data as string) as unknown
        const event = normalizeEvent(raw)
        this.emit(event)
      } catch {
        // Payload no reconocido: se ignora para no romper la UI.
      }
    }

    socket.onclose = () => {
      this.setConnected(false)
      this.scheduleReconnect()
    }

    socket.onerror = () => {
      // onclose gestiona la reconexión.
      this.socket?.close()
    }
  }

  private scheduleReconnect(): void {
    if (this.manualClose || this.reconnectTimer !== null) return
    const delay = Math.min(1000 * 2 ** this.attempts, 30000)
    this.attempts += 1
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.open()
    }, delay)
  }

  private setConnected(value: boolean): void {
    if (this.connected === value) return
    this.connected = value
    this.statusListeners.forEach((listener) => listener(value))
  }

  private emit(event: MaraEventEnvelope): void {
    this.eventListeners.forEach((listener) => listener(event))
  }
}
