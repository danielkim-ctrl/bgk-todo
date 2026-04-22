import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// IndexedDB 기반 오프라인 캐시 활성화 — 새로고침 시 깜빡임 없이 즉시 렌더링, 탭 간 캐시 공유
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// 익명 인증 자동 처리 — Firestore 규칙(request.auth != null)만 만족시키기 위한 최소 auth.
// 사용자 UI 없이 백그라운드에서 자동 로그인. 향후 Google/이메일 auth 세팅 시 대체 예정.
// Firebase 콘솔 → Authentication → Sign-in method → Anonymous 활성화 필요.
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch((e) => {
      console.error("[AUTH] 익명 로그인 실패 — Firebase 콘솔에서 Anonymous sign-in 활성화 필요:", e);
    });
  }
});
