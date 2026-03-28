import { useRef, useEffect, useState } from "react";
import { useTodoApp } from "./hooks/useTodoApp";
import { PermissionProvider } from "./auth/PermissionContext";
import { S } from "./styles";
import { isOD, dDay, fD, fDow, fmt2, stripHtml, dateStr } from "./utils";
import { REPEAT_OPTS, AVATAR_COLORS } from "./constants";

import { Toast } from "./components/ui/Toast";
import { Modal } from "./components/ui/Modal";
import { Chip } from "./components/ui/Chip";
import { DropPanel } from "./components/ui/DropPanel";
import { ProgressBar } from "./components/ui/ProgressBar";
import { RepeatBadge } from "./components/ui/RepeatBadge";
import { SectionLabel } from "./components/ui/SectionLabel";

import { DateTimePicker } from "./components/editor/DateTimePicker";
import { NotePopup } from "./components/editor/NotePopup";
import { CellRichPopup } from "./components/editor/CellRichPopup";

import { Sidebar } from "./components/sidebar/Sidebar";
import { AddTodoSection } from "./components/todo/AddTodoSection";
import { MemoView } from "./components/todo/MemoView";
import { EditForm } from "./components/todo/EditForm";
import { DetailView } from "./components/todo/DetailView";
import { Dashboard } from "./components/dashboard/Dashboard";
import { MultiMonthView } from "./components/calendar/MultiMonthView";
import { ProjMgr } from "./components/settings/ProjMgr";
import { SettingsMgr } from "./components/settings/SettingsMgr";

const avColor = (name: string) => {
  const idx = name ? name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
};
const avColor2 = (name: string) => {
  const idx = name ? name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[(idx+3)%AVATAR_COLORS.length];
};
const avInitials = (name: string) => name ? name.slice(-2) : "?";

function LoginScreen({members,onLogin}: {members: string[], onLogin: (name: string) => void}) {
  return <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:"'Pretendard',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
    <div style={{position:"sticky",top:0,zIndex:100,background:"#172f5a",padding:"20px 36px",textAlign:"center",boxShadow:"0 2px 16px rgba(0,0,0,.25)"}}>
      <img src="/bgk_logo_white.png" alt="Bridging Group" style={{height:40,width:"auto",display:"block",margin:"0 auto"}}/>
    </div>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px"}}>
      <div style={{background:"#fff",borderRadius:20,width:480,maxWidth:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.12)",padding:"32px 36px"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:18,fontWeight:700,color:"#172f5a",marginBottom:6}}>팀 TODO 통합관리</div>
          <div style={{fontSize:13,color:"#94a3b8"}}>계속하려면 계정을 선택하세요</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {members.map((m,i)=>{
            const c=AVATAR_COLORS[i%AVATAR_COLORS.length];
            return <button key={m} onClick={()=>onLogin(m)}
              style={{padding:"14px 12px",border:"1.5px solid #e2e8f0",borderRadius:12,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .15s",fontFamily:"inherit",textAlign:"left"}}
              onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.borderColor=c;b.style.background=c+"11";b.style.transform="translateY(-1px)";b.style.boxShadow=`0 4px 12px ${c}22`;}}
              onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.borderColor="#e2e8f0";b.style.background="#fff";b.style.transform="none";b.style.boxShadow="none";}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${c},${AVATAR_COLORS[(i+3)%AVATAR_COLORS.length]})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,flexShrink:0}}>{m[0]}</div>
              <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{m}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
  </div>;
}

