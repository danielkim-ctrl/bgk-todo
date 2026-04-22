import { useState } from "react";
import { S } from "../../styles";
import { avColor, avColor2, avInitials } from "../../utils/avatarUtils";
import { PROJ_PALETTE } from "../../constants";
import { Project, Team, TeamRole, TEAM_ROLE_LABELS, ALL_PERMISSIONS, TEAM_ROLE_PERMISSIONS } from "../../types";
import { topProjects, childProjects } from "../../utils";
import { UserIcon, UserGroupIcon, BoltIcon, CheckCircleIcon, Cog6ToothIcon, FolderIcon, CheckIcon, PencilSquareIcon, TrashIcon, PlusIcon, XMarkIcon, ChevronRightIcon, Bars3Icon, EyeIcon, EyeSlashIcon, ICON_SM } from "../ui/Icons";

export function SettingsMgr({
  members, setMembers,
  pris, setPris, stats, setStats,
  priC, setPriC, priBg, setPriBg,
  stC, setStC, stBg, setStBg,
  memberColors, setMemberColor,
  projects, setProjects, pNId, setPNId, onAddProj, onDelProj, onEditProj,
  todos, flash, apiKey, setApiKey,
  teams, setTeams, memberRoles, setMemberRole, memberPins, setMemberPins, generatePin, globalPermissions, setGlobalPermissions, addTeam, updTeam, delTeam,
  addTeamMember, removeTeamMember, setTeamMemberRole,
  addTeamProject, removeTeamProject, assignTodosToTeams,
}: {
  members: string[];
  setMembers: (fn: any) => void;
  pris: string[];
  setPris: (fn: any) => void;
  stats: string[];
  setStats: (fn: any) => void;
  priC: Record<string,string>;
  setPriC: (fn: any) => void;
  priBg: Record<string,string>;
  setPriBg: (fn: any) => void;
  stC: Record<string,string>;
  setStC: (fn: any) => void;
  stBg: Record<string,string>;
  setStBg: (fn: any) => void;
  memberColors: Record<string,string>;
  setMemberColor: (name: string, color: string) => void;
  projects: Project[];
  setProjects: (fn: any) => void;
  pNId: number;
  setPNId: (v: number) => void;
  onAddProj: (p: Omit<Project,"id">) => number | void;
  onDelProj: (id: number) => void;
  onEditProj: (id: number, u: Partial<Project>) => void;
  todos: any[];
  flash: (m: string, t?: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  // 팀 관리
  teams: Team[];
  setTeams: (fn: any) => void;
  memberRoles: Record<string, TeamRole>;
  setMemberRole: (name: string, role: TeamRole) => void;
  memberPins: Record<string, string>;
  setMemberPins: (fn: any) => void;
  generatePin: () => string;
  globalPermissions: Record<TeamRole, string[]> | null;
  setGlobalPermissions: (v: Record<TeamRole, string[]> | null) => void;
  addTeam: (name: string, color: string) => string;
  updTeam: (id: string, u: Partial<Team>) => void;
  delTeam: (id: string) => void;
  addTeamMember: (teamId: string, name: string, role?: TeamRole) => void;
  removeTeamMember: (teamId: string, name: string) => void;
  setTeamMemberRole: (teamId: string, name: string, role: TeamRole) => void;
  addTeamProject: (teamId: string, pid: number) => void;
  removeTeamProject: (teamId: string, pid: number) => void;
  assignTodosToTeams: () => void;
}) {
  const [tab, setTab] = useState("members");
  const [nv, setNv] = useState("");
  const [nc, setNc] = useState("#8b5cf6");
  const [delConfirm, setDelConfirm] = useState<{value: string; tab: string} | null>(null);
  const [keyDraft, setKeyDraft] = useState(apiKey || "");
  // 공통 드래그 정렬 상태
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // 프로젝트 탭용 신규 프로젝트 상태
  const usedColors = projects.map(p => p.color);
  const nextColor = PROJ_PALETTE.find(c => !usedColors.includes(c)) || PROJ_PALETTE[0];
  const [projNm, setProjNm] = useState("");
  const [projCo, setProjCo] = useState(nextColor);
  const [showHiddenProj, setShowHiddenProj] = useState(false);
  const [projTeamId, setProjTeamId] = useState("");

  // ── 공통 스타일 토큰 — 모든 탭에서 동일하게 적용 ──────────────────────────
  const tS = (a: boolean): React.CSSProperties => ({
    padding: "12px 18px", fontSize: 14, fontWeight: a ? 600 : 500,
    color: a ? "#2563eb" : "#64748b",
    background: a ? "#eff6ff" : "transparent",
    border: "none", borderBottom: a ? "2px solid #2563eb" : "2px solid transparent",
    cursor: "pointer", fontFamily: "inherit", transition: "color .12s",
  });
  // 목록 행 공통 스타일
  const ROW: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", background: "#fff", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 14, marginBottom: 5,
    transition: "background .1s",
  };
  // 텍스트 입력 공통 스타일
  const INP: React.CSSProperties = {
    flex: 1, padding: "10px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit",
  };
  // 추가 버튼 공통 스타일
  const BTN_ADD: React.CSSProperties = {
    background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff",
    border: "none", padding: "10px 18px", borderRadius: 8,
    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };
  // 색상 피커 공통 스타일
  const COLOR_PICK: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 6, cursor: "pointer",
    border: "1px solid #e2e8f0", flexShrink: 0, padding: 0,
  };
  // 섹션 라벨 공통 스타일
  const SEC_LABEL: React.CSSProperties = {
    fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 10,
  };
  // 아이콘 버튼 hover 핸들러
  const iconHover = (e: React.MouseEvent, enter: boolean) => {
    (e.currentTarget as HTMLElement).style.color = enter ? "#334155" : "#94a3b8";
    (e.currentTarget as HTMLElement).style.background = enter ? "#f1f5f9" : "none";
  };
  const ICON_BTN: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
    display: "inline-flex", alignItems: "center", padding: 4, borderRadius: 6,
    transition: "color .12s, background .12s",
  };
  // 원형 도트 컬러 피커 — 팀 탭과 동일한 형태
  // 원형 도트 컬러 피커 — 팀 탭의 10px 도트와 동일한 크기
  const ColorDot = ({ color, onChange }: { color: string; onChange: (c: string) => void }) => (
    <div style={{ position: "relative", width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "block", boxShadow: `0 0 0 2px ${color}33` }} />
      <input type="color" value={color} onChange={e => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, width: 20, height: 20, opacity: 0, cursor: "pointer", padding: 0, border: "none" }} />
    </div>
  );
  // 드래그 정렬 핸들러 생성 — 배열 재정렬 함수를 받아 이벤트 핸들러 반환
  const mkDrag = (idx: number, reorder: (from: number, to: number) => void) => ({
    draggable: true,
    onDragStart: () => setDragIdx(idx),
    onDragEnd: () => { setDragIdx(null); setDragOverIdx(null); },
    onDragOver: (e: React.DragEvent) => { if (dragIdx !== null && dragIdx !== idx) { e.preventDefault(); setDragOverIdx(idx); } },
    onDragLeave: () => setDragOverIdx(null),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) reorder(dragIdx, idx); setDragIdx(null); setDragOverIdx(null); },
  });
  const dragStyle = (idx: number): React.CSSProperties => ({
    opacity: dragIdx === idx ? 0.35 : 1,
    borderTop: dragOverIdx === idx && dragIdx !== idx ? "2.5px solid #2563eb" : undefined,
    transition: "opacity .15s",
  });

  const items = tab === "members" ? members : tab === "pris" ? pris : stats;

  const add = () => {
    if (!nv.trim()) return;
    const v = nv.trim();
    if (tab === "members") {
      if (!members.includes(v)) {
        setMembers((p: string[]) => [...p, v]);
        // 신규 멤버 PIN + 역할 명시적 세팅 — 기본값 editor
        // (권한이 "관리자"로 폴백되지 않고, PIN이 "------"로 남지 않도록 초기화 시점에 직접 지정)
        setMemberPins((p: any) => ({ ...p, [v]: generatePin() }));
        setMemberRole(v, "editor");
      }
      flash(`담당자 "${v}"이(가) 추가되었습니다`);
    } else if (tab === "pris") {
      if (!pris.includes(v)) { setPris((p: string[]) => [...p, v]); setPriC((p: any) => ({...p,[v]:nc})); setPriBg((p: any) => ({...p,[v]:nc+"18"})); }
      flash(`우선순위 "${v}"이(가) 추가되었습니다`);
    } else {
      if (!stats.includes(v)) { setStats((p: string[]) => [...p, v]); setStC((p: any) => ({...p,[v]:nc})); setStBg((p: any) => ({...p,[v]:nc+"18"})); }
      flash(`상태 "${v}"이(가) 추가되었습니다`);
    }
    setNv("");
  };

  const edit = (old: string) => {
    const n = prompt("이름:", old);
    if (!n || !n.trim() || n.trim() === old) return;
    const v = n.trim();
    if (tab === "members") {
      setMembers((p: string[]) => p.map((m: string) => m === old ? v : m));
      // 색상, PIN, 역할을 이전 이름에서 새 이름으로 전이
      if (memberColors[old]) setMemberColor(v, memberColors[old]);
      if (memberPins[old]) setMemberPins((p: any) => { const c = { ...p }; c[v] = c[old]; delete c[old]; return c; });
      if (memberRoles[old]) setMemberRole(v, memberRoles[old]);
      // 소속 팀의 멤버명도 변경
      teams.forEach(t => {
        const m = t.members.find(m => m.name === old);
        if (m) { removeTeamMember(t.id, old); addTeamMember(t.id, v, m.role); }
      });
    } else if (tab === "pris") {
      setPris((p: string[]) => p.map((x: string) => x === old ? v : x));
      setPriC((p: any) => { const c={...p}; c[v]=c[old]; delete c[old]; return c; });
      setPriBg((p: any) => { const c={...p}; c[v]=c[old]; delete c[old]; return c; });
    } else {
      setStats((p: string[]) => p.map((x: string) => x === old ? v : x));
      setStC((p: any) => { const c={...p}; c[v]=c[old]; delete c[old]; return c; });
      setStBg((p: any) => { const c={...p}; c[v]=c[old]; delete c[old]; return c; });
    }
    flash("변경사항이 저장되었습니다");
  };

  const tryDel = (v: string) => {
    const cnt = tab === "members"
      ? todos.filter((t: any) => (t.who||[]).includes(v)).length
      : tab === "pris"
      ? todos.filter((t: any) => t.pri === v).length
      : todos.filter((t: any) => t.st === v).length;
    if (cnt) { flash(`해당 항목을 사용 중인 업무가 ${cnt}건 있어 삭제할 수 없습니다`, "err"); return; }
    setDelConfirm({value: v, tab});
  };

  const doDel = () => {
    if (!delConfirm) return;
    const v = delConfirm.value;
    if (delConfirm.tab === "members") {
      setMembers((p: string[]) => p.filter((m: string) => m !== v));
      // 관련 데이터 정리 — 고아 레코드 방지 (PIN·역할·아바타 색상)
      setMemberPins((p: any) => { const c = { ...p }; delete c[v]; return c; });
      // 소속 팀에서도 제거
      teams.forEach(t => {
        if (t.members.some(m => m.name === v)) removeTeamMember(t.id, v);
      });
    }
    else if (delConfirm.tab === "pris") {
      setPris((p: string[]) => p.filter((x: string) => x !== v));
      setPriC((p: any) => { const c={...p}; delete c[v]; return c; });
      setPriBg((p: any) => { const c={...p}; delete c[v]; return c; });
    } else {
      setStats((p: string[]) => p.filter((x: string) => x !== v));
      setStC((p: any) => { const c={...p}; delete c[v]; return c; });
      setStBg((p: any) => { const c={...p}; delete c[v]; return c; });
    }
    flash(`"${v}"이(가) 삭제되었습니다`, "err");
    setDelConfirm(null);
  };

  const chgColor = (v: string, c: string) => {
    if (tab === "pris") { setPriC((p: any) => ({...p,[v]:c})); setPriBg((p: any) => ({...p,[v]:c+"18"})); }
    else { setStC((p: any) => ({...p,[v]:c})); setStBg((p: any) => ({...p,[v]:c+"18"})); }
  };

  // 담당자 아바타 배경 — 커스텀 색상 있으면 단색, 없으면 자동 그라디언트
  const memberAvatarBg = (name: string) =>
    memberColors[name]
      ? memberColors[name]
      : `linear-gradient(135deg,${avColor(name)},${avColor2(name)})`;

  // 좌측 메뉴 항목 정의
  const menuItems: {key:string; icon:React.ReactNode; label:string; count?:number; show?:boolean}[] = [
    {key:"teams",   icon:<UserGroupIcon style={ICON_SM}/>,   label:"팀",       count:teams.length},
    {key:"members", icon:<UserIcon style={ICON_SM}/>,        label:"담당자",   count:members.length},
    {key:"proj",    icon:<FolderIcon style={ICON_SM}/>,      label:"프로젝트", count:projects.length},
    {key:"pris",    icon:<BoltIcon style={ICON_SM}/>,        label:"우선순위", count:pris.length},
    {key:"stats",   icon:<CheckCircleIcon style={ICON_SM}/>, label:"상태",     count:stats.length},
    {key:"perms",   icon:<CheckIcon style={ICON_SM}/>,       label:"권한"},
    {key:"apikey",  icon:<Cog6ToothIcon style={ICON_SM}/>,   label:"API 키"},
  ];

  return <div style={{ display:"flex", height: "calc(80vh - 80px)", maxHeight: 800, margin: "-16px -18px -0px" }}>
    {/* ── 좌측 메뉴 ── */}
    <div style={{ width: 190, flexShrink: 0, borderRight: "1px solid #e2e8f0", padding: "14px 0", display: "flex", flexDirection: "column", gap: 2 }}>
      {menuItems.filter(m => m.show !== false).map(m => {
        const active = tab === m.key;
        return <button key={m.key} onClick={() => setTab(m.key)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 18px", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: active ? 600 : 500, fontFamily: "inherit",
            color: active ? "#2563eb" : "#475569",
            background: active ? "#eff6ff" : "transparent",
            borderRight: active ? "2px solid #2563eb" : "2px solid transparent",
            transition: "all .12s", textAlign: "left" as const, width: "100%",
          }}
          onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.color = "#334155"; }}}
          onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#475569"; }}}
        >
          {m.icon}
          <span style={{ flex: 1 }}>{m.label}</span>
          {m.count !== undefined && <span style={{ fontSize: 12, color: active ? "#2563eb" : "#94a3b8", fontWeight: 600 }}>{m.count}</span>}
        </button>;
      })}
    </div>

    {/* ── 우측 콘텐츠 — flex column으로 목록은 스크롤, 추가 영역은 하단 고정 ── */}
    <div style={{ flex: 1, padding: "14px 20px", display: "flex", flexDirection: "column", overflow: "hidden" }}>

    {/* ── 팀 탭 ── */}
    {tab==="teams"&&<TeamTab
      teams={teams} setTeams={setTeams} members={members} projects={projects}
      addTeam={addTeam} updTeam={updTeam} delTeam={delTeam}
      addTeamMember={addTeamMember} removeTeamMember={removeTeamMember} setTeamMemberRole={setTeamMemberRole}
      addTeamProject={addTeamProject} removeTeamProject={removeTeamProject}
      assignTodosToTeams={assignTodosToTeams} todos={todos} flash={flash}
    />}

    {/* ── 권한 탭 ── */}
    {tab==="perms"&&<PermsTab globalPermissions={globalPermissions} setGlobalPermissions={setGlobalPermissions}/>}

    {/* ── API 키 탭 ── */}
    {tab==="apikey"&&<div>
      <div style={{fontSize:14,color:"#64748b",marginBottom:14,lineHeight:1.6}}>Anthropic API 키를 입력하세요. 한 번 등록하면 모든 팀원이 사용할 수 있습니다.</div>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input type="password" value={keyDraft} onChange={e=>setKeyDraft(e.target.value)}
          placeholder="sk-ant-..." style={INP}/>
        <button onClick={()=>{const k=keyDraft.trim();setApiKey(k);flash("API 키가 저장되었습니다 (전체 공유)");}}
          style={BTN_ADD}>저장</button>
      </div>
      {apiKey&&<div style={{fontSize:13,color:"#16a34a",fontWeight:600,display:"flex",alignItems:"center",gap:4}}><CheckIcon style={ICON_SM}/> API 키 설정됨</div>}
    </div>}

    {/* ── 프로젝트 탭 — 팀별 그룹 + 상위/세부 트리 + 숨기기 ── */}
    {tab==="proj"&&(()=>{
      const activeProjs = projects.filter(p => p.status === "활성");
      const hiddenProjs = projects.filter(p => p.status !== "활성");

      // 프로젝트 행 — 기존 ROW 스타일 기반, 세로줄 없음
      const projCard = (p: any) => {
        const children = childProjects(activeProjs, p.id);
        const allIds = [p.id, ...children.map((ch: any) => ch.id)];
        const totalC = todos.filter((t: any) => allIds.includes(t.pid)).length;
        const isHidden = p.status !== "활성";
        const projTeamsArr = teams.filter(t => t.projectIds.includes(p.id));
        const availTeams = teams.filter(t => !t.projectIds.includes(p.id));
        return <div key={p.id} style={{ opacity: isHidden ? 0.5 : 1 }}>
          {/* 상위 행 */}
          <div style={{...ROW, cursor: "default" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}>
            <ColorDot color={p.color} onChange={c => onEditProj(p.id, { color: c })} />
            <div style={{ flex: 1, fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{p.name}</div>
            {teams.length > 0 && <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" as const }}>
              {projTeamsArr.map(t => (
                <span key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", background: "#eff6ff", borderRadius: 99, fontSize: 10, color: "#2563eb", fontWeight: 500, border: "1px solid #bfdbfe", whiteSpace: "nowrap" as const }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.color }} />
                  {t.name}
                  <span onClick={() => removeTeamProject(t.id, p.id)} style={{ cursor: "pointer", color: "#93c5fd", marginLeft: 1, fontSize: 12, lineHeight: 1 }}>×</span>
                </span>
              ))}
              {availTeams.length > 0 && (
                <select value="" onChange={e => { if (e.target.value) addTeamProject(e.target.value, p.id); }}
                  style={{ padding: "2px 6px", border: "1px dashed #93c5fd", borderRadius: 6, fontSize: 10, fontFamily: "inherit", color: "#93c5fd", maxWidth: 44, background: "#f8fbff" }}>
                  <option value="">+</option>
                  {availTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>}
            <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{totalC}건</span>
            <button onClick={() => onEditProj(p.id, { status: isHidden ? "활성" : "숨김" })} title={isHidden ? "표시" : "숨기기"} style={ICON_BTN} onMouseEnter={e => iconHover(e, true)} onMouseLeave={e => iconHover(e, false)}>{isHidden ? <EyeIcon style={ICON_SM} /> : <EyeSlashIcon style={ICON_SM} />}</button>
            <button onClick={() => { const n = prompt("이름:", p.name); if (n) onEditProj(p.id, { name: n.trim() }); }} style={ICON_BTN} onMouseEnter={e => iconHover(e, true)} onMouseLeave={e => iconHover(e, false)}><PencilSquareIcon style={ICON_SM} /></button>
            <button onClick={() => { if (window.confirm("프로젝트를 삭제하시겠습니까?")) { children.forEach((ch: any) => onDelProj(ch.id)); onDelProj(p.id); } }} style={ICON_BTN} onMouseEnter={e => iconHover(e, true)} onMouseLeave={e => iconHover(e, false)}><TrashIcon style={ICON_SM} /></button>
          </div>
          {/* 세부 프로젝트 */}
          {children.map(ch => {
            const chC = todos.filter((t: any) => t.pid === ch.id).length;
            return <div key={ch.id} style={{...ROW, cursor: "default", paddingLeft: 30 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}>
              <span style={{ color: "#cbd5e1", fontSize: 10 }}>└</span>
              <ColorDot color={ch.color} onChange={c => onEditProj(ch.id, { color: c })} />
              <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ch.name}</div>
              <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{chC}건</span>
              <button onClick={() => onEditProj(ch.id, { status: ch.status !== "활성" ? "활성" : "숨김" })} style={ICON_BTN} onMouseEnter={e => iconHover(e, true)} onMouseLeave={e => iconHover(e, false)}>{ch.status !== "활성" ? <EyeIcon style={ICON_SM} /> : <EyeSlashIcon style={ICON_SM} />}</button>
              <button onClick={() => { const n = prompt("이름:", ch.name); if (n) onEditProj(ch.id, { name: n.trim() }); }} style={ICON_BTN} onMouseEnter={e => iconHover(e, true)} onMouseLeave={e => iconHover(e, false)}><PencilSquareIcon style={ICON_SM} /></button>
              <button onClick={() => { if (window.confirm("세부 프로젝트를 삭제하시겠습니까?")) onDelProj(ch.id); }} style={ICON_BTN} onMouseEnter={e => iconHover(e, true)} onMouseLeave={e => iconHover(e, false)}><TrashIcon style={ICON_SM} /></button>
            </div>;
          })}
          {/* 세부 추가 */}
          <div style={{ padding: "3px 14px 3px 38px" }}>
            <button onClick={() => { const n = prompt("세부 프로젝트 이름:"); if (!n?.trim()) return; onAddProj({ name: n.trim(), color: p.color, status: "활성", parentId: p.id }); }}
              style={{ fontSize: 10, color: "#cbd5e1", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .12s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#2563eb"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#cbd5e1"; }}
            >+ 세부 프로젝트 추가</button>
          </div>
        </div>;
      };

      // 팀별 프로젝트 그룹
      const assignedIds = new Set<number>();
      const teamGroups = teams.map(team => {
        const tProjs = topProjects(activeProjs).filter(p => team.projectIds.includes(p.id));
        tProjs.forEach(p => assignedIds.add(p.id));
        return { team, projs: tProjs };
      }).filter(g => g.projs.length > 0);
      const unassignedProjs = topProjects(activeProjs).filter(p => !assignedIds.has(p.id));

      return <div style={{ display: "flex", flexDirection: "column" as const, flex: 1, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column" as const, flex: 1, overflowY: "auto" as const, marginBottom: 14 }}>
          {/* 팀별 그룹 — 사이드바 팀 헤더와 동일 패턴 */}
          {teams.length >= 2 ? <>
            {teamGroups.map(({ team, projs }) => (
              <div key={team.id} style={{ marginBottom: 6 }}>
                {/* 팀 헤더 — 배경색으로 눈에 띄게 */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                  background: "#f1f5f9", borderBottom: "1px solid #e2e8f0",
                  position: "sticky" as const, top: 0, zIndex: 1,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: team.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", flex: 1 }}>{team.name}</span>
                  <span style={{ fontSize: 10, color: "#94a3b8", background: "#e2e8f0", borderRadius: 99, padding: "1px 8px", fontWeight: 600 }}>{projs.length}</span>
                </div>
                {projs.map(p => projCard(p))}
              </div>
            ))}
            {unassignedProjs.length > 0 && <div style={{ marginBottom: 6 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", flex: 1 }}>팀 미배정</span>
                <span style={{ fontSize: 10, color: "#cbd5e1", background: "#e2e8f0", borderRadius: 99, padding: "1px 8px", fontWeight: 600 }}>{unassignedProjs.length}</span>
              </div>
              {unassignedProjs.map(p => projCard(p))}
            </div>}
          </> : <>
            {topProjects(activeProjs).map(p => projCard(p))}
          </>}

          {/* 숨긴 프로젝트 — 접힌 섹션 */}
          {hiddenProjs.length > 0 && <div style={{ marginTop: 4 }}>
            <div onClick={() => setShowHiddenProj(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px 4px", fontSize: 11, fontWeight: 700, color: "#94a3b8", cursor: "pointer" }}>
              <EyeSlashIcon style={{ width: 12, height: 12 }} />
              숨긴 프로젝트
              <span style={{ fontSize: 9, background: "#f1f5f9", color: "#64748b", borderRadius: 99, padding: "1px 6px", fontWeight: 600 }}>{hiddenProjs.length}</span>
              <span style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 8 }}>{showHiddenProj ? "▲" : "▼"}</span>
            </div>
            {showHiddenProj && topProjects(hiddenProjs).map(p => projCard(p))}
          </div>}
        </div>

        {/* 새 프로젝트 추가 — 이름 + 색상 + 팀 선택 */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, flexShrink: 0 }}>
          <div style={SEC_LABEL}>새 프로젝트</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const }}>
            <ColorDot color={projCo} onChange={setProjCo} />
            <input value={projNm} onChange={e => setProjNm(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && projNm.trim()) {
                  const np = onAddProj({ name: projNm.trim(), color: projCo, status: "활성" });
                  // 팀 배정
                  if (projTeamId && np) addTeamProject(projTeamId, typeof np === "number" ? np : pNId - 1);
                  setProjNm(""); setProjTeamId("");
                  const nu = [...usedColors, projCo]; setProjCo(PROJ_PALETTE.find(c => !nu.includes(c)) || PROJ_PALETTE[0]);
                }
              }}
              placeholder="프로젝트 이름" style={{ ...INP, flex: 1 }} />
            {teams.length > 0 && (
              <select value={projTeamId} onChange={e => setProjTeamId(e.target.value)}
                style={{ padding: "6px 8px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontFamily: "inherit", color: projTeamId ? "#2563eb" : "#94a3b8", minWidth: 70 }}>
                <option value="">팀 선택</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <button style={BTN_ADD}
              onClick={() => {
                if (!projNm.trim()) return;
                const np = onAddProj({ name: projNm.trim(), color: projCo, status: "활성" });
                if (projTeamId && np) addTeamProject(projTeamId, typeof np === "number" ? np : pNId - 1);
                setProjNm(""); setProjTeamId("");
                const nu = [...usedColors, projCo]; setProjCo(PROJ_PALETTE.find(c => !nu.includes(c)) || PROJ_PALETTE[0]);
              }}>추가</button>
          </div>
        </div>
      </div>;
    })()}

    {/* ── 담당자 / 우선순위 / 상태 탭 — 공통 목록 ── */}
    {(tab==="members"||tab==="pris"||tab==="stats")&&<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
      <div style={{flex:1,overflowY:"auto",marginBottom:14}}>
        {items.map((v, idx) => {
          const cnt = tab==="members" ? todos.filter((t:any)=>(t.who||[]).includes(v)).length
            : tab==="pris" ? todos.filter((t:any)=>t.pri===v).length
            : todos.filter((t:any)=>t.st===v).length;
          const isMember = tab === "members";
          const color = isMember ? undefined : tab==="pris" ? (priC[v]||"#94a3b8") : (stC[v]||"#94a3b8");
          const SEL: React.CSSProperties = {padding:"5px 10px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:13,fontFamily:"inherit"};
          // 드래그 정렬 — 배열 재정렬 함수
          const reorderItems = (from: number, to: number) => {
            if (tab==="members") setMembers((p:string[])=>{const a=[...p];const[m]=a.splice(from,1);a.splice(to,0,m);return a;});
            else if (tab==="pris") setPris((p:string[])=>{const a=[...p];const[m]=a.splice(from,1);a.splice(to,0,m);return a;});
            else setStats((p:string[])=>{const a=[...p];const[m]=a.splice(from,1);a.splice(to,0,m);return a;});
          };
          /* 담당자 행: 팀 배지가 많으면 잘리지 않도록 2행 구조로 분리 */
          const myTeams = isMember ? teams.filter(t => t.members.some(m => m.name === v)) : [];
          const curRole = isMember ? (memberRoles[v] || "admin") : "admin";
          const availTeams = isMember ? teams.filter(t => !t.members.some(m => m.name === v)) : [];
          const hasTeamRow = isMember && teams.length > 0 && (myTeams.length > 0 || availTeams.length > 0);
          return <div key={v} style={{...ROW,...dragStyle(idx),cursor:"grab",flexWrap:"wrap" as const}}
            {...mkDrag(idx, reorderItems)}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#f8fafc";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="#fff";}}>
            {/* 상단 행: 드래그핸들 + 아바타 + 이름 + 역할 + PIN + 건수 + 버튼 */}
            <Bars3Icon style={{width:12,height:12,color:"#cbd5e1",flexShrink:0}}/>
            {isMember ? (
              <div style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
                <span style={{width:28,height:28,borderRadius:"50%",background:memberAvatarBg(v),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px"}}>
                  {avInitials(v)}
                </span>
                <input type="color" value={memberColors[v] || avColor(v)} onChange={e => setMemberColor(v, e.target.value)}
                  title="아바타 색상 변경" style={{position:"absolute",left:0,top:0,width:28,height:28,opacity:0,cursor:"pointer",padding:0,border:"none"}}/>
              </div>
            ) : (
              <ColorDot color={color!} onChange={c=>chgColor(v,c)}/>
            )}
            <span style={{fontWeight:600,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,...(isMember?{flex:"0 1 auto",maxWidth:120}:{flex:1})}}>{v}</span>
            {/* 담당자: 역할 드롭다운 — maxWidth 제거하여 텍스트 잘림 방지 */}
            {isMember && (
              <select value={curRole} onChange={e => setMemberRole(v, e.target.value as TeamRole)}
                style={{...SEL,color:curRole==="admin"?"#dc2626":curRole==="viewer"?"#94a3b8":"#2563eb",flexShrink:0}}>
                {(Object.entries(TEAM_ROLE_LABELS) as [TeamRole, string][]).map(([k,label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            )}
            {/* PIN 코드 — 클릭: 복사 / 더블클릭: 직접 수정 */}
            {isMember && (
              <span style={{fontSize:13,fontFamily:"inherit",color:"#64748b",background:"#f1f5f9",padding:"4px 10px",borderRadius:6,flexShrink:0,letterSpacing:"1.5px",cursor:"pointer",border:"1px solid #e2e8f0",transition:"background .1s",fontWeight:600}}
                title="클릭: 복사 / 더블클릭: 수정"
                onClick={e=>{e.stopPropagation();const p=memberPins[v];if(p){navigator.clipboard.writeText(p);flash(`${v}의 PIN이 복사되었습니다`);}}}
                onDoubleClick={e=>{e.stopPropagation();const cur=memberPins[v]||"";const n=prompt(`${v}의 PIN 수정 (6자리 숫자)`,cur);if(n===null)return;const cleaned=n.replace(/\D/g,"").slice(0,6);if(cleaned.length!==6){flash("6자리 숫자를 입력해주세요","err");return;}setMemberPins((p:any)=>({...p,[v]:cleaned}));flash(`${v}의 PIN이 변경되었습니다`);}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#e2e8f0";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="#f1f5f9";}}>
                {memberPins[v]||"------"}
              </span>
            )}
            <span style={{fontSize:13,color:"#94a3b8",flexShrink:0}}>{cnt}건</span>
            <button onClick={()=>edit(v)} style={ICON_BTN} onMouseEnter={e=>iconHover(e,true)} onMouseLeave={e=>iconHover(e,false)}><PencilSquareIcon style={ICON_SM}/></button>
            <button onClick={()=>tryDel(v)} style={ICON_BTN} onMouseEnter={e=>iconHover(e,true)} onMouseLeave={e=>iconHover(e,false)}><TrashIcon style={ICON_SM}/></button>
            {/* 하단 행: 소속 팀 배지 — 팀이 있을 때만 전체 너비로 표시 */}
            {hasTeamRow && (
              <div style={{width:"100%",display:"flex",gap:4,alignItems:"center",flexWrap:"wrap" as const,paddingTop:6,paddingLeft:42,borderTop:"1px solid #f1f5f9",marginTop:4}}>
                {myTeams.map(t => (
                  <span key={t.id} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 10px",background:"#eff6ff",borderRadius:99,fontSize:12,color:"#2563eb",fontWeight:500,border:"1px solid #bfdbfe",whiteSpace:"nowrap" as const}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:t.color,flexShrink:0}}/>
                    {t.name}
                    <span onClick={()=>removeTeamMember(t.id,v)} style={{cursor:"pointer",color:"#93c5fd",marginLeft:2,fontSize:13,lineHeight:1}}>×</span>
                  </span>
                ))}
                {availTeams.length > 0 && (
                  <select value="" onChange={e=>{if(e.target.value)addTeamMember(e.target.value,v,curRole);}}
                    style={{...SEL,color:"#93c5fd",maxWidth:44,padding:"2px 6px",border:"1px dashed #93c5fd",background:"#f8fbff",fontSize:12}}>
                    <option value="">+</option>
                    {availTeams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>;
        })}
      </div>

      {/* 삭제 확인 */}
      {delConfirm&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:13,color:"#dc2626",fontWeight:600}}>"{delConfirm.value}" 삭제할까요?</span>
        <div style={{display:"flex",gap:6}}>
          <button onClick={doDel} style={{background:"#dc2626",color:"#fff",border:"none",padding:"6px 14px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>삭제</button>
          <button onClick={()=>setDelConfirm(null)} style={{background:"#f1f5f9",color:"#334155",border:"none",padding:"6px 14px",borderRadius:6,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>취소</button>
        </div>
      </div>}

      {/* 항목 추가 — 하단 고정 */}
      <div style={{borderTop:"1px solid #e2e8f0",paddingTop:12,flexShrink:0}}>
        <div style={SEC_LABEL}>{tab==="members"?"새 담당자":tab==="pris"?"새 우선순위":"새 상태"} 추가</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {tab!=="members"&&<ColorDot color={nc} onChange={setNc}/>}
          <input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}}
            placeholder={tab==="members"?"이름":"항목명"} style={INP}/>
          <button style={BTN_ADD} onClick={add}>추가</button>
        </div>
      </div>
    </div>}
  </div></div>;
}

// ── 팀 관리 탭 컴포넌트 ──────────────────────────────────────────────────────
// 팀 생성/편집/삭제, 멤버 배정+역할 설정, 프로젝트 연결을 한 화면에서 처리
function TeamTab({
  teams, setTeams, members, projects, addTeam, updTeam, delTeam,
  addTeamMember, removeTeamMember, setTeamMemberRole,
  addTeamProject, removeTeamProject, assignTodosToTeams, todos, flash,
}: {
  teams: Team[];
  setTeams: (fn: any) => void;
  members: string[];
  projects: Project[];
  addTeam: (name: string, color: string) => string;
  updTeam: (id: string, u: Partial<Team>) => void;
  delTeam: (id: string) => void;
  addTeamMember: (teamId: string, name: string, role?: TeamRole) => void;
  removeTeamMember: (teamId: string, name: string) => void;
  setTeamMemberRole: (teamId: string, name: string, role: TeamRole) => void;
  addTeamProject: (teamId: string, pid: number) => void;
  removeTeamProject: (teamId: string, pid: number) => void;
  assignTodosToTeams: () => void;
  todos: any[];
  flash: (m: string, t?: string) => void;
}) {
  const [newName, setNewName] = useState("");
  // 기존 팀 색상과 겹치지 않는 다음 색상 자동 선택
  const usedTeamColors = teams.map(t => t.color);
  const nextTeamColor = PROJ_PALETTE.find(c => !usedTeamColors.includes(c)) || PROJ_PALETTE[0];
  const [newColor, setNewColor] = useState(nextTeamColor);
  // 현재 편집 중인 팀 ID (펼쳐진 팀)
  const [editId, setEditId] = useState<string | null>(null);
  // 드래그 정렬 상태
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // 팀에 소속되지 않은 멤버 목록
  const assignedMembers = new Set(teams.flatMap(t => t.members.map(m => m.name)));
  const unassignedMembers = members.filter(m => !assignedMembers.has(m));

  // 팀에 연결되지 않은 프로젝트 목록
  const assignedProjects = new Set(teams.flatMap(t => t.projectIds));
  const unassignedProjects = projects.filter(p => !assignedProjects.has(p.id));

  const handleAdd = () => {
    if (!newName.trim()) return;
    addTeam(newName.trim(), newColor);
    setNewName("");
    // 다음 미사용 색상으로 자동 갱신
    const used = [...usedTeamColors, newColor];
    setNewColor(PROJ_PALETTE.find(c => !used.includes(c)) || PROJ_PALETTE[0]);
  };

  return <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    {/* 팀 목록 — 스크롤 영역 */}
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
      {teams.length === 0 && (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>아직 팀이 없습니다</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>아래에서 첫 번째 팀을 추가해 보세요</div>
        </div>
      )}
      {teams.map(team => {
        const isOpen = editId === team.id;
        const isDragOver = dragOverId === team.id && dragId !== team.id;
        return (
          <div key={team.id} style={{
            border: `1.5px solid ${isOpen ? "#93c5fd" : isDragOver ? "#2563eb" : "#e2e8f0"}`,
            borderRadius: 10, background: "#fff",
            opacity: dragId === team.id ? 0.35 : 1,
            transition: "opacity .15s, border-color .15s",
            boxShadow: isOpen ? "0 2px 8px rgba(37,99,235,.1)" : "none",
            flexShrink: 0,
          }}>
            {/* 팀 헤더 — 드래그로 순서 변경 */}
            <div
              draggable={!isOpen}
              onDragStart={e => { setDragId(team.id); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => { setDragId(null); setDragOverId(null); }}
              onDragOver={e => { if (dragId && dragId !== team.id) { e.preventDefault(); setDragOverId(team.id); } }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={e => {
                e.preventDefault();
                if (!dragId || dragId === team.id) return;
                setTeams((prev: Team[]) => {
                  const from = prev.findIndex(t => t.id === dragId);
                  const to = prev.findIndex(t => t.id === team.id);
                  if (from < 0 || to < 0) return prev;
                  const arr = [...prev];
                  const [moved] = arr.splice(from, 1);
                  arr.splice(to, 0, moved);
                  return arr;
                });
                setDragId(null); setDragOverId(null);
              }}
              onClick={() => setEditId(isOpen ? null : team.id)}
              onMouseEnter={e => { if (!isOpen && !dragId) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
              onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = isOpen ? "#eff6ff" : "#fff"; }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px", cursor: isOpen ? "pointer" : "grab",
                background: isOpen ? "#eff6ff" : "#fff",
                transition: "background .12s",
              }}
            >
              {/* 드래그 핸들 */}
              {!isOpen && <Bars3Icon style={{ width: 12, height: 12, color: "#cbd5e1", flexShrink: 0 }} />}
              {/* 색상 도트 */}
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: team.color, flexShrink: 0, boxShadow: `0 0 0 2px ${team.color}33` }} />
              {/* 팀 이름 */}
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, minWidth: 0 }}>{team.name}</span>
              {/* 멤버 아바타 미리보기 (접힌 상태) */}
              {!isOpen && team.members.length > 0 && (
                <div style={{ display: "flex", marginRight: 4 }}>
                  {team.members.slice(0, 3).map((m, i) => (
                    <span key={m.name} style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: `linear-gradient(135deg,${avColor(m.name)},${avColor2(m.name)})`,
                      color: "#fff", fontSize: 7, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginLeft: i > 0 ? -5 : 0, border: "1.5px solid #fff",
                      flexShrink: 0,
                    }}>{avInitials(m.name)}</span>
                  ))}
                  {team.members.length > 3 && <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#e2e8f0", color: "#64748b", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -5, border: "1.5px solid #fff", flexShrink: 0 }}>+{team.members.length - 3}</span>}
                </div>
              )}
              {/* 요약 뱃지 */}
              <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0, whiteSpace: "nowrap" as const }}>{team.members.length}명 · {team.projectIds.length}건</span>
              {/* 접기/펼치기 아이콘 — Heroicons 사용 */}
              <ChevronRightIcon style={{ width: 12, height: 12, color: "#94a3b8", transition: "transform .2s", transform: isOpen ? "rotate(90deg)" : "none", flexShrink: 0 }} />
            </div>

            {/* 펼쳐진 팀 편집 영역 */}
            {isOpen && (
              <div style={{ borderTop: "1px solid #e2e8f0" }}>
                {/* 기본 정보 — 이름 + 색상 */}
                <div style={{ padding: "12px 12px 10px", background: "#fafbfc", borderRadius: "0 0 0 0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>기본 정보</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={team.color} onChange={e => updTeam(team.id, { color: e.target.value })}
                      style={{ width: 32, height: 32, borderRadius: 8, cursor: "pointer", border: "1.5px solid #e2e8f0", flexShrink: 0 }} />
                    <input value={team.name} onChange={e => updTeam(team.id, { name: e.target.value })}
                      style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 14, fontFamily: "inherit", background: "#fff" }} />
                  </div>
                </div>

                {/* 소속 멤버 — 읽기 전용 요약 */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>소속 멤버 ({team.members.length})</span>
                    <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 11 }}>담당자 탭에서 변경</span>
                  </div>
                  {team.members.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {team.members.map(m => (
                        <span key={m.name} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px 4px 5px", background: "#fff", borderRadius: 99, fontSize: 12, color: "#475569", border: "1px solid #e2e8f0" }}>
                          <span style={{ width: 20, height: 20, borderRadius: "50%", background: `linear-gradient(135deg,${avColor(m.name)},${avColor2(m.name)})`, color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{avInitials(m.name)}</span>
                          {m.name}
                          <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: m.role === "admin" ? "#fef2f2" : m.role === "editor" ? "#eff6ff" : "#f1f5f9", color: m.role === "admin" ? "#dc2626" : m.role === "editor" ? "#2563eb" : "#94a3b8", fontWeight: 600 }}>{TEAM_ROLE_LABELS[m.role]}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#94a3b8", padding: "6px 0" }}>담당자 탭에서 멤버를 이 팀에 배정하세요</div>
                  )}
                </div>

                {/* 담당 프로젝트 */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>담당 프로젝트 ({team.projectIds.length})</div>
                  {team.projectIds.length > 0 ? team.projectIds.map(pid => {
                    const p = projects.find(pr => pr.id === pid);
                    if (!p) return null;
                    return (
                      <div key={pid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", marginBottom: 4, background: "#fff", borderRadius: 6, fontSize: 13, border: "1px solid #f1f5f9" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontWeight: 500, color: "#334155" }}>{p.name}</span>
                        <button onClick={() => removeTeamProject(team.id, pid)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", display: "inline-flex", padding: 2, transition: "color .12s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#cbd5e1"; }}>
                          <XMarkIcon style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    );
                  }) : (
                    <div style={{ fontSize: 13, color: "#94a3b8", padding: "4px 0" }}>연결된 프로젝트 없음</div>
                  )}
                  {unassignedProjects.length > 0 && (
                    <select value="" onChange={e => { if (e.target.value) addTeamProject(team.id, parseInt(e.target.value)); }}
                      style={{ width: "100%", padding: "6px 10px", border: "1.5px dashed #93c5fd", borderRadius: 6, fontSize: 13, color: "#2563eb", background: "#eff6ff", marginTop: 4, fontFamily: "inherit", cursor: "pointer" }}>
                      <option value="">+ 프로젝트 연결...</option>
                      {unassignedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                </div>

                {/* 위험 영역 — 삭제 (편집과 분리) */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", borderRadius: "0 0 9px 9px" }}>
                  <button onClick={() => { if (confirm(`"${team.name}" 팀을 삭제하시겠습니까?\n소속 업무는 미배정 상태가 됩니다.`)) delTeam(team.id); }}
                    style={{ background: "none", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", color: "#dc2626", display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 13, fontFamily: "inherit", transition: "background .12s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}>
                    <TrashIcon style={{ width: 12, height: 12 }} /> 팀 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* 새 팀 추가 — 하단 고정 */}
    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, flexShrink: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>새 팀 추가</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
          style={{ width: 32, height: 32, borderRadius: 6, cursor: "pointer", border: "1px solid #e2e8f0" }} />
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
          placeholder="팀 이름" style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
        <button onClick={handleAdd}
          style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          추가
        </button>
      </div>
    </div>

    {/* 기존 업무 일괄 배정 — 프로젝트-팀 매핑 기준 */}
    {teams.length > 0 && (()=>{
      const unassigned = todos.filter((t:any) => !t.teamId).length;
      if (!unassigned) return null;
      return <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>미배정 업무 일괄 배정</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>프로젝트-팀 연결 기준으로 {unassigned}건의 미배정 업무를 팀에 배정합니다</div>
          </div>
          <button onClick={assignTodosToTeams}
            style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>
            일괄 배정
          </button>
        </div>
      </div>;
    })()}
  </div>;
}

// ── 권한 설정 탭 ─────────────────────────────────────────────────────────────
// 팀 선택 → 역할별 권한 체크박스 매트릭스
// ── 권한 설정 탭 — 전역 일괄 적용 ────────────────────────────────────────────
function PermsTab({ globalPermissions, setGlobalPermissions }: {
  globalPermissions: Record<TeamRole, string[]> | null;
  setGlobalPermissions: (v: Record<TeamRole, string[]> | null) => void;
}) {
  const perms = globalPermissions || TEAM_ROLE_PERMISSIONS;
  const roles: TeamRole[] = ["admin", "editor", "viewer"];

  const toggle = (role: TeamRole, key: string) => {
    const cur = { ...TEAM_ROLE_PERMISSIONS, ...globalPermissions };
    const rolePerms = [...(cur[role] || [])];
    const idx = rolePerms.indexOf(key);
    if (idx >= 0) rolePerms.splice(idx, 1);
    else rolePerms.push(key);
    setGlobalPermissions({ ...cur, [role]: rolePerms });
  };

  return <>
    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 14, lineHeight: 1.6 }}>
      역할별 허용 동작을 설정합니다. 모든 팀에 동일하게 적용됩니다.
    </div>

    {/* 권한 매트릭스 */}
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
        <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#64748b" }}>권한 항목</div>
        {roles.map(r => (
          <div key={r} style={{ padding: "10px 4px", fontSize: 13, fontWeight: 700, color: r === "admin" ? "#dc2626" : r === "editor" ? "#2563eb" : "#64748b", textAlign: "center" }}>
            {TEAM_ROLE_LABELS[r]}
          </div>
        ))}
      </div>
      {ALL_PERMISSIONS.map(({ key, label }, i) => (
        <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", borderBottom: i < ALL_PERMISSIONS.length - 1 ? "1px solid #f1f5f9" : "none", background: i % 2 ? "#fafbfc" : "#fff" }}>
          <div style={{ padding: "9px 14px", fontSize: 13, color: "#334155" }}>{label}</div>
          {roles.map(role => (
            <div key={role} style={{ padding: "8px 0", textAlign: "center" }}>
              <input type="checkbox" checked={(perms[role] || []).includes(key)} onChange={() => toggle(role, key)}
                style={{ cursor: "pointer", accentColor: "#2563eb", width: 16, height: 16 }} />
            </div>
          ))}
        </div>
      ))}
    </div>

    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
      {globalPermissions ? (
        <button onClick={() => setGlobalPermissions(null)}
          style={{ fontSize: 13, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>
          기본값으로 복원
        </button>
      ) : (
        <span style={{ fontSize: 13, color: "#94a3b8" }}>현재 기본 권한 설정 사용 중</span>
      )}
    </div>
  </>;
}
