import { useState } from "react";
import { isOD, dDay, fD } from "../../utils";
import { SwipeableRow } from "../ui/SwipeableRow";
import { RepeatBadge } from "../ui/RepeatBadge";
import { S } from "../../styles";

// ── ListCards ──────────────────────────────────────────────────────────────────
// 모바일 전용 카드형 리스트 뷰.
// 데스크톱의 테이블 레이아웃 대신 카드 형태로 각 업무를 표시한다.
// SwipeableRow를 이용해 좌 스와이프 = 완료, 우 스와이프 = 삭제 제스처를 지원한다.

interface ListCardsProps {
  sorted: any[];
  gPr: (pid: number) => any;
  priC: Record<string, string>;
  priBg: Record<string, string>;
  stC: Record<string, string>;
  stBg: Record<string, string>;
  isFav: (id: number) => boolean;
  showDone: boolean;
  setShowDone: (v: boolean | ((p: boolean) => boolean)) => void;
  onCardTap: (todo: any) => void;    // 카드 탭 → 상세/편집 바텀 시트
  onComplete: (id: number) => void;  // 완료 처리
  onDelete: (id: number) => void;    // 삭제
  /** 검색어 + 활성 필터 수 (헤더에 표시) */
  search: string;
  setSearch: (v: string) => void;
  activeFilterCount: number;
  onFilterOpen: () => void;          // 필터 바텀 시트 열기
  filters: any;
  togF: (key: string, val: string) => void;
}

