import { useState } from 'react'
import type { FormEvent } from 'react'
import { sendCommand } from '@/services/maraConnection'

export function TextComposer() {
  const [text, setText] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = text.trim()
    if (!value) return
    sendCommand({ type: 'mara:text', data: { text: value } })
    setText('')
  }

  return (
    <form
      onSubmit={submit}
      className="absolute bottom-5 left-5 z-30 flex max-w-[calc(100%-7rem)] items-end gap-2 short:bottom-3 short:left-3 short:max-w-[calc(100%-6rem)] short:gap-1.5"
      aria-label="Enviar mensaje escrito"
    >
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
        rows={1}
        placeholder="Escribe a Mara…"
        className="max-h-28 min-h-11 w-[min(68vw,24rem)] resize-none rounded-2xl border border-line/60 bg-panel/90 px-4 py-3 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/50 short:min-h-10 short:w-[min(62vw,24rem)] short:px-3 short:py-2 short:text-[13px]"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="h-11 rounded-2xl border border-line/60 bg-panel/90 px-4 text-xs tracking-[0.12em] text-dim uppercase transition-colors active:border-accent/50 active:text-ink disabled:opacity-40 short:h-10 short:px-3 short:text-[11px]"
      >
        Enviar
      </button>
    </form>
  )
}
