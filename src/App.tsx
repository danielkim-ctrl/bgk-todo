import { useRef, useEffect, useState } from "react";
import { useTodoApp } from "./hooks/useTodoApp";
import { PermissionProvider } from "./auth/PermissionContext";
import { S } from "./styles";
import { REPEAT_OPTS } from "./constants";

import { Toast } from "./components/ui/Toast";
import { Modal } from "./components/ui/Modal";
import { NotePopup } from "./components/editor/NotePopup";
import { CellRichPopup } from "./components/editor/CellRichPopup";
import { DateTimePicker } from "./components/editor/DateTimePicker";
import { EditForm } from "./components/todo/EditForm";
import { DetailView } from "./components/todo/DetailView";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ProjMgr } from "./components/settings/ProjMgr";
import { SettingsMgr } from "./components/settings/SettingsMgr";

import { LoginScreen } from "./components/auth/LoginScreen";
import { KanbanView } from "./views/KanbanView";
import { ListView } from "./views/ListView";
import { CalendarView } from "./views/CalendarView";

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

      {view==="kanban"&&<KanbanView
        todos={todos} stats={stats} pris={pris} priC={priC} priBg={priBg} stC={stC} stBg={stBg}
        kbF={kbF} setKbF={setKbF} kbFWho={kbFWho} setKbFWho={setKbFWho}
        members={members} visibleProj={visibleProj}
        kanbanOrder={kanbanOrder} setKanbanOrder={setKanbanOrder}
        kbInsert={kbInsert} setKbInsert={setKbInsert}
        dragId={dragId} setDragId={setDragId}
        dragOver={dragOver} setDragOver={setDragOver}
        gPr={gPr} updTodo={updTodo} setEditMod={setEditMod} setDetMod={setDetMod} flash={flash}
      />}

      {view==="list"&&<ListView
        search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} togF={togF}
        todos={todos} aProj={aProj} members={members} pris={pris} priC={priC} priBg={priBg}
        stats={stats} stC={stC} stBg={stBg} favSidebar={favSidebar} togFavSidebar={togFavSidebar}
        isFav={isFav} gPr={gPr} setChipAdd={setChipAdd} setChipVal={setChipVal}
        setChipColor={setChipColor} projects={projects}
        hiddenProjects={hiddenProjects} toggleHideProject={toggleHideProject}
        hiddenMembers={hiddenMembers} toggleHideMember={toggleHideMember}
        visibleProj={visibleProj} visibleMembers={visibleMembers}
        addTab={addTab} setAddTab={setAddTab} newRows={newRows} setNewRows={setNewRows}
        addNR={addNR} saveNRs={saveNRs} saveOneNR={saveOneNR} isNREmpty={isNREmpty}
        setNotePopup={setNotePopup} setNrDatePop={setNrDatePop}
        aiText={aiText} setAiText={setAiText} aiFiles={aiFiles} setAiFiles={setAiFiles}
        aiLoad={aiLoad} aiSt={aiSt} setAiSt={setAiSt} aiParsed={aiParsed}
        setAiParsed={setAiParsed} parseAI={parseAI} confirmAI={confirmAI}
        sorted={sorted} currentUser={currentUser}
        todoView={todoView} setTodoView={setTodoView}
        memoCols={memoCols} setMemoCols={setMemoCols}
        showDone={showDone} setShowDone={setShowDone}
        expandMode={expandMode} setExpandMode={setExpandMode}
        sortCol={sortCol} sortDir={sortDir} sortIcon={sortIcon} toggleSort={toggleSort}
        selectedIds={selectedIds} allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        handleCheck={handleCheck} toggleSelectAll={toggleSelectAll}
        toggleFav={toggleFav} addTodo={addTodo} updTodo={updTodo} flash={flash} delTodo={delTodo}
        setEditMod={setEditMod}
        editCell={editCell} setEditCell={setEditCell}
        datePop={datePop} setDatePop={setDatePop}
        hoverRow={hoverRow} setHoverRow={setHoverRow}
        hoverRowRect={hoverRowRect} setHoverRowRect={setHoverRowRect}
        hoverLeaveTimer={hoverLeaveTimer}
        addSecRef={addSecRef} tblDivRef={tblDivRef}
      />}

      {view==="calendar"&&<CalendarView
        calView={calView} setCalView={setCalView}
        calY={calY} calM={calM} calD={calD}
        calNav={calNav} calTitle={calTitle} calDays={calDays}
        todayStr={todayStr} customDays={customDays} setCustomDays={setCustomDays}
        weekDates={weekDates} customDates={customDates} agendaItems={agendaItems}
        ftodosExpanded={ftodosExpanded} evStyle={evStyle}
        calF={calF} setCalF={setCalF} calFWho={calFWho} setCalFWho={setCalFWho}
        visibleProj={visibleProj} members={members} visibleMembers={visibleMembers}
        gPr={gPr} pris={pris} priC={priC} priBg={priBg} stC={stC} stBg={stBg}
        todos={todos} updTodo={updTodo} addTodo={addTodo} delTodo={delTodo}
        flash={flash} setEditMod={setEditMod} currentUser={currentUser}
        calEvPop={calEvPop} setCalEvPop={setCalEvPop}
        calQA={calQA} setCalQA={setCalQA}
        calQATitle={calQATitle} setCalQATitle={setCalQATitle}
        calQADue={calQADue} setCalQADue={setCalQADue}
        calQAPid={calQAPid} setCalQAPid={setCalQAPid}
        calQAWho={calQAWho} setCalQAWho={setCalQAWho}
        calQAPri={calQAPri} setCalQAPri={setCalQAPri}
        calQAPicker={calQAPicker} setCalQAPicker={setCalQAPicker}
        calDayPop={calDayPop} setCalDayPop={setCalDayPop}
        calSidebarOpen={calSidebarOpen} setCalSidebarOpen={setCalSidebarOpen}
        calSidebarAdding={calSidebarAdding} setCalSidebarAdding={setCalSidebarAdding}
        calSidebarAddTitle={calSidebarAddTitle} setCalSidebarAddTitle={setCalSidebarAddTitle}
        calDragId={calDragId} setCalDragId={setCalDragId}
        calDragOverDs={calDragOverDs} setCalDragOverDs={setCalDragOverDs}
        calDragOverH={calDragOverH} setCalDragOverH={setCalDragOverH}
        calDragStart={calDragStart} calDragEnd={calDragEnd} calDropOnDate={calDropOnDate}
        calTodayKey={calTodayKey} calTodayFn={calTodayFn} setCalDate={setCalDate}
        gridScrolled={gridScrolled} justOpenedPopup={justOpenedPopup}
        saveQA={saveQA} openEvPop={openEvPop} openQA={openQA}
        sidebarOrder={sidebarOrder} setSidebarOrder={setSidebarOrder}
        sidebarDragId={sidebarDragId} setSidebarDragId={setSidebarDragId}
        sidebarDragOver={sidebarDragOver} setSidebarDragOver={setSidebarDragOver}
        sidebarHoverId={sidebarHoverId} setSidebarHoverId={setSidebarHoverId}
        sidebarEditId={sidebarEditId} setSidebarEditId={setSidebarEditId}
        sidebarEditVal={sidebarEditVal} setSidebarEditVal={setSidebarEditVal}
        sidebarDateId={sidebarDateId} setSidebarDateId={setSidebarDateId}
        sidebarExpandId={sidebarExpandId}
        sidebarDetId={sidebarDetId} setSidebarDetId={setSidebarDetId}
        sidebarProjId={sidebarProjId} setSidebarProjId={setSidebarProjId}
        sidebarExpand={sidebarExpand}
        sidebarDoneOpen={sidebarDoneOpen} setSidebarDoneOpen={setSidebarDoneOpen}
        secNodateOpen={secNodateOpen} setSecNodateOpen={setSecNodateOpen}
        secTodayOpen={secTodayOpen} setSecTodayOpen={setSecTodayOpen}
        secWeekOpen={secWeekOpen} setSecWeekOpen={setSecWeekOpen}
        secLaterOpen={secLaterOpen} setSecLaterOpen={setSecLaterOpen}
        starredIds={starredIds} toggleStar={toggleStar}
        pendingComplete={pendingComplete} handleSideComplete={handleSideComplete}
        detDivRefs={detDivRefs}
      />}
    </main>

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
