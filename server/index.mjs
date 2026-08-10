import 'dotenv/config'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'

const PORT = Number(process.env.MARA_SERVER_PORT ?? 8765)
const BRAIN_URL = process.env.MARA_BRAIN_WS_URL || null

const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
}

const clients = new Set()

// Sesiones de micrófono del navegador: socket -> { sampleRate, channels, smoothed }
const micSessions = new Map()

const PROTOCOL_VERSION = 1

function makeEvent(type, data) {
  return { type, version: PROTOCOL_VERSION, timestamp: Date.now(), data }
}

/** Nivel RMS normalizado (0..1) de una trama PCM Int16. */
function computeLevel(buffer) {
  const samples = buffer.length / 2
  if (!samples) return 0
  let sum = 0
  for (let i = 0; i < buffer.length; i += 2) {
    const sample = buffer.readInt16LE(i) / 0x7fff
    sum += sample * sample
  }
  const rms = Math.sqrt(sum / samples)
  return Math.min(1, rms * 3)
}

/** Normaliza un evento al envelope v1 (acepta formato plano legacy). */
function toEnvelope(body) {
  if (!body || typeof body !== 'object') throw new Error('cuerpo inválido')
  const { type, version, timestamp, data, ...rest } = body
  if (typeof type !== 'string' || !type) throw new Error('falta el campo "type"')
  const payload = data && typeof data === 'object' && data !== null ? data : rest
  return {
    type,
    version: version === PROTOCOL_VERSION ? PROTOCOL_VERSION : PROTOCOL_VERSION,
    timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
    data: payload,
  }
}

// Último estado conocido de Mara OS para sincronizar clientes nuevos.
const lastSynced = new Map()
// Estado de conexión del bridge hacia Mara OS, para poder corregir a la UI.
let brainConnected = false

/**
 * Recuerda el último evento de estado relevante para poder reenviarlo a
 * clientes que se conecten después. Sin esto, el bridge no puede saber que
 * Mara OS está conectado cuando la UI abre la página (la sincronización de
 * Mara OS ocurre en el momento del handshake, antes de que haya clientes).
 */
function trackSync(event) {
  if (event.type === 'mara:state' || event.type === 'mara:network' || event.type === 'mara:message') {
    lastSynced.set(event.type, event)
  }
}

function sendTo(socket, event) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event))
}

function broadcast(event) {
  trackSync(event)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(event))
  }
}

/**
 * Sincroniza a un cliente recién conectado: reenvía el último estado conocido
 * y, sea cual sea ese estado, corrige la red al valor REAL del enlace con Mara
 * OS. Así la UI no se queda en "offline" aunque el handshake ocurriera antes
 * de que el cliente se conectara al bridge.
 */
function syncClient(socket) {
  for (const event of lastSynced.values()) {
    sendTo(socket, event)
  }
  const lastNet = lastSynced.get('mara:network')
  if (!lastNet || lastNet.data?.connected !== brainConnected) {
    sendTo(socket, makeEvent('mara:network', { connected: brainConnected }))
  }
}

// Puente opcional hacia el cerebro de Mara (Mara OS real).
let brain = null
let brainAttempt = 0
let brainTimer = null

function connectBrain() {
  if (!BRAIN_URL) return
  brain = new WebSocket(BRAIN_URL)
  let timeout = null

  brain.on('open', () => {
    console.log(`[bridge] conectado a Mara OS: ${BRAIN_URL}`)
    brainConnected = true
    brainAttempt = 0
    if (timeout) clearTimeout(timeout)
  })
  brain.on('message', (raw) => {
    console.log('[bridge] Mara OS -> UI:', raw.toString())
    try {
      broadcast(toEnvelope(JSON.parse(raw.toString())))
    } catch {
      /* ignora payloads no JSON */
    }
  })
  brain.on('close', () => {
    console.log('[bridge] conexión con Mara OS cerrada')
    brain = null
    brainConnected = false
    if (timeout) clearTimeout(timeout)
    const delay = Math.min(1000 * 2 ** brainAttempt, 30000)
    brainAttempt += 1
    brainTimer = setTimeout(connectBrain, delay)
  })
  brain.on('error', (err) => {
    console.log(`[bridge] error al conectar a Mara OS: ${err.message}`)
  })
  // Timeout manual: si Mara OS no responde en 10s, cerramos para forzar retry.
  timeout = setTimeout(() => {
    if (brain && brain.readyState === WebSocket.CONNECTING) {
      console.log('[bridge] timeout conectando a Mara OS')
      brain.terminate()
    }
  }, 10000)
}

