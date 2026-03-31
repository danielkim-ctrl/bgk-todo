import { useState, useEffect } from "react";

// ── useMediaQuery ─────────────────────────────────────────────────────────────
// CSS media query 결과를 React state로 반환한다.
// 브라우저 창 크기가 바뀔 때마다 자동으로 갱신된다.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// ── 사전 정의된 브레이크포인트 훅 ─────────────────────────────────────────────
// 768px 이하 = 모바일, 769px 이상 = 데스크톱

/** 현재 화면이 모바일(768px 이하)인지 여부 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}
