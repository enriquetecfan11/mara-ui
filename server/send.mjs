const BASE = process.env.MARA_HTTP_URL ?? 'http://localhost:8765'
const VERSION = 1

const args = process.argv.slice(2)
const raw = args[0] ?? ''

const BOOLS = new Set(['true', 'false'])
const NUMERIC = new Set(['audio-level', 'level', 'temperature', 'volume'])

function parseArg(arg) {
  const eq = arg.indexOf('=')
  if (eq === -1) throw new Error(`Argumento inválido: "${arg}". Usa clave=valor o JSON.`)
  const key = arg.slice(0, eq).trim()
  const value = arg.slice(eq + 1).trim()
  if (value === '') throw new Error(`Valor vacío para "${key}"`)
  const typed = NUMERIC.has(key) ? Number(value) : BOOLS.has(value) ? value === 'true' : value
  return [key, typed]
}

function buildEnvelope() {
  // Envelope o JSON completo.
  if (raw.startsWith('{')) {
    const parsed = JSON.parse(raw)
    const { type, version, timestamp, data, ...rest } = parsed
    if (!type || typeof type !== 'string') throw new Error('falta el campo "type"')
    return {
      type,
      version: version === VERSION ? VERSION : VERSION,
      timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
      data: data && typeof data === 'object' && data !== null ? data : rest,
    }
  }

  // Forma simple sin comillas: npm run send -- state=error
  const fields = Object.fromEntries(args.map(parseArg))
  const key = fields.type ?? args[0].split('=')[0].trim()
  const type = key.startsWith('mara:') ? key : `mara:${key}`
  const envelope = { type, version: VERSION, timestamp: Date.now() }

  switch (type) {
    case 'mara:system':
      envelope.data = {
        temperature: fields.temperature ?? 0,
        microphone: fields.microphone ?? true,
        camera: fields.camera ?? true,
      }
      break
    case 'mara:audio-level':
      envelope.data = { level: fields['audio-level'] ?? fields.level ?? 0 }
      break
    case 'mara:message':
      envelope.data = { text: fields.message ?? fields.text ?? '' }
      break
    case 'mara:state':
      envelope.data = { state: fields.state ?? '' }
      break
    case 'mara:volume':
      envelope.data = { volume: fields.volume ?? 0 }
      break
    case 'mara:mute':
      envelope.data = { muted: fields.mute ?? fields.muted ?? false }
      break
    case 'mara:camera':
      envelope.data = { enabled: fields.camera ?? fields.enabled ?? true }
      break
    case 'mara:network':
      envelope.data = { connected: fields.network ?? fields.connected ?? true }
      break
    case 'mara:numpad': {
      const value = String(fields.numpad ?? fields.key ?? '')
      const [k, press] = value.includes('_') ? value.split('_') : [value, 'short']
      envelope.data = { key: k, press }
      break
    }
    case 'mara:confirm':
      envelope.data = {
        id: fields.id ?? `cli-${Date.now()}`,
        title: fields.title ?? 'Confirmar acción',
        message: fields.message ?? fields.confirm ?? '',
        action: fields.action ?? 'confirm',
      }
      break
    default:
      envelope.data = fields
  }

  return envelope
}

async function main() {
  if (!raw && !args.length) {
    console.error(
      'Uso:\n' +
        '  npm run send -- state=thinking\n' +
        '  npm run send -- message="Hola, soy Mara"\n' +
        '  npm run send -- volume=70\n' +
        '  npm run send -- numpad=5\n' +
        '  npm run send -- numpad=power_long\n' +
        '  npm run send -- confirm="Reiniciar el dispositivo"\n' +
        "  npm run send -- '{\"type\":\"mara:state\",\"version\":1,\"timestamp\":0,\"data\":{\"state\":\"error\"}}'",
    )
    process.exit(1)
  }

  let event
  try {
    event = buildEnvelope()
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }

  try {
    const res = await fetch(`${BASE}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    console.log('Enviado:', JSON.stringify(event))
    console.log(await res.text())
  } catch (err) {
    console.error('No se pudo enviar:', err.message)
    process.exit(1)
  }
}

await main()
