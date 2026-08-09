# Mara UI

Interfaz visual de **Mara**, un asistente personal físico que se ejecuta en una
Raspberry Pi 5 con pantalla táctil. No es una web tradicional ni un dashboard:
es la cara de un dispositivo dedicado, oscura, minimalista y animada.

React · TypeScript · Vite · Tailwind CSS · Framer Motion · Zustand · WebSocket

---

## Qué incluye

- **Orb central** animado con esfera volumétrica y anillos concéntricos que
  cambia de comportamiento según el estado de Mara.
- **Estados reactivos**: `idle`, `listening`, `thinking`, `speaking`, `seeing`,
  `error`, `offline`.
- **Respuesta temporal** de Mara debajo del orb cuando responde.
- **Barra discreta** con hora, temperatura, conexión, micrófono y cámara.
- **Estado visual separado del estado técnico**: el estado de Mara no cambia por
  pérdida de red; la desconexión muestra un overlay.
- **Overlays temporales**: volumen, mute, cámara, pérdida de red y teclado numérico.
- **Confirmación de acciones críticas** con `Enter` = aceptar y `.` = cancelar.
- **Interacción táctil**: tap para escuchar/interrumpir, pulsación larga para
  abrir un mini menú.
- **Panel de ajustes**: volumen, brillo, micrófono, cámara, wake word, estado de
  Mara OS, simulación de estados, numpad y eventos, y reinicio de la interfaz.
- **Protocolo de eventos v1** (`type`, `version`, `timestamp`, `data`) con
  soporte mock del teclado numérico preparado para `mara-device`.
- **Modo mock** para probar todos los estados sin backend, y **WebSocket** para
  conectar con Mara OS.
- Lista para ejecutarse en **modo kiosk** en Chromium.

## Requisitos

- Node.js ≥ 18 (recomendado 20/22 LTS)
- npm ≥ 10

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Por defecto arranca en **modo mock**, que simula
el ciclo completo de estados sin necesidad de backend.

### Configuración por variables de entorno

Crea un `.env` a partir de `.env.example`:

```env
# "mock" (sin backend) o "ws" (WebSocket real con Mara OS)
VITE_MARA_MODE=mock

# URL del WebSocket de Mara OS
VITE_MARA_WS_URL=ws://192.168.1.50:8765
```

## Producción

```bash
npm run build
npm run preview        # sirve dist/ en http://localhost:4173
```

O sirve la carpeta `dist/` con cualquier servidor estático:

```bash
npx serve dist
```

El build usa rutas relativas (`base: './'`), por lo que funciona servido desde
cualquier ruta.

## Servidor bridge (para mandarle cosas a la UI)

El proyecto incluye un pequeño servidor Node en `server/` que hace tres cosas:

- sirve el build (`dist/`) para el modo kiosk,
- expone un **WebSocket** al que se conecta la UI, y
- expone una **API HTTP** para que le envíes eventos.

Configura la UI para conectarse al bridge (modo `ws`) y compila:

```env
# .env
VITE_MARA_MODE=ws
VITE_MARA_WS_URL=ws://localhost:8765
```

```bash
npm run build
npm run server
```

Salida:

```text
Mara bridge listo
  Web   http://localhost:8765         (sirve dist/)
  WS    ws://localhost:8765           (conexión de la UI)
  API   http://localhost:8765/api/event   (enviar eventos)
```

### Enviar eventos

Con la utilidad incluida (sintaxis `clave=valor`, sin comillas, funciona en
cualquier shell):

```bash
npm run send -- state=thinking
npm run send -- message="Hola, soy Mara"
npm run send -- audio-level=0.42
npm run send -- type=system temperature=47.5 microphone=false
npm run send -- volume=70
npm run send -- mute=true
npm run send -- camera=false
npm run send -- network=false
npm run send -- numpad=5
npm run send -- numpad=power_long
npm run send -- confirm="Reiniciar el dispositivo"
```

O como JSON completo:

```bash
npm run send -- '{"type":"mara:state","state":"error"}'
```

O directamente con `curl`:

```bash
curl -X POST http://localhost:8765/api/event \
  -H "Content-Type: application/json" \
  -d '{"type":"mara:state","state":"speaking"}'
```

