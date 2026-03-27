import { useState, useRef, useEffect, useMemo } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  INIT_MEMBERS, INIT_PRI, INIT_ST, INIT_PRI_C, INIT_PRI_BG, INIT_ST_C, INIT_ST_BG,
  PROJ_PALETTE, initTodos, initProj
} from "../constants";
import { td, gP, expandRepeats, dateStr, fmt2, stripHtml } from "../utils";
import { Filters, NewRow, AiParsed, DatePopState, NotePopupState, Project, Todo } from "../types";

export function useTodoApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const historyRef = useRef<Todo[][]>([]);
  const redoRef = useRef<Todo[][]>([]);
  const clientId = useRef(Math.random().toString(36).slice(2));
  const pendingWrite = useRef(false);
  const FS_DOC = useMemo(() => doc(db, "todos_db", "team"), []);
  const detHoverTimerRef = useRef<any>(null);
  const noteLeaveTimerRef = useRef<any>(null);

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
  const [filters, setFilters] = useState<Filters>({ proj: [], who: [], pri: [], st: [], repeat: [], fav: "" });
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
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState("asc");
  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const [kbF, setKbF] = useState("");
  const [kbFWho, setKbFWho] = useState("");
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
  const isFav = (id: number) => currentUser ? (userFavs[currentUser] || []).includes(id) : false;
  const toggleFav = (id: number) => {
    if (!currentUser) return;
    setUserFavs(prev => {
      const cur = prev[currentUser] || [];
      const next = cur.includes(id) ? cur.filter(v => v !== id) : [...cur, id];
      return { ...prev, [currentUser]: next };
    });
  };
  const [expandMode, setExpandMode] = useState(false);
  const [todoView, setTodoView] = useState<"list"|"memo">("list");
  const [memoCols, setMemoCols] = useState(3);
  const [showDone, setShowDone] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const lastSelRef = useRef<number | null>(null);
  const addSecRef = useRef<HTMLDivElement>(null);
  const tblDivRef = useRef<HTMLDivElement>(null);
  const selAll = (ids: number[]) => setSelectedIds(new Set(ids));
  const clrSel = () => setSelectedIds(new Set());
  const [movePop, setMovePop] = useState(false);

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

  const applyData = (d: any) => {
    if (d.todos?.length) setTodos(d.todos);
    if (d.projects?.length) setProjects(d.projects);
    if (d.nId) setNId(d.nId); if (d.pNId) setPNId(d.pNId);
    if (d.pris) setPris(d.pris); if (d.stats) setStats(d.stats);
    if (d.priC) setPriC(d.priC); if (d.priBg) setPriBg(d.priBg);
    if (d.stC) setStC(d.stC); if (d.stBg) setStBg(d.stBg);
    if (d.members?.length) setMembers(d.members.filter((m: string) => m !== "미배정"));
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("todo-v5");
      if (raw) { applyData(JSON.parse(raw)); }
      else { setTodos(initTodos as any); setProjects(initProj); }
    } catch (e) { setTodos(initTodos as any); setProjects(initProj); }
    setLoaded(true);

    const unsub = onSnapshot(FS_DOC, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d._clientId === clientId.current) return;
      if (pendingWrite.current) return;
      applyData(d);
      try { localStorage.setItem("todo-v5", JSON.stringify(d)); } catch (e) { }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (currentUser) localStorage.setItem("todo-current-user", currentUser);
    else localStorage.removeItem("todo-current-user");
  }, [currentUser]);

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
    const mk = (i: number, task: string, due: string, st: string, pri: string, det: string, progress: number) => ({ id: base + i, pid: newPid, task, who: "김대윤", due, pri, st, det, cre: "2026-03-27", done: st === "완료" ? "2026-03-27" : null, repeat: "없음", progress });
    setProjectsGuarded((prev: Project[]) => [...prev, { id: newPid, name: "2026 롯데백화점 동행 워크숍", color: "#ef4444", status: "활성" }]);
    setTodos(prev => [...prev.filter(t => !Array.isArray(t)), ...[
      mk(0,"참가사 선발 및 선발 공지","2026-03-06","진행중","긴급","최종 참가인원 체크 필수",50),
      mk(1,"롯데 호텔 담당자 인계","2026-03-06","완료","긴급","롯데호텔 관리 주체 확정 필요",100),
      mk(2,"롯데 호텔 추가 숙박 확보","2026-03-06","진행중","긴급","최종 객실: 80/61",50),
      mk(3,"[1차시] 직무 특강 1 연사 확정","2026-03-13","진행중","긴급","섭외비 확정, 숙소 및 항공 지원",50),
      mk(4,"[1차시] 직무 특강 2 연사 확정","2026-03-13","완료","긴급","이윤수, 조용헌, 환경재단 ESG 강사",100),
      mk(5,"[1차시] 명사 특강 연사 확정","2026-03-13","진행중","긴급","조용헌 교수님 항공권 발권 완료(272,000원)",50),
      mk(6,"[2차시] 직무 특강 1 연사 확정","2026-03-13","진행중","긴급","이윤수 강의 의뢰서 및 일정 체크 필요",50),
      mk(7,"[2차시] 직무 특강 2 연사 확정","2026-03-13","진행중","긴급","1차시와 동일",50),
      mk(8,"[2차시] 명사 특강 연사 확정","2026-03-13","진행중","긴급","1차시와 동일",50),
      mk(9,"[전체] 예산안 확정","2026-03-13","진행중","긴급","",50),
      mk(10,"[전체] 계약서 작성 및 선금 지급","2026-03-13","대기","긴급","",0),
      mk(11,"[2차시] 항공권 전달 및 발권","2026-03-24","진행중","긴급","",50),
      mk(12,"[1차시] 항공권 명단 전달 및 발권","2026-03-25","진행중","긴급","",50),
      mk(13,"[전체] 여행자보험 가입","2026-03-25","대기","긴급","",0),
      mk(14,"[전체] 레크레이션 상품 선정 및 구매","2026-03-27","완료","긴급","진행안함",100),
      mk(15,"[전체] 기념품 선정 및 구매","2026-03-27","진행중","긴급","시시호시 제주 전통술(3만원+@)",50),
      mk(16,"[전체] 제주도 사전 답사 및 호텔 미팅","2026-03-27","대기","긴급","03.23(월) 진행 예정",0),
      mk(17,"[전체] ESG 플로깅 프로그램 기획/확정","2026-03-27","진행중","긴급","장소 섭외, 지자체 협의, 스토리텔링 기획 필요",50),
      mk(18,"[전체] 해녀촌 기념품 체크","","대기","낮음","해녀촌 프로그램 취소, 성산일출봉/올레길로 변경",0),
      mk(19,"[전체] ESG 플로깅 현지 언론사 기사 초안","","대기","낮음","롯데백화점 작성",0),
      mk(20,"[전체] 플로깅 플랜B 수립","2026-03-27","진행중","긴급","우천시 선녀와나무꾼, 이너리스, 사려니 숲길",50),
      mk(21,"[1차시] 참석자 특이사항 수요조사","2026-04-10","대기","높음","식단, 알러지, 건강상태 조사",0),
      mk(22,"[2차시] 참석자 특이사항 수요조사","2026-04-10","대기","높음","체험 프로그램 분리 발송",0),
      mk(23,"[전체] 호텔 체크인 운영 방안 확정","2026-04-10","대기","높음","사전 체크인 후 현장 배부 예정",0),
      mk(24,"[전체] VIP 의전 체크","2026-04-10","완료","높음","모두 함께 버스 탑승",100),
      mk(25,"[전체] 연회장 레이아웃 구성","2026-04-10","대기","높음","크리스탈 볼룸 1,2,3 사용 / 무대 7.2M×3M",0),
      mk(26,"[전체] 브릿징·롯데백화점 인원별 R&R","2026-04-10","대기","높음","",0),
      mk(27,"[전체] 홍보물·기념품 사전 물류 배송","2026-04-10","대기","높음","행사 3~4일 전까지 호텔로 발송",0),
      mk(28,"[전체] 플로깅 키트 수령 및 호텔 발송","2026-04-10","대기","높음","롯데호텔 사전 협의 필요",0),
      mk(29,"[전체] 행사 브랜딩 홍보물 기획 및 출력","2026-04-10","대기","높음","명찰, 리플렛, 현수막, 버스 번호판 등",0),
      mk(30,"[전체] 안전 대책 수립","2026-04-10","대기","높음","병원 동선 파악, 구급약품 준비",0),
      mk(31,"[1차시] 참가사 안내문 발송","2026-04-17","대기","보통","일정표, 숙소, 준비물 안내",0),
      mk(32,"[2차시] 참가사 안내문 발송","2026-04-28","대기","보통","",0),
      mk(33,"[1차시] 호텔 예약 명단 확인 및 방 배정","","진행중","낮음","개인 사용분 개별 결제",50),
      mk(34,"[2차시] 호텔 예약 명단 확인 및 방 배정","","진행중","낮음","부문별 맞게 체험 프로그램 배정",50),
      mk(35,"롯데호텔 숙박·연회장 계약","","진행중","낮음","선금 입금 완료(3.16)",50),
      mk(36,"행사 키비주얼 제작 여부 확인","","완료","낮음","키비주얼 제작 완료(0313)",100),
      mk(37,"참가사 명단(출석체크용) 제작 - 파트너사","","대기","낮음","브릿징그룹 참가사명단 확인",0),
      mk(38,"참가사 명단(출석체크용) 제작 - 외주사","","대기","낮음","룸드롭 5,000원/객실",0),
      mk(39,"프로그램 일정표 수정 및 명찰용 스케쥴","","대기","낮음","명찰 뒤에 스케쥴표 인쇄",0),
      mk(40,"연회 음료 및 야식 준비","","대기","낮음","주류 영수증 처리 필요",0),
      mk(41,"헤드테이블 확인","","대기","낮음","VIP 및 파트너사 대표 좌석 지정",0),
    ]] as any);
    setNId(base + 42);
    setPNId(newPid + 1);
    localStorage.setItem("seed-lotte-2026", "1");
  }, [loaded]);

  const skipFirst = useRef(false);
  useEffect(() => {
    if (!loaded) return;
    if (!skipFirst.current) { skipFirst.current = true; return; }
    const t = setTimeout(() => {
      const data = { todos, projects, nId, pNId, pris, stats, priC, priBg, stC, stBg, members, _clientId: clientId.current };
      try { localStorage.setItem("todo-v5", JSON.stringify(data)); } catch (e) { }
      setDoc(FS_DOC, data).finally(() => { pendingWrite.current = false; });
    }, 400);
    return () => clearTimeout(t);
  }, [todos, projects, members, pris, stats, priC, priBg, stC, stBg, loaded]);

  const flash = (m: string, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast({ m: "", t: "" }), 2500); };
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
    const id = nId; setNId(nId + 1);
    const newTodo = { ...t, id, cre: td(), done: t.st === "완료" ? td() : null, repeat: t.repeat || "없음" };
    setTodosWithHistory((p: Todo[]) => [...p, newTodo]);
    return id;
  };

  const delTodo = (id: number) => {
    setTodosWithHistory((p: Todo[]) => p.filter(t => t.id !== id));
    flash("업무가 삭제되었습니다", "err");
  };

  const filtered = todos.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.task.toLowerCase().includes(q) || t.who.toLowerCase().includes(q) || gPr(t.pid).name.toLowerCase().includes(q))
      && (filters.proj.length === 0 || filters.proj.some(v => v === "__none__" ? gPr(t.pid).id === 0 : String(t.pid) === v))
      && (filters.st.length === 0 || filters.st.some(v => v === "__none__" ? !t.st : t.st === v))
      && (filters.pri.length === 0 || filters.pri.some(v => v === "__none__" ? !t.pri : t.pri === v))
      && (filters.who.length === 0 || filters.who.some(v => v === "__none__" ? !t.who : t.who === v))
      && (filters.repeat.length === 0 || filters.repeat.includes(t.repeat))
      && (!filters.fav || isFav(t.id));
  });

  const toggleSort = (col: string) => {
    if (sortCol === col) { if (sortDir === "asc") { setSortDir("desc") } else { setSortCol(null); setSortDir("asc") } }
    else { setSortCol(col); setSortDir("asc") }
  };
  const priOrder: Record<string, number> = { 긴급: 0, 높음: 1, 보통: 2, 낮음: 3 };
  const stOrder: Record<string, number> = { 대기: 0, 진행중: 1, 검토: 2, 완료: 3 };
  const sorted = [...filtered].sort((a, b) => {
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
  });
  const sortIcon = (col: string) => sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅";
  const visibleTodoIds = sorted.filter(t => t.st !== "완료").map(t => t.id);
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
    else if (calView === "month" || calView === "agenda") { s = `${calY}-${fmt2(calM + 1)}-01`; const ed = new Date(calY, calM + 4, 0); e = dateStr(ed.getFullYear(), ed.getMonth(), ed.getDate()); }
    else if (calView === "custom") { const ce = new Date(base); ce.setDate(ce.getDate() + customDays - 1); s = dateStr(base.getFullYear(), base.getMonth(), base.getDate()); e = dateStr(ce.getFullYear(), ce.getMonth(), ce.getDate()); }
    s = s! || dateStr(calY, calM, calD); e = e! || dateStr(calY, calM, calD);
    return { s, e };
  }, [calView, calY, calM, calD, customDays]);

  const ftodosBase = todos.filter(t => (!calF || String(t.pid) === calF) && (!calFWho || t.who === calFWho));
  const ftodosExpanded = useMemo(() => expandRepeats(ftodosBase, calRangeDs.s, calRangeDs.e), [ftodosBase, calRangeDs]);

  const calNav = (dir: number) => {
    const d = calDate();
    if (calView === "day") d.setDate(d.getDate() + dir);
    else if (calView === "week") d.setDate(d.getDate() + dir * 7);
    else if (calView === "month") { d.setMonth(d.getMonth() + dir); d.setDate(1); }
    else if (calView === "custom") d.setDate(d.getDate() + dir * customDays);
    else if (calView === "agenda") d.setDate(d.getDate() + dir * 14);
    setCalDate(d);
  };
  const calDays = ["일", "월", "화", "수", "목", "금", "토"];
  const calTitle = () => {
    const d = calDate();
    if (calView === "day") return `${calY}년 ${calM + 1}월 ${calD}일 (${calDays[d.getDay()]})`;
    if (calView === "week") { const s = new Date(d); s.setDate(s.getDate() - s.getDay()); const e = new Date(s); e.setDate(e.getDate() + 6); return `${s.getMonth() + 1}/${s.getDate()} — ${e.getMonth() + 1}/${e.getDate()}, ${s.getFullYear()}`; }
    if (calView === "month") return `${calY}년 ${calM + 1}월`;
    if (calView === "custom") return `${customDays}일 뷰`;
    return "일정 목록";
  };
  const todayStr = td();
  const weekDates = () => { const d = calDate(); const s = new Date(d); s.setDate(s.getDate() - s.getDay()); return Array.from({ length: 7 }, (_, i) => { const x = new Date(s); x.setDate(x.getDate() + i); return x; }); };
  const customDates = () => { const d = calDate(); return Array.from({ length: customDays }, (_, i) => { const x = new Date(d); x.setDate(x.getDate() + i); return x; }); };
  const agendaItems = () => { const d = calDate(); const items: any[] = []; for (let i = 0; i < 30; i++) { const x = new Date(d); x.setDate(x.getDate() + i); const ds = dateStr(x.getFullYear(), x.getMonth(), x.getDate()); const dayTodos = ftodosExpanded.filter(t => t.due === ds); if (dayTodos.length) items.push({ date: x, ds, todos: dayTodos }); } return items; };
  const evStyle = (p: Project, repeat: string) => ({ fontSize: 10, padding: "2px 6px", borderRadius: 4, marginBottom: 1, cursor: "pointer", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: `3px solid ${p.color}`, background: repeat && repeat !== "없음" ? `${p.color}22` : `${p.color}15`, color: p.color, borderLeftStyle: repeat && repeat !== "없음" ? "dashed" : "solid" } as React.CSSProperties);

  const saveMod = (f: any) => {
    if (!f.task || !f.pid || !f.who || !f.due) { alert("업무명, 프로젝트, 담당자, 마감일은 필수 항목입니다."); return; }
    if (f.id) { updTodo(parseInt(f.id), { pid: parseInt(f.pid), task: f.task, who: f.who, due: f.due, pri: f.pri, st: f.st, det: f.det, repeat: f.repeat || "없음" }); flash("변경사항이 저장되었습니다"); }
    else { addTodo({ pid: parseInt(f.pid), task: f.task, who: f.who, due: f.due, pri: f.pri, st: f.st, det: f.det, repeat: f.repeat || "없음" }); flash("업무가 등록되었습니다"); }
    setEditMod(null);
  };
  const addNR = () => setNewRows(r => [...r, { pid: "", task: "", who: "", due: "", pri: "보통", det: "", repeat: "없음" }]);
  const isNREmpty = (r: NewRow) => !r.task && !r.pid && !r.who && !r.due && !r.det;
  const saveOneNR = (i: number) => { const r = newRows[i]; if (!r.task?.trim()) { flash("업무명을 입력해주세요", "err"); return; } addTodo({ pid: r.pid ? parseInt(r.pid) : 0, task: r.task.trim(), who: r.who || "미배정", due: r.due || "", pri: r.pri || "보통", st: "대기", det: r.det || "", repeat: r.repeat || "없음" }); setNewRows(p => p.filter((_, j) => j !== i)); flash("업무가 등록되었습니다"); };
  const saveNRs = () => { const empty = newRows.filter(r => !r.task?.trim()); if (empty.length) { flash(`업무명이 비어 있는 항목이 ${empty.length}건 있습니다`, "err"); return; } const v = newRows.filter(r => r.task?.trim()); if (!v.length) { setNewRows([]); return; } v.forEach(r => addTodo({ pid: r.pid ? parseInt(r.pid) : 0, task: r.task.trim(), who: r.who || "미배정", due: r.due || "", pri: r.pri || "보통", st: "대기", det: r.det || "", repeat: r.repeat || "없음" })); setNewRows([]); flash(`${v.length}건이 등록되었습니다`); };

  const parseAI = async () => {
    if (!apiKey) { setAiSt("API 키가 설정되지 않았습니다. 설정에서 먼저 저장해 주세요."); return; }
    if (!aiText.trim()) return; setAiLoad(true); setAiSt("AI가 업무를 분석하고 있습니다...");
    try {
      const sysPrompt = `Task parser. Return ONLY a JSON array. Each item: {"task":string,"assignee":string or null,"due":"YYYY-MM-DD" or null,"priority":"보통"|"긴급"|"높음"|"낮음","project":string or null,"detail":string or null,"repeat":"없음"|"매일"|"매주"|"매월"}. @name=assignee. today=${td()}. projects:${aProj.map(p => p.name).join(",")}. members:${members.join(",")}.`;
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, system: sysPrompt, messages: [{ role: "user", content: `TODO추출:\n${aiText}` }] }) });
      if (!r.ok) throw new Error(`API ${r.status}`);
      const d = await r.json(); const raw = d.content.map((c: any) => c.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw); setAiParsed(parsed.map((t: any, i: number) => ({ ...t, _chk: true, _i: i }))); setAiSt(`ok:${parsed.length}건의 업무가 추출되었습니다`);
    } catch (e: any) { setAiSt(`err:분석 중 오류가 발생하였습니다: ${e.message}`); }
    setAiLoad(false);
  };

  const confirmAI = () => {
    const checked = aiParsed.filter(t => t._chk);
    if (!checked.length) return;
    const startId = nId;
    setNId(nId + checked.length);
    setTodosWithHistory((prev: Todo[]) => [...prev, ...checked.map((t, i) => {
      const mp = aProj.find(p => t.project && p.name.includes(t.project));
      return { pid: mp ? mp.id : 0, task: t.task || "", who: t.assignee || "미배정", due: t.due || "", pri: t.priority || "보통", st: "대기", det: t.detail || "", repeat: t.repeat || "없음", id: startId + i, cre: td(), done: null, progress: 0 };
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
    aiText, setAiText, aiLoad, aiSt, setAiSt, apiKey, setApiKey,
    aiParsed, setAiParsed, addTab, setAddTab,
    detPopup, setDetPopup, notePopup, setNotePopup,
    datePop, setDatePop, nrDatePop, setNrDatePop,
    hoverRow, setHoverRow, currentUser, setCurrentUser,
    userFavs, isFav, toggleFav,
    expandMode, setExpandMode, todoView, setTodoView, showDone, setShowDone, memoCols, setMemoCols,
    selectedIds, lastSelRef, addSecRef, tblDivRef,
    clrSel, selAll, movePop, setMovePop,
    historyRef, redoRef,
    // computed
    aProj, gPr, filtered, sorted, sortIcon,
    visibleTodoIds, allVisibleSelected, someVisibleSelected,
    ftodosExpanded, calRangeDs, todayStr, calDays,
    // handlers
    undo, redo, flash, updTodo, addTodo, delTodo,
    toggleSort, togF, handleCheck, toggleSelectAll,
    calDate, setCalDate, calToday, calNav, calTitle, weekDates, customDates, agendaItems, evStyle,
    saveMod, addNR, isNREmpty, saveOneNR, saveNRs,
    parseAI, confirmAI, addChip,
  };
}
