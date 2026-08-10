import { create } from 'zustand'
import type {
  ConfirmRequest,
  DeviceStatus,
  MaraEventEnvelope,
  MaraState,
  NumpadKey,
  NumpadPress,
  OverlayData,
} from '@/types/mara'
import { useSettingsStore } from './settingsStore'

interface MaraStore {
  /** Estado visual de Mara (idle, listening, …). */
  state: MaraState
  message: string | null
  audioLevel: number
  /** Estado técnico del dispositivo (micrófono, cámara, temperatura). */
  device: DeviceStatus
  /** Estado de la conexión de transporte (WebSocket). */
  connected: boolean
  overlays: OverlayData[]
  confirm: ConfirmRequest | null
  handleEvent: (event: MaraEventEnvelope) => void
  handleStatus: (connected: boolean) => void
  clearMessage: () => void
  pushOverlay: (overlay: OverlayData) => void
  popOverlay: (id: string) => void
  requestConfirm: (request: ConfirmRequest) => void
  resolveConfirm: () => void
}

const emptyDevice: DeviceStatus = {
  temperature: null,
  microphone: null,
  camera: null,
}

let overlaySeq = 0
const overlayId = (kind: string) => `${kind}:${overlaySeq++}`

export const useMaraStore = create<MaraStore>((set, get) => {
  /** Aplica el estado de conexión de forma única (transporte y mara:network). */
  const applyConnection = (connected: boolean) => {
    set({
      connected,
      ...(connected ? {} : { state: 'offline' as MaraState, device: emptyDevice }),
    })
    if (connected) {
      get().popOverlay('network')
    } else {
      get().pushOverlay({
        id: 'network',
        kind: 'network',
        title: 'Sin conexión',
        subtitle: 'Reconectando con Mara OS…',
        icon: 'wifi-off',
        ttl: 0,
      })
    }
  }

  return {
    state: 'offline',
    message: null,
    audioLevel: 0,
    device: emptyDevice,
    connected: false,
    overlays: [],
    confirm: null,

    handleEvent: (event) => {
      const data = event.data as Record<string, unknown>
      const { device, pushOverlay } = get()

      switch (event.type) {
        case 'mara:state':
          set({ state: data.state as MaraState })
          break

      case 'mara:message':
        set({ message: String(data.text ?? '') })
        break

      case 'mara:audio-level':
        set({ audioLevel: Math.min(1, Math.max(0, Number(data.level) || 0)) })
        break

      case 'mara:system': {
        const next: DeviceStatus = {
          temperature:
            typeof data.temperature === 'number' && Number.isFinite(data.temperature)
              ? data.temperature
              : device.temperature,
          microphone:
            typeof data.microphone === 'boolean' ? data.microphone : device.microphone,
          camera: typeof data.camera === 'boolean' ? data.camera : device.camera,
        }
        set({ device: next })
        if (typeof data.microphone === 'boolean') {
          useSettingsStore.getState().set({ microphone: data.microphone })
        }
        if (typeof data.camera === 'boolean') {
          useSettingsStore.getState().set({ camera: data.camera })
        }
        break
      }

      case 'mara:error': {
        const message = typeof data.message === 'string' ? data.message : undefined
        set({ state: 'error' })
        if (message) set({ message })
        pushOverlay({
          id: overlayId('error'),
          kind: 'error',
          title: 'Error',
          subtitle: message,
          icon: 'warning',
          ttl: 4000,
        })
        break
      }

      case 'mara:volume': {
        const volume = Math.min(100, Math.max(0, Number(data.volume) || 0))
        useSettingsStore.getState().set({ volume })
        pushOverlay({
          id: overlayId('volume'),
          kind: 'volume',
          title: 'Volumen',
          value: volume,
          icon: 'volume',
          ttl: 1600,
        })
        break
      }

      case 'mara:mute': {
        const muted = Boolean(data.muted)
        useSettingsStore.getState().set({ microphone: !muted })
        set({ device: { ...device, microphone: !muted } })
        pushOverlay({
          id: overlayId('mute'),
          kind: 'mute',
          title: muted ? 'Micrófono silenciado' : 'Micrófono activado',
          icon: muted ? 'mic-off' : 'mic',
          ttl: 1600,
        })
        break
      }

      case 'mara:camera': {
        const enabled = Boolean(data.enabled)
        useSettingsStore.getState().set({ camera: enabled })
        set({ device: { ...device, camera: enabled } })
        pushOverlay({
          id: overlayId('camera'),
          kind: 'camera',
          title: enabled ? 'Cámara activada' : 'Cámara desactivada',
          icon: enabled ? 'camera' : 'camera-off',
          ttl: 1600,
        })
        break
      }

      case 'mara:network': {
        applyConnection(Boolean(data.connected))
        break
      }

      case 'mara:numpad': {
        const key = data.key as NumpadKey
        const press = (data.press as NumpadPress) ?? 'short'
        pushOverlay({
          id: overlayId('numpad'),
          kind: 'numpad',
          title: key,
          subtitle: press === 'long' ? 'mantenido' : undefined,
          ttl: press === 'long' ? 1500 : 800,
        })
        break
      }

      case 'mara:confirm': {
        set({
          confirm: {
            id: String(data.id ?? ''),
            title: String(data.title ?? 'Confirmar acción'),
            message: String(data.message ?? ''),
            action: String(data.action ?? ''),
          },
        })
        break
      }
    }
  },

  handleStatus: (connected) => {
    applyConnection(connected)
  },

  clearMessage: () => set({ message: null }),

  pushOverlay: (overlay) =>
    set((s) => ({
      overlays: [...s.overlays.filter((o) => o.id !== overlay.id), overlay],
    })),

  popOverlay: (id) =>
    set((s) => ({ overlays: s.overlays.filter((o) => o.id !== id) })),

    requestConfirm: (request) => set({ confirm: request }),

    resolveConfirm: () => set({ confirm: null }),
  }
})