Desde PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8765/api/event `
  -ContentType "application/json" `
  -Body '{"type":"mara:message","text":"Tienes dos reuniones mañana."}'
```

### Puente hacia Mara OS (opcional)

Si defines `MARA_BRAIN_WS_URL`, el bridge reenvía ahí los comandos de la UI
(`mara:start-listening`, `mara:interrupt`, `mara:settings`, …) y difunde hacia
la UI los eventos que ese cerebro emita. Así el servidor actúa de puente entre
la interfaz y el cerebro real sin mezclar ambos en un solo proceso.

```env
MARA_BRAIN_WS_URL=ws://192.168.1.50:9000
```

## Modo kiosk en la Raspberry Pi

### 1. Servir la app

Opciones sencillas:

- `npm run server` (el bridge: sirve `dist/` + WebSocket + API en un solo puerto), o
- `npm run preview` dentro del directorio del proyecto, o
- un servidor estático en el mismo dispositivo.

### 2. Arrancar Chromium en kiosk

```bash
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-component-update \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --app=http://localhost:4173
```

### 3. Autostart con systemd

Archivo `/etc/systemd/system/mara-ui.service`:

```ini
[Unit]
Description=Mara UI kiosk
After=network-online.target

[Service]
User=pi
Environment=DISPLAY=:0
Environment=XDG_RUNTIME_DIR=/run/user/1000
ExecStart=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble http://localhost:4173
Restart=on-failure

[Install]
WantedBy=graphical.target
```

```bash
sudo systemctl enable --now mara-ui
```

### 4. Evitar que la pantalla se apague

```bash
# desactivar screen blanking en consola
sudo sh -c 'echo -e "\033[9;0]" > /dev/tty1'
# o en el entorno gráfico
xset s off
xset -dpms
xset s noblank
```

> La interfaz está pensada para pantalla táctil: sin scroll, sin selección de
> texto, sin elementos que dependan del hover y con objetivos táctiles grandes.

## Contrato de comunicación con Mara OS

La capa `src/services/maraConnection.ts` decide entre WebSocket real y mock.
La UI no contiene lógica de IA: solo recibe eventos y envía comandos.

### Protocolo v1

Todos los eventos entrantes (WebSocket y API del bridge) usan un sobre común:

```ts
interface MaraEventEnvelope<T = unknown> {
  type: string      // 'mara:state', 'mara:message', …
  version: number   // 1
  timestamp: number // epoch ms
  data: T           // payload del evento
}
```

La UI acepta también el formato plano legacy (`{ "type": "...", "state": "…" }`)
y lo normaliza al sobre v1 en `src/types/mara.ts` (`normalizeEvent`).

### Eventos entrantes (Mara OS → UI)

| `type`            | `data`                                                        | Efecto visual |
| ----------------- | ------------------------------------------------------------- | ------------- |
| `mara:state`      | `{ state }` (`idle`/`listening`/`thinking`/`speaking`/`seeing`/`error`/`offline`) | Estado del orb y texto |
| `mara:message`    | `{ text }`                                                    | Respuesta temporal bajo el orb |
| `mara:audio-level`| `{ level }` (0..1)                                            | Pulsos/ondas del orb |
| `mara:system`     | `{ temperature, microphone, camera }`                         | Estado técnico (barra + ajustes) |
| `mara:error`      | `{ message? }`                                                | Estado `error` + overlay |
| `mara:volume`     | `{ volume }` (0..100)                                         | Overlay de volumen |
| `mara:mute`       | `{ muted }`                                                   | Overlay mute + estado técnico |
| `mara:camera`     | `{ enabled }`                                                 | Overlay cámara + estado técnico |
| `mara:network`    | `{ connected }`                                               | Overlay persistente de pérdida de red |
| `mara:numpad`     | `{ key, press? }` (`0`-`9`, `*`, `#`, `power`, `mic`, `cam`…) | Overlay con la tecla pulsada |
| `mara:confirm`    | `{ id, title, message, action }`                              | Overlay de confirmación |

Ejemplo de envelope:

```json
{
  "type": "mara:state",
  "version": 1,
  "timestamp": 1770000000000,
  "data": { "state": "listening" }
}
```

