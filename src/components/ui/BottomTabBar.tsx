// ── BottomTabBar ──────────────────────────────────────────────────────────────
// 모바일 전용 하단 탭 바.
// 데스크톱의 상단 nav 탭을 대체한다.
// 현재 뷰를 강조(solid 아이콘)하고 나머지는 outline 아이콘으로 표시한다.
// iPhone 홈 인디케이터(safe-area-inset-bottom)를 고려해 패딩을 확보한다.

import { ChartBarIcon, ListBulletIcon, CalendarIcon, ViewColumnsIcon } from "./Icons";

interface BottomTabBarProps {
  view: string;
  onViewChange: (v: string) => void;
  /** 칸반 필터 적용 개수 (배지 표시용) */
  kanbanFilterCount?: number;
}

// 각 탭 정의 — 아이콘은 현재 아이콘 매핑 표 기준
const TABS: { key: string; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: "dashboard", label: "대시보드", Icon: ChartBarIcon },
  { key: "list",      label: "리스트",   Icon: ListBulletIcon },
  { key: "calendar",  label: "캘린더",   Icon: CalendarIcon },
  { key: "kanban",    label: "칸반",     Icon: ViewColumnsIcon },
];

export function BottomTabBar({ view, onViewChange, kanbanFilterCount = 0 }: BottomTabBarProps) {
  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      // iPhone 홈 인디케이터 영역만큼 추가 패딩 — safe-area-inset-bottom
      paddingBottom: "env(safe-area-inset-bottom)",
      background: "#fff",
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "stretch",
      zIndex: 200,
      boxShadow: "0 -1px 4px rgba(0,0,0,.06)",
      fontFamily: "'Pretendard', system-ui, sans-serif",
    }}>
      {TABS.map(({ key, label, Icon }) => {
        const active = view === key;
        return (
          <button
            key={key}
            onClick={() => { onViewChange(key); window.scrollTo(0, 0); }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "4px 0",
              position: "relative",
              fontFamily: "inherit",
              // 터치 하이라이트 제거 (CSS는 index.css에서 처리하지만 inline 보험용)
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon style={{
              width: 22,
              height: 22,
              color: active ? "#2563eb" : "#94a3b8",
              // 활성 탭은 stroke 두껍게 — visual emphasis
              strokeWidth: active ? 2 : 1.5,
              transition: "color .12s",
            }} />
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 400,
              color: active ? "#2563eb" : "#94a3b8",
              lineHeight: 1,
              transition: "color .12s",
            }}>
              {label}
            </span>
            {/* 칸반 필터 적용 중 배지 */}
            {key === "kanban" && kanbanFilterCount > 0 && (
              <span style={{
                position: "absolute",
                top: 4,
                right: "calc(50% - 14px)",
                background: "#ef4444",
                color: "#fff",
                borderRadius: 99,
                fontSize: 9,
                fontWeight: 800,
                padding: "1px 4px",
                lineHeight: 1.4,
                pointerEvents: "none",
              }}>
                {kanbanFilterCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
