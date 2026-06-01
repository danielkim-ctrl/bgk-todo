import { useState, useRef, useEffect, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  subscribeMeta, subscribeTodos, subscribeTemplates, subscribeProjects,
  subscribeTeams, writeTeams as fsWriteTeams, cleanMetaTeamsField,
  writeTodo as fsWriteTodo, removeTodo as fsRemoveTodo,
  writeTodosBatch as fsWriteTodosBatch,
  writeTemplate as fsWriteTemplate, patchTemplate as fsPatchTemplate, removeTemplate as fsRemoveTemplate,
  writeMeta as fsWriteMeta,
  writeProject as fsWriteProject, removeProject as fsRemoveProject,
  writeProjectsBatch as fsWriteProjectsBatch,
  subscribeHidden, writeUserHidden as fsWriteUserHidden,
} from "../utils/firestoreSync";
import {
  INIT_MEMBERS, INIT_PRI, INIT_ST, INIT_PRI_C, INIT_PRI_BG, INIT_ST_C, INIT_ST_BG,
} from "../constants";
import { td, gP, stripHtml, isOD, getNextDue, fmtRepeatLabel, buildProjTeamMap } from "../utils";
import { flash } from "../utils/toast";
import { Filters, NewRow, AiParsed, DatePopState, NotePopupState, Project, Todo, DeletedTodo, SavedFilter, ActivityLog, Team, TeamMember, TeamRole, TodoTemplate, TemplateItem } from "../types";
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
  // 마지막으로 수신·적용한 서버 _updatedAt — 내 쓰기가 이 시점 이후에 만들어졌는지 검증용
  // (오래 열려 있던 탭/절전에서 깨어난 기기가 stale 상태를 서버에 덮어써서
  //  팀원 전체의 최신 todo가 사라지는 문제 방지)
  const lastSeenServerAt = useRef<number>(0);
  const FS_DOC = useMemo(() => doc(db, "todos_db", "team"), []);
  const detHoverTimerRef = useRef<any>(null);
  const noteLeaveTimerRef = useRef<any>(null);
  const savingNRs = useRef(false);
  // 삭제 등 즉각 반영이 필요한 작업 후 디바운스 없이 즉시 저장하기 위한 플래그
  const immediateFlush = useRef(false);

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

  // currentUser를 항상 최신으로 추적하는 ref.
  // subscribeMeta 등 mount 시 1회만 등록되는 구독 콜백은 빈 deps([])라
  // currentUser를 클로저로 잡으면 로그인 전 stale 값(빈 값)에 고정된다.
  // 그 결과 applyData의 "현재 사용자 설정(selectedTeamId/sidebarOrder) 로컬 우선" 보호가
  // 절대 매칭되지 않아 서버 echo로 되돌아가는 버그가 발생 → ref로 항상 실제 로그인 사용자를 본다.
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

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
    // 어떤 사용자가 이 스냅샷을 생성했는지 기록 — undo/redo 시 본인 작업만 되돌리기 위함
    owner?: string;
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
  // owner를 넘기면 해당 사용자의 todos만 스냅샷으로 교체 — 타 사용자 todos는 현재 상태 유지
  const restoreSnapshot = (snap: AppSnapshot, owner?: string) => {
    // Phase 2-3: Firestore 서브컬렉션에도 diff 동기화 — undo/redo가 다른 기기에 반영되도록
    // owner 모드: 자기 todos만 변경 (타 사용자 변경 보호)
    const currentTodos = todos;
    const snapMyTodos = owner
      ? snap.todos.filter(t => (t.logs?.[0]?.who || "") === owner)
      : snap.todos;
    const currentMyTodos = owner
      ? currentTodos.filter(t => (t.logs?.[0]?.who || "") === owner)
      : currentTodos;
    const snapIds = new Set(snapMyTodos.map(t => t.id));
    // snapshot에 있는 모든 자기 todos를 server에 다시 쓰기 (이전 상태 복원)
    snapMyTodos.forEach(t => {
      fsWriteTodo(t).catch(e => console.warn("[SYNC] undo writeTodo 실패:", e));
    });
    // 현재에는 있는데 snapshot에 없는 자기 todos는 server에서 삭제
    currentMyTodos.filter(t => !snapIds.has(t.id)).forEach(t => {
      fsRemoveTodo(t.id).catch(e => console.warn("[SYNC] undo removeTodo 실패:", e));
    });

    // projects도 서브컬렉션 diff 동기화 (undo/redo가 다른 기기에 반영되도록)
    const snapProjIds = new Set(snap.projects.map(p => p.id));
    snap.projects.forEach(p => {
      fsWriteProject(p).catch(e => console.warn("[SYNC] undo writeProject 실패:", e));
    });
    projects.filter(p => !snapProjIds.has(p.id)).forEach(p => {
      fsRemoveProject(p.id).catch(e => console.warn("[SYNC] undo removeProject 실패:", e));
    });

    if (owner) {
      setTodos((current: Todo[]) => {
        const othersTodos = current.filter((t: Todo) => (t.logs?.[0]?.who || "") !== owner);
        const myTodosAtSnapshot = snap.todos.filter((t: Todo) => (t.logs?.[0]?.who || "") === owner);
        return [...othersTodos, ...myTodosAtSnapshot];
      });
    } else {
      setTodos(snap.todos);
    }
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
    // 현재 사용자를 owner로 기록 — undo/redo 시 본인 작업만 되돌리기 위함
    const snap = takeSnapshot();
    snap.owner = currentUser || "";
    historyRef.current = [...historyRef.current.slice(-49), snap];
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
  // setProjectsGuarded — 로컬 state 업데이트 + diff 계산 후 Firestore 서브컬렉션에 개별 쓰기/삭제
  // todo와 동일한 패턴: 로컬 state를 먼저 반영하고 Firestore에 비동기 저장.
  // subscribeProjects snapshot이 오면 그냥 setProjects — 어차피 내가 방금 쓴 데이터라 동일함.
  // 카운터 기반 가드 제거 — 타이밍 race가 더 위험했음.
  const setProjectsGuarded = (fn: any) => {
    guard(); // pendingWrite=true로 Firestore echo가 로컬 변경을 덮어쓰는 것 차단
    pushHistory();
    const prev = projects;
    const next = typeof fn === "function" ? fn(prev) : fn;
    setProjects(next);
    // diff 계산 후 변경된 것만 Firestore에 개별 동기화
    const prevMap = new Map(prev.map(p => [p.id, p]));
    const nextMap = new Map(next.map((p: Project) => [p.id, p]));
    next.forEach((p: Project) => {
      const old = prevMap.get(p.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(p)) {
        fsWriteProject(p).catch(e => console.warn("[SYNC] writeProject 실패:", e));
      }
    });
    prev.forEach(p => {
      if (!nextMap.has(p.id)) {
        fsRemoveProject(p.id).catch(e => console.warn("[SYNC] removeProject 실패:", e));
      }
    });
  };
  const setMembersGuarded = (fn: any) => { guard(); pushHistory(); setMembers(fn); };
  const setPrisGuarded = (fn: any) => { guard(); pushHistory(); setPris(fn); };
  const setStatsGuarded = (fn: any) => { guard(); pushHistory(); setStats(fn); };
  const setPriCGuarded = (fn: any) => { guard(); pushHistory(); setPriC(fn); };
  const setPriBgGuarded = (fn: any) => { guard(); pushHistory(); setPriBg(fn); };
  const setStCGuarded = (fn: any) => { guard(); pushHistory(); setStC(fn); };
  const setStBgGuarded = (fn: any) => { guard(); pushHistory(); setStBg(fn); };
  const setMemberColorsGuarded = (fn: any) => { guard(); pushHistory(); setMemberColors(fn); };
  // hiddenProjects/hiddenMembers 변경 시 guard() 호출 — Firestore echo가 즉시 덮어쓰는 것 차단
  const setUserSettingsGuarded = (fn: any) => { guard(); setUserSettings(fn); };

  // 숨김 상태 즉시 Firestore 저장 — todo와 동일하게 debounce 없이 바로 반영
  // 토글한 사용자의 hiddenProjects/hiddenMembers 최신 값을 받아 별도 hidden 문서에 기록
  const flushHidden = (userId: string, hiddenProjects: number[], hiddenMembers: string[]) => {
    fsWriteUserHidden(userId, hiddenProjects, hiddenMembers, clientId.current)
      .catch(e => console.warn("[SYNC] hidden 저장 실패:", e));
  };

  // 배열에서 조건에 맞는 마지막 인덱스를 찾는 헬퍼 — ES2023 findLastIndex 대체
  const findLastIdx = (arr: AppSnapshot[], pred: (s: AppSnapshot) => boolean) => {
    for (let i = arr.length - 1; i >= 0; i--) { if (pred(arr[i])) return i; }
    return -1;
  };

  // 본인이 만든 스냅샷만 되돌리기 — 타 사용자의 작업은 건드리지 않음
  const undo = () => {
    const me = currentUser || "";
    // 히스토리 스택에서 현재 사용자의 마지막 스냅샷을 찾음
    const idx = findLastIdx(historyRef.current, s => s.owner === me);
    if (idx < 0) return;
    const snap = historyRef.current[idx];
    // 해당 스냅샷을 히스토리에서 제거
    historyRef.current.splice(idx, 1);
    // 현재 상태를 redo 스택에 저장 (owner 유지)
    const redoSnap = takeSnapshot();
    redoSnap.owner = me;
    redoRef.current = [...redoRef.current.slice(-49), redoSnap];
    guard();
    restoreSnapshot(snap, me);
    flash("이전 상태로 복원되었습니다");
  };

  const redo = () => {
    const me = currentUser || "";
    // redo 스택에서 현재 사용자의 마지막 스냅샷을 찾음
    const idx = findLastIdx(redoRef.current, s => s.owner === me);
    if (idx < 0) return;
    const snap = redoRef.current[idx];
    // 해당 스냅샷을 redo에서 제거
    redoRef.current.splice(idx, 1);
    // 현재 상태를 history 스택에 저장 (owner 유지)
    const histSnap = takeSnapshot();
    histSnap.owner = me;
    historyRef.current = [...historyRef.current.slice(-49), histSnap];
    guard();
    restoreSnapshot(snap, me);
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
  // teamNId를 ref로도 관리 — teams useEffect deps에서 teamNId를 제거해 불필요한 루프 차단
  const teamNIdRef = useRef(1);
  // 현재 선택된 팀 (null = 전체 보기)
  const [selectedTeamId, setSelectedTeamIdRaw] = useState<string | null>(null);
  // 마지막으로 복원한 값 추적 — 사용자 변경 또는 Firestore userSettings 로드 시 복원
  // 같은 값으로 반복 복원하지 않아 무한 루프 방지
  const lastRestoredTeamIdRef = useRef<{ user: string | null; value: string | null | undefined }>({ user: null, value: undefined });
  // 멤버별 역할 — 팀 소속과 독립적으로 관리 (팀 미배정이어도 역할 설정 가능)
  const [memberRoles, setMemberRoles] = useState<Record<string, TeamRole>>({});
  // 멤버별 6자리 PIN 코드 — 로그인 인증용 (Firestore에 저장)
  const [memberPins, setMemberPins] = useState<Record<string, string>>({});
  // 전역 역할별 권한 — 모든 팀에 일괄 적용 (미설정 시 TEAM_ROLE_PERMISSIONS 기본값)
  const [globalPermissions, setGlobalPermissions] = useState<Record<TeamRole, string[]> | null>(null);
  // ── 업무 템플릿 — 반복 업무 묶음을 저장해두고 재사용 ──
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [tplNId, setTplNId] = useState(1); // 템플릿 ID 자동 증가용
  // 템플릿 즐겨찾기 — 사용자별 개인 설정 (localStorage 저장)
  const [tplFavs, setTplFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`tpl-favs-${currentUser}`) || "[]"); } catch { return []; }
  });
  // 즐겨찾기 변경 시 localStorage에 저장
  useEffect(() => {
    if (currentUser) localStorage.setItem(`tpl-favs-${currentUser}`, JSON.stringify(tplFavs));
  }, [tplFavs, currentUser]);

  // 6자리 PIN 생성 함수
  const generatePin = () => String(Math.floor(100000 + Math.random() * 900000));

  const [view, setView] = useState("list");
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
  // 이름 정규화 — 한글·영문·숫자만 남기고 공백 포함 모든 비문자 제거 + NFC
  // 한국어 이름에 공백이 없으므로 공백도 제거하여 "정영운" vs "정 영운" 중복 방지
  const normName = (s: string | undefined | null) => (s || "").normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "");
  const normalizeTodos = (todos: any[]) => {
    const seen = new Set<number>();
    let maxId = 0;
    return todos.map(t => {
      // 기존 string → string[] 자동 마이그레이션 + 배열 내 각 이름 정규화
      const rawWho = typeof t.who === "string" ? [t.who].filter(Boolean) : (Array.isArray(t.who) ? t.who : []);
      const nWho = rawWho.map((w: string) => normName(w)).filter(Boolean);
      const whoChanged = JSON.stringify(nWho) !== JSON.stringify(t.who);
      const base = VALID_ST.includes(t.st)
        ? (whoChanged ? { ...t, who: nWho } : t)
        : { ...t, st: "대기", ...(whoChanged ? { who: nWho } : {}) };
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
          const prevMap = new Map(prev.map(t => [t.id, t]));
          const remoteIds = new Set(fixed.map((t: any) => t.id));
          // 로컬에만 있는 업무 보존 (미저장 새 업무 등)
          const localOnly = prev.filter(t => !remoteIds.has(t.id));
          // 양쪽에 모두 있는 업무: 로그 타임스탬프 기준으로 더 최신 버전 유지
          // — 타 멤버가 구버전 데이터로 저장해도 내가 완료처리한 업무가 되돌아가지 않도록 보호
          const merged = fixed.map((remote: any) => {
            const local = prevMap.get(remote.id);
            if (!local) return remote;
            const localLastAt = local.logs?.[local.logs.length - 1]?.at || local.cre || "";
            const remoteLastAt = remote.logs?.[remote.logs.length - 1]?.at || remote.cre || "";
            return localLastAt >= remoteLastAt ? local : remote;
          });
          return normalizeTodos([...merged, ...localOnly]);
        });
      } else {
        setTodos(fixed);
      }
      const maxId = fixed.reduce((m: number, t: any) => t.id > m ? t.id : m, 0);
      if (maxId >= nIdRef.current) { nIdRef.current = maxId + 1; setNId(maxId + 1); }
    }
    // projects는 서브컬렉션 subscribeProjects에서 별도 수신 — 이 경로 제거
    // 다만 forceFirestoreSync(레거시 단일 문서 복원)에서는 마이그레이션 용도로 직접 setProjects 가능
    if (d.nId && d.nId > nIdRef.current) { setNId(d.nId); nIdRef.current = d.nId; }
    // pNId는 더 이상 meta에 저장 안 함 — subscribeProjects에서 max(id)+1로 자동 보정
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
      // 이름 정규화(normName) + 중복 제거 — 제로 폭 문자·유니코드·공백 차이 해소
      const raw = (d.members as string[]).filter((m: string) => m && m !== "미배정");
      const rm = [...new Set(raw.map((m: string) => normName(m)))];
      if (raw.length !== rm.length) console.warn(`[FIX] members 중복 ${raw.length - rm.length}건 제거됨:`, raw.length, "→", rm.length);
      // 원격 우선(remote-wins) — 멀티탭/멀티클라이언트 환경에서 한쪽의 삭제가
      // 다른 탭의 stale 로컬 상태와 union merge되어 "삭제한 멤버가 되살아나는" 현상 방지.
      // 멤버 목록은 동시 편집이 드물어 최신 스냅샷 그대로 적용하는 편이 안전.
      setMembers(rm);
    }
    // 팀·역할·권한·PIN 데이터 복원
    if (d.globalPermissions) setGlobalPermissions(d.globalPermissions);
    if (d.sharedApiKey) sharedApiKeyRef.current = d.sharedApiKey;
    // PIN 복원 — 있으면 그대로 복원 (없으면 아래 useEffect에서 마이그레이션)
    if (d.memberPins && Object.keys(d.memberPins).length > 0) {
      setMemberPins(d.memberPins);
    }
    // teams/teamNId는 meta/teams 독립 문서에서 별도 수신 — applyData 경로에서 완전 제외
    // (meta/main 변경과 teams 변경이 같은 setDoc을 공유할 때 발생하는 롤백 race 근본 차단)
    if (d.memberRoles && Object.keys(d.memberRoles).length > 0) {
      setMemberRoles(d.memberRoles);
    }
    // 업무 템플릿 복원
    if (d.templates) setTemplates(d.templates);
    if (d.tplNId) setTplNId(d.tplNId);
    if (d.userSettings) {
      // hiddenProjects/hiddenMembers는 별도 hidden 문서가 source of truth
      // 현재 사용자의 selectedTeamId/sidebarOrder도 로컬 우선 — meta echo로 되돌아가는 race 차단
      setUserSettings(prev => {
        const next: any = { ...d.userSettings };
        for (const uid of Object.keys(next)) {
          const local = prev[uid];
          if (!local) continue;
          next[uid] = {
            ...next[uid],
            hiddenProjects: local.hiddenProjects ?? next[uid].hiddenProjects ?? [],
            hiddenMembers: local.hiddenMembers ?? next[uid].hiddenMembers ?? [],
            // 현재 사용자: selectedTeamId/sidebarOrder는 로컬이 항상 최신 (drag-drop reorder 보호)
            // currentUserRef 사용 — 이 콜백은 mount 시 stale currentUser를 잡으므로 ref로 실제 로그인 사용자 비교
            // (칸반 순서는 todo.order 필드로 이전됨 — 더 이상 userSettings에 저장하지 않음)
            ...(uid === currentUserRef.current ? {
              selectedTeamId: local.selectedTeamId,
              sidebarOrder: local.sidebarOrder?.length ? local.sidebarOrder : (next[uid].sidebarOrder ?? []),
            } : {}),
          };
        }
        return next;
      });
    }
  };

  useEffect(() => {
    let unsubs: Array<() => void> = [];
    let cancelled = false;
    let metaReceived = false;
    let todosReceived = false;
    // meta와 todos 구독이 모두 첫 데이터를 받은 후에만 loaded=true 설정
    const markLoadedIfReady = () => {
      if (metaReceived && todosReceived && !cancelled) setLoaded(true);
    };

    // 마이그레이션 — projects를 meta에서 서브컬렉션으로 이전 + 데이터 손실 방지 폴백
    // 핵심 안전망:
    // 1. meta.projects는 여전히 server에 백업으로 보존 (meta save에 포함)
    // 2. 첫 meta fire에서 무조건 setProjects(meta.projects) — rules 미배포로 subscribeProjects가
    //    permission-denied로 실패해도 사용자가 프로젝트 못 보는 사태 방지
    // 3. subscribeProjects가 정상 fire하면 그 데이터가 우선 (subcollection이 source of truth)
    let metaProjectsApplied = false;
    let projectsReceived = false;
    const checkProjectsMigration = (metaProjects: Project[] | null, subCollCount: number | null) => {
      if (metaProjects === null || subCollCount === null) return;
      if (subCollCount === 0 && metaProjects.length > 0) {
        console.log(`[MIGRATION] meta.projects → projects 서브컬렉션 ${metaProjects.length}건 이전 시도`);
        fsWriteProjectsBatch(metaProjects)
          .then(() => console.log("[MIGRATION] projects 마이그레이션 완료"))
          .catch(e => console.warn("[MIGRATION] projects 실패 (rules 미배포 가능):", e));
      }
    };

    let teamsReceived = false; // subscribeTeams가 meta/teams 문서를 정상 수신했는지
    let teamsMigrationDone = false; // meta/main → meta/teams 마이그레이션 one-shot 플래그

    // meta 구독 — 설정류 applyData 경로 재사용
    unsubs.push(subscribeMeta((data) => {
      if (cancelled) return;
      // meta.projects 폴백 — subscribeProjects가 아직 응답하지 않았고 meta에 데이터가 있을 때만
      if (!metaProjectsApplied && !projectsReceived && Array.isArray(data.projects) && data.projects.length > 0) {
        setProjects(data.projects);
        const maxPid = data.projects.reduce((m: number, p: Project) => p.id > m ? p.id : m, 0);
        setPNId(prev => prev > maxPid ? prev : maxPid + 1);
        metaProjectsApplied = true;
        checkProjectsMigration(data.projects, 0);
      }
      // teams 폴백 — subscribeTeams가 아직 meta/teams를 못 받은 경우에만 meta/main의 teams 사용
      // teamsReceived=true이면 meta/teams가 source of truth이므로 meta/main의 teams는 무시
      // teamsMigrationDone 플래그로 마이그레이션 쓰기를 1회로 제한 — subscribeMeta 반복 발동 시 loop 차단
      if (!teamsReceived && !teamsMigrationDone && Array.isArray(data.teams) && data.teams.length > 0) {
        teamsMigrationDone = true;
        teamsFromServer.current = true; // echo 방지 — 이 setTeams는 쓰기로 이어지지 않아야 함
        setTeams(data.teams);
        if (data.teamNId) { teamNIdRef.current = data.teamNId; setTeamNId(data.teamNId); }
        // meta/teams 문서가 없으면 마이그레이션 — 완료 후 meta/main의 teams 필드 제거
        fsWriteTeams(data.teams, data.teamNId ?? 1)
          .then(() => cleanMetaTeamsField()) // meta/main의 stale teams 필드 제거 → 이후 subscribeMeta가 teams 없는 문서를 받음
          .catch(e => console.warn("[MIGRATION] teams 마이그레이션 실패:", e));
      }
      if (pendingWrite.current) return;
      const isOwnEcho = metaReceived && data._clientId === clientId.current;
      if (!isOwnEcho) {
        // projects/teams는 독립 경로에서 별도 수신 — meta 경로에서 완전 제외
        applyData({ ...data, todos: undefined, templates: undefined, projects: undefined, teams: undefined }, true);
      }
      if (typeof data._updatedAt === "number") lastSeenServerAt.current = data._updatedAt;
      metaReceived = true;
      markLoadedIfReady();
    }));

    // todos 구독 — 서브컬렉션 전체를 배열로 수신
    unsubs.push(subscribeTodos((todos) => {
      if (cancelled) return;
      const fixed = normalizeTodos(todos);
      setTodos(fixed);
      const maxId = fixed.reduce((m: number, t: any) => (t.id > m ? t.id : m), 0);
      if (maxId >= nIdRef.current) {
        nIdRef.current = maxId + 1;
        setNId(maxId + 1);
      }
      todosReceived = true;
      markLoadedIfReady();
    }));

    // templates 구독 — 서브컬렉션에서 실시간으로 수신
    unsubs.push(subscribeTemplates((tpls) => {
      if (cancelled) return;
      setTemplates(tpls);
    }));

    // hidden 구독 — 사용자별 hiddenProjects/hiddenMembers 즉시 동기화 (todo와 동일 패턴)
    // 자기 echo는 _clientId로 차단, 다른 기기의 변경은 즉시 수용
    unsubs.push(subscribeHidden((data) => {
      if (cancelled) return;
      setUserSettings(prev => {
        const next: any = { ...prev };
        for (const [uid, entry] of Object.entries(data || {})) {
          const e = entry as any;
          // 자기 자신의 echo는 무시 — 로컬 state가 이미 최신
          if (e._clientId === clientId.current) continue;
          next[uid] = {
            ...(next[uid] || { sidebarOrder: [], starredIds: [], hiddenProjects: [], hiddenMembers: [] }),
            hiddenProjects: e.hiddenProjects ?? [],
            hiddenMembers: e.hiddenMembers ?? [],
          };
        }
        return next;
      });
    }));

    // projects 구독 — todo와 동일한 패턴: snapshot 오면 그냥 setProjects
    // 비어 있으면 setProjects 건너뜀 (meta.projects 폴백 보존). 데이터 있으면 subscription 데이터 우선.
    unsubs.push(subscribeProjects((projs) => {
      if (cancelled) return;
      projectsReceived = true;
      if (projs.length === 0) return; // 빈 상태면 meta 폴백 그대로 유지
      // 원격 데이터의 중복 ID 제거
      const deduped = projs.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
      setProjects(deduped);
      // pNId 보정 — 기존 max(id)보다 작아진 경우 다음 추가 시 ID 충돌 방지
      const maxPid = deduped.reduce((m, p) => p.id > m ? p.id : m, 0);
      setPNId(prev => prev > maxPid ? prev : maxPid + 1);
    }));

    // teams 독립 문서 구독 — 서버에서 확정된 데이터만 수신
    unsubs.push(subscribeTeams((data) => {
      if (cancelled) return;
      if (data === null) return;
      teamsReceived = true;
      // 사용자가 방금 변경한 직후라면 서버 snapshot 무시 — 구버전 덮어쓰기 방지
      if (Date.now() < ignoreSnapshotUntil.current) {
        console.log("[TEAMS SNAPSHOT] 차단됨 — 사용자 변경 직후 보호 구간");
        return;
      }
      const cleaned = (data.teams as Team[]).map(t => {
        const seenMembers = new Set<string>();
        const dedupedMembers = (t.members || [])
          .map(m => ({ ...m, name: normName(m.name) }))
          .filter(m => { if (seenMembers.has(m.name)) return false; seenMembers.add(m.name); return true; });
        return { ...t, members: dedupedMembers, projectIds: t.projectIds || [] };
      });
      teamsFromServer.current = true;
      setTeams(cleaned);
      if (data.teamNId) { teamNIdRef.current = data.teamNId; setTeamNId(data.teamNId); }
    }));

    // 10초 타임아웃 가드 — meta 또는 todos 수신 실패 시 강제로 loaded=true
    // (인증 문제·네트워크 오류로 영원히 로딩 스피너 도는 것 방지)
    const timeoutId = setTimeout(() => {
      if (!metaReceived || !todosReceived) {
        console.warn("[SYNC] 10초 내 데이터 미수신 — loaded 강제 true");
        if (!cancelled) setLoaded(true);
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      unsubs.forEach((u) => u());
    };
  }, []);

  // 유저 전환 시 CRUD 상태 초기화 (설정 저장/복원은 useUserSettings에서 담당)
  useEffect(() => {
    setNewRows([]);
    historyRef.current = [];
    redoRef.current = [];
  }, [currentUser]);

  // selectedTeamId 사용자별 Firestore 동기화 — 한 기기에서 선택한 팀이 다른 기기에도 자동 반영
  // userSettings는 Firestore에 사용자별로 저장되므로 기기 무관하게 사람 정체성 따라감
  useEffect(() => {
    if (!currentUser) return;
    const saved = userSettings[currentUser]?.selectedTeamId;
    const last = lastRestoredTeamIdRef.current;
    // 같은 사용자·같은 값으로 이미 복원했으면 재설정 안 함 — meta snapshot 반복 도착 시 루프 방지
    if (last.user === currentUser && last.value === saved) return;
    // 현재 표시 중인 selectedTeamId와도 같으면 state 업데이트 불필요
    if (saved === selectedTeamId || (saved === undefined && selectedTeamId === null)) return;
    lastRestoredTeamIdRef.current = { user: currentUser, value: saved };
    setSelectedTeamIdRaw(saved ?? null);
  }, [currentUser, userSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Firestore에서 hiddenProjects/hiddenMembers가 복원되면 localStorage도 갱신 — 기기 간 동기화 완성
  useEffect(() => {
    if (!currentUser) return;
    const entry = userSettings[currentUser];
    if (!entry) return;
    if (entry.hiddenProjects !== undefined) {
      localStorage.setItem(`hidden-projects-${currentUser}`, JSON.stringify(entry.hiddenProjects));
    }
    if (entry.hiddenMembers !== undefined) {
      localStorage.setItem(`hidden-members-${currentUser}`, JSON.stringify(entry.hiddenMembers));
    }
  }, [currentUser, userSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  // 변경 시 userSettings에 저장 — immediateFlush로 디바운스 없이 즉시 setDoc
  // (다른 자동 setDoc과의 race로 사용자 선택이 묻히는 현상 방지)
  const setSelectedTeamId = (id: string | null) => {
    setSelectedTeamIdRaw(id);
    if (currentUser) {
      immediateFlush.current = true;
      setUserSettings(prev => ({
        ...prev,
        [currentUser]: {
          ...(prev[currentUser] || { sidebarOrder: [], starredIds: [], hiddenProjects: [], hiddenMembers: [] }),
          selectedTeamId: id,
        },
      }));
      lastRestoredTeamIdRef.current = { user: currentUser, value: id };
    }
  };

  // 자동 복구 안전망 제거 — Phase 2-3 + 단일 문서 쓰기 차단 후 불필요하고 유해.
  // 기존 코드는 단일 문서에 setDoc 호출 → legacy 데이터 사이클을 영속화시킴.


  const skipFirst = useRef(false);
  const skipFirstTeams = useRef(false);
  // 서버(또는 delayed echo)에서 온 데이터로 setTeams된 경우 — useEffect 쓰기 건너뜀
  const teamsFromServer = useRef(false);
  // stale closure 방지 — addTeamProject 등에서 항상 최신 teams를 참조
  const latestTeamsRef = useRef<Team[]>([]);
  // 사용자가 팀 변경 직후 일정 시간 동안 서버 snapshot으로 덮어쓰기 차단
  // fsWriteTeams 완료 후 Firestore가 보내는 snapshot이 구버전일 수 있음
  const ignoreSnapshotUntil = useRef<number>(0);

  // meta 저장 — todos·templates·projects·teams는 개별 경로에서 별도 저장
  useEffect(() => {
    if (!loaded) return;
    if (!skipFirst.current) { skipFirst.current = true; return; }
    pendingWrite.current = true;
    const delay = immediateFlush.current ? 0 : 400;
    immediateFlush.current = false;
    const t = setTimeout(() => {
      // userSettings에서 hiddenProjects/hiddenMembers 제외 — 별도 hidden 문서가 source of truth
      // (meta debounce + 다른 필드 변경과의 race로 숨김 상태가 flicker하던 문제 해결)
      const cleanedUserSettings: any = {};
      for (const [uid, s] of Object.entries(userSettings)) {
        const { hiddenProjects: _hp, hiddenMembers: _hm, ...rest } = (s as any) || {};
        cleanedUserSettings[uid] = rest;
      }
      const meta = {
        nId, pNId, pris, stats, priC, priBg, stC, stBg,
        members, memberColors, memberRoles, memberPins, globalPermissions,
        tplNId,
        sharedApiKey: sharedApiKeyRef.current,
        userSettings: cleanedUserSettings,
        _clientId: clientId.current,
      };
      fsWriteMeta(meta)
        .catch((e) => {
          console.warn("[SYNC] meta 저장 실패:", e);
          flash("설정 저장 실패 — 네트워크를 확인하세요", "err");
        })
        .finally(() => { pendingWrite.current = false; });
    }, delay);
    return () => clearTimeout(t);
  }, [nId, pNId, members, pris, stats, priC, priBg, stC, stBg, memberColors, memberRoles, memberPins, globalPermissions, tplNId, userSettings, loaded]);

  // latestTeamsRef 동기화 — addTeamProject 등에서 stale closure 없이 최신 teams 참조
  useEffect(() => { latestTeamsRef.current = teams; }, [teams]);

  // teams 독립 저장 — meta/main과 완전히 분리된 문서(meta/teams)에 저장
  // teams 변경이 다른 설정(members, pris 등) 저장과 충돌하는 race를 근본 차단
  // teamNId를 deps에서 제외 — setTeamNId 호출이 subscribeTeams echo와 맞물려 무한 루프 유발
  // 대신 teamNIdRef.current로 항상 최신값 참조
  useEffect(() => {
    if (!loaded) return;
    // 초기 마운트 시 빈 배열을 Firestore에 덮어쓰는 사고 방지
    if (!skipFirstTeams.current) { skipFirstTeams.current = true; return; }
    // 서버에서 온 데이터(echo 포함)로 setTeams된 경우 — 다시 쓰면 무한 루프
    if (teamsFromServer.current) { teamsFromServer.current = false; return; }
    // 사용자가 직접 변경한 경우에만 저장 — 400ms 디바운스
    const t = setTimeout(() => {
      fsWriteTeams(teams, teamNIdRef.current)
        .catch((e) => console.warn("[SYNC] teams 저장 실패:", e));
    }, 400);
    return () => clearTimeout(t);
  }, [teams, loaded]); // teamNId 제거 — ref로 참조해 루프 차단

  const forceFirestoreSync = async () => {
    try {
      const snap = await getDoc(FS_DOC);
      if (!snap.exists()) { flash("Firestore에 저장된 데이터가 없습니다", "err"); return; }
      const d = snap.data();
      applyData(d);
      flash("Firestore 데이터로 복원되었습니다");
    } catch (e: any) { flash(`복원 실패: ${e.message}`, "err"); }
  };

  // 공유 API 키 ref — applyData에서 저장, Firestore 동기화 시 참조
  const sharedApiKeyRef = useRef<string>("");

  const aProj = projects.filter(p => p.status === "활성");
  const gPr = (id: number) => gP(projects, id);

  // ── useAI: AI 파싱 관련 상태·로직 (useAI.ts로 분리) ──────────────────────
  const ai = useAI({
    currentUser,
    aProj,
    members,
    onAddTodos: (checked: AiParsed[]) => {
      // 프로젝트 → 팀 매핑 — AI 생성 업무에도 팀 자동 배정
      const projTeamMap: Record<number, string> = {};
      Object.assign(projTeamMap, buildProjTeamMap(projects));

      const startId = nIdRef.current;
      nIdRef.current += checked.length;
      setNId(nIdRef.current);
      // AI 생성 업무를 배열로 먼저 구성 — 배치 Firestore 저장용
      const newTodos: Todo[] = checked.map((t, i) => {
        const mp = aProj.find(p => t.project && p.name.includes(t.project));
        const pid = mp ? mp.id : 0;
        // 팀 배정 우선순위: 프로젝트 기반 매핑 → 현재 선택된 팀 → 미배정
        const resolvedTeamId = projTeamMap[pid] || selectedTeamId || undefined;
        const createLog: ActivityLog = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          at: new Date().toISOString(),
          who: currentUser || "시스템",
          action: "create" as const,
        };
        return {
          pid,
          task: t.task || "",
          who: t.assignee ? [t.assignee] : ["미배정"],
          due: t.due || "",
          pri: t.priority || "보통",
          st: "대기",
          det: t.detail || "",
          repeat: t.repeat || "없음",
          id: startId + i,
          cre: td(),
          done: null,
          teamId: resolvedTeamId,
          logs: [createLog],
        };
      });
      setTodosWithHistory((prev: Todo[]) => [...prev, ...newTodos]);
      // AI로 생성된 업무들을 Firestore 서브컬렉션에 배치로 저장
      fsWriteTodosBatch(newTodos).catch(e => { console.warn("[SYNC] AI 배치 실패:", e); flash("저장 실패", "err"); });
    },
    flash,
    undo, // AI 등록 후 "실행 취소" 토스트 버튼에서 사용
  });

  // 공유 API 키 복원 — Firestore에서 로드된 키를 ai state에 적용
  useEffect(() => {
    if (sharedApiKeyRef.current && !ai.apiKey) {
      ai.setApiKey(sharedApiKeyRef.current);
    }
  }, [loaded]);
  // ai.apiKey 변경 시 ref 동기화 + Firestore 저장 트리거
  useEffect(() => {
    if (ai.apiKey) sharedApiKeyRef.current = ai.apiKey;
  }, [ai.apiKey]);

  // 활동 로그 ID 생성 — 타임스탬프+랜덤으로 충돌 방지
  const mkLogId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // repeat 값(문자열 or 객체)을 표시용 문자열로 변환
  const fmtRepeat = (v: any): string => {
    if (!v || v === "없음") return "없음";
    if (typeof v === "string") return v;
    if (v.interval === 1) return `매${v.unit}`;
    return `${v.interval}${v.unit}마다`;
  };

  const updTodo = (id: number, u: any) => {
    // outer scope에서 새 todo 사전 계산 — setState functional updater는 commit 시점 호출이라
    // outer let 변수로 캡처하면 fsWriteTodo가 null로 호출되는 race 발생 (Phase 2-3 회귀 버그).
    const t = todos.find(todo => todo.id === id);
    if (!t) return;

    let updated: Todo;

    // 반복 업무를 완료 처리할 때는 일반 완료가 아닌 롤오버 (다음 주기로 이동)
    const isRepeatTodo = t.repeat && t.repeat !== "없음";
    const isCompletingRepeat = u.st === "완료" && t.st !== "완료" && isRepeatTodo;
    const rolloverDue = isCompletingRepeat ? getNextDue(t.due, t.repeat) : null;

    if (isCompletingRepeat && rolloverDue) {
      const rolloverLog: ActivityLog = {
        id: mkLogId(),
        at: new Date().toISOString(),
        who: currentUser || "시스템",
        action: "repeat_rollover",
        prevDue: t.due ? t.due.split(" ")[0] : "",
        changes: [{ field: "마감기한", from: t.due || "", to: rolloverDue }],
      };
      updated = {
        ...t,
        st: "대기",
        due: rolloverDue,
        done: null,
        logs: [...(t.logs || []), rolloverLog],
      };
    } else {
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
        // 메모 저장 등 logs 직접 업데이트
        n.logs = u.logs;
      }
      updated = n as Todo;
    }

    // 로컬 state 업데이트 (히스토리 포함)
    setTodosWithHistory((p: Todo[]) => p.map(x => x.id === id ? updated : x));

    // Firestore 서브컬렉션 개별 문서 업데이트 — 즉시 호출되므로 race 없음
    fsWriteTodo(updated).catch(e => {
      console.warn("[SYNC] updTodo 실패:", e);
      flash("저장 실패", "err");
    });
  };

  // 완료 처리 통합 함수 — 반복 업무는 롤오버, 일반 업무는 완료 처리
  // 모든 뷰의 완료 버튼은 이 함수를 통해 호출해야 함
  const completeTodo = (id: number) => {
    const t = todos.find(todo => todo.id === id);
    if (!t) return;

    const isRepeat = t.repeat && t.repeat !== "없음";
    if (isRepeat) {
      const nextDue = getNextDue(t.due, t.repeat);
      updTodo(id, { st: "완료" }); // updTodo 내부에서 롤오버로 자동 처리
      // 토스트 표시용 날짜 — 시간 부분 제거 후 날짜·요일만 표기
      const nextDateOnly = nextDue ? nextDue.split(" ")[0] : null;
      const nextLabel = nextDateOnly
        ? nextDateOnly.slice(5).replace("-", "/") + `(${["일","월","화","수","목","금","토"][new Date(nextDateOnly).getDay()]})`
        : null;
      flash(nextLabel ? `완료! 다음 일정: ${nextLabel}` : "완료 처리되었습니다");
    } else {
      updTodo(id, { st: "완료" });
      flash("완료 처리되었습니다");
    }
  };

  const addTodo = (t: any) => {
    const id = nIdRef.current++; setNId(nIdRef.current);
    // 업무 등록 시 생성 로그 자동 기록
    const createLog: ActivityLog = {
      id: mkLogId(),
      at: new Date().toISOString(),
      who: currentUser || "시스템",
      action: "create",
    };
    // 팀 배정 우선순위: 명시적 teamId → 프로젝트 기반 팀 → selectedTeamId → 현재 사용자 소속 첫 번째 팀
    // selectedTeamId가 null(전체 보기)이어도 팀 멤버 업무가 viewTodos 필터에서 누락되지 않도록 보장
    const projTeamMapForAdd: Record<number, string> = buildProjTeamMap(projects);
    const myTidsForAdd = teams.filter(tm => tm.members.some(m => m.name === currentUser)).map(tm => tm.id);
    const resolvedTeamId = t.teamId || projTeamMapForAdd[t.pid] || selectedTeamId || myTidsForAdd[0] || undefined;
    // order 가중치 — 마지막에 추가한 업무가 가장 뒤에 오도록 현재 max + 1000
    // (1000 간격으로 두면 사이 삽입 시 정수 평균으로 새 order 부여 가능)
    const maxOrder = todos.reduce((m, x) => Math.max(m, x.order ?? 0), 0);
    const newTodo = { ...t, id, cre: td(), done: t.st === "완료" ? td() : null, repeat: t.repeat || "없음", teamId: resolvedTeamId, order: maxOrder + 1000, logs: [createLog] };
    setTodosWithHistory((p: Todo[]) => [...p, newTodo]);
    // 신규 업무를 Firestore 서브컬렉션 개별 문서로 저장
    fsWriteTodo(newTodo).catch(e => { console.warn("[SYNC] addTodo 실패:", e); flash("저장 실패", "err"); });
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
    // 히스토리 포함 삭제 — undo로 복원 가능, 삭제는 즉시 Firestore에 반영
    immediateFlush.current = true;
    setTodosWithHistory((p: Todo[]) => p.filter(t => t.id !== id));
    // Firestore 서브컬렉션에서도 즉시 삭제
    fsRemoveTodo(id).catch(e => { console.warn("[SYNC] delTodo 실패:", e); flash("삭제 실패", "err"); });
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
    // 복원된 업무를 Firestore 서브컬렉션에 새 문서로 저장
    fsWriteTodo(restored).catch(e => { console.warn("[SYNC] restoreTodo 실패:", e); flash("복원 실패", "err"); });
    flash(`'${entry.task}' 업무가 복원되었습니다`);
  };

  // 드래그 정렬 — 드래그된 업무의 order 가중치만 갱신해 Firestore 동기화
  // (todos 배열 자체 reorder가 아니라 order 필드 갱신 — 새로고침/타 기기에서도 같은 순서 유지)
  // extra: 칸반에서 컬럼(상태)이 바뀌면 {st} 를 함께 넘겨 한 번의 쓰기로 처리
  const reorderTodo = (dragId: number, beforeId: number | null, extra: Partial<Todo> = {}) => {
    const dragged = todos.find(t => t.id === dragId);
    if (!dragged) return;
    // 현재 sort된 순서 (order 가중치 기반, 없으면 id 폴백)
    const sortedAll = [...todos].sort((a, b) => (a.order ?? a.id * 1000) - (b.order ?? b.id * 1000));
    const without = sortedAll.filter(t => t.id !== dragId);
    // 새 위치 계산 — beforeId 직전 또는 맨 뒤
    const insertIdx = beforeId === null ? without.length : without.findIndex(t => t.id === beforeId);
    const targetIdx = insertIdx === -1 ? without.length : insertIdx;
    // 새 위치의 앞·뒤 이웃 order로 평균 계산 (사이 삽입)
    const prevOrder = targetIdx > 0 ? (without[targetIdx - 1].order ?? without[targetIdx - 1].id * 1000) : null;
    const nextOrder = targetIdx < without.length ? (without[targetIdx].order ?? without[targetIdx].id * 1000) : null;
    let newOrder: number;
    if (prevOrder !== null && nextOrder !== null) newOrder = (prevOrder + nextOrder) / 2;
    else if (prevOrder !== null) newOrder = prevOrder + 1000;
    else if (nextOrder !== null) newOrder = nextOrder - 1000;
    else newOrder = Date.now();
    const updated: Todo = { ...dragged, ...extra, order: newOrder };
    setTodosWithHistory((p: Todo[]) => p.map(t => t.id === dragId ? updated : t));
    fsWriteTodo(updated).catch(e => { console.warn("[SYNC] reorderTodo 실패:", e); flash("순서 저장 실패", "err"); });
  };

  // 팀 필터 적용된 todo 목록 — 모든 뷰에서 표시용으로 사용
  // null(전체 보기): 관리자=전체, 일반=소속 팀 전체 / 팀 선택: 해당 팀만
  // 공통 방어 로직: teamId 없는 업무는 현재 사용자가 담당자이면 항상 표시
  // (직접 입력 등으로 팀 배정이 누락된 경우에도 본인 업무가 사라지지 않도록)
  const viewTodos = useMemo(() => {
    const myTids = teams.filter(t => t.members.some(m => m.name === currentUser)).map(t => t.id);
    const isMyTask = (t: Todo) => !t.teamId && (t.who as string[])?.includes(currentUser || "");
    if (selectedTeamId) {
      const isInSelectedTeam = myTids.includes(selectedTeamId);
      return todos.filter(t => {
        if (t.teamId) return t.teamId === selectedTeamId;
        // teamId 없는 업무: 현재 사용자가 선택된 팀 소속이고 담당자이면 표시
        return isInSelectedTeam && isMyTask(t);
      });
    }
    // 전체 보기 — 소속 팀 업무 합산 (관리자는 미배정 포함 전부)
    // loaded 가드: 초기 로드 전 teams가 빈 배열이면 !myTids.length가 true → 전원 admin처럼 전체 노출되는 레이스 컨디션 방지
    const isAdmin = loaded && ((currentUser && memberRoles[currentUser] === "admin") || !myTids.length);
    if (isAdmin) return todos;
    return todos.filter(t => {
      if (t.teamId) return myTids.includes(t.teamId);
      // teamId 없는 업무: 현재 사용자가 담당자이면 표시
      return isMyTask(t);
    });
  }, [todos, selectedTeamId, teams, currentUser, memberRoles, loaded]);

  // viewTodos(팀 필터 적용 후)를 기반으로 검색/필터 적용
  const filtered = useMemo(() => viewTodos.filter(t => {
    const q = search.toLowerCase();
    // 검색: who 배열 내 아무 이름이라도 검색어 포함 시 매칭
    return (!q || t.task.toLowerCase().includes(q) || t.who.some((w: string) => w.toLowerCase().includes(q)) || gPr(t.pid).name.toLowerCase().includes(q))
      && (filters.proj.length === 0 || filters.proj.some(v => v === "__none__" ? gPr(t.pid).id === 0 : String(t.pid) === v))
      && (filters.st.length === 0 || filters.st.some(v => v === "__none__" ? !t.st : v === "__overdue__" ? isOD(t.due, t.st) : t.st === v))
      && (filters.pri.length === 0 || filters.pri.some(v => v === "__none__" ? !t.pri : t.pri === v))
      // 담당자 필터: "미배정"은 who 배열 비어 있을 때, 그 외는 who 배열에 해당 이름 포함 시 매칭
      && (filters.who.length === 0 || filters.who.some(v => v === "__none__" ? t.who.length === 0 : t.who.includes(v)))
      && (filters.repeat.length === 0 || filters.repeat.includes(t.repeat))
      && (!filters.fav || isFav(t.id));
  }), [viewTodos, search, filters, projects, currentUser, userFavs]);

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
      // who 배열에서 주 담당자([0]) 기준으로 정렬
      const keyA = col === "pid" ? (gPr(a.pid).name || "미배정") : col === "who" ? (a.who[0] || "") : col === "pri" ? (a.pri || "") : col === "st" ? (a.st || "") : "";
      const keyB = col === "pid" ? (gPr(b.pid).name || "미배정") : col === "who" ? (b.who[0] || "") : col === "pri" ? (b.pri || "") : col === "st" ? (b.st || "") : "";
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
    else if (col === "who") { va = a.who[0] || ""; vb = b.who[0] || ""; }
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
  // 둘 다 비어있으면 사용자 드래그앤드롭 순서(order 필드, 없으면 id) 폴백 — 새로고침·기기간 일관 유지
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (activeSortFields.length > 0) {
        for (const sf of activeSortFields) {
          const diff = compareByCol(a, b, sf.col, sf.dir);
          if (diff !== 0) return diff;
        }
        return 0;
      }
      if (sortCol) return compareByCol(a, b, sortCol, sortDir as "asc" | "desc");
      // 정렬 미적용 — 드래그앤드롭 순서(order 가중치) 적용. order 없는 항목은 id 기반 폴백.
      const ao = a.order ?? a.id * 1000;
      const bo = b.order ?? b.id * 1000;
      return ao - bo;
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
  // teams는 meta/teams 독립 문서로 저장 — meta/main의 다른 설정과 충돌 없음
  // setTeams → teams useEffect(400ms 디바운스) → fsWriteTeams(meta/teams) 경로
  const addTeam = (name: string, color: string) => {

    pushHistory();
    const id = `team-${String(teamNIdRef.current).padStart(3, "0")}`;
    const team: Team = { id, name, color, members: [], projectIds: [], createdAt: td() };
    setTeams(p => [...p, team]);
    teamNIdRef.current += 1;
    setTeamNId(teamNIdRef.current);
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

    // 팀 삭제 시 해당 팀 todo의 teamId 제거 — 미배정 상태가 됨 (관리자만 조회 가능)
    setTodos(p => p.map(t => t.teamId === id ? { ...t, teamId: undefined } : t));
    pushHistory();
    setTeams(p => p.filter(t => t.id !== id));
    flash(`팀 "${team.name}"이(가) 삭제되었습니다`, "err");
  };
  // 팀에 멤버 추가/제거/역할 변경
  const addTeamMember = (teamId: string, name: string, role: TeamRole = "editor") => {

    // 복수 팀 소속 허용 — 해당 팀에만 추가 (다른 팀에서 제거하지 않음)
    setTeams(p => p.map(t => {
      if (t.id === teamId) return { ...t, members: [...t.members.filter(m => m.name !== name), { name, role }] };
      return t;
    }));
    // 전역 역할도 동기화
    setMemberRoles(p => ({ ...p, [name]: role }));
  };
  const removeTeamMember = (teamId: string, name: string) => {

    setTeams(p => p.map(t => t.id === teamId ? { ...t, members: t.members.filter(m => m.name !== name) } : t));
  };
  const setTeamMemberRole = (teamId: string, name: string, role: TeamRole) => {

    setTeams(p => p.map(t => t.id === teamId ? { ...t, members: t.members.map(m => m.name === name ? { ...m, role } : m) } : t));
    setMemberRoles(p => ({ ...p, [name]: role }));
  };
  // 팀 미소속 멤버의 역할만 변경 (전역 memberRoles만 업데이트)
  const setMemberRole = (name: string, role: TeamRole) => {
    guard();
    setMemberRoles(p => ({ ...p, [name]: role }));
    // 팀에 소속된 경우 팀 내 역할도 동기화
    const t = teams.find(tm => tm.members.some(m => m.name === name));
    if (t) setTeamMemberRole(t.id, name, role);
  };
  // 팀에 프로젝트 연결 — todo 패턴: 프로젝트 문서에 teamId 즉시 patch (teams 통째 저장 race 제거)
  // 최상위 프로젝트에만 teamId 부여, 자식은 부모를 따라간다 (getProjectTeamId 헬퍼)
  const addTeamProject = (teamId: string, pid: number) => {
    // parentId가 있으면 최상위 부모를 찾아 그쪽에 teamId 부여
    const proj = projects.find(p => p.id === pid);
    if (!proj) return;
    const rootId = proj.parentId ? (() => { let cur = proj; while (cur.parentId) { const par = projects.find(x => x.id === cur.parentId); if (!par) break; cur = par; } return cur.id; })() : pid;
    setProjectsGuarded((prev: Project[]) => prev.map(p => p.id === rootId ? { ...p, teamId } : p));
    // 해당 프로젝트(+자식)의 기존 업무들에 teamId 즉시 배정
    const childIds = new Set<number>([rootId, ...projects.filter(p => p.parentId === rootId).map(p => p.id)]);
    const affected = todos.filter(t => childIds.has(t.pid) && t.teamId !== teamId).map(t => ({ ...t, teamId }));
    if (affected.length > 0) {
      setTodos(p => p.map(t => childIds.has(t.pid) ? { ...t, teamId } : t));
      fsWriteTodosBatch(affected).catch(e => console.warn("[SYNC] addTeamProject todos 업데이트 실패:", e));
    }
  };
  const removeTeamProject = (_teamId: string, pid: number) => {
    const proj = projects.find(p => p.id === pid);
    if (!proj) return;
    const rootId = proj.parentId ? (() => { let cur = proj; while (cur.parentId) { const par = projects.find(x => x.id === cur.parentId); if (!par) break; cur = par; } return cur.id; })() : pid;
    setProjectsGuarded((prev: Project[]) => prev.map(p => p.id === rootId ? { ...p, teamId: null } : p));
  };
  // 프로젝트 삭제 시 호출 — teamId 필드 자체가 프로젝트와 함께 사라지므로 별도 처리 불필요 (호환용 유지)
  const removeProjectFromAllTeams = (_pid: number) => {
    // no-op — 프로젝트 문서 삭제로 teamId도 함께 제거됨
  };

  // 기존 업무를 프로젝트 기준으로 팀에 일괄 배정
  // 프로젝트가 팀에 연결되어 있으면 해당 팀의 teamId를 업무에 설정
  const assignTodosToTeams = () => {
    // 프로젝트 → 팀 매핑 생성 (자식은 부모 teamId 상속)
    const projTeamMap = buildProjTeamMap(projects);
    let count = 0;
    pushHistory();
    setTodos((prev: Todo[]) => prev.map(t => {
      const teamId = projTeamMap[t.pid];
      if (teamId && t.teamId !== teamId) { count++; return { ...t, teamId }; }
      return t;
    }));
    flash(`${count}건의 업무가 프로젝트 기준으로 팀에 배정되었습니다`);
  };

  // ── 업무 템플릿 CRUD ──────────────────────────────────────────────────
  const addTemplate = (tpl: Omit<TodoTemplate, "id" | "createdAt" | "useCount" | "lastUsedAt">) => {
    const id = `tpl_${tplNId}`;
    setTplNId(n => n + 1);
    const newTpl: TodoTemplate = {
      ...tpl,
      id,
      createdAt: td(),
      useCount: 0,
      lastUsedAt: undefined,
    };
    setTemplates(p => [...p, newTpl]);
    // 신규 템플릿을 Firestore 서브컬렉션 개별 문서로 저장
    fsWriteTemplate(newTpl).catch(e => console.warn("[SYNC] addTemplate 실패:", e));
    flash(`템플릿 "${tpl.name}"이(가) 저장되었습니다`);
    return id;
  };

  const updTemplate = (id: string, patch: Partial<TodoTemplate>) => {
    setTemplates(p => p.map(t => t.id === id ? { ...t, ...patch } : t));
    // 변경된 필드만 Firestore 서브컬렉션 개별 문서에 패치
    fsPatchTemplate(id, patch).catch(e => console.warn("[SYNC] updTemplate 실패:", e));
  };

  const delTemplate = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    setTemplates(p => p.filter(t => t.id !== id));
    // Firestore 서브컬렉션에서도 삭제
    fsRemoveTemplate(id).catch(e => console.warn("[SYNC] delTemplate 실패:", e));
    if (tpl) flash(`템플릿 "${tpl.name}"이(가) 삭제되었습니다`, "err");
  };

  // 템플릿 적용 — 업무 생성 + 사용 통계 업데이트
  const applyTemplate = (id: string, baseDate: string, defaultWho: string) => {
    const tpl = templates.find(t => t.id === id);
    if (!tpl || !tpl.items.length) return;

    // 프로젝트 → 팀 매핑 (자식은 부모 teamId 상속)
    const projTeamMap = buildProjTeamMap(projects);

    const startId = nIdRef.current;
    nIdRef.current += tpl.items.length;
    setNId(nIdRef.current);

    const baseDt = baseDate ? new Date(baseDate) : new Date();
    const mkLogId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 템플릿 항목을 배열로 먼저 구성 — 배치 Firestore 저장용
    const newTodos: Todo[] = tpl.items.map((item, i) => {
      // 상대 날짜 계산
      let due = "";
      if (item.offsetDays !== undefined && item.offsetDays >= 0) {
        const d = new Date(baseDt);
        d.setDate(d.getDate() + item.offsetDays);
        due = d.toISOString().slice(0, 10);
      }
      const pid = item.pid || 0;
      const resolvedTeamId = projTeamMap[pid] || selectedTeamId || undefined;
      const createLog: ActivityLog = {
        id: mkLogId(),
        at: new Date().toISOString(),
        who: currentUser || "시스템",
        action: "create" as const,
      };
      return {
        id: startId + i,
        pid,
        task: item.task,
        // who 배열로 변환 — defaultWho나 currentUser를 단일 담당자 배열로 감쌈
        who: [defaultWho || currentUser || "미배정"],
        due,
        pri: item.pri || "보통",
        st: "대기",
        det: item.det || "",
        repeat: item.repeat || "없음",
        cre: td(),
        done: null,
        teamId: resolvedTeamId,
        logs: [createLog],
      };
    });
    setTodosWithHistory((prev: Todo[]) => [...prev, ...newTodos]);
    // 템플릿에서 생성된 업무들을 Firestore 서브컬렉션에 배치로 저장
    fsWriteTodosBatch(newTodos).catch(e => { console.warn("[SYNC] applyTemplate 실패:", e); flash("저장 실패", "err"); });

    // 사용 통계 업데이트
    updTemplate(id, { useCount: (tpl.useCount || 0) + 1, lastUsedAt: new Date().toISOString() });
    flash(`${tpl.items.length}건의 업무가 템플릿에서 등록되었습니다`);
  };

  // 템플릿 편집 항목 일괄 등록 — 히스토리 1회만 push (Undo 1번으로 전체 되돌리기)
  const confirmTplItems = (items: Record<string, unknown>[]) => {
    if (!items.length) return;
    const projTeamMap = buildProjTeamMap(projects);
    const startId = nIdRef.current;
    nIdRef.current += items.length;
    setNId(nIdRef.current);
    const mkLogId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    // 항목을 배열로 먼저 구성 — 배치 Firestore 저장용
    const newTodos: Todo[] = items.map((t, i) => {
      const pid = (t.pid as number) || 0;
      const resolvedTeamId = projTeamMap[pid] || selectedTeamId || undefined;
      return {
        id: startId + i,
        pid,
        task: (t.task as string) || "",
        who: Array.isArray(t.who) && t.who.length > 0 ? t.who as string[] : [currentUser || "미배정"],
        due: (t.due as string) || "",
        pri: (t.pri as string) || "보통",
        st: (t.st as string) || "대기",
        det: (t.det as string) || "",
        repeat: (t.repeat as string) || "없음",
        cre: td(),
        done: null,
        teamId: resolvedTeamId,
        logs: [{ id: mkLogId(), at: new Date().toISOString(), who: currentUser || "시스템", action: "create" as const }],
      };
    });
    setTodosWithHistory((prev: Todo[]) => [...prev, ...newTodos]);
    // 템플릿 편집 항목을 Firestore 서브컬렉션에 배치로 저장
    fsWriteTodosBatch(newTodos).catch(e => { console.warn("[SYNC] confirmTplItems 실패:", e); flash("저장 실패", "err"); });
  };

  // 멤버 중 PIN 미발급자에게 자동 생성 — 신규 추가 경로(사이드바·팀 탭 등)에서
  // PIN 세팅이 빠져도 멤버 추가 후 다음 렌더에서 자동 복구되도록 게이트 제거
  useEffect(() => {
    if (!loaded || !members.length) return;
    const missing = members.filter(m => !memberPins[m]);
    if (!missing.length) return;
    const pins: Record<string, string> = { ...memberPins };
    missing.forEach(m => { pins[m] = generatePin(); });
    setMemberPins(pins);
  }, [loaded, members, memberPins]);

  // 멤버 역할 자동 복구 — memberRoles 누락 시 기본값 "editor"로 채워 넣음
  // (누락 상태면 UI가 "관리자"로 폴백되어 잘못된 권한이 표시되는 것을 방지)
  useEffect(() => {
    if (!loaded || !members.length) return;
    const missing = members.filter(m => !memberRoles[m]);
    if (!missing.length) return;
    setMemberRoles(p => {
      const next = { ...p };
      missing.forEach(m => { next[m] = "editor"; });
      return next;
    });
  }, [loaded, members, memberRoles]);

  // 자동 마이그레이션 — teamId 없는 todo를 프로젝트 기반 or 담당자 기반으로 자동 배정
  // 로드 완료 후 1회만 실행 (기존 누락분 복구 포함)
  const autoAssignDone = useRef(false);
  useEffect(() => {
    if (!loaded || autoAssignDone.current) return;
    if (!teams.length) return;
    // teamId 없는 업무가 없으면 조기 종료
    if (!todos.some(t => !t.teamId)) { autoAssignDone.current = true; return; }
    autoAssignDone.current = true;
    // 프로젝트 → 팀 매핑 (자식은 부모 teamId 상속)
    const projTeamMap = buildProjTeamMap(projects);
    // 담당자 이름(정규화) → 소속 팀 목록 매핑
    const memberTeamMap: Record<string, string[]> = {};
    teams.forEach(t => t.members.forEach(m => {
      const nm = normName(m.name);
      if (!memberTeamMap[nm]) memberTeamMap[nm] = [];
      memberTeamMap[nm].push(t.id);
    }));
    setTodos((prev: Todo[]) => prev.map(t => {
      if (t.teamId) return t;
      // 1순위: 프로젝트 기반 팀 배정
      const projTid = projTeamMap[t.pid];
      if (projTid) return { ...t, teamId: projTid };
      // 2순위: 담당자 전원이 단일 팀에 속하면 해당 팀으로 배정
      if (t.who?.length > 0) {
        let candidates: string[] | null = null;
        for (const w of t.who) {
          const wTeams = memberTeamMap[normName(w)] || [];
          candidates = candidates === null ? [...wTeams] : candidates.filter(id => wTeams.includes(id));
        }
        if (candidates && candidates.length === 1) return { ...t, teamId: candidates[0] };
      }
      return t;
    }));
  }, [loaded, teams, todos]);

  // 마이그레이션 — Team.projectIds → Project.teamId (새 데이터 모델)
  // 로드 완료 후 1회: 각 팀의 projectIds를 읽어 해당 프로젝트에 teamId patch, 이후 Team.projectIds 비움
  // 같은 프로젝트가 여러 팀에 있으면 첫 팀만 채택
  const teamIdMigrationDone = useRef(false);
  useEffect(() => {
    if (!loaded || teamIdMigrationDone.current) return;
    if (!teams.length || !projects.length) return;
    // 마이그레이션이 필요한 케이스: teams에 projectIds가 남아 있으면서 그 프로젝트에 teamId가 없는 경우
    const needsMigration = teams.some(t => (t.projectIds?.length ?? 0) > 0);
    if (!needsMigration) { teamIdMigrationDone.current = true; return; }
    teamIdMigrationDone.current = true;
    console.log("[MIGRATION] Team.projectIds → Project.teamId 마이그레이션 시작");
    const assigned = new Set<number>();
    const projTeamMap: Record<number, string> = {};
    teams.forEach(t => (t.projectIds ?? []).forEach(pid => {
      if (assigned.has(pid)) return;
      assigned.add(pid);
      projTeamMap[pid] = t.id;
    }));
    // 프로젝트에 teamId patch (자식은 그대로 — 부모 따라감)
    const newProjects = projects.map(p => {
      const newTid = projTeamMap[p.id];
      if (newTid && p.teamId !== newTid && !p.parentId) return { ...p, teamId: newTid };
      return p;
    });
    const changedProjs = newProjects.filter((p, i) => p !== projects[i]);
    if (changedProjs.length > 0) {
      setProjects(newProjects);
      changedProjs.forEach(p => {
        fsWriteProject(p).catch(e => console.warn("[MIGRATION] project teamId 저장 실패:", e));
      });
    }
    // Team.projectIds 비우기 — 새 모델에선 source of truth가 Project.teamId
    const cleanedTeams = teams.map(t => ({ ...t, projectIds: [] }));
    setTeams(cleanedTeams);
    fsWriteTeams(cleanedTeams, teamNIdRef.current).catch(e => console.warn("[MIGRATION] teams projectIds 비우기 실패:", e));
    console.log(`[MIGRATION] 완료 — ${changedProjs.length}개 프로젝트에 teamId 부여`);
  }, [loaded, teams, projects]);

  // ── useCalendar: 캘린더 상태·로직 분리 — 팀 필터 적용된 todos 전달 ──────
  const cal = useCalendar({ todos: viewTodos });

  const saveMod = (f: any) => {
    // who가 배열이므로 비어 있는지 확인 (빈 배열 또는 falsy 처리)
    if (!f.task || !f.who || (Array.isArray(f.who) && f.who.length === 0)) { alert("업무내용과 담당자는 필수 항목입니다."); return; }
    if (f.id) { updTodo(parseInt(f.id), { pid: parseInt(f.pid), task: f.task, who: f.who, due: f.due, pri: f.pri, st: f.st, det: f.det, repeat: f.repeat || "없음" }); flash("변경사항이 저장되었습니다"); }
    else { addTodo({ pid: parseInt(f.pid), task: f.task, who: f.who, due: f.due, pri: f.pri, st: f.st, det: f.det, repeat: f.repeat || "없음" }); flash("업무가 등록되었습니다"); }
    setEditMod(null);
  };
  // 새 행 추가 시 현재 사용자를 주 담당자 배열로 초기화
  const addNR = () => setNewRows(r => [...r, { pid: "", task: "", who: currentUser ? [currentUser] : [], due: "", pri: "보통", det: "", repeat: "없음" }]);
  const isNREmpty = (r: NewRow) => !r.task && !r.pid && r.who.length === 0 && !r.due && !r.det;
  // 개별 행 저장 — who 배열이 비어 있으면 현재 사용자를 주 담당자로 배정
  const saveOneNR = (i: number) => { const r = newRows[i]; if (!r.task?.trim()) { flash("업무내용을 입력해주세요", "err"); return; } addTodo({ pid: r.pid ? parseInt(r.pid) : 0, task: r.task.trim(), who: r.who.length ? r.who : [currentUser || "미배정"], due: r.due || "", pri: r.pri || "보통", st: "대기", det: r.det || "", repeat: r.repeat || "없음" }); setNewRows(p => p.filter((_, j) => j !== i)); flash("업무가 등록되었습니다"); };
  // 일괄 저장 — who 배열이 비어 있으면 현재 사용자를 주 담당자로 배정
  const saveNRs = () => { if (savingNRs.current) return; const empty = newRows.filter(r => !r.task?.trim()); if (empty.length) { flash(`업무내용이 비어 있는 항목이 ${empty.length}건 있습니다`, "err"); return; } const v = newRows.filter(r => r.task?.trim()); if (!v.length) { setNewRows([]); return; } savingNRs.current = true; v.forEach(r => addTodo({ pid: r.pid ? parseInt(r.pid) : 0, task: r.task.trim(), who: r.who.length ? r.who : [currentUser || "미배정"], due: r.due || "", pri: r.pri || "보통", st: "대기", det: r.det || "", repeat: r.repeat || "없음" })); setNewRows([]); flash(`${v.length}건이 등록되었습니다`); setTimeout(() => { savingNRs.current = false; }, 300); };


  const addChip = () => {
    if (!chipVal.trim()) return; const v = chipVal.trim();
    if (chipAdd === "proj") {
      if (projects.some(p => p.name === v)) { flash(`프로젝트 "${v}"은(는) 이미 존재합니다`, "err"); return; }
      // pNId가 손상되어 max(project.id)보다 작아진 경우 ID 충돌 방지
      // (충돌 시 applyData의 dedup이 새 항목을 첫 번째 occurrence로 밀어내며 사라지는 버그 방지)
      // App.tsx onAddProj와 동일 패턴 — 사이드바·설정 두 경로 모두 안전 ID 적용
      const newPid = Math.max(pNId, ...projects.map(p => p.id + 1));
      setProjectsGuarded((p: Project[]) => [...p, { id: newPid, name: v, color: chipColor, status: "활성" }]); setPNId(newPid + 1);
      // 현재 선택된 팀에 프로젝트 자동 연결
      if (selectedTeamId) addTeamProject(selectedTeamId, newPid);
      flash(`프로젝트 "${v}"이(가) 추가되었습니다`);
    }
    else if (chipAdd === "who") {
      if (members.includes(v)) { flash(`담당자 "${v}"은(는) 이미 존재합니다`, "err"); return; }
      setMembersGuarded((p: string[]) => [...p, v]);
      // 현재 선택된 팀에 담당자 자동 배정 + PIN 생성
      if (selectedTeamId) addTeamMember(selectedTeamId, v, "editor");
      setMemberPins(p => ({ ...p, [v]: generatePin() }));
      flash(`담당자 "${v}"이(가) 추가되었습니다`);
    }
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
    projects, setProjects: setProjectsGuarded, todos: viewTodos, allTodos: todos, setTodos: setTodosWithHistory, nId, setNId, pNId, setPNId, loaded,
    members, setMembers: setMembersGuarded, pris, setPris: setPrisGuarded, stats, setStats: setStatsGuarded,
    priC, setPriC: setPriCGuarded, priBg, setPriBg: setPriBgGuarded, stC, setStC: setStCGuarded, stBg, setStBg: setStBgGuarded,
    memberColors, setMemberColors: setMemberColorsGuarded,
    // 팀·역할
    teams, setTeams, teamNId,
    selectedTeamId, setSelectedTeamId,
    memberRoles, setMemberRole, memberPins, setMemberPins, generatePin,
    globalPermissions, setGlobalPermissions,
    addTeam, updTeam, delTeam,
    addTeamMember, removeTeamMember, setTeamMemberRole,
    addTeamProject, removeTeamProject, removeProjectFromAllTeams, assignTodosToTeams,
    // 업무 템플릿
    templates, setTemplates, addTemplate, updTemplate, delTemplate, applyTemplate, confirmTplItems,
    // 템플릿 즐겨찾기 — 사용자별 localStorage 저장
    tplFavs, setTplFavs,
    view, setView,
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
    setUserSettings: setUserSettingsGuarded,
    flushHidden,
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
    undo, redo, flash, forceFirestoreSync, updTodo, completeTodo, addTodo, delTodo, reorderTodo,
    toggleSort, togF, handleCheck, toggleSelectAll,
    saveMod, addNR, isNREmpty, saveOneNR, saveNRs,
    addChip,
  };
}
