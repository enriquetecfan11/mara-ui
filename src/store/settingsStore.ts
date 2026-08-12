import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DeviceSettings } from '@/types/mara'

interface SettingsStore extends DeviceSettings {
  /** Preferencia local (no se envía a Mara OS): micrófono del navegador. */
  browserMic: boolean
  set: (patch: Partial<DeviceSettings> & { browserMic?: boolean }) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      volume: 70,
      brightness: 80,
      microphone: true,
      camera: true,
      wakeWord: true,
      browserMic: true,
      set: (patch) => set(patch),
    }),
    {
      name: 'mara-ui-settings',
      version: 2,
      migrate: (persisted) => {
        const prev = persisted as Partial<SettingsStore>
        return { ...prev, browserMic: true }
      },
    },
  ),
)
