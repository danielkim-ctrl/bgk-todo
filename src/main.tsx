import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './auth/AuthContext'
import App from './App'
// Phase 1 마이그레이션 함수 window 등록 — F12 콘솔에서 window.migrateFirestoreSubcollections() 실행
import './utils/migrateFirestoreSubcollections'

const root = createRoot(document.getElementById('root')!)
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
