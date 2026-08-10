export const PROTOCOL_VERSION = 1

/** Estado visual de Mara. No confundir con el estado técnico del dispositivo. */
export type MaraState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'seeing'
  | 'error'
  | 'offline'

/**
 * Estado técnico del dispositivo (micrófono, cámara, temperatura).
 * `null` significa valor desconocido: no se muestra hasta que Mara OS
 * reporte datos reales (nunca se inventan).
 */
export interface DeviceStatus {
  temperature: number | null
  microphone: boolean | null
  camera: boolean | null
}

/** Ajustes que la UI puede enviar a Mara OS. */
export interface DeviceSettings {
  volume: number
  brightness: number
  microphone: boolean
  camera: boolean
  wakeWord: boolean
}

/** Teclas del teclado numérico físico (futuro mara-device). */
export type NumpadKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '*' | '#'
  | 'power' | 'mic' | 'cam' | 'menu'

export type NumpadPress = 'short' | 'long'

/** Tipos de evento entrantes de Mara OS. */
export type MaraEventType =
  | 'mara:state'
  | 'mara:message'
  | 'mara:audio-level'
  | 'mara:system'
  | 'mara:error'
  | 'mara:volume'
  | 'mara:mute'
  | 'mara:camera'
  | 'mara:network'
  | 'mara:numpad'
  | 'mara:confirm'

/** Payload de cada tipo de evento. */
export interface MaraEventDataMap {
  'mara:state': { state: MaraState }
  'mara:message': { text: string }
  'mara:audio-level': { level: number }
  'mara:system': DeviceStatus
  'mara:error': { message?: string }
  'mara:volume': { volume: number }
  'mara:mute': { muted: boolean }
  'mara:camera': { enabled: boolean }
  'mara:network': { connected: boolean }
  'mara:numpad': { key: NumpadKey; press?: NumpadPress }
  'mara:confirm': { id: string; title: string; message: string; action: string }
}

/** Sobre v1 del protocolo WebSocket/API. */
export interface MaraEventEnvelope<T = unknown> {
  type: string
  version: number
  timestamp: number
  data: T
}

export type MaraEvent = {
  [K in keyof MaraEventDataMap]: MaraEventEnvelope<MaraEventDataMap[K]>
}[keyof MaraEventDataMap]

/** Comandos salientes de la UI hacia Mara OS. */
export type MaraCommand =
  | { type: 'mara:start-listening' }
  | { type: 'mara:stop-listening' }
  | { type: 'mara:interrupt' }
  | { type: 'mara:settings'; data: Partial<DeviceSettings> }
  | { type: 'mara:confirm-response'; data: { id: string; accepted: boolean } }
  | { type: 'mara:numpad'; data: { key: NumpadKey; press?: NumpadPress } }
  | { type: 'mara:audio-start'; data: { sampleRate: number; channels: number } }
  | { type: 'mara:audio-stop' }

/** Tipos de overlay temporal mostrados por la UI. */
export type OverlayKind = 'volume' | 'mute' | 'camera' | 'network' | 'numpad' | 'error'

export interface OverlayData {
  id: string
  kind: OverlayKind
  title: string
  subtitle?: string
  icon?: string
  value?: number
  /** Milisegundos visibles. 0 = persistente hasta que se elimine. */
  ttl: number
}

/** Solicitud de confirmación de una acción crítica. */
export interface ConfirmRequest {
  id: string
  title: string
  message: string
  action: string
}

/**
 * Normaliza un mensaje entrante (JSON del WebSocket/API) al envelope v1.
 * Acepta tanto el formato envelope como el plano (legacy): si el mensaje
 * no trae `data`, las demás claves se agrupan como `data`.
 */
export function normalizeEvent(raw: unknown): MaraEventEnvelope {
  const event = (raw ?? {}) as Record<string, unknown>
  const type = typeof event.type === 'string' ? event.type : 'mara:error'

  if (event.data && typeof event.data === 'object' && event.data !== null) {
    return {
      type,
      version: event.version === PROTOCOL_VERSION ? PROTOCOL_VERSION : PROTOCOL_VERSION,
      timestamp: typeof event.timestamp === 'number' ? event.timestamp : Date.now(),
      data: event.data,
    }
  }

  const { type: _t, version: _v, timestamp: _ts, data: _d, ...rest } = event
  return {
    type,
    version: PROTOCOL_VERSION,
    timestamp: Date.now(),
    data: rest,
  }
}

/** Crea un envelope v1 a partir de un tipo y payload. */
export function makeEvent<T extends keyof MaraEventDataMap>(
  type: T,
  data: MaraEventDataMap[T],
): MaraEventEnvelope<MaraEventDataMap[T]> {
  return { type, version: PROTOCOL_VERSION, timestamp: Date.now(), data }
}
