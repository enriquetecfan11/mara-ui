import { afterEach, describe, expect, it } from 'vitest'
import { useMaraStore } from '@/store/maraStore'
import { makeEvent } from '@/types/mara'

const emptyDevice = { temperature: null, microphone: null, camera: null }

describe('maraStore - initial state', () => {
  it('starts offline with empty device', () => {
    const state = useMaraStore.getState()
    expect(state.state).toBe('offline')
    expect(state.connected).toBe(false)
    expect(state.device).toEqual(emptyDevice)
    expect(state.message).toBeNull()
    expect(state.audioLevel).toBe(0)
    expect(state.overlays).toEqual([])
    expect(state.confirm).toBeNull()
  })
})

describe('maraStore - event handling', () => {
  afterEach(() => {
    useMaraStore.setState({
      state: 'offline',
      message: null,
      audioLevel: 0,
      device: { temperature: null, microphone: null, camera: null },
      connected: false,
      overlays: [],
      confirm: null,
    })
  })

  it('mara:state updates visual state', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:state', { state: 'listening' }))
    expect(useMaraStore.getState().state).toBe('listening')
  })

  it('mara:state with idle', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:state', { state: 'idle' }))
    expect(useMaraStore.getState().state).toBe('idle')
  })

  it('mara:message sets message', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:message', { text: 'Hola, soy Mara' }))
    expect(useMaraStore.getState().message).toBe('Hola, soy Mara')
  })

  it('mara:audio-level clamps to 0..1', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:audio-level', { level: 1.5 }))
    expect(useMaraStore.getState().audioLevel).toBe(1)
    useMaraStore.getState().handleEvent(makeEvent('mara:audio-level', { level: -0.5 }))
    expect(useMaraStore.getState().audioLevel).toBe(0)
  })

  it('mara:system updates only provided fields, keeps null for unknown', () => {
    useMaraStore.getState().handleEvent(
      makeEvent('mara:system', { temperature: 42.5, microphone: true, camera: false }),
    )
    const device = useMaraStore.getState().device
    expect(device.temperature).toBe(42.5)
    expect(device.microphone).toBe(true)
    expect(device.camera).toBe(false)
  })

  it('mara:system with partial data keeps existing values', () => {
    useMaraStore.getState().handleEvent(
      makeEvent('mara:system', { temperature: 42.5, microphone: true, camera: false }),
    )
    // Only temperature changes (same mic/camera values)
    useMaraStore.getState().handleEvent(
      makeEvent('mara:system', { temperature: 50, microphone: true, camera: false }),
    )
    const device = useMaraStore.getState().device
    expect(device.temperature).toBe(50)
    expect(device.microphone).toBe(true)
    expect(device.camera).toBe(false)
  })

  it('mara:system with null values stays null', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:system', { temperature: null, microphone: null, camera: null }))
    const device = useMaraStore.getState().device
    expect(device).toEqual(emptyDevice)
  })

  it('mara:volume updates settings and shows overlay', () => {
    const before = useMaraStore.getState().overlays.length
    useMaraStore.getState().handleEvent(makeEvent('mara:volume', { volume: 70 }))
    const overlays = useMaraStore.getState().overlays
    expect(overlays.length).toBe(before + 1)
    expect(overlays[overlays.length - 1].kind).toBe('volume')
    expect(overlays[overlays.length - 1].value).toBe(70)
  })

  it('mara:mute updates settings and shows overlay', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:mute', { muted: true }))
    const device = useMaraStore.getState().device
    expect(device.microphone).toBe(false)
  })

  it('mara:camera updates device and shows overlay', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:camera', { enabled: false }))
    const device = useMaraStore.getState().device
    expect(device.camera).toBe(false)
  })

  it('mara:error sets error state and overlay', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:error', { message: 'Algo falló' }))
    expect(useMaraStore.getState().state).toBe('error')
    expect(useMaraStore.getState().message).toBe('Algo falló')
    expect(useMaraStore.getState().overlays.some((o) => o.kind === 'error')).toBe(true)
  })

  it('mara:confirm sets confirm request', () => {
    useMaraStore.getState().handleEvent(
      makeEvent('mara:confirm', {
        id: 'abc-123',
        title: 'Apagar',
        message: '¿Estás seguro?',
        action: 'shutdown',
      }),
    )
    const confirm = useMaraStore.getState().confirm
    expect(confirm).toMatchObject({
      id: 'abc-123',
      title: 'Apagar',
      message: '¿Estás seguro?',
      action: 'shutdown',
    })
  })
})

