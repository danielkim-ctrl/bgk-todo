import { useState, useMemo } from "react";
import { Todo, Project } from "../types";
import { expandRepeats, dateStr } from "../utils";

interface UseCalendarOptions {
  todos: Todo[];
}

export function useCalendar({ todos }: UseCalendarOptions) {
  // ── 상태 ─────────────────────────────────────────────────────────────────
  const [calF, setCalF] = useState("");
  const [calFWho, setCalFWho] = useState("");
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [calM, setCalM] = useState(new Date().getMonth());
  const [calD, setCalD] = useState(new Date().getDate());
  const [calView, setCalView] = useState("month");
  const [customDays, setCustomDays] = useState(4);

  // ── 헬퍼 ─────────────────────────────────────────────────────────────────
  const calDate = () => new Date(calY, calM, calD);
  const setCalDate = (d: Date) => {
    setCalY(d.getFullYear());
    setCalM(d.getMonth());
    setCalD(d.getDate());
  };
  const calToday = () => setCalDate(new Date());

  // ── 날짜 범위 (캘린더 뷰 종류에 따라 다름) ───────────────────────────────
  const calRangeDs = useMemo(() => {
    const base = new Date(calY, calM, calD);
    let s: string, e: string;
    if (calView === "week") {
      const ws = new Date(base);
      ws.setDate(ws.getDate() - ws.getDay());
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      s = dateStr(ws.getFullYear(), ws.getMonth(), ws.getDate());
      e = dateStr(we.getFullYear(), we.getMonth(), we.getDate());
    } else if (calView === "month") {
      s = `${calY}-01-01`;
      e = `${calY}-12-31`;
    } else if (calView === "agenda") {
      s = dateStr(calY, calM, calD);
      const ae = new Date(base);
      ae.setDate(ae.getDate() + 89);
      e = dateStr(ae.getFullYear(), ae.getMonth(), ae.getDate());
    } else if (calView === "custom") {
      const ce = new Date(base);
      ce.setDate(ce.getDate() + customDays - 1);
      s = dateStr(base.getFullYear(), base.getMonth(), base.getDate());
      e = dateStr(ce.getFullYear(), ce.getMonth(), ce.getDate());
    }
    s = s! || dateStr(calY, calM, calD);
    e = e! || dateStr(calY, calM, calD);
    return { s, e };
  }, [calView, calY, calM, calD, customDays]);

  // ── 캘린더용 할일 필터링 + 반복 일정 전개 ────────────────────────────────
  const ftodosBase = useMemo(
    () => todos.filter(t => (!calF || String(t.pid) === calF) && (!calFWho || t.who === calFWho)),
    [todos, calF, calFWho]
  );
  const ftodosExpanded = useMemo(
    () => expandRepeats(ftodosBase, calRangeDs.s, calRangeDs.e),
    [ftodosBase, calRangeDs]
  );

  // ── 탐색 ─────────────────────────────────────────────────────────────────
  const calNav = (dir: number) => {
    const d = calDate();
    if (calView === "day") d.setDate(d.getDate() + dir);
    else if (calView === "week") d.setDate(d.getDate() + dir * 7);
    else if (calView === "month") { d.setFullYear(d.getFullYear() + dir); d.setDate(1); }
    else if (calView === "custom") d.setDate(d.getDate() + dir * customDays);
    else if (calView === "agenda") d.setDate(d.getDate() + dir * 14);
    setCalDate(d);
  };

  // ── 표시 ─────────────────────────────────────────────────────────────────
  const calDays = ["일", "월", "화", "수", "목", "금", "토"];

  const calTitle = () => {
    const d = calDate();
    if (calView === "day") return `${calY}년 ${calM + 1}월 ${calD}일 (${calDays[d.getDay()]})`;
    if (calView === "week") {
      const s = new Date(d); s.setDate(s.getDate() - s.getDay());
      const e = new Date(s); e.setDate(e.getDate() + 6);
      return `${s.getMonth() + 1}/${s.getDate()} — ${e.getMonth() + 1}/${e.getDate()}, ${s.getFullYear()}`;
    }
    if (calView === "month") return `${calY}년 전체`;
    if (calView === "custom") return `${customDays}일 뷰`;
    return "일정 목록";
  };

  const weekDates = () => {
    const d = calDate();
    const s = new Date(d);
    s.setDate(s.getDate() - s.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(s); x.setDate(x.getDate() + i); return x;
    });
  };

  const customDates = () => {
    const d = calDate();
    return Array.from({ length: customDays }, (_, i) => {
      const x = new Date(d); x.setDate(x.getDate() + i); return x;
    });
  };

  const agendaItems = () => {
    const d = calDate();
    const items: any[] = [];
    for (let i = 0; i < 90; i++) {
      const x = new Date(d); x.setDate(x.getDate() + i);
      const ds = dateStr(x.getFullYear(), x.getMonth(), x.getDate());
      const dayTodos = ftodosExpanded.filter(t => t.due && t.due.split(" ")[0] === ds);
      if (dayTodos.length) items.push({ date: x, ds, todos: dayTodos });
    }
    return items;
  };

  // ── 이벤트 스타일 (캘린더 칩 스타일) ─────────────────────────────────────
  const evStyle = (p: Project, repeat: string): React.CSSProperties => ({
    fontSize: 10, padding: "2px 6px", borderRadius: 4, marginBottom: 1,
    cursor: "pointer", fontWeight: 500, overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap",
    borderLeft: `3px solid ${p.color}`,
    background: repeat && repeat !== "없음" ? `${p.color}22` : `${p.color}15`,
    color: p.color,
    borderLeftStyle: repeat && repeat !== "없음" ? "dashed" : "solid",
  });

  return {
    calF, setCalF,
    calFWho, setCalFWho,
    calY, calM, calD,
    calView, setCalView,
    customDays, setCustomDays,
    calRangeDs,
    ftodosExpanded,
    calDays,
    calDate, setCalDate,
    calToday,
    calNav,
    calTitle,
    weekDates,
    customDates,
    agendaItems,
    evStyle,
  };
}
