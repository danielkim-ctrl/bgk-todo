import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
// Firebase 초기화 + 마이그레이션/복구 함수 window 등록
import './firebase'
import './utils/migrateFirestoreSubcollections'
import './utils/recoverFromMeta'

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
