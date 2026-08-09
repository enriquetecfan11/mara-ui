import { useEffect } from 'react'
import { getConnection } from '@/services/maraConnection'
import { useMaraStore } from '@/store/maraStore'

/**
 * Conecta la capa de comunicación (WebSocket o mock) con el store.
 * Se monta una única vez a nivel de aplicación.
 */
export function useMara(): void {
  const handleEvent = useMaraStore((s) => s.handleEvent)
  const handleStatus = useMaraStore((s) => s.handleStatus)

  useEffect(() => {
    const connection = getConnection()

    const offEvent = connection.onEvent(handleEvent)
    const offStatus = connection.onStatus(handleStatus)

    connection.connect()

    return () => {
      offEvent()
      offStatus()
      connection.disconnect()
    }
  }, [handleEvent, handleStatus])
}