export default function App() {
  const app = useTodoApp();
  const {
    projects, setProjects, todos, setTodos, nId, setNId, pNId, setPNId,
    members, setMembers, pris, setPris, stats, setStats,
    priC, setPriC, priBg, setPriBg, stC, setStC, stBg, setStBg,
    view, setView, toast, filters, setFilters, favSidebar, togFavSidebar,
    search, setSearch, editCell, setEditCell, sortCol, sortDir,
    newRows, setNewRows, kbF, setKbF, kbFWho, setKbFWho,
    dragId, setDragId, dragOver, setDragOver,
    calF, setCalF, calFWho, setCalFWho, calY, calM, calD,
    calView, setCalView, customDays, setCustomDays,
    editMod, setEditMod, detMod, setDetMod, projMod, setProjMod, settMod, setSettMod,
    chipAdd, setChipAdd, chipVal, setChipVal, chipColor, setChipColor,
    aiText, setAiText, aiFiles, setAiFiles, aiLoad, aiSt, setAiSt, apiKey, setApiKey,
    aiParsed, setAiParsed, addTab, setAddTab,
    detPopup, setDetPopup, notePopup, setNotePopup,
    datePop, setDatePop, nrDatePop, setNrDatePop,
    hoverRow, setHoverRow, currentUser, setCurrentUser,
    userFavs, isFav, toggleFav, userSettings, setUserSettings,
    expandMode, setExpandMode, todoView, setTodoView, showDone, setShowDone, memoCols, setMemoCols,
    selectedIds, lastSelRef, addSecRef, tblDivRef,
    clrSel, movePop, setMovePop, bulkPop, setBulkPop,
    historyRef, redoRef,
    aProj, gPr, filtered, sorted, sortIcon,
    visibleTodoIds, allVisibleSelected, someVisibleSelected,
    ftodosExpanded, calRangeDs, todayStr, calDays,
    undo, redo, flash, forceFirestoreSync, updTodo, addTodo, delTodo,
    toggleSort, togF, handleCheck, toggleSelectAll,
    calDate, setCalDate, calToday, calNav, calTitle, weekDates, customDates, agendaItems, evStyle,
    saveMod, addNR, isNREmpty, saveOneNR, saveNRs,
    parseAI, confirmAI, addChip,
    deletedLog,
  } = app;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "Z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      // 선택된 항목 Delete 키 삭제
      if (e.key === "Delete" && selectedIds.size > 0 && view !== "calendar") {
        if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`)) return;
        setTodos((p: any) => p.filter((t: any) => !selectedIds.has(t.id)));
        flash(`${selectedIds.size}건이 삭제되었습니다`, "err");
        clrSel();
        return;
      }
      // 캘린더 뷰 단축키
      if (view === "calendar") {
        if (e.key === "t" || e.key === "T") { calTodayFn(); return; }
        if (e.key === "ArrowLeft") { calNav(-1); return; }
        if (e.key === "ArrowRight") { calNav(1); return; }
        if (e.key === "d" || e.key === "D") { setCalView("day"); return; }
        if (e.key === "w" || e.key === "W") { setCalView("week"); return; }
        if (e.key === "m" || e.key === "M") { setCalView("month"); return; }
        if (e.key === "a" || e.key === "A") { setCalView("agenda"); return; }
      }
      // 메모 뷰: 1~5 → 열 수 변경
      if (todoView === "memo") {
        const n = parseInt(e.key);
        if (n >= 1 && n <= 5) setMemoCols(n);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, todoView, selectedIds, setTodos, flash, clrSel, setMemoCols, calToday, calNav, setCalView, undo, redo]);

  // ── 캘린더 팝오버 / 빠른 추가 상태 ──────────────────────────────
  const [calEvPop, setCalEvPop] = useState<{todo:any,x:number,y:number}|null>(null);
  const [calQA, setCalQA] = useState<{ds:string,h:number,x:number,y:number}|null>(null);
  const [calQATitle, setCalQATitle] = useState("");
  const [calQADue, setCalQADue] = useState("");
  const [calQAPid, setCalQAPid] = useState("");
  const [calQAWho, setCalQAWho] = useState("");
  const [calQAPri, setCalQAPri] = useState("보통");
  const [calQAPicker, setCalQAPicker] = useState<string|null>(null);
  const [calDayPop, setCalDayPop] = useState<{ds:string,todos:any[],x:number,y:number}|null>(null);
  const [calSidebarOpen, setCalSidebarOpen] = useState(true); // 캘린더 우측 사이드바 열림 여부
  const [calSidebarAdding, setCalSidebarAdding] = useState(false); // 사이드바 인라인 업무추가
  const [calSidebarAddTitle, setCalSidebarAddTitle] = useState("");
  // 칸반 삽입 위치 (beforeId: 해당 카드 앞에 삽입, null = 컬럼 맨 끝)
  const [kbInsert, setKbInsert] = useState<{beforeId:number|null,st:string}|null>(null);
  // 칸반 카드 순서 — userSettings 기반 (Firestore 동기화)
  const kanbanOrder: number[] = currentUser ? (userSettings[currentUser]?.kanbanOrder ?? []) : [];
  const setKanbanOrder = (order: number[]) => {
    if (!currentUser) return;
    setUserSettings((prev: any) => ({ ...prev, [currentUser]: { ...prev[currentUser], kanbanOrder: order } }));
  };
  // ── 사이드바 인터랙션 상태 ──────────────────────────────────────
  const [pendingComplete, setPendingComplete] = useState<Set<number>>(new Set()); // 완료 애니메이션 중인 ID
  const [sidebarDoneOpen, setSidebarDoneOpen] = useState(false); // 완료됨 섹션 열림
  const [secNodateOpen, setSecNodateOpen] = useState(true); // 날짜 없음 섹션
  const [secTodayOpen, setSecTodayOpen] = useState(true);   // 오늘 섹션
  const [secWeekOpen, setSecWeekOpen] = useState(true);     // 이번 주 섹션
  const [secLaterOpen, setSecLaterOpen] = useState(true);   // 나중에 섹션
  // 사이드바 순서 — userSettings 기반 (Firestore 동기화)
  const sidebarOrder: number[] = currentUser ? (userSettings[currentUser]?.sidebarOrder ?? []) : [];
  const setSidebarOrder = (order: number[]) => {
    if (!currentUser) return;
    setUserSettings((prev: any) => ({ ...prev, [currentUser]: { ...prev[currentUser], sidebarOrder: order } }));
  };
  const [sidebarEditId, setSidebarEditId] = useState<number|null>(null); // 인라인 편집 중인 ID
  const [sidebarEditVal, setSidebarEditVal] = useState(""); // 인라인 편집 값
  const [sidebarHoverId, setSidebarHoverId] = useState<number|null>(null); // 호버 중인 ID
  const [sidebarDragId, setSidebarDragId] = useState<number|null>(null); // 드래그 중인 ID
  const [sidebarDragOver, setSidebarDragOver] = useState<number|null>(null); // 드래그 오버 중인 ID
  const [sidebarDateId, setSidebarDateId] = useState<number|null>(null); // 날짜 빠른 변경 팝업 ID
  const [sidebarExpandId, setSidebarExpandId] = useState<number|null>(null); // 확장(클릭) 중인 ID
  const [sidebarDetId, setSidebarDetId] = useState<number|null>(null);       // 세부정보 편집 중인 ID
  const [sidebarProjId, setSidebarProjId] = useState<number|null>(null);    // 프로젝트 선택 팝업 ID
  const detDivRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  // 별표 — userSettings 기반 (Firestore 동기화)
  const starredIds: Set<number> = new Set(currentUser ? (userSettings[currentUser]?.starredIds ?? []) : []);
  const toggleStar = (id: number) => {
    if (!currentUser) return;
    setUserSettings((prev: any) => {
      const cur: number[] = prev[currentUser]?.starredIds ?? [];
      const n = cur.includes(id) ? cur.filter((x: number) => x !== id) : [...cur, id];
      return { ...prev, [currentUser]: { ...prev[currentUser], starredIds: n } };
    });
  };
  // 숨겨진 프로젝트 — userSettings 기반 (Firestore 동기화)
  const hiddenProjects: number[] = currentUser ? (userSettings[currentUser]?.hiddenProjects ?? []) : [];
  const toggleHideProject = (id: number) => {
    if (!currentUser) return;
    setUserSettings((prev: any) => {
      const cur: number[] = prev[currentUser]?.hiddenProjects ?? [];
      const n = cur.includes(id) ? cur.filter((x: number) => x !== id) : [...cur, id];
      return { ...prev, [currentUser]: { ...prev[currentUser], hiddenProjects: n } };
    });
  };
  const visibleProj = aProj.filter(p => !hiddenProjects.includes(p.id));
  // 숨겨진 담당자 — userSettings 기반 (Firestore 동기화)
  const hiddenMembers: string[] = currentUser ? (userSettings[currentUser]?.hiddenMembers ?? []) : [];
  const toggleHideMember = (name: string) => {
    if (!currentUser) return;
    setUserSettings((prev: any) => {
      const cur: string[] = prev[currentUser]?.hiddenMembers ?? [];
      const n = cur.includes(name) ? cur.filter((x: string) => x !== name) : [...cur, name];
      return { ...prev, [currentUser]: { ...prev[currentUser], hiddenMembers: n } };
    });
  };
  const visibleMembers = members.filter(m => !hiddenMembers.includes(m));
  const sidebarExpand = (id: number|null) => {
    // 다른 항목으로 전환 전 현재 세부정보 자동저장 (DOM에서 직접 읽기)
    if (sidebarDetId !== null) {
      const el = detDivRefs.current.get(sidebarDetId);
      if (el) {
        const html = el.innerHTML === "<br>" ? "" : el.innerHTML;
        const cur = todos.find(x => x.id === sidebarDetId);
        if (cur && html !== (cur.det||"")) updTodo(sidebarDetId, {det: html});
      }
    }
    setSidebarExpandId(id);
    setSidebarDetId(id);
  };
  const [calTodayKey, setCalTodayKey] = useState(0);                    // 오늘 이동 트리거
  const calTodayFn = () => { calToday(); setCalTodayKey(k => k + 1); };
  const [calDragId, setCalDragId] = useState<number|null>(null);         // 캘린더 드래그 중인 todo ID
  const [calDragOverDs, setCalDragOverDs] = useState<string|null>(null); // 드래그 hover 날짜
  const [calDragOverH, setCalDragOverH] = useState<number|null>(null);   // 드래그 hover 시간
  const gridScrolled = useRef(false);
  const [hoverRowRect, setHoverRowRect] = useState<{top:number,height:number}|null>(null);
  const hoverLeaveTimer = useRef<any>(null);
  const justOpenedPopup = useRef(false); // 팝업 열림 직후 window click 핸들러 skip용

  useEffect(() => {
    gridScrolled.current = false;
    if (calView !== "month") window.scrollTo(0, 0);
  }, [calView, calY, calM, calD]);

  useEffect(() => {
    const close = () => {
      if (justOpenedPopup.current) { justOpenedPopup.current = false; return; }
      setCalEvPop(null); setCalQA(null); setCalDayPop(null); setSidebarProjId(null); setSidebarDateId(null);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (!document.getElementById("det-ph-style")) {
      const s = document.createElement("style");
      s.id = "det-ph-style";
      s.textContent = "[data-det-ph]:empty:before{content:attr(data-det-ph);color:#94a3b8;font-size:12px;pointer-events:none;font-family:inherit}";
      document.head.appendChild(s);
    }
  }, []);

  const openEvPop = (e: React.MouseEvent, t: any) => {
    e.stopPropagation();
    justOpenedPopup.current = true;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(r.right + 8, window.innerWidth - 308);
    const y = Math.min(r.top, window.innerHeight - 290);
    setCalEvPop({todo: todos.find(x => x.id === t.id) || t, x, y});
    setCalQA(null); setCalDayPop(null);
  };

  const openQA = (e: React.MouseEvent, ds: string, h: number) => {
    e.stopPropagation();
    justOpenedPopup.current = true; // window click 핸들러가 즉시 닫지 못하게 차단
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popW = 300;
    // 오른쪽 오버플로우 시 팝업을 왼쪽으로 배치
    const x = r.left + 8 + popW > window.innerWidth
      ? Math.max(8, r.right - popW)
      : r.left + 8;
    const y = Math.min(r.bottom + 4, window.innerHeight - 200);
    setCalQA({ds, h, x, y}); setCalQATitle(""); setCalQADue(""); setCalQAPid(""); setCalQAWho(currentUser||""); setCalQAPri("보통"); setCalQAPicker(null);
    setCalEvPop(null); setCalDayPop(null);
  };

  const saveQA = () => {
    if (!calQA || !calQATitle.trim()) return;
    addTodo({pid: calQAPid ? parseInt(calQAPid) : 0, task: calQATitle.trim(), who: calQAWho||currentUser||"", due: calQADue, pri: calQAPri, st:"대기", det:"", repeat:"없음"});
    setCalQA(null); setCalQATitle(""); flash("업무가 등록되었습니다");
  };

  // ── 캘린더 드래그 헬퍼 ─────────────────────────────────────────
  const calDragStart = (id: number) => { setCalDragId(id); document.body.style.cursor = "grabbing"; };
  const calDragEnd = () => { setCalDragId(null); setCalDragOverDs(null); setCalDragOverH(null); document.body.style.cursor = ""; };
  const calDropOnDate = (ds: string, h?: number) => {
    const draggedId = calDragId ?? sidebarDragId;
    if (draggedId === null) return;
    const t = todos.find(x => x.id === draggedId);
    if (t) {
      const newDue = (h !== undefined && h >= 0) ? `${ds} ${String(h).padStart(2,"0")}:00` : ds;
      if ((t.due || "") !== newDue) {
        updTodo(draggedId, {due: newDue});
        flash(`'${t.task}' 일정이 변경되었습니다`);
      }
    }
    setCalDragId(null); setCalDragOverDs(null); setCalDragOverH(null);
    setSidebarDragId(null); setSidebarDragOver(null); document.body.style.cursor = "";
  };

  // A1: 완료 체크 시 취소선 애니메이션 후 완료 섹션으로 이동
  const handleSideComplete = (id: number, isDone: boolean) => {
    if (!isDone) {
      setPendingComplete(s => new Set([...s, id]));
      setTimeout(() => {
        updTodo(id, {st: "완료"});
        setPendingComplete(s => { const n = new Set(s); n.delete(id); return n; });
        flash("완료 처리되었습니다 ✓");
      }, 600);
    } else {
      updTodo(id, {st: "대기"});
      flash("완료 해제되었습니다");
    }
  };

  if (!currentUser) return (
    <PermissionProvider currentUser={null}>
      <LoginScreen members={members} onLogin={name => setCurrentUser(name)}/>
    </PermissionProvider>
  );

  const CellEdit = ({todo, field, children}: {todo: any, field: string, children: React.ReactNode}) => {
    const isE = editCell?.id === todo.id && editCell?.field === field;
    const stop = () => setEditCell(null);
    const start = () => setEditCell({id: todo.id, field});
    const save = (val: string) => { updTodo(todo.id, {[field]: field === "pid" ? parseInt(val) : val}); stop(); };
    if (!isE) return <td style={S.tdc} onClick={e => { if (field === "due") { const r = e.currentTarget.getBoundingClientRect(); setDatePop({id: todo.id, rect: r, value: todo.due || ""}); } start(); }}>{children}</td>;
    if (field === "task") return <td style={{...S.tdc, overflow:"visible"}}><input autoFocus defaultValue={todo.task} style={S.iinp} onKeyDown={e => { if ((e as any).key === "Enter") save((e.target as HTMLInputElement).value); if ((e as any).key === "Escape") stop(); }} onBlur={e => save(e.target.value)}/></td>;
    if (field === "due") return <td style={{...S.tdc, background:"#eff6ff"}}>{children}</td>;
    if (field === "pid") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={visibleProj.map(p => ({value: String(p.id), label: p.name, color: p.color}))} current={String(todo.pid)} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={S.dot(it.color!)}/>{it.label}</>}/></td>;
    if (field === "who") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={visibleMembers.map(m => ({value: m, label: m}))} current={todo.who} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(it.label)},${avColor2(it.label)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0}}>{avInitials(it.label)}</span>{it.label}</>}/></td>;
    if (field === "pri") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><span style={{...S.badge(priBg[todo.pri], priC[todo.pri], `1px solid ${priC[todo.pri]}55`), display:"inline-flex", alignItems:"center", gap:3, opacity:.85}}><span>●</span>{todo.pri}<span style={{fontSize:8,opacity:.6}}>▾</span></span><DropPanel items={pris.map(p => ({value: p, label: p, color: priC[p]}))} current={todo.pri} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{...S.dot(it.color!), width:8, height:8}}/>{it.label}</>}/></td>;
    if (field === "st") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><span style={{...S.badge(stBg[todo.st], stC[todo.st], `1px solid ${stC[todo.st]}55`), display:"inline-flex", alignItems:"center", gap:3, opacity:.85}}>{todo.st}<span style={{fontSize:8,opacity:.6}}>▾</span></span><DropPanel items={stats.map(s => ({value: s, label: s, color: stC[s]}))} current={todo.st} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{...S.dot(it.color!), width:8, height:8}}/>{it.label}</>}/></td>;
    if (field === "repeat") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={REPEAT_OPTS.map(r => ({value: r, label: r}))} current={todo.repeat || "없음"} onSelect={v => save(v)} onClose={stop} alignRight/></td>;
    return <td style={S.tdc}>{children}</td>;
  };

  const content = <div style={S.wrap}>
    <header style={S.hdr}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <img src="/bgk_logo_white.png" alt="Bridging Group" onClick={()=>window.location.reload()} style={{height:32,width:"auto",display:"block",flexShrink:0,cursor:"pointer"}}/>
        <div style={{width:1,height:20,background:"rgba(255,255,255,.3)"}}/>
        <div style={{fontSize:14,fontWeight:700,letterSpacing:"0.01em"}}>팀 TODO 통합관리</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <button style={S.hBtn} onClick={()=>setProjMod(true)}>📁 프로젝트</button>
        <button style={S.hBtn} onClick={()=>setSettMod(true)}>⚙️ 설정</button>
        <button style={{...S.hBtn,opacity:historyRef.current.length?1:.4}} onClick={undo} title="되돌리기 (Ctrl+Z)">↩️ 되돌리기</button>
        <button style={{...S.hBtn,opacity:redoRef.current.length?1:.4}} onClick={redo} title="다시 실행 (Ctrl+Y)">↪️ 다시 실행</button>
        <span style={S.hBdg}>{todos.length}건</span>
        <div style={{width:1,height:20,background:"rgba(255,255,255,.25)",margin:"0 4px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.25)",border:"1.5px solid rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>{currentUser?.[0]}</div>
          <span style={{fontSize:12,fontWeight:600,color:"#fff"}}>{currentUser}</span>
          <button style={{...S.hBtn,fontSize:10,padding:"3px 10px",background:"rgba(255,255,255,.12)"}} onClick={()=>setCurrentUser(null)}>로그아웃</button>
        </div>
      </div>
    </header>

    <nav style={S.nav}>
      {[["dashboard","📊 대시보드"],["kanban","📌 칸반"],["list","📋 리스트"],["calendar","📅 캘린더"]].map(([k,l])=><button key={k} style={S.navB(view===k)} onClick={()=>setView(k)}>{l}{k==="kanban"&&(kbF.length>0||kbFWho.length>0)&&<span style={{fontSize:9,background:"#ef4444",color:"#fff",borderRadius:99,padding:"0 5px",marginLeft:5,fontWeight:700,verticalAlign:"middle"}}>{kbF.length+kbFWho.length}</span>}</button>)}
    </nav>

    <main style={S.main}>
      {view==="dashboard"&&<Dashboard todos={todos} projects={projects} members={members} priC={priC} priBg={priBg} stC={stC} stBg={stBg} gPr={gPr} deletedLog={deletedLog}/>}

      {view==="kanban"&&<div>
        {/* 프로젝트 필터 + 새 업무 버튼 */}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6,alignItems:"flex-start"}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <Chip active={kbF.length===0} onClick={()=>setKbF([])}>전체</Chip>
            {visibleProj.map(p=><Chip key={p.id} active={kbF.includes(String(p.id))} color={p.color} onClick={()=>setKbF(kbF.includes(String(p.id))?kbF.filter(x=>x!==String(p.id)):[...kbF,String(p.id)])}>{p.name}</Chip>)}
          </div>
          <button style={S.bp} onClick={()=>setEditMod({pid:"",task:"",who:"",due:"",pri:"보통",st:"대기",det:"",repeat:"없음"})}>+ 새 업무</button>
        </div>
        {/* 담당자 필터 */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          <Chip active={kbFWho.length===0} onClick={()=>setKbFWho([])}>전체</Chip>
          {members.map(n=><Chip key={n} active={kbFWho.includes(n)} onClick={()=>setKbFWho(kbFWho.includes(n)?kbFWho.filter(x=>x!==n):[...kbFWho,n])}>{n}</Chip>)}
        </div>
        {/* 칸반 보드 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,alignItems:"start"}}>
          {stats.map(st=>{
            // kanbanOrder 기준으로 카드 정렬
            const raw=todos.filter(t=>t.st===st&&(!kbF.length||kbF.includes(String(t.pid)))&&(!kbFWho.length||kbFWho.includes(t.who)));
            const items=(()=>{
              if(!kanbanOrder.length) return raw;
              const idx=new Map(kanbanOrder.map((id,i)=>[id,i]));
              return [...raw].sort((a,b)=>(idx.has(a.id)?idx.get(a.id)!:9999)-(idx.has(b.id)?idx.get(b.id)!:9999));
            })();
            const isOver=dragOver===st;
            return <div key={st} style={{borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}
              onDragOver={e=>{
                e.preventDefault();
                // 카드 위가 아닌 컬럼 빈 영역 → 맨 끝 삽입
                if(!(e.target as HTMLElement).closest('[data-kbcard]')){
                  setDragOver(st);
                  setKbInsert({beforeId:null,st});
                }
              }}
              onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setDragOver(null);setKbInsert(null);}}}
              onDrop={e=>{
                e.preventDefault();
                if(dragId){
                  const dt=todos.find(t=>t.id===dragId);
                  // ① 항상 드롭된 컬럼의 st 사용 (kbInsert.st는 다른 컬럼에서 온 stale 값일 수 있음)
                  updTodo(dragId,{st});
                  // kanbanOrder 업데이트
                  const allIds=todos.map(t=>t.id);
                  const base=[...new Set([...kanbanOrder.filter(id=>allIds.includes(id)),...allIds])];
                  const fromIdx=base.indexOf(dragId);
                  if(fromIdx>=0) base.splice(fromIdx,1);
                  // ② beforeId가 dragId 자신이면 무시 (self-reference 방지)
                  const safeBeforeId=kbInsert?.st===st&&kbInsert?.beforeId!=null&&kbInsert.beforeId!==dragId
                    ?kbInsert.beforeId:null;
                  if(safeBeforeId!=null){
                    // 지정 카드 앞에 삽입
                    const toIdx=base.indexOf(safeBeforeId);
                    if(toIdx>=0) base.splice(toIdx,0,dragId); else base.push(dragId);
                  } else {
                    base.push(dragId);
                  }
                  setKanbanOrder(base);
                  if(dt?.st!==st) flash(`'${dt?.task||"업무"}'를 '${st}'으로 이동했습니다`);
                }
                setDragId(null);setDragOver(null);setKbInsert(null);document.body.style.cursor="";
              }}>
              {/* 칼럼 헤더 */}
              <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:6,fontWeight:700,fontSize:12,background:isOver?stC[st]+"33":stBg[st]||"#f1f5f9",color:stC[st]||"#334155",transition:"background .15s"}}>
                <span style={{...S.dot(stC[st]||"#94a3b8"),width:8,height:8}}/>{st}
                <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"rgba(0,0,0,.12)",color:"inherit"}}>{items.length}</span>
                  <button onClick={()=>setEditMod({pid:"",task:"",who:"",due:"",pri:"보통",st,det:"",repeat:"없음"})} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,lineHeight:1,color:stC[st]||"#64748b",padding:"0 2px",opacity:.75,fontWeight:300}} title={`${st} 업무 추가`}>+</button>
                </span>
              </div>
              {/* 칼럼 바디 */}
              <div style={{background:isOver?"#f0f7ff":"#f8fafc",padding:6,minHeight:120,maxHeight:"calc(100vh - 280px)",overflowY:"auto",display:"flex",flexDirection:"column",gap:0,transition:"background .15s",
                outline:isOver?`2px dashed ${stC[st]||"#2563eb"}`:"none",outlineOffset:-2,borderRadius:"0 0 10px 10px"}}>
                {items.length?items.map((t,cardIdx)=>{
                  const p=gPr(t.pid),od=isOD(t.due,t.st),isDragging=dragId===t.id;
                  const showLine=kbInsert?.st===st&&kbInsert?.beforeId===t.id;
                  return <div key={t.id}>
                    {/* 삽입 위치 파란 라인 */}
                    {showLine&&<div style={{height:3,background:"#2563eb",borderRadius:2,margin:"2px 4px 4px"}}/>}
                    {isDragging
                      ?<div style={{borderRadius:7,minHeight:72,border:"2px dashed #cbd5e1",background:"#f1f5f9",marginBottom:5}}/>
                      :<div data-kbcard
                          draggable
                          onDragStart={e=>{setDragId(t.id);e.dataTransfer.effectAllowed="move";document.body.style.cursor="grabbing";}}
                          onDragEnd={()=>{setDragId(null);setDragOver(null);setKbInsert(null);document.body.style.cursor="";}}
                          onDragOver={e=>{
                            e.preventDefault();e.stopPropagation();
                            setDragOver(st);
                            const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
                            // 카드 상반부 → 이 카드 앞에, 하반부 → 다음 카드 앞에 삽입
                            if(e.clientY<rect.top+rect.height/2){
                              setKbInsert({beforeId:t.id,st});
                            } else {
                              const next=items[cardIdx+1];
                              setKbInsert({beforeId:next?.id??null,st});
                            }
                          }}
                          onClick={()=>setDetMod(t)}
                          style={{background:"#fff",borderRadius:7,padding:10,boxShadow:"0 1px 3px rgba(0,0,0,.08)",borderLeft:`4px solid ${priC[t.pri]||"#94a3b8"}`,cursor:"grab",transition:"box-shadow .15s",marginBottom:5}}>
                          <div style={{fontSize:10,color:"#94a3b8",display:"flex",alignItems:"center",gap:4,marginBottom:3}}><span style={{...S.dot(p.color),width:6,height:6}}/>{p.name}</div>
                          <div style={{fontSize:13,fontWeight:600,marginBottom:5,display:"flex",alignItems:"center",gap:4}}>{t.task}<RepeatBadge repeat={t.repeat}/></div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:"#64748b"}}><span>{t.who}</span><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:od?"#dc2626":"#94a3b8"}}>{fD(t.due)}</span>{(()=>{const dd=dDay(t.due,t.st);return dd?<span style={{fontSize:10,fontWeight:700,color:dd.color,background:dd.bg,border:`1px solid ${dd.border}`,padding:"0 5px",borderRadius:3}}>{dd.label}</span>:null;})()}</span></div>
                        </div>}
                  </div>;
                }):<div style={{textAlign:"center",padding:"28px 8px",color:"#cbd5e1",fontSize:11,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <span style={{fontSize:22,opacity:.6}}>📋</span>
                    <span>업무가 없습니다</span>
                    <span style={{fontSize:10,color:"#d1d5db"}}>카드를 드래그해서 이동하세요</span>
                  </div>}
                {/* 컬럼 맨 끝 삽입 라인 */}
                {kbInsert?.st===st&&kbInsert?.beforeId===null&&<div style={{height:3,background:"#2563eb",borderRadius:2,margin:"2px 4px"}}/>}
              </div>
            </div>;
          })}
        </div>
      </div>}

      {view==="list"&&<div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <Sidebar
          search={search} setSearch={setSearch} filters={filters} togF={togF}
          todos={todos} aProj={aProj} members={members} pris={pris} priC={priC}
          stats={stats} stC={stC} favSidebar={favSidebar} togFavSidebar={togFavSidebar}
          isFav={isFav} gPr={gPr} setChipAdd={setChipAdd} setChipVal={setChipVal}
          setChipColor={setChipColor} projects={projects}
          hiddenProjects={hiddenProjects} toggleHideProject={toggleHideProject}
          hiddenMembers={hiddenMembers} toggleHideMember={toggleHideMember}
        />

        <div style={{flex:1,minWidth:0}}>
        <div ref={addSecRef} style={{overflow:"hidden"}}>
        <AddTodoSection
          addTab={addTab} setAddTab={setAddTab} newRows={newRows} setNewRows={setNewRows}
          addNR={addNR} saveNRs={saveNRs} saveOneNR={saveOneNR} isNREmpty={isNREmpty}
          aProj={visibleProj} members={visibleMembers} pris={pris} setNotePopup={setNotePopup}
          setNrDatePop={setNrDatePop} aiText={aiText} setAiText={setAiText}
          aiFiles={aiFiles} setAiFiles={setAiFiles}
          aiLoad={aiLoad} aiSt={aiSt} setAiSt={setAiSt} aiParsed={aiParsed}
          setAiParsed={setAiParsed} parseAI={parseAI} confirmAI={confirmAI}
          priC={priC} priBg={priBg} sorted={sorted} filters={filters} currentUser={currentUser}
        />
        </div>

        <div style={{position:"sticky",top:94,zIndex:20,background:"#f0f4f8",paddingTop:4,paddingBottom:4,marginBottom:0}}>
        <SectionLabel num="02" title="업무 리스트" sub={`총 ${sorted.length}건${filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search?" (필터 적용 중)":""}`}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {todoView==="memo"&&<div style={{display:"flex",gap:3}}>
              {([1,2,3,4,5] as const).map(n=>(
                <button key={n} onClick={()=>setMemoCols(n)}
                  style={{padding:"5px 12px",borderRadius:6,border:`1.5px solid ${memoCols===n?"#2563eb":"#e2e8f0"}`,background:memoCols===n?"#2563eb":"#fff",color:memoCols===n?"#fff":"#64748b",fontSize:13,fontWeight:memoCols===n?700:500,cursor:"pointer"}}>
                  {n}
                </button>))}
            </div>}
            <div style={{display:"flex",border:"1.5px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
              {([["list","☰ 리스트"],["memo","📋 메모"]] as [string,string][]).map(([v,label])=>
                <button key={v} onClick={()=>setTodoView(v as "list"|"memo")} style={{fontSize:11,padding:"4px 12px",border:"none",borderRight:v==="list"?"1.5px solid #e2e8f0":"none",background:todoView===v?"#2563eb":"#fff",color:todoView===v?"#fff":"#64748b",cursor:"pointer",fontWeight:todoView===v?700:400,transition:"all .15s"}}>
                  {label}
                </button>)}
            </div>
          </div>
        </SectionLabel>
        {/* 공통 필터 칩 */}
        {(filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search)?<div style={{display:"flex",flexWrap:"wrap" as const,alignItems:"center",gap:6,padding:"8px 12px",marginBottom:8,borderRadius:8,background:"#f0f7ff",border:"1px solid #dbeafe"}}>
          <span style={{fontSize:11,color:"#64748b",fontWeight:600,flexShrink:0}}>적용된 필터</span>
          {search&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#dbeafe",color:"#1d4ed8",border:"1px solid #bfdbfe"}}>🔍 "{search}" <button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#1d4ed8",padding:0,fontSize:12,lineHeight:1}}>×</button></span>}
          {filters.proj.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#ede9fe",color:"#6d28d9",border:"1px solid #ddd6fe"}}>📁 {v==="__none__"?"미배정":aProj.find(p=>String(p.id)===v)?.name||v} <button onClick={()=>togF("proj",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#6d28d9",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          {filters.who.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#fce7f3",color:"#9d174d",border:"1px solid #fbcfe8"}}>👤 {v} <button onClick={()=>togF("who",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#9d174d",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          {filters.pri.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:priBg[v],color:priC[v],border:`1px solid ${priC[v]}44`}}>● {v} <button onClick={()=>togF("pri",v)} style={{background:"none",border:"none",cursor:"pointer",color:priC[v],padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          {filters.st.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:stBg[v],color:stC[v],border:`1px solid ${stC[v]}44`}}>{v} <button onClick={()=>togF("st",v)} style={{background:"none",border:"none",cursor:"pointer",color:stC[v],padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          {filters.repeat.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}}>🔁 {v} <button onClick={()=>togF("repeat",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#15803d",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          <button onClick={()=>{setSearch("");setFilters({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});}} style={{marginLeft:"auto",fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4}}>전체 초기화</button>
        </div>:null}
        </div>

        {/* 공통 헤더 바: 건수 + 정렬 */}
        {sorted.length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderRadius:8,background:"#fafbfc",border:"1px solid #f1f5f9",marginBottom:8}}>
          <span style={{fontSize:12,color:"#64748b"}}>
            <span style={{fontWeight:700,color:"#334155"}}>{sorted.filter(t=>t.st!=="완료").length}건 미완료</span>
            <span style={{margin:"0 6px",color:"#cbd5e1"}}>·</span>
            <span>{sorted.filter(t=>t.st==="완료").length}건 완료</span>
          </span>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {([["due","마감순"],["pri","우선순위순"],["id","기본"]] as [string,string][]).map(([col,label])=>
              <button key={col} onClick={()=>toggleSort(col)} style={{fontSize:11,padding:"3px 10px",borderRadius:99,border:`1px solid ${sortCol===col?"#2563eb":"#e2e8f0"}`,background:sortCol===col?"#2563eb":"#fff",color:sortCol===col?"#fff":"#64748b",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:3}}>
                {label}{sortCol===col&&<span style={{fontSize:8}}>{sortDir==="asc"?"▲":"▼"}</span>}
              </button>)}
            {todoView==="list"&&<>
              <div style={{width:1,height:16,background:"#e2e8f0",margin:"0 2px"}}/>
              <button onClick={()=>setExpandMode(p=>!p)} title="상세내용 펼치기/접기"
                style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,padding:"4px 10px",borderRadius:6,border:`1.5px solid ${expandMode?"#7c3aed":"#e2e8f0"}`,background:expandMode?"#7c3aed":"#fff",color:expandMode?"#fff":"#94a3b8",cursor:"pointer",fontWeight:600,transition:"all .15s"}}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="1" y="1" width="4.5" height="11" rx="1" fill={expandMode?"#fff":"#cbd5e1"}/>
                  <rect x="7" y="1" width="5" height="5" rx="1" fill={expandMode?"#c4b5fd":"#e2e8f0"}/>
                  <rect x="7" y="7" width="5" height="5" rx="1" fill={expandMode?"#c4b5fd":"#e2e8f0"}/>
                </svg>
                {expandMode?"상세 접기":"상세 펼치기"}
              </button>
            </>}
          </div>
        </div>}

        {todoView==="memo"&&<MemoView sorted={sorted} showDone={showDone} setShowDone={setShowDone} gPr={gPr} aProj={visibleProj} members={visibleMembers} pris={pris} stats={stats} priC={priC} priBg={priBg} stC={stC} stBg={stBg} updTodo={updTodo} addTodo={addTodo} currentUser={currentUser} delTodo={delTodo} isFav={isFav} toggleFav={toggleFav} flash={flash} cols={memoCols}/>}
        {todoView==="list"&&sorted.length===0&&<div style={{...S.card,padding:"36px 20px",textAlign:"center" as const,color:"#94a3b8"}}><div style={{fontSize:28,marginBottom:6}}>📭</div><div style={{fontSize:13,fontWeight:600}}>업무가 없습니다</div></div>}
        {todoView==="list"&&sorted.length>0&&<div style={{...S.card,padding:0,overflow:"hidden"}}>
          <div ref={tblDivRef} style={{overflowX:"auto",overflowY:"auto",maxHeight:"calc(100vh - 260px)"}}
            onScroll={e=>{
              const sy=(e.target as HTMLDivElement).scrollTop;
              if(addSecRef.current){
                if(sy===0){
                  addSecRef.current.style.maxHeight="";
                  addSecRef.current.style.opacity="1";
                } else {
                  const h=addSecRef.current.scrollHeight;
                  const ratio=Math.max(0,1-sy/Math.max(h,1));
                  addSecRef.current.style.maxHeight=`${ratio*h}px`;
                  addSecRef.current.style.opacity=String(Math.max(0,ratio*2-0.2).toFixed(2));
                }
              }
              if(tblDivRef.current){
                const sy2=sy>0?Math.min(sy,200):0;
                tblDivRef.current.style.maxHeight=`calc(100vh - 260px + ${sy2}px)`;
              }
            }}>
            <table style={{width:"100%",minWidth:800,borderCollapse:"collapse",tableLayout:"fixed"}}>
              <colgroup>
                {expandMode?<>
                  <col style={{width:"30%"}}/>
                  <col style={{width:"41%"}}/>
                  <col style={{width:"11%"}}/>
                  <col style={{width:"13%"}}/>
                  <col style={{width:"5%"}}/>
                </>:<>
                  <col style={{width:"32%"}}/>
                  <col style={{width:"22%"}}/>
                  <col style={{width:"10%"}}/>
                  <col style={{width:"12%"}}/>
                  <col style={{width:"10%"}}/>
                  <col style={{width:"10%"}}/>
                  <col style={{width:"4%"}}/>
                </>}
              </colgroup>
              <thead><tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
                {((expandMode
                  ?[["task","업무내용"],["det","상세내용"],["who","담당자"],["due","마감기한"]]
                  :[["task","업무내용"],["det","상세내용"],["who","담당자"],["due","마감기한"],["pri","우선순위"],["st","상태"]]
                 ) as [string,string][]).map(([col,label])=>
                  <th key={col} style={{...S.th,cursor:"pointer",userSelect:"none" as const}} onClick={()=>toggleSort(col)}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:3}}>{label}<span style={{fontSize:8,color:sortCol===col?"#2563eb":"#c0c8d4"}}>{sortIcon(col)}</span></span>
                  </th>)}
                <th style={{...S.th,width:36,padding:"0 6px",textAlign:"center" as const}}>
                  <input type="checkbox"
                    checked={allVisibleSelected}
                    ref={el=>{if(el)el.indeterminate=someVisibleSelected&&!allVisibleSelected;}}
                    onChange={toggleSelectAll}
                    title={allVisibleSelected?"전체 선택 해제":"전체 선택"}
                    style={{cursor:"pointer",width:14,height:14,accentColor:"#2563eb",verticalAlign:"middle"}}/>
                </th>
              </tr></thead>
              <tbody>
                {sorted.filter(t=>t.st!=="완료").map((t,idx,arr)=>{const od=isOD(t.due,t.st);
                  const plain=stripHtml(t.det||"");
                  const isUrgent=t.pri==="긴급";const isHigh=t.pri==="높음";const isLow=t.pri==="낮음";
                  const isSel=selectedIds.has(t.id);
                  const prevIsSel=isSel&&idx>0&&selectedIds.has(arr[idx-1].id);
                  const nextIsSel=isSel&&idx<arr.length-1&&selectedIds.has(arr[idx+1].id);
                  const selShadow=["inset 2px 0 0 #2563eb","inset -2px 0 0 #2563eb",...(!prevIsSel?["inset 0 2px 0 #2563eb"]:[]),...(!nextIsSel?["inset 0 -2px 0 #2563eb"]:[])].join(",");
                  const rowBg=isUrgent?"#fff8f8":isHigh?"#fffdf5":"#fff";
                  const rowBorder=isUrgent?"1px solid #fecaca":isHigh?"1px solid #fde68a":"1px solid #f1f5f9";
                  const taskColor=isUrgent?"#b91c1c":isHigh?"#92400e":isLow?"#94a3b8":"#0f172a";
                  const taskWeight=isUrgent?800:isHigh?700:isLow?400:600;
                  const bg=isSel?(isUrgent?"#fee2e2":"#dbeafe"):hoverRow===t.id?(isUrgent?"#fff0f0":isHigh?"#fffbee":"#f0f7ff"):rowBg;
                  return <tr key={t.id}
                    onMouseEnter={e=>{clearTimeout(hoverLeaveTimer.current);setHoverRow(t.id);const r=(e.currentTarget as HTMLTableRowElement).getBoundingClientRect();setHoverRowRect({top:r.top,height:r.height});}}
                    onMouseLeave={()=>{hoverLeaveTimer.current=setTimeout(()=>{setHoverRow(null);setHoverRowRect(null);},80);}}
                    style={{borderBottom:rowBorder,background:bg,...(isSel?{boxShadow:selShadow}:isUrgent?{boxShadow:"inset 3px 0 0 #dc2626"}:isHigh?{boxShadow:"inset 3px 0 0 #d97706"}:{})}}>
                    <td style={{...S.tdc,overflow:"visible",...(expandMode?{whiteSpace:"normal" as const,verticalAlign:"top" as const}:{})}}>
                      <div style={{display:"flex",alignItems:expandMode?"flex-start":"center",gap:12}}>
                        {/* 즐겨찾기 버튼: 행 안에 항상 표시 */}
                        <button onClick={e=>{e.stopPropagation();toggleFav(t.id);}} title={isFav(t.id)?"즐겨찾기 해제":"즐겨찾기"}
                          style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"0 2px",lineHeight:1,color:isFav(t.id)?"#f59e0b":"#d1d5db",transition:"color .15s",flexShrink:0}}
                          onMouseEnter={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#fbbf24";}}
                          onMouseLeave={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#d1d5db";}}>{isFav(t.id)?"★":"☆"}</button>
                        <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"완료"});flash("업무가 완료 처리되었습니다");}}
                          style={{width:17,height:17,borderRadius:"50%",border:"2px solid #94a3b8",background:"#fff",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all .15s"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#16a34a";e.currentTarget.style.background="#f0fdf4";(e.currentTarget.querySelector("svg") as HTMLElement).style.opacity="1";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#94a3b8";e.currentTarget.style.background="#fff";(e.currentTarget.querySelector("svg") as HTMLElement).style.opacity="0";}}>
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{opacity:0,transition:"opacity .15s",pointerEvents:"none"}}><path d="M1 3.5L3.5 6L8 1" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                          {editCell?.id===t.id&&editCell?.field==="task"
                            ?<input autoFocus defaultValue={t.task} style={S.iinp}
                               onKeyDown={e=>{if((e as any).key==="Enter"){updTodo(t.id,{task:(e.target as HTMLInputElement).value});setEditCell(null);}if((e as any).key==="Escape")setEditCell(null);}}
                               onBlur={e=>{updTodo(t.id,{task:e.target.value});setEditCell(null);}}/>
                            :<div style={{display:"flex",alignItems:expandMode?"flex-start":"center",gap:3,minWidth:0}}>
                               <span style={{fontWeight:taskWeight,color:taskColor,cursor:"pointer",fontSize:14,...(expandMode?{wordBreak:"break-word" as const}:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,minWidth:0})}} onClick={()=>setEditCell({id:t.id,field:"task"})}>{t.task}</span>
                               <RepeatBadge repeat={t.repeat}/>
                               {od&&<span style={{color:"#dc2626",fontSize:9}}>⚠️</span>}
                             </div>}
                          {!filters.proj.length&&(()=>{const p=gPr(t.pid);return p.id?<span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:99,background:p.color+"18",color:p.color,border:`1px solid ${p.color}33`,whiteSpace:"nowrap" as const,alignSelf:"flex-start" as const,display:"inline-block"}}>{p.name}</span>:null;})()}
                        </div>
                      </div>
                    </td>
                    <td style={{...S.tdc,maxWidth:0,...(expandMode?{whiteSpace:"normal" as const,verticalAlign:"top" as const,cursor:"text",wordBreak:"break-word" as const}:{})}}
                      onClick={expandMode?e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setNotePopup({todo:t,x:r.left,y:r.bottom});}:undefined}>
                      {expandMode
                        ?<div style={{fontSize:13,color:plain?"#374151":"#c0c8d4",lineHeight:1.7,padding:"4px 6px",fontStyle:plain?"normal":"italic",borderRadius:6,border:"1px solid transparent",transition:"border-color .15s"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="#e2e8f0";(e.currentTarget as HTMLDivElement).style.background="#fafbfc";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="transparent";(e.currentTarget as HTMLDivElement).style.background="transparent";}}
                            dangerouslySetInnerHTML={{__html:t.det||"<span style='color:#c0c8d4;font-style:italic'>메모 추가...</span>"}}/>
                        :<span onClick={e=>{e.stopPropagation();const r=e.currentTarget.closest("td")!.getBoundingClientRect();setNotePopup({todo:t,x:r.left,y:r.bottom});}}
                            style={{fontSize:13,color:plain?"#475569":"#c0c8d4",fontStyle:plain?"normal":"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"block",cursor:"text"}}>
                            {plain?plain.slice(0,50)+(plain.length>50?"…":""):"메모 추가..."}
                          </span>}
                    </td>
                    <CellEdit todo={t} field="who"><div style={{display:"flex",alignItems:"center",gap:6,...(expandMode?{alignSelf:"flex-start" as const}:{})}}><span style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(t.who)},${avColor2(t.who)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}} title={t.who}>{avInitials(t.who)}</span><span style={{fontSize:13}}>{t.who}</span></div></CellEdit>
                    <CellEdit todo={t} field="due">{(()=>{const[dpart,tpart]=(t.due||"").split(" ");const fmt12v=(v: string)=>{if(!v)return "";const[hh,mm]=v.split(":").map(Number);const ap=hh<12?"오전":"오후";const h12=hh===0?12:hh>12?hh-12:hh;return `${ap} ${h12}:${fmt2(mm)}`;};const dd=dDay(t.due,t.st);return <div style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:2}}>
                      <span style={{fontSize:13,color:od?"#dc2626":"#64748b"}}>{dpart?`${dpart}(${fDow(dpart)})`:"—"}</span>
                      {tpart&&<span style={{fontSize:13,color:od?"#dc2626":"#94a3b8",fontWeight:400}}>{fmt12v(tpart)}</span>}
                      {dd&&<span style={{fontSize:10,fontWeight:700,color:dd.color,background:dd.bg,border:`1px solid ${dd.border}`,padding:"1px 6px",borderRadius:4,letterSpacing:"0.02em"}}>{dd.label}</span>}
                    </div>;})()}</CellEdit>
                    {!expandMode&&<>
                      <CellEdit todo={t} field="pri"><span style={{...S.badge(priBg[t.pri],priC[t.pri],`1px solid ${priC[t.pri]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}><span>●</span>{t.pri}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                      <CellEdit todo={t} field="st"><span style={{...S.badge(stBg[t.st],stC[t.st],`1px solid ${stC[t.st]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}>{t.st}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                    </>}
                    <td style={{...S.tdc,padding:"0 6px",textAlign:"center" as const,verticalAlign:"middle" as const}} onClick={e=>e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,(e as any).shiftKey);}}
                        style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                    </td>
                  </tr>})}
                {sorted.filter(t=>t.st==="완료").length>0&&<tr>
                  <td colSpan={99} style={{padding:"6px 12px",background:"#f0fdf4",borderTop:"2px solid #bbf7d0",cursor:"pointer"}} onClick={()=>setShowDone(p=>!p)}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>✓ 완료됨</span>
                      <span style={{fontSize:10,color:"#86efac"}}>{sorted.filter(t=>t.st==="완료").length}건</span>
                      <span style={{fontSize:10,color:"#4ade80",marginLeft:"auto"}}>{showDone?"접기":"펼치기"}</span>
                    </div>
                  </td>
                </tr>}
                {showDone&&sorted.filter(t=>t.st==="완료").map(t=>{const plain=stripHtml(t.det||"");
                  return <tr key={t.id} style={{borderBottom:"1px solid #f1f5f9",background:"#fafafa",opacity:.72}}
                    onMouseEnter={e=>{clearTimeout(hoverLeaveTimer.current);setHoverRow(t.id);const r=(e.currentTarget as HTMLTableRowElement).getBoundingClientRect();setHoverRowRect({top:r.top,height:r.height});}}
                    onMouseLeave={()=>{hoverLeaveTimer.current=setTimeout(()=>{setHoverRow(null);setHoverRowRect(null);},80);}}>

                    <td style={S.tdc}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"대기"});flash("완료가 취소되었습니다");}}
                          style={{width:17,height:17,borderRadius:"50%",border:"2px solid #16a34a",background:"#16a34a",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
                          title="완료 취소">
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:14,color:"#94a3b8",textDecoration:"line-through"}}>{t.task}</span><RepeatBadge repeat={t.repeat}/></div>
                          {!filters.proj.length&&(()=>{const p=gPr(t.pid);return p.id?<span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:99,background:"#f1f5f9",color:"#94a3b8",border:"1px solid #e2e8f0",whiteSpace:"nowrap" as const,alignSelf:"flex-start" as const,display:"inline-block"}}>{p.name}</span>:null;})()}
                        </div>
                      </div>
                    </td>
                    <td style={{...S.tdc,...(expandMode?{verticalAlign:"top" as const}:{})}}>
                      {expandMode
                        ?<div style={{fontSize:13,color:plain?"#94a3b8":"#c0c8d4",lineHeight:1.7,padding:"2px 0",textDecoration:plain?"line-through":"none"}} dangerouslySetInnerHTML={{__html:t.det||"—"}}/>
                        :<span style={{fontSize:13,color:"#c0c8d4",fontStyle:"italic",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{plain?plain.slice(0,50):"—"}</span>}
                    </td>
                    <td style={S.tdc}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(t.who)},${avColor2(t.who)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px",opacity:.5}} title={t.who}>{avInitials(t.who)}</span><span style={{fontSize:13,color:"#94a3b8"}}>{t.who}</span></div></td>
                    <td style={S.tdc}><span style={{fontSize:13,color:"#94a3b8",textDecoration:"line-through"}}>{t.due}</span></td>
                    {!expandMode&&<>
                      <td style={S.tdc}><span style={{...S.badge("#f1f5f9","#94a3b8")}}>{t.pri}</span></td>
                      <td style={S.tdc}><span style={{...S.badge(stBg[t.st],stC[t.st])}}>{t.st}</span></td>
                    </>}
                    <td style={{...S.tdc,padding:"0 6px",textAlign:"center" as const}} onClick={e=>e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,(e as any).shiftKey);}}
                        style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                    </td>
                  </tr>})}
              </tbody>
            </table>
          </div>
        </div>}
        </div>
      </div>}

      {view==="calendar"&&<div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
        {/* ── 메인 캘린더 영역 ── */}
        <div style={{flex:1,minWidth:0}}>
        <div data-cal-header style={{position:"sticky",top:94,zIndex:50,background:"#f0f4f8",paddingBottom:8,marginBottom:0}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>calNav(-1)} style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:13,color:"#64748b"}}>◀</button>
            <button onClick={()=>calNav(1)} style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:13,color:"#64748b"}}>▶</button>
            <button onClick={calTodayFn} style={{...S.bs,fontSize:11,padding:"4px 10px"}}>오늘</button>
            <div style={{fontSize:15,fontWeight:800,minWidth:180}}>{calTitle()}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {[["day","일",1],["week","주",2],["month","월",3],["custom",`${customDays}일`,4],["agenda","일정",5]].map(([k,l,n])=>
              <button key={k} onClick={()=>setCalView(k as string)} style={{padding:"5px 10px",borderRadius:6,border:`1.5px solid ${calView===k?"#2563eb":"#e2e8f0"}`,background:calView===k?"#2563eb":"#fff",color:calView===k?"#fff":"#64748b",fontSize:11,fontWeight:calView===k?600:500,cursor:"pointer"}}>
                <span style={{fontSize:9,opacity:.6,fontWeight:700}}>{n}</span>{l}
              </button>)}
            {calView==="custom"&&<input type="number" min="2" max="14" value={customDays} onChange={e=>setCustomDays(Math.max(2,Math.min(14,parseInt(e.target.value)||4)))} style={{width:44,padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,textAlign:"center"}}/>}
            {/* 우측 사이드바 토글 버튼 */}
            <button onClick={()=>setCalSidebarOpen(v=>!v)} title={calSidebarOpen?"사이드바 닫기":"사이드바 열기"} style={{marginLeft:4,width:28,height:28,borderRadius:6,border:`1.5px solid ${calSidebarOpen?"#2563eb":"#e2e8f0"}`,background:calSidebarOpen?"#eff6ff":"#fff",cursor:"pointer",fontSize:14,color:calSidebarOpen?"#2563eb":"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>☰</button>
          </div>
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
          <Chip active={calF===""} onClick={()=>setCalF("")}>전체</Chip>
          {visibleProj.map(p=><Chip key={p.id} active={calF===String(p.id)} color={p.color} onClick={()=>setCalF(calF===String(p.id)?"":String(p.id))}>{p.name}</Chip>)}
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
          <Chip active={calFWho===""} onClick={()=>setCalFWho("")}>전체</Chip>
          {members.map(n=><Chip key={n} active={calFWho===n} onClick={()=>setCalFWho(calFWho===n?"":n)}>{n}</Chip>)}
        </div>
        <div style={{fontSize:10,color:"#94a3b8",display:"flex",alignItems:"center",gap:6}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:3}}><span style={{width:12,height:8,borderLeft:"3px dashed #64748b",display:"inline-block"}}/> 반복 업무</span>
          <span style={{display:"inline-flex",alignItems:"center",gap:3}}><span style={{width:12,height:8,borderLeft:"3px solid #64748b",display:"inline-block"}}/> 일반 업무</span>
        </div>
        </div>

        {calView==="day"&&(()=>{
          const ds=dateStr(calY,calM,calD);
          const allDayTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&!t.due.includes(" "));
          const timedTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&t.due.includes(" "));
          const getH=(due:string)=>parseInt((due.split(" ")[1]||"0:0").split(":")[0])||0;
          const isT=ds===todayStr;
          const dow=new Date(ds).getDay();
          const isSun=dow===0;const isSat=dow===6;
          const hourH=48;
          const now=new Date();
          const nowTop=isT?(now.getHours()*60+now.getMinutes())/60*hourH:-1;
          return <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",display:"flex",flexDirection:"column" as const}}>
            <div style={{display:"grid",gridTemplateColumns:"56px 1fr",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
              <div style={{fontSize:9,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
              <div style={{textAlign:"center",padding:"10px 0",background:isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
                <div style={{fontSize:11,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[dow]}</div>
                <div style={{fontSize:28,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:42,height:42,borderRadius:"50%",fontSize:22}:{})}}>{calD}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"56px 1fr",borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:40}}>
              <div style={{fontSize:9,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
              {(()=>{const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;return(
              <div style={{padding:"4px 6px",display:"flex",flexDirection:"column" as const,gap:2,
                background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":"#fff",
                outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,
                cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,0);}}
                onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(-1);}}}
                onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                onDrop={e=>{e.preventDefault();calDropOnDate(ds);}}>
                {allDayTodos.length===0
                  ?<span style={{fontSize:10,color:"#cbd5e1",fontStyle:"italic",padding:"4px 0"}}>클릭하여 종일 업무 추가</span>
                  :allDayTodos.map((t,ii)=>{const p=gPr(t.pid);const isThisDragging=calDragId===t.id;return(
                    <div key={t.id+"_"+ii}
                      draggable
                      onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                      onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                      onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                      style={{...evStyle(p,t.repeat),whiteSpace:"normal" as const,overflow:"visible",textOverflow:"unset",display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:4,cursor:"grab",opacity:isThisDragging?.4:1,transition:"opacity .15s"}}>
                      {t.repeat&&t.repeat!=="없음"&&"🔁 "}{t.task}
                      {t.who&&<span style={{opacity:.7,fontSize:9}}> · {t.who}</span>}
                    </div>);})}
              </div>);})()}
            </div>
            <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
              ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
              {Array.from({length:24},(_,h)=>{
                const hTodos=timedTodos.filter(t=>getH(t.due)===h);
                const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
                return <div key={h} style={{display:"grid",gridTemplateColumns:"56px 1fr",minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{fontSize:9,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                    {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
                  </div>
                  <div style={{background:isDragOverCell?"#eff6ff":isT?"#fafcff":"#fff",
                    outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                    padding:hTodos.length>0?"2px 4px":0,
                    cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                    onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,h);}}
                    onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(h);}}}
                    onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                    onDrop={e=>{e.preventDefault();calDropOnDate(ds,h);}}>
                    {hTodos.map((t,ii)=>{const p=gPr(t.pid);const tl=(t.due.split(" ")[1]||"").slice(0,5);const isThisDragging=calDragId===t.id;return(
                      <div key={t.id+"_"+ii}
                        draggable
                        onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                        onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                        onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                        style={{...evStyle(p,t.repeat),display:"flex",alignItems:"center",gap:4,padding:"2px 8px",marginBottom:2,whiteSpace:"nowrap" as const,cursor:"grab",opacity:isThisDragging?.4:1,transition:"opacity .15s"}}>
                        <span style={{fontSize:8,fontWeight:700,flexShrink:0,opacity:.9}}>{tl}</span>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{t.repeat&&t.repeat!=="없음"&&"🔁 "}{t.task}</span>
                        {t.who&&<span style={{opacity:.7,fontSize:8,flexShrink:0}}> · {t.who}</span>}
                      </div>);})}
                  </div>
                </div>;})}
              {nowTop>=0&&<div style={{position:"absolute",top:nowTop,left:0,right:0,display:"flex",alignItems:"center",pointerEvents:"none",zIndex:3}}>
                <div style={{width:56,flexShrink:0}}/>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#ea4335",flexShrink:0,marginLeft:-5}}/>
                <div style={{flex:1,height:2,background:"#ea4335"}}/>
              </div>}
            </div>
          </div>;
        })()}

        {calView==="week"&&(()=>{
          const wDates=weekDates();
          const hourH=48;
          const now=new Date();
          const nowTop=(now.getHours()*60+now.getMinutes())/60*hourH;
          const hasToday=wDates.some(d=>dateStr(d.getFullYear(),d.getMonth(),d.getDate())===todayStr);
          return <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",display:"flex",flexDirection:"column" as const}}>
            {/* 헤더: 요일 + 날짜 */}
            <div style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
              <div style={{fontSize:9,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
              {wDates.map((d,i)=>{
                const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
                const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                return <div key={i} style={{textAlign:"center",padding:"10px 4px",borderRight:i<6?"1px solid #e2e8f0":"none",background:isT?"#eff6ff":isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
                  <div style={{fontSize:10,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[d.getDay()]}</div>
                  <div style={{fontSize:22,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:34,height:34,borderRadius:"50%",fontSize:18}:{})}}>{d.getDate()}</div>
                </div>;})}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:36}}>
              <div style={{fontSize:9,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
              {wDates.map((d,i)=>{
                const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
                const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                const allDayT=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&!t.due.includes(" "));
                const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;
                return <div key={i}
                  style={{padding:"2px 3px",borderRight:i<6?"1px solid #e2e8f0":"none",
                    background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                    outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,
                    cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                  onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,0);}}
                  onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(-1);}}}
                  onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                  onDrop={e=>{e.preventDefault();calDropOnDate(ds);}}>
                  {allDayT.map((t,ii)=>{const p=gPr(t.pid);const isThisDragging=calDragId===t.id;return(
                    <div key={t.id+"_"+ii}
                      draggable
                      onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                      onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                      onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                      style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?.4:1,transition:"opacity .15s"}}>
                      <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.repeat&&t.repeat!=="없음"?"🔁 ":""}{t.task}</div>
                      {t.who&&<div style={{fontSize:8,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>👤 {t.who}</div>}
                    </div>);})}
                </div>;})}
            </div>
            <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
              ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
              {Array.from({length:24},(_,h)=>{
                const getH=(due:string)=>parseInt((due.split(" ")[1]||"0:0").split(":")[0])||0;
                return <div key={h} style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{fontSize:9,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                    {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
                  </div>
                  {wDates.map((d,i)=>{
                    const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
                    const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                    const hTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&t.due.includes(" ")&&getH(t.due)===h);
                    const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
                    return <div key={i}
                      style={{borderRight:i<6?"1px solid #f1f5f9":"none",
                        background:isDragOverCell?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                        outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                        padding:hTodos.length>0?"2px 3px":0,
                        cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                      onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,h);}}
                      onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(h);}}}
                      onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                      onDrop={e=>{e.preventDefault();calDropOnDate(ds,h);}}>
                      {hTodos.map((t,ii)=>{const p=gPr(t.pid);const tl=(t.due.split(" ")[1]||"").slice(0,5);const isThisDragging=calDragId===t.id;return(
                        <div key={t.id+"_"+ii}
                          draggable
                          onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                          onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                          onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                          style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?.4:1,transition:"opacity .15s"}}>
                          <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}><span style={{fontSize:8,fontWeight:700,opacity:.9}}>{tl} </span>{t.task}</div>
                          {t.who&&<div style={{fontSize:7,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>👤 {t.who}</div>}
                        </div>);})}
                  </div>;})}
                </div>;})}
              {hasToday&&<div style={{position:"absolute",top:nowTop,left:0,right:0,display:"flex",alignItems:"center",pointerEvents:"none",zIndex:3}}>
                <div style={{width:56,flexShrink:0}}/>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#ea4335",flexShrink:0,marginLeft:-5}}/>
                <div style={{flex:1,height:2,background:"#ea4335"}}/>
              </div>}
            </div>
          </div>;
        })()}

        {calView==="month"&&<MultiMonthView calY={calY} calM={calM} ftodos={ftodosExpanded} todayStr={todayStr} gPr={gPr} onEvClick={openEvPop} onDayClick={(e,ds)=>openQA(e,ds,0)} onMoreClick={(e,ds,ts)=>{e.stopPropagation();const r=(e.currentTarget as HTMLElement).getBoundingClientRect();setCalDayPop({ds,todos:ts,x:Math.min(r.right+4,window.innerWidth-292),y:Math.min(r.top,window.innerHeight-370)});setCalEvPop(null);setCalQA(null);}} setCalDate={setCalDate} setCalView={setCalView} calDays={calDays} evStyle={evStyle} calDragId={calDragId} calDragOverDs={calDragOverDs} onCalDragStart={calDragStart} onCalDragEnd={calDragEnd} onCalDrop={calDropOnDate} setCalDragOverDs={setCalDragOverDs} sidebarDragId={sidebarDragId} calTodayKey={calTodayKey}/>}

        {calView==="custom"&&(()=>{
          const cDates=customDates();
          const hourH=48;
          const now=new Date();
          const nowTop=(now.getHours()*60+now.getMinutes())/60*hourH;
          const hasToday=cDates.some(d=>dateStr(d.getFullYear(),d.getMonth(),d.getDate())===todayStr);
          return <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",display:"flex",flexDirection:"column" as const}}>
            {/* 헤더: 요일 + 날짜 */}
            <div style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
              <div style={{fontSize:9,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
              {cDates.map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                return <div key={i} style={{textAlign:"center",padding:"10px 4px",borderRight:i<customDays-1?"1px solid #e2e8f0":"none",background:isT?"#eff6ff":isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
                  <div style={{fontSize:10,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[d.getDay()]}</div>
                  <div style={{fontSize:18,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:30,height:30,borderRadius:"50%",fontSize:15}:{})}}>{d.getDate()}</div>
                </div>;})}
            </div>
            <div style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:36}}>
              <div style={{fontSize:9,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
              {cDates.map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                const allDayT=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&!t.due.includes(" "));
                const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;
                return <div key={i}
                  style={{padding:"2px 3px",borderRight:i<customDays-1?"1px solid #e2e8f0":"none",
                    background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                    outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,
                    cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                  onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,0);}}
                  onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(-1);}}}
                  onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                  onDrop={e=>{e.preventDefault();calDropOnDate(ds);}}>
                  {allDayT.map((t,ii)=>{const p=gPr(t.pid);const isThisDragging=calDragId===t.id;return(
                    <div key={t.id+"_"+ii}
                      draggable
                      onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                      onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                      onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                      style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?.4:1,transition:"opacity .15s"}}>
                      <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.repeat&&t.repeat!=="없음"?"🔁 ":""}{t.task}</div>
                      {t.who&&<div style={{fontSize:8,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>👤 {t.who}</div>}
                    </div>);})}
                </div>;})}
            </div>
            <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
              ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
              {Array.from({length:24},(_,h)=>{
                const getH=(due:string)=>parseInt((due.split(" ")[1]||"0:0").split(":")[0])||0;
                return <div key={h} style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{fontSize:9,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                    {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
                  </div>
                  {cDates.map((d,i)=>{
                    const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
                    const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                    const hTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&t.due.includes(" ")&&getH(t.due)===h);
                    const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
                    return <div key={i}
                      style={{borderRight:i<customDays-1?"1px solid #f1f5f9":"none",
                        background:isDragOverCell?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                        outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                        padding:hTodos.length>0?"2px 3px":0,
                        cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                      onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,h);}}
                      onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(h);}}}
                      onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                      onDrop={e=>{e.preventDefault();calDropOnDate(ds,h);}}>
                      {hTodos.map((t,ii)=>{const p=gPr(t.pid);const tl=(t.due.split(" ")[1]||"").slice(0,5);const isThisDragging=calDragId===t.id;return(
                        <div key={t.id+"_"+ii}
                          draggable
                          onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                          onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                          onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                          style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?.4:1,transition:"opacity .15s"}}>
                          <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}><span style={{fontSize:8,fontWeight:700,opacity:.9}}>{tl} </span>{t.task}</div>
                          {t.who&&<div style={{fontSize:7,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>👤 {t.who}</div>}
                        </div>);})}
                    </div>;})}
                </div>;})}
              {hasToday&&<div style={{position:"absolute",top:nowTop,left:0,right:0,display:"flex",alignItems:"center",pointerEvents:"none",zIndex:3}}>
                <div style={{width:56,flexShrink:0}}/>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#ea4335",flexShrink:0,marginLeft:-5}}/>
                <div style={{flex:1,height:2,background:"#ea4335"}}/>
              </div>}
            </div>
          </div>;
        })()}

        {calView==="agenda"&&<div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
          {agendaItems().length===0?<div style={{padding:40,textAlign:"center",color:"#94a3b8",fontSize:12}}>예정된 업무 없음</div>:
          <div style={{maxHeight:600,overflowY:"auto"}}>
            {agendaItems().map(item=>{
              const d=item.date;const isT=item.ds===todayStr;const isSun=d.getDay()===0;
              return <div key={item.ds}>
                <div style={{padding:"10px 16px",background:isT?"#eff6ff":"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:1}}>
                  <div style={{textAlign:"center",minWidth:40}}>
                    <div style={{fontSize:10,color:isSun?"#dc2626":"#64748b",fontWeight:600}}>{calDays[d.getDay()]}</div>
                    <div style={{fontSize:22,fontWeight:800,color:isT?"#fff":"#334155",...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#2563eb",width:32,height:32,borderRadius:"50%"}:{})}}>{d.getDate()}</div>
                  </div>
                  <div style={{fontSize:12,color:"#64748b"}}>{d.getFullYear()}년 {d.getMonth()+1}월</div>
                  <span style={{fontSize:10,color:"#94a3b8",marginLeft:"auto"}}>{item.todos.length}건</span>
                </div>
                {item.todos.map((t: any,ii: number)=>{const p=gPr(t.pid);const od=isOD(t.due,t.st);
                  return <div key={t.id+"_"+ii} onClick={e=>openEvPop(e,t)} style={{padding:"10px 16px 10px 66px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:4,height:28,borderRadius:2,background:p.color,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
                        {t.task}{od&&<span style={{color:"#dc2626",fontSize:10}}>⚠️</span>}<RepeatBadge repeat={t.repeat}/>
                      </div>
                      <div style={{fontSize:10,color:"#94a3b8",marginTop:2,display:"flex",gap:8}}>
                        <span>{p.name}</span><span>{t.who}</span><span style={S.badge(priBg[t.pri],priC[t.pri])}>{t.pri}</span><span style={S.badge(stBg[t.st],stC[t.st])}>{t.st}</span>
                      </div>
                    </div>
                  </div>})}
              </div>})}
          </div>}
        </div>}
        <div style={{marginTop:8,textAlign:"center",fontSize:10,color:"#94a3b8"}}>키보드 단축키: T오늘 ←→이동 D일 W주 M월 A일정</div>
        </div>{/* ── 메인 캘린더 영역 끝 ── */}

        {/* ── 우측 사이드바: 나의 할일 ── */}
        {calSidebarOpen&&(()=>{
          const myAll=todos.filter(t=>t.who===currentUser&&!t._instance);
          const active=myAll.filter(t=>t.st!=="완료"&&!pendingComplete.has(t.id));
          const animating=myAll.filter(t=>pendingComplete.has(t.id));
          const done=myAll.filter(t=>t.st==="완료");
          const pct=myAll.length>0?Math.round(done.length/myAll.length*100):0;

          const applyOrder=(arr:any[])=>{
            if(!sidebarOrder.length)return arr;
            const idx=new Map(sidebarOrder.map((id,i)=>[id,i]));
            return [...arr].sort((a,b)=>(idx.has(a.id)?idx.get(a.id)!:9999)-(idx.has(b.id)?idx.get(b.id)!:9999));
          };

          const we=new Date(todayStr);we.setDate(we.getDate()+6);
          const weekEndD=dateStr(we.getFullYear(),we.getMonth(),we.getDate());
          const qDays=(n:number)=>{const d=new Date(todayStr);d.setDate(d.getDate()+n);return dateStr(d.getFullYear(),d.getMonth(),d.getDate());};

          // 날짜 없음 섹션 분리
          const secNoDate=applyOrder(active.filter(t=>!t.due?.split(" ")[0]));
          const secToday=applyOrder(active.filter(t=>{const d=t.due?.split(" ")[0]||"";return !!d&&d<=todayStr;}));
          const secWeek=applyOrder(active.filter(t=>{const d=t.due?.split(" ")[0]||"";return !!d&&d>todayStr&&d<=weekEndD;}));
          const secLater=applyOrder(active.filter(t=>{const d=t.due?.split(" ")[0]||"";return !!d&&d>weekEndD;}));

          // 섹션 헤더 컴포넌트 (sticky + 접기/펼치기)
          const SecHdr=({label,count,open,onToggle}:{label:string,count:number,open:boolean,onToggle:()=>void})=>
            <button onClick={onToggle} style={{width:"100%",padding:"7px 12px 5px",border:"none",borderBottom:"1px solid #f1f5f9",background:"#fafafa",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:".5px",textAlign:"left" as const,fontFamily:"inherit",position:"sticky" as const,top:0,zIndex:1}}>
              <span style={{fontSize:7,display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
              {label}<span style={{fontWeight:400,marginLeft:2}}>{count}</span>
            </button>;

          const renderTodo=(t:any,isDoneSec=false)=>{
            const p=gPr(t.pid);
            const isAnim=pendingComplete.has(t.id);
            const isDone=t.st==="완료"||isAnim;
            const od=isOD(t.due,t.st);
            const isHov=sidebarHoverId===t.id;
            const isEd=sidebarEditId===t.id;
            const isDragOv=sidebarDragOver===t.id;
            const isDragging=sidebarDragId===t.id;
            const isExp=sidebarExpandId===t.id&&!isDoneSec;
            const isStarred=starredIds.has(t.id);
            const dueDateStr=t.due?.split(" ")[0]||"";

            // ★ 드래그 중에는 same element(key 동일)를 유지 → DOM unmount 방지
            //   (다른 key로 early-return하면 드래그 소스가 사라져 브라우저가 drag 취소)

            return <div key={t.id+"_sb"}
              draggable={!isDoneSec&&!isEd&&!isExp}
              onDragStart={e=>{
                const ghost=document.createElement("div");
                ghost.style.cssText=`position:absolute;top:${window.scrollY}px;left:-9999px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:9px 14px 9px 12px;font-size:13px;font-weight:500;color:#1e293b;box-shadow:0 8px 24px rgba(0,0,0,.18);width:220px;white-space:nowrap;overflow:hidden;font-family:Pretendard,system-ui,sans-serif;display:flex;align-items:center;gap:9px;box-sizing:border-box;pointer-events:none;`;
                const circle=document.createElement("span");
                circle.style.cssText="width:14px;height:14px;border-radius:50%;border:1.5px solid #d1d5db;flex-shrink:0;display:block;";
                const label=document.createElement("span");
                label.style.cssText="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;";
                label.textContent=t.task;
                ghost.appendChild(circle);ghost.appendChild(label);
                document.body.appendChild(ghost);
                ghost.getBoundingClientRect();
                e.dataTransfer.setDragImage(ghost,16,22);
                requestAnimationFrame(()=>{if(ghost.parentNode)ghost.parentNode.removeChild(ghost);});
                setSidebarDragId(t.id);document.body.style.cursor="grabbing";
              }}
              onDragEnd={()=>{setSidebarDragId(null);setSidebarDragOver(null);setCalDragOverDs(null);setCalDragOverH(null);document.body.style.cursor="";}}
              onDragOver={e=>{e.preventDefault();if(sidebarDragId!==t.id)setSidebarDragOver(t.id);}}
              onDrop={e=>{
                e.preventDefault();
                if(sidebarDragId===null||sidebarDragId===t.id){setSidebarDragOver(null);return;}
                const allIds=myAll.map(x=>x.id);
                const base=[...new Set([...sidebarOrder.filter(id=>allIds.includes(id)),...allIds])];
                const from=base.indexOf(sidebarDragId);const to=base.indexOf(t.id);
                if(from<0||to<0){setSidebarDragOver(null);return;}
                const neo=[...base];neo.splice(from,1);neo.splice(to,0,sidebarDragId);
                setSidebarOrder(neo);
                setSidebarDragId(null);setSidebarDragOver(null);document.body.style.cursor="";
              }}
              onMouseEnter={()=>setSidebarHoverId(t.id)}
              onMouseLeave={()=>setSidebarHoverId(null)}
              onClick={e=>{e.stopPropagation();if(!isDoneSec&&!isEd){sidebarExpand(isExp?null:t.id);setSidebarDateId(null);}}}
              style={{
                position:"relative" as const,
                padding:isDoneSec?"8px 12px 8px 10px":`${isExp?"10px":"8px"} 36px ${isExp?"12px":"8px"} 22px`,
                /* 드롭 타겟: 상단에 파란 선 (배경 변경 없이 레이아웃 유지) */
                borderTop:isDragOv&&!isDragging?"2px solid #2563eb":"2px solid transparent",
                borderBottom:`1px solid ${isExp?"#e8f0fe":"#f1f5f9"}`,
                display:"flex",alignItems:"flex-start",gap:9,
                cursor:isExp?"default":isHov&&!isDoneSec?"grab":"default",
                background:isExp?"#f8fbff":isHov&&!isDoneSec&&!isDragging?"#fafafa":"#fff",
                /* 드래그 중: 반투명하게 — DOM 유지로 drag 취소 방지 */
                opacity:isDragging?0.25:isAnim?.35:1,
                transition:"background .12s,opacity .2s,border-top-color .1s",
              }}>

              {/* 드래그 핸들 (비확장 상태에서만) */}
              {!isDoneSec&&!isExp&&
                <div style={{position:"absolute" as const,left:3,top:0,bottom:0,width:16,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"#c7d2db",fontSize:13,cursor:"grab",userSelect:"none" as const,letterSpacing:"-1px",
                  opacity:isHov?1:0,transition:"opacity .15s",pointerEvents:"none" as const}}>⠿</div>}

              {/* 완료 토글 */}
              <button onClick={e=>{e.stopPropagation();handleSideComplete(t.id,isDone);}}
                style={{width:18,height:18,borderRadius:"50%",flexShrink:0,marginTop:2,
                  border:`1.5px solid ${isDone?"#22c55e":isHov&&!isDoneSec?"#4ade80":"#d1d5db"}`,
                  background:isDone?"#22c55e":"transparent",
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,color:"#fff",padding:0,
                  transition:"border-color .2s,background .2s",boxSizing:"border-box" as const}}>
                {isDone&&"✓"}
              </button>

              {/* 내용 */}
              <div style={{flex:1,minWidth:0}} onClick={e=>e.stopPropagation()}>
                {/* 제목 */}
                {isEd
                  ?<input autoFocus value={sidebarEditVal}
                    onChange={e=>setSidebarEditVal(e.target.value)}
                    onBlur={()=>{if(sidebarEditVal.trim())updTodo(t.id,{task:sidebarEditVal.trim()});setSidebarEditId(null);}}
                    onKeyDown={e=>{if(e.key==="Enter"){if(sidebarEditVal.trim())updTodo(t.id,{task:sidebarEditVal.trim()});setSidebarEditId(null);}else if(e.key==="Escape")setSidebarEditId(null);}}
                    onClick={ev=>ev.stopPropagation()}
                    style={{width:"100%",border:"none",borderBottom:"1.5px solid #2563eb",outline:"none",fontSize:13,fontWeight:500,color:"#0f172a",background:"transparent",padding:"0 0 2px",fontFamily:"inherit"}}
                  />
                  :<div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div
                      onClick={ev=>{ev.stopPropagation();if(!isDoneSec){sidebarExpand(isExp?null:t.id);setSidebarDateId(null);}}}
                      title={isExp?"접기 (클릭)":"펼치기"}
                      style={{fontSize:13,fontWeight:isDone?400:500,flex:1,minWidth:0,
                        color:isDone?"#b0bec5":od&&!isDone?"#c0392b":"#1e293b",
                        textDecoration:isDone?"line-through":"none",
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,
                        cursor:isDoneSec?"default":"pointer",
                        display:"flex",alignItems:"center",gap:4,lineHeight:"1.4"}}>
                      {t.repeat&&t.repeat!=="없음"&&<RepeatBadge repeat={t.repeat}/>}
                      {t.task}
                    </div>
                    {isExp&&!isDoneSec&&<button
                      onClick={ev=>{ev.stopPropagation();setSidebarEditId(t.id);setSidebarEditVal(t.task);}}
                      title="이름 수정"
                      style={{background:"none",border:"none",cursor:"pointer",color:"#c7d2db",fontSize:12,padding:"1px 3px",borderRadius:3,flexShrink:0,lineHeight:1,fontFamily:"inherit"}}
                      onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color="#2563eb"}
                      onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color="#c7d2db"}>✏</button>}
                  </div>}

                {/* 비확장: 메타 (날짜 / 프로젝트 + 우선순위) */}
                {!isExp&&<div style={{display:"flex",flexDirection:"column",gap:2,marginTop:3}}>
                  {dueDateStr&&<span style={{fontSize:11,color:od&&!isDone?"#e53e3e":"#94a3b8",lineHeight:"16px"}}>
                    {od&&!isDone&&"⚠ "}{dueDateStr}
                  </span>}
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,color:"#b0bec5"}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:p.color||"#94a3b8",display:"inline-block",flexShrink:0}}/>
                      {p.name}
                    </span>
                    {t.pri&&t.pri!=="보통"&&<span style={{...S.badge(priBg[t.pri],priC[t.pri]),fontSize:9}}>{t.pri}</span>}
                  </div>
                </div>}

                {/* 확장: 세부정보 + 날짜 컨트롤 */}
                {isExp&&<div onClick={ev=>ev.stopPropagation()}>
                  {/* 세부정보 */}
                  <div style={{marginTop:6,display:"flex",alignItems:"flex-start",gap:6}}>
                    <span style={{fontSize:14,color:"#94a3b8",marginTop:2,flexShrink:0}}>☰</span>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      data-det-ph="세부정보 추가"
                      ref={el=>{
                        if(el){
                          detDivRefs.current.set(t.id,el);
                          if(document.activeElement!==el) el.innerHTML=t.det||"";
                        } else {
                          detDivRefs.current.delete(t.id);
                        }
                      }}
                      onFocus={()=>setSidebarDetId(t.id)}
                      onBlur={e=>{
                        const html=e.currentTarget.innerHTML==="<br>"?"":e.currentTarget.innerHTML;
                        if(html!==(t.det||"")) updTodo(t.id,{det:html});
                        setSidebarDetId(null);
                      }}
                      onKeyDown={ev=>{
                        if(!(ev.ctrlKey||ev.metaKey)) return;
                        const cmds: Record<string,string>={b:"bold",i:"italic",u:"underline",s:"strikeThrough"};
                        const cmd=cmds[ev.key.toLowerCase()];
                        if(cmd){ev.preventDefault();(document as any).execCommand(cmd,false);}
                      }}
                      onClick={ev=>ev.stopPropagation()}
                      style={{flex:1,minHeight:36,outline:"none",fontSize:12,color:"#475569",
                        lineHeight:1.6,borderBottom:"1px solid #e2e8f0",paddingBottom:2,
                        wordBreak:"break-word" as const,fontFamily:"inherit"}}
                    />
                  </div>
                  {/* 날짜 */}
                  <div style={{marginTop:8}}>
                    <button onClick={()=>setSidebarDateId(sidebarDateId===t.id?null:t.id)}
                      style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,
                        padding:"3px 8px",borderRadius:10,
                        border:`1px solid ${od&&!isDone?"#fecaca":"#e2e8f0"}`,
                        background:od&&!isDone?"#fef2f2":"#f8fafc",
                        color:od&&!isDone?"#e53e3e":"#475569",
                        cursor:"pointer",fontFamily:"inherit"}}>
                      📅 {dueDateStr||"날짜 추가"}
                      {dueDateStr&&<span onClick={ev=>{ev.stopPropagation();updTodo(t.id,{due:""});setSidebarDateId(null);}}
                        style={{marginLeft:2,color:"#94a3b8",fontSize:12,lineHeight:1}}>×</span>}
                    </button>
                  </div>
                  {/* 프로젝트 + 우선순위 (날짜 아래) */}
                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6}}>
                    <div style={{position:"relative" as const}}>
                      <button onClick={ev=>{ev.stopPropagation();setSidebarProjId(sidebarProjId===t.id?null:t.id);setSidebarDateId(null);}}
                        style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,color:"#64748b",
                          border:"1px solid #e2e8f0",borderRadius:8,padding:"2px 7px",
                          background:"#f8fafc",cursor:"pointer",fontFamily:"inherit"}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:p.color||"#94a3b8",display:"inline-block",flexShrink:0}}/>
                        {p.name}<span style={{fontSize:8,color:"#94a3b8",marginLeft:1}}>▾</span>
                      </button>
                      {sidebarProjId===t.id&&<div onClick={ev=>ev.stopPropagation()}
                        style={{position:"absolute" as const,top:"calc(100% + 2px)",left:0,zIndex:200,
                          background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,
                          boxShadow:"0 4px 16px rgba(0,0,0,.12)",minWidth:140,overflow:"hidden"}}>
                        {visibleProj.map(pr=><div key={pr.id}
                          onClick={()=>{updTodo(t.id,{pid:pr.id});setSidebarProjId(null);}}
                          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",
                            cursor:"pointer",fontSize:12,color:"#334155",
                            background:pr.id===t.pid?"#eff6ff":"transparent"}}
                          onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=pr.id===t.pid?"#eff6ff":"#f8fafc"}
                          onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=pr.id===t.pid?"#eff6ff":"transparent"}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:pr.color,display:"inline-block",flexShrink:0}}/>
                          {pr.name}
                          {pr.id===t.pid&&<span style={{marginLeft:"auto",fontSize:10,color:"#2563eb"}}>✓</span>}
                        </div>)}
                      </div>}
                    </div>
                    {t.pri&&t.pri!=="보통"&&<span style={{...S.badge(priBg[t.pri],priC[t.pri]),fontSize:9}}>{t.pri}</span>}
                  </div>
                  {/* 날짜 선택 모달 */}
                  {sidebarDateId===t.id&&
                    <div onClick={ev=>ev.stopPropagation()} style={{marginTop:6,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 10px"}}>
                      <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap" as const}}>
                        {([["오늘",0],["내일",1],["다음 주",7]] as [string,number][]).map(([l,n])=>
                          <button key={l} onClick={()=>{updTodo(t.id,{due:qDays(n)});setSidebarDateId(null);}}
                            style={{fontSize:10,padding:"2px 8px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#334155",fontFamily:"inherit"}}>{l}</button>)}
                      </div>
                      <input type="date"
                        defaultValue={t.due?.split(" ")[0]||""}
                        onChange={e=>{if(e.target.value){updTodo(t.id,{due:e.target.value});setSidebarDateId(null);}}}
                        style={{width:"100%",fontSize:11,padding:"3px 6px",border:"1px solid #e2e8f0",borderRadius:8,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const,background:"#fff"}}
                      />
                    </div>}
                  {/* 접기 + 삭제 */}
                  <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <button onClick={ev=>{ev.stopPropagation();sidebarExpand(null);setSidebarDateId(null);}}
                      style={{fontSize:11,padding:"3px 8px",borderRadius:8,border:"1px solid #e2e8f0",
                        background:"#f8fafc",color:"#94a3b8",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>
                      <span style={{fontSize:9}}>▲</span> 접기
                    </button>
                    <button onClick={ev=>{ev.stopPropagation();if(confirm(`"${t.task}" 삭제?`)){delTodo(t.id);sidebarExpand(null);}}}
                      style={{fontSize:11,padding:"3px 10px",borderRadius:8,border:"1px solid #fecaca",
                        background:"#fef2f2",color:"#ef4444",cursor:"pointer",fontFamily:"inherit"}}>
                      삭제
                    </button>
                  </div>
                </div>}
              </div>

              {/* ★ 즐겨찾기 — 항상 우상단 표시 */}
              {!isDoneSec&&
                <button onClick={e=>{e.stopPropagation();toggleStar(t.id);}}
                  title={isStarred?"즐겨찾기 해제":"즐겨찾기"}
                  style={{position:"absolute" as const,right:5,top:isExp?10:9,
                    width:24,height:24,border:"none",background:"transparent",
                    cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:14,color:isStarred?"#f59e0b":"#d1d5db",padding:0,
                    transition:"color .15s,transform .15s",
                    transform:isStarred?"scale(1.1)":"scale(1)"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=isStarred?"#d97706":"#94a3b8";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=isStarred?"#f59e0b":"#d1d5db";}}>
                  {isStarred?"★":"☆"}
                </button>}
            </div>;
          };

          return <div style={{width:268,flexShrink:0,background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,.10)",border:"1px solid #e2e8f0",position:"sticky",top:102,alignSelf:"flex-start",display:"flex",flexDirection:"column",maxHeight:"calc(100vh - 112px)"}}>
            {/* 헤더: 진행률 바 포함 */}
            <div style={{padding:"12px 14px 8px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:myAll.length>0?7:0}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>나의 할 일</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{currentUser} · {active.length}건 진행 · {done.length}건 완료</div>
                </div>
                <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(currentUser||"")},${avColor2(currentUser||"")})`,fontSize:14,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,flexShrink:0}}>{(currentUser||"?").slice(-1)}</div>
              </div>
              {/* 진행률 바 */}
              {myAll.length>0&&<div style={{height:3,borderRadius:99,background:"#e2e8f0",overflow:"hidden"}} title={`${pct}% 완료`}>
                <div style={{height:"100%",width:`${pct}%`,background:pct===100?"#22c55e":"#2563eb",borderRadius:99,transition:"width .4s"}}/>
              </div>}
            </div>
            {/* 업무 추가 — 인라인 입력 */}
            <div style={{padding:"8px 12px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
              {calSidebarAdding
                ?<div onClick={e=>e.stopPropagation()}>
                  <input autoFocus value={calSidebarAddTitle}
                    onChange={e=>setCalSidebarAddTitle(e.target.value)}
                    onKeyDown={e=>{
                      if(e.key==="Enter"&&calSidebarAddTitle.trim()){
                        addTodo({pid:0,task:calSidebarAddTitle.trim(),who:currentUser||"",due:todayStr,pri:"보통",st:"대기",det:"",repeat:"없음"});
                        setCalSidebarAddTitle("");setCalSidebarAdding(false);flash("업무가 등록되었습니다");
                      }
                      if(e.key==="Escape"){setCalSidebarAdding(false);setCalSidebarAddTitle("");}
                    }}
                    placeholder="업무 제목 입력 후 Enter..."
                    style={{width:"100%",padding:"7px 10px",border:"1.5px solid #2563eb",borderRadius:8,fontSize:12,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"}}/>
                  <div style={{display:"flex",justifyContent:"flex-end",gap:4,marginTop:5}}>
                    <button onClick={()=>{setCalSidebarAdding(false);setCalSidebarAddTitle("");}}
                      style={{fontSize:11,padding:"3px 9px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#64748b",fontFamily:"inherit"}}>취소</button>
                    <button onClick={()=>{if(calSidebarAddTitle.trim()){addTodo({pid:0,task:calSidebarAddTitle.trim(),who:currentUser||"",due:todayStr,pri:"보통",st:"대기",det:"",repeat:"없음"});setCalSidebarAddTitle("");setCalSidebarAdding(false);flash("업무가 등록되었습니다");}}}
                      style={{fontSize:11,padding:"3px 12px",borderRadius:6,border:"none",background:"#2563eb",cursor:"pointer",color:"#fff",fontFamily:"inherit",fontWeight:600}}>추가</button>
                  </div>
                </div>
                :<button onClick={()=>setCalSidebarAdding(true)}
                  style={{width:"100%",padding:"8px",border:"1.5px dashed #e2e8f0",borderRadius:8,background:"#f8fafc",cursor:"pointer",fontSize:12,color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontFamily:"inherit",transition:"all .2s"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#93c5fd";(e.currentTarget as HTMLButtonElement).style.color="#2563eb";(e.currentTarget as HTMLButtonElement).style.background="#eff6ff";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#e2e8f0";(e.currentTarget as HTMLButtonElement).style.color="#94a3b8";(e.currentTarget as HTMLButtonElement).style.background="#f8fafc";}}>
                  + 업무 추가
                </button>}
            </div>
            {/* 목록 — flex:1 + overflowY:auto 로 남은 높이 채움 */}
            <div style={{flex:1,overflowY:"auto"}}>
              {animating.map(t=>renderTodo(t))}
              {secNoDate.length>0&&<SecHdr label="날짜 없음" count={secNoDate.length} open={secNodateOpen} onToggle={()=>setSecNodateOpen(v=>!v)}/>}
              {secNodateOpen&&secNoDate.map(t=>renderTodo(t))}
              {secToday.length>0&&<SecHdr label="오늘" count={secToday.length} open={secTodayOpen} onToggle={()=>setSecTodayOpen(v=>!v)}/>}
              {secTodayOpen&&secToday.map(t=>renderTodo(t))}
              {secWeek.length>0&&<SecHdr label="이번 주" count={secWeek.length} open={secWeekOpen} onToggle={()=>setSecWeekOpen(v=>!v)}/>}
              {secWeekOpen&&secWeek.map(t=>renderTodo(t))}
              {secLater.length>0&&<SecHdr label="나중에" count={secLater.length} open={secLaterOpen} onToggle={()=>setSecLaterOpen(v=>!v)}/>}
              {secLaterOpen&&secLater.map(t=>renderTodo(t))}
              {active.length===0&&animating.length===0&&
                <div style={{padding:"28px 16px 12px",textAlign:"center",color:"#cbd5e1",fontSize:12,lineHeight:1.8}}>
                  <div style={{fontSize:26,marginBottom:6}}>✅</div>
                  <div>할일이 없습니다</div>
                  <div style={{fontSize:10,marginTop:3,color:"#d1d5db"}}>위 버튼으로 추가하세요 ↑</div>
                </div>}
              {done.length>0&&<>
                <button onClick={()=>setSidebarDoneOpen(v=>!v)}
                  style={{width:"100%",padding:"10px 12px",border:"none",borderTop:"1px solid #f1f5f9",background:"#fafafa",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:"#64748b",textAlign:"left" as const,fontFamily:"inherit"}}>
                  <span style={{fontSize:8,display:"inline-block",transform:sidebarDoneOpen?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
                  완료됨 <span style={{color:"#94a3b8",fontWeight:400}}>{done.length}</span>
                </button>
                {sidebarDoneOpen&&done.map(t=>renderTodo(t,true))}
              </>}
            </div>
          </div>;
        })()}
      </div>}
    </main>

    {/* ── 이벤트 상세 팝오버 ─────────────────────────────────── */}
    {calEvPop&&(()=>{const t=calEvPop.todo;const p=gPr(t.pid);const od=isOD(t.due,t.st);return(
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",left:calEvPop.x,top:calEvPop.y,zIndex:9100,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.20)",border:"1px solid #e2e8f0",width:296}}>
        <div style={{padding:"12px 14px 10px",display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:4,borderRadius:2,background:p.color,flexShrink:0,minHeight:48,alignSelf:"stretch"}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:6,lineHeight:1.3}}>
              {t.task}{od&&<span style={{color:"#dc2626",fontSize:10,marginLeft:4}}>⚠️</span>}
            </div>
            <div style={{fontSize:11,color:"#64748b",display:"flex",flexDirection:"column" as const,gap:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:p.color,display:"inline-block",flexShrink:0}}/><span style={{color:p.color,fontWeight:600}}>{p.name}</span></div>
              <div>👤 {t.who||"미배정"}</div>
              {t.due&&<div>📅 {t.due}</div>}
            </div>
            <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap" as const}}>
              <span style={{...S.badge(priBg[t.pri],priC[t.pri]),fontSize:10}}>{t.pri}</span>
              <span style={{...S.badge(stBg[t.st],stC[t.st]),fontSize:10}}>{t.st}</span>
              {t.repeat&&t.repeat!=="없음"&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#f0fdf4",color:"#16a34a"}}>🔁 {t.repeat}</span>}
            </div>
          </div>
          <button onClick={()=>setCalEvPop(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,padding:"0 2px",flexShrink:0,lineHeight:1}}>✕</button>
        </div>
        <div style={{padding:"8px 14px 12px",borderTop:"1px solid #f1f5f9",display:"flex",gap:6}}>
          <button onClick={()=>{setEditMod(t);setCalEvPop(null);}} style={{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,color:"#475569",fontWeight:500}}>✏️ 수정</button>
          {t.st!=="완료"&&<button onClick={()=>{updTodo(t.id,{st:"완료",done:todayStr});setCalEvPop(null);flash("완료 처리되었습니다");}} style={{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #bbf7d0",background:"#f0fdf4",cursor:"pointer",fontSize:12,color:"#16a34a",fontWeight:600}}>✓ 완료</button>}
          <button onClick={()=>{if(confirm(`"${t.task}" 업무를 삭제하시겠습니까?`)){delTodo(t.id);setCalEvPop(null);}}} style={{padding:"6px 10px",borderRadius:6,border:"1px solid #fca5a5",background:"#fff5f5",cursor:"pointer",fontSize:12,color:"#dc2626"}}>🗑</button>
        </div>
      </div>
    );})()}

    {/* ── 빠른 업무 추가 팝오버 ──────────────────────────────── */}
    {calQA&&(()=>{
      const qd=(n:number)=>{const d=new Date(calQA.ds);d.setDate(d.getDate()+n);return dateStr(d.getFullYear(),d.getMonth(),d.getDate());};
      const selProj=aProj.find(p=>String(p.id)===calQAPid);
      const iconBtn=(active:boolean)=>({display:"inline-flex",alignItems:"center",gap:3,fontSize:11,padding:"3px 8px",borderRadius:99,border:`1px solid ${active?"#2563eb":"#e2e8f0"}`,background:active?"#eff6ff":"#f8fafc",color:active?"#2563eb":"#64748b",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" as const});
      return <div onClick={e=>e.stopPropagation()} style={{position:"fixed",left:calQA.x,top:calQA.y,zIndex:9100,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.20)",border:"1.5px solid #2563eb",width:300}}>
        <div style={{padding:"12px 14px 8px"}}>
          <input autoFocus value={calQATitle} onChange={e=>setCalQATitle(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")saveQA();if(e.key==="Escape"){setCalQA(null);setCalQATitle("");}}}
            placeholder="업무 제목 입력..."
            style={{width:"100%",padding:"8px 10px",border:"1.5px solid #2563eb",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box" as const}}/>
          {/* 아이콘 빠른선택 */}
          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap" as const}}>
            <button style={iconBtn(!!calQADue)} onClick={()=>setCalQAPicker(calQAPicker==="date"?null:"date")}>
              📅 {calQADue?calQADue.slice(5).replace("-","/"):"날짜"}
              {calQADue&&<span onClick={ev=>{ev.stopPropagation();setCalQADue("");setCalQAPicker(null);}} style={{marginLeft:2,color:"#94a3b8"}}>×</span>}
            </button>
            <button style={iconBtn(!!calQAPid)} onClick={()=>setCalQAPicker(calQAPicker==="proj"?null:"proj")}>
              📁 {selProj?<><span style={{width:6,height:6,borderRadius:"50%",background:selProj.color,display:"inline-block"}}/>{selProj.name}</>:"프로젝트"}
            </button>
            <button style={iconBtn(!!calQAWho&&calQAWho!==currentUser)} onClick={()=>setCalQAPicker(calQAPicker==="who"?null:"who")}>
              👤 {calQAWho||"담당자"}
            </button>
            <button style={iconBtn(calQAPri!=="보통")} onClick={()=>setCalQAPicker(calQAPicker==="pri"?null:"pri")}>
              ⚡ {calQAPri}
            </button>
          </div>
          {/* 피커 패널 */}
          {calQAPicker==="date"&&<div style={{marginTop:8,padding:"8px 10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap" as const}}>
              <button onClick={()=>{setCalQADue(calQA.ds);setCalQAPicker(null);}} style={{fontSize:10,padding:"2px 8px",borderRadius:99,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#334155",fontFamily:"inherit"}}>📅 {calQA.ds.slice(5).replace("-","/")}</button>
              {([["오늘",0],["내일",1],["다음주",7]] as [string,number][]).map(([l,n])=>
                <button key={l} onClick={()=>{setCalQADue(qd(n));setCalQAPicker(null);}} style={{fontSize:10,padding:"2px 8px",borderRadius:99,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#334155",fontFamily:"inherit"}}>{l}</button>)}
            </div>
            <input type="date" defaultValue={calQADue} onChange={e=>{setCalQADue(e.target.value);setCalQAPicker(null);}} style={{width:"100%",fontSize:11,padding:"3px 6px",border:"1px solid #e2e8f0",borderRadius:7,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const}}/>
          </div>}
          {calQAPicker==="proj"&&<div style={{marginTop:8,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden",maxHeight:160,overflowY:"auto" as const}}>
            {visibleProj.map(pr=><div key={pr.id} onClick={()=>{setCalQAPid(String(pr.id));setCalQAPicker(null);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",cursor:"pointer",fontSize:12,color:"#334155",background:String(pr.id)===calQAPid?"#eff6ff":"transparent"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=String(pr.id)===calQAPid?"#eff6ff":"#f1f5f9"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=String(pr.id)===calQAPid?"#eff6ff":"transparent"}>
              <span style={{width:8,height:8,borderRadius:"50%",background:pr.color,display:"inline-block",flexShrink:0}}/>
              {pr.name}{String(pr.id)===calQAPid&&<span style={{marginLeft:"auto",fontSize:10,color:"#2563eb"}}>✓</span>}
            </div>)}
          </div>}
          {calQAPicker==="who"&&<div style={{marginTop:8,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden",maxHeight:160,overflowY:"auto" as const}}>
            {visibleMembers.map(m=><div key={m} onClick={()=>{setCalQAWho(m);setCalQAPicker(null);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",cursor:"pointer",fontSize:12,color:"#334155",background:m===calQAWho?"#eff6ff":"transparent"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=m===calQAWho?"#eff6ff":"#f1f5f9"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=m===calQAWho?"#eff6ff":"transparent"}>
              {m}{m===calQAWho&&<span style={{marginLeft:"auto",fontSize:10,color:"#2563eb"}}>✓</span>}
            </div>)}
          </div>}
          {calQAPicker==="pri"&&<div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap" as const}}>
            {pris.map(pr=><button key={pr} onClick={()=>{setCalQAPri(pr);setCalQAPicker(null);}}
              style={{fontSize:10,padding:"3px 10px",borderRadius:99,border:`1px solid ${calQAPri===pr?"#2563eb":"#e2e8f0"}`,background:calQAPri===pr?"#eff6ff":"#f8fafc",color:calQAPri===pr?"#2563eb":"#64748b",cursor:"pointer",fontFamily:"inherit",fontWeight:calQAPri===pr?700:400}}>{pr}</button>)}
          </div>}
        </div>
        <div style={{padding:"0 14px 12px",display:"flex",gap:6}}>
          <button onClick={()=>{setCalQA(null);setCalQATitle("");}} style={{padding:"6px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,color:"#64748b"}}>취소</button>
          <button onClick={saveQA} disabled={!calQATitle.trim()} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:calQATitle.trim()?"#2563eb":"#cbd5e1",cursor:calQATitle.trim()?"pointer":"default",fontSize:12,color:"#fff",fontWeight:600}}>저장</button>
          <button onClick={()=>{setEditMod({pid:calQAPid,task:calQATitle.trim(),who:calQAWho,due:calQADue,pri:calQAPri,st:"대기",det:"",repeat:"없음"});setCalQA(null);setCalQATitle("");}}
            style={{padding:"6px 10px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,color:"#475569"}}>더보기</button>
        </div>
      </div>;
    })()}

    {/* ── 월 뷰 날짜 더보기 팝오버 ──────────────────────────── */}
    {calDayPop&&<div onClick={e=>e.stopPropagation()} style={{position:"fixed",left:calDayPop.x,top:calDayPop.y,zIndex:9100,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.20)",border:"1px solid #e2e8f0",width:280,maxHeight:360,display:"flex",flexDirection:"column" as const}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:12,fontWeight:700,color:"#334155"}}>📅 {calDayPop.ds.slice(5).replace("-","/")} <span style={{color:"#94a3b8",fontWeight:400}}>({calDayPop.todos.length}건)</span></div>
        <button onClick={()=>setCalDayPop(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:15,lineHeight:1}}>✕</button>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"6px 8px"}}>
        {calDayPop.todos.map((t,ii)=>{const p=gPr(t.pid);return(
          <div key={t.id+"_"+ii} onClick={e=>openEvPop(e,t)} style={{padding:"6px 10px",borderRadius:7,borderLeft:`3px solid ${p.color}`,background:`${p.color}10`,cursor:"pointer",marginBottom:4,transition:"background .1s"}}
            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=`${p.color}22`}
            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=`${p.color}10`}>
            <div style={{fontSize:12,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.task}</div>
            <div style={{fontSize:10,color:"#94a3b8",display:"flex",gap:6,marginTop:2}}>
              <span>{t.who||"미배정"}</span>
              <span style={S.badge(stBg[t.st],stC[t.st])}>{t.st}</span>
            </div>
          </div>
        );})}
      </div>
      <div style={{padding:"8px 14px",borderTop:"1px solid #f1f5f9",flexShrink:0}}>
        <button onClick={()=>{const d=new Date(calDayPop.ds);setCalDate(d);setCalView("day");setCalDayPop(null);}}
          style={{width:"100%",padding:"6px",borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontSize:11,color:"#475569"}}>일 뷰로 이동</button>
      </div>
    </div>}

    <DateTimePicker datePop={datePop} onSave={(id,val)=>{updTodo(id,{due:val});setDatePop(null);setEditCell(null);}} onClose={()=>{setDatePop(null);setEditCell(null);}}/>
    <DateTimePicker datePop={nrDatePop} onSave={(id,val)=>{const n=[...newRows];n[id].due=val;setNewRows(n);setNrDatePop(null);}} onClose={()=>setNrDatePop(null)}/>

    {selectedIds.size>0&&(()=>{
      const closeAll=()=>{setMovePop(false);setBulkPop(null);};
      const ps:React.CSSProperties={position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#fff",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.18)",border:"1px solid #e2e8f0",minWidth:160,overflow:"hidden",zIndex:10};
      const ph=(t:string)=><div style={{padding:"8px 12px 6px",fontSize:11,fontWeight:700,color:"#94a3b8",borderBottom:"1px solid #f1f5f9"}}>{t}</div>;
      const pi=(label:string,fn:()=>void,pre?:React.ReactNode)=>
        <button key={label} onClick={fn} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#334155",textAlign:"left" as const}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#f8fafc";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="none";}}>{pre}{label}</button>;
      const pb=(key:string,icon:string,label:string,content:React.ReactNode)=>{
        const active=key==="proj"?movePop:bulkPop===key;
        return <div key={key} style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>{if(key==="proj"){setBulkPop(null);setMovePop(p=>!p);}else{setMovePop(false);setBulkPop(bulkPop===key?null:key);}}}
            style={{display:"flex",alignItems:"center",gap:4,background:active?"#334155":"transparent",border:"none",borderRadius:8,padding:"5px 9px",cursor:"pointer",color:"#cbd5e1",fontSize:12,fontWeight:600,whiteSpace:"nowrap" as const,flexShrink:0}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#334155";}}
            onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            <span style={{fontSize:13}}>{icon}</span>{label}
          </button>
          {active&&content}
        </div>;
      };
      return <div onClick={closeAll} style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",zIndex:2000,display:"flex",alignItems:"center",gap:1,background:"#1e293b",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.35)",padding:"5px 8px 5px 12px",animation:"slideUp .2s ease",whiteSpace:"nowrap" as const,flexWrap:"nowrap" as const}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"#2563eb",color:"#fff",fontSize:11,fontWeight:800,marginRight:6,flexShrink:0}}>{selectedIds.size}</div>
        {([
          {label:"복제",icon:"⧉",fn:()=>{const base=Math.max(...todos.map((t:any)=>t.id),0);let i=1;const copies=todos.filter((t:any)=>selectedIds.has(t.id)).map((t:any)=>({...t,id:base+i++,task:t.task+" (복사)",cre:todayStr,done:null}));setTodos((p:any)=>[...p,...copies]);setNId((n:number)=>n+copies.length);clrSel();flash(`${copies.length}건이 복제되었습니다`);}},
          {label:"완료",icon:"✓",fn:()=>{selectedIds.forEach(id=>updTodo(id,{st:"완료",done:todayStr}));flash(`${selectedIds.size}건이 완료 처리되었습니다`);clrSel();}},
          {label:"즐겨찾기",icon:"☆",fn:()=>{selectedIds.forEach(id=>toggleFav(id));flash(`${selectedIds.size}건의 즐겨찾기가 변경되었습니다`);clrSel();}},
          {label:"삭제",icon:"🗑",fn:()=>{if(!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`))return;setTodos((p:any)=>p.filter((t:any)=>!selectedIds.has(t.id)));flash(`${selectedIds.size}건이 삭제되었습니다`,"err");clrSel();},danger:true},
        ] as {label:string,icon:string,fn:()=>void,danger?:boolean}[]).map(({label,icon,fn,danger})=>
          <button key={label} title={label} onClick={e=>{e.stopPropagation();fn();}} style={{display:"flex",alignItems:"center",justifyContent:"center",background:danger?"#dc2626":"transparent",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",color:danger?"#fff":"#cbd5e1",fontSize:15,transition:"background .12s",flexShrink:0}}
            onMouseEnter={e=>{if(!danger)(e.currentTarget as HTMLButtonElement).style.background="#334155";}}
            onMouseLeave={e=>{if(!danger)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            {icon}
          </button>
        )}
        <div style={{width:1,height:18,background:"#334155",margin:"0 4px",flexShrink:0}}/>
        {pb("proj","📁","프로젝트",<div style={ps}>{ph("이동할 프로젝트 선택")}{visibleProj.map(p=>pi(p.name,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,pid:p.id}:t));flash(`${selectedIds.size}건이 "${p.name}"으로 이동`);closeAll();clrSel();},<span style={{width:10,height:10,borderRadius:"50%",background:p.color,flexShrink:0,display:"inline-block"}}/>))}</div>)}
        {pb("who","👤","담당자",<div style={ps}>{ph("담당자 선택")}{visibleMembers.map(m=>pi(m,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,who:m}:t));flash(`${selectedIds.size}건 담당자 → "${m}"`);closeAll();clrSel();}))}</div>)}
        {pb("pri","⚡","우선순위",<div style={ps}>{ph("우선순위 선택")}{pris.map(v=>pi(v,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,pri:v}:t));flash(`${selectedIds.size}건 우선순위 → "${v}"`);closeAll();clrSel();}))}</div>)}
        {pb("st","📋","상태",<div style={ps}>{ph("상태 선택")}{stats.map(v=>pi(v,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,st:v,done:v==="완료"?todayStr:null}:t));flash(`${selectedIds.size}건 상태 → "${v}"`);closeAll();clrSel();}))}</div>)}
        {pb("due","📅","마감기한",<div style={{...ps,minWidth:200,padding:"10px 12px",overflow:"visible"}} onClick={e=>e.stopPropagation()}>
          {ph("마감기한 선택")}
          <div style={{display:"flex",gap:4,margin:"8px 0",flexWrap:"wrap" as const}}>
            {([["오늘",0],["내일",1],["다음 주",7]] as [string,number][]).map(([l,n])=>{
              const d=new Date();d.setDate(d.getDate()+n);const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
              return <button key={l} onClick={()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,due:ds}:t));flash(`${selectedIds.size}건 마감기한 변경`);closeAll();clrSel();}}
                style={{flex:1,padding:"5px 6px",borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",fontSize:11,cursor:"pointer",color:"#334155"}}>{l}</button>;
            })}
          </div>
          <input type="date" onChange={e=>{if(!e.target.value)return;setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,due:e.target.value}:t));flash(`${selectedIds.size}건 마감기한 변경`);closeAll();clrSel();}}
            style={{width:"100%",padding:"7px 8px",border:"1px solid #e2e8f0",borderRadius:7,fontSize:12,fontFamily:"inherit",boxSizing:"border-box" as const}}/>
        </div>)}
        {pb("repeat","🔁","반복",<div style={ps}>{ph("반복 설정")}{REPEAT_OPTS.map(v=>pi(v==="없음"?"반복 없음":v,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,repeat:v}:t));flash(`${selectedIds.size}건 반복 변경`);closeAll();clrSel();}))}</div>)}
        <div style={{width:1,height:20,background:"#334155",margin:"0 4px"}}/>
        <button onClick={e=>{e.stopPropagation();clrSel();closeAll();}} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:16,padding:"4px 6px",borderRadius:6,lineHeight:1}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#334155";(e.currentTarget as HTMLButtonElement).style.color="#fff";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="none";(e.currentTarget as HTMLButtonElement).style.color="#64748b";}}>✕</button>
      </div>;
    })()}

    <Modal open={!!editMod} onClose={()=>setEditMod(null)} title={editMod?.id?"업무 수정":"새 업무"} footer={<>{editMod?.id&&<button style={{...S.bd,marginRight:"auto"}} onClick={()=>{if(confirm(`"${editMod.task}" 업무를 삭제하시겠습니까?`)){const id=parseInt(editMod.id);setEditMod(null);delTodo(id)}}}>🗑️ 삭제</button>}<button style={S.bs} onClick={()=>setEditMod(null)}>취소</button><button style={S.bp} onClick={()=>saveMod(editMod)}>💾 저장</button></>}>
      {editMod&&<EditForm f={editMod} onChange={setEditMod} proj={visibleProj} members={visibleMembers} pris={pris} stats={stats}/>}
    </Modal>

    <Modal open={!!detMod} onClose={()=>setDetMod(null)} title={detMod?.task||""} footer={<><button style={{...S.bd,marginRight:"auto"}} onClick={()=>{if(confirm(`"${detMod.task}" 업무를 삭제하시겠습니까?`)){delTodo(detMod.id);setDetMod(null)}}}>🗑️</button><button style={S.bs} onClick={()=>setDetMod(null)}>닫기</button><button style={S.bp} onClick={()=>{setEditMod(detMod);setDetMod(null)}}>✏️ 수정</button></>}>
      {detMod&&<DetailView t={detMod} p={gPr(detMod.pid)} stats={stats} stC={stC} stBg={stBg} priC={priC} priBg={priBg} onSt={st=>{updTodo(detMod.id,{st});setDetMod({...detMod,st});flash(`상태가 "${st}"(으)로 변경되었습니다`)}}/>}
    </Modal>

    <Modal open={projMod} onClose={()=>setProjMod(false)} title="📁 프로젝트 관리" footer={<button style={S.bs} onClick={()=>setProjMod(false)}>닫기</button>}>
      <ProjMgr projects={projects} todos={todos}
        onAdd={p=>{const np={...p,id:pNId};setProjects((prev: any)=>[...prev,np]);setPNId(pNId+1);flash(`"${p.name}" 프로젝트가 추가되었습니다`)}}
        onDel={id=>{if(todos.some(t=>t.pid===id)){alert("해당 프로젝트에 업무가 존재하여 삭제할 수 없습니다.");return;}setProjects((p: any)=>p.filter((x: any)=>x.id!==id));flash("프로젝트가 삭제되었습니다","err")}}
        onEdit={(id,u)=>{setProjects((p: any)=>p.map((x: any)=>{if(x.id!==id)return x;return{...x,...u};}));flash("프로젝트 정보가 수정되었습니다")}}/>
    </Modal>

    <Modal open={settMod} onClose={()=>setSettMod(false)} title="⚙️ 설정" footer={<button style={S.bs} onClick={()=>setSettMod(false)}>닫기</button>}>
      <SettingsMgr members={members} setMembers={setMembers} pris={pris} setPris={setPris} stats={stats} setStats={setStats} priC={priC} setPriC={setPriC} priBg={priBg} setPriBg={setPriBg} stC={stC} setStC={setStC} stBg={stBg} setStBg={setStBg} todos={todos} flash={flash} apiKey={apiKey} setApiKey={setApiKey}/>
    </Modal>

    {chipAdd&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setChipAdd(null)}}>
      <div style={{background:"#fff",borderRadius:12,padding:20,width:320,boxShadow:"0 10px 25px rgba(0,0,0,.15)"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{({proj:"📁 프로젝트",who:"👤 담당자",pri:"🔥 우선순위",st:"📋 상태"} as any)[chipAdd]} 추가</div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
          {chipAdd!=="who"&&<input type="color" value={chipColor} onChange={e=>setChipColor(e.target.value)} style={{width:36,height:34,padding:1,borderRadius:6,cursor:"pointer",border:"1px solid #e2e8f0"}}/>}
          <input autoFocus value={chipVal} onChange={e=>setChipVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addChip()}} placeholder="이름 입력" style={{flex:1,padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><button style={S.bs} onClick={()=>setChipAdd(null)}>취소</button><button style={S.bp} onClick={addChip}>추가</button></div>
      </div>
    </div>}

    {/* ── 리스트 hover 플로팅 액션 버튼 ───────────────────────── */}
    {view==="list"&&hoverRow&&hoverRowRect&&(()=>{
      const t=sorted.find(x=>x.id===hoverRow);
      if(!t) return null;
      const isDone=t.st==="완료";
      const tblRight=tblDivRef.current?tblDivRef.current.getBoundingClientRect().right:window.innerWidth-16;
      return <div
        style={{position:"fixed",top:hoverRowRect.top,left:tblRight+8,height:hoverRowRect.height,
          display:"flex",alignItems:"center",gap:4,zIndex:500,
          background:"#fff",borderRadius:8,boxShadow:"0 2px 10px rgba(0,0,0,.14)",
          border:"1px solid #e2e8f0",padding:"0 8px",pointerEvents:"auto"}}
        onMouseEnter={()=>clearTimeout(hoverLeaveTimer.current)}
        onMouseLeave={()=>{hoverLeaveTimer.current=setTimeout(()=>{setHoverRow(null);setHoverRowRect(null);},80);}}>
        {!isDone&&<button onClick={()=>setEditMod(t)}
          style={{background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:11,color:"#475569",borderRadius:5,padding:"3px 7px"}}>✏️</button>}
        <button onClick={e=>{e.stopPropagation();if(confirm(`"${t.task}" 업무를 삭제하시겠습니까?`)){delTodo(t.id);setHoverRow(null);setHoverRowRect(null);}}}
          style={{background:"#fee2e2",border:"none",cursor:"pointer",fontSize:11,color:"#dc2626",borderRadius:5,padding:"3px 7px",fontWeight:700}}>🗑️</button>
      </div>;
    })()}

    <Toast msg={toast.m} type={toast.t}/>
    {notePopup&&<NotePopup
      key={notePopup.todo.id}
      todo={notePopup.todo}
      x={notePopup.x}
      y={notePopup.y}
      onSave={text=>{if(notePopup._newRow!=null){const n=[...newRows];n[notePopup._newRow!].det=text;setNewRows(n);}else{updTodo(notePopup.todo.id,{det:text});}}}
      onClose={()=>setNotePopup(null)}
    />}
    {detPopup&&<CellRichPopup
      todo={detPopup}
      onSave={html=>{
        if(detPopup._newRow!=null){
          const n=[...newRows]; n[detPopup._newRow].det=html; setNewRows(n);
        } else {
          updTodo(detPopup.id,{det:html});
        }
      }}
      onClose={()=>setDetPopup(null)}
    />}
  </div>;

  return (
    <PermissionProvider currentUser={currentUser}>
      {content}
    </PermissionProvider>
  );
}
