import React, { useState } from "react";
import { PROJ_PALETTE } from "../../constants";
import { Filters } from "../../types";
import { Project } from "../../types";

interface SidebarProps {
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

export function Sidebar({
  search, setSearch, filters, togF,
  todos, aProj, members, pris, priC, stats, stC,
  favSidebar, togFavSidebar, isFav, gPr,
  setChipAdd, setChipVal, setChipColor, projects,
  hiddenProjects, toggleHideProject,
  hiddenMembers, toggleHideMember,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [showHiddenProj, setShowHiddenProj] = useState(false);
  const [showHiddenMem, setShowHiddenMem] = useState(false);

  // B5: 활성 필터 총 개수
  const activeCount =
    filters.proj.length + filters.who.length + filters.pri.length +
    filters.st.length + filters.repeat.length + (filters.fav ? 1 : 0) + (search ? 1 : 0);

  const W = expanded ? 300 : 196;

  const gridStyle = expanded
    ? { display: "grid", gridTemplateColumns: "1fr 1fr" } as const
    : {} as const;

  // B4: 호버 배경 + 선택 배경
  const itemBg = (sel: boolean, hk: string) => {
    if (sel) return "#eff6ff";
    if (hoverKey === hk) return "#f8fafc";
    return "transparent";
  };

  const itemStyle = (sel: boolean, hk: string): React.CSSProperties => ({
    display: "flex", alignItems: "center",
    gap: expanded ? 3 : 5,
    padding: expanded ? "4px 6px" : "4px 8px 4px 6px",
    cursor: "pointer",
    background: itemBg(sel, hk),
    color: sel ? "#2563eb" : "#475569",
    fontWeight: sel ? 600 : 400,
    fontSize: 12,
    userSelect: "none",
    overflow: "hidden",
    borderRadius: 6,
    margin: expanded ? "0 2px 2px" : "0 0 1px",
    transition: "background .1s",
  });

  const hasActiveFilter = !!(search || filters.proj.length || filters.who.length ||
    filters.pri.length || filters.st.length || filters.repeat.length || filters.fav);

  // 숨겨진 항목 제외
  const visibleAProj = aProj.filter(p => !hiddenProjects.includes(p.id));
  const hiddenProjList = aProj.filter(p => hiddenProjects.includes(p.id));
  const allMembers = [...new Set(todos.map((t: any) => t.who).concat(members))];
  const visibleMembers = allMembers.filter(m => !hiddenMembers.includes(m));
  const hiddenMemberList = allMembers.filter(m => hiddenMembers.includes(m));

  const sections: [string, string, string, { v: string; l: string; c?: string; n: number }[], boolean][] = [
    ["📁", "프로젝트", "proj",
      visibleAProj.map(p => ({ v: String(p.id), l: p.name, c: p.color, n: todos.filter(t => t.pid === p.id && t.st !== "완료").length })),
      true],
    ["👤", "담당자", "who",
      visibleMembers.map(n => ({ v: n, l: n, n: todos.filter((t: any) => t.who === n && t.st !== "완료").length })),
      true],
    ["🔴", "우선순위", "pri",
      pris.map(p => ({ v: p, l: p, c: priC[p], n: todos.filter((t: any) => t.pri === p && t.st !== "완료").length })),
      false],
    ["📊", "상태", "st",
      stats.map(s => ({ v: s, l: s, c: stC[s], n: todos.filter((t: any) => t.st === s).length })),
      false],
  ];

  return (
    <>
    <style>{`
      .sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
      .sidebar-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
      .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `}</style>
    <div style={{
      width: W, flexShrink: 0, background: "#fff", borderRadius: 10,
      border: "1px solid #e8edf4", position: "sticky", top: 100,
      maxHeight: "calc(100vh - 112px)", boxShadow: "0 1px 3px rgba(0,0,0,.07)",
      display: "flex", flexDirection: "column",
      transition: "width .2s ease",
    }}>
      {/* ── 헤더: B5 활성 필터 뱃지 + 확장/접기 ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 10px 6px", borderBottom: "1px solid #f1f5f9", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase" }}>
            필터
          </span>
          {activeCount > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: "#fff",
              background: "#2563eb", borderRadius: 99, padding: "1px 5px",
              lineHeight: 1.4, minWidth: 14, textAlign: "center",
            }}>
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          title={expanded ? "필터 접기" : "필터 확장"}
          style={{
            background: "none", border: "1px solid transparent", borderRadius: 5,
            cursor: "pointer", padding: "3px 7px",
            fontSize: 13, fontWeight: 700,
            color: expanded ? "#2563eb" : "#94a3b8",
            lineHeight: 1, transition: "all .15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLButtonElement).style.color = "#334155"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = expanded ? "#2563eb" : "#94a3b8"; }}
        >
          {expanded ? "‹" : "›"}
        </button>
      </div>

      <div className="sidebar-scroll" style={{ flex: 1, overflowY: "scroll", scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
        {/* ── 검색 ── */}
        <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12, pointerEvents: "none" }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)} placeholder="검색..."
              style={{ width: "100%", padding: "6px 24px 6px 26px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 11, outline: "none", boxSizing: "border-box", background: "#f8fafc" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", background: "#94a3b8", border: "none", borderRadius: "50%", width: 14, height: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>✕</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 즐겨찾기 ── */}
        <div style={{ padding: "8px 10px 4px", borderBottom: "1px solid #f1f5f9" }}>
          <div
            onClick={() => togF("fav", "")}
            onMouseEnter={() => setHoverKey("fav")}
            onMouseLeave={() => setHoverKey(null)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", cursor: "pointer", background: filters.fav ? "#fefce8" : hoverKey === "fav" ? "#f8fafc" : "transparent", borderRadius: 6, fontSize: 12, color: filters.fav ? "#b45309" : "#475569", fontWeight: filters.fav ? 700 : 400, userSelect: "none", transition: "background .1s" }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{filters.fav ? "★" : "☆"}</span>
            <span style={{ flex: 1 }}>즐겨찾기</span>
            <span style={{ fontSize: 10, color: filters.fav ? "#d97706" : "#94a3b8", background: filters.fav ? "#fde68a" : "#f1f5f9", borderRadius: 99, padding: "0 5px", fontWeight: 600, flexShrink: 0 }}>{todos.filter(t => isFav(t.id)).length}</span>
          </div>
        </div>

        {/* ── 필터 섹션 ── */}
        {sections.map(([icon, label, key, items, canHide]) => {
          const selVals = filters[key as keyof Filters] as string[];
          const selCount = selVals.length;
          const allEmpty = selCount === 0;
          const baseList = key === "st" ? todos : todos.filter((t: any) => t.st !== "완료");
          const unassignedCnt = key === "proj"
            ? baseList.filter(t => gPr(t.pid).id === 0).length
            : baseList.filter((t: any) => !(t as any)[key]).length;

          const sortedItems = [...items].sort((a, b) => {
            const fa = (favSidebar[key] || []).includes(a.v) ? 0 : 1;
            const fb = (favSidebar[key] || []).includes(b.v) ? 0 : 1;
            return fa - fb;
          });

          return (
            <div key={key} style={{ borderBottom: "1px solid #f9fafb" }}>
              {/* 섹션 헤더 */}
              <div style={{ display: "flex", alignItems: "center", padding: "9px 12px 4px", gap: 5 }}>
                <span style={{ fontSize: 11 }}>{icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, flex: 1 }}>{label}</span>
                {selCount > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#2563eb", borderRadius: 99, padding: "1px 5px", lineHeight: 1.4 }}>
                    {selCount}
                  </span>
                )}
              </div>

              <div style={gridStyle}>
                  {/* 전체 */}
                  <div
                    onClick={() => togF(key, "")}
                    onMouseEnter={() => setHoverKey(`${key}_all`)}
                    onMouseLeave={() => setHoverKey(null)}
                    style={itemStyle(allEmpty, `${key}_all`)}
                  >
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>전체</span>
                    <span style={{ fontSize: 10, color: allEmpty ? "#93c5fd" : "#94a3b8", background: allEmpty ? "#dbeafe" : "#f1f5f9", borderRadius: 99, padding: "0 5px", fontWeight: 600, flexShrink: 0 }}>
                      {key === "st" ? todos.length : todos.filter(t => t.st !== "완료").length}
                    </span>
                  </div>

                  {/* 미배정 */}
                  {(()=>{ const sel = selVals.includes("__none__"); const hk = `${key}_none`; return (
                    <div
                      onClick={() => togF(key, "__none__")}
                      onMouseEnter={() => setHoverKey(hk)}
                      onMouseLeave={() => setHoverKey(null)}
                      style={itemStyle(sel, hk)}
                      title="담당자·프로젝트 없는 항목"
                    >
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>미배정</span>
                      <span style={{ fontSize: 10, color: sel ? "#93c5fd" : "#94a3b8", background: sel ? "#dbeafe" : "#f1f5f9", borderRadius: 99, padding: "0 5px", fontWeight: 600, flexShrink: 0 }}>{unassignedCnt}</span>
                    </div>
                  ); })()}

                  {/* 개별 항목 */}
                  {sortedItems.map(it => {
                    const isItemFav = (favSidebar[key] || []).includes(it.v);
                    const sel = selVals.includes(it.v);
                    const hk = `${key}_${it.v}`;
                    const isHovered = hoverKey === hk;
                    return (
                      <div
                        key={it.v}
                        onClick={() => togF(key, it.v)}
                        onMouseEnter={() => setHoverKey(hk)}
                        onMouseLeave={() => setHoverKey(null)}
                        title={it.l}
                        style={itemStyle(sel, hk)}
                      >
                        {!expanded && (
                          <button
                            onClick={e => { e.stopPropagation(); togFavSidebar(key, it.v); }}
                            title={isItemFav ? "고정 해제" : "상단 고정"}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", lineHeight: 1, color: isItemFav ? "#f59e0b" : "#d1d5db", flexShrink: 0, transition: "color .12s" }}
                            onMouseEnter={e => { e.stopPropagation(); if (!isItemFav) (e.currentTarget as HTMLButtonElement).style.color = "#fbbf24"; }}
                            onMouseLeave={e => { e.stopPropagation(); if (!isItemFav) (e.currentTarget as HTMLButtonElement).style.color = "#d1d5db"; }}
                          >{isItemFav ? "★" : "☆"}</button>
                        )}
                        {it.c && <span style={{ width: 6, height: 6, borderRadius: "50%", background: it.c, flexShrink: 0, display: "inline-block" }} />}
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.l}</span>
                        {/* 숨기기 버튼 (프로젝트·담당자) — 숫자 앞, 호버 시 표시 */}
                        {canHide && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (key === "proj") toggleHideProject(Number(it.v));
                              else toggleHideMember(it.v);
                            }}
                            title={key === "proj" ? "이 프로젝트 숨기기" : "이 담당자 숨기기"}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", lineHeight: 1, color: "#94a3b8", flexShrink: 0, transition: "color .12s", visibility: isHovered ? "visible" : "hidden" }}
                            onMouseEnter={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                            onMouseLeave={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                          >👁</button>
                        )}
                        <span style={{ fontSize: 10, color: sel ? "#93c5fd" : "#94a3b8", background: sel ? "#dbeafe" : "#f1f5f9", borderRadius: 99, padding: "0 4px", fontWeight: 500, flexShrink: 0 }}>{it.n}</span>
                      </div>
                    );
                  })}
              </div>

              {(key === "proj" || key === "who") && (
                <div style={{ padding: "2px 8px 6px" }}>
                  <button
                    onClick={() => {
                      setChipAdd(key); setChipVal("");
                      const used = projects.map((pr: { color: string }) => pr.color);
                      setChipColor(key === "proj" ? (PROJ_PALETTE.find(c => !used.includes(c)) || PROJ_PALETTE[0]) : "#8b5cf6");
                    }}
                    style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "1px dashed #d1d5db", borderRadius: 5, padding: "2px 10px", cursor: "pointer", width: "100%", transition: "all .15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLButtonElement).style.color = "#2563eb"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                  >+ 추가</button>
                </div>
              )}
            </div>
          );
        })}

        {/* ── 숨겨진 프로젝트 복원 ── */}
        {hiddenProjList.length > 0 && (
          <div style={{ borderBottom: "1px solid #f9fafb" }}>
            <div
              onClick={() => setShowHiddenProj(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 12px 6px", cursor: "pointer" }}
            >
              <span style={{ fontSize: 11 }}>🙈</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, flex: 1 }}>숨겨진 프로젝트</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#94a3b8", borderRadius: 99, padding: "1px 5px", lineHeight: 1.4 }}>{hiddenProjList.length}</span>
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 2 }}>{showHiddenProj ? "▲" : "▼"}</span>
            </div>
            {showHiddenProj && (
              <div style={{ paddingBottom: 4 }}>
                {hiddenProjList.map(p => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoverKey(`hidden_proj_${p.id}`)}
                    onMouseLeave={() => setHoverKey(null)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px 4px 14px", fontSize: 12, color: "#94a3b8", background: hoverKey === `hidden_proj_${p.id}` ? "#f8fafc" : "transparent", borderRadius: 6, margin: "0 0 1px", transition: "background .1s" }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0, display: "inline-block", opacity: 0.5 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <button
                      onClick={() => toggleHideProject(p.id)}
                      title="숨기기 해제"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", lineHeight: 1, color: "#94a3b8", flexShrink: 0, transition: "color .12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#2563eb"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                    >👁</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 숨겨진 담당자 복원 ── */}
        {hiddenMemberList.length > 0 && (
          <div style={{ borderBottom: "1px solid #f9fafb" }}>
            <div
              onClick={() => setShowHiddenMem(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 12px 6px", cursor: "pointer" }}
            >
              <span style={{ fontSize: 11 }}>🙈</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7, flex: 1 }}>숨겨진 담당자</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#94a3b8", borderRadius: 99, padding: "1px 5px", lineHeight: 1.4 }}>{hiddenMemberList.length}</span>
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 2 }}>{showHiddenMem ? "▲" : "▼"}</span>
            </div>
            {showHiddenMem && (
              <div style={{ paddingBottom: 4 }}>
                {hiddenMemberList.map(m => (
                  <div
                    key={m}
                    onMouseEnter={() => setHoverKey(`hidden_mem_${m}`)}
                    onMouseLeave={() => setHoverKey(null)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px 4px 14px", fontSize: 12, color: "#94a3b8", background: hoverKey === `hidden_mem_${m}` ? "#f8fafc" : "transparent", borderRadius: 6, margin: "0 0 1px", transition: "background .1s" }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m}</span>
                    <button
                      onClick={() => toggleHideMember(m)}
                      title="숨기기 해제"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", lineHeight: 1, color: "#94a3b8", flexShrink: 0, transition: "color .12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#2563eb"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                    >👁</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 하단: 필터 초기화 ── */}
      <div style={{ padding: "8px 10px", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
        <button
          onClick={() => { setSearch(""); togF("__reset__", ""); }}
          style={{
            width: "100%", padding: "6px", fontSize: 11,
            color: hasActiveFilter ? "#2563eb" : "#94a3b8",
            background: hasActiveFilter ? "#eff6ff" : "#f8fafc",
            border: `1px solid ${hasActiveFilter ? "#bfdbfe" : "#e2e8f0"}`,
            borderRadius: 6, cursor: "pointer",
            fontWeight: hasActiveFilter ? 600 : 400, transition: "all .15s",
          }}
        >✕ 필터 초기화</button>
      </div>
    </div>
    </>
  );
}
