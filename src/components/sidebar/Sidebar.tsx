import React, { useState } from "react";
import { createPortal } from "react-dom";
import { PROJ_PALETTE } from "../../constants";
import { Filters, Team } from "../../types";
import { Project } from "../../types";
import { topProjects, childProjects, getChildIds } from "../../utils";
import { FolderIcon, UserIcon, BoltIcon, CheckCircleIcon, MagnifyingGlassIcon, EyeIcon, EyeSlashIcon, StarIcon, StarOutlineIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon, ChevronRightIcon, ChevronLeftIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, AdjustmentsHorizontalIcon, ICON_SM } from "../ui/Icons";

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
  teams: Team[];
  selectedTeamId: string | null;
}

export function Sidebar({
  search, setSearch, filters, togF,
  todos, aProj, members, pris, priC, stats, stC,
  favSidebar, togFavSidebar, isFav, gPr,
  setChipAdd, setChipVal, setChipColor, projects,
  hiddenProjects, toggleHideProject,
  hiddenMembers, toggleHideMember,
  teams, selectedTeamId,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  // 사이드바 완전 접기 — true 시 32px 띠로 축소, 펼치기 버튼만 표시
  const [sidebarMin, setSidebarMin] = useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [fixedPos, setFixedPos] = useState<{left:number;width:number}>({left:0,width:196});
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [showHiddenProj, setShowHiddenProj] = useState(false);
  const [showHiddenMem, setShowHiddenMem] = useState(false);
  // 섹션별 접기/펼치기 상태 (우선순위·상태는 기본 접힘)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({pri: true, st: true});
  // 섹션별 정렬 모드: fav(즐겨찾기순) | name(이름순) | count(건수순)
  const [sectionSort, setSectionSort] = useState<Record<string, 'fav' | 'name' | 'count'>>({});
  // 정렬 팝업 열림 섹션 키 + 팝업 위치 (position:fixed — overflow:hidden 우회)
  const [sortPopupOpen, setSortPopupOpen] = useState<string | null>(null);
  const [sortPopupPos, setSortPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // 팝업 외부 클릭 시 닫기
  React.useEffect(() => {
    if (!sortPopupOpen) return;
    const close = () => setSortPopupOpen(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [sortPopupOpen]);


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

  const W_BASE = 300;
  // sidebarMin 시 32px 띠로 축소, 아닐 때 expanded 여부로 300/400px 결정
  const W = sidebarMin ? 32 : (expanded ? 400 : W_BASE);
  // 확장 시 왼쪽으로 커지도록 음수 마진 적용 — 최소화 시에는 마진 0
  const mLeft = sidebarMin ? 0 : (expanded ? -(400 - W_BASE) : 0);

  const gridStyle = {} as const;

  // Google Tasks 스타일: 활성=#e8f0fe+#1a73e8, hover=#f1f3f4
  const itemBg = (sel: boolean, hk: string) => {
    if (sel) return "#e8f0fe";
    if (hoverKey === hk) return "#f1f3f4";
    return "transparent";
  };

  const itemStyle = (sel: boolean, hk: string): React.CSSProperties => ({
    display: "flex", alignItems: "center",
    gap: 5,
    padding: "2px 14px",
    cursor: "pointer",
    background: itemBg(sel, hk),
    color: sel ? "#1a73e8" : "#475569",
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
  // 이름 정규화 — 제로 폭 문자·유니코드·공백 차이를 제거하여 동일 이름 중복 방지
  const normName = (s: string | undefined | null) => (s || "").replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u200E\u200F\u2060\u2028\u2029]/g, "").trim().normalize("NFC");
  // 팀 선택 시: 팀 소속 멤버(members prop)만 표시
  // 전체 보기 시: 업무 담당자 + 설정 멤버 합산
  const rawMembers = selectedTeamId
    ? members
    : todos.map((t: any) => t.who).concat(members);
  // 정규화 후 중복 제거 — 원본 이름(첫 등장 기준) 유지
  const normMap = new Map<string, string>();
  rawMembers.forEach((m: string) => { if (m) { const n = normName(m); if (!normMap.has(n)) normMap.set(n, m); } });
  const allMembers = [...normMap.values()];
  const visibleMembers = allMembers.filter(m => !hiddenMembers.includes(m));
  const hiddenMemberList = allMembers.filter(m => hiddenMembers.includes(m));

  // 팀별 그룹 인덱스 사용 여부 — 전체보기(selectedTeamId=null) + 팀 2개 이상일 때만
  const useTeamGroup = !selectedTeamId && teams.length >= 2;
  // 팀별 접기/펼치기 상태
  const [teamCollapsed, setTeamCollapsed] = useState<Record<string, boolean>>({});
  const toggleTeamCollapse = (teamId: string) => setTeamCollapsed(prev => ({ ...prev, [teamId]: !prev[teamId] }));

  // 프로젝트를 트리형으로 구성 — 팀별 그룹 인덱스 포함
  type ProjItem = { v: string; l: string; c?: string; n: number; indent?: boolean; childIds?: number[]; teamHeader?: { id: string; name: string; color: string; total: number; collapsed: boolean } };
  const projItems: ProjItem[] = [];

  // 프로젝트를 팀별로 그룹핑하는 헬퍼
  const addProjTree = (p: any) => {
    const children = childProjects(visibleAProj, p.id);
    const allIds = getChildIds(visibleAProj, p.id);
    const totalN = todos.filter(t => allIds.includes(t.pid) && t.st !== "완료").length;
    projItems.push({ v: String(p.id), l: p.name, c: p.color, n: totalN, childIds: allIds });
    children.forEach(ch => {
      projItems.push({ v: String(ch.id), l: ch.name, c: ch.color, n: todos.filter(t => t.pid === ch.id && t.st !== "완료").length, indent: true });
    });
  };

  if (useTeamGroup) {
    // 각 팀별로 소속 프로젝트 그룹핑
    const assignedProjIds = new Set<number>();
    teams.forEach(team => {
      // 이 팀 소속 프로젝트 (상위만, 세부는 상위에 따라감)
      const teamTopProjs = topProjects(visibleAProj).filter(p => team.projectIds.includes(p.id));
      if (teamTopProjs.length === 0) return;
      // 팀 소속 전체 업무 수
      const teamProjIds = teamTopProjs.flatMap(p => getChildIds(visibleAProj, p.id));
      const teamTotal = todos.filter(t => teamProjIds.includes(t.pid) && t.st !== "완료").length;
      const collapsed = !!teamCollapsed[team.id];
      // 팀 그룹 헤더
      projItems.push({ v: `__team_${team.id}`, l: team.name, c: team.color, n: teamTotal, teamHeader: { id: team.id, name: team.name, color: team.color, total: teamTotal, collapsed } });
      // 접혀있지 않으면 프로젝트 표시
      if (!collapsed) {
        teamTopProjs.forEach(p => { addProjTree(p); assignedProjIds.add(p.id); });
      } else {
        teamTopProjs.forEach(p => assignedProjIds.add(p.id));
      }
    });
    // 팀에 미배정된 프로젝트
    const unassigned = topProjects(visibleAProj).filter(p => !assignedProjIds.has(p.id));
    if (unassigned.length > 0) {
      const uIds = unassigned.flatMap(p => getChildIds(visibleAProj, p.id));
      const uTotal = todos.filter(t => uIds.includes(t.pid) && t.st !== "완료").length;
      projItems.push({ v: "__team_unassigned", l: "미배정", c: "#94a3b8", n: uTotal, teamHeader: { id: "__unassigned", name: "미배정", color: "#94a3b8", total: uTotal, collapsed: !!teamCollapsed["__unassigned"] } });
      if (!teamCollapsed["__unassigned"]) {
        unassigned.forEach(p => addProjTree(p));
      }
    }
  } else {
    // 팀 그룹 없이 flat 트리
    topProjects(visibleAProj).forEach(p => addProjTree(p));
  }

  // 담당자도 팀별 그룹핑
  type WhoItem = { v: string; l: string; n: number; c?: string; teamHeader?: { id: string; name: string; color: string; total: number; collapsed: boolean } };
  const whoItems: WhoItem[] = [];
  if (useTeamGroup) {
    const assignedMembers = new Set<string>();
    teams.forEach(team => {
      const teamMembers = visibleMembers.filter(m => team.members.some(tm => normName(tm.name) === normName(m)));
      if (teamMembers.length === 0) return;
      const collapsed = !!teamCollapsed[`who_${team.id}`];
      whoItems.push({ v: `__team_who_${team.id}`, l: team.name, n: teamMembers.length, c: team.color, teamHeader: { id: `who_${team.id}`, name: team.name, color: team.color, total: teamMembers.length, collapsed } });
      if (!collapsed) {
        teamMembers.forEach(m => {
          whoItems.push({ v: m, l: m, n: todos.filter((t: any) => t.who === m && t.st !== "완료").length });
          assignedMembers.add(m);
        });
      } else {
        teamMembers.forEach(m => assignedMembers.add(m));
      }
    });
    const unassignedMembers = visibleMembers.filter(m => !assignedMembers.has(m));
    if (unassignedMembers.length > 0) {
      const collapsed = !!teamCollapsed["who___unassigned"];
      whoItems.push({ v: "__team_who_unassigned", l: "미배정", n: unassignedMembers.length, c: "#94a3b8", teamHeader: { id: "who___unassigned", name: "미배정", color: "#94a3b8", total: unassignedMembers.length, collapsed } });
      if (!collapsed) {
        unassignedMembers.forEach(m => {
          whoItems.push({ v: m, l: m, n: todos.filter((t: any) => t.who === m && t.st !== "완료").length });
        });
      }
    }
  } else {
    visibleMembers.forEach(m => {
      whoItems.push({ v: m, l: m, n: todos.filter((t: any) => t.who === m && t.st !== "완료").length });
    });
  }

  const sections: [React.ReactNode, string, string, ProjItem[], boolean][] = [
    [<FolderIcon style={ICON_SM} />, "프로젝트", "proj", projItems, true],
    [<UserIcon style={ICON_SM} />, "담당자", "who", whoItems as any, true],
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
      {sidebarMin ? (
        /* ── 완전 접힘 상태 — 32px 띠, 펼치기 버튼만 표시 ── */
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:12,gap:8,flex:1}}>
          {activeCount > 0 && (
            <span style={{fontSize:10,fontWeight:700,color:"#fff",background:"#2563eb",borderRadius:99,padding:"1px 5px",minWidth:16,textAlign:"center",lineHeight:1.5}}>
              {activeCount}
            </span>
          )}
          <button
            onClick={() => setSidebarMin(false)}
            title="필터 펼치기"
            style={{background:"none",border:"none",cursor:"pointer",padding:6,color:"#94a3b8",display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:6,transition:"color .12s"}}
            onMouseEnter={e=>{e.currentTarget.style.color="#334155";(e.currentTarget.querySelector("svg") as SVGElement|null)?.setAttribute("stroke-width","2.5");}}
            onMouseLeave={e=>{e.currentTarget.style.color="#94a3b8";(e.currentTarget.querySelector("svg") as SVGElement|null)?.setAttribute("stroke-width","1.5");}}
          ><ChevronDoubleRightIcon style={{width:14,height:14}}/></button>
        </div>
      ) : <>
      {/* ── 즐겨찾기 ── */}
      <div style={{ padding: "8px 14px 6px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        <div
          onClick={() => togF("fav", "")}
          onMouseEnter={() => setHoverKey("fav")}
          onMouseLeave={() => setHoverKey(null)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 2px", cursor: "pointer", background: filters.fav ? "#e8f0fe" : hoverKey === "fav" ? "#f1f3f4" : "transparent", borderRadius: 6, fontSize: 12, color: filters.fav ? "#1a73e8" : "#475569", fontWeight: filters.fav ? 600 : 400, userSelect: "none", transition: "background .1s" }}>
          <span style={{ display: "inline-flex", alignItems: "center", lineHeight: 1 }}>{filters.fav ? <StarIcon style={ICON_SM}/> : <StarOutlineIcon style={ICON_SM}/>}</span>
          <span style={{ flex: 1 }}>즐겨찾기</span>
          <span style={{ fontSize: 10, color: filters.fav ? "#1a73e8" : "#80868b", background: filters.fav ? "#e8f0fe" : "transparent", borderRadius: 99, padding: "0 5px", fontWeight: filters.fav ? 600 : 400, flexShrink: 0 }}>{todos.filter(t => isFav(t.id)).length}</span>
        </div>
      </div>

      {/* ── 필터 헤더: 뱃지 + 확장/접기 — 프로젝트 바로 위 ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px 6px", borderBottom: "1px solid #e2e8f0", flexShrink: 0,
      }}>
        {/* 왼쪽: 필터 레이블 + 활성 뱃지 + 너비 조절 버튼 */}
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
          {/* 너비 조절: 196px ↔ 300px */}
          <button
            onClick={() => setExpanded(e => !e)}
            title={expanded ? "필터 좁히기" : "필터 넓히기"}
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
        {/* 오른쪽: 섹션 모두 접기/펼치기 + 완전 닫기 (Google 패널 닫기 패턴) */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* 완전 닫기 — 사이드바를 32px 띠로 축소 */}
          <button
            onClick={() => setSidebarMin(true)}
            title="필터 닫기"
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
            <ChevronDoubleLeftIcon style={{ width: 12, height: 12 }} />
          </button>
          {/* 섹션 콘텐츠 일괄 접기/펼치기 — 각 섹션 헤더의 ▲/▼ 와 동일한 우측 끝 위치 */}
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

          // 선택된 정렬 모드에 따라 정렬 (기본: 즐겨찾기순)
          const sortMode = sectionSort[key] || 'fav';
          const sortedItems = [...items].sort((a, b) => {
            if (sortMode === 'name') {
              // 이름순 — 한글 가나다 순
              return a.l.localeCompare(b.l, 'ko');
            }
            if (sortMode === 'count') {
              // 건수순 — 미완료 업무 많은 순
              return b.n - a.n;
            }
            // 즐겨찾기순 — 고정된 항목이 상단에
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
                style={{ display: "flex", alignItems: "center", padding: "8px 10px 6px 14px", gap: 6, cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ fontSize: 13, display: "inline-flex", color: "#5f6368" }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#5f6368", flex: 1, letterSpacing: ".3px", textTransform: "uppercase" }}>{label}</span>
                {selCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#1a73e8", borderRadius: 99, padding: "1px 5px", lineHeight: 1.4 }}>
                    {selCount}
                  </span>
                )}
                {/* 정렬 버튼 — 클릭 시 미니 팝업 (position:fixed로 overflow:hidden 우회) */}
                <button
                  onMouseDown={e => e.stopPropagation()} // 외부클릭 닫기 핸들러와 충돌 방지
                  onClick={e => {
                    e.stopPropagation(); // 섹션 접기 클릭과 분리
                    if (sortPopupOpen === key) { setSortPopupOpen(null); return; }
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
                    // zoom 보정 후 버튼 바로 아래 위치
                    setSortPopupPos({ top: rect.bottom / zoom + 4, left: rect.left / zoom });
                    setSortPopupOpen(key);
                    // 섹션이 접혀 있으면 같이 펼치기
                    if (collapsed[key]) setCollapsed(prev => ({ ...prev, [key]: false }));
                  }}
                  title={`정렬: ${sortMode === 'fav' ? '즐겨찾기순' : sortMode === 'name' ? '이름순' : '가장많은순'}`}
                  style={{
                    background: sortPopupOpen === key ? "#e8f0fe" : "none",
                    border: "none", borderRadius: 4,
                    cursor: "pointer", padding: "2px 4px",
                    color: sortPopupOpen === key ? "#1a73e8" : "#94a3b8",
                    lineHeight: 1, display: "inline-flex", alignItems: "center",
                    transition: "color .12s, background .12s", flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (sortPopupOpen !== key) { e.currentTarget.style.color = "#5f6368"; e.currentTarget.style.background = "#f1f3f4"; } }}
                  onMouseLeave={e => { if (sortPopupOpen !== key) { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "none"; } }}
                >
                  <AdjustmentsHorizontalIcon style={{ width: 12, height: 12 }} />
                </button>
                <span data-collapse-icon style={{ display: "inline-flex", alignItems: "center" }}>
                  {collapsed[key]
                    ? <ChevronDownIcon style={{ width: 12, height: 12, color: "#94a3b8", transition: "color .12s" }} />
                    : <ChevronUpIcon style={{ width: 12, height: 12, color: "#94a3b8", transition: "color .12s" }} />}
                </span>
              </div>

              {/* 정렬 미니 팝업 — createPortal로 document.body에 렌더링하여 overflow 잘림 완전 방지 */}
              {sortPopupOpen === key && createPortal(
                <div
                  onMouseDown={e => e.stopPropagation()} // 팝업 내부 클릭 시 닫힘 방지
                  style={{
                    position: "fixed",
                    top: sortPopupPos.top, left: sortPopupPos.left,
                    zIndex: 9999,
                    background: "#fff",
                    border: "1px solid #dadce0",
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,.15)",
                    padding: "4px 0",
                    minWidth: 120,
                    fontFamily: "'Pretendard', system-ui, sans-serif",
                  }}
                >
                  {(['fav', 'name', 'count'] as const).map(mode => {
                    const isActive = (sectionSort[key] || 'fav') === mode;
                    const labels = { fav: '즐겨찾기순', name: '이름순', count: '건수순' };
                    return (
                      <div
                        key={mode}
                        onClick={() => { setSectionSort(prev => ({ ...prev, [key]: mode })); setSortPopupOpen(null); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 12px",
                          fontSize: 12, color: "#1f1f1f", cursor: "pointer",
                          background: isActive ? "#f1f3f4" : "transparent",
                          transition: "background .1s",
                          fontWeight: isActive ? 600 : 400,
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "#f1f3f4"; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                      >
                        {/* 선택된 항목에 체크 마크 */}
                        <span style={{ width: 12, textAlign: "center", color: "#1a73e8", fontSize: 11, flexShrink: 0 }}>
                          {isActive ? "✓" : ""}
                        </span>
                        {labels[mode]}
                      </div>
                    );
                  })}
                </div>,
                document.body
              )}

              {!collapsed[key] && <><div style={gridStyle}>
                  {/* 전체 */}
                  <div
                    onClick={() => togF(key, "")}
                    onMouseEnter={() => setHoverKey(`${key}_all`)}
                    onMouseLeave={() => setHoverKey(null)}
                    style={itemStyle(allEmpty, `${key}_all`)}
                  >
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>전체</span>
                    <span style={{ fontSize: 10, color: allEmpty ? "#1a73e8" : "#80868b", background: allEmpty ? "#e8f0fe" : "transparent", borderRadius: 99, padding: "0 5px", fontWeight: allEmpty ? 600 : 400, flexShrink: 0 }}>
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
                      <span style={{ fontSize: 10, color: sel ? "#1a73e8" : "#80868b", background: sel ? "#e8f0fe" : "transparent", borderRadius: 99, padding: "0 5px", fontWeight: sel ? 600 : 400, flexShrink: 0 }}>{unassignedCnt}</span>
                    </div>
                  ); })()}

                  {/* 개별 항목 */}
                  {sortedItems.map(it => {
                    // 팀 그룹 헤더 렌더링
                    const th = (it as any).teamHeader;
                    if (th) {
                      // 접힌 그룹 안에 활성 필터가 있는지 확인
                      const hasActiveInGroup = th.collapsed && sortedItems.some((si: any) => !si.teamHeader && selVals.includes(si.v));
                      return (
                        <div key={it.v}
                          onClick={() => toggleTeamCollapse(th.id)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px 3px", fontSize: 10, fontWeight: 700, color: "#94a3b8", cursor: "pointer", userSelect: "none", marginTop: 4 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: th.color, flexShrink: 0 }} />
                          <span>{th.name}</span>
                          {hasActiveInGroup && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2563eb", flexShrink: 0 }} />}
                          <span style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                          <span style={{ fontSize: 9, color: "#cbd5e1", fontWeight: 400 }}>{th.total}건</span>
                          <span style={{ fontSize: 7, color: "#cbd5e1", transition: "transform .2s", display: "inline-block", transform: th.collapsed ? "none" : "rotate(90deg)" }}>&#9654;</span>
                        </div>
                      );
                    }
                    const isItemFav = (favSidebar[key] || []).includes(it.v);
                    // 상위 프로젝트: 자신 또는 하위 중 하나라도 선택되어 있으면 활성 표시
                    const sel = (it as any).childIds
                      ? (it as any).childIds.some((cid: number) => selVals.includes(String(cid)))
                      : selVals.includes(it.v);
                    const hk = `${key}_${it.v}`;
                    const isHovered = hoverKey === hk;
                    // 상위 클릭 시 하위 전체 토글
                    const handleClick = () => {
                      if ((it as any).childIds && key === "proj") {
                        // 상위 프로젝트 클릭: 하위 전체 ID를 필터에 토글
                        const ids = (it as any).childIds as number[];
                        ids.forEach(cid => {
                          const sv = String(cid);
                          // 현재 상태가 전부 선택이면 전부 해제, 아니면 전부 선택
                          if (sel) togF(key, sv); // 해제
                          else if (!selVals.includes(sv)) togF(key, sv); // 선택
                        });
                      } else {
                        togF(key, it.v);
                      }
                    };
                    return (
                      <div
                        key={it.v}
                        onClick={handleClick}
                        onMouseEnter={() => setHoverKey(hk)}
                        onMouseLeave={() => setHoverKey(null)}
                        title={it.l}
                        style={{
                          ...itemStyle(sel, hk),
                          // 세부 프로젝트 들여쓰기
                          ...((it as any).indent ? { paddingLeft: 32, fontSize: 11 } : {}),
                          // 상위 프로젝트 볼드
                          ...((it as any).childIds && key === "proj" ? { fontWeight: 600 } : {}),
                        }}
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
                        <span style={{ fontSize: 10, color: sel ? "#1a73e8" : "#80868b", background: sel ? "#e8f0fe" : "transparent", borderRadius: 99, padding: "0 4px", fontWeight: sel ? 600 : 400, flexShrink: 0 }}>{it.n}</span>
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
      </>}

    </div>
    {/* ── 필터 초기화 — 화면 하단 fixed (완전 접힘 시 숨김) ── */}
    {!sidebarMin && <div style={{
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
    </div>}
    </>
  );
}