### Estado visual vs. estado técnico

El estado de Mara (`state`) es independiente del estado técnico del dispositivo:

- **Visual**: `idle`, `listening`, `thinking`, `speaking`, `seeing`, `error`, `offline`.
- **Técnico**: micrófono, cámara, temperatura (`mara:system`) y conexión de
  transporte (`onStatus` / `mara:network`). La pérdida de conexión **no** cambia
  el estado visual de Mara: muestra el overlay de red y mantiene el estado actual.

### Comandos salientes (UI → Mara OS)

```ts
{ type: 'mara:start-listening' }
{ type: 'mara:stop-listening' }
{ type: 'mara:interrupt' }
{ type: 'mara:settings', data: { volume?: number, brightness?: number, microphone?: boolean, camera?: boolean, wakeWord?: boolean } }
{ type: 'mara:confirm-response', data: { id: string, accepted: boolean } }
{ type: 'mara:numpad', data: { key: NumpadKey, press?: 'short' | 'long' } }
```

`mara:settings` envía únicamente los campos que cambian. La UI **no ejecuta**
acciones críticas: ante un `mara:confirm` devuelve la decisión con
`mara:confirm-response` y es Mara OS quien las aplica.

## Overlays temporales

La UI muestra avisos transitorios sin llenar la pantalla:

- **Volumen, mute, cámara**: breve pill central con icono y valor.
- **Pérdida de red**: banner inferior persistente mientras no haya conexión.
- **Teclado numérico**: tecla pulsada en grande (del futuro `mara-device`).
- **Confirmación crítica**: modal con `Enter` = aceptar y `.` = cancelar
  (también por toque), compatible con pantalla táctil y teclado.

## Teclado numérico en modo mock

En modo mock el teclado físico actúa como `mara-device`:

- Dígitos, `*` y `#` simulan pulsaciones (`mara:numpad`).
- `P` simula una solicitud de confirmación (acción crítica).
- También se puede simular desde el panel de ajustes o con el bridge:
  `npm run send -- numpad=5` o `npm run send -- numpad=power_long`.

## Gestos táctiles

| Gesto            | Acción                                                    |
| ---------------- | --------------------------------------------------------- |
| Tap en el orb    | idle → escuchar · escuchando → detener · hablando/pensando → interrumpir |
| Pulsación larga  | Mini menú (wake word, micrófono, ajustes, reiniciar)      |
| Botón engranaje  | Abre el panel de ajustes                                  |
| Deslizar hacia abajo en ajustes | Cierra el panel                              |

## Estructura

```text
src/
├── components/
│   ├── Orb/            # esfera volumétrica + anillos + capas de estado
│   ├── ui/             # Icon, Toggle, Slider
│   ├── StatusText.tsx
│   ├── MessageText.tsx
│   ├── SystemBar.tsx
│   ├── Menu.tsx
│   ├── SettingsPanel.tsx
│   ├── Overlays.tsx        # overlays temporales (volumen, mute, red, numpad…)
│   └── ConfirmOverlay.tsx  # confirmación de acciones críticas (Enter / .)
├── screens/
│   └── MainScreen.tsx
├── animations/
│   └── orbVariants.ts  # perfiles de animación por estado
├── hooks/
│   ├── useMara.ts
│   ├── useAudioLevel.ts
│   ├── useClock.ts
│   ├── useHold.ts
│   ├── useKeyboardNumpad.ts
│   └── useViewportSize.ts
├── services/
│   ├── maraConnection.ts   # contrato + factory (mock | ws)
│   └── maraSocket.ts       # WebSocket con reconexión (solo transporte)
├── store/
│   ├── maraStore.ts        # estado visual + técnico + overlays
│   └── settingsStore.ts    # persistido en localStorage
├── types/
│   └── mara.ts             # protocolo v1 + tipos + normalización
└── mocks/
    └── mockMara.ts         # simulador de estados, numpad y confirmación
```

## Scripts

| Comando              | Descripción                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Servidor de desarrollo               |
| `npm run build`      | Typecheck + build de producción      |
| `npm run preview`    | Sirve el build localmente            |
| `npm run typecheck`  | Comprueba tipos de TypeScript        |
