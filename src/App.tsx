import { useRef, useEffect, useState } from "react";
import { useTodoApp } from "./hooks/useTodoApp";
import { useIsMobile } from "./hooks/useMediaQuery";
import { PermissionProvider } from "./auth/PermissionContext";
import { S } from "./styles";
import { REPEAT_OPTS, INIT_ST } from "./constants";
import { ActivityLog, TEAM_ROLE_PERMISSIONS, TeamRole } from "./types";
import { FolderIcon, Cog6ToothIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, TrashIcon, KeyboardIcon, ChartBarIcon, ListBulletIcon, CalendarIcon, ViewColumnsIcon, ArrowPathIcon, UserIcon, BoltIcon, CheckCircleIcon, DocumentTextIcon, StarIcon as StarSolidIcon, StarOutlineIcon, PlusIcon, ClipboardDocumentIcon, CheckIcon, PencilSquareIcon, XMarkIcon, Bars3Icon, ICON_SM } from "./components/ui/Icons";
import { BottomTabBar } from "./components/ui/BottomTabBar";
import { SidebarDrawer } from "./components/sidebar/SidebarDrawer";
import { FAB } from "./components/ui/FAB";
import { AddTodoBottomSheet } from "./components/todo/AddTodoBottomSheet";
import { FilterBottomSheet } from "./components/ui/FilterBottomSheet";

import { Toast } from "./components/ui/Toast";
import { Modal } from "./components/ui/Modal";
import { BottomSheet } from "./components/ui/BottomSheet";
import { NotePopup } from "./components/editor/NotePopup";
import { CellRichPopup } from "./components/editor/CellRichPopup";
import { DateTimePicker } from "./components/editor/DateTimePicker";
import { EditForm } from "./components/todo/EditForm";
import { DetailView } from "./components/todo/DetailView";
import { Dashboard } from "./components/dashboard/Dashboard";
import { SettingsMgr } from "./components/settings/SettingsMgr";

import { LoginScreen } from "./components/auth/LoginScreen";
import { usePermission } from "./auth/PermissionContext";
import { KanbanView } from "./views/KanbanView";
import { ListView } from "./views/ListView";
import { CalendarView } from "./views/CalendarView";

