import { useState } from "react";
import { S } from "../../styles";
import { avColor, avColor2, avInitials } from "../../utils/avatarUtils";
import { PROJ_PALETTE } from "../../constants";
import { Project, Team, TeamRole, TEAM_ROLE_LABELS } from "../../types";
import { UserIcon, BoltIcon, CheckCircleIcon, Cog6ToothIcon, FolderIcon, CheckIcon, PencilSquareIcon, TrashIcon, PlusIcon, XMarkIcon, ICON_SM } from "../ui/Icons";

export function SettingsMgr({
  members, setMembers,
  pris, setPris, stats, setStats,
  priC, setPriC, priBg, setPriBg,
  stC, setStC, stBg, setStBg,
  memberColors, setMemberColor,
  projects, pNId, setPNId, onAddProj, onDelProj, onEditProj,
  todos, flash, apiKey, setApiKey,
  teams, addTeam, updTeam, delTeam,
  addTeamMember, removeTeamMember, setTeamMemberRole,
  addTeamProject, removeTeamProject,
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
  addTeam: (name: string, color: string) => string;
  updTeam: (id: string, u: Partial<Team>) => void;
  delTeam: (id: string) => void;
  addTeamMember: (teamId: string, name: string, role?: TeamRole) => void;
  removeTeamMember: (teamId: string, name: string) => void;
  setTeamMemberRole: (teamId: string, name: string, role: TeamRole) => void;
  addTeamProject: (teamId: string, pid: number) => void;
  removeTeamProject: (teamId: string, pid: number) => void;
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

  const tS = (a: boolean) => ({
    padding: "8px 14px", fontSize: 12, fontWeight: a ? 600 : 500,
    color: a ? "#2563eb" : "#64748b",
    background: a ? "#eff6ff" : "transparent",
    border: "none", borderBottom: a ? "2px solid #2563eb" : "2px solid transparent", cursor: "pointer",
  });

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

  return <div>
    {/* ── 탭 네비게이션 ── */}
    <div style={{display:"flex",borderBottom:"1px solid #e2e8f0",marginBottom:14,flexWrap:"wrap" as const}}>
      <button style={{...tS(tab==="teams"),display:"inline-flex",alignItems:"center",gap:4}} onClick={()=>setTab("teams")}>팀 ({teams.length})</button>
      <button style={{...tS(tab==="members"),display:"inline-flex",alignItems:"center",gap:4}} onClick={()=>setTab("members")}><UserIcon style={ICON_SM}/> 담당자 ({members.length})</button>
      <button style={{...tS(tab==="proj"),display:"inline-flex",alignItems:"center",gap:4}} onClick={()=>setTab("proj")}><FolderIcon style={ICON_SM}/> 프로젝트 ({projects.length})</button>
      <button style={{...tS(tab==="pris"),display:"inline-flex",alignItems:"center",gap:4}} onClick={()=>setTab("pris")}><BoltIcon style={ICON_SM}/> 우선순위 ({pris.length})</button>
      <button style={{...tS(tab==="stats"),display:"inline-flex",alignItems:"center",gap:4}} onClick={()=>setTab("stats")}><CheckCircleIcon style={ICON_SM}/> 상태 ({stats.length})</button>
      <button style={{...tS(tab==="apikey"),display:"inline-flex",alignItems:"center",gap:4}} onClick={()=>setTab("apikey")}><Cog6ToothIcon style={ICON_SM}/> API 키</button>
    </div>

    {/* ── 팀 탭 ── */}
    {tab==="teams"&&<TeamTab
      teams={teams} members={members} projects={projects}
      addTeam={addTeam} updTeam={updTeam} delTeam={delTeam}
      addTeamMember={addTeamMember} removeTeamMember={removeTeamMember} setTeamMemberRole={setTeamMemberRole}
      addTeamProject={addTeamProject} removeTeamProject={removeTeamProject}
      flash={flash}
    />}

    {/* ── API 키 탭 ── */}
    {tab==="apikey"&&<div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>Anthropic API 키를 입력하세요. 브라우저 로컬에 저장됩니다.</div>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input type="password" value={keyDraft} onChange={e=>setKeyDraft(e.target.value)}
          placeholder="sk-ant-..." style={{flex:1,padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={()=>{const k=keyDraft.trim();localStorage.setItem("team-todo-apikey",k);setApiKey(k);flash("API 키가 저장되었습니다");}}
          style={{padding:"8px 14px",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>저장</button>
      </div>
      {apiKey&&<div style={{fontSize:11,color:"#16a34a",fontWeight:600,display:"flex",alignItems:"center",gap:3}}><CheckIcon style={ICON_SM}/> API 키 설정됨</div>}
    </div>}

    {/* ── 프로젝트 탭 ── */}
    {tab==="proj"&&<>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14,maxHeight:300,overflowY:"auto"}}>
        {projects.map(p=>{
          const c=todos.filter((t:any)=>t.pid===p.id).length;
          return <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:"#f8fafc",borderRadius:7,border:"1px solid #e2e8f0",fontSize:12}}>
            {/* 프로젝트 색상 변경 — 클릭하면 네이티브 컬러 피커 열림 */}
            <input type="color" value={p.color} onChange={e=>onEditProj(p.id,{color:e.target.value})} title="색상 변경" style={{width:20,height:20,padding:0,border:"1px solid #e2e8f0",borderRadius:4,cursor:"pointer",flexShrink:0}}/>
            <div style={{flex:1,fontWeight:600}}>{p.name}</div>
            <span style={{fontSize:10,color:"#94a3b8"}}>{c}건</span>
            <button onClick={()=>{const n=prompt("이름:",p.name);if(n)onEditProj(p.id,{name:n.trim()})}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",display:"inline-flex"}}><PencilSquareIcon style={ICON_SM}/></button>
            <button onClick={()=>{if(window.confirm("해당 프로젝트를 삭제하시겠습니까?"))onDelProj(p.id)}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",display:"inline-flex"}}><TrashIcon style={ICON_SM}/></button>
          </div>;
        })}
      </div>
      <div style={{borderTop:"1px solid #e2e8f0",paddingTop:10}}>
        <div style={{fontSize:11,fontWeight:600,marginBottom:5}}>새 프로젝트</div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <input type="color" value={projCo} onChange={e=>setProjCo(e.target.value)} style={{width:32,height:28,borderRadius:6,cursor:"pointer",border:"1px solid #e2e8f0"}}/>
          <input value={projNm} onChange={e=>setProjNm(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&projNm.trim()){onAddProj({name:projNm.trim(),color:projCo,status:"활성"});setProjNm("");const nu=[...usedColors,projCo];setProjCo(PROJ_PALETTE.find(c=>!nu.includes(c))||PROJ_PALETTE[0]);}}}
            placeholder="이름" style={{flex:1,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
          <button style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}}
            onClick={()=>{if(!projNm.trim())return;onAddProj({name:projNm.trim(),color:projCo,status:"활성"});setProjNm("");const nu=[...usedColors,projCo];setProjCo(PROJ_PALETTE.find(c=>!nu.includes(c))||PROJ_PALETTE[0]);}}>추가</button>
        </div>
      </div>
    </>}

    {/* ── 담당자 / 우선순위 / 상태 탭 — 공통 목록 ── */}
    {(tab==="members"||tab==="pris"||tab==="stats")&&<>
      <div style={{marginBottom:14,maxHeight:300,overflowY:"auto"}}>
        {items.map(v => {
          const cnt = tab==="members" ? todos.filter((t:any)=>t.who===v).length
            : tab==="pris" ? todos.filter((t:any)=>t.pri===v).length
            : todos.filter((t:any)=>t.st===v).length;
          // 담당자: 리스트뷰와 동일한 그라디언트 아바타 + 색상 변경 컬러피커
          // 우선순위/상태: 단색 컬러피커
          const isMember = tab === "members";
          const color = isMember ? undefined : tab==="pris" ? (priC[v]||"#94a3b8") : (stC[v]||"#94a3b8");
          return <div key={v} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f8fafc",borderRadius:7,border:"1px solid #e2e8f0",fontSize:12,marginBottom:4}}>
            {isMember ? (
              // 담당자 아바타 — 리스트뷰와 동일한 원형 그라디언트 + 이니셜 (마지막 2자)
              // 커스텀 색상 설정 시 단색으로 표시
              <div style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
                <span style={{width:22,height:22,borderRadius:"50%",background:memberAvatarBg(v),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px"}}>
                  {avInitials(v)}
                </span>
                {/* 색상 변경 컬러피커 — 아바타 위에 겹쳐 투명 클릭 영역으로 표시 */}
                <input type="color"
                  value={memberColors[v] || avColor(v)}
                  onChange={e => setMemberColor(v, e.target.value)}
                  title="아바타 색상 변경"
                  style={{position:"absolute",left:0,top:0,width:22,height:22,opacity:0,cursor:"pointer",padding:0,border:"none"}}
                />
              </div>
            ) : (
              // 우선순위/상태 — 단색 컬러피커
              <input type="color" value={color} onChange={e=>chgColor(v,e.target.value)}
                style={{width:20,height:20,padding:0,border:"1px solid #e2e8f0",borderRadius:4,cursor:"pointer"}}/>
            )}
            <span style={{flex:1,fontWeight:600}}>{v}</span>
            <span style={{fontSize:10,color:"#94a3b8"}}>{cnt}건</span>
            <button onClick={()=>edit(v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8",display:"inline-flex",alignItems:"center"}}><PencilSquareIcon style={ICON_SM}/></button>
            <button onClick={()=>tryDel(v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8",display:"inline-flex",alignItems:"center"}}><TrashIcon style={ICON_SM}/></button>
          </div>;
        })}
      </div>

      {/* 삭제 확인 */}
      {delConfirm&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:12,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:"#dc2626",fontWeight:600}}>"{delConfirm.value}" 삭제할까요?</span>
        <div style={{display:"flex",gap:4}}>
          <button onClick={doDel} style={{background:"#fef2f2",color:"#dc2626",border:"none",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}}>삭제</button>
          <button onClick={()=>setDelConfirm(null)} style={{background:"#f1f5f9",color:"#334155",border:"none",padding:"4px 10px",borderRadius:8,fontSize:11,cursor:"pointer"}}>취소</button>
        </div>
      </div>}

      {/* 항목 추가 */}
      <div style={{borderTop:"1px solid #e2e8f0",paddingTop:12}}>
        <div style={{fontSize:11,fontWeight:600,marginBottom:6}}>{tab==="members"?"새 담당자":tab==="pris"?"새 우선순위":"새 상태"} 추가</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {tab!=="members"&&<input type="color" value={nc} onChange={e=>setNc(e.target.value)} style={{width:34,height:30,borderRadius:6,cursor:"pointer",border:"1px solid #e2e8f0"}}/>}
          <input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}}
            placeholder={tab==="members"?"이름":"항목명"} style={{flex:1,padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
          <button style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={add}>추가</button>
        </div>
      </div>
    </>}
  </div>;
}

// ── 팀 관리 탭 컴포넌트 ──────────────────────────────────────────────────────
// 팀 생성/편집/삭제, 멤버 배정+역할 설정, 프로젝트 연결을 한 화면에서 처리
function TeamTab({
  teams, members, projects, addTeam, updTeam, delTeam,
  addTeamMember, removeTeamMember, setTeamMemberRole,
  addTeamProject, removeTeamProject, flash,
}: {
  teams: Team[];
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
  flash: (m: string, t?: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#2563eb");
  // 현재 편집 중인 팀 ID (펼쳐진 팀)
  const [editId, setEditId] = useState<string | null>(null);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, maxHeight: 420, overflowY: "auto" }}>
      {teams.length === 0 && (
        <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
          아직 팀이 없습니다. 아래에서 팀을 추가하세요.
        </div>
      )}
      {teams.map(team => {
        const isOpen = editId === team.id;
        return (
          <div key={team.id} style={{ border: `1px solid ${isOpen ? "#93c5fd" : "#e2e8f0"}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
            {/* 팀 헤더 */}
            <div
              onClick={() => setEditId(isOpen ? null : team.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px", cursor: "pointer",
                background: isOpen ? "#eff6ff" : "#f8fafc",
                transition: "background .1s",
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: team.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{team.name}</span>
              <span style={{ fontSize: 10, color: "#64748b" }}>멤버 {team.members.length}명 · 프로젝트 {team.projectIds.length}건</span>
              <span style={{ fontSize: 10, color: "#94a3b8", transition: "transform .2s", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "none" }}>▶</span>
            </div>

            {/* 펼쳐진 팀 편집 영역 */}
            {isOpen && (
              <div style={{ padding: "12px", borderTop: "1px solid #e2e8f0" }}>
                {/* 기본 정보 */}
                <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
                  <input type="color" value={team.color} onChange={e => updTeam(team.id, { color: e.target.value })}
                    style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer", border: "1px solid #e2e8f0", flexShrink: 0 }} />
                  <input value={team.name} onChange={e => updTeam(team.id, { name: e.target.value })}
                    style={{ flex: 1, padding: "6px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontFamily: "inherit" }} />
                  <select value={team.visibility} onChange={e => updTeam(team.id, { visibility: e.target.value as "private" | "company" })}
                    style={{ padding: "6px 8px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 11, fontFamily: "inherit" }}>
                    <option value="company">전사 공개</option>
                    <option value="private">팀 내부만</option>
                  </select>
                  <button onClick={() => { if (confirm(`"${team.name}" 팀을 삭제하시겠습니까?\n소속 업무는 전사 공개로 변경됩니다.`)) delTeam(team.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", display: "inline-flex", padding: 4 }}>
                    <TrashIcon style={ICON_SM} />
                  </button>
                </div>

                {/* 멤버 관리 */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.5px" }}>소속 멤버</div>
                  {team.members.map(m => (
                    <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", marginBottom: 3, background: "#f8fafc", borderRadius: 6, fontSize: 12 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: `linear-gradient(135deg,${avColor(m.name)},${avColor2(m.name)})`,
                        color: "#fff", fontSize: 8, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>{avInitials(m.name)}</span>
                      <span style={{ flex: 1, fontWeight: 500 }}>{m.name}</span>
                      <select value={m.role} onChange={e => setTeamMemberRole(team.id, m.name, e.target.value as TeamRole)}
                        style={{ padding: "2px 6px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 10, fontFamily: "inherit", color: m.role === "admin" ? "#dc2626" : m.role === "editor" ? "#2563eb" : "#64748b" }}>
                        {(Object.entries(TEAM_ROLE_LABELS) as [TeamRole, string][]).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <button onClick={() => removeTeamMember(team.id, m.name)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "inline-flex", padding: 2 }}>
                        <XMarkIcon style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  ))}
                  {/* 미배정 멤버 추가 드롭다운 */}
                  {unassignedMembers.length > 0 && (
                    <select
                      value=""
                      onChange={e => { if (e.target.value) addTeamMember(team.id, e.target.value, "editor"); }}
                      style={{ width: "100%", padding: "5px 8px", border: "1.5px dashed #93c5fd", borderRadius: 6, fontSize: 11, color: "#2563eb", background: "#eff6ff", marginTop: 4, fontFamily: "inherit", cursor: "pointer" }}
                    >
                      <option value="">+ 멤버 추가...</option>
                      {unassignedMembers.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                  {unassignedMembers.length === 0 && team.members.length < members.length && (
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>모든 멤버가 팀에 배정되었습니다</div>
                  )}
                </div>

                {/* 프로젝트 연결 */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.5px" }}>담당 프로젝트</div>
                  {team.projectIds.map(pid => {
                    const p = projects.find(pr => pr.id === pid);
                    if (!p) return null;
                    return (
                      <div key={pid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", marginBottom: 3, background: "#f8fafc", borderRadius: 6, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                        <button onClick={() => removeTeamProject(team.id, pid)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "inline-flex", padding: 2 }}>
                          <XMarkIcon style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    );
                  })}
                  {/* 미연결 프로젝트 추가 */}
                  {unassignedProjects.length > 0 && (
                    <select
                      value=""
                      onChange={e => { if (e.target.value) addTeamProject(team.id, parseInt(e.target.value)); }}
                      style={{ width: "100%", padding: "5px 8px", border: "1.5px dashed #93c5fd", borderRadius: 6, fontSize: 11, color: "#2563eb", background: "#eff6ff", marginTop: 4, fontFamily: "inherit", cursor: "pointer" }}
                    >
                      <option value="">+ 프로젝트 연결...</option>
                      {unassignedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
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
  </>;
}
