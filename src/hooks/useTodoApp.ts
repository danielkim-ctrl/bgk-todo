import { useState, useRef, useEffect, useMemo } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  INIT_MEMBERS, INIT_PRI, INIT_ST, INIT_PRI_C, INIT_PRI_BG, INIT_ST_C, INIT_ST_BG,
  initTodos, initProj
} from "../constants";
import { td, gP, stripHtml, isOD } from "../utils";
import { Filters, NewRow, AiParsed, DatePopState, NotePopupState, Project, Todo, DeletedTodo, SavedFilter, ActivityLog, Team, TeamMember, TeamRole } from "../types";
import { useAI } from "./useAI";
import { useCalendar } from "./useCalendar";
import { useUserSettings } from "./useUserSettings";

export function useTodoApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const historyRef = useRef<any[]>([]);
  const redoRef = useRef<any[]>([]);
  const clientId = useRef(Math.random().toString(36).slice(2));
  const pendingWrite = useRef(false);
  const writeVersion = useRef(0);
  const fromSnapshot = useRef(false);
  const FS_DOC = useMemo(() => doc(db, "todos_db", "team"), []);
  const detHoverTimerRef = useRef<any>(null);
  const noteLeaveTimerRef = useRef<any>(null);
  const savingNRs = useRef(false);
  const lastKnownUpdatedAt = useRef(0);
  const fsBootstrapped = useRef(false);

  // ── 사용자 설정 (useUserSettings로 분리) ────────────────────────────────────
  const userSets = useUserSettings();
  const {
    currentUser, setCurrentUser,
    filters, setFilters,
    sortCol, setSortCol, sortDir, setSortDir,
    expandMode, setExpandMode,
    todoView, setTodoView, memoCols, setMemoCols, showDone, setShowDone,
    favSidebar, togFavSidebar,
    userFavs, isFav, toggleFav,
    customSortOrders, setCustomSortOrders,
    activeSortFields, setActiveSortFields,
    userSettings, setUserSettings,
    savedFilters, setSavedFilters, saveCurrentFilter, deleteSavedFilter,
  } = userSets;

  const guard = () => { pendingWrite.current = true; };

  // ── 전체 앱 상태 스냅샷 기반 Undo/Redo ────────────────────────────────────
  // 업무뿐 아니라 프로젝트, 멤버, 우선순위, 상태 등 모든 변경을 되돌릴 수 있도록
  // 변경 전 전체 상태를 스냅샷으로 저장한다.
  type AppSnapshot = {
    todos: Todo[];
    projects: Project[];
    members: string[];
    pris: string[];
    stats: string[];
    priC: Record<string,string>;
    priBg: Record<string,string>;
    stC: Record<string,string>;
    stBg: Record<string,string>;
    memberColors: Record<string,string>;
    filters: Filters;
    savedFilters: SavedFilter[];
  };

  // 현재 앱 상태의 스냅샷을 생성하는 함수
  const takeSnapshot = (): AppSnapshot => ({
    todos: todos,
    projects: projects,
    members: members,
    pris: pris,
    stats: stats,
    priC: { ...priC },
    priBg: { ...priBg },
    stC: { ...stC },
    stBg: { ...stBg },
    memberColors: { ...memberColors },
    filters: { ...filters },
    savedFilters: [...savedFilters],
  });

  // 스냅샷을 앱 상태에 복원하는 함수
  const restoreSnapshot = (snap: AppSnapshot) => {
    setTodos(snap.todos);
    setProjects(snap.projects);
    setMembers(snap.members);
    setPris(snap.pris);
    setStats(snap.stats);
    setPriC(snap.priC);
    setPriBg(snap.priBg);
    setStC(snap.stC);
    setStBg(snap.stBg);
    setMemberColors(snap.memberColors || {});
    if (snap.filters) setFilters(snap.filters);
    // 저장된 필터도 복원 — localStorage도 함께 동기화
    if (snap.savedFilters !== undefined) {
      setSavedFilters(snap.savedFilters);
      const u = localStorage.getItem("todo-current-user");
      if (u) localStorage.setItem(`todo-saved-filters-${u}`, JSON.stringify(snap.savedFilters));
    }
  };

  // 변경 전 스냅샷을 히스토리에 저장하고 redo 스택을 비우는 함수
  // 같은 렌더 사이클 내에서 여러 setter가 연달아 호출되어도 스냅샷은 1번만 저장
  const historyPushedThisFrame = useRef(false);
  const pushHistory = () => {
    if (historyPushedThisFrame.current) return;
    historyPushedThisFrame.current = true;
    historyRef.current = [...historyRef.current.slice(-49), takeSnapshot()];
    redoRef.current = [];
    // 다음 마이크로태스크에서 플래그 리셋 — 같은 이벤트 핸들러 내 연속 호출은 1번으로 병합
    Promise.resolve().then(() => { historyPushedThisFrame.current = false; });
  };

  const setTodosWithHistory = (fn: any) => {
    guard();
    pushHistory();
    setTodos(prev => typeof fn === "function" ? fn(prev) : fn);
  };

  // 모든 상태 변경 함수에 히스토리 저장을 적용
  const setProjectsGuarded = (fn: any) => { guard(); pushHistory(); setProjects(fn); };
  const setMembersGuarded = (fn: any) => { guard(); pushHistory(); setMembers(fn); };
  const setPrisGuarded = (fn: any) => { guard(); pushHistory(); setPris(fn); };
  const setStatsGuarded = (fn: any) => { guard(); pushHistory(); setStats(fn); };
  const setPriCGuarded = (fn: any) => { guard(); pushHistory(); setPriC(fn); };
  const setPriBgGuarded = (fn: any) => { guard(); pushHistory(); setPriBg(fn); };
  const setStCGuarded = (fn: any) => { guard(); pushHistory(); setStC(fn); };
  const setStBgGuarded = (fn: any) => { guard(); pushHistory(); setStBg(fn); };
  const setMemberColorsGuarded = (fn: any) => { guard(); pushHistory(); setMemberColors(fn); };

  const undo = () => {
    if (!historyRef.current.length) return;
    const snap = historyRef.current.pop()!;
    // 현재 상태를 redo 스택에 저장
    redoRef.current = [...redoRef.current.slice(-49), takeSnapshot()];
    guard();
    restoreSnapshot(snap);
    flash("이전 상태로 복원되었습니다");
  };

  const redo = () => {
    if (!redoRef.current.length) return;
    const snap = redoRef.current.pop()!;
    // 현재 상태를 history 스택에 저장
    historyRef.current = [...historyRef.current.slice(-49), takeSnapshot()];
    guard();
    restoreSnapshot(snap);
    flash("작업이 다시 실행되었습니다");
  };

  const [nId, setNId] = useState(21);
  const nIdRef = useRef(21);
  const [pNId, setPNId] = useState(5);
  const [loaded, setLoaded] = useState(false);
  const [members, setMembers] = useState(INIT_MEMBERS);
  const [pris, setPris] = useState(INIT_PRI);
  const [stats, setStats] = useState(INIT_ST);
  const [priC, setPriC] = useState({ ...INIT_PRI_C });
  const [priBg, setPriBg] = useState({ ...INIT_PRI_BG });
  const [stC, setStC] = useState({ ...INIT_ST_C });
  const [stBg, setStBg] = useState({ ...INIT_ST_BG });
  // 담당자별 커스텀 아바타 색상 — 설정에서 변경 가능, Firebase에 저장됨
  const [memberColors, setMemberColors] = useState<Record<string,string>>({});
  // 팀 목록 — 조직도 단위, Firebase에 저장
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamNId, setTeamNId] = useState(1); // 팀 ID 자동 증가용

  const [view, setView] = useState("list");
  const [toast, setToast] = useState<{ m: string; t: string; action?: { label: string; fn: () => void } }>({ m: "", t: "" });
  const [search, setSearch] = useState("");
  const [editCell, setEditCell] = useState<{ id: number, field: string } | null>(null);
  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const [kbF, setKbF] = useState<string[]>([]);
  const [kbFWho, setKbFWho] = useState<string[]>([]);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  // 캘린더/AI/사용자설정 관련 상태·로직은 각 훅으로 분리됨
  const [editMod, setEditMod] = useState<any>(null);
  const [detMod, setDetMod] = useState<any>(null);
  const [projMod, setProjMod] = useState(false);
  const [settMod, setSettMod] = useState(false);
  const [chipAdd, setChipAdd] = useState<string | null>(null);
  const [chipVal, setChipVal] = useState("");
  const [chipColor, setChipColor] = useState("#8b5cf6");
  const [detPopup, setDetPopup] = useState<any>(null);
  const [notePopup, setNotePopup] = useState<NotePopupState | null>(null);
  const [datePop, setDatePop] = useState<DatePopState | null>(null);
  const [nrDatePop, setNrDatePop] = useState<DatePopState | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const lastSelRef = useRef<number | null>(null);
  const lastSelActionRef = useRef<"add"|"remove">("add");
  const addSecRef = useRef<HTMLDivElement>(null);
  const tblDivRef = useRef<HTMLDivElement>(null);
  const selAll = (ids: number[]) => setSelectedIds(new Set(ids));
  const clrSel = () => setSelectedIds(new Set());
  const [movePop, setMovePop] = useState(false);
  const [bulkPop, setBulkPop] = useState<string|null>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const st = document.createElement("style");
    st.textContent = `
      @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      ::-webkit-scrollbar{width:5px;height:5px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
      ::-webkit-scrollbar-thumb:hover{background:#94a3b8}
    `;
    document.head.appendChild(st);
    return () => { document.head.removeChild(st); };
  }, []);

  const VALID_ST = ["대기", "진행중", "검토", "완료"];
  const normalizeTodos = (todos: any[]) => {
    const seen = new Set<number>();
    let maxId = 0;
    return todos.map(t => {
      const base = VALID_ST.includes(t.st) ? t : { ...t, st: "대기" };
      if (base.id > maxId) maxId = base.id;
      if (seen.has(base.id)) {
        const newId = ++maxId;
        seen.add(newId);
        return { ...base, id: newId };
      }
      seen.add(base.id);
      return base;
    });
  };

  // merge=true: 동시 편집 충돌 방지 — remote 기준에 local-only 항목을 보존
  const applyData = (d: any, merge = false) => {
    if (d.todos?.length) {
      const fixed = normalizeTodos(d.todos);
      if (merge) {
        setTodos(prev => {
          const remoteIds = new Set(fixed.map((t: any) => t.id));
          const localOnly = prev.filter(t => !remoteIds.has(t.id));
          return normalizeTodos([...fixed, ...localOnly]);
        });
      } else {
        setTodos(fixed);
      }
      const maxId = fixed.reduce((m: number, t: any) => t.id > m ? t.id : m, 0);
      if (maxId >= nIdRef.current) { nIdRef.current = maxId + 1; setNId(maxId + 1); }
    }
    if (d.projects?.length) {
      if (merge) {
        setProjects(prev => {
          const remoteIds = new Set(d.projects.map((p: any) => p.id));
          const localOnly = prev.filter((p: any) => !remoteIds.has(p.id));
          return [...d.projects, ...localOnly];
        });
      } else { setProjects(d.projects); }
    }
    if (d.nId && d.nId > nIdRef.current) { setNId(d.nId); nIdRef.current = d.nId; }
    if (d.pNId) setPNId(d.pNId);
    if (d.pris) {
      if (merge) { setPris(prev => { const rs = new Set(d.pris); return [...d.pris, ...prev.filter((x: string) => !rs.has(x))]; }); }
      else setPris(d.pris);
    }
    if (d.stats) {
      if (merge) { setStats(prev => { const rs = new Set(d.stats); return [...d.stats, ...prev.filter((x: string) => !rs.has(x))]; }); }
      else setStats(d.stats);
    }
    if (d.priC) setPriC(merge ? (prev: any) => ({ ...prev, ...d.priC }) : d.priC);
    if (d.priBg) setPriBg(merge ? (prev: any) => ({ ...prev, ...d.priBg }) : d.priBg);
    if (d.stC) setStC(merge ? (prev: any) => ({ ...prev, ...d.stC }) : d.stC);
    if (d.stBg) setStBg(merge ? (prev: any) => ({ ...prev, ...d.stBg }) : d.stBg);
    if (d.memberColors) setMemberColors(merge ? (prev: any) => ({ ...prev, ...d.memberColors }) : d.memberColors);
    if (d.members?.length) {
      const rm = d.members.filter((m: string) => m !== "미배정");
      if (merge) { setMembers(prev => { const rs = new Set(rm); return [...rm, ...prev.filter((x: string) => !rs.has(x))]; }); }
      else setMembers(rm);
    }
    // 팀 데이터 복원
    if (d.teams) setTeams(d.teams);
    if (d.teamNId) setTeamNId(d.teamNId);
    if (d.userSettings) setUserSettings(d.userSettings);
  };

  useEffect(() => {
    let hasLocal = false;
    try {
      const raw = localStorage.getItem("todo-v5");
      if (raw) {
        const parsed = JSON.parse(raw);
        applyData(parsed);
        lastKnownUpdatedAt.current = parsed._updatedAt || 0;
        hasLocal = true;
      }
    } catch (e) { }
    if (hasLocal) setLoaded(true);

    const unsub = onSnapshot(FS_DOC, (snap) => {
      if (!snap.exists()) {
        if (!fsBootstrapped.current) {
          if (!hasLocal) { setTodos(initTodos as any); setProjects(initProj); }
          fsBootstrapped.current = true;
          if (!hasLocal) setLoaded(true);
        }
        return;
      }
      const d = snap.data();
      if (!fsBootstrapped.current) {
        // 첫 Firestore 응답 — 항상 Firestore 데이터를 적용 (localStorage는 빠른 로딩용 캐시일 뿐)
        fromSnapshot.current = true;
        applyData(d);
        lastKnownUpdatedAt.current = d._updatedAt || 0;
        try { localStorage.setItem("todo-v5", JSON.stringify(d)); } catch (e) { }
        if (!hasLocal) setLoaded(true);
        fsBootstrapped.current = true;
        return;
      }
      // 이후 스냅샷 — 같은 클라이언트가 보낸 것이거나 더 오래된 데이터면 무시
      if (d._clientId === clientId.current) return;
      const incomingAt = d._updatedAt || 0;
      if (incomingAt < lastKnownUpdatedAt.current) return;
      fromSnapshot.current = true;
      lastKnownUpdatedAt.current = incomingAt;
      applyData(d, true); // merge: 로컬 추가분 보존
      try { localStorage.setItem("todo-v5", JSON.stringify(d)); } catch (e) { }
    });
    return () => unsub();
  }, []);

  // 유저 전환 시 CRUD 상태 초기화 (설정 저장/복원은 useUserSettings에서 담당)
  useEffect(() => {
    setNewRows([]);
    historyRef.current = [];
    redoRef.current = [];
  }, [currentUser]);


  const skipFirst = useRef(false);
  useEffect(() => {
    if (!loaded) return;
    if (!skipFirst.current) { skipFirst.current = true; return; }
    if (fromSnapshot.current) { fromSnapshot.current = false; return; }
    const t = setTimeout(() => {
      pendingWrite.current = true;
      const ver = ++writeVersion.current;
      const now = Date.now();
      lastKnownUpdatedAt.current = now;
      const data = { todos, projects, nId, pNId, pris, stats, priC, priBg, stC, stBg, members, memberColors, teams, teamNId, userSettings, _clientId: clientId.current, _updatedAt: now };
      try { localStorage.setItem("todo-v5", JSON.stringify(data)); } catch (e) { }
      setDoc(FS_DOC, data)
        .catch(() => flash("저장 실패 — 네트워크를 확인하세요", "err"))
        .finally(() => { if (writeVersion.current === ver) pendingWrite.current = false; });
    }, 400);
    return () => clearTimeout(t);
  }, [todos, projects, nId, pNId, members, pris, stats, priC, priBg, stC, stBg, memberColors, teams, teamNId, userSettings, loaded]);

  // action을 전달하면 토스트에 버튼이 표시됨 (예: AI 등록 후 "실행 취소")
  const flash = (m: string, t = "ok", action?: { label: string; fn: () => void }) => {
    setToast({ m, t, action });
    setTimeout(() => setToast({ m: "", t: "" }), action ? 5000 : 2500); // 액션 있을 때는 5초 유지
  };

  const forceFirestoreSync = async () => {
    try {
      const snap = await getDoc(FS_DOC);
      if (!snap.exists()) { flash("Firestore에 저장된 데이터가 없습니다", "err"); return; }
      const d = snap.data();
      applyData(d);
      lastKnownUpdatedAt.current = d._updatedAt || 0;
      try { localStorage.setItem("todo-v5", JSON.stringify(d)); } catch (e) { }
      flash("Firestore 데이터로 복원되었습니다");
    } catch (e: any) { flash(`복원 실패: ${e.message}`, "err"); }
  };

  const aProj = projects.filter(p => p.status === "활성");
  const gPr = (id: number) => gP(projects, id);

  // ── useAI: AI 파싱 관련 상태·로직 (useAI.ts로 분리) ──────────────────────
  const ai = useAI({
    currentUser,
    aProj,
    members,
    onAddTodos: (checked: AiParsed[]) => {
      const startId = nIdRef.current;
      nIdRef.current += checked.length;
      setNId(nIdRef.current);
      setTodosWithHistory((prev: Todo[]) => [
        ...prev,
        ...checked.map((t, i) => {
          const mp = aProj.find(p => t.project && p.name.includes(t.project));
          return {
            pid: mp ? mp.id : 0,
            task: t.task || "",
            who: t.assignee || "미배정",
            due: t.due || "",
            pri: t.priority || "보통",
            st: "대기",
            det: t.detail || "",
            repeat: t.repeat || "없음",
            id: startId + i,
            cre: td(),
            done: null,
          };
        }),
      ]);
    },
    flash,
    undo, // AI 등록 후 "실행 취소" 토스트 버튼에서 사용
  });

  // 활동 로그 ID 생성 — 타임스탬프+랜덤으로 충돌 방지
  const mkLogId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // repeat 값(문자열 or 객체)을 표시용 문자열로 변환
  const fmtRepeat = (v: any): string => {
    if (!v || v === "없음") return "없음";
    if (typeof v === "string") return v;
    if (v.interval === 1) return `매${v.unit}`;
    return `${v.interval}${v.unit}마다`;
  };

  const updTodo = (id: number, u: any) => setTodosWithHistory((p: Todo[]) => p.map(t => {
    if (t.id !== id) return t;
    const n: any = { ...t, ...u };
    if (u.st === "완료" && t.st !== "완료") n.done = td();
    else if (u.st && u.st !== "완료") n.done = null;

    // 변경된 필드를 로그로 기록 — det(상세내용)는 HTML이라 제외
    const LABELS: Record<string, string> = {
      task: "업무내용", who: "담당자", due: "마감기한",
      pri: "우선순위", st: "상태", pid: "프로젝트", repeat: "반복",
    };
    const changes = Object.entries(u)
      .filter(([k]) => LABELS[k])
      .filter(([k, v]) => {
        const old = String((t as any)[k] || "");
        const nw = k === "repeat" ? fmtRepeat(v) : String(v || "");
        return old !== nw;
      })
      .map(([k, v]) => ({
        field: LABELS[k],
        from: k === "repeat" ? fmtRepeat((t as any)[k]) : String((t as any)[k] || ""),
        to: k === "repeat" ? fmtRepeat(v) : String(v || ""),
      }));

    if (changes.length > 0) {
      const isComplete = u.st === "완료" && t.st !== "완료";
      const isReopen = u.st && u.st !== "완료" && t.st === "완료";
      const entry: ActivityLog = {
        id: mkLogId(),
        at: new Date().toISOString(),
        who: currentUser || "시스템",
        action: isComplete ? "complete" : isReopen ? "reopen" : "update",
        changes,
      };
      n.logs = [...(t.logs || []), entry];
    } else if (u.logs) {
      // 메모 저장 등 logs 직접 업데이트 — 위 변경 감지에서 제외했으므로 그대로 반영
      n.logs = u.logs;
    }
    return n;
  }));

  const addTodo = (t: any) => {
    const id = nIdRef.current++; setNId(nIdRef.current);
    // 업무 등록 시 생성 로그 자동 기록
    const createLog: ActivityLog = {
      id: mkLogId(),
      at: new Date().toISOString(),
      who: currentUser || "시스템",
      action: "create",
    };
    const newTodo = { ...t, id, cre: td(), done: t.st === "완료" ? td() : null, repeat: t.repeat || "없음", logs: [createLog] };
    setTodosWithHistory((p: Todo[]) => [...p, newTodo]);
    return id;
  };

  // 삭제 이력 (localStorage에 최대 200건 보관)
  const [deletedLog, setDeletedLog] = useState<DeletedTodo[]>(() =>
    JSON.parse(localStorage.getItem("bgk_deleted_log") || "[]")
  );

  const delTodo = (id: number) => {
    // 삭제 전 업무 정보를 deletedLog에 기록 (todos를 직접 읽어서 로그만 저장)
    const target = todos.find(t => t.id === id);
    if (target) {
      const entry: DeletedTodo = { id: target.id, task: target.task, who: target.who, pid: target.pid, pri: target.pri, st: target.st, repeat: target.repeat, det: target.det, deletedAt: td() };
      setDeletedLog(prevLog => {
        const next = [...prevLog, entry].slice(-200);
        localStorage.setItem("bgk_deleted_log", JSON.stringify(next));
        return next;
      });
    }
    // 히스토리 포함 삭제 — undo로 복원 가능
    setTodosWithHistory((p: Todo[]) => p.filter(t => t.id !== id));
    flash("업무가 삭제되었습니다", "err");
  };

  // 삭제된 업무를 복원 — deletedLog에서 제거 후 todos에 새 ID로 재등록
  const restoreTodo = (entry: DeletedTodo) => {
    // 휴지통에서 해당 항목 제거 (같은 id + deletedAt 기준)
    setDeletedLog(prev => {
      const next = prev.filter(e => !(e.id === entry.id && e.deletedAt === entry.deletedAt));
      localStorage.setItem("bgk_deleted_log", JSON.stringify(next));
      return next;
    });
    // 새 ID를 부여해서 todos에 추가 (원래 ID가 이미 다른 업무에 사용됐을 수 있음)
    const newId = nId;
    setNId(nId + 1);
    const restored: Todo = {
      id: newId,
      pid: entry.pid,
      task: entry.task,
      who: entry.who,
      due: "",
      pri: entry.pri,
      st: entry.st === "완료" ? "대기" : entry.st, // 완료 상태로 복원 시 대기로 전환
      det: entry.det,
      cre: td(),
      done: null,
      repeat: entry.repeat || "없음",
    };
    setTodosWithHistory((p: Todo[]) => [...p, restored]);
    flash(`'${entry.task}' 업무가 복원되었습니다`);
  };

  // 리스트뷰 드래그 정렬 — 업무 배열 순서를 변경하여 수동 정렬 (정렬 미적용 시만 동작)
  const reorderTodo = (dragId: number, beforeId: number | null) => {
    setTodosWithHistory((prev: Todo[]) => {
      const dragged = prev.find(t => t.id === dragId);
      if (!dragged) return prev;
      const without = prev.filter(t => t.id !== dragId);
      if (beforeId === null) return [...without, dragged];
      const idx = without.findIndex(t => t.id === beforeId);
      if (idx === -1) return [...without, dragged];
      return [...without.slice(0, idx), dragged, ...without.slice(idx)];
    });
  };

  const filtered = useMemo(() => todos.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.task.toLowerCase().includes(q) || t.who.toLowerCase().includes(q) || gPr(t.pid).name.toLowerCase().includes(q))
      && (filters.proj.length === 0 || filters.proj.some(v => v === "__none__" ? gPr(t.pid).id === 0 : String(t.pid) === v))
      && (filters.st.length === 0 || filters.st.some(v => v === "__none__" ? !t.st : v === "__overdue__" ? isOD(t.due, t.st) : t.st === v))
      && (filters.pri.length === 0 || filters.pri.some(v => v === "__none__" ? !t.pri : t.pri === v))
      && (filters.who.length === 0 || filters.who.some(v => v === "__none__" ? !t.who : t.who === v))
      && (filters.repeat.length === 0 || filters.repeat.includes(t.repeat))
      && (!filters.fav || isFav(t.id));
  }), [todos, search, filters, projects, currentUser, userFavs]);

  const toggleSort = (col: string) => {
    if (sortCol === col) { if (sortDir === "asc") { setSortDir("desc") } else { setSortCol(null); setSortDir("asc") } }
    else { setSortCol(col); setSortDir("asc") }
  };
  const priOrder: Record<string, number> = { 긴급: 0, 높음: 1, 보통: 2, 낮음: 3 };
  const stOrder: Record<string, number> = { 대기: 0, 진행중: 1, 검토: 2, 완료: 3 };

  // 하나의 정렬 기준으로 두 업무를 비교하는 함수 (다중 정렬의 각 단계에서 사용)
  const compareByCol = (a: any, b: any, col: string, dir: "asc" | "desc"): number => {
    // 커스텀 순서가 있으면 그 순서대로 비교
    const customOrder = customSortOrders[col];
    if (customOrder && customOrder.length > 0) {
      const orderMap: Record<string, number> = {};
      customOrder.forEach((v, i) => { orderMap[v] = i; });
      // pid는 프로젝트 이름으로 매칭 (ColumnFilterDropdown이 이름 기준 순서를 전달)
      const keyA = col === "pid" ? (gPr(a.pid).name || "미배정") : col === "who" ? (a.who || "") : col === "pri" ? (a.pri || "") : col === "st" ? (a.st || "") : "";
      const keyB = col === "pid" ? (gPr(b.pid).name || "미배정") : col === "who" ? (b.who || "") : col === "pri" ? (b.pri || "") : col === "st" ? (b.st || "") : "";
      const ia = orderMap[keyA] ?? 999;
      const ib = orderMap[keyB] ?? 999;
      return dir === "asc" ? ia - ib : ib - ia;
    }

    // 기본 비교 로직
    let va: any, vb: any;
    if (col === "id") { va = a.id; vb = b.id; }
    else if (col === "pid") { va = gPr(a.pid).name; vb = gPr(b.pid).name; }
    else if (col === "task") { va = a.task; vb = b.task; }
    else if (col === "det") { va = stripHtml(a.det || ""); vb = stripHtml(b.det || ""); }
    else if (col === "who") { va = a.who || ""; vb = b.who || ""; }
    else if (col === "due") { va = a.due || "9999"; vb = b.due || "9999"; }
    else if (col === "pri") { va = priOrder[a.pri] ?? 9; vb = priOrder[b.pri] ?? 9; }
    else if (col === "st") { va = stOrder[a.st] ?? 9; vb = stOrder[b.st] ?? 9; }
    else if (col === "repeat") { va = a.repeat || "없음"; vb = b.repeat || "없음"; }
    else return 0;
    if (typeof va === "string") return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return dir === "asc" ? va - vb : vb - va;
  };

  // 누적 정렬 — activeSortFields 배열 순서대로 비교 (1차 정렬 → 2차 정렬 → ...)
  // activeSortFields가 비어있으면 sortCol 단일 정렬 (메모뷰 등 호환)
  const sorted = useMemo(() => {
    console.log("[SORT] activeSortFields:", JSON.stringify(activeSortFields), "sortCol:", sortCol, "sortDir:", sortDir);
    return [...filtered].sort((a, b) => {
      if (activeSortFields.length > 0) {
        for (const sf of activeSortFields) {
          const diff = compareByCol(a, b, sf.col, sf.dir);
          if (diff !== 0) return diff;
        }
        return 0;
      }
      if (!sortCol) return 0;
      return compareByCol(a, b, sortCol, sortDir as "asc" | "desc");
    });
  }, [filtered, sortCol, sortDir, projects, customSortOrders, activeSortFields]);
  const sortIcon = (col: string) => sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅";
  const visibleTodoIds = useMemo(() => sorted.filter(t => t.st !== "완료").map(t => t.id), [sorted]);
  const allVisibleSelected = visibleTodoIds.length > 0 && visibleTodoIds.every(id => selectedIds.has(id));
  const someVisibleSelected = visibleTodoIds.some(id => selectedIds.has(id));
  const toggleSelectAll = () => { if (allVisibleSelected) { clrSel(); } else { setSelectedIds(new Set(visibleTodoIds)); lastSelRef.current = null; } };
  // 체크박스 Shift+Click: 앵커 클릭 동작(선택/해제)을 기억하여 범위에 동일 적용
  // 예) 체크 해제 후 Shift+Click → 범위 전체 해제, 체크 선택 후 Shift+Click → 범위 전체 선택
  const handleCheck = (id: number, shift: boolean) => {
    if (shift && lastSelRef.current !== null) {
      const ids = sorted.map(t => t.id);
      const a = ids.indexOf(lastSelRef.current), b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        const range = ids.slice(lo, hi + 1);
        const adding = lastSelActionRef.current === "add";
        setSelectedIds(prev => {
          const n = new Set(prev);
          range.forEach(rid => adding ? n.add(rid) : n.delete(rid));
          return n;
        });
        return;
      }
    }
    // 단일 클릭: 토글하고 동작 방향을 기억
    const wasSelected = selectedIds.has(id);
    lastSelActionRef.current = wasSelected ? "remove" : "add";
    setSelectedIds(prev => { const n = new Set(prev); wasSelected ? n.delete(id) : n.add(id); return n; });
    lastSelRef.current = id;
  };
  const togF = (k: string, v: string) => {
    pushHistory();
    if (k === "__reset__") { setFilters({ proj: [], who: [], pri: [], st: [], repeat: [], fav: "" }); return; }
    if (k === "fav") { setFilters(f => ({ ...f, fav: f.fav ? "" : "1" })); return; }
    if (v === "") { setFilters(f => ({ ...f, [k]: [] })); return; }
    setFilters(f => { const arr = f[k as keyof Filters] as string[]; return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }; });
  };

  const todayStr = td();

  // ── 팀 CRUD ────────────────────────────────────────────────────────────────
  const addTeam = (name: string, color: string) => {
    pushHistory();
    const id = `team-${String(teamNId).padStart(3, "0")}`;
    const team: Team = { id, name, color, visibility: "company", members: [], projectIds: [], createdAt: td() };
    setTeams(p => [...p, team]);
    setTeamNId(n => n + 1);
    flash(`팀 "${name}"이(가) 추가되었습니다`);
    return id;
  };
  const updTeam = (id: string, u: Partial<Team>) => {
    pushHistory();
    setTeams(p => p.map(t => t.id === id ? { ...t, ...u } : t));
  };
  const delTeam = (id: string) => {
    const team = teams.find(t => t.id === id);
    if (!team) return;
    // 팀 삭제 시 해당 팀 todo → 전사 공개(teamId 제거)
    setTodos(p => p.map(t => t.teamId === id ? { ...t, teamId: undefined } : t));
    pushHistory();
    setTeams(p => p.filter(t => t.id !== id));
    flash(`팀 "${team.name}"이(가) 삭제되었습니다`, "err");
  };
  // 팀에 멤버 추가/제거/역할 변경
  const addTeamMember = (teamId: string, name: string, role: TeamRole = "editor") => {
    // 1인 1팀 — 다른 팀에 이미 소속 시 제거
    setTeams(p => p.map(t => {
      if (t.id === teamId) return { ...t, members: [...t.members.filter(m => m.name !== name), { name, role }] };
      return { ...t, members: t.members.filter(m => m.name !== name) };
    }));
  };
  const removeTeamMember = (teamId: string, name: string) => {
    setTeams(p => p.map(t => t.id === teamId ? { ...t, members: t.members.filter(m => m.name !== name) } : t));
  };
  const setTeamMemberRole = (teamId: string, name: string, role: TeamRole) => {
    setTeams(p => p.map(t => t.id === teamId ? { ...t, members: t.members.map(m => m.name === name ? { ...m, role } : m) } : t));
  };
  // 팀에 프로젝트 연결/해제
  const addTeamProject = (teamId: string, pid: number) => {
    // 1프로젝트 1팀 — 다른 팀에서 제거
    setTeams(p => p.map(t => {
      if (t.id === teamId) return { ...t, projectIds: [...new Set([...t.projectIds, pid])] };
      return { ...t, projectIds: t.projectIds.filter(id => id !== pid) };
    }));
  };
  const removeTeamProject = (teamId: string, pid: number) => {
    setTeams(p => p.map(t => t.id === teamId ? { ...t, projectIds: t.projectIds.filter(id => id !== pid) } : t));
  };

  // ── useCalendar: 캘린더 상태·로직 분리 ────────────────────────────────────
  const cal = useCalendar({ todos });

  const saveMod = (f: any) => {
    if (!f.task || !f.who) { alert("업무내용과 담당자는 필수 항목입니다."); return; }
    if (f.id) { updTodo(parseInt(f.id), { pid: parseInt(f.pid), task: f.task, who: f.who, due: f.due, pri: f.pri, st: f.st, det: f.det, repeat: f.repeat || "없음" }); flash("변경사항이 저장되었습니다"); }
    else { addTodo({ pid: parseInt(f.pid), task: f.task, who: f.who, due: f.due, pri: f.pri, st: f.st, det: f.det, repeat: f.repeat || "없음" }); flash("업무가 등록되었습니다"); }
    setEditMod(null);
  };
  const addNR = () => setNewRows(r => [...r, { pid: "", task: "", who: currentUser || "", due: "", pri: "보통", det: "", repeat: "없음" }]);
  const isNREmpty = (r: NewRow) => !r.task && !r.pid && !r.who && !r.due && !r.det;
  const saveOneNR = (i: number) => { const r = newRows[i]; if (!r.task?.trim()) { flash("업무내용을 입력해주세요", "err"); return; } addTodo({ pid: r.pid ? parseInt(r.pid) : 0, task: r.task.trim(), who: r.who || currentUser || "미배정", due: r.due || "", pri: r.pri || "보통", st: "대기", det: r.det || "", repeat: r.repeat || "없음" }); setNewRows(p => p.filter((_, j) => j !== i)); flash("업무가 등록되었습니다"); };
  const saveNRs = () => { if (savingNRs.current) return; const empty = newRows.filter(r => !r.task?.trim()); if (empty.length) { flash(`업무내용이 비어 있는 항목이 ${empty.length}건 있습니다`, "err"); return; } const v = newRows.filter(r => r.task?.trim()); if (!v.length) { setNewRows([]); return; } savingNRs.current = true; v.forEach(r => addTodo({ pid: r.pid ? parseInt(r.pid) : 0, task: r.task.trim(), who: r.who || currentUser || "미배정", due: r.due || "", pri: r.pri || "보통", st: "대기", det: r.det || "", repeat: r.repeat || "없음" })); setNewRows([]); flash(`${v.length}건이 등록되었습니다`); setTimeout(() => { savingNRs.current = false; }, 300); };


  const addChip = () => {
    if (!chipVal.trim()) return; const v = chipVal.trim();
    if (chipAdd === "proj") { if (projects.some(p => p.name === v)) { flash(`프로젝트 "${v}"은(는) 이미 존재합니다`, "err"); return; } setProjectsGuarded((p: Project[]) => [...p, { id: pNId, name: v, color: chipColor, status: "활성" }]); setPNId(pNId + 1); flash(`프로젝트 "${v}"이(가) 추가되었습니다`); }
    else if (chipAdd === "who") { if (members.includes(v)) { flash(`담당자 "${v}"은(는) 이미 존재합니다`, "err"); return; } setMembersGuarded((p: string[]) => [...p, v]); flash(`담당자 "${v}"이(가) 추가되었습니다`); }
    else if (chipAdd === "pri") { if (!pris.includes(v)) { setPrisGuarded((p: string[]) => [...p, v]); setPriCGuarded((p: any) => ({ ...p, [v]: chipColor })); setPriBgGuarded((p: any) => ({ ...p, [v]: chipColor + "18" })); } flash(`우선순위 "${v}"이(가) 추가되었습니다`); }
    else if (chipAdd === "st") { if (!stats.includes(v)) { setStatsGuarded((p: string[]) => [...p, v]); setStCGuarded((p: any) => ({ ...p, [v]: chipColor })); setStBgGuarded((p: any) => ({ ...p, [v]: chipColor + "18" })); } flash(`상태 "${v}"이(가) 추가되었습니다`); }
    setChipVal(""); setChipAdd(null);
  };

  // Ctrl+Z/Y 단축키 — 검색창 등 input 안에서도 앱 undo/redo 동작하도록 태그 체크 제거
  // App.tsx에 동일 핸들러가 있으므로 여기서는 제거 (중복 방지)


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view !== "calendar") return;
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "1") cal.setCalView("day"); else if (e.key === "2") cal.setCalView("week"); else if (e.key === "3") cal.setCalView("month"); else if (e.key === "4") cal.setCalView("custom"); else if (e.key === "5") cal.setCalView("agenda");
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [view]);

  return {
    // state
    projects, setProjects: setProjectsGuarded, todos, setTodos: setTodosWithHistory, nId, setNId, pNId, setPNId, loaded,
    members, setMembers: setMembersGuarded, pris, setPris: setPrisGuarded, stats, setStats: setStatsGuarded,
    priC, setPriC: setPriCGuarded, priBg, setPriBg: setPriBgGuarded, stC, setStC: setStCGuarded, stBg, setStBg: setStBgGuarded,
    memberColors, setMemberColors: setMemberColorsGuarded,
    // 팀
    teams, setTeams, teamNId,
    addTeam, updTeam, delTeam,
    addTeamMember, removeTeamMember, setTeamMemberRole,
    addTeamProject, removeTeamProject,
    view, setView, toast,
    search, setSearch, editCell, setEditCell,
    newRows, setNewRows, kbF, setKbF, kbFWho, setKbFWho,
    dragId, setDragId, dragOver, setDragOver,
    ...cal,
    editMod, setEditMod, detMod, setDetMod, projMod, setProjMod, settMod, setSettMod,
    chipAdd, setChipAdd, chipVal, setChipVal, chipColor, setChipColor,
    ...ai,
    detPopup, setDetPopup, notePopup, setNotePopup,
    datePop, setDatePop, nrDatePop, setNrDatePop,
    hoverRow, setHoverRow,
    ...userSets,
    // setFilters를 히스토리 포함 버전으로 덮어쓰기 — 필터 변경도 undo 가능
    setFilters: ((fn: any) => { pushHistory(); setFilters(fn); }) as typeof setFilters,
    // 저장 필터 저장/삭제도 undo 가능하도록 pushHistory 포함 버전으로 덮어쓰기
    saveCurrentFilter: (name: string, flt: Filters, s: string) => { pushHistory(); saveCurrentFilter(name, flt, s); },
    deleteSavedFilter: (id: string) => { pushHistory(); deleteSavedFilter(id); },
    selectedIds, lastSelRef, addSecRef, tblDivRef,
    clrSel, selAll, movePop, setMovePop, bulkPop, setBulkPop,
    historyRef, redoRef,
    // computed
    aProj, gPr, filtered, sorted, sortIcon, setSortCol, setSortDir,
    visibleTodoIds, allVisibleSelected, someVisibleSelected,
    todayStr,
    // handlers
    deletedLog, restoreTodo,
    undo, redo, flash, forceFirestoreSync, updTodo, addTodo, delTodo, reorderTodo,
    toggleSort, togF, handleCheck, toggleSelectAll,
    saveMod, addNR, isNREmpty, saveOneNR, saveNRs,
    addChip,
  };
}
