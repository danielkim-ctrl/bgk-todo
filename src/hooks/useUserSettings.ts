import { useState, useRef, useEffect } from "react";
import { Filters } from "../types";

// ── 뷰 설정 기본값 ────────────────────────────────────────────────────────────
const DEFAULT_VIEW_SETTINGS = {
  todoView: "list" as const,
  memoCols: 3,
  sortCol: null as string | null,
  sortDir: "asc" as const,
  expandMode: false,
  filters: { proj: [], who: [], pri: [], st: [], repeat: [], fav: "" } as Filters,
};

function loadViewSettings(user: string | null) {
  if (!user) return DEFAULT_VIEW_SETTINGS;
  try {
    return (
      JSON.parse(localStorage.getItem(`todo-view-settings-${user}`) || "null") ||
      DEFAULT_VIEW_SETTINGS
    );
  } catch {
    return DEFAULT_VIEW_SETTINGS;
  }
}

export function useUserSettings() {
  // ── 사용자 ────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<string | null>(
    () => localStorage.getItem("todo-current-user")
  );

  // ── 뷰 설정 (유저별 localStorage 저장) ───────────────────────────────────
  const _init = loadViewSettings(localStorage.getItem("todo-current-user"));
  const [filters, setFilters] = useState<Filters>(
    _init.filters || DEFAULT_VIEW_SETTINGS.filters
  );
  const [sortCol, setSortCol] = useState<string | null>(_init.sortCol ?? null);
  const [sortDir, setSortDir] = useState<string>(_init.sortDir ?? "asc");
  const [expandMode, setExpandMode] = useState<boolean>(_init.expandMode);
  const [todoView, setTodoView] = useState<"list" | "memo">(_init.todoView);
  const [memoCols, setMemoCols] = useState<number>(_init.memoCols);
  const [showDone, setShowDone] = useState(false);

  // ── 즐겨찾기 사이드바 ─────────────────────────────────────────────────────
  const [favSidebar, setFavSidebar] = useState<{ [k: string]: string[] }>(() => {
    const u = localStorage.getItem("todo-current-user");
    if (!u) return {};
    try { return JSON.parse(localStorage.getItem(`todo-sidebar-favs-${u}`) || "{}"); } catch { return {}; }
  });
  const togFavSidebar = (key: string, val: string) =>
    setFavSidebar(prev => {
      const cur = prev[key] || [];
      const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
      const s = { ...prev, [key]: next };
      if (currentUser) localStorage.setItem(`todo-sidebar-favs-${currentUser}`, JSON.stringify(s));
      return s;
    });

  // ── 할일 즐겨찾기 (별 표시) ──────────────────────────────────────────────
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

  // ── 사용자별 UI 순서/설정 (Firestore 동기화로 기기 무관하게 사람 기준 유지) ─
  const [userSettings, setUserSettings] = useState<Record<string, {
    kanbanOrder: number[];
    sidebarOrder: number[];
    starredIds: number[];
    hiddenProjects: number[];
    hiddenMembers: string[];
  }>>({});

  // ── 유저 전환: 이전 유저 설정 저장 → 새 유저 설정 복원 ─────────────────────
  const prevUserRef = useRef<string | null>(localStorage.getItem("todo-current-user"));

  useEffect(() => {
    const prev = prevUserRef.current;
    if (prev) {
      localStorage.setItem(
        `todo-view-settings-${prev}`,
        JSON.stringify({ todoView, memoCols, sortCol, sortDir, expandMode, filters })
      );
    }
    prevUserRef.current = currentUser;

    if (currentUser) {
      localStorage.setItem("todo-current-user", currentUser);
      const s = loadViewSettings(currentUser);
      setTodoView(s.todoView);
      setMemoCols(s.memoCols);
      setSortCol(s.sortCol);
      setSortDir(s.sortDir);
      setExpandMode(s.expandMode);
      setFilters(s.filters);
    } else {
      localStorage.removeItem("todo-current-user");
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 뷰 설정 변경 시 자동 저장 ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(
      `todo-view-settings-${currentUser}`,
      JSON.stringify({ todoView, memoCols, sortCol, sortDir, expandMode, filters })
    );
  }, [todoView, memoCols, sortCol, sortDir, expandMode, filters, currentUser]);

  // ── 기타 자동 저장 ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { setFavSidebar({}); return; }
    try {
      setFavSidebar(
        JSON.parse(localStorage.getItem(`todo-sidebar-favs-${currentUser}`) || "{}")
      );
    } catch { setFavSidebar({}); }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("todo-user-favs", JSON.stringify(userFavs));
  }, [userFavs]);

  return {
    currentUser, setCurrentUser,
    filters, setFilters,
    sortCol, setSortCol,
    sortDir, setSortDir,
    expandMode, setExpandMode,
    todoView, setTodoView,
    memoCols, setMemoCols,
    showDone, setShowDone,
    favSidebar, togFavSidebar,
    userFavs, isFav, toggleFav,
    userSettings, setUserSettings,
  };
}
