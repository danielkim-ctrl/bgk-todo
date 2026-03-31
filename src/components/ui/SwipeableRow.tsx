import { useRef, useState } from "react";
import { CheckIcon, TrashIcon } from "./Icons";

// ── SwipeableRow ───────────────────────────────────────────────────────────────
// 모바일 터치 스와이프 제스처 행 컴포넌트.
// 스와이프 좌(←): 초록 배경 "완료" 노출 → 80px 이상 이동 시 완료 처리
// 스와이프 우(→): 빨간 배경 "삭제" 노출 → 80px 이상 이동 시 삭제
// 80px 미만이면 원위치로 스냅백

interface SwipeableRowProps {
  children: React.ReactNode;
  onComplete: () => void;
  onDelete: () => void;
  /** 이미 완료 처리된 항목은 스와이프 비활성화 */
  isDone?: boolean;
}

const THRESHOLD = 80; // 액션 발동 최소 스와이프 거리 (px)
const MAX_SWIPE = 100; // 최대 스와이프 거리 — 너무 많이 당기지 않도록

export function SwipeableRow({ children, onComplete, onDelete, isDone = false }: SwipeableRowProps) {
  const [offsetX, setOffsetX] = useState(0); // 현재 translateX 값
  const startX = useRef<number | null>(null);  // 터치 시작 X 좌표
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    // 스와이프 범위 제한 (좌: -MAX, 우: +MAX)
    const clamped = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, delta));
    // 완료된 항목은 왼쪽(완료) 스와이프만 막음, 오른쪽(삭제)은 허용
    if (isDone && clamped < 0) return;
    setOffsetX(clamped);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (offsetX <= -THRESHOLD) {
      // 좌로 충분히 스와이프 → 완료 처리
      onComplete();
    } else if (offsetX >= THRESHOLD) {
      // 우로 충분히 스와이프 → 삭제 처리
      onDelete();
    }
    // 항상 원위치로 스냅백
    setOffsetX(0);
    startX.current = null;
  };

  // 진행도에 따라 배경 투명도 조절
  const leftProgress = Math.min(1, Math.abs(offsetX) / THRESHOLD); // 완료(좌)
  const rightProgress = Math.min(1, offsetX / THRESHOLD);          // 삭제(우)

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* 완료 배경 (좌 스와이프 시 노출) */}
      <div style={{
        position: "absolute", inset: 0,
        background: `rgba(22,163,74,${leftProgress * 0.9})`,
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        paddingRight: 20,
        opacity: offsetX < 0 ? 1 : 0,
        transition: offsetX === 0 ? "opacity .2s" : "none",
      }}>
        <CheckIcon style={{ width: 24, height: 24, color: "#fff" }} />
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 6 }}>완료</span>
      </div>

      {/* 삭제 배경 (우 스와이프 시 노출) */}
      <div style={{
        position: "absolute", inset: 0,
        background: `rgba(220,38,38,${rightProgress * 0.9})`,
        display: "flex", alignItems: "center", justifyContent: "flex-start",
        paddingLeft: 20,
        opacity: offsetX > 0 ? 1 : 0,
        transition: offsetX === 0 ? "opacity .2s" : "none",
      }}>
        <TrashIcon style={{ width: 22, height: 22, color: "#fff" }} />
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 6 }}>삭제</span>
      </div>

      {/* 실제 카드 내용 — translateX로 이동 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? "transform .2s ease" : "none",
          position: "relative",
          zIndex: 1,
          // 스와이프 중 텍스트 선택 방지
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
