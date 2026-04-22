// Google 인증 관련 코드 제거 (사용자 지시 — 2026-04-22).
// 인증은 firebase.ts의 익명 자동 로그인 + LoginScreen의 PIN 검증으로 대체.
// 향후 Google/이메일 auth 설계 시 이 파일에서 재구현.

export function useAuth() {
  return {
    user: null,
    userProfile: null,
    authLoading: false,
    signInWithGoogle: async () => { console.warn("[AUTH] Google sign-in 미구현"); },
    signOut: async () => { console.warn("[AUTH] sign-out 미구현"); },
    saveDisplayName: async (_name: string) => { console.warn("[AUTH] saveDisplayName 미구현"); },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children as any;
}