export default function App() {

  const app = useTodoApp();
  const {
    projects, setProjects, todos, setTodos, nId, setNId, pNId, setPNId,
    members, setMembers, pris, setPris, stats, setStats,
    priC, setPriC, priBg, setPriBg, stC, setStC, stBg, setStBg,
    memberColors, setMemberColors,
    teams, setTeams, selectedTeamId, setSelectedTeamId,
    memberRoles, setMemberRole, memberPins, setMemberPins, generatePin,
    globalPermissions, setGlobalPermissions,
    addTeam, updTeam, delTeam,
    addTeamMember, removeTeamMember, setTeamMemberRole,
    addTeamProject, removeTeamProject, assignTodosToTeams,
    view, setView, toast, filters, setFilters, favSidebar, togFavSidebar,
    search, setSearch, editCell, setEditCell, sortCol, sortDir, setSortCol, setSortDir, customSortOrders, setCustomSortOrders, activeSortFields, setActiveSortFields,
    newRows, setNewRows, kbF, setKbF, kbFWho, setKbFWho,
    dragId, setDragId, dragOver, setDragOver,
    calF, setCalF, calFWho, setCalFWho, calY, calM, calD,
    calView, setCalView, customDays, setCustomDays,
    editMod, setEditMod, detMod, setDetMod, settMod, setSettMod,
    chipAdd, setChipAdd, chipVal, setChipVal, chipColor, setChipColor,
    aiText, setAiText, aiFiles, setAiFiles, aiLoad, aiSt, setAiSt, apiKey, setApiKey,
    aiParsed, setAiParsed, addTab, setAddTab,
    detPopup, setDetPopup, notePopup, setNotePopup,
    datePop, setDatePop, nrDatePop, setNrDatePop,
    hoverRow, setHoverRow, currentUser, setCurrentUser,
    userFavs, isFav, toggleFav: toggleFavBase, userSettings, setUserSettings,
    expandMode, setExpandMode, todoView, setTodoView, showDone, setShowDone, memoCols, setMemoCols,
    selectedIds, lastSelRef, addSecRef, tblDivRef,
    clrSel, selAll, movePop, setMovePop, bulkPop, setBulkPop,
    historyRef, redoRef,
    aProj, gPr, filtered, sorted, sortIcon,
    visibleTodoIds, allVisibleSelected, someVisibleSelected,
    ftodosExpanded, calRangeDs, todayStr, calDays,
    undo, redo, flash, forceFirestoreSync, updTodo, addTodo, delTodo, reorderTodo,
    toggleSort, togF, handleCheck, toggleSelectAll,
    calDate, setCalDate, calToday, calNav, calTitle, weekDates, customDates, agendaItems, evStyle,
    saveMod, addNR, isNREmpty, saveOneNR, saveNRs,
    parseAI, confirmAI, addChip, aiHistory, restoreAiHistory,
    deletedLog, restoreTodo,
    savedFilters, saveCurrentFilter, deleteSavedFilter,
  } = app;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      // Ctrl+Z / Ctrl+Y는 입력 중 여부와 무관하게 항상 앱 undo/redo를 실행
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "Z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      // Ctrl+Z/Y 이외의 단축키는 텍스트 입력 중에는 무시 (브라우저 기본 동작 유지)
      const isEditing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable;
      if (isEditing) return;
      // ? 키로 단축키 도움말 팝업 열기/닫기
      if (e.key === "?") { e.preventDefault(); setShowShortcuts(p => !p); return; }
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

  // ── 반응형 모바일 감지 ────────────────────────────────────────
  // 768px 이하에서 true — 모바일 레이아웃 분기에 사용
  const isMobile = useIsMobile();
  // 모바일 사이드바 Drawer 열림 여부 (햄버거 버튼으로 토글)
  const [drawerOpen, setDrawerOpen] = useState(false);
  // 모바일 업무 추가 바텀 시트 열림 여부 (FAB 탭 시 열림)
  const [addTodoBSOpen, setAddTodoBSOpen] = useState(false);
  // 모바일 필터 바텀 시트 열림 여부 (필터 버튼 탭 시 열림)
  const [filterBSOpen, setFilterBSOpen] = useState(false);

  // ── 단축키 도움말 / 휴지통 모달 상태 ────────────────────────────
  const [showShortcuts, setShowShortcuts] = useState(false); // 단축키 도움말 팝업 열림 여부
  const [showTrash, setShowTrash] = useState(false);         // 휴지통 팝업 열림 여부

  // ── 역할별 권한 헬퍼 ──────────────────────────────────────────────────
  // memberRoles에서 현재 사용자 역할 조회 → 미설정 시 admin (기존 동작 유지)
  // globalPermissions가 있으면 전역 적용, 없으면 기본값
  const myRole: TeamRole = (currentUser && memberRoles[currentUser]) || "admin";
  const myTeam = teams.find(t => t.members.some(m => m.name === currentUser));
  const myPerms = globalPermissions?.[myRole] ?? TEAM_ROLE_PERMISSIONS[myRole];
  const can = (perm: string) => myPerms.includes(perm);
  const isOwner = (who: string) => who === currentUser;

  // "타 팀 조회" 권한 여부
  const canViewOtherTeams = can("team.view.other");
  // 현재 사용자가 소속된 팀 목록 (복수 가능)
  const myTeamIds = teams.filter(t => t.members.some(m => m.name === currentUser)).map(t => t.id);
  const isMultiTeam = myTeamIds.length > 1;

  // 로그인 시 기본 팀 선택
  // - 복수 팀 소속: "전체 보기"(null) → 소속 팀 전체 데이터 표시
  // - 단일 팀 소속: 해당 팀 자동 선택
  // - 타 팀 조회 권한 없으면 소속 팀 외 선택 차단
  useEffect(() => {
    if (!teams.length || !currentUser) return;
    if (selectedTeamId) {
      // 이미 선택됨 — 권한 없는 팀이면 차단
      if (!canViewOtherTeams && !myTeamIds.includes(selectedTeamId)) {
        setSelectedTeamId(isMultiTeam ? null : myTeamIds[0] || null);
      }
      return;
    }
    // 미선택 — 복수 팀이면 전체 보기, 단일이면 해당 팀
    if (myTeamIds.length === 1) setSelectedTeamId(myTeamIds[0]);
    // 복수 팀이면 null(전체 보기) 유지
  }, [teams, currentUser, selectedTeamId, canViewOtherTeams]);

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
  // 완료 애니메이션 타이머 — 탭 전환/언마운트 시 메모리 누수 방지용 cleanup 대상
  const completeTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
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
  const [sidebarExpandId, setSidebarExpandId] = useState<number|null>(null); // 확장(클릭) 중인 ID
  const [sidebarDetId, setSidebarDetId] = useState<number|null>(null);       // 세부정보 편집 중인 ID
  const detDivRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  // 제목 contentEditable ref 추적 — detDivRefs와 동일한 패턴
  const taskDivRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  // 즐겨찾기 통합 토글 — userFavs(localStorage, 리스트뷰 필터용) + userSettings.starredIds(캘린더 사이드바) 동시 반영
  const toggleFav = (id: number) => {
    toggleFavBase(id);
    if (!currentUser) return;
    setUserSettings((prev: any) => {
      const cur: number[] = prev[currentUser]?.starredIds ?? [];
      const n = cur.includes(id) ? cur.filter((x: number) => x !== id) : [...cur, id];
      return { ...prev, [currentUser]: { ...prev[currentUser], starredIds: n } };
    });
  };
  // starredIds — userFavs 기반으로 통일 (두 저장소를 하나로 읽기)
  const starredIds: Set<number> = new Set(currentUser ? (userFavs[currentUser] || []) : []);
  // toggleStar는 toggleFav와 동일 (캘린더 사이드바에서 호출)
  const toggleStar = toggleFav;
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
  // 팀 필터 적용: 선택된 팀 프로젝트 / 전체 보기 시 소속 팀 전체 프로젝트
  const teamProj = selectedTeamId
    ? aProj.filter(p => teams.some(t => t.id === selectedTeamId && t.projectIds.includes(p.id)))
    : canViewOtherTeams ? aProj
    : aProj.filter(p => teams.some(t => myTeamIds.includes(t.id) && t.projectIds.includes(p.id)));
  const visibleProj = teamProj.filter(p => !hiddenProjects.includes(p.id));
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
  // 팀 필터 적용: 선택된 팀 멤버 / 전체 보기 시 소속 팀 전체 멤버
  const teamMembers = selectedTeamId
    ? members.filter(m => teams.some(t => t.id === selectedTeamId && t.members.some(tm => tm.name === m)))
    : canViewOtherTeams ? members
    : members.filter(m => teams.some(t => myTeamIds.includes(t.id) && t.members.some(tm => tm.name === m)));
  const visibleMembers = teamMembers.filter(m => !hiddenMembers.includes(m));
  const sidebarExpand = (id: number|null) => {
    // 다른 항목으로 전환 전 현재 세부정보 자동저장 (DOM에서 직접 읽기)
    if (sidebarDetId !== null) {
      const el = detDivRefs.current.get(sidebarDetId);
      // el이 DOM에 실제로 연결되어 있는지 확인 후 저장 (언마운트된 ref 참조 방지)
      if (el && document.contains(el)) {
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
      setCalEvPop(null); setCalQA(null); setCalDayPop(null);
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
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // 팝업이 화면 밖으로 넘어가지 않도록 좌표를 뷰포트 범위 내로 보정 (zoom 반영)
    const vw = window.innerWidth / zoom;
    const vh = window.innerHeight / zoom;
    const x = Math.max(8, Math.min(r.right / zoom + 8, vw - 308));
    const y = Math.max(8, Math.min(r.top / zoom, vh - 290));
    setCalEvPop({todo: todos.find(x => x.id === t.id) || t, x, y});
    setCalQA(null); setCalDayPop(null);
  };

  // 클릭한 날짜 셀 위에 팝업 배치 (zoom 보정 포함)
  const openQA = (e: React.MouseEvent, ds: string, h: number) => {
    e.stopPropagation();
    justOpenedPopup.current = true; // window click 핸들러가 즉시 닫지 못하게 차단
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    // e.currentTarget보다 안정적인 e.target에서 셀 영역을 찾음
    const target = e.target as HTMLElement;
    const cell = target.closest("[data-calcell]") as HTMLElement | null;
    const r = cell ? cell.getBoundingClientRect() : (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popW = 300;
    const popH = 200;
    const vw = window.innerWidth / zoom;
    const vh = window.innerHeight / zoom;
    // X: 셀 왼쪽 정렬, 오른쪽 넘치면 왼쪽으로 밀어서 배치 (zoom 반영)
    let x = r.left / zoom;
    if (x + popW > vw - 8) x = r.right / zoom - popW;
    if (x < 8) x = 8;
    // Y: 셀 상단 + 26px(날짜 숫자 높이) 아래, 공간 부족하면 위로 (zoom 반영)
    let y = r.top / zoom + 26;
    if (y + popH > vh - 8) y = r.top / zoom - popH - 4;
    if (y < 8) y = 8;
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
      // 이미 진행 중인 타이머가 있으면 취소 (빠른 연속 클릭 방지)
      const existing = completeTimers.current.get(id);
      if (existing) clearTimeout(existing);
      setPendingComplete(s => new Set([...s, id]));
      // 타이머를 Map에 저장해 언마운트 시 cleanup 가능하게 함
      const timer = setTimeout(() => {
        updTodo(id, {st: "완료"});
        setPendingComplete(s => { const n = new Set(s); n.delete(id); return n; });
        completeTimers.current.delete(id);
        flash("완료 처리되었습니다");
      }, 600);
      completeTimers.current.set(id, timer);
    } else {
      // 완료 해제 시 진행 중인 애니메이션 타이머도 취소
      const existing = completeTimers.current.get(id);
      if (existing) { clearTimeout(existing); completeTimers.current.delete(id); }
      setPendingComplete(s => { const n = new Set(s); n.delete(id); return n; });
      // INIT_ST[0] = "대기" — 상태명이 바뀌어도 자동 반영됨
      updTodo(id, {st: INIT_ST[0]});
      flash("완료 해제되었습니다");
    }
  };

  // 컴포넌트 언마운트 시 모든 완료 애니메이션 타이머 정리
  useEffect(() => {
    return () => { completeTimers.current.forEach(t => clearTimeout(t)); };
  }, []);

  if (!currentUser) return (
    <PermissionProvider currentUser={null}>
      <LoginScreen members={members} memberPins={memberPins} onLogin={name => setCurrentUser(name)}/>
    </PermissionProvider>
  );

  const content = <div style={S.wrap}>
    {/* ── 헤더 ── 모바일: 햄버거 + 타이틀 + 사용자 아바타 / 데스크톱: 기존 그대로 */}
    <header style={{...S.hdr, height: isMobile ? 48 : 52}}>
      {isMobile ? (
        // 모바일 헤더 — 좌: 햄버거, 중: 타이틀, 우: 설정+아바타
        <>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* 햄버거 버튼 — 탭 시 SidebarDrawer 열기 */}
            <button style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.9)",padding:4,display:"flex",alignItems:"center",borderRadius:6}} onClick={()=>setDrawerOpen(true)} aria-label="메뉴 열기">
              <Bars3Icon style={{width:22,height:22}}/>
            </button>
            <div style={{fontSize:14,fontWeight:700,letterSpacing:"0.01em"}}>팀 TODO</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button style={S.hBtn} onClick={()=>setSettMod(true)}><Cog6ToothIcon style={ICON_SM}/></button>
            {deletedLog.length>0&&<button style={{...S.hBtn,position:"relative" as const}} onClick={()=>setShowTrash(true)} title="휴지통">
              <TrashIcon style={ICON_SM}/>
              <span style={{position:"absolute" as const,top:-4,right:-4,background:"#ef4444",color:"#fff",borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 5px",lineHeight:1.4}}>{deletedLog.length}</span>
            </button>}
            {/* 모바일 아바타 — 탭 시 로그아웃 */}
            <div onClick={()=>{if(window.confirm("정말 로그아웃하시겠습니까?"))setCurrentUser(null);}} style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.25)",border:"1.5px solid rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0,cursor:"pointer"}}>{currentUser?.[0]}</div>
          </div>
        </>
      ) : (
        // 데스크톱 헤더 — 기존 그대로
        <>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src={`${import.meta.env.BASE_URL}bgk_logo_white.png`} alt="Bridging Group" onClick={()=>window.location.reload()} style={{height:32,width:"auto",display:"block",flexShrink:0,cursor:"pointer"}}/>
            <div style={{width:1,height:20,background:"rgba(255,255,255,.3)"}}/>
            <div style={{fontSize:14,fontWeight:700,letterSpacing:"0.01em"}}>팀 TODO 통합관리</div>
            {/* 팀 전환 드롭다운 — 선택된 팀 기준으로 모든 뷰 필터링 */}
            {teams.length>0&&<>
              <div style={{width:1,height:20,background:"rgba(255,255,255,.15)"}}/>
              <select
                value={selectedTeamId||""}
                onChange={e=>setSelectedTeamId(e.target.value||null)}
                style={{
                  padding:"4px 24px 4px 10px",borderRadius:6,
                  border:"1px solid rgba(255,255,255,.25)",
                  background:"rgba(255,255,255,.1)",
                  color:"#fff",fontSize:12,fontWeight:600,
                  fontFamily:"inherit",cursor:"pointer",
                  appearance:"none" as const,
                  backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='white' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",backgroundSize:"8px",
                }}>
                {/* 전체 보기: 타 팀 조회 권한 있거나 복수 팀 소속일 때 */}
                {(canViewOtherTeams||isMultiTeam)&&<option value="" style={{color:"#334155"}}>{canViewOtherTeams?"전체 보기":"내 팀 전체"}</option>}
                {teams.filter(t=>
                  canViewOtherTeams || t.members.some(m=>m.name===currentUser)
                ).map(t=><option key={t.id} value={t.id} style={{color:"#334155"}}>{t.name}</option>)}
              </select>
            </>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {can("settings.edit")&&<button style={S.hBtn} onClick={()=>setSettMod(true)}><Cog6ToothIcon style={ICON_SM}/> 설정</button>}
            {deletedLog.length>0&&<button style={{...S.hBtn,position:"relative" as const}} onClick={()=>setShowTrash(true)} title="삭제된 업무 복원">
              <TrashIcon style={ICON_SM}/> 휴지통
              <span style={{position:"absolute" as const,top:-4,right:-4,background:"#ef4444",color:"#fff",borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 5px",lineHeight:1.4}}>{deletedLog.length}</span>
            </button>}
            <button style={S.hBtn} onClick={()=>setShowShortcuts(true)} title="단축키 도움말 (?)"><KeyboardIcon style={ICON_SM}/></button>
            <div style={{width:1,height:20,background:"rgba(255,255,255,.25)",margin:"0 4px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.25)",border:"1.5px solid rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>{currentUser?.[0]}</div>
              <span style={{fontSize:12,fontWeight:600,color:"#fff"}}>{currentUser}</span>
              <button style={{...S.hBtn,fontSize:10,padding:"3px 10px",background:"rgba(255,255,255,.12)"}} onClick={()=>{if(window.confirm("정말 로그아웃하시겠습니까?"))setCurrentUser(null);}}>로그아웃</button>
            </div>
          </div>
        </>
      )}
    </header>

    {/* ── 상단 탭 네비게이션 — 데스크톱 전용 (모바일은 하단 BottomTabBar 사용) */}
    {!isMobile && (
      <nav style={S.nav}>
        {([["dashboard",<ChartBarIcon style={ICON_SM}/>,"대시보드"],["list",<ListBulletIcon style={ICON_SM}/>,"리스트"],["calendar",<CalendarIcon style={ICON_SM}/>,"캘린더"],["kanban",<ViewColumnsIcon style={ICON_SM}/>,"칸반"]] as [string,React.ReactNode,string][]).map(([k,icon,l])=><button key={k} style={{...S.navB(view===k),transition:"color .15s, background .15s"}} onClick={()=>{setView(k);window.scrollTo(0,0);}}
          onMouseEnter={e=>{if(view!==k){e.currentTarget.style.color="#2563eb";e.currentTarget.style.background="#f8fafc";}}}
          onMouseLeave={e=>{if(view!==k){e.currentTarget.style.color="#64748b";e.currentTarget.style.background="none";}}}>{icon}{l}{k==="kanban"&&(kbF.length>0||kbFWho.length>0)&&<span style={{fontSize:10,background:"#ef4444",color:"#fff",borderRadius:99,padding:"0 5px",fontWeight:700}}>{kbF.length+kbFWho.length}</span>}</button>)}
      </nav>
    )}

    {/* ── 모바일 사이드바 Drawer ─────────────────────────────────── */}
    {isMobile && (
      <SidebarDrawer
        open={drawerOpen}
        onClose={()=>setDrawerOpen(false)}
        search={search} setSearch={setSearch}
        filters={filters} togF={togF}
        todos={todos} aProj={teamProj} members={teamMembers} pris={pris} priC={priC}
        stats={stats} stC={stC}
        favSidebar={favSidebar} togFavSidebar={togFavSidebar}
        isFav={isFav} gPr={gPr}
        setChipAdd={setChipAdd} setChipVal={setChipVal} setChipColor={setChipColor}
        projects={projects}
        hiddenProjects={hiddenProjects} toggleHideProject={toggleHideProject}
        hiddenMembers={hiddenMembers} toggleHideMember={toggleHideMember}
      />
    )}

    {/* ── 메인 콘텐츠 — 모바일: 하단 탭 바(56px) + safe-area 높이만큼 패딩 추가 */}
    <main style={isMobile ? {...S.main, paddingBottom:"calc(56px + env(safe-area-inset-bottom) + 16px)"} : S.main}>
      {view==="dashboard"&&<Dashboard todos={todos} projects={teamProj} members={teamMembers} priC={priC} priBg={priBg} stC={stC} stBg={stBg} gPr={gPr} deletedLog={deletedLog}
        // KPI 카드 클릭 시 리스트 뷰로 이동하고 해당 상태 필터를 자동 적용
        onNavigate={(stF)=>{setView("list");setFilters({proj:[],who:[],pri:[],st:stF,repeat:[],fav:""});window.scrollTo(0,0);}}
        isMobile={isMobile}/>}

      {view==="kanban"&&<KanbanView
        todos={todos} stats={stats} pris={pris} priC={priC} priBg={priBg} stC={stC} stBg={stBg}
        kbF={kbF} setKbF={setKbF} kbFWho={kbFWho} setKbFWho={setKbFWho}
        members={teamMembers} visibleProj={visibleProj}
        kanbanOrder={kanbanOrder} setKanbanOrder={setKanbanOrder}
        kbInsert={kbInsert} setKbInsert={setKbInsert}
        dragId={dragId} setDragId={setDragId}
        dragOver={dragOver} setDragOver={setDragOver}
        gPr={gPr} updTodo={updTodo} setEditMod={setEditMod} setDetMod={setDetMod} flash={flash}
        isMobile={isMobile}
      />}

      {view==="list"&&<ListView
        search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} togF={togF}
        todos={todos} aProj={teamProj} members={teamMembers} pris={pris} priC={priC} priBg={priBg}
        stats={stats} stC={stC} stBg={stBg} favSidebar={favSidebar} togFavSidebar={togFavSidebar}
        isFav={isFav} gPr={gPr} setChipAdd={setChipAdd} setChipVal={setChipVal}
        setChipColor={setChipColor} projects={projects}
        hiddenProjects={hiddenProjects} toggleHideProject={toggleHideProject}
        hiddenMembers={hiddenMembers} toggleHideMember={toggleHideMember}
        memberColors={memberColors}
        visibleProj={visibleProj} visibleMembers={visibleMembers}
        addTab={addTab} setAddTab={setAddTab} newRows={newRows} setNewRows={setNewRows}
        addNR={addNR} saveNRs={saveNRs} saveOneNR={saveOneNR} isNREmpty={isNREmpty}
        setNotePopup={setNotePopup} setNrDatePop={setNrDatePop}
        aiText={aiText} setAiText={setAiText} aiFiles={aiFiles} setAiFiles={setAiFiles}
        aiLoad={aiLoad} aiSt={aiSt} setAiSt={setAiSt} aiParsed={aiParsed}
        setAiParsed={setAiParsed} parseAI={parseAI} confirmAI={confirmAI} aiHistory={aiHistory} restoreAiHistory={restoreAiHistory}
        sorted={sorted} currentUser={currentUser}
        todoView={todoView} setTodoView={setTodoView}
        memoCols={memoCols} setMemoCols={setMemoCols}
        showDone={showDone} setShowDone={setShowDone}
        expandMode={expandMode} setExpandMode={setExpandMode}
        sortCol={sortCol} sortDir={sortDir} setSortCol={setSortCol} setSortDir={setSortDir} sortIcon={sortIcon} toggleSort={toggleSort}
        customSortOrders={customSortOrders} setCustomSortOrders={setCustomSortOrders}
        activeSortFields={activeSortFields} setActiveSortFields={setActiveSortFields}
        selectedIds={selectedIds} allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        handleCheck={handleCheck} toggleSelectAll={toggleSelectAll} selAll={selAll}
        toggleFav={toggleFav} addTodo={addTodo} updTodo={updTodo} flash={flash} delTodo={delTodo} reorderTodo={reorderTodo}
        setEditMod={setEditMod}
        editCell={editCell} setEditCell={setEditCell}
        datePop={datePop} setDatePop={setDatePop}
        hoverRow={hoverRow} setHoverRow={setHoverRow}
        hoverRowRect={hoverRowRect} setHoverRowRect={setHoverRowRect}
        hoverLeaveTimer={hoverLeaveTimer}
        addSecRef={addSecRef} tblDivRef={tblDivRef}
        savedFilters={savedFilters} saveCurrentFilter={saveCurrentFilter} deleteSavedFilter={deleteSavedFilter}
        isMobile={isMobile}
        onFilterOpen={() => setFilterBSOpen(true)}
      />}

      {view==="calendar"&&<CalendarView
        calView={calView} setCalView={setCalView}
        calY={calY} calM={calM} calD={calD}
        calNav={calNav} calTitle={calTitle} calDays={calDays}
        todayStr={todayStr} customDays={customDays} setCustomDays={setCustomDays}
        weekDates={weekDates} customDates={customDates} agendaItems={agendaItems}
        ftodosExpanded={ftodosExpanded} evStyle={evStyle}
        calF={calF} setCalF={setCalF} calFWho={calFWho} setCalFWho={setCalFWho}
        visibleProj={visibleProj} members={teamMembers} visibleMembers={visibleMembers}
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
        sidebarExpandId={sidebarExpandId}
        sidebarDetId={sidebarDetId} setSidebarDetId={setSidebarDetId}
        sidebarExpand={sidebarExpand}
        sidebarDoneOpen={sidebarDoneOpen} setSidebarDoneOpen={setSidebarDoneOpen}
        secNodateOpen={secNodateOpen} setSecNodateOpen={setSecNodateOpen}
        secTodayOpen={secTodayOpen} setSecTodayOpen={setSecTodayOpen}
        secWeekOpen={secWeekOpen} setSecWeekOpen={setSecWeekOpen}
        secLaterOpen={secLaterOpen} setSecLaterOpen={setSecLaterOpen}
        starredIds={starredIds} toggleStar={toggleStar}
        pendingComplete={pendingComplete} handleSideComplete={handleSideComplete}
        detDivRefs={detDivRefs} taskDivRefs={taskDivRefs}
        isMobile={isMobile}
      />}
    </main>

    <DateTimePicker datePop={datePop} onSave={(id,val)=>{
      // AI 일괄배정 마감기한 — id -9999
      if(id===-9999){setAiParsed((p:any[])=>p.map((t:any)=>t._chk?{...t,due:val}:t));setDatePop(null);return;}
      // AI 결과 개별 행 날짜 선택 — id가 -1000 이하이면 aiParsed 업데이트
      if(id<=-1000){const idx=-(id+1000);setAiParsed((p:any[])=>{const n=[...p];if(n[idx])n[idx]={...n[idx],due:val};return n;});setDatePop(null);return;}
      updTodo(id,{due:val});setDatePop(null);setEditCell(null);
    }} onClose={()=>{setDatePop(null);setEditCell(null);}}/>
    <DateTimePicker datePop={nrDatePop} onSave={(id,val)=>{const n=[...newRows];n[id].due=val;setNewRows(n);setNrDatePop(null);}} onClose={()=>setNrDatePop(null)}/>

    {selectedIds.size>0&&(()=>{
      const closeAll=()=>{setMovePop(false);setBulkPop(null);};
      const ps:React.CSSProperties={position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#fff",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.18)",border:"1px solid #e2e8f0",minWidth:160,overflow:"hidden",zIndex:10};
      const ph=(t:string)=><div style={{padding:"8px 12px 6px",fontSize:11,fontWeight:700,color:"#94a3b8",borderBottom:"1px solid #f1f5f9"}}>{t}</div>;
      const pi=(label:string,fn:()=>void,pre?:React.ReactNode)=>
        <button key={label} onClick={fn} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#334155",textAlign:"left" as const}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#f8fafc";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="none";}}>{pre}{label}</button>;
      const pb=(key:string,icon:React.ReactNode,label:string,content:React.ReactNode)=>{
        const active=key==="proj"?movePop:bulkPop===key;
        return <div key={key} style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>{if(key==="proj"){setBulkPop(null);setMovePop(p=>!p);}else{setMovePop(false);setBulkPop(bulkPop===key?null:key);}}}
            style={{display:"flex",alignItems:"center",gap:4,background:active?"#334155":"transparent",border:"none",borderRadius:8,padding:"5px 9px",cursor:"pointer",color:"#cbd5e1",fontSize:12,fontWeight:600,whiteSpace:"nowrap" as const,flexShrink:0}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#334155";}}
            onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            {icon}{label}
          </button>
          {active&&content}
        </div>;
      };
      return <div onClick={closeAll} style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",zIndex:2000,display:"flex",alignItems:"center",gap:1,background:"#1e293b",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.35)",padding:"5px 8px 5px 12px",animation:"slideUp .2s ease",whiteSpace:"nowrap" as const,flexWrap:"nowrap" as const}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"#2563eb",color:"#fff",fontSize:11,fontWeight:800,marginRight:6,flexShrink:0}}>{selectedIds.size}</div>
        {([
          {label:"복제",icon:<ClipboardDocumentIcon style={ICON_SM}/>,fn:()=>{const base=Math.max(...todos.map((t:any)=>t.id),0);let i=1;const copies=todos.filter((t:any)=>selectedIds.has(t.id)).map((t:any)=>({...t,id:base+i++,task:t.task+" (복사)",cre:todayStr,done:null}));setTodos((p:any)=>[...p,...copies]);setNId((n:number)=>n+copies.length);clrSel();flash(`${copies.length}건이 복제되었습니다`);}},
          {label:"완료",icon:<CheckIcon style={ICON_SM}/>,fn:()=>{selectedIds.forEach(id=>updTodo(id,{st:"완료",done:todayStr}));flash(`${selectedIds.size}건이 완료 처리되었습니다`);clrSel();}},
          {label:"즐겨찾기",icon:<StarOutlineIcon style={ICON_SM}/>,fn:()=>{selectedIds.forEach(id=>toggleFav(id));flash(`${selectedIds.size}건의 즐겨찾기가 변경되었습니다`);clrSel();}},
          {label:"삭제",icon:<TrashIcon style={ICON_SM}/>,fn:()=>{if(!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`))return;setTodos((p:any)=>p.filter((t:any)=>!selectedIds.has(t.id)));flash(`${selectedIds.size}건이 삭제되었습니다`,"err");clrSel();},danger:true},
        ] as {label:string,icon:React.ReactNode,fn:()=>void,danger?:boolean}[]).map(({label,icon,fn,danger})=>
          <button key={label} title={label} onClick={e=>{e.stopPropagation();fn();}} style={{display:"flex",alignItems:"center",justifyContent:"center",background:danger?"#dc2626":"transparent",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",color:danger?"#fff":"#cbd5e1",fontSize:15,transition:"background .12s",flexShrink:0}}
            onMouseEnter={e=>{if(!danger)(e.currentTarget as HTMLButtonElement).style.background="#334155";}}
            onMouseLeave={e=>{if(!danger)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            {icon}
          </button>
        )}
        <div style={{width:1,height:18,background:"#334155",margin:"0 4px",flexShrink:0}}/>
        {pb("proj",<FolderIcon style={ICON_SM}/>,"프로젝트",<div style={ps}>{ph("이동할 프로젝트 선택")}{visibleProj.map(p=>pi(p.name,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,pid:p.id}:t));flash(`${selectedIds.size}건이 "${p.name}"으로 이동`);closeAll();clrSel();},<span style={{width:10,height:10,borderRadius:"50%",background:p.color,flexShrink:0,display:"inline-block"}}/>))}</div>)}
        {pb("who",<UserIcon style={ICON_SM}/>,"담당자",<div style={ps}>{ph("담당자 선택")}{visibleMembers.map(m=>pi(m,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,who:m}:t));flash(`${selectedIds.size}건 담당자 → "${m}"`);closeAll();clrSel();}))}</div>)}
        {pb("pri",<BoltIcon style={ICON_SM}/>,"우선순위",<div style={ps}>{ph("우선순위 선택")}{pris.map(v=>pi(v,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,pri:v}:t));flash(`${selectedIds.size}건 우선순위 → "${v}"`);closeAll();clrSel();}))}</div>)}
        {pb("st",<CheckCircleIcon style={ICON_SM}/>,"상태",<div style={ps}>{ph("상태 선택")}{stats.map(v=>pi(v,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,st:v,done:v==="완료"?todayStr:null}:t));flash(`${selectedIds.size}건 상태 → "${v}"`);closeAll();clrSel();}))}</div>)}
        {pb("due",<CalendarIcon style={ICON_SM}/>,"마감기한",<div style={{...ps,minWidth:200,padding:"10px 12px",overflow:"visible"}} onClick={e=>e.stopPropagation()}>
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
        {pb("repeat",<ArrowPathIcon style={ICON_SM}/>,"반복",<div style={ps}>{ph("반복 설정")}{REPEAT_OPTS.map(v=>pi(v==="없음"?"반복 없음":v,()=>{setTodos((prev:any)=>prev.map((t:any)=>selectedIds.has(t.id)?{...t,repeat:v}:t));flash(`${selectedIds.size}건 반복 변경`);closeAll();clrSel();}))}</div>)}
        <div style={{width:1,height:20,background:"#334155",margin:"0 4px"}}/>
        <button onClick={e=>{e.stopPropagation();clrSel();closeAll();}} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:16,padding:"4px 6px",borderRadius:6,lineHeight:1}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#334155";(e.currentTarget as HTMLButtonElement).style.color="#fff";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="none";(e.currentTarget as HTMLButtonElement).style.color="#64748b";}}><XMarkIcon style={{width:16,height:16}}/></button>
      </div>;
    })()}

    {/* 편집 모달 — 모바일에서는 BottomSheet, 데스크톱에서는 Modal로 렌더링 */}
    {isMobile ? (
      <BottomSheet open={!!editMod} onClose={()=>setEditMod(null)} title={editMod?.id?"업무 수정":"새 업무"} fullHeight>
        {editMod&&<>
          <EditForm f={editMod} onChange={setEditMod} proj={visibleProj} members={visibleMembers} pris={pris} stats={stats}
            currentUser={currentUser} gPr={gPr}
            onAddComment={(text)=>{const entry:ActivityLog={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:new Date().toISOString(),who:currentUser||"시스템",action:"comment",comment:text};const next=[...(editMod.logs||[]),entry];updTodo(parseInt(editMod.id),{logs:next});setEditMod((f:any)=>({...f,logs:next}));}}
          />
          <div style={{display:"flex",gap:8,marginTop:16,paddingTop:12,borderTop:"1px solid #e2e8f0"}}>
            {/* 삭제: admin이거나 본인 업무+delete.own 권한 */}
            {editMod?.id&&(can("todo.delete.all")||(isOwner(editMod.who)&&can("todo.delete.own")))&&<button style={{...S.bd,marginRight:"auto"}} onClick={()=>{if(confirm(`"${editMod.task}" 업무를 삭제하시겠습니까?`)){const id=parseInt(editMod.id);setEditMod(null);delTodo(id)}}}><TrashIcon style={ICON_SM}/> 삭제</button>}
            <button style={S.bs} onClick={()=>setEditMod(null)}>취소</button>
            {/* 저장: 새 업무는 create 권한, 수정은 edit.all 또는 본인+edit.own */}
            {(editMod?.id?(can("todo.edit.all")||(isOwner(editMod.who)&&can("todo.edit.own"))):can("todo.create"))
              ?<button style={S.bp} onClick={()=>saveMod(editMod)}>저장</button>
              :<button style={{...S.bp,opacity:.4,cursor:"default"}} disabled title="수정 권한이 없습니다">저장</button>}
          </div>
        </>}
      </BottomSheet>
    ) : (
      <Modal open={!!editMod} onClose={()=>setEditMod(null)} title={editMod?.id?"업무 수정":"새 업무"} footer={<>
        {editMod?.id&&(can("todo.delete.all")||(isOwner(editMod.who)&&can("todo.delete.own")))&&<button style={{...S.bd,marginRight:"auto"}} onClick={()=>{if(confirm(`"${editMod.task}" 업무를 삭제하시겠습니까?`)){const id=parseInt(editMod.id);setEditMod(null);delTodo(id)}}}><TrashIcon style={ICON_SM}/> 삭제</button>}
        <button style={S.bs} onClick={()=>setEditMod(null)}>취소</button>
        {(editMod?.id?(can("todo.edit.all")||(isOwner(editMod?.who)&&can("todo.edit.own"))):can("todo.create"))?<button style={S.bp} onClick={()=>saveMod(editMod)}>저장</button>:<button style={{...S.bp,opacity:.4,cursor:"default"}} disabled title="수정 권한이 없습니다">저장</button>}
      </>}>
        {editMod&&<EditForm f={editMod} onChange={setEditMod} proj={visibleProj} members={visibleMembers} pris={pris} stats={stats}
          currentUser={currentUser} gPr={gPr}
          onAddComment={(text)=>{
            // 메모 저장 — 로그 배열에 추가 후 Firebase 동기화
            const entry:ActivityLog={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:new Date().toISOString(),who:currentUser||"시스템",action:"comment",comment:text};
            const next=[...(editMod.logs||[]),entry];
            updTodo(parseInt(editMod.id),{logs:next});
            setEditMod((f:any)=>({...f,logs:next}));
          }}
        />}
      </Modal>
    )}

    <Modal open={!!detMod} onClose={()=>setDetMod(null)} title={detMod?.task||""} footer={<><button style={{...S.bd,marginRight:"auto"}} onClick={()=>{if(confirm(`"${detMod.task}" 업무를 삭제하시겠습니까?`)){delTodo(detMod.id);setDetMod(null)}}}><TrashIcon style={ICON_SM}/></button><button style={S.bs} onClick={()=>setDetMod(null)}>닫기</button><button style={S.bp} onClick={()=>{setEditMod(detMod);setDetMod(null)}}><PencilSquareIcon style={ICON_SM}/> 수정</button></>}>
      {detMod&&<DetailView t={detMod} p={gPr(detMod.pid)} stats={stats} stC={stC} stBg={stBg} priC={priC} priBg={priBg} onSt={st=>{updTodo(detMod.id,{st});setDetMod({...detMod,st});flash(`상태가 "${st}"(으)로 변경되었습니다`)}}/>}
    </Modal>

    <Modal open={settMod} onClose={()=>setSettMod(false)} title="설정" wide footer={<button style={S.bs} onClick={()=>setSettMod(false)}>닫기</button>}>
      <SettingsMgr
        members={members} setMembers={setMembers}
        pris={pris} setPris={setPris} stats={stats} setStats={setStats}
        priC={priC} setPriC={setPriC} priBg={priBg} setPriBg={setPriBg}
        stC={stC} setStC={setStC} stBg={stBg} setStBg={setStBg}
        memberColors={memberColors} setMemberColor={(name,c)=>setMemberColors((p:any)=>({...p,[name]:c}))}
        projects={projects} setProjects={setProjects} pNId={pNId} setPNId={setPNId}
        onAddProj={p=>{const np={...p,id:pNId};setProjects((prev:any)=>[...prev,np]);setPNId(pNId+1);flash(`"${p.name}" 프로젝트가 추가되었습니다`)}}
        onDelProj={id=>{if(todos.some(t=>t.pid===id)){alert("해당 프로젝트에 업무가 존재하여 삭제할 수 없습니다.");return;}setProjects((p:any)=>p.filter((x:any)=>x.id!==id));flash("프로젝트가 삭제되었습니다","err")}}
        onEditProj={(id,u)=>{setProjects((p:any)=>p.map((x:any)=>{if(x.id!==id)return x;return{...x,...u};}));flash("프로젝트 정보가 수정되었습니다")}}
        todos={todos} flash={flash} apiKey={apiKey} setApiKey={setApiKey}
        teams={teams} setTeams={setTeams} memberRoles={memberRoles} setMemberRole={setMemberRole} memberPins={memberPins} setMemberPins={setMemberPins} generatePin={generatePin}
        globalPermissions={globalPermissions} setGlobalPermissions={setGlobalPermissions} addTeam={addTeam} updTeam={updTeam} delTeam={delTeam}
        addTeamMember={addTeamMember} removeTeamMember={removeTeamMember} setTeamMemberRole={setTeamMemberRole}
        addTeamProject={addTeamProject} removeTeamProject={removeTeamProject} assignTodosToTeams={assignTodosToTeams}
      />
    </Modal>

    {/* ── 단축키 도움말 모달 ─────────────────────────────────── */}
    <Modal open={showShortcuts} onClose={()=>setShowShortcuts(false)} title="단축키 안내" footer={<button style={S.bs} onClick={()=>setShowShortcuts(false)}>닫기</button>}>
      <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:13}}>
        <tbody>
          {([
            ["Ctrl+Z","이전 상태로 되돌리기"],
            ["Ctrl+Y","작업 다시 실행"],
            ["Delete","선택한 업무 삭제 (목록 뷰)"],
            ["?","단축키 도움말 열기/닫기"],
            ["─── 캘린더 뷰 ──────────────────",""],
            ["T","오늘로 이동"],
            ["← / →","이전/다음 달 이동"],
            ["D","일간 뷰"],
            ["W","주간 뷰"],
            ["M","월간 뷰"],
            ["A","전체 일정 뷰"],
            ["─── 메모 뷰 ─────────────────────",""],
            ["1 ~ 5","메모 열 수 변경"],
            ["─── 텍스트 편집 ─────────────────",""],
            ["Ctrl+B","굵게"],
            ["Ctrl+I","기울임"],
            ["Ctrl+U","밑줄"],
            ["Ctrl+S","취소선"],
          ] as [string,string][]).map(([key,desc],i)=>(
            <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
              <td style={{padding:"9px 12px",fontWeight:700,fontFamily:"monospace",background:"#f8fafc",color:"#334155",width:220,whiteSpace:"nowrap" as const,fontSize:12}}>
                {key.startsWith("─")?<span style={{color:"#94a3b8",fontFamily:"inherit",fontWeight:600,fontSize:11}}>{key}</span>:key}
              </td>
              <td style={{padding:"9px 12px",color:"#64748b"}}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>

    {/* ── 휴지통 모달 (삭제된 업무 복원) ───────────────────────── */}
    <Modal open={showTrash} onClose={()=>setShowTrash(false)} title="휴지통" footer={<button style={S.bs} onClick={()=>setShowTrash(false)}>닫기</button>}>
      {deletedLog.length===0
        ? <div style={{textAlign:"center" as const,padding:"28px 0",color:"#94a3b8",fontSize:13}}>삭제된 업무가 없습니다</div>
        : <div style={{maxHeight:440,overflowY:"auto" as const}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>최근 삭제된 업무 {deletedLog.length}건 · 복원하면 대기 상태로 목록에 추가됩니다</div>
            {[...deletedLog].reverse().map((entry,i)=>(
              <div key={`${entry.id}-${entry.deletedAt}-${i}`} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{entry.task}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>{entry.who} · {entry.deletedAt} 삭제</div>
                </div>
                <button onClick={()=>restoreTodo(entry)}
                  style={{padding:"5px 14px",borderRadius:6,border:"1px solid #2563eb",background:"#eff6ff",color:"#2563eb",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>
                  복원
                </button>
              </div>
            ))}
          </div>
      }
    </Modal>

    {chipAdd&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setChipAdd(null)}}>
      <div style={{background:"#fff",borderRadius:12,padding:20,width:320,boxShadow:"0 10px 25px rgba(0,0,0,.15)"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{({proj:"프로젝트",who:"담당자",pri:"우선순위",st:"상태"} as any)[chipAdd]} 추가</div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
          {chipAdd!=="who"&&<input type="color" value={chipColor} onChange={e=>setChipColor(e.target.value)} style={{width:36,height:34,padding:1,borderRadius:6,cursor:"pointer",border:"1px solid #e2e8f0"}}/>}
          <input autoFocus value={chipVal} onChange={e=>setChipVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addChip()}} placeholder="이름 입력" style={{flex:1,padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><button style={S.bs} onClick={()=>setChipAdd(null)}>취소</button><button style={S.bp} onClick={addChip}>추가</button></div>
      </div>
    </div>}


    {/* ── 모바일 FAB — 리스트 뷰에서만 표시, 탭 시 업무 추가 바텀 시트 열기 */}
    {isMobile && view === "list" && (
      <FAB onClick={() => setAddTodoBSOpen(true)} />
    )}

    {/* ── 모바일 업무 추가 바텀 시트 — FAB 탭 시 열림 */}
    {isMobile && (
      <AddTodoBottomSheet
        open={addTodoBSOpen}
        onClose={() => setAddTodoBSOpen(false)}
        members={visibleMembers}
        pris={pris}
        stats={stats}
        visibleProj={visibleProj}
        currentUser={currentUser}
        onSave={(todo) => {
          // addTodo 내부에서 자동으로 ID 생성 — id 직접 지정 불필요
          addTodo({ ...todo, favs: [], pct: 0 });
          flash("업무가 추가되었습니다");
        }}
      />
    )}

    {/* ── 모바일 필터 바텀 시트 — 필터 버튼 탭 시 열림 */}
    {isMobile && (
      <FilterBottomSheet
        open={filterBSOpen}
        onClose={() => setFilterBSOpen(false)}
        filters={filters}
        togF={togF}
        aProj={visibleProj}
        members={visibleMembers}
        pris={pris}
        priC={priC}
        stats={stats}
        stC={stC}
      />
    )}

    {/* ── 모바일 하단 탭 바 — 데스크톱에서는 렌더링하지 않음 */}
    {isMobile && (
      <BottomTabBar
        view={view}
        onViewChange={v => setView(v)}
        kanbanFilterCount={kbF.length + kbFWho.length}
      />
    )}

    <Toast msg={toast.m} type={toast.t} action={toast.action}/>
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
    <PermissionProvider currentUser={currentUser} teams={teams} memberRoles={memberRoles} globalPermissions={globalPermissions}>
      {content}
    </PermissionProvider>
  );
}
