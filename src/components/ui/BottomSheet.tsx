import { useEffect, useRef, useState } from "react";

// ── BottomSheet ────────────────────────────────────────────────────────────────
// 모바일 전용 바텀 시트 컴포넌트.
// 데스크톱 모달 대신 모바일에서 사용하며, 화면 하단에서 슬라이드업 된다.
// - 드래그 핸들을 위로 드래그하면 전체화면 확장
// - 아래로 빠르게 드래그하면 닫힘
// - 배경 딤 탭 시 닫힘
// - ESC 키로 닫힘

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** 시트 제목 (선택) */
  title?: string;
  /** 시트 내용 */
  children: React.ReactNode;
  /** 전체 높이 모드로 시작 여부 (기본: false = 50vh) */
  fullHeight?: boolean;
  /** 시트 최대 높이 비율 (기본: 90vh) */
  maxHeight?: string;
}

export function BottomSheet({ open, onClose, title, children, fullHeight = false, maxHeight = "90vh" }: BottomSheetProps) {
  // 전체화면 확장 상태
  const [expanded, setExpanded] = useState(fullHeight);
  // 드래그 시작 Y 좌표
  const dragStartY = useRef<number | null>(null);
  // 시트 DOM 요소 참조
  const sheetRef = useRef<HTMLDivElement>(null);

  // open 상태 변경 시 expanded 초기화
  useEffect(() => {
    if (open) setExpanded(fullHeight);
  }, [open, fullHeight]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // 시트가 열려 있는 동안 배경 스크롤 차단
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // 드래그 핸들 터치/마우스 이벤트 — 위로 드래그 = 확장, 아래로 빠르게 드래그 = 닫기
  const onDragStart = (clientY: number) => { dragStartY.current = clientY; };
  const onDragEnd = (clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - clientY; // 양수 = 위로 드래그
    if (delta > 60) setExpanded(true);           // 위로 60px 이상 → 확장
    else if (delta < -80) onClose();              // 아래로 80px 이상 → 닫기
    dragStartY.current = null;
  };

  if (!open) return null;

  const sheetHeight = expanded ? maxHeight : (fullHeight ? maxHeight : "60vh");

  return (
    // 배경 딤 — 탭 시 닫기
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        // 딤 영역 탭 감지
      }}
      onClick={onClose}
    >
      {/* 시트 본체 — 딤 클릭이 시트 내부로 전파되지 않도록 stopPropagation */}
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "16px 16px 0 0",
          maxHeight: sheetHeight,
          height: fullHeight || expanded ? sheetHeight : "auto",
          minHeight: 120,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -4px 20px rgba(0,0,0,.12)",
          transition: "max-height .25s ease",
          fontFamily: "'Pretendard', system-ui, sans-serif",
        }}
      >
        {/* 드래그 핸들 영역 */}
        <div
          style={{ padding: "12px 0 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0, cursor: "grab", flexShrink: 0 }}
          onMouseDown={e => onDragStart(e.clientY)}
          onMouseUp={e => onDragEnd(e.clientY)}
          onTouchStart={e => onDragStart(e.touches[0].clientY)}
          onTouchEnd={e => onDragEnd(e.changedTouches[0].clientY)}
        >
          {/* 드래그 핸들 선 */}
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e2e8f0" }} />
        </div>

        {/* 헤더 (제목이 있을 때만) */}
        {title && (
          <div style={{ padding: "4px 20px 12px", flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2332" }}>{title}</div>
          </div>
        )}

        {/* 내용 영역 — 스크롤 가능 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
