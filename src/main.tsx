import { createRoot } from 'react-dom/client'
import { AuthProvider } from './AuthContext'
import App from '../team-todo'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