if (BRAIN_URL) {
  console.log(`[bridge] intentando conectar a Mara OS: ${BRAIN_URL}`)
  connectBrain()
} else {
  console.log('[bridge] sin MARA_BRAIN_WS_URL: el bridge solo sirve la UI')
}

async function serveStatic(req, res, pathname) {
  if (!existsSync(DIST_DIR)) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Build no encontrado. Ejecuta primero: npm run build')
    return
  }

  let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  let resolved = resolve(DIST_DIR, filePath)
  if (!resolved.startsWith(resolve(DIST_DIR))) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'forbidden' }))
    return
  }
  if (!existsSync(resolved)) resolved = resolve(DIST_DIR, 'index.html')

  try {
    const content = await readFile(resolved)
    res.writeHead(200, { 'Content-Type': MIME[extname(resolved)] ?? 'application/octet-stream' })
    res.end(content)
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Error interno')
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (req.method === 'POST' && url.pathname === '/api/event') {
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const event = toEnvelope(JSON.parse(body))
      broadcast(event)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, sent: clients.size, event }))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: err.message }))
    }
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        clients: clients.size,
        micSessions: micSessions.size,
        brain: Boolean(brain),
      }),
    )
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/help') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(
      [
        'POST /api/event  Envía un evento a la UI (protocolo v1).',
        '                 Body: {"type":"mara:state","version":1,"timestamp":0,"data":{"state":"thinking"}}',
        '                 También acepta el formato plano: {"type":"mara:state","state":"thinking"}',
        'GET  /api/status Clientes WebSocket conectados y sesiones de micrófono',
        'WS   ws://host:PORT  Canal de eventos en tiempo real',
        '',
        'Micrófono del navegador (pruebas de voz desde el PC):',
        '  La UI envía mara:audio-start, tramas PCM (Int16, 16 kHz mono) y',
        '  mara:audio-stop. El bridge calcula el nivel, lo emite como',
        '  mara:audio-level para todos los clientes y reenvía el audio crudo',
        '  al cerebro si MARA_BRAIN_WS_URL está configurado.',
        '',
        'Ejemplo:',
        '  curl -X POST http://localhost:8765/api/event -H "Content-Type: application/json" \\',
        '    -d \'{"type":"mara:message","data":{"text":"Hola, soy Mara"}}\'',
      ].join('\n'),
    )
    return
  }

  await serveStatic(req, res, url.pathname)
})

const wss = new WebSocketServer({ server })

wss.on('connection', (socket) => {
  clients.add(socket)
  console.log(`[ws] cliente conectado (${clients.size} activos)`)
  syncClient(socket)

  socket.on('message', (raw, isBinary) => {
    // Tramas de audio PCM del micrófono del navegador.
    if (isBinary) {
      const session = micSessions.get(socket)
      if (!session) return
      const level = computeLevel(raw)
      // Suavizado ligero para que la visual no parpadee.
      session.smoothed = session.smoothed * 0.6 + level * 0.4
      broadcast(makeEvent('mara:audio-level', { level: session.smoothed }))
      if (brain && brain.readyState === WebSocket.OPEN) {
        brain.send(raw)
      }
      return
    }

    const text = raw.toString()
    console.log('[ui] comando:', text)

    try {
      const message = JSON.parse(text)
      if (message.type === 'mara:audio-start') {
        micSessions.set(socket, {
          sampleRate: message.data?.sampleRate ?? 16000,
          channels: message.data?.channels ?? 1,
          smoothed: 0,
        })
        console.log(`[mic] sesión iniciada (${message.data?.sampleRate ?? 16000} Hz)`)
      } else if (message.type === 'mara:audio-stop') {
        if (micSessions.delete(socket)) {
          broadcast(makeEvent('mara:audio-level', { level: 0 }))
          console.log('[mic] sesión finalizada')
        }
      }
    } catch {
      /* no es JSON: se ignora */
    }

    if (brain && brain.readyState === WebSocket.OPEN) {
      brain.send(text)
    }
  })

  socket.on('close', () => {
    clients.delete(socket)
    micSessions.delete(socket)
    console.log(`[ws] cliente desconectado (${clients.size} activos)`)
  })
})

server.listen(PORT, () => {
  console.log(`Mara bridge listo`)
  console.log(`  Web   http://localhost:${PORT}        (sirve dist/)`)
  console.log(`  WS    ws://localhost:${PORT}          (conexión de la UI)`)
  console.log(`  API   http://localhost:${PORT}/api/event  (enviar eventos)`)
})
