import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './AuthContext'
import App from './App'
import PlanDashboard from '../plan-dashboard'

// #plan 해시일 때는 기획 대시보드를 단독으로 렌더링 (인증 불필요)
const root = createRoot(document.getElementById('root')!)
if (window.location.hash === '#plan') {
  root.render(<PlanDashboard />)
} else {
  root.render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}
