import { useRef, useState, useEffect } from "react";
import { S } from "../styles";
import { isOD, dateStr, fDow } from "../utils";
import { repeatLabel } from "../constants";
import { usePermission } from "../auth/PermissionContext";
import { avColor, avColor2 } from "../utils/avatarUtils";
import { Chip } from "../components/ui/Chip";
import { RepeatBadge } from "../components/ui/RepeatBadge";
import { MultiMonthView } from "../components/calendar/MultiMonthView";
import { DateTimePicker } from "../components/editor/DateTimePicker";
import { Bars3Icon, ArrowPathIcon, UserIcon, ExclamationTriangleIcon, CalendarIcon, FolderIcon, CheckCircleIcon, CheckIcon, XMarkIcon, PencilSquareIcon, TrashIcon, BoltIcon, StarIcon, StarOutlineIcon, ICON_SM } from "../components/ui/Icons";
import { RepeatPicker } from "../components/ui/RepeatPicker";

// 사이드바 드래그 ID — 모듈 스코프 변수로 관리 (리렌더 시에도 값 유지)
let _sidebarDragRefId: number | null = null;

interface CalendarViewProps {
  // calendar state
  calView: string;
  setCalView: (v: string) => void;
  calY: number;
  calM: number;
  calD: number;
  calNav: (dir: number) => void;
  calTitle: () => string;
  calDays: string[];
  todayStr: string;
  customDays: number;
  setCustomDays: (v: number) => void;
  weekDates: () => Date[];
  customDates: () => Date[];
  agendaItems: () => any[];
  ftodosExpanded: any[];
  evStyle: (p: any, repeat?: string) => any;
  calF: string[];
  setCalF: (v: string[]) => void;
  calFWho: string[];
  setCalFWho: (v: string[]) => void;
  visibleProj: any[];
  members: string[];
  visibleMembers: string[];
  gPr: (pid: number) => any;
  pris: string[];
  priC: Record<string,string>;
  priBg: Record<string,string>;
  stC: Record<string,string>;
  stBg: Record<string,string>;
  memberColors: Record<string,string>;
  todos: any[];
  updTodo: (id: number, updates: any) => void;
  addTodo: (todo: any) => void;
  delTodo: (id: number) => void;
  flash: (msg: string, type?: string) => void;
  setEditMod: (v: any) => void;
  currentUser: string|null;
  // calendar popovers
  calEvPop: {todo:any,x:number,y:number}|null;
  setCalEvPop: (v: {todo:any,x:number,y:number}|null) => void;
  calQA: {ds:string,h:number,x:number,y:number}|null;
  setCalQA: (v: {ds:string,h:number,x:number,y:number}|null) => void;
  calQATitle: string;
  setCalQATitle: (v: string) => void;
  calQADue: string;
  setCalQADue: (v: string) => void;
  calQAPid: string;
  setCalQAPid: (v: string) => void;
  calQAWho: string;
  setCalQAWho: (v: string) => void;
  calQAPri: string;
  setCalQAPri: (v: string) => void;
  calQAPicker: string|null;
  setCalQAPicker: (v: string|null) => void;
  calDayPop: {ds:string,todos:any[],x:number,y:number}|null;
  setCalDayPop: (v: {ds:string,todos:any[],x:number,y:number}|null) => void;
  calSidebarOpen: boolean;
  setCalSidebarOpen: (fn: (v: boolean) => boolean) => void;
  calSidebarAdding: boolean;
  setCalSidebarAdding: (v: boolean) => void;
  calSidebarAddTitle: string;
  setCalSidebarAddTitle: (v: string) => void;
  // calendar drag
  calDragId: number|null;
  setCalDragId: (v: number|null) => void;
  calDragOverDs: string|null;
  setCalDragOverDs: (v: string|null) => void;
  calDragOverH: number|null;
  setCalDragOverH: (v: number|null) => void;
  calDragStart: (id: number) => void;
  calDragEnd: () => void;
  calDropOnDate: (ds: string, h?: number) => void;
  calTodayKey: number;
  calTodayFn: () => void;
  setCalDate: (d: Date) => void;
  gridScrolled: React.MutableRefObject<boolean>;
  justOpenedPopup: React.MutableRefObject<boolean>;
  saveQA: () => void;
  openEvPop: (e: React.MouseEvent, t: any) => void;
  openQA: (e: React.MouseEvent, ds: string, h: number) => void;
  // sidebar state
  sidebarOrder: number[];
  setSidebarOrder: (order: number[]) => void;
  sidebarDragId: number|null;
  setSidebarDragId: (v: number|null) => void;
  sidebarDragOver: number|null;
  setSidebarDragOver: (v: number|null) => void;
  sidebarHoverId: number|null;
  setSidebarHoverId: (v: number|null) => void;
  sidebarEditId: number|null;
  setSidebarEditId: (v: number|null) => void;
  sidebarEditVal: string;
  setSidebarEditVal: (v: string) => void;
  sidebarExpandId: number|null;
  sidebarDetId: number|null;
  setSidebarDetId: (v: number|null) => void;
  sidebarExpand: (id: number|null) => void;
  sidebarDoneOpen: boolean;
  setSidebarDoneOpen: (fn: (v: boolean) => boolean) => void;
  secNodateOpen: boolean;
  setSecNodateOpen: (fn: (v: boolean) => boolean) => void;
  secTodayOpen: boolean;
  setSecTodayOpen: (fn: (v: boolean) => boolean) => void;
  secTmrOpen: boolean;
  setSecTmrOpen: (fn: (v: boolean) => boolean) => void;
  secWeekOpen: boolean;
  setSecWeekOpen: (fn: (v: boolean) => boolean) => void;
  secLaterOpen: boolean;
  setSecLaterOpen: (fn: (v: boolean) => boolean) => void;
  starredIds: Set<number>;
  toggleStar: (id: number) => void;
  pendingComplete: Set<number>;
  handleSideComplete: (id: number, isDone: boolean) => void;
  detDivRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  taskDivRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  /** 모바일 여부 — 캘린더 셀 크기 및 이벤트 표시 방식 조정 */
  isMobile?: boolean;
}