export function ListCards({
  sorted, gPr, priC, priBg, stC, stBg, isFav,
  showDone, setShowDone,
  onCardTap, onComplete, onDelete,
  search, setSearch,
  activeFilterCount, onFilterOpen, filters, togF,
}: ListCardsProps) {
  // 완료 항목 접힘 상태
  const [doneExpanded, setDoneExpanded] = useState(false);

  const activeTodos = sorted.filter(t => t.st !== "완료");
  const doneTodos   = sorted.filter(t => t.st === "완료");

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* 검색 + 필터 버튼 바 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색"
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              border: "1.5px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "inherit",
              background: "#fff",
              outline: "none",
              boxSizing: "border-box" as const,
              color: "#1a2332",
            }}
          />
          {/* 검색 돋보기 아이콘 */}
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94a3b8" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}>✕</button>
          )}
        </div>
        {/* 필터 버튼 */}
        <button
          onClick={onFilterOpen}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "9px 12px",
            border: activeFilterCount > 0 ? "1.5px solid #2563eb" : "1.5px solid #e2e8f0",
            borderRadius: 10,
            background: activeFilterCount > 0 ? "#eff6ff" : "#fff",
            color: activeFilterCount > 0 ? "#2563eb" : "#64748b",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "inherit",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z"/>
          </svg>
          필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
        </button>
      </div>

      {/* 활성 필터 칩 (가로 스크롤) */}
      {activeFilterCount > 0 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 4, WebkitOverflowScrolling: "touch" as any }}>
          {(filters.proj || []).map((v: string) => (
            <button key={`proj-${v}`} onClick={() => togF("proj", v)}
              style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 99, border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              {v} ✕
            </button>
          ))}
          {(filters.who || []).map((v: string) => (
            <button key={`who-${v}`} onClick={() => togF("who", v)}
              style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 99, border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              {v} ✕
            </button>
          ))}
          {(filters.pri || []).map((v: string) => (
            <button key={`pri-${v}`} onClick={() => togF("pri", v)}
              style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 99, border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              {v} ✕
            </button>
          ))}
          {(filters.st || []).map((v: string) => (
            <button key={`st-${v}`} onClick={() => togF("st", v)}
              style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 99, border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              {v} ✕
            </button>
          ))}
        </div>
      )}

      {/* 활성 업무 카드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activeTodos.length === 0 && doneTodos.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
            업무가 없습니다
          </div>
        )}
        {activeTodos.map(todo => (
          <TodoCard
            key={todo.id}
            todo={todo}
            gPr={gPr}
            priC={priC}
            priBg={priBg}
            stC={stC}
            stBg={stBg}
            isFav={isFav}
            onTap={() => onCardTap(todo)}
            onComplete={() => onComplete(todo.id)}
            onDelete={() => onDelete(todo.id)}
          />
        ))}
      </div>

      {/* 완료 항목 — 하단에 접힘 */}
      {doneTodos.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setDoneExpanded(p => !p)}
            style={{
              width: "100%", padding: "10px 14px",
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, color: "#64748b",
              fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg style={{ width: 14, height: 14, color: "#16a34a" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            완료 {doneTodos.length}건
            <span style={{ marginLeft: "auto", fontSize: 11 }}>{doneExpanded ? "▲ 접기" : "▼ 펼치기"}</span>
          </button>
          {doneExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {doneTodos.map(todo => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  gPr={gPr}
                  priC={priC}
                  priBg={priBg}
                  stC={stC}
                  stBg={stBg}
                  isFav={isFav}
                  onTap={() => onCardTap(todo)}
                  onComplete={() => onComplete(todo.id)}
                  onDelete={() => onDelete(todo.id)}
                  isDone
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 개별 카드 ──────────────────────────────────────────────────────────────────
function TodoCard({
  todo, gPr, priC, priBg, stC, stBg, isFav,
  onTap, onComplete, onDelete, isDone = false,
}: {
  todo: any;
  gPr: (pid: number) => any;
  priC: Record<string, string>;
  priBg: Record<string, string>;
  stC: Record<string, string>;
  stBg: Record<string, string>;
  isFav: (id: number) => boolean;
  onTap: () => void;
  onComplete: () => void;
  onDelete: () => void;
  isDone?: boolean;
}) {
  const proj = gPr(todo.pid);
  const od = isOD(todo.due, todo.st);
  const dd = dDay(todo.due, todo.st);

  return (
    <SwipeableRow onComplete={onComplete} onDelete={onDelete} isDone={isDone}>
      <div
        onClick={onTap}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "12px 14px",
          boxShadow: S.shadow.sm,
          border: `1px solid ${od ? "#fecaca" : "#e2e8f0"}`,
          borderLeft: `4px solid ${priC[todo.pri] || "#94a3b8"}`,
          opacity: isDone ? 0.65 : 1,
          cursor: "pointer",
          minHeight: 64,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* 상단: 프로젝트 칩 + 우선순위 + 상태 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" as const }}>
          {proj?.name && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 99, padding: "2px 8px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: proj.color, flexShrink: 0, display: "inline-block" }} />
              {proj.name}
            </span>
          )}
          <span style={{ ...S.badge(priBg[todo.pri] || "#f1f5f9", priC[todo.pri] || "#64748b") as React.CSSProperties, fontSize: 11 }}>
            {todo.pri}
          </span>
          <span style={{ ...S.badge(stBg[todo.st] || "#f1f5f9", stC[todo.st] || "#64748b") as React.CSSProperties, fontSize: 11 }}>
            {todo.st}
          </span>
          <RepeatBadge repeat={todo.repeat} />
        </div>

        {/* 업무명 */}
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: isDone ? "#94a3b8" : "#1a2332",
          textDecoration: isDone ? "line-through" : "none",
          // 최대 2줄 말줄임
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as any,
          overflow: "hidden",
          lineHeight: 1.45,
          marginBottom: 8,
        }}>
          {todo.task}
        </div>

        {/* 하단: 담당자 · 마감 · D-day */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
          <span style={{ fontWeight: 500 }}>{todo.who}</span>
          {todo.due && (
            <>
              <span style={{ color: "#cbd5e1" }}>·</span>
              <span style={{ color: od ? "#dc2626" : "#64748b", fontWeight: od ? 700 : 400 }}>
                {fD(todo.due)}
              </span>
              {dd && (
                <span style={{ fontSize: 11, fontWeight: 700, color: dd.color, background: dd.bg, border: `1px solid ${dd.border}`, padding: "0 5px", borderRadius: 4 }}>
                  {dd.label}
                </span>
              )}
            </>
          )}
          {typeof todo.pct === "number" && todo.pct > 0 && (
            <>
              <span style={{ color: "#cbd5e1" }}>·</span>
              <span>{todo.pct}%</span>
            </>
          )}
        </div>
      </div>
    </SwipeableRow>
  );
}
