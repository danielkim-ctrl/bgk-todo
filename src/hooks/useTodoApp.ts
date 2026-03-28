import { useState, useRef, useEffect, useMemo } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  INIT_MEMBERS, INIT_PRI, INIT_ST, INIT_PRI_C, INIT_PRI_BG, INIT_ST_C, INIT_ST_BG,
  PROJ_PALETTE, initTodos, initProj
} from "../constants";
import { td, gP, expandRepeats, dateStr, fmt2, stripHtml } from "../utils";
import { Filters, NewRow, AiParsed, DatePopState, NotePopupState, Project, Todo, DeletedTodo } from "../types";

export function useTodoApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const historyRef = useRef<Todo[][]>([]);
  const redoRef = useRef<Todo[][]>([]);
  const clientId = useRef(Math.random().toString(36).slice(2));
  const pendingWrite = useRef(false);
  const writeVersion = useRef(0);
  const fromSnapshot = useRef(false);
  const FS_DOC = useMemo(() => doc(db, "todos_db", "team"), []);
  const detHoverTimerRef = useRef<any>(null);
  const noteLeaveTimerRef = useRef<any>(null);
  const confirmingAI = useRef(false);
  const savingNRs = useRef(false);
  const lastKnownUpdatedAt = useRef(0);
  const fsBootstrapped = useRef(false);

  const guard = () => { pendingWrite.current = true; };

  const setTodosWithHistory = (fn: any) => {
    guard();
    setTodos(prev => {
      historyRef.current = [...historyRef.current.slice(-49), prev];
      redoRef.current = [];
      return typeof fn === "function" ? fn(prev) : fn;
    });
  };

  const setProjectsGuarded = (fn: any) => { guard(); setProjects(fn); };
  const setMembersGuarded = (fn: any) => { guard(); setMembers(fn); };
  const setPrisGuarded = (fn: any) => { guard(); setPris(fn); };
  const setStatsGuarded = (fn: any) => { guard(); setStats(fn); };
  const setPriCGuarded = (fn: any) => { guard(); setPriC(fn); };
  const setPriBgGuarded = (fn: any) => { guard(); setPriBg(fn); };
  const setStCGuarded = (fn: any) => { guard(); setStC(fn); };
  const setStBgGuarded = (fn: any) => { guard(); setStBg(fn); };

  const undo = () => {
    if (!historyRef.current.length) return;
    setTodos(prev => {
      redoRef.current = [...redoRef.current.slice(-49), prev];
      return historyRef.current.pop()!;
    });
    flash("이전 상태로 복원되었습니다");
  };

  const redo = () => {
    if (!redoRef.current.length) return;
    setTodos(prev => {
      historyRef.current = [...historyRef.current.slice(-49), prev];
      return redoRef.current.pop()!;
    });
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

  const [view, setView] = useState("list");
  const [toast, setToast] = useState({ m: "", t: "" });
  const _u0 = localStorage.getItem("todo-current-user");
  const _s0 = (() => { try { return JSON.parse(localStorage.getItem(`todo-view-settings-${_u0}`) || "null"); } catch { return null; } })();
  const [filters, setFilters] = useState<Filters>(_s0?.filters || { proj: [], who: [], pri: [], st: [], repeat: [], fav: "" });
  const [favSidebar, setFavSidebar] = useState<{ [k: string]: string[] }>(() => {
    const u = localStorage.getItem("todo-current-user");
    if (!u) return {};
    try { return JSON.parse(localStorage.getItem(`todo-sidebar-favs-${u}`) || "{}"); } catch { return {}; }
  });
  const togFavSidebar = (key: string, val: string) => setFavSidebar(prev => {
    const cur = prev[key] || [];
    const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
    const s = { ...prev, [key]: next };
    if (currentUser) localStorage.setItem(`todo-sidebar-favs-${currentUser}`, JSON.stringify(s));
    return s;
  });
  const [search, setSearch] = useState("");
  const [editCell, setEditCell] = useState<{ id: number, field: string } | null>(null);
  const [sortCol, setSortCol] = useState<string | null>(_s0?.sortCol ?? null);
  const [sortDir, setSortDir] = useState<string>(_s0?.sortDir ?? "asc");
  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const [kbF, setKbF] = useState<string[]>([]);
  const [kbFWho, setKbFWho] = useState<string[]>([]);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [calF, setCalF] = useState("");
  const [calFWho, setCalFWho] = useState("");
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [calM, setCalM] = useState(new Date().getMonth());
  const [calD, setCalD] = useState(new Date().getDate());
  const [calView, setCalView] = useState("month");
  const [customDays, setCustomDays] = useState(4);
  const [editMod, setEditMod] = useState<any>(null);
  const [detMod, setDetMod] = useState<any>(null);
  const [projMod, setProjMod] = useState(false);
  const [settMod, setSettMod] = useState(false);
  const [chipAdd, setChipAdd] = useState<string | null>(null);
  const [chipVal, setChipVal] = useState("");
  const [chipColor, setChipColor] = useState("#8b5cf6");
  const [aiText, setAiText] = useState("");
  const [aiFiles, setAiFiles] = useState<{name:string,type:string,data:string,textContent?:string}[]>([]);
  const [aiLoad, setAiLoad] = useState(false);
  const [aiSt, setAiSt] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("team-todo-apikey") || "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");
  const [aiParsed, setAiParsed] = useState<AiParsed[]>([]);
  const [addTab, setAddTab] = useState("manual");
  const [detPopup, setDetPopup] = useState<any>(null);
  const [notePopup, setNotePopup] = useState<NotePopupState | null>(null);
  const [datePop, setDatePop] = useState<DatePopState | null>(null);
  const [nrDatePop, setNrDatePop] = useState<DatePopState | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem("todo-current-user"));
  const [userFavs, setUserFavs] = useState<{ [u: string]: number[] }>(() => {
    try { return JSON.parse(localStorage.getItem("todo-user-favs") || "{}"); } catch { return {}; }
  });
  // 사용자별 UI 순서/설정 — Firestore 동기화로 기기 무관하게 사람 기준 유지
  const [userSettings, setUserSettings] = useState<Record<string, {
    kanbanOrder: number[];
    sidebarOrder: number[];
    starredIds: number[];
    hiddenProjects: number[];
    hiddenMembers: string[];
  }>>({});
  const isFav = (id: number) => currentUser ? (userFavs[currentUser] || []).includes(id) : false;
  const toggleFav = (id: number) => {
    if (!currentUser) return;
    setUserFavs(prev => {
      const cur = prev[currentUser] || [];
      const next = cur.includes(id) ? cur.filter(v => v !== id) : [...cur, id];
      return { ...prev, [currentUser]: next };
    });
  };
  const loadUserViewSettings = (user: string | null) => {
    if (!user) return { todoView: "list" as const, memoCols: 3, sortCol: null as string | null, sortDir: "asc" as const, expandMode: false, filters: { proj: [], who: [], pri: [], st: [], repeat: [], fav: "" } };
    try { return JSON.parse(localStorage.getItem(`todo-view-settings-${user}`) || "null") || { todoView: "list", memoCols: 3, sortCol: null, sortDir: "asc", expandMode: false, filters: { proj: [], who: [], pri: [], st: [], repeat: [], fav: "" } }; } catch { return { todoView: "list", memoCols: 3, sortCol: null, sortDir: "asc", expandMode: false, filters: { proj: [], who: [], pri: [], st: [], repeat: [], fav: "" } }; }
  };
  const _initSettings = loadUserViewSettings(localStorage.getItem("todo-current-user"));
  const [expandMode, setExpandMode] = useState<boolean>(_initSettings.expandMode);
  const [todoView, setTodoView] = useState<"list"|"memo">(_initSettings.todoView);
  const [memoCols, setMemoCols] = useState<number>(_initSettings.memoCols);
  const [showDone, setShowDone] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const lastSelRef = useRef<number | null>(null);
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
    return () => document.head.removeChild(link);
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
    return () => document.head.removeChild(st);
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
    if (d.members?.length) {
      const rm = d.members.filter((m: string) => m !== "미배정");
      if (merge) { setMembers(prev => { const rs = new Set(rm); return [...rm, ...prev.filter((x: string) => !rs.has(x))]; }); }
      else setMembers(rm);
    }
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
        // 첫 Firestore 응답 — localStorage가 없으면 Firestore 데이터로 초기화
        if (!hasLocal) {
          applyData(d);
          lastKnownUpdatedAt.current = d._updatedAt || 0;
          try { localStorage.setItem("todo-v5", JSON.stringify(d)); } catch (e) { }
          setLoaded(true);
        }
        fsBootstrapped.current = true;
        return;
      }
      // 이후 스냅샷 — 같은 클라이언트 or 쓰기 중 or 더 오래된 데이터면 무시
      if (d._clientId === clientId.current) return;
      if (pendingWrite.current) return;
      // _updatedAt 없는 스냅샷은 타임스탬프 비교 불가 → lastKnownUpdatedAt이 있으면 무시
      const incomingAt = d._updatedAt || 0;
      if (incomingAt < lastKnownUpdatedAt.current) return;
      fromSnapshot.current = true;
      lastKnownUpdatedAt.current = incomingAt;
      applyData(d, true); // merge: 로컬 추가분 보존
      try { localStorage.setItem("todo-v5", JSON.stringify(d)); } catch (e) { }
    });
    return () => unsub();
  }, []);

  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevUserRef.current;
    // 이전 유저 설정 저장
    if (prev) {
      localStorage.setItem(`todo-view-settings-${prev}`, JSON.stringify({ todoView, memoCols, sortCol, sortDir, expandMode, filters }));
    }
    prevUserRef.current = currentUser;

    setNewRows([]);
    historyRef.current = [];
    redoRef.current = [];
    if (currentUser) {
      localStorage.setItem("todo-current-user", currentUser);
      // 새 유저 설정 복원
      const s = loadUserViewSettings(currentUser);
      setTodoView(s.todoView);
      setMemoCols(s.memoCols);
      setSortCol(s.sortCol);
      setSortDir(s.sortDir);
      setExpandMode(s.expandMode);
      setFilters(s.filters);
    } else {
      localStorage.removeItem("todo-current-user");
    }
  }, [currentUser]);

  // 뷰 설정 변경 시 현재 유저에 자동 저장
  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`todo-view-settings-${currentUser}`, JSON.stringify({ todoView, memoCols, sortCol, sortDir, expandMode, filters }));
  }, [todoView, memoCols, sortCol, sortDir, expandMode, filters, currentUser]);

  useEffect(() => {
    if (!currentUser) { setFavSidebar({}); return; }
    try { setFavSidebar(JSON.parse(localStorage.getItem(`todo-sidebar-favs-${currentUser}`) || "{}")); } catch { setFavSidebar({}); }
  }, [currentUser]);

  useEffect(() => { localStorage.setItem("todo-user-favs", JSON.stringify(userFavs)); }, [userFavs]);

  useEffect(() => {
    if (!loaded) return;
    if (localStorage.getItem("seed-lotte-2026")) return;
    if (projects.find(p => p.name.includes("롯데백화점"))) return;
    const newPid = Math.max(...projects.map(p => p.id), 0) + 1;
    const base = Math.max(...todos.filter(t => !Array.isArray(t)).map(t => t.id), 0) + 1;
    const mk = (i: number, task: string, due: string, st: string, pri: string, det: string) => ({ id: base + i, pid: newPid, task, who: "김대윤", due, pri, st, det, cre: "2026-03-27", done: st === "완료" ? "2026-03-27" : null, repeat: "없음" });
    setProjectsGuarded((prev: Project[]) => [...prev, { id: newPid, name: "2026 롯데백화점 동행 워크숍", color: "#ef4444", status: "활성" }]);
    setTodos(prev => [...prev.filter(t => !Array.isArray(t)), ...[
      mk(0,"참가사 선발 및 선발 공지","2026-03-06","진행중","긴급","최종 참가인원 체크 필수"),
      mk(1,"롯데 호텔 담당자 인계","2026-03-06","완료","긴급","롯데호텔 관리 주체 확정 필요"),
      mk(2,"롯데 호텔 추가 숙박 확보","2026-03-06","진행중","긴급","최종 객실: 80/61"),
      mk(3,"[1차시] 직무 특강 1 연사 확정","2026-03-13","진행중","긴급","섭외비 확정, 숙소 및 항공 지원"),
      mk(4,"[1차시] 직무 특강 2 연사 확정","2026-03-13","완료","긴급","이윤수, 조용헌, 환경재단 ESG 강사"),
      mk(5,"[1차시] 명사 특강 연사 확정","2026-03-13","진행중","긴급","조용헌 교수님 항공권 발권 완료(272,000원)"),
      mk(6,"[2차시] 직무 특강 1 연사 확정","2026-03-13","진행중","긴급","이윤수 강의 의뢰서 및 일정 체크 필요"),
      mk(7,"[2차시] 직무 특강 2 연사 확정","2026-03-13","진행중","긴급","1차시와 동일"),
      mk(8,"[2차시] 명사 특강 연사 확정","2026-03-13","진행중","긴급","1차시와 동일"),
      mk(9,"[전체] 예산안 확정","2026-03-13","진행중","긴급",""),
      mk(10,"[전체] 계약서 작성 및 선금 지급","2026-03-13","대기","긴급",""),
      mk(11,"[2차시] 항공권 전달 및 발권","2026-03-24","진행중","긴급",""),
      mk(12,"[1차시] 항공권 명단 전달 및 발권","2026-03-25","진행중","긴급",""),
      mk(13,"[전체] 여행자보험 가입","2026-03-25","대기","긴급",""),
      mk(14,"[전체] 레크레이션 상품 선정 및 구매","2026-03-27","완료","긴급","진행안함"),
      mk(15,"[전체] 기념품 선정 및 구매","2026-03-27","진행중","긴급","시시호시 제주 전통술(3만원+@)"),
      mk(16,"[전체] 제주도 사전 답사 및 호텔 미팅","2026-03-27","대기","긴급","03.23(월) 진행 예정"),
      mk(17,"[전체] ESG 플로깅 프로그램 기획/확정","2026-03-27","진행중","긴급","장소 섭외, 지자체 협의, 스토리텔링 기획 필요"),
      mk(18,"[전체] 해녀촌 기념품 체크","","대기","낮음","해녀촌 프로그램 취소, 성산일출봉/올레길로 변경"),
      mk(19,"[전체] ESG 플로깅 현지 언론사 기사 초안","","대기","낮음","롯데백화점 작성"),
      mk(20,"[전체] 플로깅 플랜B 수립","2026-03-27","진행중","긴급","우천시 선녀와나무꾼, 이너리스, 사려니 숲길"),
      mk(21,"[1차시] 참석자 특이사항 수요조사","2026-04-10","대기","높음","식단, 알러지, 건강상태 조사"),
      mk(22,"[2차시] 참석자 특이사항 수요조사","2026-04-10","대기","높음","체험 프로그램 분리 발송"),
      mk(23,"[전체] 호텔 체크인 운영 방안 확정","2026-04-10","대기","높음","사전 체크인 후 현장 배부 예정"),
      mk(24,"[전체] VIP 의전 체크","2026-04-10","완료","높음","모두 함께 버스 탑승"),
      mk(25,"[전체] 연회장 레이아웃 구성","2026-04-10","대기","높음","크리스탈 볼룸 1,2,3 사용 / 무대 7.2M×3M"),
      mk(26,"[전체] 브릿징·롯데백화점 인원별 R&R","2026-04-10","대기","높음",""),
      mk(27,"[전체] 홍보물·기념품 사전 물류 배송","2026-04-10","대기","높음","행사 3~4일 전까지 호텔로 발송"),
      mk(28,"[전체] 플로깅 키트 수령 및 호텔 발송","2026-04-10","대기","높음","롯데호텔 사전 협의 필요"),
      mk(29,"[전체] 행사 브랜딩 홍보물 기획 및 출력","2026-04-10","대기","높음","명찰, 리플렛, 현수막, 버스 번호판 등"),
      mk(30,"[전체] 안전 대책 수립","2026-04-10","대기","높음","병원 동선 파악, 구급약품 준비"),
      mk(31,"[1차시] 참가사 안내문 발송","2026-04-17","대기","보통","일정표, 숙소, 준비물 안내"),
      mk(32,"[2차시] 참가사 안내문 발송","2026-04-28","대기","보통",""),
      mk(33,"[1차시] 호텔 예약 명단 확인 및 방 배정","","진행중","낮음","개인 사용분 개별 결제"),
      mk(34,"[2차시] 호텔 예약 명단 확인 및 방 배정","","진행중","낮음","부문별 맞게 체험 프로그램 배정"),
      mk(35,"롯데호텔 숙박·연회장 계약","","진행중","낮음","선금 입금 완료(3.16)"),
      mk(36,"행사 키비주얼 제작 여부 확인","","완료","낮음","키비주얼 제작 완료(0313)"),
      mk(37,"참가사 명단(출석체크용) 제작 - 파트너사","","대기","낮음","브릿징그룹 참가사명단 확인"),
      mk(38,"참가사 명단(출석체크용) 제작 - 외주사","","대기","낮음","룸드롭 5,000원/객실"),
      mk(39,"프로그램 일정표 수정 및 명찰용 스케쥴","","대기","낮음","명찰 뒤에 스케쥴표 인쇄"),
      mk(40,"연회 음료 및 야식 준비","","대기","낮음","주류 영수증 처리 필요"),
      mk(41,"헤드테이블 확인","","대기","낮음","VIP 및 파트너사 대표 좌석 지정"),
    ]] as any);
    setNId(base + 42); nIdRef.current = base + 42;
    setPNId(newPid + 1);
    localStorage.setItem("seed-lotte-2026", "1");
  }, [loaded]);

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
      const data = { todos, projects, nId, pNId, pris, stats, priC, priBg, stC, stBg, members, userSettings, _clientId: clientId.current, _updatedAt: now };
      try { localStorage.setItem("todo-v5", JSON.stringify(data)); } catch (e) { }
      setDoc(FS_DOC, data)
        .catch(() => flash("저장 실패 — 네트워크를 확인하세요", "err"))
        .finally(() => { if (writeVersion.current === ver) pendingWrite.current = false; });
    }, 400);
    return () => clearTimeout(t);
  }, [todos, projects, nId, pNId, members, pris, stats, priC, priBg, stC, stBg, userSettings, loaded]);

  const flash = (m: string, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast({ m: "", t: "" }), 2500); };

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

  const updTodo = (id: number, u: any) => setTodosWithHistory((p: Todo[]) => p.map(t => {
    if (t.id !== id) return t;
    const n: any = { ...t, ...u };
    if (u.st === "완료" && t.st !== "완료") n.done = td();
    else if (u.st && u.st !== "완료") n.done = null;
    return n;
  }));

  const addTodo = (t: any) => {
    const id = nIdRef.current++; setNId(nIdRef.current);
    const newTodo = { ...t, id, cre: td(), done: t.st === "완료" ? td() : null, repeat: t.repeat || "없음" };
    setTodosWithHistory((p: Todo[]) => [...p, newTodo]);
    return id;
  };

  // 삭제 이력 (localStorage에 최대 200건 보관)
  const [deletedLog, setDeletedLog] = useState<DeletedTodo[]>(() =>
    JSON.parse(localStorage.getItem("bgk_deleted_log") || "[]")
  );

  const delTodo = (id: number) => {
    // 삭제 전 업무 정보를 deletedLog에 기록
    setTodos(prev => {
      const target = prev.find(t => t.id === id);
      if (target) {
        const entry: DeletedTodo = { id: target.id, task: target.task, who: target.who, pid: target.pid, pri: target.pri, st: target.st, repeat: target.repeat, det: target.det, deletedAt: td() };
        setDeletedLog(prevLog => {
          const next = [...prevLog, entry].slice(-200);
          localStorage.setItem("bgk_deleted_log", JSON.stringify(next));
          return next;
        });
      }
      return prev;
    });
    setTodosWithHistory((p: Todo[]) => p.filter(t => t.id !== id));
    flash("업무가 삭제되었습니다", "err");
  };

  const filtered = useMemo(() => todos.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.task.toLowerCase().includes(q) || t.who.toLowerCase().includes(q) || gPr(t.pid).name.toLowerCase().includes(q))
      && (filters.proj.length === 0 || filters.proj.some(v => v === "__none__" ? gPr(t.pid).id === 0 : String(t.pid) === v))
      && (filters.st.length === 0 || filters.st.some(v => v === "__none__" ? !t.st : t.st === v))
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
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (!sortCol) return 0;
    let va: any, vb: any;
    if (sortCol === "id") { va = a.id; vb = b.id; }
    else if (sortCol === "pid") { va = gPr(a.pid).name; vb = gPr(b.pid).name; }
    else if (sortCol === "task") { va = a.task; vb = b.task; }
    else if (sortCol === "det") { va = stripHtml(a.det || ""); vb = stripHtml(b.det || ""); }
    else if (sortCol === "who") { va = a.who; vb = b.who; }
    else if (sortCol === "due") { va = a.due || "9999"; vb = b.due || "9999"; }
    else if (sortCol === "pri") { va = priOrder[a.pri] ?? 9; vb = priOrder[b.pri] ?? 9; }
    else if (sortCol === "st") { va = stOrder[a.st] ?? 9; vb = stOrder[b.st] ?? 9; }
    else if (sortCol === "repeat") { va = a.repeat || "없음"; vb = b.repeat || "없음"; }
    else return 0;
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  }), [filtered, sortCol, sortDir, projects]);
  const sortIcon = (col: string) => sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅";
  const visibleTodoIds = useMemo(() => sorted.filter(t => t.st !== "완료").map(t => t.id), [sorted]);
  const allVisibleSelected = visibleTodoIds.length > 0 && visibleTodoIds.every(id => selectedIds.has(id));
  const someVisibleSelected = visibleTodoIds.some(id => selectedIds.has(id));
  const toggleSelectAll = () => { if (allVisibleSelected) { clrSel(); } else { setSelectedIds(new Set(visibleTodoIds)); lastSelRef.current = null; } };
  const handleCheck = (id: number, shift: boolean) => {
    if (shift && lastSelRef.current !== null) {
      const ids = sorted.map(t => t.id);
      const a = ids.indexOf(lastSelRef.current), b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        setSelectedIds(prev => { const n = new Set(prev); ids.slice(lo, hi + 1).forEach(rid => n.add(rid)); return n; });
        lastSelRef.current = id;
        return;
      }
    }
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    lastSelRef.current = id;
  };
  const togF = (k: string, v: string) => {
    if (k === "__reset__") { setFilters({ proj: [], who: [], pri: [], st: [], repeat: [], fav: "" }); return; }
    if (k === "fav") { setFilters(f => ({ ...f, fav: f.fav ? "" : "1" })); return; }
    if (v === "") { setFilters(f => ({ ...f, [k]: [] })); return; }
    setFilters(f => { const arr = f[k as keyof Filters] as string[]; return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }; });
  };

  const calDate = () => new Date(calY, calM, calD);
  const setCalDate = (d: Date) => { setCalY(d.getFullYear()); setCalM(d.getMonth()); setCalD(d.getDate()); };
  const calToday = () => setCalDate(new Date());

  const calRangeDs = useMemo(() => {
    const base = new Date(calY, calM, calD);
    let s: string, e: string;
    if (calView === "week") { const ws = new Date(base); ws.setDate(ws.getDate() - ws.getDay()); const we = new Date(ws); we.setDate(we.getDate() + 6); s = dateStr(ws.getFullYear(), ws.getMonth(), ws.getDate()); e = dateStr(we.getFullYear(), we.getMonth(), we.getDate()); }
    else if (calView === "month") { s = `${calY}-01-01`; e = `${calY}-12-31`; }
    else if (calView === "agenda") { s = dateStr(calY, calM, calD); const ae = new Date(base); ae.setDate(ae.getDate() + 89); e = dateStr(ae.getFullYear(), ae.getMonth(), ae.getDate()); }
    else if (calView === "custom") { const ce = new Date(base); ce.setDate(ce.getDate() + customDays - 1); s = dateStr(base.getFullYear(), base.getMonth(), base.getDate()); e = dateStr(ce.getFullYear(), ce.getMonth(), ce.getDate()); }
    s = s! || dateStr(calY, calM, calD); e = e! || dateStr(calY, calM, calD);
    return { s, e };
  }, [calView, calY, calM, calD, customDays]);

  const ftodosBase = useMemo(() => todos.filter(t => (!calF || String(t.pid) === calF) && (!calFWho || t.who === calFWho)), [todos, calF, calFWho]);
  const ftodosExpanded = useMemo(() => expandRepeats(ftodosBase, calRangeDs.s, calRangeDs.e), [ftodosBase, calRangeDs]);

  const calNav = (dir: number) => {
    const d = calDate();
    if (calView === "day") d.setDate(d.getDate() + dir);
    else if (calView === "week") d.setDate(d.getDate() + dir * 7);
    else if (calView === "month") { d.setFullYear(d.getFullYear() + dir); d.setDate(1); }
    else if (calView === "custom") d.setDate(d.getDate() + dir * customDays);
    else if (calView === "agenda") d.setDate(d.getDate() + dir * 14);
    setCalDate(d);
  };
  const calDays = ["일", "월", "화", "수", "목", "금", "토"];
  const calTitle = () => {
    const d = calDate();
    if (calView === "day") return `${calY}년 ${calM + 1}월 ${calD}일 (${calDays[d.getDay()]})`;
    if (calView === "week") { const s = new Date(d); s.setDate(s.getDate() - s.getDay()); const e = new Date(s); e.setDate(e.getDate() + 6); return `${s.getMonth() + 1}/${s.getDate()} — ${e.getMonth() + 1}/${e.getDate()}, ${s.getFullYear()}`; }
    if (calView === "month") return `${calY}년 전체`;
    if (calView === "custom") return `${customDays}일 뷰`;
    return "일정 목록";
  };
  const todayStr = td();
  const weekDates = () => { const d = calDate(); const s = new Date(d); s.setDate(s.getDate() - s.getDay()); return Array.from({ length: 7 }, (_, i) => { const x = new Date(s); x.setDate(x.getDate() + i); return x; }); };
  const customDates = () => { const d = calDate(); return Array.from({ length: customDays }, (_, i) => { const x = new Date(d); x.setDate(x.getDate() + i); return x; }); };
  const agendaItems = () => { const d = calDate(); const items: any[] = []; for (let i = 0; i < 90; i++) { const x = new Date(d); x.setDate(x.getDate() + i); const ds = dateStr(x.getFullYear(), x.getMonth(), x.getDate()); const dayTodos = ftodosExpanded.filter(t => t.due && t.due.split(" ")[0] === ds); if (dayTodos.length) items.push({ date: x, ds, todos: dayTodos }); } return items; };
  const evStyle = (p: Project, repeat: string) => ({ fontSize: 10, padding: "2px 6px", borderRadius: 4, marginBottom: 1, cursor: "pointer", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: `3px solid ${p.color}`, background: repeat && repeat !== "없음" ? `${p.color}22` : `${p.color}15`, color: p.color, borderLeftStyle: repeat && repeat !== "없음" ? "dashed" : "solid" } as React.CSSProperties);

  const saveMod = (f: any) => {
    if (!f.task || !f.who) { alert("업무명과 담당자는 필수 항목입니다."); return; }
    if (f.id) { updTodo(parseInt(f.id), { pid: parseInt(f.pid), task: f.task, who: f.who, due: f.due, pri: f.pri, st: f.st, det: f.det, repeat: f.repeat || "없음" }); flash("변경사항이 저장되었습니다"); }
    else { addTodo({ pid: parseInt(f.pid), task: f.task, who: f.who, due: f.due, pri: f.pri, st: f.st, det: f.det, repeat: f.repeat || "없음" }); flash("업무가 등록되었습니다"); }
    setEditMod(null);
  };
  const addNR = () => setNewRows(r => [...r, { pid: "", task: "", who: currentUser || "", due: "", pri: "보통", det: "", repeat: "없음" }]);
  const isNREmpty = (r: NewRow) => !r.task && !r.pid && !r.who && !r.due && !r.det;
  const saveOneNR = (i: number) => { const r = newRows[i]; if (!r.task?.trim()) { flash("업무명을 입력해주세요", "err"); return; } addTodo({ pid: r.pid ? parseInt(r.pid) : 0, task: r.task.trim(), who: r.who || currentUser || "미배정", due: r.due || "", pri: r.pri || "보통", st: "대기", det: r.det || "", repeat: r.repeat || "없음" }); setNewRows(p => p.filter((_, j) => j !== i)); flash("업무가 등록되었습니다"); };
  const saveNRs = () => { if (savingNRs.current) return; const empty = newRows.filter(r => !r.task?.trim()); if (empty.length) { flash(`업무명이 비어 있는 항목이 ${empty.length}건 있습니다`, "err"); return; } const v = newRows.filter(r => r.task?.trim()); if (!v.length) { setNewRows([]); return; } savingNRs.current = true; v.forEach(r => addTodo({ pid: r.pid ? parseInt(r.pid) : 0, task: r.task.trim(), who: r.who || currentUser || "미배정", due: r.due || "", pri: r.pri || "보통", st: "대기", det: r.det || "", repeat: r.repeat || "없음" })); setNewRows([]); flash(`${v.length}건이 등록되었습니다`); setTimeout(() => { savingNRs.current = false; }, 300); };

  const parseAI = async () => {
    if (!apiKey) { setAiSt("API 키가 설정되지 않았습니다. 설정에서 먼저 저장해 주세요."); return; }
    if (!aiText.trim() && !aiFiles.length) return;
    setAiLoad(true); setAiSt("AI가 업무를 분석하고 있습니다...");
    try {
      const sysPrompt = `Task parser. Return ONLY a JSON array. Each item: {"task":string,"assignee":string or null,"due":"YYYY-MM-DD" or null,"priority":"보통"|"긴급"|"높음"|"낮음","project":string or null,"detail":string or null,"repeat":"없음"|"매일"|"매주"|"매월"}. @name=assignee. today=${td()}. projects:${aProj.map(p => p.name).join(",")}. members:${members.join(",")}.`;
      const contentParts: any[] = [];
      for (const f of aiFiles) {
        if (f.type.startsWith("image/")) {
          contentParts.push({ type: "image", source: { type: "base64", media_type: f.type, data: f.data } });
        } else if (f.type === "application/pdf") {
          contentParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
        } else if (f.textContent) {
          contentParts.push({ type: "text", text: `[첨부파일: ${f.name}]\n${f.textContent}` });
        }
      }
      contentParts.push({ type: "text", text: aiText.trim() ? `TODO추출:\n${aiText}` : "위 첨부파일에서 TODO 업무를 추출해주세요." });
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4096, stream: true, system: sysPrompt, messages: [{ role: "user", content: contentParts }] }) });
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(`API ${r.status}: ${(err as any).error?.message || ""}`); }
      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      let stopReason = "";
      let taskCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const ev = JSON.parse(data);
            if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
              raw += ev.delta.text;
              const cnt = (raw.match(/\{/g) || []).length;
              if (cnt !== taskCount) { taskCount = cnt; setAiSt(`AI 분석 중... (${taskCount}건 발견)`); }
            } else if (ev.type === "message_delta") {
              stopReason = ev.delta?.stop_reason || "";
            }
          } catch {}
        }
      }
      if (stopReason === "max_tokens") throw new Error("응답이 너무 길어 잘렸습니다. 파일을 나눠서 업로드해 보세요.");
      const jsonMatch = raw.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("JSON 배열을 찾을 수 없습니다");
      const parsed = JSON.parse(jsonMatch[0]); setAiParsed(parsed.map((t: any, i: number) => ({ ...t, _chk: true, _i: i }))); setAiSt(`ok:${parsed.length}건의 업무가 추출되었습니다`);
    } catch (e: any) { setAiSt(`err:분석 중 오류가 발생하였습니다: ${e.message}`); }
    setAiLoad(false);
  };

  // Reset guard when aiParsed clears (after confirmAI state flush)
  useEffect(() => { if (!aiParsed.length) confirmingAI.current = false; }, [aiParsed]);

  const confirmAI = () => {
    if (confirmingAI.current) return;
    const checked = aiParsed.filter(t => t._chk);
    if (!checked.length) return;
    confirmingAI.current = true;
    const startId = nIdRef.current;
    nIdRef.current += checked.length; setNId(nIdRef.current);
    setTodosWithHistory((prev: Todo[]) => [...prev, ...checked.map((t, i) => {
      const mp = aProj.find(p => t.project && p.name.includes(t.project));
      return { pid: mp ? mp.id : 0, task: t.task || "", who: t.assignee || "미배정", due: t.due || "", pri: t.priority || "보통", st: "대기", det: t.detail || "", repeat: t.repeat || "없음", id: startId + i, cre: td(), done: null };
    })]);
    setAiParsed([]); setAiText(""); setAiSt("");
    flash(`${checked.length}건이 AI를 통해 등록되었습니다`);
  };

  const addChip = () => {
    if (!chipVal.trim()) return; const v = chipVal.trim();
    if (chipAdd === "proj") { if (projects.some(p => p.name === v)) { flash(`프로젝트 "${v}"은(는) 이미 존재합니다`, "err"); return; } setProjectsGuarded((p: Project[]) => [...p, { id: pNId, name: v, color: chipColor, status: "활성" }]); setPNId(pNId + 1); flash(`프로젝트 "${v}"이(가) 추가되었습니다`); }
    else if (chipAdd === "who") { if (members.includes(v)) { flash(`담당자 "${v}"은(는) 이미 존재합니다`, "err"); return; } setMembersGuarded((p: string[]) => [...p, v]); flash(`담당자 "${v}"이(가) 추가되었습니다`); }
    else if (chipAdd === "pri") { if (!pris.includes(v)) { setPrisGuarded((p: string[]) => [...p, v]); setPriCGuarded((p: any) => ({ ...p, [v]: chipColor })); setPriBgGuarded((p: any) => ({ ...p, [v]: chipColor + "18" })); } flash(`우선순위 "${v}"이(가) 추가되었습니다`); }
    else if (chipAdd === "st") { if (!stats.includes(v)) { setStatsGuarded((p: string[]) => [...p, v]); setStCGuarded((p: any) => ({ ...p, [v]: chipColor })); setStBgGuarded((p: any) => ({ ...p, [v]: chipColor + "18" })); } flash(`상태 "${v}"이(가) 추가되었습니다`); }
    setChipVal(""); setChipAdd(null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
        e.preventDefault(); undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
        e.preventDefault(); redo();
      }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view !== "calendar") return;
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "1") setCalView("day"); else if (e.key === "2") setCalView("week"); else if (e.key === "3") setCalView("month"); else if (e.key === "4") setCalView("custom"); else if (e.key === "5") setCalView("agenda");
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [view]);

  return {
    // state
    projects, setProjects: setProjectsGuarded, todos, setTodos: setTodosWithHistory, nId, setNId, pNId, setPNId, loaded,
    members, setMembers: setMembersGuarded, pris, setPris: setPrisGuarded, stats, setStats: setStatsGuarded,
    priC, setPriC: setPriCGuarded, priBg, setPriBg: setPriBgGuarded, stC, setStC: setStCGuarded, stBg, setStBg: setStBgGuarded,
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
    clrSel, selAll, movePop, setMovePop, bulkPop, setBulkPop,
    historyRef, redoRef,
    // computed
    aProj, gPr, filtered, sorted, sortIcon,
    visibleTodoIds, allVisibleSelected, someVisibleSelected,
    ftodosExpanded, calRangeDs, todayStr, calDays,
    // handlers
    deletedLog,
    undo, redo, flash, forceFirestoreSync, updTodo, addTodo, delTodo,
    toggleSort, togF, handleCheck, toggleSelectAll,
    calDate, setCalDate, calToday, calNav, calTitle, weekDates, customDates, agendaItems, evStyle,
    saveMod, addNR, isNREmpty, saveOneNR, saveNRs,
    parseAI, confirmAI, addChip,
  };
}
