import { useState, useRef, useEffect, useMemo } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  INIT_MEMBERS, INIT_PRI, INIT_ST, INIT_PRI_C, INIT_PRI_BG, INIT_ST_C, INIT_ST_BG,
  initTodos, initProj
} from "../constants";
import { td, gP, stripHtml } from "../utils";
import { Filters, NewRow, AiParsed, DatePopState, NotePopupState, Project, Todo, DeletedTodo } from "../types";
import { useAI } from "./useAI";
import { useCalendar } from "./useCalendar";
import { useUserSettings } from "./useUserSettings";

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
    userSettings, setUserSettings,
  } = userSets;

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

  // 유저 전환 시 CRUD 상태 초기화 (설정 저장/복원은 useUserSettings에서 담당)
  useEffect(() => {
    setNewRows([]);
    historyRef.current = [];
    redoRef.current = [];
  }, [currentUser]);


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
  });

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

  const todayStr = td();

  // ── useCalendar: 캘린더 상태·로직 분리 ────────────────────────────────────
  const cal = useCalendar({ todos });

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
      if (e.key === "1") cal.setCalView("day"); else if (e.key === "2") cal.setCalView("week"); else if (e.key === "3") cal.setCalView("month"); else if (e.key === "4") cal.setCalView("custom"); else if (e.key === "5") cal.setCalView("agenda");
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [view]);

  return {
    // state
    projects, setProjects: setProjectsGuarded, todos, setTodos: setTodosWithHistory, nId, setNId, pNId, setPNId, loaded,
    members, setMembers: setMembersGuarded, pris, setPris: setPrisGuarded, stats, setStats: setStatsGuarded,
    priC, setPriC: setPriCGuarded, priBg, setPriBg: setPriBgGuarded, stC, setStC: setStCGuarded, stBg, setStBg: setStBgGuarded,
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
    selectedIds, lastSelRef, addSecRef, tblDivRef,
    clrSel, selAll, movePop, setMovePop, bulkPop, setBulkPop,
    historyRef, redoRef,
    // computed
    aProj, gPr, filtered, sorted, sortIcon,
    visibleTodoIds, allVisibleSelected, someVisibleSelected,
    todayStr,
    // handlers
    deletedLog,
    undo, redo, flash, forceFirestoreSync, updTodo, addTodo, delTodo,
    toggleSort, togF, handleCheck, toggleSelectAll,
    saveMod, addNR, isNREmpty, saveOneNR, saveNRs,
    addChip,
  };
}
