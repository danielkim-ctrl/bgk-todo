import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Filters, Project } from "../../types";
import { XMarkIcon, ICON_SM } from "../ui/Icons";

// ── SidebarDrawer ─────────────────────────────────────────────────────────────
// 모바일 전용 사이드바 Drawer.
// 기존 Sidebar 컴포넌트를 그대로 재사용하여 슬라이드인/아웃 애니메이션으로 감싼다.
// 햄버거 버튼 탭 → 좌측에서 Drawer 슬라이드인
// Drawer 외부(딤 영역) 탭 또는 X 버튼 → 닫기

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  // 아래 props는 Sidebar 컴포넌트와 동일
  search: string;
  setSearch: (v: string) => void;
  filters: Filters;
  togF: (k: string, v: string) => void;
  todos: any[];
  aProj: Project[];
  members: string[];
  pris: string[];
  priC: Record<string, string>;
  stats: string[];
  stC: Record<string, string>;
  favSidebar: Record<string, string[]>;
  togFavSidebar: (key: string, val: string) => void;
  isFav: (id: number) => boolean;
  gPr: (id: number) => Project;
  setChipAdd: (v: string | null) => void;
  setChipVal: (v: string) => void;
  setChipColor: (v: string) => void;
  projects: Project[];
  hiddenProjects: number[];
  toggleHideProject: (id: number) => void;
  hiddenMembers: string[];
  toggleHideMember: (name: string) => void;
}

export function SidebarDrawer({ open, onClose, ...sidebarProps }: SidebarDrawerProps) {
  // Drawer 열린 동안 배경 스크롤 차단
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* 딤 배경 — 탭 시 닫기 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.45)",
          zIndex: 300,
          // open 상태에 따라 opacity 전환
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .25s ease",
        }}
      />

      {/* Drawer 패널 — 좌측 슬라이드인 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(320px, 80vw)",
          background: "#fff",
          zIndex: 301,
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 20px rgba(0,0,0,.12)",
          fontFamily: "'Pretendard', system-ui, sans-serif",
          // open 상태에 따라 translateX 전환
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .25s ease",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer 헤더 — 제목 + 닫기 버튼 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 8px",
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
          background: "#172f5a",
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>필터 & 탐색</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,.8)",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              lineHeight: 1,
            }}
            aria-label="닫기"
          >
            <XMarkIcon style={{ ...ICON_SM, width: 20, height: 20 }} />
          </button>
        </div>

        {/* 기존 Sidebar 컴포넌트 그대로 사용 */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Sidebar {...sidebarProps} />
        </div>
      </div>
    </>
  );
}
