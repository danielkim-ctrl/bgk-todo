import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
// Firebase 초기화(익명 auth 자동) + Phase 1 마이그레이션 함수 window 등록
import './firebase'
import './utils/migrateFirestoreSubcollections'

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
