import { getConnection } from './maraConnection'

export interface MicHandle {
  stop(): void
}

const AUDIO_RATE = 16000
const BUFFER_SIZE = 2048

/**
 * Captura el micrófono del navegador (para probar voz desde el PC).
 * Emite `mara:audio-start`, tramas PCM (Int16, 16 kHz mono) y
 * `mara:audio-stop` hacia el bridge, que calcula el nivel y lo difunde
 * como `mara:audio-level`. El orb reacciona a esos eventos; la UI nunca
 * inventa datos de audio de forma local.
 */
export function startBrowserMic(opts: { onError: (message: string) => void }): MicHandle {
  let stopped = false
  let stream: MediaStream | null = null
  let context: AudioContext | null = null

  async function boot(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      opts.onError('El micrófono del navegador requiere localhost o HTTPS.')
      return
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: AUDIO_RATE,
        },
      })
    } catch {
      opts.onError('Permiso de micrófono denegado.')
      return
    }
    if (stopped) {
      stopTracks()
      return
    }

    let ctx: AudioContext
    try {
      ctx = new AudioContext({ sampleRate: AUDIO_RATE })
    } catch {
      ctx = new AudioContext()
    }
    context = ctx
    if (ctx.state === 'suspended') void ctx.resume()

    const source = ctx.createMediaStreamSource(stream)
    const processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1)
    // El nodo con ganancia 0 mantiene vivo el grafo sin devolver el mic por los altavoces.
    const sink = ctx.createGain()
    sink.gain.value = 0
    source.connect(processor)
    processor.connect(sink)
    sink.connect(ctx.destination)

    const connection = getConnection()
    connection.send({ type: 'mara:audio-start', data: { sampleRate: ctx.sampleRate, channels: 1 } })

    processor.onaudioprocess = (event) => {
      if (stopped) return
      const input = event.inputBuffer.getChannelData(0)
      const pcm = new Int16Array(input.length)
      for (let i = 0; i < input.length; i++) {
        const sample = Math.max(-1, Math.min(1, input[i]))
        pcm[i] = Math.round(sample * 0x7fff)
      }
      connection.sendBinary(pcm.buffer)
    }
  }

  function stopTracks(): void {
    stream?.getTracks().forEach((track) => track.stop())
  }

  void boot()

  return {
    stop() {
      stopped = true
      const connection = getConnection()
      connection.send({ type: 'mara:audio-stop' })
      if (context && context.state !== 'closed') {
        void context.close()
      }
      stopTracks()
    },
  }
}
