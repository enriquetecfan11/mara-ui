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

const PROTOCOL_VERSION = 1

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

function broadcast(event) {
  const data = JSON.stringify(event)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(data)
  }
}

// Puente opcional hacia el cerebro de Mara (Mara OS real).
let brain = null
if (BRAIN_URL) {
  brain = new WebSocket(BRAIN_URL)
  brain.on('open', () => console.log(`[bridge] conectado a Mara OS: ${BRAIN_URL}`))
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
  })
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
    res.end(JSON.stringify({ clients: clients.size, brain: Boolean(brain) }))
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/help') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(
      [
        'POST /api/event  Envía un evento a la UI (protocolo v1).',
        '                 Body: {"type":"mara:state","version":1,"timestamp":0,"data":{"state":"thinking"}}',
        '                 También acepta el formato plano: {"type":"mara:state","state":"thinking"}',
        'GET  /api/status Clientes WebSocket conectados',
        'WS   ws://host:PORT  Canal de eventos en tiempo real',
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

  socket.on('message', (raw) => {
    const text = raw.toString()
    console.log('[ui] comando:', text)
    if (brain && brain.readyState === WebSocket.OPEN) {
      brain.send(text)
    }
  })

  socket.on('close', () => {
    clients.delete(socket)
    console.log(`[ws] cliente desconectado (${clients.size} activos)`)
  })
})

server.listen(PORT, () => {
  console.log(`Mara bridge listo`)
  console.log(`  Web   http://localhost:${PORT}        (sirve dist/)`)
  console.log(`  WS    ws://localhost:${PORT}          (conexión de la UI)`)
  console.log(`  API   http://localhost:${PORT}/api/event  (enviar eventos)`)
})
