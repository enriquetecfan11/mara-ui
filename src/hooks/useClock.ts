import { useEffect, useState } from 'react'

function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Hora actual (HH:MM), actualizada cada 15 segundos. */
export function useClock(): string {
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setTime(formatTime(new Date())), 15000)
    return () => window.clearInterval(id)
  }, [])

  return time
}
