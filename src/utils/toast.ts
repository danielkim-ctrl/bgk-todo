import { useState, useEffect } from "react";

export type ToastAction = { label: string; fn: () => void };
export type ToastState = { m: string; t: "ok" | "err"; action?: ToastAction };

const EMPTY: ToastState = { m: "", t: "ok" };
let listeners: Array<(s: ToastState) => void> = [];
let timer: ReturnType<typeof setTimeout> | null = null;

// 어디서든 호출 가능 — React 컴포넌트 외부(Firestore 콜백 등)에서도 사용
export function flash(m: string, t: "ok" | "err" = "ok", action?: ToastAction): void {
  if (timer) { clearTimeout(timer); timer = null; }
  const next: ToastState = { m, t, action };
  listeners.forEach((l) => l(next));
  // 액션 있으면 5초 (실행 취소 클릭 여유), 없으면 2.5초
  const duration = action ? 5000 : 2500;
  timer = setTimeout(() => {
    listeners.forEach((l) => l(EMPTY));
    timer = null;
  }, duration);
}

// Toast UI 컴포넌트가 이 hook으로 현재 상태 구독
export function useToast(): ToastState {
  const [state, setState] = useState<ToastState>(EMPTY);
  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);
  return state;
}
