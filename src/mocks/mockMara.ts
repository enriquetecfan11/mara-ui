import type {
  MaraCommand,
  MaraEventDataMap,
  MaraEventEnvelope,
  MaraState,
  NumpadKey,
  NumpadPress,
} from '@/types/mara'
import { makeEvent } from '@/types/mara'
import type { MaraConnection } from '@/services/maraConnection'

type Listener<T> = (value: T) => void

const MOCK_MESSAGES = [
  'Tienes dos reuniones mañana: a las 10:00 con el equipo y a las 16:00 con diseño.',
  'La temperatura de la Raspberry es de 44 grados, todo dentro de lo normal.',
  'He dejado la cocina apagada y la puerta principal cerrada.',
  'El tráfico hacia la oficina está fluido. Saldrías en unos 20 minutos.',
]

/**
 * Simulador de Mara OS y de mara-device para desarrollo sin backend.
 * Reproduce el ciclo de estados, niveles de audio, telemetría, pulsaciones
 * del teclado numérico y solicitudes de confirmación. Respeta el envelope
 * del protocolo v1 y responde a los mismos comandos que el WebSocket real.
 */
export class MockMara implements MaraConnection {
  private eventListeners = new Set<Listener<MaraEventEnvelope>>()
  private statusListeners = new Set<Listener<boolean>>()
  private timers = new Set<number>()
  private state: MaraState = 'idle'
  private temperature = 43.2
  private microphone = true
  private camera = true
  private active = false
  private messageIndex = 0
  private audioTimer: number | null = null

  connect(): void {
    this.active = true
    this.statusListeners.forEach((listener) => listener(true))
    this.emit('mara:system', {
      temperature: this.temperature,
      microphone: this.microphone,
      camera: this.camera,
    })
    this.audioTimer = window.setInterval(() => this.emitAudio(), 100)
    this.runIdleCycle()
  }

  disconnect(): void {
    this.active = false
    this.clearTimers()
    if (this.audioTimer !== null) {
      window.clearInterval(this.audioTimer)
      this.audioTimer = null
    }
    this.statusListeners.forEach((listener) => listener(false))
  }

  send(command: MaraCommand): void {
    switch (command.type) {
      case 'mara:start-listening':
        this.startConversation()
        break
      case 'mara:interrupt':
        this.toIdle(3000)
        break
      case 'mara:stop-listening':
        this.toIdle(3000)
        break
      case 'mara:settings': {
        const s = command.data
        if (s.microphone !== undefined) this.microphone = s.microphone
        if (s.camera !== undefined) this.camera = s.camera
        this.emit('mara:system', {
          temperature: this.temperature,
          microphone: this.microphone,
          camera: this.camera,
        })
        break
      }
      case 'mara:confirm-response': {
        const { accepted } = command.data
        this.schedule(() => {
          this.emit(
            'mara:message',
            { text: accepted ? 'Acción confirmada.' : 'Acción cancelada.' },
          )
          this.toIdle(6000)
        }, 600)
        break
      }
      case 'mara:numpad':
        this.emit('mara:numpad', command.data)
        break
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

  /** Fuerza un estado visual concreto para probar todas las variantes. */
  simulate(state: MaraState): void {
    this.clearTimers()
    this.setState(state)

    if (state === 'idle') {
      this.schedule(() => this.runIdleCycle(), 5000)
    } else {
      this.schedule(() => this.toIdle(5000), 8000)
    }
  }

  /** Simula una pulsación del teclado numérico (futuro mara-device). */
  simulateNumpad(key: NumpadKey, press: NumpadPress = 'short'): void {
    this.emit('mara:numpad', { key, press })

    // Una pulsación larga de la tecla de encendido pide confirmar el apagado.
    if (key === 'power' && press === 'long') {
      this.schedule(() => this.simulateConfirm(), 700)
    }
  }

  /** Simula una solicitud de confirmación de acción crítica. */
  simulateConfirm(): void {
    this.emit('mara:confirm', {
      id: `mock-${Date.now()}`,
      title: 'Apagar el dispositivo',
      message: 'Se detendrá Mara OS. ¿Continuar?',
      action: 'shutdown',
    })
  }

  /** Emite un evento arbitrario de Mara OS (para probar overlays). */
  simulateEvent<T extends keyof MaraEventDataMap>(type: T, data: MaraEventDataMap[T]): void {
    this.emit(type, data)
  }

  private runIdleCycle(): void {
    this.setState('idle')
    this.schedule(() => this.setState('listening'), 5000)
    this.schedule(() => this.setState('thinking'), 8500)
    this.schedule(() => this.setState('speaking'), 11500)
    this.schedule(() => {
      this.emit('mara:message', { text: MOCK_MESSAGES[this.messageIndex % MOCK_MESSAGES.length] })
      this.messageIndex += 1
      this.toIdle(9000)
    }, 16500)
  }

  private startConversation(): void {
    this.clearTimers()
    this.setState('listening')
    this.schedule(() => this.setState('thinking'), 3000)
    this.schedule(() => this.setState('speaking'), 6000)
    this.schedule(() => {
      this.emit('mara:message', { text: MOCK_MESSAGES[this.messageIndex % MOCK_MESSAGES.length] })
      this.messageIndex += 1
      this.toIdle(9000)
    }, 10000)
  }

  private toIdle(after: number): void {
    this.schedule(() => {
      if (!this.active) return
      this.setState('idle')
      this.schedule(() => this.runIdleCycle(), 5000)
    }, after)
  }

  private setState(state: MaraState): void {
    this.state = state
    this.emit('mara:state', { state })
  }

  private emitAudio(): void {
    this.emit('mara:audio-level', { level: this.levelForState() })
  }

  private levelForState(): number {
    const t = performance.now() / 1000
    const noise = () => Math.random()
    switch (this.state) {
      case 'listening':
        return 0.12 + noise() * 0.45
      case 'speaking': {
        const envelope = 0.5 + 0.5 * Math.sin(t * 6.0)
        return 0.18 + envelope * 0.6 * (0.55 + noise() * 0.45)
      }
      case 'thinking':
        return 0.04 + noise() * 0.14
      case 'seeing':
        return 0.03 + noise() * 0.1
      case 'idle':
        return noise() * 0.03
      default:
        return 0
    }
  }

  private emit<T extends keyof MaraEventDataMap>(type: T, data: MaraEventDataMap[T]): void {
    const event = makeEvent(type, data)
    this.eventListeners.forEach((listener) => listener(event as MaraEventEnvelope))
  }

  private schedule(fn: () => void, delay: number): void {
    if (!this.active) return
    const id = window.setTimeout(() => {
      this.timers.delete(id)
      if (this.active) fn()
    }, delay)
    this.timers.add(id)
  }

  private clearTimers(): void {
    this.timers.forEach((id) => window.clearTimeout(id))
    this.timers.clear()
  }
}
