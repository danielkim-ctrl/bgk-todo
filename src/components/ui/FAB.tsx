// ── FAB (Floating Action Button) ──────────────────────────────────────────────
// 모바일 전용 플로팅 업무 추가 버튼.
// 화면 우하단에 고정되며, 하단 탭 바 위에 배치된다.
// 탭 시 업무 추가 바텀 시트 열기 콜백을 호출한다.

import { PlusIcon } from "./Icons";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        // 하단 탭 바(56px) + safe-area + 여백 위에 배치
        bottom: "calc(56px + env(safe-area-inset-bottom) + 12px)",
        right: 16,
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(37,99,235,.45)",
        zIndex: 150,
        // 터치 하이라이트 제거
        WebkitTapHighlightColor: "transparent",
        transition: "transform .12s, box-shadow .12s",
        fontFamily: "'Pretendard', system-ui, sans-serif",
      }}
      onPointerDown={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(37,99,235,.35)";
      }}
      onPointerUp={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(37,99,235,.45)";
      }}
      aria-label="새 업무 추가"
    >
      <PlusIcon style={{ width: 26, height: 26 }} />
    </button>
  );
}