describe('maraStore - connection handling', () => {
  afterEach(() => {
    useMaraStore.setState({
      state: 'offline',
      message: null,
      audioLevel: 0,
      device: { temperature: null, microphone: null, camera: null },
      connected: false,
      overlays: [],
      confirm: null,
    })
  })

  it('handleStatus(false) resets to offline with empty device', () => {
    // Simulate being connected with real data
    useMaraStore.getState().handleEvent(makeEvent('mara:state', { state: 'speaking' }))
    useMaraStore.getState().handleEvent(
      makeEvent('mara:system', { temperature: 45, microphone: true, camera: true }),
    )

    // Disconnect
    useMaraStore.getState().handleStatus(false)
    const state = useMaraStore.getState()
    expect(state.connected).toBe(false)
    expect(state.state).toBe('offline')
    expect(state.device).toEqual(emptyDevice)
    expect(state.overlays.some((o) => o.kind === 'network')).toBe(true)
  })

  it('handleStatus(true) removes network overlay', () => {
    // First disconnect
    useMaraStore.getState().handleStatus(false)
    expect(useMaraStore.getState().overlays.some((o) => o.kind === 'network')).toBe(true)

    // Reconnect
    useMaraStore.getState().handleStatus(true)
    expect(useMaraStore.getState().connected).toBe(true)
    expect(useMaraStore.getState().overlays.some((o) => o.kind === 'network')).toBe(false)
  })

  it('mara:network event calls applyConnection (same as handleStatus)', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:network', { connected: false }))
    const state = useMaraStore.getState()
    expect(state.connected).toBe(false)
    expect(state.state).toBe('offline')
    expect(state.device).toEqual(emptyDevice)
    expect(state.overlays.some((o) => o.kind === 'network')).toBe(true)
  })

  it('mara:network(true) restores connected state', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:network', { connected: false }))
    useMaraStore.getState().handleEvent(makeEvent('mara:network', { connected: true }))
    expect(useMaraStore.getState().connected).toBe(true)
    expect(useMaraStore.getState().overlays.some((o) => o.kind === 'network')).toBe(false)
  })
})

describe('maraStore - no fake data without backend', () => {
  it('never emits fake states, messages, or telemetry', () => {
    const state = useMaraStore.getState()
    // Without any events, everything is empty/offline
    expect(state.state).toBe('offline')
    expect(state.message).toBeNull()
    expect(state.audioLevel).toBe(0)
    expect(state.device).toEqual(emptyDevice)
  })

  it('clearMessage resets message to null', () => {
    useMaraStore.getState().handleEvent(makeEvent('mara:message', { text: 'test' }))
    expect(useMaraStore.getState().message).toBe('test')
    useMaraStore.getState().clearMessage()
    expect(useMaraStore.getState().message).toBeNull()
  })

  it('pushOverlay replaces existing overlay of same id', () => {
    useMaraStore.getState().pushOverlay({
      id: 'test-overlay',
      kind: 'volume',
      title: 'V1',
      ttl: 9999,
      value: 50,
    })
    expect(useMaraStore.getState().overlays.length).toBe(1)

    useMaraStore.getState().pushOverlay({
      id: 'test-overlay',
      kind: 'volume',
      title: 'V2',
      ttl: 9999,
      value: 80,
    })
    expect(useMaraStore.getState().overlays.length).toBe(1)
    expect(useMaraStore.getState().overlays[0].title).toBe('V2')
  })

  it('popOverlay removes overlay by id', () => {
    useMaraStore.getState().pushOverlay({
      id: 'test-overlay',
      kind: 'volume',
      title: 'Test',
      ttl: 9999,
      value: 50,
    })
    expect(useMaraStore.getState().overlays.length).toBe(1)

    useMaraStore.getState().popOverlay('test-overlay')
    expect(useMaraStore.getState().overlays).toEqual([])
  })

  it('resolveConfirm clears confirm request', () => {
    useMaraStore.getState().handleEvent(
      makeEvent('mara:confirm', { id: 'test', title: 'T', message: 'M', action: 'A' }),
    )
    expect(useMaraStore.getState().confirm).not.toBeNull()

    useMaraStore.getState().resolveConfirm()
    expect(useMaraStore.getState().confirm).toBeNull()
  })
})
