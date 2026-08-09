import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DeviceSettings } from '@/types/mara'

interface SettingsStore extends DeviceSettings {
  set: (patch: Partial<DeviceSettings>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      volume: 70,
      brightness: 80,
      microphone: true,
      camera: true,
      wakeWord: true,
      set: (patch) => set(patch),
    }),
    { name: 'mara-ui-settings' },
  ),
)
