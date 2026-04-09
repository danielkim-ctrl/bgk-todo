import { useState } from "react";
import { isOD, dDay, fD } from "../utils";
import { S } from "../styles";
import { RepeatBadge } from "../components/ui/RepeatBadge";

// ── KanbanMobile ───────────────────────────────────────────────────────────────
// 모바일 전용 칸반 뷰.
// 데스크톱의 4컬럼 그리드 대신 상단 탭으로 컬럼(상태)을 전환한다.
// 각 탭을 탭(tap)하면 해당 상태의 카드 목록이 아래에 표시된다.
// 카드 탭 → 상세/편집 바텀 시트 열기 (setEditMod)

interface KanbanMobileProps {
  todos: any[];
  stats: string[];
  pris: string[];
  priC: Record<string, string>;
  stC: Record<string, string>;
  stBg: Record<string, string>;
  kbF: string[];
  kbFWho: string[];
  visibleProj: any[];
  gPr: (pid: number) => any;
  updTodo: (id: number, updates: any) => void;
  setEditMod: (v: any) => void;
  flash: (msg: string, type?: string) => void;
}

export function KanbanMobile({
  todos, stats, pris, priC, stC, stBg,
  kbF, kbFWho, visibleProj, gPr, updTodo, setEditMod, flash,
}: KanbanMobileProps) {
  // 현재 선택된 컬럼(상태) 탭 — 기본은 첫 번째 상태
  const [activeTab, setActiveTab] = useState(stats[0] || "대기");

  // 현재 탭의 카드 목록 — 프로젝트/담당자 필터 적용
  const items = todos.filter(t =>
    t.st === activeTab &&
    (!kbF.length || kbF.includes(String(t.pid))) &&
    (!kbFWho.length || (t.who||[]).some((w: string) => kbFWho.includes(w)))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* 상태 탭 바 — 가로 스크롤 가능 */}
      <div style={{
        display: "flex",
        overflowX: "auto",
        gap: 0,
        borderBottom: "2px solid #e2e8f0",
        marginBottom: 12,
        WebkitOverflowScrolling: "touch" as any,
        scrollbarWidth: "none" as any,
      }}>
        {stats.map(st => {
          const count = todos.filter(t =>
            t.st === st &&
            (!kbF.length || kbF.includes(String(t.pid))) &&
            (!kbFWho.length || (t.who||[]).some((w: string) => kbFWho.includes(w)))
          ).length;
          const isActive = activeTab === st;

          return (
            <button
              key={st}
              onClick={() => setActiveTab(st)}
              style={{
                flexShrink: 0,
                padding: "10px 16px",
                border: "none",
                borderBottom: `2px solid ${isActive ? (stC[st] || "#2563eb") : "transparent"}`,
                marginBottom: -2,     // borderBottom이 부모 border와 겹치게
                background: "transparent",
                color: isActive ? (stC[st] || "#2563eb") : "#64748b",
                fontSize: 13,
                fontWeight: isActive ? 700 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                WebkitTapHighlightColor: "transparent",
                transition: "color .15s, border-color .15s",
              }}
            >
              {/* 상태 색상 도트 */}
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: stC[st] || "#94a3b8", flexShrink: 0,
              }} />
              {st}
              {/* 해당 상태 카드 수 배지 */}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "0 6px",
                borderRadius: 99, background: isActive ? (stBg[st] || "#eff6ff") : "#f1f5f9",
                color: isActive ? (stC[st] || "#2563eb") : "#94a3b8",
                lineHeight: "18px",
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 현재 탭의 카드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
            업무가 없습니다
          </div>
        ) : (
          items.map(todo => (
            <KanbanCard
              key={todo.id}
              todo={todo}
              gPr={gPr}
              priC={priC}
              onTap={() => setEditMod(todo)}
            />
          ))
        )}
      </div>

      {/* 새 업무 추가 버튼 — 현재 탭 상태로 미리 설정 */}
      <button
        onClick={() => setEditMod({ pid: "", task: "", who: "", due: "", pri: "보통", st: activeTab, det: "", repeat: "없음" })}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          marginTop: 12, padding: "12px",
          borderRadius: 10, border: `1.5px dashed ${stC[activeTab] || "#e2e8f0"}`,
          background: stBg[activeTab] ? `${stBg[activeTab]}80` : "#f8fafc",
          color: stC[activeTab] || "#64748b",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        + {activeTab} 업무 추가
      </button>
    </div>
  );
}

// ── 칸반 카드 (모바일) ────────────────────────────────────────────────────────
// 탭 시 편집 모달/바텀 시트가 열리며, 스와이프 없이 단순 카드 형태
function KanbanCard({
  todo, gPr, priC, onTap,
}: {
  todo: any;
  gPr: (pid: number) => any;
  priC: Record<string, string>;
  onTap: () => void;
}) {
  const proj = gPr(todo.pid);
  const od = isOD(todo.due, todo.st);
  const dd = dDay(todo.due, todo.st);

  return (
    <div
      onClick={onTap}
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: S.shadow.sm,
        border: `1px solid ${od ? "#fecaca" : "#e2e8f0"}`,
        borderLeft: `4px solid ${priC[todo.pri] || "#94a3b8"}`,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* 상단: 프로젝트 칩 + RepeatBadge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" as const }}>
        {proj?.name && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 11, fontWeight: 600, color: "#64748b",
            background: "#f8fafc", border: "1px solid #e2e8f0",
            borderRadius: 99, padding: "2px 8px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: proj.color, flexShrink: 0, display: "inline-block" }} />
            {proj.name}
          </span>
        )}
        <RepeatBadge repeat={todo.repeat} />
      </div>

      {/* 업무명 — 2줄 말줄임 */}
      <div style={{
        fontSize: 14, fontWeight: 600, color: "#1a2332",
        display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical" as any,
        overflow: "hidden", lineHeight: 1.45, marginBottom: 8,
      }}>
        {todo.task}
      </div>

      {/* 하단: 담당자 · 마감 · D-day */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
        <span style={{ fontWeight: 500 }}>{todo.who?.[0]||""}</span>
        {todo.due && (
          <>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <span style={{ color: od ? "#dc2626" : "#64748b", fontWeight: od ? 700 : 400 }}>
              {fD(todo.due)}
            </span>
            {dd && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: dd.color,
                background: dd.bg, border: `1px solid ${dd.border}`,
                padding: "0 5px", borderRadius: 4,
              }}>{dd.label}</span>
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
  );
}
