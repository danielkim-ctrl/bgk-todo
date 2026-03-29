import React, { useState } from "react";
import { PROJ_PALETTE } from "../../constants";
import { Filters } from "../../types";
import { Project } from "../../types";
import { FolderIcon, UserIcon, BoltIcon, CheckCircleIcon, MagnifyingGlassIcon, EyeIcon, EyeSlashIcon, StarIcon, StarOutlineIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon, ChevronRightIcon, ChevronLeftIcon, ICON_SM } from "../ui/Icons";

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
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [fixedPos, setFixedPos] = useState<{left:number;width:number}>({left:0,width:196});
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [showHiddenProj, setShowHiddenProj] = useState(false);
  const [showHiddenMem, setShowHiddenMem] = useState(false);
  // 섹션별 접기/펼치기 상태 (우선순위·상태는 기본 접힘)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({pri: true, st: true});


  // 사이드바 위치·크기 추적 — fixed 플로팅 버튼 정렬용
  React.useEffect(() => {
    const update = () => {
      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
        setFixedPos({ left: rect.left / zoom, width: rect.width / zoom });
      }
    };
    update();
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    if (sidebarRef.current) ro.observe(sidebarRef.current);
    return () => { window.removeEventListener("resize", update); ro.disconnect(); };
  }, [expanded]);

  // B5: 활성 필터 총 개수
  const activeCount =
    filters.proj.length + filters.who.length + filters.pri.length +
    filters.st.length + filters.repeat.length + (filters.fav ? 1 : 0) + (search ? 1 : 0);

  const W_BASE = 196;
  const W = expanded ? 300 : W_BASE;
  // 확장 시 왼쪽으로 커지도록 음수 마진 적용 — 메인 콘텐츠가 밀리지 않음
  const mLeft = expanded ? -(300 - W_BASE) : 0;

  const gridStyle = {} as const;

  // B4: 호버 배경 + 선택 배경
  const itemBg = (sel: boolean, hk: string) => {
    if (sel) return "#eff6ff";
    if (hoverKey === hk) return "#f8fafc";
    return "transparent";
  };

  const itemStyle = (sel: boolean, hk: string): React.CSSProperties => ({
    display: "flex", alignItems: "center",
    gap: 5,
    padding: "2px 14px",
    cursor: "pointer",
    background: itemBg(sel, hk),
    color: sel ? "#2563eb" : "#475569",
    fontWeight: sel ? 600 : 400,
    fontSize: 12,
    userSelect: "none",
    overflow: "hidden",
    borderRadius: 6,
    margin: "0",
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

  const sections: [React.ReactNode, string, string, { v: string; l: string; c?: string; n: number }[], boolean][] = [
    [<FolderIcon style={ICON_SM} />, "프로젝트", "proj",
      visibleAProj.map(p => ({ v: String(p.id), l: p.name, c: p.color, n: todos.filter(t => t.pid === p.id && t.st !== "완료").length })),
      true],
    [<UserIcon style={ICON_SM} />, "담당자", "who",
      visibleMembers.map(n => ({ v: n, l: n, n: todos.filter((t: any) => t.who === n && t.st !== "완료").length })),
      true],
    [<BoltIcon style={ICON_SM} />, "우선순위", "pri",
      pris.map(p => ({ v: p, l: p, c: priC[p], n: todos.filter((t: any) => t.pri === p && t.st !== "완료").length })),
      false],
    [<CheckCircleIcon style={ICON_SM} />, "상태", "st",
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
    <div ref={sidebarRef} style={{
      width: W, flexShrink: 0, background: "#fff", borderRadius: 10,
      border: "1px solid #e2e8f0", position: "sticky", top: 92,
      marginLeft: mLeft,
      height: "calc(100vh - 104px)", boxShadow: "0 1px 3px rgba(0,0,0,.07)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      /* 필터 초기화 플로팅 기준 */
      transition: "width .2s ease, margin-left .2s ease",
    }}>
      {/* ── 검색 — 최상단 고정 ── */}
      <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", display: "flex" }}><MagnifyingGlassIcon style={ICON_SM} /></span>
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="검색..."
            style={{ width: "100%", padding: "6px 30px 6px 26px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 11, outline: "none", boxSizing: "border-box", background: "#f8fafc" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", background: "#94a3b8", border: "none", borderRadius: "50%", width: 14, height: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
              <XMarkIcon style={{width:10,height:10,color:"#fff"}}/>
            </button>
          )}
        </div>
      </div>

      {/* ── 즐겨찾기 ── */}
      <div style={{ padding: "8px 14px 6px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        <div
          onClick={() => togF("fav", "")}
          onMouseEnter={() => setHoverKey("fav")}
          onMouseLeave={() => setHoverKey(null)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", cursor: "pointer", background: filters.fav ? "#fefce8" : hoverKey === "fav" ? "#f8fafc" : "transparent", borderRadius: 6, fontSize: 12, color: filters.fav ? "#b45309" : "#475569", fontWeight: filters.fav ? 700 : 400, userSelect: "none", transition: "background .1s" }}>
          <span style={{ display: "inline-flex", alignItems: "center", lineHeight: 1 }}>{filters.fav ? <StarIcon style={ICON_SM}/> : <StarOutlineIcon style={ICON_SM}/>}</span>
          <span style={{ flex: 1 }}>즐겨찾기</span>
          <span style={{ fontSize: 10, color: filters.fav ? "#d97706" : "#94a3b8", background: filters.fav ? "#fde68a" : "#f1f5f9", borderRadius: 99, padding: "0 5px", fontWeight: 600, flexShrink: 0 }}>{todos.filter(t => isFav(t.id)).length}</span>
        </div>
      </div>

      {/* ── 필터 헤더: 뱃지 + 확장/접기 — 프로젝트 바로 위 ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px 6px", borderBottom: "1px solid #e2e8f0", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", letterSpacing: 0 }}>
            필터
          </span>
          {activeCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#fff",
              background: "#2563eb", borderRadius: 99, padding: "1px 5px",
              lineHeight: 1.4, minWidth: 14, textAlign: "center",
            }}>
              {activeCount}
            </span>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            title={expanded ? "필터 접기" : "필터 확장"}
            style={{
              background: "none", border: "none", borderRadius: 6,
              cursor: "pointer", padding: "3px 6px",
              color: expanded ? "#2563eb" : "#94a3b8",
              lineHeight: 1, display: "inline-flex", alignItems: "center",
              transition: "color .12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#334155"; (e.currentTarget.querySelector("svg") as SVGElement|null)?.setAttribute("stroke-width","2.5"); }}
            onMouseLeave={e => { e.currentTarget.style.color = expanded ? "#2563eb" : "#94a3b8"; (e.currentTarget.querySelector("svg") as SVGElement|null)?.setAttribute("stroke-width","1.5"); }}
          >
            {expanded ? <ChevronLeftIcon style={{ width: 12, height: 12 }} /> : <ChevronRightIcon style={{ width: 12, height: 12 }} />}
          </button>
        </div>
        <button
          onClick={() => {
            const keys = ["proj","who","pri","st"];
            const allCollapsed = keys.every(k => collapsed[k]);
            setCollapsed(allCollapsed ? {} : Object.fromEntries(keys.map(k => [k, true])));
          }}
          title={Object.values(collapsed).filter(Boolean).length >= 4 ? "모두 펼치기" : "모두 접기"}
          style={{
            background: "none", border: "none", borderRadius: 6,
            cursor: "pointer", padding: "3px 6px",
            color: "#94a3b8",
            lineHeight: 1, display: "inline-flex", alignItems: "center",
            transition: "color .12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#334155"; (e.currentTarget.querySelector("svg") as SVGElement|null)?.setAttribute("stroke-width","2.5"); }}
          onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; (e.currentTarget.querySelector("svg") as SVGElement|null)?.setAttribute("stroke-width","1.5"); }}
        >
          {Object.values(collapsed).filter(Boolean).length >= 4
            ? <ChevronDownIcon style={{ width: 12, height: 12 }} />
            : <ChevronUpIcon style={{ width: 12, height: 12 }} />}
        </button>
      </div>

      <div className="sidebar-scroll" style={{ flex: 1, overflowY: "scroll", scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent", paddingBottom: 44 }}>
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
            <div key={key} style={{ borderBottom: "1px solid #e2e8f0" }}>
              {/* 섹션 헤더 — 클릭으로 접기/펼치기 */}
              <div
                onClick={() => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
                onMouseEnter={e => { const svg = e.currentTarget.querySelector("[data-collapse-icon] svg") as SVGElement|null; if(svg){svg.setAttribute("stroke-width","2.5");svg.style.color="#334155";} }}
                onMouseLeave={e => { const svg = e.currentTarget.querySelector("[data-collapse-icon] svg") as SVGElement|null; if(svg){svg.setAttribute("stroke-width","1.5");svg.style.color="#94a3b8";} }}
                style={{ display: "flex", alignItems: "center", padding: "8px 14px 6px", gap: 6, cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ fontSize: 13, display: "inline-flex", color: "#64748b" }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", flex: 1 }}>{label}</span>
                {selCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#2563eb", borderRadius: 99, padding: "1px 5px", lineHeight: 1.4 }}>
                    {selCount}
                  </span>
                )}
                <span data-collapse-icon style={{ display: "inline-flex", alignItems: "center" }}>
                  {collapsed[key]
                    ? <ChevronDownIcon style={{ width: 12, height: 12, color: "#94a3b8", transition: "color .12s" }} />
                    : <ChevronUpIcon style={{ width: 12, height: 12, color: "#94a3b8", transition: "color .12s" }} />}
                </span>
              </div>

              {!collapsed[key] && <><div style={gridStyle}>
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
                        <button
                          onClick={e => { e.stopPropagation(); togFavSidebar(key, it.v); }}
                          title={isItemFav ? "고정 해제" : "상단 고정"}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", lineHeight: 1, color: isItemFav ? "#f59e0b" : "#d1d5db", flexShrink: 0, transition: "color .12s" }}
                          onMouseEnter={e => { e.stopPropagation(); if (!isItemFav) (e.currentTarget as HTMLButtonElement).style.color = "#fbbf24"; }}
                          onMouseLeave={e => { e.stopPropagation(); if (!isItemFav) (e.currentTarget as HTMLButtonElement).style.color = "#d1d5db"; }}
                        >{isItemFav ? <StarIcon style={{width:12,height:12}}/> : <StarOutlineIcon style={{width:12,height:12}}/>}</button>
                        {it.c && <span style={{ width: 8, height: 8, borderRadius: "50%", background: it.c, flexShrink: 0, display: "inline-block" }} />}
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.l}</span>
                        {/* 숨기기 버튼 (프로젝트·담당자) — 숫자 앞, 호버 시 표시 */}
                        {canHide && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (key === "proj") toggleHideProject(Number(it.v));
                              else toggleHideMember(it.v);
                            }}
                            title="이 항목을 모든 뷰에서 숨깁니다"
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", lineHeight: 1, color: "#94a3b8", flexShrink: 0, transition: "color .12s", visibility: isHovered ? "visible" : "hidden" }}
                            onMouseEnter={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                            onMouseLeave={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                          ><EyeSlashIcon style={ICON_SM} /></button>
                        )}
                        <span style={{ fontSize: 10, color: sel ? "#93c5fd" : "#94a3b8", background: sel ? "#dbeafe" : "#f1f5f9", borderRadius: 99, padding: "0 4px", fontWeight: 500, flexShrink: 0 }}>{it.n}</span>
                      </div>
                    );
                  })}
              </div>

              {(key === "proj" || key === "who") && (
                <div style={{ padding: "4px 14px 8px" }}>
                  <button
                    onClick={() => {
                      setChipAdd(key); setChipVal("");
                      const used = projects.map((pr: { color: string }) => pr.color);
                      setChipColor(key === "proj" ? (PROJ_PALETTE.find(c => !used.includes(c)) || PROJ_PALETTE[0]) : "#8b5cf6");
                    }}
                    style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", padding: "2px 0", cursor: "pointer", transition: "color .15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#2563eb"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                  >+ {key === "proj" ? "프로젝트" : "담당자"} 추가</button>
                </div>
              )}
              </>}
            </div>
          );
        })}

        {/* ── 숨겨진 프로젝트 복원 ── */}
        {hiddenProjList.length > 0 && (
          <div style={{ borderBottom: "1px solid #e2e8f0" }}>
            <div
              onClick={() => setShowHiddenProj(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px 4px", cursor: "pointer" }}
            >
              <span style={{ fontSize: 11, display: "inline-flex", color: "#cbd5e1" }}><EyeSlashIcon style={{width:12,height:12}} /></span>
              <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", flex: 1 }}>숨겨진 프로젝트</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#fff", background: "#cbd5e1", borderRadius: 99, padding: "1px 5px", lineHeight: 1.4 }}>{hiddenProjList.length}</span>
              <span style={{ fontSize: 9, color: "#cbd5e1", marginLeft: 2 }}>{showHiddenProj ? "▲" : "▼"}</span>
            </div>
            {showHiddenProj && (
              <div style={{ paddingBottom: 4 }}>
                {hiddenProjList.map(p => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoverKey(`hidden_proj_${p.id}`)}
                    onMouseLeave={() => setHoverKey(null)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 14px", fontSize: 10, color: "#94a3b8", background: hoverKey === `hidden_proj_${p.id}` ? "#f8fafc" : "transparent", borderRadius: 6, margin: 0, transition: "background .1s" }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0, display: "inline-block", opacity: 0.5 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <button
                      onClick={() => toggleHideProject(p.id)}
                      title="숨기기 해제"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", lineHeight: 1, color: "#94a3b8", flexShrink: 0, transition: "color .12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#2563eb"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                    ><EyeIcon style={ICON_SM} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 숨겨진 담당자 복원 ── */}
        {hiddenMemberList.length > 0 && (
          <div style={{ borderBottom: "1px solid #e2e8f0" }}>
            <div
              onClick={() => setShowHiddenMem(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px 4px", cursor: "pointer" }}
            >
              <span style={{ fontSize: 11, display: "inline-flex", color: "#cbd5e1" }}><EyeSlashIcon style={{width:12,height:12}} /></span>
              <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", flex: 1 }}>숨겨진 담당자</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#fff", background: "#cbd5e1", borderRadius: 99, padding: "1px 5px", lineHeight: 1.4 }}>{hiddenMemberList.length}</span>
              <span style={{ fontSize: 9, color: "#cbd5e1", marginLeft: 2 }}>{showHiddenMem ? "▲" : "▼"}</span>
            </div>
            {showHiddenMem && (
              <div style={{ paddingBottom: 4 }}>
                {hiddenMemberList.map(m => (
                  <div
                    key={m}
                    onMouseEnter={() => setHoverKey(`hidden_mem_${m}`)}
                    onMouseLeave={() => setHoverKey(null)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 14px", fontSize: 10, color: "#94a3b8", background: hoverKey === `hidden_mem_${m}` ? "#f8fafc" : "transparent", borderRadius: 6, margin: 0, transition: "background .1s" }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m}</span>
                    <button
                      onClick={() => toggleHideMember(m)}
                      title="숨기기 해제"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: "0 2px", lineHeight: 1, color: "#94a3b8", flexShrink: 0, transition: "color .12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#2563eb"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                    ><EyeIcon style={ICON_SM} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


    </div>
    {/* ── 필터 초기화 — 화면 하단 fixed ── */}
    <div style={{
      position: "fixed", bottom: 16, left: fixedPos.left,
      width: fixedPos.width, zIndex: 50, boxSizing: "border-box",
      padding: "8px 14px", background: "rgba(255,255,255,.95)",
      backdropFilter: "blur(6px)", borderRadius: 10,
      boxShadow: "0 -2px 12px rgba(0,0,0,.08)",
      border: "1px solid #e2e8f0",
    }}>
      <button
        onClick={() => { setSearch(""); togF("__reset__", ""); }}
        style={{
          width: "100%", padding: "6px", fontSize: 11,
          color: hasActiveFilter ? "#2563eb" : "#94a3b8",
          background: hasActiveFilter ? "#eff6ff" : "transparent",
          border: `1px solid ${hasActiveFilter ? "#bfdbfe" : "#e2e8f0"}`,
          borderRadius: 6, cursor: "pointer",
          fontWeight: hasActiveFilter ? 600 : 400, transition: "all .15s",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
        }}
      ><XMarkIcon style={{width:12,height:12}}/> 필터 초기화</button>
    </div>
    </>
  );
}
