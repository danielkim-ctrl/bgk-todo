import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// vite-plugin-pwa: Service Worker로 새 build 자동 감지 + 강제 캐시 갱신
// 브라우저가 옛 JS 번들을 캐시한 채 작동하던 stale 사이클 근본 차단.
// 새 deploy 후 1분 내 모든 활성 사용자가 새 코드로 자동 전환.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // index.html: NetworkFirst — 항상 server에서 새로 받음 (5초 timeout 후 캐시)
        // assets/*.js·css: hash가 파일명에 포함되어 빌드마다 새 파일 → 안전하게 long-cache
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/') || url.pathname.endsWith('.html'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      manifest: {
        name: '팀 TODO 통합관리',
        short_name: 'BGK Todo',
        theme_color: '#172f5a',
        display: 'standalone',
        start_url: '/bgk-todo/',
      },
    }),
  ],
  base: '/bgk-todo/',
})