// ── 사이드바 업무 추가 — Google Tasks 스타일 ──────────────────────────────
// 제목 + 세부정보(contentEditable, Ctrl+B 등 단축키로 서식 적용) + 옵션 아이콘
function SidebarAddTask({ adding, setAdding, title, setTitle, visibleProj, visibleMembers, pris, priC, currentUser, todayStr, addTodo, flash }: {
  adding: boolean; setAdding: (v: boolean) => void;
  title: string; setTitle: (v: string) => void;
  visibleProj: any[]; visibleMembers: string[]; pris: string[]; priC: Record<string,string>;
  currentUser: string|null; todayStr: string;
  addTodo: (t: any) => void; flash: (msg: string, type?: string) => void;
}) {
  const [addDue, setAddDue] = useState("");
  const [addPid, setAddPid] = useState("0");
  const [addWho, setAddWho] = useState("");
  const [addPri, setAddPri] = useState("보통");
  // 반복 설정 — RepeatPicker 컴포넌트가 관리, 이 state는 최종 값을 보관
  const [addRepeat, setAddRepeat] = useState<any>("없음");
  const [picker, setPicker] = useState<string|null>(null);
  const detRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  // 최신 상태를 ref로 유지 — 바깥 클릭 핸들러에서 참조
  const stateRef = useRef({ title, addDue, addPid, addWho, addPri, addRepeat });
  stateRef.current = { title, addDue, addPid, addWho, addPri, addRepeat };

  const resetForm = () => {
    setTitle(""); setAddDue(""); setAddPid("0"); setAddWho(""); setAddPri("보통"); setAddRepeat("없음"); setPicker(null);
    if (detRef.current) detRef.current.innerHTML = "";
  };

  // 업무 저장 후 폼 초기화, 연속 입력 준비
  const save = () => {
    const s = stateRef.current;
    if (!s.title.trim()) return;
    // 날짜 미설정 시 빈 값으로 저장 (Google Tasks 방식 — "날짜 없음" 섹션에 표시)
    addTodo({ pid: parseInt(s.addPid), task: s.title.trim(), who: s.addWho || currentUser || "", due: s.addDue || "", pri: s.addPri, st: "대기", det: detRef.current?.innerHTML || "", repeat: s.addRepeat });
    resetForm();
    flash("업무가 등록되었습니다");
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  // 닫기 — 제목이 있으면 자동 저장 후 닫기
  const close = () => {
    if (stateRef.current.title.trim()) save();
    setAdding(false); resetForm();
  };

  // 바깥 클릭 시 닫기 — ref 기반이므로 항상 최신 title 참조
  useEffect(() => {
    if (!adding) return;
    const h = (e: MouseEvent) => {
      const inForm = formRef.current?.contains(e.target as Node);
      if (!inForm) close();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h, true), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h, true); };
  }, [adding]);

  // 반복 칩 라벨 계산 — RepeatPicker가 반환한 값으로부터 표시 텍스트 추출
  const repeatChipLabel = (() => {
    if (!addRepeat || addRepeat === "없음") return null;
    if (typeof addRepeat === "string") return addRepeat;
    const c = addRepeat;
    return c.interval === 1 ? `매${c.unit}` : `${c.interval}${c.unit}마다`;
  })();

  // 칩 목록
  const chips: {key:string; label:string; color?:string}[] = [];
  // 날짜 칩 — Google Tasks 스타일 (오늘/내일/M월 D일(요일))
  if (addDue) {
    const _today = new Date(); const _todayS = dateStr(_today.getFullYear(), _today.getMonth(), _today.getDate());
    const _tmr = new Date(_today); _tmr.setDate(_tmr.getDate() + 1); const _tmrS = dateStr(_tmr.getFullYear(), _tmr.getMonth(), _tmr.getDate());
    const dueLabel = addDue === _todayS ? "오늘" : addDue === _tmrS ? "내일" : `${parseInt(addDue.slice(5,7))}월 ${parseInt(addDue.slice(8,10))}일(${fDow(addDue)})`;
    chips.push({ key: "due", label: dueLabel });
  }
  if (addPid !== "0") { const p = visibleProj.find((pr: any) => String(pr.id) === addPid); if (p) chips.push({ key: "pid", label: p.name, color: p.color }); }
  if (addWho && addWho !== currentUser) chips.push({ key: "who", label: addWho });
  if (addPri !== "보통") chips.push({ key: "pri", label: addPri, color: priC[addPri] });
  if (repeatChipLabel) chips.push({ key: "repeat", label: repeatChipLabel });

  const removeChip = (key: string) => {
    if (key === "due") setAddDue("");
    if (key === "pid") setAddPid("0");
    if (key === "who") setAddWho("");
    if (key === "pri") setAddPri("보통");
    if (key === "repeat") setAddRepeat("없음");
  };

  const optBtn = (active: boolean) => ({
    display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
    width: 28, height: 28, border: "none" as const, background: active ? "#e8f0fe" : "none",
    cursor: "pointer" as const, borderRadius: "50%" as const, color: active ? "#1a73e8" : "#5f6368",
    transition: "background .12s", padding: 0, flexShrink: 0,
  });

  if (!adding) {
    return (
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <button onClick={() => { setAdding(true); setTimeout(() => titleRef.current?.focus(), 50); }}
          style={{ width: "100%", padding: "8px 12px", border: "none", borderRadius: 6, background: "none", cursor: "pointer", fontSize: 13, color: "#1a73e8", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontWeight: 500, transition: "background .12s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f3f4"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}>
          <span style={{fontSize:16,lineHeight:1,fontWeight:400}}>+</span> 할 일 추가
        </button>
      </div>
    );
  }

  return (
    <div ref={formRef} style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
      <div style={{ border: "1.5px solid #1a73e8", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
        {/* 업무내용 (필수) */}
        <input ref={titleRef} autoFocus value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); save(); } if (e.key === "Escape") close(); }}
          placeholder="업무내용 *"
          style={{ width: "100%", padding: "10px 12px 4px", border: "none", fontSize: 13, fontWeight: 500, outline: "none", fontFamily: "inherit", color: "#1f1f1f", boxSizing: "border-box" as const }} />
        {/* 상세내용 — contentEditable (Ctrl+B/I/U 단축키로 서식 적용) */}
        <div ref={detRef} contentEditable suppressContentEditableWarning
          onKeyDown={e => { if (e.key === "Escape") close(); }}
          data-placeholder="상세내용"
          style={{ minHeight: 28, maxHeight: 80, overflowY: "auto" as const, padding: "4px 12px 8px", fontSize: 12, outline: "none", color: "#5f6368", fontFamily: "inherit", lineHeight: 1.6, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const }} />

        {/* 칩 */}
        {chips.length > 0 && (
          <div style={{ padding: "0 10px 6px", display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
            {chips.map(c => (
              <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#e8f0fe", color: "#1a73e8", fontWeight: 500 }}>
                {c.color && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />}
                {c.label}
                <span onClick={() => removeChip(c.key)} style={{ fontSize: 14, color: "#80868b", cursor: "pointer", lineHeight: 1, marginLeft: 2 }}>×</span>
              </span>
            ))}
          </div>
        )}

        {/* 옵션 아이콘 버튼 */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 8px", borderTop: "1px solid #f1f3f4" }}>
          <button style={optBtn(picker === "date")} title="날짜·반복" onClick={() => setPicker(picker === "date" ? null : "date")}>
            <CalendarIcon style={{ width: 16, height: 16 }} />
          </button>
          <button style={optBtn(picker === "proj")} title="프로젝트" onClick={() => setPicker(picker === "proj" ? null : "proj")}>
            <FolderIcon style={{ width: 16, height: 16 }} />
          </button>
          <button style={optBtn(picker === "who")} title="담당자" onClick={() => setPicker(picker === "who" ? null : "who")}>
            <UserIcon style={{ width: 16, height: 16 }} />
          </button>
          <button style={optBtn(picker === "pri")} title="우선순위" onClick={() => setPicker(picker === "pri" ? null : "pri")}>
            <BoltIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* ── 피커 패널들 ── */}
        {/* 날짜 + 반복 — Google Tasks 스타일 */}
        {picker === "date" && (
          <div style={{ borderTop: "1px solid #f1f3f4", background: "#fafbfc", padding: "8px 10px" }}>
            {/* 빠른 날짜 선택 */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 6 }}>
              {[["오늘", todayStr], ["내일", (() => { const d = new Date(); d.setDate(d.getDate() + 1); return dateStr(d.getFullYear(), d.getMonth(), d.getDate()); })()], ["다음주", (() => { const d = new Date(); d.setDate(d.getDate() + 7); return dateStr(d.getFullYear(), d.getMonth(), d.getDate()); })()], ["없음", ""]].map(([l, v]) => (
                <button key={l} onClick={() => setAddDue(v as string)}
                  style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, border: `1px solid ${addDue === v ? "#1a73e8" : "#e2e8f0"}`, background: addDue === v ? "#e8f0fe" : "#fff", color: addDue === v ? "#1a73e8" : "#334155", cursor: "pointer", fontFamily: "inherit", fontWeight: addDue === v ? 600 : 400 }}>{l}</button>
              ))}
            </div>
            <input type="date" value={addDue} onChange={e => setAddDue(e.target.value)}
              style={{ width: "100%", fontSize: 11, padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 6, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 8 }} />
            {/* 반복 설정 — RepeatPicker 공통 컴포넌트 사용 */}
            <RepeatPicker value={addRepeat} onChange={setAddRepeat} startDate={addDue || todayStr} />
            {/* 완료 버튼 */}
            <button onClick={() => setPicker(null)}
              style={{ width: "100%", marginTop: 8, padding: "5px", borderRadius: 6, border: "none", background: "#1a73e8", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>완료</button>
          </div>
        )}
        {picker === "proj" && (
          <div style={{ borderTop: "1px solid #f1f3f4", background: "#fafbfc", maxHeight: 160, overflowY: "auto" as const }}>
            {/* 트리형 프로젝트 — 상위 + 세부 들여쓰기 */}
            {visibleProj.filter((pr: any) => !pr.parentId).map((pr: any) => {
              const children = visibleProj.filter((ch: any) => ch.parentId === pr.id);
              const rs = (id: number) => ({ display: "flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, background: String(id) === addPid ? "#e8f0fe" : "transparent", color: String(id) === addPid ? "#1a73e8" : "#334155", fontWeight: String(id) === addPid ? 600 : 400 });
              return <div key={pr.id}>
                <div onClick={() => { setAddPid(String(pr.id)); setPicker(null); }} style={rs(pr.id)}
                  onMouseEnter={e => { if (String(pr.id) !== addPid) (e.currentTarget as HTMLElement).style.background = "#f1f3f4"; }}
                  onMouseLeave={e => { if (String(pr.id) !== addPid) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: pr.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{pr.name}</span>
                  {String(pr.id) === addPid && <CheckIcon style={{ width: 12, height: 12, marginLeft: "auto", color: "#1a73e8" }} />}
                </div>
                {children.map((ch: any) => (
                  <div key={ch.id} onClick={() => { setAddPid(String(ch.id)); setPicker(null); }} style={{ ...rs(ch.id), paddingLeft: 24, fontSize: 11 }}
                    onMouseEnter={e => { if (String(ch.id) !== addPid) (e.currentTarget as HTMLElement).style.background = "#f1f3f4"; }}
                    onMouseLeave={e => { if (String(ch.id) !== addPid) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <span style={{ color: "#cbd5e1", fontSize: 9 }}>└</span>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: ch.color, flexShrink: 0 }} />
                    {ch.name}
                    {String(ch.id) === addPid && <CheckIcon style={{ width: 12, height: 12, marginLeft: "auto", color: "#1a73e8" }} />}
                  </div>
                ))}
              </div>;
            })}
          </div>
        )}
        {picker === "who" && (
          <div style={{ borderTop: "1px solid #f1f3f4", background: "#fafbfc", maxHeight: 140, overflowY: "auto" as const }}>
            {visibleMembers.map(m => (
              <div key={m} onClick={() => { setAddWho(m); setPicker(null); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, background: m === (addWho || currentUser) ? "#e8f0fe" : "transparent", color: m === (addWho || currentUser) ? "#1a73e8" : "#334155", fontWeight: m === (addWho || currentUser) ? 600 : 400 }}
                onMouseEnter={e => { if (m !== (addWho || currentUser)) (e.currentTarget as HTMLElement).style.background = "#f1f3f4"; }}
                onMouseLeave={e => { if (m !== (addWho || currentUser)) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {m}
                {m === (addWho || currentUser) && <CheckIcon style={{ width: 12, height: 12, marginLeft: "auto", color: "#1a73e8" }} />}
              </div>
            ))}
          </div>
        )}
        {picker === "pri" && (
          <div style={{ padding: "6px 8px", borderTop: "1px solid #f1f3f4", background: "#fafbfc", display: "flex", gap: 4, flexWrap: "wrap" as const }}>
            {pris.map(p => (
              <button key={p} onClick={() => { setAddPri(p); setPicker(null); }}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, border: `1px solid ${addPri === p ? "#1a73e8" : "#e2e8f0"}`, background: addPri === p ? "#e8f0fe" : "#fff", color: addPri === p ? "#1a73e8" : "#334155", cursor: "pointer", fontFamily: "inherit", fontWeight: addPri === p ? 600 : 400, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: priC[p] }} />{p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 사이드바 업무 편집 확장 UI — 등록 UI와 동일한 구조 ──────────────────────
// todo 항목을 클릭해 확장했을 때 표시되는 편집 패널
function SidebarEditExpanded({ t, visibleProj, visibleMembers, pris, priC, priBg, todayStr, updTodo, delTodo, sidebarExpand, detDivRefs, setSidebarDetId, taskDivRefs }: {
  t: any; visibleProj: any[]; visibleMembers: string[];
  pris: string[]; priC: Record<string,string>; priBg: Record<string,string>;
  todayStr: string;
  updTodo: (id: number, updates: any) => void;
  delTodo: (id: number) => void;
  sidebarExpand: (id: number|null) => void;
  detDivRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  setSidebarDetId: (v: number|null) => void;
  // 제목 contentEditable용 ref 추적
  taskDivRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
}) {
  const [picker, setPicker] = useState<string|null>(null);
  // 반복 편집 state — RepeatPicker 컴포넌트가 관리, 이 state는 최종 값을 보관
  const [editRepeat, setEditRepeat] = useState<any>(t.repeat || "없음");
  const panelRef = useRef<HTMLDivElement>(null); // 편집 패널 전체 ref (바깥 클릭 감지용)
  // contentEditable innerHTML 초기화를 마운트 시 1회만 수행하기 위한 플래그
  const detInitialized = useRef(false);
  const taskInitialized = useRef(false);

  // 날짜 빠른 선택 헬퍼
  const qDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d.getFullYear(), d.getMonth(), d.getDate()); };

  // 편집 패널 바깥 클릭 시 자동 축소 — Google Tasks 방식
  // capture:false(버블링)로 등록 → panelRef div의 onMouseDown stopPropagation으로 내부 클릭 차단
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        sidebarExpand(null);
      }
    };
    // 50ms 딜레이: 마운트 직후 클릭 이벤트로 즉시 닫히는 것 방지
    const timer = setTimeout(() => document.addEventListener("mousedown", h, false), 50);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", h, false); };
  }, []);

  // 현재 날짜 표시 레이블 — Google Tasks 스타일
  const dueDateStr = t.due?.split(" ")[0] || "";
  const today = new Date();
  const todayS = dateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
  const tmrS = dateStr(tmr.getFullYear(), tmr.getMonth(), tmr.getDate());
  const dueLabel = !dueDateStr ? "날짜 추가"
    : dueDateStr === todayS ? "오늘"
    : dueDateStr === tmrS ? "내일"
    : `${parseInt(dueDateStr.slice(5,7))}월 ${parseInt(dueDateStr.slice(8,10))}일(${fDow(dueDateStr)})`;
  const isOd = isOD(t.due, t.st) && t.st !== "완료";

  const optBtn = (active: boolean) => ({
    display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
    width: 28, height: 28, border: "none" as const, background: active ? "#e8f0fe" : "none",
    cursor: "pointer" as const, borderRadius: "50%" as const, color: active ? "#1a73e8" : "#5f6368",
    transition: "background .12s", padding: 0, flexShrink: 0,
  });

  return (
    <div ref={panelRef}
      onClick={ev => ev.stopPropagation()}
      onMouseDown={ev => ev.stopPropagation()}
      style={{ marginTop: 2 }}>

      {/* 업무내용(제목) — Google Tasks 스타일: 밑줄 + 포커스 시 파란 밑줄 */}
      <div
        contentEditable
        suppressContentEditableWarning
        data-det-ph="업무내용"
        ref={el => {
          if (el) {
            taskDivRefs.current.set(t.id, el);
            if (!taskInitialized.current) {
              el.innerHTML = t.task || "";
              taskInitialized.current = true;
            }
          } else {
            taskDivRefs.current.delete(t.id);
            taskInitialized.current = false;
          }
        }}
        onBlur={e => {
          const text = e.currentTarget.textContent?.trim() || "";
          if (text && text !== t.task) updTodo(t.id, { task: text });
          if (!text) e.currentTarget.innerHTML = t.task || "";
          e.currentTarget.style.borderBottomColor = "#dadce0";
        }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = "#1a73e8"; }}
        onKeyDown={ev => {
          if (ev.key === "Enter") { ev.preventDefault(); ev.currentTarget.blur(); }
          if (ev.key === "Escape") { ev.currentTarget.innerHTML = t.task || ""; ev.currentTarget.blur(); }
        }}
        style={{
          fontSize: 14, fontWeight: 400, color: "#202124", outline: "none",
          borderBottom: "2px solid #dadce0", padding: "0 0 6px", marginBottom: 8,
          fontFamily: "inherit", lineHeight: "1.5", minHeight: 20,
          whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const,
          cursor: "text", transition: "border-color .2s",
        }}
      />

      {/* 상세내용 — Google Tasks 스타일: 밑줄 + 포커스 시 파란 밑줄 */}
      <div
        contentEditable
        suppressContentEditableWarning
        data-det-ph="상세내용"
        ref={el => {
          if (el) {
            detDivRefs.current.set(t.id, el);
            if (!detInitialized.current) {
              el.innerHTML = t.det || "";
              detInitialized.current = true;
            }
          } else {
            detDivRefs.current.delete(t.id);
            detInitialized.current = false;
          }
        }}
        onFocus={e => {
          setSidebarDetId(t.id);
          e.currentTarget.style.borderBottomColor = "#1a73e8";
        }}
        onBlur={e => {
          const html = e.currentTarget.innerHTML === "<br>" ? "" : e.currentTarget.innerHTML;
          if (html !== (t.det || "")) updTodo(t.id, { det: html });
          setSidebarDetId(null);
          e.currentTarget.style.borderBottomColor = "#dadce0";
        }}
        onKeyDown={ev => {
          if (!(ev.ctrlKey || ev.metaKey)) return;
          const cmds: Record<string,string> = { b: "bold", i: "italic", u: "underline", s: "strikeThrough" };
          const cmd = cmds[ev.key.toLowerCase()];
          if (cmd) { ev.preventDefault(); (document as any).execCommand(cmd, false); }
        }}
        style={{ minHeight: 28, maxHeight: 80, overflowY: "auto" as const, padding: "0 0 6px", fontSize: 12, outline: "none", color: "#5f6368", fontFamily: "inherit", lineHeight: 1.6, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const, borderBottom: "2px solid #dadce0", cursor: "text", transition: "border-color .2s" }}
      />

      {/* 옵션 아이콘 버튼 행 — 등록 UI와 동일, hover 효과 포함 */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 6 }}>
        {(["date","proj","who","pri"] as const).map(key => {
          const active = picker === key;
          const icons: Record<string, React.ReactNode> = {
            date: <CalendarIcon style={{ width: 16, height: 16 }} />,
            proj: <FolderIcon style={{ width: 16, height: 16 }} />,
            who:  <UserIcon style={{ width: 16, height: 16 }} />,
            pri:  <BoltIcon style={{ width: 16, height: 16 }} />,
          };
          const titles: Record<string, string> = { date: "날짜·반복", proj: "프로젝트", who: "담당자", pri: "우선순위" };
          return (
            <button key={key}
              style={optBtn(active)}
              title={titles[key]}
              onClick={() => { setPicker(active ? null : key); }}
              onMouseEnter={e => {
                // hover 시: 비활성이면 회색 배경+파란 아이콘, 활성이면 진한 파란 배경
                (e.currentTarget as HTMLElement).style.background = active ? "#d2e3fc" : "#f1f3f4";
                (e.currentTarget as HTMLElement).style.color = "#1a73e8";
              }}
              onMouseLeave={e => {
                // hover 해제 시 원래 상태로 복원
                (e.currentTarget as HTMLElement).style.background = active ? "#e8f0fe" : "none";
                (e.currentTarget as HTMLElement).style.color = active ? "#1a73e8" : "#5f6368";
              }}>
              {icons[key]}
            </button>
          );
        })}
      </div>

      {/* 선택 칩 — 아이콘 버튼과 별도 행으로 분리 (등록 UI와 동일) */}
      {(() => {
        const selProj = t.pid ? visibleProj.find((pr: any) => pr.id === t.pid) : null;
        return (dueDateStr || t.pri !== "보통" || t.who || selProj) && (
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, marginTop: 4, marginBottom: 2 }}>
            {dueDateStr && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, padding: "2px 8px", borderRadius: 99, background: isOd ? "#fef2f2" : "#e8f0fe", color: isOd ? "#e53e3e" : "#1a73e8", fontWeight: 500 }}>
                {dueLabel}
                <span onMouseDown={e => { e.preventDefault(); e.stopPropagation(); updTodo(t.id, { due: "" }); }} style={{ fontSize: 14, cursor: "pointer", lineHeight: 1, marginLeft: 2, color: "#80868b" }}>×</span>
              </span>
            )}
            {/* 프로젝트 칩 — 선택된 프로젝트 색상 도트 + 이름 표시 */}
            {selProj && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#f1f3f4", color: "#334155", fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: selProj.color, flexShrink: 0 }} />
                {selProj.name}
                <span onMouseDown={e => { e.preventDefault(); e.stopPropagation(); updTodo(t.id, { pid: 0 }); }} style={{ fontSize: 14, cursor: "pointer", lineHeight: 1, marginLeft: 2, color: "#80868b" }}>×</span>
              </span>
            )}
            {t.who && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#e8f0fe", color: "#1a73e8", fontWeight: 500 }}>
                {t.who}
              </span>
            )}
            {t.pri && t.pri !== "보통" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, padding: "2px 8px", borderRadius: 99, background: priBg[t.pri] || "#e8f0fe", color: priC[t.pri] || "#1a73e8", fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: priC[t.pri], flexShrink: 0 }} />
                {t.pri}
              </span>
            )}
          </div>
        );
      })()}

      {/* 날짜 + 반복 패널 */}
      {picker === "date" && (
        <div style={{ background: "#fafbfc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", marginTop: 4 }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 6 }}>
            {([["오늘", todayStr], ["내일", qDays(1)], ["다음주", qDays(7)], ["없음", ""]] as [string,string][]).map(([l, v]) => (
              <button key={l} onClick={() => updTodo(t.id, { due: v })}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, border: `1px solid ${dueDateStr === v ? "#1a73e8" : "#e2e8f0"}`, background: dueDateStr === v ? "#e8f0fe" : "#fff", color: dueDateStr === v ? "#1a73e8" : "#334155", cursor: "pointer", fontFamily: "inherit", fontWeight: dueDateStr === v ? 600 : 400 }}>{l}</button>
            ))}
          </div>
          <input type="date" value={dueDateStr} onChange={e => updTodo(t.id, { due: e.target.value })}
            style={{ width: "100%", fontSize: 11, padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 6, outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 8 }} />
          {/* 반복 설정 — RepeatPicker 공통 컴포넌트 사용 */}
          <RepeatPicker value={editRepeat} onChange={setEditRepeat} startDate={t.due || todayStr} />
          <button onClick={() => { updTodo(t.id, { repeat: editRepeat }); setPicker(null); }}
            style={{ width: "100%", marginTop: 8, padding: "5px", borderRadius: 6, border: "none", background: "#1a73e8", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>완료</button>
        </div>
      )}

      {/* 프로젝트 패널 — 트리형 (상위 + 세부 들여쓰기) */}
      {picker === "proj" && (
        <div style={{ background: "#fafbfc", border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 4, maxHeight: 160, overflowY: "auto" as const }}>
          {visibleProj.filter(pr => !pr.parentId).map(pr => {
            const children = visibleProj.filter(ch => ch.parentId === pr.id);
            const rowStyle = (id: number) => ({ display: "flex", alignItems: "center" as const, gap: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, background: id === t.pid ? "#e8f0fe" : "transparent", color: id === t.pid ? "#1a73e8" : "#334155", fontWeight: id === t.pid ? 600 : 400 });
            const hover = (e: React.MouseEvent, id: number) => { if (id !== t.pid) (e.currentTarget as HTMLElement).style.background = "#f1f3f4"; };
            const unhover = (e: React.MouseEvent, id: number) => { if (id !== t.pid) (e.currentTarget as HTMLElement).style.background = "transparent"; };
            return <div key={pr.id}>
              <div onClick={() => { updTodo(t.id, { pid: pr.id }); setPicker(null); }} style={rowStyle(pr.id)}
                onMouseEnter={e => hover(e, pr.id)} onMouseLeave={e => unhover(e, pr.id)}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: pr.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{pr.name}</span>
                {pr.id === t.pid && <CheckIcon style={{ width: 12, height: 12, marginLeft: "auto", color: "#1a73e8" }} />}
              </div>
              {children.map(ch => (
                <div key={ch.id} onClick={() => { updTodo(t.id, { pid: ch.id }); setPicker(null); }} style={{ ...rowStyle(ch.id), paddingLeft: 24, fontSize: 11 }}
                  onMouseEnter={e => hover(e, ch.id)} onMouseLeave={e => unhover(e, ch.id)}>
                  <span style={{ color: "#cbd5e1", fontSize: 9 }}>└</span>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: ch.color, flexShrink: 0 }} />
                  {ch.name}
                  {ch.id === t.pid && <CheckIcon style={{ width: 12, height: 12, marginLeft: "auto", color: "#1a73e8" }} />}
                </div>
              ))}
            </div>;
          })}
        </div>
      )}

      {/* 담당자 패널 */}
      {picker === "who" && (
        <div style={{ background: "#fafbfc", border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 4, maxHeight: 140, overflowY: "auto" as const }}>
          {visibleMembers.map(m => (
            <div key={m} onClick={() => { updTodo(t.id, { who: m }); setPicker(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, background: m === t.who ? "#e8f0fe" : "transparent", color: m === t.who ? "#1a73e8" : "#334155", fontWeight: m === t.who ? 600 : 400 }}
              onMouseEnter={e => { if (m !== t.who) (e.currentTarget as HTMLElement).style.background = "#f1f3f4"; }}
              onMouseLeave={e => { if (m !== t.who) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {m}
              {m === t.who && <CheckIcon style={{ width: 12, height: 12, marginLeft: "auto", color: "#1a73e8" }} />}
            </div>
          ))}
        </div>
      )}

      {/* 우선순위 패널 */}
      {picker === "pri" && (
        <div style={{ padding: "6px 8px", background: "#fafbfc", border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" as const }}>
          {pris.map(pr => (
            <button key={pr} onClick={() => { updTodo(t.id, { pri: pr }); setPicker(null); }}
              style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, border: `1px solid ${t.pri === pr ? "#1a73e8" : "#e2e8f0"}`, background: t.pri === pr ? "#e8f0fe" : "#fff", color: t.pri === pr ? "#1a73e8" : "#334155", cursor: "pointer", fontFamily: "inherit", fontWeight: t.pri === pr ? 600 : 400, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: priC[pr] }} />{pr}
            </button>
          ))}
        </div>
      )}

      {/* 접기 + 삭제 — hover 효과로 클릭 가능 영역 명확히 구분 */}
      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={ev => { ev.stopPropagation(); sidebarExpand(null); }}
          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#94a3b8", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3, transition: "all .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#475569"; (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}>
          <span style={{ fontSize: 10 }}>▲</span> 접기
        </button>
        <button onClick={ev => { ev.stopPropagation(); if (confirm(`"${t.task}" 업무를 삭제하시겠습니까?`)) {
          detDivRefs.current.delete(t.id);
          delTodo(t.id); sidebarExpand(null);
        } }}
          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fee2e2"; (e.currentTarget as HTMLElement).style.borderColor = "#f87171"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.borderColor = "#fecaca"; }}>
          삭제
        </button>
      </div>
    </div>
  );
}

export function CalendarView(props: CalendarViewProps) {
  const {
    calView, setCalView, calY, calM, calD, calNav, calTitle, calDays,
    todayStr, customDays, setCustomDays, weekDates, customDates, agendaItems,
    ftodosExpanded, evStyle, calF, setCalF, calFWho, setCalFWho,
    visibleProj, members, visibleMembers, gPr, pris, priC, priBg, stC, stBg, memberColors,
    todos, updTodo, addTodo, delTodo, flash, setEditMod, currentUser,
    calEvPop, setCalEvPop, calQA, setCalQA, calQATitle, setCalQATitle,
    calQADue, setCalQADue, calQAPid, setCalQAPid, calQAWho, setCalQAWho,
    calQAPri, setCalQAPri, calQAPicker, setCalQAPicker,
    calDayPop, setCalDayPop, calSidebarOpen, setCalSidebarOpen,
    calSidebarAdding, setCalSidebarAdding, calSidebarAddTitle, setCalSidebarAddTitle,
    calDragId, setCalDragId, calDragOverDs, setCalDragOverDs, calDragOverH, setCalDragOverH,
    calDragStart, calDragEnd, calDropOnDate, calTodayKey, calTodayFn, setCalDate,
    gridScrolled, justOpenedPopup, saveQA, openEvPop, openQA,
    sidebarOrder, setSidebarOrder, sidebarDragId, setSidebarDragId,
    sidebarDragOver, setSidebarDragOver, sidebarHoverId, setSidebarHoverId,
    sidebarEditId, setSidebarEditId, sidebarEditVal, setSidebarEditVal,
    sidebarExpandId, sidebarDetId, setSidebarDetId,
    sidebarExpand,
    sidebarDoneOpen, setSidebarDoneOpen, secNodateOpen, setSecNodateOpen,
    secTodayOpen, setSecTodayOpen, secTmrOpen, setSecTmrOpen,
    secWeekOpen, setSecWeekOpen, secLaterOpen, setSecLaterOpen, starredIds, toggleStar,
    pendingComplete, handleSideComplete, detDivRefs, taskDivRefs,
    isMobile,
  } = props;

  const { can, canEdit, canDelete } = usePermission();

  return <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
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
            <span style={{fontSize:10,opacity:.6,fontWeight:700}}>{n}</span>{l}
          </button>)}
        {calView==="custom"&&<input type="number" min="2" max="14" value={customDays} onChange={e=>setCustomDays(Math.max(2,Math.min(14,parseInt(e.target.value)||4)))} style={{width:44,padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,textAlign:"center"}}/>}
        {/* 우측 사이드바 토글 버튼 */}
        <button onClick={()=>setCalSidebarOpen(v=>!v)} title={calSidebarOpen?"사이드바 닫기":"사이드바 열기"} style={{marginLeft:4,width:28,height:28,borderRadius:6,border:`1.5px solid ${calSidebarOpen?"#2563eb":"#e2e8f0"}`,background:calSidebarOpen?"#eff6ff":"#fff",cursor:"pointer",fontSize:14,color:calSidebarOpen?"#2563eb":"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}><Bars3Icon style={ICON_SM}/></button>
      </div>
    </div>
    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
      <Chip active={calF.length===0} onClick={()=>setCalF([])}>전체</Chip>
      {/* 상위 프로젝트 칩 — hover 시 세부 프로젝트 드롭다운 표시 */}
      {visibleProj.filter(p=>!p.parentId).map(p=>{
        const children = visibleProj.filter(ch=>ch.parentId===p.id);
        const allIds = [String(p.id), ...children.map(ch=>String(ch.id))];
        const active = allIds.some(id=>calF.includes(id));
        // 세부가 없으면 기존과 동일
        if(children.length===0) return <Chip key={p.id} active={active} color={p.color} onClick={()=>{
          if(active) setCalF(calF.filter(x=>x!==String(p.id)));
          else setCalF([...calF,String(p.id)]);
        }}>{p.name}</Chip>;
        // 세부가 있으면 hover 드롭다운
        return <div key={p.id} style={{position:"relative",display:"inline-flex"}}
          onMouseEnter={e=>{const dd=e.currentTarget.querySelector("[data-sub-dd]") as HTMLElement;if(dd)dd.style.display="flex";}}
          onMouseLeave={e=>{const dd=e.currentTarget.querySelector("[data-sub-dd]") as HTMLElement;if(dd)dd.style.display="none";}}>
          {/* 상위 칩 — 클릭 시 전체 선택/해제 */}
          <Chip active={active} color={p.color} onClick={()=>{
            if(active) setCalF(calF.filter(x=>!allIds.includes(x)));
            else setCalF([...calF.filter(x=>!allIds.includes(x)),...allIds]);
          }}>{p.name} <span style={{fontSize:8,opacity:.6}}>▾</span></Chip>
          {/* 세부 프로젝트 드롭다운 — hover 시 표시, 상단 투명 패딩으로 마우스 연결 유지 */}
          <div data-sub-dd style={{display:"none",position:"absolute",top:"100%",left:0,paddingTop:4,zIndex:50,flexDirection:"column"}}>
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.12)",minWidth:140,padding:"4px 0",whiteSpace:"nowrap"}}>
            {/* 전체 선택/해제 */}
            <div onClick={()=>{
              if(active) setCalF(calF.filter(x=>!allIds.includes(x)));
              else setCalF([...calF.filter(x=>!allIds.includes(x)),...allIds]);
            }} style={{padding:"5px 12px",fontSize:11,fontWeight:600,color:active?"#2563eb":"#475569",cursor:"pointer",display:"flex",alignItems:"center",gap:5,borderBottom:"1px solid #f1f5f9"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#f8f9fa";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0}}/>
              전체 {active?"해제":"선택"}
            </div>
            {/* 세부 프로젝트 개별 항목 */}
            {children.map(ch=>{
              const chActive=calF.includes(String(ch.id));
              return <div key={ch.id} onClick={e=>{
                e.stopPropagation();
                if(chActive) setCalF(calF.filter(x=>x!==String(ch.id)));
                else setCalF([...calF,String(ch.id)]);
              }} style={{padding:"5px 12px",fontSize:11,color:chActive?"#2563eb":"#475569",fontWeight:chActive?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#f8f9fa";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:ch.color,flexShrink:0}}/>
                {ch.name}
                {chActive&&<span style={{marginLeft:"auto",color:"#2563eb",fontSize:10}}>✓</span>}
              </div>;
            })}
          </div></div>
        </div>;
      })}
    </div>
    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
      <Chip active={calFWho.length===0} onClick={()=>setCalFWho([])}>전체</Chip>
      {members.map(n=><Chip key={n} active={calFWho.includes(n)} onClick={()=>setCalFWho(calFWho.includes(n)?calFWho.filter(x=>x!==n):[...calFWho,n])}>{n}</Chip>)}
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
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
          <div style={{textAlign:"center",padding:"10px 0",background:isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
            <div style={{fontSize:11,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[dow]}</div>
            <div style={{fontSize:28,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:42,height:42,borderRadius:"50%",fontSize:22}:{})}}>{calD}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"56px 1fr",borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:40}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
          {(()=>{const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;return(
          <div style={{padding:"4px 6px",display:"flex",flexDirection:"column" as const,gap:2,
            background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":"#fff",
            outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,overflow:"hidden",
            cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
            data-calcell
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
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                  style={{...evStyle(p,t.repeat),whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:4,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{}),maxWidth:"100%"}}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",minWidth:0,flex:1,display:"inline-flex",alignItems:"center",gap:2}}>{t.repeat&&t.repeat!=="없음"&&<><ArrowPathIcon style={ICON_SM}/>{" "}</>}{t.task}</span>
                  {t.who&&<span style={{opacity:.7,fontSize:10,flexShrink:0}}> · {t.who}</span>}
                </div>);})}
          </div>);})()}
        </div>
        <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
          ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
          {Array.from({length:24},(_,h)=>{
            const hTodos=timedTodos.filter(t=>getH(t.due)===h);
            const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
            return <div key={h} style={{display:"grid",gridTemplateColumns:"56px 1fr",minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:10,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
              </div>
              <div style={{background:isDragOverCell?"#eff6ff":isT?"#fafcff":"#fff",
                outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                padding:hTodos.length>0?"2px 4px":0,overflow:"hidden",
                cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                data-calcell
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
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                    style={{...evStyle(p,t.repeat),display:"flex",alignItems:"center",gap:4,padding:"2px 8px",marginBottom:2,whiteSpace:"nowrap" as const,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{}),maxWidth:"100%",overflow:"hidden"}}>
                    <span style={{fontSize:8,fontWeight:700,flexShrink:0,opacity:.9}}>{tl}</span>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",minWidth:0,flex:1,display:"inline-flex",alignItems:"center",gap:2}}>{t.repeat&&t.repeat!=="없음"&&<ArrowPathIcon style={ICON_SM}/>}{t.task}</span>
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
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
          {wDates.map((d,i)=>{
            const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
            const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
            return <div key={i} style={{textAlign:"center",padding:"10px 4px",borderRight:i<6?"1px solid #e2e8f0":"none",background:isT?"#eff6ff":isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
              <div style={{fontSize:10,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[d.getDay()]}</div>
              <div style={{fontSize:22,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:34,height:34,borderRadius:"50%",fontSize:18}:{})}}>{d.getDate()}</div>
            </div>;})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:36}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
          {wDates.map((d,i)=>{
            const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
            const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
            const allDayT=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&!t.due.includes(" "));
            const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;
            return <div key={i} data-calcell
              style={{padding:"2px 3px",borderRight:i<6?"1px solid #e2e8f0":"none",
                background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,overflow:"hidden",
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
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                  style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{})}}>
                  <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:2}}>{t.repeat&&t.repeat!=="없음"&&<ArrowPathIcon style={ICON_SM}/>}{t.task}</div>
                  {t.who&&<div style={{fontSize:8,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:2}}><UserIcon style={ICON_SM}/> {t.who}</div>}
                </div>);})}
            </div>;})}
        </div>
        <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
          ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
          {Array.from({length:24},(_,h)=>{
            const getH=(due:string)=>parseInt((due.split(" ")[1]||"0:0").split(":")[0])||0;
            return <div key={h} style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:10,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
              </div>
              {wDates.map((d,i)=>{
                const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
                const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                const hTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&t.due.includes(" ")&&getH(t.due)===h);
                const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
                return <div key={i} data-calcell
                  style={{borderRight:i<6?"1px solid #f1f5f9":"none",
                    background:isDragOverCell?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                    outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                    padding:hTodos.length>0?"2px 3px":0,overflow:"hidden",
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
                      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                      style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{})}}>
                      <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}><span style={{fontSize:8,fontWeight:700,opacity:.9}}>{tl} </span>{t.task}</div>
                      {t.who&&<div style={{fontSize:7,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:1}}><UserIcon style={{width:8,height:8,flexShrink:0}}/> {t.who}</div>}
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

    {calView==="month"&&<MultiMonthView calY={calY} calM={calM} ftodos={ftodosExpanded} todayStr={todayStr} gPr={gPr} onEvClick={openEvPop} onDayClick={(e,ds)=>openQA(e,ds,0)} onMoreClick={(e,ds,ts)=>{e.stopPropagation();const zm=parseFloat(getComputedStyle(document.documentElement).zoom)||1;const r=(e.currentTarget as HTMLElement).getBoundingClientRect();const vw=window.innerWidth/zm;const vh=window.innerHeight/zm;setCalDayPop({ds,todos:ts,x:Math.max(8,Math.min(r.right/zm+4,vw-292)),y:Math.max(8,Math.min(r.top/zm,vh-370))});setCalEvPop(null);setCalQA(null);}} setCalDate={setCalDate} setCalView={setCalView} calDays={calDays} evStyle={evStyle} calDragId={calDragId} calDragOverDs={calDragOverDs} onCalDragStart={calDragStart} onCalDragEnd={calDragEnd} onCalDrop={calDropOnDate} setCalDragOverDs={setCalDragOverDs} sidebarDragId={sidebarDragId} calTodayKey={calTodayKey} isMobile={isMobile}/>}

    {calView==="custom"&&(()=>{
      const cDates=customDates();
      const hourH=48;
      const now=new Date();
      const nowTop=(now.getHours()*60+now.getMinutes())/60*hourH;
      const hasToday=cDates.some(d=>dateStr(d.getFullYear(),d.getMonth(),d.getDate())===todayStr);
      return <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",display:"flex",flexDirection:"column" as const}}>
        {/* 헤더: 요일 + 날짜 */}
        <div style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
          {cDates.map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
            return <div key={i} style={{textAlign:"center",padding:"10px 4px",borderRight:i<customDays-1?"1px solid #e2e8f0":"none",background:isT?"#eff6ff":isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
              <div style={{fontSize:10,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[d.getDay()]}</div>
              <div style={{fontSize:18,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:30,height:30,borderRadius:"50%",fontSize:15}:{})}}>{d.getDate()}</div>
            </div>;})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:36}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
          {cDates.map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
            const allDayT=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&!t.due.includes(" "));
            const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;
            return <div key={i} data-calcell
              style={{padding:"2px 3px",borderRight:i<customDays-1?"1px solid #e2e8f0":"none",
                background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,overflow:"hidden",
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
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                  style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{})}}>
                  <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:2}}>{t.repeat&&t.repeat!=="없음"&&<ArrowPathIcon style={ICON_SM}/>}{t.task}</div>
                  {t.who&&<div style={{fontSize:8,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:2}}><UserIcon style={ICON_SM}/> {t.who}</div>}
                </div>);})}
            </div>;})}
        </div>
        <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
          ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
          {Array.from({length:24},(_,h)=>{
            const getH=(due:string)=>parseInt((due.split(" ")[1]||"0:0").split(":")[0])||0;
            return <div key={h} style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:10,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
              </div>
              {cDates.map((d,i)=>{
                const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
                const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                const hTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&t.due.includes(" ")&&getH(t.due)===h);
                const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
                return <div key={i} data-calcell
                  style={{borderRight:i<customDays-1?"1px solid #f1f5f9":"none",
                    background:isDragOverCell?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                    outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                    padding:hTodos.length>0?"2px 3px":0,overflow:"hidden",
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
                      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                      style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{})}}>
                      <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}><span style={{fontSize:8,fontWeight:700,opacity:.9}}>{tl} </span>{t.task}</div>
                      {t.who&&<div style={{fontSize:7,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:1}}><UserIcon style={{width:8,height:8,flexShrink:0}}/> {t.who}</div>}
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
              return <div key={t.id+"_"+ii} onClick={e=>openEvPop(e,t)} style={{padding:"10px 16px 10px 66px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"background .12s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
                <div style={{width:4,height:28,borderRadius:2,background:p.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
                    {t.task}{od&&<span style={{color:"#dc2626",display:"inline-flex"}}><ExclamationTriangleIcon style={ICON_SM}/></span>}<RepeatBadge repeat={t.repeat}/>
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

      // 반복 업무의 경우 원본 마감일이 과거여도 다음 발생일 기준으로 섹션 배치
      // 예: "매주 월요일" 업무가 3/31 마감 → 다음 발생일 4/7 기준으로 "이번 주" 섹션에 표시
      const getEffectiveDue=(t:any):string=>{
        const originDs=t.due?.split(" ")[0]||"";
        if(!originDs||!t.repeat||t.repeat==="없음")return originDs;
        // 원본 날짜가 오늘 이후면 그대로 사용
        if(originDs>=todayStr)return originDs;
        // 원본 날짜가 과거이면 다음 발생일 계산
        let cur=new Date(originDs);
        const today=new Date(todayStr);
        while(cur<today){
          if(t.repeat==="매일")cur.setDate(cur.getDate()+1);
          else if(t.repeat==="매주")cur.setDate(cur.getDate()+7);
          else if(t.repeat==="매월")cur.setMonth(cur.getMonth()+1);
          else break;
        }
        return dateStr(cur.getFullYear(),cur.getMonth(),cur.getDate());
      };

      // 내일 날짜 문자열
      const tmrD=new Date(todayStr);tmrD.setDate(tmrD.getDate()+1);
      const tmrStr=dateStr(tmrD.getFullYear(),tmrD.getMonth(),tmrD.getDate());

      // 시간순 섹션 분리: 오늘 → 내일 → 이번 주 → 나중에 → 날짜 없음
      const secNoDate=applyOrder(active.filter(t=>!t.due?.split(" ")[0]));
      const secToday=applyOrder(active.filter(t=>{const d=getEffectiveDue(t);return !!d&&d<=todayStr;}));
      const secTmr=applyOrder(active.filter(t=>{const d=getEffectiveDue(t);return !!d&&d>todayStr&&d<=tmrStr;}));
      const secWeek=applyOrder(active.filter(t=>{const d=getEffectiveDue(t);return !!d&&d>tmrStr&&d<=weekEndD;}));
      const secLater=applyOrder(active.filter(t=>{const d=getEffectiveDue(t);return !!d&&d>weekEndD;}));

      // 섹션 헤더 컴포넌트 (sticky + 접기/펼치기 + 드롭 대상)
      // dropDate: 해당 섹션에 드롭 시 설정할 마감일 (빈 문자열이면 날짜 제거)
      const SecHdr=({label,count,open,onToggle,dropDate}:{label:string,count:number,open:boolean,onToggle:()=>void,dropDate:string})=>(
        <button
          onClick={onToggle}
          // 드래그 중인 항목을 섹션 헤더에 드롭하면 해당 날짜로 변경
          onDragOver={e => {
            if (_sidebarDragRefId !== null) {
              e.preventDefault();
              // DOM 직접 조작으로 드롭 힌트 — state 변경 없음
              (e.currentTarget as HTMLElement).style.background = "#e8f0fe";
              (e.currentTarget as HTMLElement).style.color = "#1a73e8";
            }
          }}
          onDragLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "#fafafa";
            (e.currentTarget as HTMLElement).style.color = "#94a3b8";
          }}
          onDrop={e => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.background = "#fafafa";
            (e.currentTarget as HTMLElement).style.color = "#94a3b8";
            const fromId = _sidebarDragRefId;
            if (fromId === null) return;
            const todo = todos.find(x => x.id === fromId);
            if (todo) {
              updTodo(fromId, { due: dropDate });
              flash(dropDate ? `'${todo.task}' → ${label}로 이동` : `'${todo.task}' 날짜 제거됨`);
            }
            _sidebarDragRefId = null;
            document.body.style.cursor = "";
          }}
          style={{width:"100%",padding:"7px 12px 5px",border:"none",borderBottom:"1px solid #f1f5f9",
            background:"#fafafa",
            cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:10,fontWeight:700,
            color:"#94a3b8",
            letterSpacing:".5px",textAlign:"left" as const,fontFamily:"inherit",position:"sticky" as const,top:0,zIndex:1,
            transition:"background .12s,color .12s"}}>
          <span style={{fontSize:7,display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
          {label}<span style={{fontWeight:400,marginLeft:2}}>{count}</span>
        </button>);

      // ── 할일 항목 컴포넌트 — 독립 컴포넌트로 분리해 hook을 안정적으로 사용

      const SidebarTodoItem = ({ t, isDoneSec = false }: { t: any; isDoneSec?: boolean }) => {
        const p = gPr(t.pid);
        const isAnim = pendingComplete.has(t.id);
        const isDone = t.st === "완료" || isAnim;
        const od = isOD(t.due, t.st);
        const isEd = sidebarEditId === t.id;
        const isExp = sidebarExpandId === t.id && !isDoneSec;
        const isStarred = starredIds.has(t.id);
        const dueDateStr = t.due?.split(" ")[0] || "";
        // hover는 CSS :hover로 처리 — state 변경 없음 (리렌더 방지)
        const itemRef = useRef<HTMLDivElement>(null);

        // 날짜 라벨 — Google Tasks 스타일
        const today = new Date();
        const todayS = dateStr(today.getFullYear(), today.getMonth(), today.getDate());
        const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
        const tmrS = dateStr(tmr.getFullYear(), tmr.getMonth(), tmr.getDate());
        const dueLabel = dueDateStr === todayS ? "오늘"
          : dueDateStr === tmrS ? "내일"
          : dueDateStr ? `${parseInt(dueDateStr.slice(5,7))}월 ${parseInt(dueDateStr.slice(8,10))}일(${fDow(dueDateStr)})` : "";

        // 순서 변경 드롭 처리 — _sidebarDragRefId를 유지하여 wrapper onDrop으로 날짜 변경 버블링
        const handleDrop = (e: React.DragEvent) => {
          e.preventDefault();
          const fromId = _sidebarDragRefId;
          if (fromId === null || fromId === t.id) return;
          const allIds = myAll.map((x: any) => x.id);
          const base = [...new Set([...sidebarOrder.filter((id: number) => allIds.includes(id)), ...allIds])];
          const from = base.indexOf(fromId); const to = base.indexOf(t.id);
          if (from >= 0 && to >= 0) {
            const neo = [...base]; neo.splice(from, 1); neo.splice(to, 0, fromId);
            setSidebarOrder(neo);
          }
          // _sidebarDragRefId는 null로 안 함 — wrapper onDrop에서 날짜 변경 + 정리
        };

        return (
          <div
            ref={itemRef}
            // 항상 draggable — 누르고 이동하면 바로 드래그 시작
            draggable={!isDoneSec && !isEd && !isExp}
            onDragStart={e => {
              _sidebarDragRefId = t.id;
              document.body.style.cursor = "grabbing";
              // 캘린더 셀 드롭용 state — 지연 설정으로 드래그 시작 즉시성 확보
              setTimeout(() => setSidebarDragId(t.id), 0);
              // 원본 항목 시각 피드백 (DOM 직접 조작)
              if (itemRef.current) { itemRef.current.style.opacity = "0.4"; }
              // 드래그 ghost 이미지
              const ghost = document.createElement("div");
              ghost.style.cssText = `position:absolute;top:${window.scrollY}px;left:-9999px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:9px 14px 9px 12px;font-size:13px;font-weight:500;color:#1e293b;box-shadow:0 8px 24px rgba(0,0,0,.18);width:220px;white-space:nowrap;overflow:hidden;font-family:Pretendard,system-ui,sans-serif;box-sizing:border-box;pointer-events:none;`;
              const lbl = document.createElement("span");
              lbl.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
              lbl.textContent = t.task;
              ghost.appendChild(lbl);
              document.body.appendChild(ghost);
              ghost.getBoundingClientRect();
              e.dataTransfer.setDragImage(ghost, 16, 22);
              requestAnimationFrame(() => { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); });
            }}
            onDragEnd={() => {
              _sidebarDragRefId = null;
              document.body.style.cursor = "";
              if (itemRef.current) { itemRef.current.style.opacity = ""; }
              setSidebarDragId(null); setSidebarDragOver(null); setCalDragOverDs(null); setCalDragOverH(null);
            }}
            // 드롭 대상 — 다른 항목이 이 위로 드래그 중일 때 파란 선 표시
            onDragOver={e => {
              e.preventDefault();
              if (_sidebarDragRefId !== null && _sidebarDragRefId !== t.id) {
                // DOM 직접 조작으로 드롭 힌트 표시 — state 변경 없음
                if (itemRef.current) itemRef.current.style.borderTopColor = "#2563eb";
              }
            }}
            onDragLeave={() => {
              if (itemRef.current) itemRef.current.style.borderTopColor = "transparent";
            }}
            onDrop={e => {
              if (itemRef.current) itemRef.current.style.borderTopColor = "transparent";
              handleDrop(e);
            }}
            onMouseDown={e => e.stopPropagation()}
            // 클릭 → 확장 패널 (dragstart가 발생하면 click은 브라우저가 자동으로 발생시키지 않음)
            onClick={e => {
              e.stopPropagation();
              if (isDoneSec || isEd || isExp) return;
              sidebarExpand(t.id);
            }}
            style={{
              position: "relative" as const,
              padding: isDoneSec ? "8px 12px 8px 10px" : `${isExp ? "10px" : "8px"} 30px ${isExp ? "12px" : "8px"} 12px`,
              borderTop: "2px solid transparent",
              borderBottom: `1px solid ${isExp ? "#dadce0" : "#f1f5f9"}`,
              borderLeft: isExp ? "3px solid #1a73e8" : "3px solid transparent",
              display: "flex", alignItems: "flex-start", gap: 9,
              cursor: isDoneSec ? "default" : isExp ? "default" : "pointer",
              background: isExp ? "#fff" : "#fff",
              opacity: isAnim ? 0.35 : 1,
              transition: "opacity .2s,border-left-color .15s",
              userSelect: isExp ? "auto" as const : "none" as const,
              WebkitUserSelect: isExp ? "auto" as const : "none" as const,
            }}
            // hover는 onMouseEnter/Leave + DOM 직접 조작 — state 변경 없음
            onMouseEnter={e => { if (!isDoneSec && !isExp) (e.currentTarget as HTMLElement).style.background = "#f8f9fa"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isExp ? "#fff" : "#fff"; }}
          >
            {/* 완료 토글 버튼 */}
            <button
              onClick={e => { e.stopPropagation(); handleSideComplete(t.id, isDone); }}
              style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                border: `1.5px solid ${isDone ? "#22c55e" : "#d1d5db"}`,
                background: isDone ? "#22c55e" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#fff", padding: 0,
                transition: "border-color .2s,background .2s", boxSizing: "border-box" as const,
              }}
            >
              {isDone && <CheckIcon style={{ width: 10, height: 10 }} />}
            </button>

            {/* 제목 + 메타 + 확장 패널 */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* 접힌 상태: 제목 텍스트 + 메타 */}
              {!isExp && (
                <>
                  {/* 제목 — 부모 div의 onMouseUp에서 클릭 처리 */}
                  <div
                    style={{
                      fontSize: 13, fontWeight: isDone ? 400 : 500,
                      color: isDone ? "#b0bec5" : od && !isDone ? "#c0392b" : "#1e293b",
                      textDecoration: isDone ? "line-through" : "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                      cursor: isDoneSec ? "default" : "pointer",
                      display: "flex", alignItems: "center", gap: 4, lineHeight: "1.4",
                    }}
                  >
                    {t.repeat && t.repeat !== "없음" && <RepeatBadge repeat={t.repeat} />}
                    {t.task}
                  </div>
                  {/* 날짜 + 프로젝트 메타 */}
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 2, marginTop: 3 }}>
                    {dueDateStr && (
                      <span style={{ fontSize: 11, color: od && !isDone ? "#e53e3e" : "#94a3b8", lineHeight: "16px", display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {od && !isDone && <ExclamationTriangleIcon style={ICON_SM} />}
                        <CalendarIcon style={{ width: 12, height: 12 }} />
                        {dueLabel}
                      </span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#b0bec5" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.color || "#94a3b8", display: "inline-block", flexShrink: 0 }} />
                        {p.name}
                      </span>
                      {t.pri && t.pri !== "보통" && <span style={{ ...S.badge(priBg[t.pri], priC[t.pri]), fontSize: 10 }}>{t.pri}</span>}
                    </div>
                  </div>
                </>
              )}

              {/* 펼쳐진 상태: 편집 패널 (제목 contentEditable 포함) */}
              {isExp && (
                <SidebarEditExpanded
                  t={t}
                  visibleProj={visibleProj}
                  visibleMembers={visibleMembers}
                  pris={pris}
                  priC={priC}
                  priBg={priBg}
                  todayStr={todayStr}
                  updTodo={updTodo}
                  delTodo={delTodo}
                  sidebarExpand={sidebarExpand}
                  detDivRefs={detDivRefs}
                  setSidebarDetId={setSidebarDetId}
                  taskDivRefs={taskDivRefs}
                />
              )}
            </div>

            {/* 즐겨찾기 버튼 — 우상단 고정 */}
            {!isDoneSec && (
              <button
                onClick={e => { e.stopPropagation(); toggleStar(t.id); }}
                title={isStarred ? "즐겨찾기 해제" : "즐겨찾기"}
                style={{
                  position: "absolute" as const, right: 5, top: isExp ? 10 : 9,
                  width: 24, height: 24, border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: isStarred ? "#f59e0b" : "#d1d5db", padding: 0,
                  transition: "color .15s,transform .15s",
                  transform: isStarred ? "scale(1.1)" : "scale(1)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = isStarred ? "#d97706" : "#94a3b8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = isStarred ? "#f59e0b" : "#d1d5db"; }}
              >
                {isStarred ? <StarIcon style={ICON_SM} /> : <StarOutlineIcon style={ICON_SM} />}
              </button>
            )}
          </div>
        );
      };

      return (
        <div style={{ width: 268, flexShrink: 0, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,.10)", border: "1px solid #e2e8f0", position: "sticky", top: 102, alignSelf: "flex-start", display: "flex", flexDirection: "column" as const, maxHeight: "calc(100vh - 112px)" }}>

          {/* 헤더: 사용자 정보 + 진행률 바 */}
          <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: myAll.length > 0 ? 7 : 0 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>나의 할 일</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{currentUser} · {active.length}건 진행 · {done.length}건 완료</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: memberColors[currentUser || ""] || `linear-gradient(135deg,${avColor(currentUser || "")},${avColor2(currentUser || "")})`, fontSize: 14, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                {(currentUser || "?").slice(-1)}
              </div>
            </div>
            {myAll.length > 0 && (
              <div style={{ height: 3, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }} title={`${pct}% 완료`}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#22c55e" : "#2563eb", borderRadius: 99, transition: "width .4s" }} />
              </div>
            )}
          </div>

          {/* 업무 추가 폼 */}
          <SidebarAddTask
            adding={calSidebarAdding} setAdding={setCalSidebarAdding}
            title={calSidebarAddTitle} setTitle={setCalSidebarAddTitle}
            visibleProj={visibleProj} visibleMembers={visibleMembers} pris={pris} priC={priC}
            currentUser={currentUser} todayStr={todayStr}
            addTodo={addTodo} flash={flash}
          />

          {/* 목록 스크롤 영역 */}
          <div style={{ flex: 1, overflowY: "auto" as const }}>

            {/* 완료 애니메이션 중인 항목 */}
            {animating.map((t: any) => <SidebarTodoItem key={t.id + "_sb"} t={t} />)}

            {/* 섹션별 드롭 영역 — 헤더뿐 아니라 영역 전체에 드롭 가능 */}
            {([
              { label: "오늘", items: secToday, open: secTodayOpen, toggle: () => setSecTodayOpen(v => !v), dropDate: todayStr },
              { label: "내일", items: secTmr, open: secTmrOpen, toggle: () => setSecTmrOpen(v => !v), dropDate: tmrStr },
              { label: "이번 주", items: secWeek, open: secWeekOpen, toggle: () => setSecWeekOpen(v => !v), dropDate: weekEndD },
              { label: "나중에", items: secLater, open: secLaterOpen, toggle: () => setSecLaterOpen(v => !v), dropDate: qDays(14) },
              { label: "날짜 없음", items: secNoDate, open: secNodateOpen, toggle: () => setSecNodateOpen(v => !v), dropDate: "" },
            ] as const).map(sec => (
              <div key={sec.label}
                onDragOver={e => {
                  if (_sidebarDragRefId !== null) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onDrop={e => {
                  e.preventDefault();
                  const fromId = _sidebarDragRefId;
                  if (fromId === null) return;
                  const todo = todos.find(x => x.id === fromId);
                  if (todo) {
                    updTodo(fromId, { due: sec.dropDate });
                    flash(sec.dropDate ? `'${todo.task}' → ${sec.label}로 이동` : `'${todo.task}' 날짜 제거됨`);
                  }
                  _sidebarDragRefId = null;
                  document.body.style.cursor = "";
                }}
              >
                <SecHdr label={sec.label} count={sec.items.length} open={sec.open} onToggle={sec.toggle} dropDate={sec.dropDate} />
                {sec.open && sec.items.map((t: any) => <SidebarTodoItem key={t.id + "_sb"} t={t} />)}
              </div>
            ))}

            {/* 빈 상태 */}
            {active.length === 0 && animating.length === 0 && (
              <div style={{ padding: "28px 16px 12px", textAlign: "center", color: "#cbd5e1", fontSize: 12, lineHeight: 1.8 }}>
                <div style={{ marginBottom: 6 }}><CheckCircleIcon style={{ width: 26, height: 26 }} /></div>
                <div>할일이 없습니다</div>
                <div style={{ fontSize: 10, marginTop: 3, color: "#d1d5db" }}>위 버튼으로 추가하세요 ↑</div>
              </div>
            )}

            {/* 완료됨 섹션 */}
            {done.length > 0 && (
              <>
                <button
                  onClick={() => setSidebarDoneOpen(v => !v)}
                  style={{ width: "100%", padding: "10px 12px", border: "none", borderTop: "1px solid #f1f5f9", background: "#fafafa", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#64748b", textAlign: "left" as const, fontFamily: "inherit" }}
                >
                  <span style={{ fontSize: 8, display: "inline-block", transform: sidebarDoneOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }}>▶</span>
                  완료됨 <span style={{ color: "#94a3b8", fontWeight: 400 }}>{done.length}</span>
                </button>
                {sidebarDoneOpen && done.map((t: any) => <SidebarTodoItem key={t.id + "_sb_done"} t={t} isDoneSec />)}
              </>
            )}
          </div>
        </div>
      );
    })()}

    {/* ── 이벤트 상세 팝오버 ─────────────────────────────────── */}
    {calEvPop&&(()=>{const t=calEvPop.todo;const p=gPr(t.pid);const od=isOD(t.due,t.st);const isInst=!!t._instance;return(
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",left:calEvPop.x,top:calEvPop.y,zIndex:9100,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.20)",border:`1px solid ${isInst?"#93c5fd":"#e2e8f0"}`,width:296}}>
        {/* 반복 인스턴스 안내 배너 */}
        {isInst&&<div style={{padding:"6px 14px",background:"#eff6ff",borderRadius:"12px 12px 0 0",fontSize:10,color:"#2563eb",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
          <ArrowPathIcon style={{width:12,height:12}}/> 반복 일정 · 원본 날짜: {t._originDue}
        </div>}
        <div style={{padding:"12px 14px 10px",display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:4,borderRadius:2,background:p.color,flexShrink:0,minHeight:48,alignSelf:"stretch",opacity:isInst?.6:1}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:6,lineHeight:1.3}}>
              {t.task}{od&&<span style={{color:"#dc2626",marginLeft:4,display:"inline-flex"}}><ExclamationTriangleIcon style={ICON_SM}/></span>}
            </div>
            <div style={{fontSize:11,color:"#64748b",display:"flex",flexDirection:"column" as const,gap:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:p.color,display:"inline-block",flexShrink:0}}/><span style={{color:p.color,fontWeight:600}}>{p.name}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:3}}><UserIcon style={ICON_SM}/> {t.who||"미배정"}</div>
              {t.due&&<div style={{display:"flex",alignItems:"center",gap:3}}><CalendarIcon style={ICON_SM}/> {t.due}</div>}
            </div>
            <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap" as const}}>
              <span style={{...S.badge(priBg[t.pri],priC[t.pri]),fontSize:10}}>{t.pri}</span>
              <span style={{...S.badge(stBg[t.st],stC[t.st]),fontSize:10}}>{t.st}</span>
              {t.repeat&&t.repeat!=="없음"&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#f0fdf4",color:"#16a34a",display:"inline-flex",alignItems:"center",gap:2}}><ArrowPathIcon style={ICON_SM}/> {repeatLabel(t.repeat)}</span>}
            </div>
          </div>
          <button onClick={()=>setCalEvPop(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:"0 2px",flexShrink:0,lineHeight:1,display:"flex",alignItems:"center"}}><XMarkIcon style={ICON_SM}/></button>
        </div>
        <div style={{padding:"8px 14px 12px",borderTop:"1px solid #f1f5f9",display:"flex",gap:6}}>
          {/* 수정: canEdit 권한 체크 */}
          {canEdit(t.who)&&<button onClick={()=>{setEditMod(isInst?{...t,due:t._originDue}:t);setCalEvPop(null);}} style={{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,color:"#475569",fontWeight:500,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:3}}><PencilSquareIcon style={ICON_SM}/> {isInst?"원본 수정":"수정"}</button>}
          {/* 완료: canEdit 권한 체크 */}
          {t.st!=="완료"&&!isInst&&canEdit(t.who)&&<button onClick={()=>{updTodo(t.id,{st:"완료",done:todayStr});setCalEvPop(null);flash("완료 처리되었습니다");}} style={{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #bbf7d0",background:"#f0fdf4",cursor:"pointer",fontSize:12,color:"#16a34a",fontWeight:600,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:3}}><CheckIcon style={{width:12,height:12}}/> 완료</button>}
          {/* 삭제: canDelete 권한 체크 */}
          {!isInst&&canDelete(t.who)&&<button onClick={()=>{if(confirm(`"${t.task}" 업무를 삭제하시겠습니까?`)){delTodo(t.id);setCalEvPop(null);}}} style={{padding:"6px 10px",borderRadius:6,border:"1px solid #fca5a5",background:"#fff5f5",cursor:"pointer",fontSize:12,color:"#dc2626",display:"inline-flex",alignItems:"center"}}><TrashIcon style={ICON_SM}/></button>}
        </div>
      </div>
    );})()}

    {/* ── 빠른 업무 추가 팝오버 ──────────────────────────────── */}
    {calQA&&(()=>{
      const qd=(n:number)=>{const d=new Date(calQA.ds);d.setDate(d.getDate()+n);return dateStr(d.getFullYear(),d.getMonth(),d.getDate());};
      const selProj=visibleProj.find(p=>String(p.id)===calQAPid);
      const iconBtn=(active:boolean)=>({display:"inline-flex",alignItems:"center",gap:3,fontSize:11,padding:"3px 8px",borderRadius:99,border:`1px solid ${active?"#2563eb":"#e2e8f0"}`,background:active?"#eff6ff":"#f8fafc",color:active?"#2563eb":"#64748b",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" as const});
      return <div onClick={e=>e.stopPropagation()} style={{position:"fixed",left:calQA.x,top:calQA.y,zIndex:9100,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.20)",border:"1.5px solid #2563eb",width:300}}>
        <div style={{padding:"12px 14px 8px"}}>
          <input autoFocus value={calQATitle} onChange={e=>setCalQATitle(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")saveQA();if(e.key==="Escape"){setCalQA(null);setCalQATitle("");}}}
            placeholder="업무내용 입력..."
            style={{width:"100%",padding:"8px 10px",border:"1.5px solid #2563eb",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box" as const}}/>
          {/* 아이콘 빠른선택 */}
          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap" as const}}>
            <button style={iconBtn(!!calQADue)} onClick={()=>setCalQAPicker(calQAPicker==="date"?null:"date")}>
              <CalendarIcon style={ICON_SM}/> {calQADue?calQADue.slice(5).replace("-","/"):"날짜"}
              {calQADue&&<span onClick={ev=>{ev.stopPropagation();setCalQADue("");setCalQAPicker(null);}} style={{marginLeft:2,color:"#94a3b8"}}>×</span>}
            </button>
            <button style={iconBtn(!!calQAPid)} onClick={()=>setCalQAPicker(calQAPicker==="proj"?null:"proj")}>
              <FolderIcon style={ICON_SM}/> {selProj?<><span style={{width:6,height:6,borderRadius:"50%",background:selProj.color,display:"inline-block"}}/>{selProj.name}</>:"프로젝트"}
            </button>
            <button style={iconBtn(!!calQAWho&&calQAWho!==currentUser)} onClick={()=>setCalQAPicker(calQAPicker==="who"?null:"who")}>
              <UserIcon style={ICON_SM}/> {calQAWho||"담당자"}
            </button>
            <button style={iconBtn(calQAPri!=="보통")} onClick={()=>setCalQAPicker(calQAPicker==="pri"?null:"pri")}>
              <BoltIcon style={ICON_SM}/> {calQAPri}
            </button>
          </div>
          {/* 피커 패널 */}
          {calQAPicker==="date"&&<div style={{marginTop:8,padding:"8px 10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap" as const}}>
              <button onClick={()=>{setCalQADue(calQA.ds);setCalQAPicker(null);}} style={{fontSize:10,padding:"2px 8px",borderRadius:99,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#334155",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:2}}><CalendarIcon style={ICON_SM}/> {calQA.ds.slice(5).replace("-","/")}</button>
              {([["오늘",0],["내일",1],["다음주",7]] as [string,number][]).map(([l,n])=>
                <button key={l} onClick={()=>{setCalQADue(qd(n));setCalQAPicker(null);}} style={{fontSize:10,padding:"2px 8px",borderRadius:99,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#334155",fontFamily:"inherit"}}>{l}</button>)}
            </div>
            <input type="date" defaultValue={calQADue} onChange={e=>{setCalQADue(e.target.value);setCalQAPicker(null);}} style={{width:"100%",fontSize:11,padding:"3px 6px",border:"1px solid #e2e8f0",borderRadius:7,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const}}/>
          </div>}
          {calQAPicker==="proj"&&<div style={{marginTop:8,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden",maxHeight:160,overflowY:"auto" as const}}>
            {/* 트리형 프로젝트 — 상위 + 세부 들여쓰기 */}
            {visibleProj.filter(pr=>!pr.parentId).map(pr=>{
              const children=visibleProj.filter(ch=>ch.parentId===pr.id);
              const rowS=(id:number)=>({display:"flex",alignItems:"center" as const,gap:6,padding:"7px 10px",cursor:"pointer",fontSize:12,color:"#334155",background:String(id)===calQAPid?"#eff6ff":"transparent"});
              return <div key={pr.id}>
                <div onClick={()=>{setCalQAPid(String(pr.id));setCalQAPicker(null);}} style={{...rowS(pr.id),fontWeight:600}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=String(pr.id)===calQAPid?"#eff6ff":"#f1f5f9"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=String(pr.id)===calQAPid?"#eff6ff":"transparent"}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:pr.color,display:"inline-block",flexShrink:0}}/>
                  {pr.name}{String(pr.id)===calQAPid&&<span style={{marginLeft:"auto",display:"inline-flex"}}><CheckIcon style={{width:12,height:12,color:"#2563eb"}}/></span>}
                </div>
                {children.map(ch=>(
                  <div key={ch.id} onClick={()=>{setCalQAPid(String(ch.id));setCalQAPicker(null);}} style={{...rowS(ch.id),paddingLeft:24,fontSize:11}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=String(ch.id)===calQAPid?"#eff6ff":"#f1f5f9"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=String(ch.id)===calQAPid?"#eff6ff":"transparent"}>
                    <span style={{color:"#cbd5e1",fontSize:9}}>└</span>
                    <span style={{width:6,height:6,borderRadius:"50%",background:ch.color,display:"inline-block",flexShrink:0}}/>
                    {ch.name}{String(ch.id)===calQAPid&&<span style={{marginLeft:"auto",display:"inline-flex"}}><CheckIcon style={{width:12,height:12,color:"#2563eb"}}/></span>}
                  </div>
                ))}
              </div>;
            })}
          </div>}
          {calQAPicker==="who"&&<div style={{marginTop:8,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden",maxHeight:160,overflowY:"auto" as const}}>
            {visibleMembers.map(m=><div key={m} onClick={()=>{setCalQAWho(m);setCalQAPicker(null);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",cursor:"pointer",fontSize:12,color:"#334155",background:m===calQAWho?"#eff6ff":"transparent"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=m===calQAWho?"#eff6ff":"#f1f5f9"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=m===calQAWho?"#eff6ff":"transparent"}>
              {m}{m===calQAWho&&<span style={{marginLeft:"auto",display:"inline-flex"}}><CheckIcon style={{width:12,height:12,color:"#2563eb"}}/></span>}
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
        <div style={{fontSize:12,fontWeight:700,color:"#334155",display:"flex",alignItems:"center",gap:3}}><CalendarIcon style={ICON_SM}/> {calDayPop.ds.slice(5).replace("-","/")} <span style={{color:"#94a3b8",fontWeight:400}}>({calDayPop.todos.length}건)</span></div>
        <button onClick={()=>setCalDayPop(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",lineHeight:1,display:"flex",alignItems:"center"}}><XMarkIcon style={ICON_SM}/></button>
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
  </div>;
}
