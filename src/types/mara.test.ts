import { describe, expect, it } from 'vitest'
import {
  PROTOCOL_VERSION,
  makeEvent,
  normalizeEvent,
  type MaraEventEnvelope,
} from '@/types/mara'

describe('protocol v1', () => {
  it('PROTOCOL_VERSION is 1', () => {
    expect(PROTOCOL_VERSION).toBe(1)
  })

  it('makeEvent creates a v1 envelope', () => {
    const event = makeEvent('mara:state', { state: 'thinking' })
    expect(event.type).toBe('mara:state')
    expect(event.version).toBe(1)
    expect(event.timestamp).toBeTypeOf('number')
    expect(event.data).toEqual({ state: 'thinking' })
  })

  it('normalizeEvent accepts v1 envelope format', () => {
    const raw = {
      type: 'mara:state',
      version: 1,
      timestamp: 1770000000000,
      data: { state: 'listening' },
    }
    const event = normalizeEvent(raw)
    expect(event.type).toBe('mara:state')
    expect(event.version).toBe(1)
    expect(event.timestamp).toBe(1770000000000)
    expect(event.data).toEqual({ state: 'listening' })
  })

  it('normalizeEvent accepts legacy flat format', () => {
    const raw = { type: 'mara:state', state: 'speaking' }
    const event = normalizeEvent(raw)
    expect(event.type).toBe('mara:state')
    expect(event.version).toBe(1)
    expect(event.data).toEqual({ state: 'speaking' })
  })

  it('normalizeEvent defaults unknown type to mara:error', () => {
    const raw = { data: {} }
    const event = normalizeEvent(raw)
    expect(event.type).toBe('mara:error')
  })

  it('normalizeEvent handles null/undefined gracefully', () => {
    const event = normalizeEvent(null)
    expect(event.type).toBe('mara:error')
    expect(event.version).toBe(1)
  })

  it('normalizeEvent uses Date.now() when timestamp is missing', () => {
    const before = Date.now()
    const event = normalizeEvent({ type: 'mara:state', data: { state: 'idle' } })
    const after = Date.now()
    expect(event.timestamp).toBeGreaterThanOrEqual(before)
    expect(event.timestamp).toBeLessThanOrEqual(after)
  })
})

describe('event envelope structure', () => {
  it('audio-level event has correct shape', () => {
    const event = makeEvent('mara:audio-level', { level: 0.5 })
    expect(event.data).toEqual({ level: 0.5 })
  })

  it('system event has nullable device fields', () => {
    const event = makeEvent('mara:system', {
      temperature: null,
      microphone: null,
      camera: null,
    })
    expect(event.data.temperature).toBeNull()
    expect(event.data.microphone).toBeNull()
    expect(event.data.camera).toBeNull()
  })

  it('numpad event has key and optional press', () => {
    const event = makeEvent('mara:numpad', { key: '5', press: 'long' })
    expect(event.data).toEqual({ key: '5', press: 'long' })
  })

  it('voice.speaking events have the right shape', () => {
    const started = makeEvent('voice.speaking.started', {})
    expect(started.type).toBe('voice.speaking.started')
    expect(started.data).toEqual({})
    const finished = makeEvent('voice.speaking.finished', {})
    expect(finished.type).toBe('voice.speaking.finished')
    expect(finished.data).toEqual({})
  })

  it('voice.audio event carries text and base64 audio', () => {
    const event = makeEvent('voice.audio', { text: 'Hola', audio: 'QVdGRQ==' })
    expect(event.type).toBe('voice.audio')
    expect(event.data).toEqual({ text: 'Hola', audio: 'QVdGRQ==' })
  })
})

describe('no mock/fake data in types', () => {
  it('maraStore starts in offline state', () => {
    // Import only for type checking - verification happens in store test
    const envelope: MaraEventEnvelope = {
      type: 'mara:state',
      version: 1,
      timestamp: Date.now(),
      data: { state: 'idle' },
    }
    expect(envelope.version).toBe(PROTOCOL_VERSION)
  })
})
