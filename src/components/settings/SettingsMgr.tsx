import { useState } from "react";
import { S } from "../../styles";
import { avColor, avColor2, avInitials } from "../../utils/avatarUtils";
import { PROJ_PALETTE } from "../../constants";
import { Project, Team, TeamRole, TEAM_ROLE_LABELS, ALL_PERMISSIONS, TEAM_ROLE_PERMISSIONS } from "../../types";
import { UserIcon, UserGroupIcon, BoltIcon, CheckCircleIcon, Cog6ToothIcon, FolderIcon, CheckIcon, PencilSquareIcon, TrashIcon, PlusIcon, XMarkIcon, ChevronRightIcon, Bars3Icon, ICON_SM } from "../ui/Icons";

export function SettingsMgr({
  members, setMembers,
  pris, setPris, stats, setStats,
  priC, setPriC, priBg, setPriBg,
  stC, setStC, stBg, setStBg,
  memberColors, setMemberColor,
  projects, pNId, setPNId, onAddProj, onDelProj, onEditProj,
  todos, flash, apiKey, setApiKey,
  teams, setTeams, memberRoles, setMemberRole, globalPermissions, setGlobalPermissions, addTeam, updTeam, delTeam,
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
  pNId: number;
  setPNId: (v: number) => void;
  onAddProj: (p: Omit<Project,"id">) => void;
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

  // 프로젝트 탭용 신규 프로젝트 상태
  const usedColors = projects.map(p => p.color);
  const nextColor = PROJ_PALETTE.find(c => !usedColors.includes(c)) || PROJ_PALETTE[0];
  const [projNm, setProjNm] = useState("");
  const [projCo, setProjCo] = useState(nextColor);

  // ── 공통 스타일 토큰 — 모든 탭에서 동일하게 적용 ──────────────────────────
  const tS = (a: boolean): React.CSSProperties => ({
    padding: "8px 14px", fontSize: 12, fontWeight: a ? 600 : 500,
    color: a ? "#2563eb" : "#64748b",
    background: a ? "#eff6ff" : "transparent",
    border: "none", borderBottom: a ? "2px solid #2563eb" : "2px solid transparent",
    cursor: "pointer", fontFamily: "inherit", transition: "color .12s",
  });
  // 목록 행 공통 스타일
  const ROW: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 10px", background: "#fff", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 12, marginBottom: 4,
    transition: "background .1s",
  };
  // 텍스트 입력 공통 스타일
  const INP: React.CSSProperties = {
    flex: 1, padding: "7px 10px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 12, outline: "none", fontFamily: "inherit",
  };
  // 추가 버튼 공통 스타일
  const BTN_ADD: React.CSSProperties = {
    background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff",
    border: "none", padding: "7px 14px", borderRadius: 8,
    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };
  // 색상 피커 공통 스타일
  const COLOR_PICK: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 6, cursor: "pointer",
    border: "1px solid #e2e8f0", flexShrink: 0, padding: 0,
  };
  // 섹션 라벨 공통 스타일
  const SEC_LABEL: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "#334155", marginBottom: 6,
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

  const items = tab === "members" ? members : tab === "pris" ? pris : stats;

  const add = () => {
    if (!nv.trim()) return;
    const v = nv.trim();
    if (tab === "members") {
      if (!members.includes(v)) setMembers((p: string[]) => [...p, v]);
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
      // 색상도 이전 이름에서 새 이름으로 이전
      if (memberColors[old]) setMemberColor(v, memberColors[old]);
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
      ? todos.filter((t: any) => t.who === v).length
      : tab === "pris"
      ? todos.filter((t: any) => t.pri === v).length
      : todos.filter((t: any) => t.st === v).length;
    if (cnt) { flash(`해당 항목을 사용 중인 업무가 ${cnt}건 있어 삭제할 수 없습니다`, "err"); return; }
    setDelConfirm({value: v, tab});
  };

  const doDel = () => {
    if (!delConfirm) return;
    const v = delConfirm.value;
    if (delConfirm.tab === "members") setMembers((p: string[]) => p.filter((m: string) => m !== v));
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

  return <div style={{ display:"flex", height: 480, margin: "-16px -18px -0px" }}>
    {/* ── 좌측 메뉴 ── */}
    <div style={{ width: 160, flexShrink: 0, borderRight: "1px solid #e2e8f0", padding: "12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
      {menuItems.filter(m => m.show !== false).map(m => {
        const active = tab === m.key;
        return <button key={m.key} onClick={() => setTab(m.key)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 16px", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: active ? 600 : 500, fontFamily: "inherit",
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
          {m.count !== undefined && <span style={{ fontSize: 10, color: active ? "#2563eb" : "#94a3b8", fontWeight: 600 }}>{m.count}</span>}
        </button>;
      })}
    </div>

    {/* ── 우측 콘텐츠 ── */}
    <div style={{ flex: 1, padding: "12px 18px", overflowY: "auto", height: 480 }}>

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
      <div style={{fontSize:12,color:"#64748b",marginBottom:10,lineHeight:1.6}}>Anthropic API 키를 입력하세요. 브라우저 로컬에 저장됩니다.</div>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input type="password" value={keyDraft} onChange={e=>setKeyDraft(e.target.value)}
          placeholder="sk-ant-..." style={INP}/>
        <button onClick={()=>{const k=keyDraft.trim();localStorage.setItem("team-todo-apikey",k);setApiKey(k);flash("API 키가 저장되었습니다");}}
          style={BTN_ADD}>저장</button>
      </div>
      {apiKey&&<div style={{fontSize:11,color:"#16a34a",fontWeight:600,display:"flex",alignItems:"center",gap:4}}><CheckIcon style={ICON_SM}/> API 키 설정됨</div>}
    </div>}

    {/* ── 프로젝트 탭 ── */}
    {tab==="proj"&&<>
      <div style={{display:"flex",flexDirection:"column",marginBottom:14,maxHeight:340,overflowY:"auto"}}>
        {projects.map(p=>{
          const c=todos.filter((t:any)=>t.pid===p.id).length;
          return <div key={p.id} style={ROW}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#f8fafc";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="#fff";}}>
            <input type="color" value={p.color} onChange={e=>onEditProj(p.id,{color:e.target.value})} title="색상 변경" style={COLOR_PICK}/>
            <div style={{flex:1,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name}</div>
            <span style={{fontSize:10,color:"#94a3b8",flexShrink:0}}>{c}건</span>
            <button onClick={()=>{const n=prompt("이름:",p.name);if(n)onEditProj(p.id,{name:n.trim()})}} style={ICON_BTN} onMouseEnter={e=>iconHover(e,true)} onMouseLeave={e=>iconHover(e,false)}><PencilSquareIcon style={ICON_SM}/></button>
            <button onClick={()=>{if(window.confirm("해당 프로젝트를 삭제하시겠습니까?"))onDelProj(p.id)}} style={ICON_BTN} onMouseEnter={e=>iconHover(e,true)} onMouseLeave={e=>iconHover(e,false)}><TrashIcon style={ICON_SM}/></button>
          </div>;
        })}
      </div>
      <div style={{borderTop:"1px solid #e2e8f0",paddingTop:12}}>
        <div style={SEC_LABEL}>새 프로젝트</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <input type="color" value={projCo} onChange={e=>setProjCo(e.target.value)} style={COLOR_PICK}/>
          <input value={projNm} onChange={e=>setProjNm(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&projNm.trim()){onAddProj({name:projNm.trim(),color:projCo,status:"활성"});setProjNm("");const nu=[...usedColors,projCo];setProjCo(PROJ_PALETTE.find(c=>!nu.includes(c))||PROJ_PALETTE[0]);}}}
            placeholder="이름" style={INP}/>
          <button style={BTN_ADD}
            onClick={()=>{if(!projNm.trim())return;onAddProj({name:projNm.trim(),color:projCo,status:"활성"});setProjNm("");const nu=[...usedColors,projCo];setProjCo(PROJ_PALETTE.find(c=>!nu.includes(c))||PROJ_PALETTE[0]);}}>추가</button>
        </div>
      </div>
    </>}

    {/* ── 담당자 / 우선순위 / 상태 탭 — 공통 목록 ── */}
    {(tab==="members"||tab==="pris"||tab==="stats")&&<>
      <div style={{marginBottom:14,maxHeight:340,overflowY:"auto"}}>
        {items.map(v => {
          const cnt = tab==="members" ? todos.filter((t:any)=>t.who===v).length
            : tab==="pris" ? todos.filter((t:any)=>t.pri===v).length
            : todos.filter((t:any)=>t.st===v).length;
          const isMember = tab === "members";
          const color = isMember ? undefined : tab==="pris" ? (priC[v]||"#94a3b8") : (stC[v]||"#94a3b8");
          const SEL: React.CSSProperties = {padding:"3px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:10,fontFamily:"inherit"};
          return <div key={v} style={ROW}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#f8fafc";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="#fff";}}>
            {isMember ? (
              <div style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
                <span style={{width:24,height:24,borderRadius:"50%",background:memberAvatarBg(v),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px"}}>
                  {avInitials(v)}
                </span>
                <input type="color" value={memberColors[v] || avColor(v)} onChange={e => setMemberColor(v, e.target.value)}
                  title="아바타 색상 변경" style={{position:"absolute",left:0,top:0,width:24,height:24,opacity:0,cursor:"pointer",padding:0,border:"none"}}/>
              </div>
            ) : (
              <input type="color" value={color} onChange={e=>chgColor(v,e.target.value)} style={COLOR_PICK}/>
            )}
            <span style={{flex:1,fontWeight:600,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{v}</span>
            {/* 담당자: 역할 + 소속 팀 */}
            {isMember && (()=>{
              const memberTeam = teams.find(t => t.members.some(m => m.name === v));
              const curRole = memberRoles[v] || "admin";
              return <>
                <select value={curRole} onChange={e => setMemberRole(v, e.target.value as TeamRole)}
                  style={{...SEL,color:curRole==="admin"?"#dc2626":curRole==="viewer"?"#94a3b8":"#2563eb",maxWidth:64}}>
                  {(Object.entries(TEAM_ROLE_LABELS) as [TeamRole, string][]).map(([k,label]) => <option key={k} value={k}>{label}</option>)}
                </select>
                {teams.length > 0 && (
                  <select value={memberTeam?.id || ""} onChange={e => {
                    const newTeamId = e.target.value;
                    if (newTeamId) addTeamMember(newTeamId, v, curRole);
                    else if (memberTeam) removeTeamMember(memberTeam.id, v);
                  }} style={{...SEL,color:memberTeam?"#334155":"#94a3b8",maxWidth:90}}>
                    <option value="">팀 미배정</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </>;
            })()}
            <span style={{fontSize:10,color:"#94a3b8",flexShrink:0}}>{cnt}건</span>
            <button onClick={()=>edit(v)} style={ICON_BTN} onMouseEnter={e=>iconHover(e,true)} onMouseLeave={e=>iconHover(e,false)}><PencilSquareIcon style={ICON_SM}/></button>
            <button onClick={()=>tryDel(v)} style={ICON_BTN} onMouseEnter={e=>iconHover(e,true)} onMouseLeave={e=>iconHover(e,false)}><TrashIcon style={ICON_SM}/></button>
          </div>;
        })}
      </div>

      {/* 삭제 확인 */}
      {delConfirm&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:"#dc2626",fontWeight:600}}>"{delConfirm.value}" 삭제할까요?</span>
        <div style={{display:"flex",gap:4}}>
          <button onClick={doDel} style={{background:"#dc2626",color:"#fff",border:"none",padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>삭제</button>
          <button onClick={()=>setDelConfirm(null)} style={{background:"#f1f5f9",color:"#334155",border:"none",padding:"5px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>취소</button>
        </div>
      </div>}

      {/* 항목 추가 */}
      <div style={{borderTop:"1px solid #e2e8f0",paddingTop:12}}>
        <div style={SEC_LABEL}>{tab==="members"?"새 담당자":tab==="pris"?"새 우선순위":"새 상태"} 추가</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {tab!=="members"&&<input type="color" value={nc} onChange={e=>setNc(e.target.value)} style={COLOR_PICK}/>}
          <input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}}
            placeholder={tab==="members"?"이름":"항목명"} style={INP}/>
          <button style={BTN_ADD} onClick={add}>추가</button>
        </div>
      </div>
    </>}
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
  const [newColor, setNewColor] = useState("#2563eb");
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
  };

  return <>
    {/* 팀 목록 */}
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14, maxHeight: 460, overflowY: "auto", overflowX: "hidden" }}>
      {teams.length === 0 && (
        <div style={{ padding: "28px 0", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>아직 팀이 없습니다</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>아래에서 첫 번째 팀을 추가해 보세요</div>
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
              <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, minWidth: 0 }}>{team.name}</span>
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
              <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0, whiteSpace: "nowrap" as const }}>{team.members.length}명 · {team.projectIds.length}건</span>
              {/* 접기/펼치기 아이콘 — Heroicons 사용 */}
              <ChevronRightIcon style={{ width: 12, height: 12, color: "#94a3b8", transition: "transform .2s", transform: isOpen ? "rotate(90deg)" : "none", flexShrink: 0 }} />
            </div>

            {/* 펼쳐진 팀 편집 영역 */}
            {isOpen && (
              <div style={{ borderTop: "1px solid #e2e8f0" }}>
                {/* 기본 정보 — 이름 + 색상 */}
                <div style={{ padding: "12px 12px 10px", background: "#fafbfc", borderRadius: "0 0 0 0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>기본 정보</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="color" value={team.color} onChange={e => updTeam(team.id, { color: e.target.value })}
                      style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", border: "1.5px solid #e2e8f0", flexShrink: 0 }} />
                    <input value={team.name} onChange={e => updTeam(team.id, { name: e.target.value })}
                      style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontFamily: "inherit", background: "#fff" }} />
                  </div>
                </div>

                {/* 소속 멤버 — 읽기 전용 요약 */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>소속 멤버 ({team.members.length})</span>
                    <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 9 }}>담당자 탭에서 변경</span>
                  </div>
                  {team.members.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {team.members.map(m => (
                        <span key={m.name} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px 3px 4px", background: "#fff", borderRadius: 99, fontSize: 11, color: "#475569", border: "1px solid #e2e8f0" }}>
                          <span style={{ width: 18, height: 18, borderRadius: "50%", background: `linear-gradient(135deg,${avColor(m.name)},${avColor2(m.name)})`, color: "#fff", fontSize: 7, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{avInitials(m.name)}</span>
                          {m.name}
                          <span style={{ fontSize: 9, padding: "0 4px", borderRadius: 4, background: m.role === "admin" ? "#fef2f2" : m.role === "editor" ? "#eff6ff" : "#f1f5f9", color: m.role === "admin" ? "#dc2626" : m.role === "editor" ? "#2563eb" : "#94a3b8", fontWeight: 600 }}>{TEAM_ROLE_LABELS[m.role]}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#94a3b8", padding: "6px 0" }}>담당자 탭에서 멤버를 이 팀에 배정하세요</div>
                  )}
                </div>

                {/* 담당 프로젝트 */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>담당 프로젝트 ({team.projectIds.length})</div>
                  {team.projectIds.length > 0 ? team.projectIds.map(pid => {
                    const p = projects.find(pr => pr.id === pid);
                    if (!p) return null;
                    return (
                      <div key={pid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", marginBottom: 3, background: "#fff", borderRadius: 6, fontSize: 12, border: "1px solid #f1f5f9" }}>
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
                    <div style={{ fontSize: 11, color: "#94a3b8", padding: "4px 0" }}>연결된 프로젝트 없음</div>
                  )}
                  {unassignedProjects.length > 0 && (
                    <select value="" onChange={e => { if (e.target.value) addTeamProject(team.id, parseInt(e.target.value)); }}
                      style={{ width: "100%", padding: "5px 8px", border: "1.5px dashed #93c5fd", borderRadius: 6, fontSize: 11, color: "#2563eb", background: "#eff6ff", marginTop: 4, fontFamily: "inherit", cursor: "pointer" }}>
                      <option value="">+ 프로젝트 연결...</option>
                      {unassignedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                </div>

                {/* 위험 영역 — 삭제 (편집과 분리) */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", borderRadius: "0 0 9px 9px" }}>
                  <button onClick={() => { if (confirm(`"${team.name}" 팀을 삭제하시겠습니까?\n소속 업무는 미배정 상태가 됩니다.`)) delTeam(team.id); }}
                    style={{ background: "none", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", color: "#dc2626", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 11, fontFamily: "inherit", transition: "background .12s" }}
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

    {/* 새 팀 추가 */}
    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>새 팀 추가</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
          style={{ width: 32, height: 28, borderRadius: 6, cursor: "pointer", border: "1px solid #e2e8f0" }} />
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
          placeholder="팀 이름" style={{ flex: 1, padding: "6px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
        <button onClick={handleAdd}
          style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
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
            <div style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>미배정 업무 일괄 배정</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>프로젝트-팀 연결 기준으로 {unassigned}건의 미배정 업무를 팀에 배정합니다</div>
          </div>
          <button onClick={assignTodosToTeams}
            style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>
            일괄 배정
          </button>
        </div>
      </div>;
    })()}
  </>;
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
    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.6 }}>
      역할별 허용 동작을 설정합니다. 모든 팀에 동일하게 적용됩니다.
    </div>

    {/* 권한 매트릭스 */}
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px 72px", background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
        <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#64748b" }}>권한 항목</div>
        {roles.map(r => (
          <div key={r} style={{ padding: "8px 4px", fontSize: 11, fontWeight: 700, color: r === "admin" ? "#dc2626" : r === "editor" ? "#2563eb" : "#64748b", textAlign: "center" }}>
            {TEAM_ROLE_LABELS[r]}
          </div>
        ))}
      </div>
      {ALL_PERMISSIONS.map(({ key, label }, i) => (
        <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px 72px", borderBottom: i < ALL_PERMISSIONS.length - 1 ? "1px solid #f1f5f9" : "none", background: i % 2 ? "#fafbfc" : "#fff" }}>
          <div style={{ padding: "7px 12px", fontSize: 12, color: "#334155" }}>{label}</div>
          {roles.map(role => (
            <div key={role} style={{ padding: "6px 0", textAlign: "center" }}>
              <input type="checkbox" checked={(perms[role] || []).includes(key)} onChange={() => toggle(role, key)}
                style={{ cursor: "pointer", accentColor: "#2563eb", width: 15, height: 15 }} />
            </div>
          ))}
        </div>
      ))}
    </div>

    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
      {globalPermissions ? (
        <button onClick={() => setGlobalPermissions(null)}
          style={{ fontSize: 11, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
          기본값으로 복원
        </button>
      ) : (
        <span style={{ fontSize: 11, color: "#94a3b8" }}>현재 기본 권한 설정 사용 중</span>
      )}
    </div>
  </>;
}
