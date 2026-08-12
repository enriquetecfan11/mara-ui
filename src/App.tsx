import { useMara } from '@/hooks/useMara'
import { useVoicePlayback } from '@/hooks/useVoicePlayback'
import { MainScreen } from '@/screens/MainScreen'

export default function App() {
  useMara()
  useVoicePlayback()
  return <MainScreen />
}
