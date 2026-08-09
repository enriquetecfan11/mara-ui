import { useMara } from '@/hooks/useMara'
import { MainScreen } from '@/screens/MainScreen'

export default function App() {
  useMara()
  return <MainScreen />
}
