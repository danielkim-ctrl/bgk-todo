import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { S } from "../styles";
import { isOD, dDay, fDow, fmt2, stripHtml, sanitize } from "../utils";
import { usePermission } from "../auth/PermissionContext";
import { REPEAT_OPTS } from "../constants";
import { avColor, avColor2, avInitials } from "../utils/avatarUtils";
import { Sidebar } from "../components/sidebar/Sidebar";
import { AddTodoSection } from "../components/todo/AddTodoSection";
import { MemoView } from "../components/todo/MemoView";
import { ListCards } from "../components/todo/ListCards";
import { SectionLabel } from "../components/ui/SectionLabel";
import { DropPanel } from "../components/ui/DropPanel";
import { RepeatBadge } from "../components/ui/RepeatBadge";
import { ColumnFilterDropdown } from "../components/ui/ColumnFilterDropdown";
import { Bars3Icon, ListBulletIcon, FolderIcon, UserIcon, ArrowPathIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, CheckIcon, CheckCircleIcon, FlagIcon, PencilSquareIcon, TrashIcon, InboxIcon, StarIcon, StarOutlineIcon, XMarkIcon, BookmarkIcon, ICON_SM } from "../components/ui/Icons";
import { Chip } from "../components/ui/Chip";
import { SavedFilter, Filters } from "../types";

// ── hover 플로팅 액션 팝업 (mouseLeave 없이 document mousemove로 좌표 감지) ──
// DateTimePicker처럼 mouseEnter/mouseLeave를 사용하지 않고,
// document의 mousemove 이벤트에서 마우스 좌표가 행 또는 팝업 영역 안인지 직접 계산.
// DOM 이벤트 경계가 아닌 좌표 기반이므로 gap/zoom에 무관하게 깜빡임이 원천 차단됨.
function HoverPopup({hoverRow,hoverRowRect,setHoverRow,setHoverRowRect,sorted,tblDivRef,setEditMod,delTodo,popupOpen}:{
  hoverRow:number|null; hoverRowRect:{top:number;height:number}|null;
  setHoverRow:(v:number|null)=>void; setHoverRowRect:(v:{top:number;height:number}|null)=>void;
  sorted:any[]; tblDivRef:React.RefObject<HTMLDivElement>;
  setEditMod:(v:any)=>void; delTodo:(id:number)=>void;
  popupOpen:boolean;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  // 다른 팝업(DropPanel, DateTimePicker 등)이 열리면 hover 팝업 즉시 숨김
  useEffect(()=>{
    if (popupOpen) { setHoverRow(null); setHoverRowRect(null); }
  }, [popupOpen]);

  // 마우스가 테이블 영역 또는 팝업 영역 밖으로 나가면 숨김
  // 테이블 내부에서 행 간 이동 시에는 mouseEnter가 hoverRow를 갱신하므로 여기서 지우지 않음
  useEffect(()=>{
    if (!hoverRow || !hoverRowRect || popupOpen) return;
    const onMove = (e: MouseEvent) => {
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      const mx = e.clientX / zoom;
      const my = e.clientY / zoom;

      // 테이블 전체 영역 확인 — 행이 아닌 테이블 기준으로 체크하여 행 간 이동 시 깜빡임 방지
      const tblRect = tblDivRef.current?.getBoundingClientRect();
      const tblLeft = tblRect ? tblRect.left / zoom : 0;
      const tblRight = tblRect ? tblRect.right / zoom : window.innerWidth / zoom;
      const tblTop = tblRect ? tblRect.top / zoom : 0;
      const tblBottom = tblRect ? tblRect.bottom / zoom : window.innerHeight / zoom;

      // 팝업 영역 확인
      const popRect = popupRef.current?.getBoundingClientRect();
      const inPopup = popRect
        ? mx >= popRect.left / zoom && mx <= popRect.right / zoom
          && my >= popRect.top / zoom && my <= popRect.bottom / zoom
        : false;

      // 팝업이 테이블 우측 6px 간격에 붙어 있어, 마우스가 간격을 통과하는 순간 감지 누락 발생
      // → tblRight를 팝업 좌측(또는 고정 여유값)까지 연장해 간격을 커버
      const rightBound = popRect ? popRect.right / zoom : tblRight + 16;
      const inTable = mx >= tblLeft && mx <= rightBound && my >= tblTop && my <= tblBottom;

      // 테이블에도 팝업에도 없으면 숨김
      if (!inTable && !inPopup) {
        setHoverRow(null);
        setHoverRowRect(null);
      }
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [hoverRow, hoverRowRect, setHoverRow, setHoverRowRect, tblDivRef, popupOpen]);

  // 권한 체크 — usePermission 훅으로 현재 사용자의 권한 확인
  const { canEdit, canDelete } = usePermission();

  if (!hoverRow || !hoverRowRect) return null;
  const t = sorted.find((x:any) => x.id === hoverRow);
  if (!t) return null;
  const isDone = t.st === "완료";

  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  const tblRect = tblDivRef.current?.getBoundingClientRect();
  const visibleRight = tblRect ? tblRect.right / zoom : window.innerWidth / zoom - 16;

  // 수정/삭제 권한 모두 없으면 팝업 자체를 숨김
  if (!canEdit(t.who) && !canDelete(t.who)) return null;

  return <div ref={popupRef}
    style={{position:"fixed",top:hoverRowRect.top / zoom,left:visibleRight + 6,height:hoverRowRect.height / zoom,
      display:"flex",alignItems:"center",gap:4,zIndex:500,
      background:"#fff",borderRadius:8,boxShadow:"0 2px 10px rgba(0,0,0,.14)",
      border:"1px solid #e2e8f0",padding:"0 8px",pointerEvents:"auto"}}>
    {!isDone&&canEdit(t.who)&&<button onClick={()=>setEditMod(t)}
      style={{background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:11,color:"#475569",borderRadius:6,padding:"3px 7px",display:"inline-flex",alignItems:"center"}}><PencilSquareIcon style={ICON_SM}/></button>}
    {canDelete(t.who)&&<button onClick={e=>{e.stopPropagation();if(confirm(`"${t.task}" 업무를 삭제하시겠습니까?`)){delTodo(t.id);setHoverRow(null);setHoverRowRect(null);}}}
      style={{background:"#fee2e2",border:"none",cursor:"pointer",fontSize:11,color:"#dc2626",borderRadius:6,padding:"3px 7px",fontWeight:700,display:"inline-flex",alignItems:"center"}}><TrashIcon style={ICON_SM}/></button>}
  </div>;
}

interface ListViewProps {
  // sidebar props
  search: string;
  setSearch: (v: string) => void;
  filters: any;
  setFilters: (v: any) => void;
  togF: (type: string, val: string) => void;
  todos: any[];
  aProj: any[];
  members: string[];
  pris: string[];
  priC: Record<string,string>;
  priBg: Record<string,string>;
  stats: string[];
  stC: Record<string,string>;
  stBg: Record<string,string>;
  favSidebar: any;
  togFavSidebar: (key: string, val: string) => void;
  isFav: (id: number) => boolean;
  gPr: (pid: number) => any;
  setChipAdd: (v: any) => void;
  setChipVal: (v: string) => void;
  setChipColor: (v: string) => void;
  projects: any[];
  hiddenProjects: number[];
  toggleHideProject: (id: number) => void;
  hiddenMembers: string[];
  toggleHideMember: (name: string) => void;
  memberColors: Record<string,string>;
  visibleProj: any[];
  visibleMembers: string[];
  // AddTodoSection props
  addTab: any;
  setAddTab: (v: any) => void;
  newRows: any[];
  setNewRows: (v: any[]) => void;
  addNR: () => void;
  saveNRs: () => void;
  saveOneNR: (i: number) => void;
  isNREmpty: (row: any) => boolean;
  setNotePopup: (v: any) => void;
  setNrDatePop: (v: any) => void;
  aiText: string;
  setAiText: (v: string) => void;
  aiFiles: any[];
  setAiFiles: (v: any[]) => void;
  aiLoad: boolean;
  aiSt: any;
  setAiSt: (v: any) => void;
  aiParsed: any;
  setAiParsed: (v: any) => void;
  parseAI: () => void;
  confirmAI: () => void;
  aiHistory?: any[];
  restoreAiHistory?: () => void;
  sorted: any[];
  currentUser: string|null;
  // list view controls
  todoView: string;
  setTodoView: (v: "list"|"memo") => void;
  memoCols: number;
  setMemoCols: (v: number) => void;
  showDone: boolean;
  setShowDone: (value: boolean | ((prev: boolean) => boolean)) => void;
  expandMode: boolean;
  setExpandMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  sortCol: string;
  sortDir: string;
  setSortCol: (v: string | null) => void;
  setSortDir: (v: string) => void;
  sortIcon: (col: string) => string;
  toggleSort: (col: string) => void;
  customSortOrders: Record<string, string[]>;
  setCustomSortOrders: (v: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
  activeSortFields: {col:string;dir:"asc"|"desc"}[];
  setActiveSortFields: (v: {col:string;dir:"asc"|"desc"}[] | ((prev: {col:string;dir:"asc"|"desc"}[]) => {col:string;dir:"asc"|"desc"}[])) => void;
  selectedIds: Set<number>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  handleCheck: (id: number, shift: boolean) => void;
  toggleSelectAll: () => void;
  selAll: (ids: number[]) => void;
  toggleFav: (id: number) => void;
  addTodo: (todo: any) => void;
  updTodo: (id: number, updates: any) => void;
  flash: (msg: string, type?: string) => void;
  delTodo: (id: number) => void;
  reorderTodo: (dragId: number, beforeId: number | null) => void;
  setEditMod: (v: any) => void;
  // cell edit
  editCell: {id: number; field: string}|null;
  setEditCell: (v: {id: number; field: string}|null) => void;
  datePop: any;
  setDatePop: (v: any) => void;
  // hover row
  hoverRow: number|null;
  setHoverRow: (v: number|null) => void;
  hoverRowRect: {top: number; height: number}|null;
  setHoverRowRect: (v: {top: number; height: number}|null) => void;
  hoverLeaveTimer: React.MutableRefObject<any>;
  // refs
  addSecRef: React.RefObject<HTMLDivElement>;
  tblDivRef: React.RefObject<HTMLDivElement>;
  // 저장된 필터
  savedFilters: SavedFilter[];
  saveCurrentFilter: (name: string, filters: Filters, search: string) => void;
  deleteSavedFilter: (id: string) => void;
  // 모바일 전용 props
  isMobile?: boolean;
  onFilterOpen?: () => void;    // 모바일 필터 바텀 시트 열기
}

export function ListView(props: ListViewProps) {
  const {
    search, setSearch, filters, setFilters, togF,
    todos, aProj, members, pris, priC, priBg, stats, stC, stBg,
    favSidebar, togFavSidebar, isFav, gPr, setChipAdd, setChipVal, setChipColor,
    projects, hiddenProjects, toggleHideProject, hiddenMembers, toggleHideMember, memberColors,
    visibleProj, visibleMembers,
    addTab, setAddTab, newRows, setNewRows, addNR, saveNRs, saveOneNR, isNREmpty,
    setNotePopup, setNrDatePop, aiText, setAiText, aiFiles, setAiFiles,
    aiLoad, aiSt, setAiSt, aiParsed, setAiParsed, parseAI, confirmAI, aiHistory, restoreAiHistory,
    sorted, currentUser,
    todoView, setTodoView, memoCols, setMemoCols, showDone, setShowDone,
    expandMode, setExpandMode, sortCol, sortDir, setSortCol, setSortDir, sortIcon, toggleSort,
    customSortOrders, setCustomSortOrders,
    activeSortFields, setActiveSortFields,
    selectedIds, allVisibleSelected, someVisibleSelected, handleCheck, toggleSelectAll, selAll,
    toggleFav, addTodo, updTodo, flash, delTodo, reorderTodo, setEditMod,
    editCell, setEditCell, datePop, setDatePop,
    hoverRow, setHoverRow, hoverRowRect, setHoverRowRect, hoverLeaveTimer,
    addSecRef, tblDivRef,
    savedFilters, saveCurrentFilter, deleteSavedFilter,
    isMobile, onFilterOpen,
  } = props;

  const { can, canEdit: permCanEdit, canDelete } = usePermission();

  // ── 저장 필터 이름 입력 상태 ────────────────────────────────────────────────
  const [sfSaving, setSfSaving] = useState(false);
  const [sfName, setSfName] = useState("");
  const sfInputRef = useRef<HTMLInputElement>(null);

  // sfSaving 활성화 시 입력 필드에 포커스
  useEffect(() => { if (sfSaving) sfInputRef.current?.focus(); }, [sfSaving]);

  // ── 컬럼 너비 조절 상태 ──────────────────────────────────────────────────────
  // 일반 모드(8컬럼) / 확장 모드(6컬럼) 각각 별도 유지 — 모드 전환 시에도 너비 기억
  const [colWidthsNormal, setColWidthsNormal] = useState([13, 27, 16, 10, 12, 9, 9, 4]);
  const [colWidthsExpand, setColWidthsExpand] = useState([13, 26, 35, 10, 12, 4]);
  const headerTableRef = useRef<HTMLTableElement>(null);
  const resizeLineRef = useRef<HTMLDivElement>(null);
  // 드래그 중 상태를 ref로 관리 — setState 없이 최신값 유지
  const colResizeDrag = useRef<{
    colIdx: number; startX: number; startWidths: number[]; tableWidth: number; isExpand: boolean;
  } | null>(null);

  // 드래그 mousemove/mouseup 전역 등록 (마운트 1회 — setColWidths*는 stable reference)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = colResizeDrag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const deltaPct = (dx / d.tableWidth) * 100;
      const newW = [...d.startWidths];
      const minW = 4; // 컬럼 최소 너비 4%
      let cur = d.startWidths[d.colIdx] + deltaPct;
      let nxt = d.startWidths[d.colIdx + 1] - deltaPct;
      if (cur < minW) { nxt += (cur - minW); cur = minW; }
      if (nxt < minW) { cur += (nxt - minW); nxt = minW; }
      newW[d.colIdx] = cur;
      newW[d.colIdx + 1] = nxt;
      if (d.isExpand) setColWidthsExpand(newW); else setColWidthsNormal(newW);
      // 드래그 라인 위치는 DOM 직접 조작 — 별도 state 업데이트 없이 반응형으로 처리
      if (resizeLineRef.current) resizeLineRef.current.style.left = e.clientX + 'px';
    };
    const onUp = () => {
      if (!colResizeDrag.current) return;
      colResizeDrag.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (resizeLineRef.current) resizeLineRef.current.style.display = 'none';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  // th 우측 끝 드래그 시작 — 해당 컬럼과 인접 컬럼 너비를 교환하는 방식
  const onColResizeStart = (e: React.MouseEvent, colIdx: number) => {
    e.preventDefault();
    e.stopPropagation(); // th onClick(정렬/필터 드롭다운) 발동 차단
    const tableEl = headerTableRef.current;
    if (!tableEl) return;
    const widths = expandMode ? colWidthsExpand : colWidthsNormal;
    const headerRect = tableEl.getBoundingClientRect();
    // 드래그 라인 높이 = 헤더 상단 ~ 바디 테이블 하단 (표 영역 안에서만 표시)
    const bodyRect = tblDivRef.current?.getBoundingClientRect();
    colResizeDrag.current = {
      colIdx, startX: e.clientX,
      startWidths: [...widths],
      tableWidth: headerRect.width,
      isExpand: expandMode,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    if (resizeLineRef.current) {
      const lineTop = headerRect.top;
      const lineHeight = (bodyRect ? bodyRect.bottom : headerRect.bottom) - lineTop;
      resizeLineRef.current.style.top = lineTop + 'px';
      resizeLineRef.current.style.height = lineHeight + 'px';
      resizeLineRef.current.style.left = e.clientX + 'px';
      resizeLineRef.current.style.display = 'block';
    }
  };

  // 더블클릭 — 현재 모드의 컬럼 너비를 기본값으로 복원
  const onColResizeReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (expandMode) setColWidthsExpand([13, 26, 35, 10, 12, 4]);
    else setColWidthsNormal([13, 27, 16, 10, 12, 9, 9, 4]);
  };

  // 현재 필터+검색어가 저장된 필터와 완전히 일치하는지 비교
  // 배열 순서가 달라도 동일 판단이 되도록 정렬 후 JSON 비교
  const normF = (f: Filters) => JSON.stringify({
    proj: [...f.proj].sort(), who: [...f.who].sort(),
    pri: [...f.pri].sort(), st: [...f.st].sort(),
    repeat: [...f.repeat].sort(), fav: f.fav || "",
  });
  const isSfActive = (sf: SavedFilter) =>
    normF(filters) === normF(sf.filters) && search === (sf.search || "");

  // 현재 필터 조합이 이미 저장되어 있는지 확인 (이름 무관, 내용 기준)
  const isDuplicateSf = () =>
    savedFilters.some(sf => normF(filters) === normF(sf.filters) && search === (sf.search || ""));

  // 저장된 필터 클릭 — 현재 적용 중이면 초기화, 아니면 적용
  const toggleSavedFilter = (sf: SavedFilter) => {
    if (isSfActive(sf)) {
      setFilters({ proj: [], who: [], pri: [], st: [], repeat: [], fav: "" });
      setSearch("");
    } else {
      setFilters(sf.filters);
      setSearch(sf.search || "");
      setSfSaving(false);
      setSfName("");
    }
  };

  // ── 리스트 드래그 정렬 상태 (정렬 미적용 시에만 활성) ────────────────────────
  const [dragRowId, setDragRowId] = useState<number|null>(null);
  const [dropBeforeId, setDropBeforeId] = useState<number|null>(null);
  const [dropAtEnd, setDropAtEnd] = useState(false);
  // 드래그 정렬은 항상 활성 — 드롭 완료 시 컬럼 정렬을 초기화해 수동 순서를 최우선으로 적용
  const canDrag = true;

  // ── 컬럼 필터 드롭다운 (Google Sheets 스타일) ──────────────────────────────
  const [filterOpenCol, setFilterOpenCol] = useState<string|null>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<{top:number;left:number;bottom:number;right:number}|null>(null);

  // 컬럼별 고유값 목록 계산 — 필터 드롭다운에 체크박스로 표시
  const getColumnValues = useMemo(() => (col: string) => {
    const countMap: Record<string, number> = {};
    todos.forEach((t: any) => {
      let val = "";
      if (col === "pid") val = gPr(t.pid).name || "미배정";
      else if (col === "who") val = t.who || "";
      else if (col === "pri") val = t.pri || "";
      else if (col === "st") val = t.st || "";
      else if (col === "due") val = t.due ? t.due.split(" ")[0] : "(없음)";
      else return;
      countMap[val] = (countMap[val] || 0) + 1;
    });
    const colorMap: Record<string, string> = {};
    if (col === "pid") visibleProj.forEach(p => { colorMap[p.name] = p.color; });
    if (col === "pri") pris.forEach(p => { colorMap[p] = priC[p]; });
    if (col === "st") stats.forEach(s => { colorMap[s] = stC[s]; });
    return Object.entries(countMap).sort(([a],[b]) => a.localeCompare(b, "ko")).map(([key, count]) => ({
      key, label: key, color: colorMap[key], count,
    }));
  }, [todos, visibleProj, pris, priC, stats, stC, gPr]);

  // 컬럼 필터 → 기존 filters/togF 연동
  // 필터 키 매핑: pid→proj, who→who, pri→pri, st→st
  const colToFilterKey = (col: string) => col === "pid" ? "proj" : col;
  const getSelectedForCol = (col: string): string[] => {
    const fk = colToFilterKey(col);
    if (fk === "proj") {
      // proj 필터는 id 문자열 → 이름으로 변환 필요
      return (filters.proj as string[]).map(v => v === "__none__" ? "미배정" : aProj.find(p => String(p.id) === v)?.name || v);
    }
    return (filters[fk as keyof typeof filters] as string[]) || [];
  };
  const handleFilterChange = (col: string, values: string[]) => {
    const fk = colToFilterKey(col);
    if (fk === "proj") {
      // 이름 → id 문자열로 역변환
      const ids = values.filter(v => v !== "__NONE__").map(name => {
        if (name === "미배정") return "__none__";
        const p = aProj.find(pr => pr.name === name);
        return p ? String(p.id) : name;
      });
      setFilters((f: any) => ({ ...f, proj: ids }));
    } else {
      const clean = values.filter(v => v !== "__NONE__");
      setFilters((f: any) => ({ ...f, [fk]: clean }));
    }
  };

  // 헤더 클릭 핸들러
  const openColumnFilter = (e: React.MouseEvent, col: string) => {
    // due, task, det 컬럼은 정렬만 지원 (값 필터 불필요)
    if (col === "task" || col === "det") {
      toggleSort(col);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterAnchorRect({ top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right });
    setFilterOpenCol(prev => prev === col ? null : col);
  };

  // 이전 커스텀 정렬 관련 변수 — 사용하지 않지만 props 호환용
  const customSortOpen = null as string | null;
  const customSortRef = useRef<HTMLDivElement|null>(null);
  const dragIdxRef = useRef<number|null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number|null>(null);

  // 메모뷰용 간단 정렬 버튼 (리스트뷰에서는 헤더 드롭다운으로 대체)
  const MemoSortButtons = () => <>{([["due","마감순"],["pri","우선순위순"],["id","기본"]] as [string,string][]).map(([col,label])=>
    <button key={col} onClick={()=>toggleSort(col)} style={{fontSize:11,padding:"3px 10px",borderRadius:99,border:`1px solid ${sortCol===col?"#2563eb":"#e2e8f0"}`,background:sortCol===col?"#2563eb":"#fff",color:sortCol===col?"#fff":"#64748b",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:3}}>
      {label}{sortCol===col&&<span style={{fontSize:10,fontWeight:700}}>{sortDir==="asc"?"▲":"▼"}</span>}
    </button>)}</>;

  // 클릭한 셀의 위치를 ref로 저장 — DropPanel이 이 위치에 portal로 표시됨
  const clickRectRef = useRef<{top:number,left:number,bottom:number,right:number}|null>(null);
  const CellEdit = ({todo, field, children, tdStyle}: {todo: any, field: string, children: React.ReactNode, tdStyle?: React.CSSProperties}) => {
    const isE = editCell?.id === todo.id && editCell?.field === field;
    const stop = () => setEditCell(null);
    const start = (e: React.MouseEvent) => {
      // 수정 권한 없으면 인라인 편집 진입 차단
      if (!permCanEdit(todo.who)) return;
      const r = e.currentTarget.getBoundingClientRect();
      clickRectRef.current = {top:r.top, left:r.left, bottom:r.bottom, right:r.right};
      setEditCell({id: todo.id, field});
    };
    const save = (val: string) => { updTodo(todo.id, {[field]: field === "pid" ? parseInt(val) : val}); stop(); };
    if (!isE) return <td style={{...S.tdc,...tdStyle}} onClick={e => { if (!permCanEdit(todo.who)) return; if (field === "due") { const r = e.currentTarget.getBoundingClientRect(); setDatePop({id: todo.id, rect: {top:r.top,left:r.left,bottom:r.bottom,right:r.right}, value: todo.due || ""}); return; } start(e); }} onMouseEnter={e => { e.currentTarget.style.cursor = permCanEdit(todo.who) ? "pointer" : "default"; }} onMouseLeave={e => { e.currentTarget.style.cursor = ""; }}>{children}</td>;
    if (field === "task") return <td style={{...S.tdc, overflow:"visible"}}><input autoFocus defaultValue={todo.task} style={S.iinp} onKeyDown={e => { if ((e as any).key === "Enter") save((e.target as HTMLInputElement).value); if ((e as any).key === "Escape") stop(); }} onBlur={e => save(e.target.value)}/></td>;
    if (field === "due") return <td style={{...S.tdc, background:"#eff6ff"}}>{children}</td>;
    const ar = clickRectRef.current || undefined;
    if (field === "pid") return <td style={S.tdc}>{children}<DropPanel anchorRect={ar} items={visibleProj.map(p => ({value: String(p.id), label: p.name, color: p.color}))} current={String(todo.pid)} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={S.dot(it.color!)}/>{it.label}</>}/></td>;
    if (field === "who") return <td style={S.tdc}>{children}<DropPanel anchorRect={ar} items={visibleMembers.map(m => ({value: m, label: m}))} current={todo.who} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{width:20,height:20,borderRadius:"50%",background:memberColors[it.label]||`linear-gradient(135deg,${avColor(it.label)},${avColor2(it.label)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0}}>{avInitials(it.label)}</span>{it.label}</>}/></td>;
    if (field === "pri") return <td style={S.tdc}>{children}<DropPanel anchorRect={ar} items={pris.map(p => ({value: p, label: p, color: priC[p]}))} current={todo.pri} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{...S.dot(it.color!), width:8, height:8}}/>{it.label}</>}/></td>;
    if (field === "st") return <td style={S.tdc}>{children}<DropPanel anchorRect={ar} items={stats.map(s => ({value: s, label: s, color: stC[s]}))} current={todo.st} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{...S.dot(it.color!), width:8, height:8}}/>{it.label}</>}/></td>;
    if (field === "repeat") return <td style={S.tdc}>{children}<DropPanel anchorRect={ar} items={REPEAT_OPTS.map(r => ({value: r, label: r}))} current={todo.repeat || "없음"} onSelect={v => save(v)} onClose={stop} alignRight/></td>;
    return <td style={S.tdc}>{children}</td>;
  };

  // ── 모바일: 활성 필터 수 계산 ─────────────────────────────────────────────────
  // 검색어와 필터 칩 수를 합산하여 필터 버튼에 배지로 표시
  const activeFilterCount =
    (filters.proj?.length || 0) +
    (filters.who?.length || 0) +
    (filters.pri?.length || 0) +
    (filters.st?.length || 0) +
    (filters.repeat?.length || 0) +
    (filters.fav ? 1 : 0);

  // ── 모바일 뷰: 데스크톱 테이블 대신 카드형 리스트 렌더링 ─────────────────────
  // 사이드바·AddTodoSection·테이블 모두 숨기고 ListCards(카드형) 컴포넌트만 표시
  if (isMobile) {
    return (
      <ListCards
        sorted={sorted}
        gPr={gPr}
        priC={priC}
        priBg={priBg}
        stC={stC}
        stBg={stBg}
        isFav={isFav}
        showDone={showDone}
        setShowDone={setShowDone}
        onCardTap={(todo) => setEditMod(todo)}
        onComplete={(id) => {
          // 완료 처리: 현재 상태가 완료면 이전 상태(대기)로, 아니면 완료로 전환
          const todo = sorted.find((t: any) => t.id === id);
          if (todo) updTodo(id, { st: todo.st === "완료" ? (stats[0] || "대기") : "완료" });
        }}
        onDelete={(id) => {
          if (confirm("이 업무를 삭제하시겠습니까?")) delTodo(id);
        }}
        search={search}
        setSearch={setSearch}
        activeFilterCount={activeFilterCount}
        onFilterOpen={onFilterOpen || (() => {})}
        filters={filters}
        togF={togF}
      />
    );
  }

  return <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
    <Sidebar
      search={search} setSearch={setSearch} filters={filters} togF={togF}
      todos={todos} aProj={aProj} members={members} pris={pris} priC={priC}
      stats={stats} stC={stC} favSidebar={favSidebar} togFavSidebar={togFavSidebar}
      isFav={isFav} gPr={gPr} setChipAdd={setChipAdd} setChipVal={setChipVal}
      setChipColor={setChipColor} projects={projects}
      hiddenProjects={hiddenProjects} toggleHideProject={toggleHideProject}
      hiddenMembers={hiddenMembers} toggleHideMember={toggleHideMember}
    />

    <div style={{flex:1,minWidth:0}}>
    <div ref={addSecRef} style={{overflow:"hidden"}}>
    <AddTodoSection
      addTab={addTab} setAddTab={setAddTab} newRows={newRows} setNewRows={setNewRows}
      addNR={addNR} saveNRs={saveNRs} saveOneNR={saveOneNR} isNREmpty={isNREmpty}
      aProj={visibleProj} members={visibleMembers} pris={pris} setNotePopup={setNotePopup}
      setNrDatePop={setNrDatePop} aiText={aiText} setAiText={setAiText}
      aiFiles={aiFiles} setAiFiles={setAiFiles}
      aiLoad={aiLoad} aiSt={aiSt} setAiSt={setAiSt} aiParsed={aiParsed}
      setAiParsed={setAiParsed} parseAI={parseAI} confirmAI={confirmAI}
      aiHistory={aiHistory} restoreAiHistory={restoreAiHistory}
      priC={priC} priBg={priBg} currentUser={currentUser}
      setDatePop={setDatePop}
    />
    </div>

    <div style={{position:"sticky",top:92,zIndex:20,background:"#f0f4f8",paddingTop:4,paddingBottom:4,marginBottom:0}}>
    <SectionLabel num="02" title="업무 리스트" sub={`총 ${sorted.length}건${filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search?" (필터 적용 중)":""}`}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {todoView==="memo"&&<div style={{display:"flex",gap:3}}>
          {([1,2,3,4,5] as const).map(n=>(
            <button key={n} onClick={()=>setMemoCols(n)}
              style={{padding:"5px 12px",borderRadius:6,border:`1.5px solid ${memoCols===n?"#2563eb":"#e2e8f0"}`,background:memoCols===n?"#2563eb":"#fff",color:memoCols===n?"#fff":"#64748b",fontSize:13,fontWeight:memoCols===n?700:500,cursor:"pointer"}}>
              {n}
            </button>))}
        </div>}
        <div style={{display:"flex",border:"1.5px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
          {([["list","리스트"],["memo","메모"]] as [string,string][]).map(([v,label])=>
            <button key={v} onClick={()=>setTodoView(v as "list"|"memo")} style={{fontSize:11,padding:"4px 12px",border:"none",borderRight:v==="list"?"1.5px solid #e2e8f0":"none",background:todoView===v?"#2563eb":"#fff",color:todoView===v?"#fff":"#64748b",cursor:"pointer",fontWeight:todoView===v?700:400,transition:"all .15s",display:"inline-flex",alignItems:"center",gap:3}}>
              {v==="list"?<Bars3Icon style={ICON_SM}/>:<ListBulletIcon style={ICON_SM}/>}{label}
            </button>)}
        </div>
      </div>
    </SectionLabel>
    {/* B안 통합 바 — Row1: 검색+건수+상세펼치기, Row2: 필터/정렬 칩 (리스트뷰) */}
    {todoView==="list"&&<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px 8px 0 0",borderBottom:"none"}}>
      {/* Row 1: 검색 pill + 건수 + 상세펼치기 버튼 */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:(filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search||filters.fav||sortCol||activeSortFields.length)?"1px solid #f1f5f9":"none"}}>
        {/* 검색 입력 — 사이드바에서 이동, pill 스타일 (Google 검색창 형태) */}
        <div style={{position:"relative",display:"flex",alignItems:"center",background:"#f1f3f4",borderRadius:24,padding:"6px 12px 6px 34px",flex:1,maxWidth:320}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5f6368",display:"flex",pointerEvents:"none"}}><MagnifyingGlassIcon style={ICON_SM}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="업무명, 상세내용 검색..." style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12,color:"#202124",fontFamily:"inherit"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"#80868b",border:"none",borderRadius:"50%",width:14,height:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}}><XMarkIcon style={{width:9,height:9,color:"#fff"}}/></button>}
        </div>
        {/* 건수 — 필터 적용 결과 미완료/완료 건수 */}
        <span style={{fontSize:12,color:"#64748b",marginLeft:"auto",flexShrink:0,whiteSpace:"nowrap" as const}}>
          <span style={{fontWeight:700,color:"#334155"}}>{sorted.filter(t=>t.st!=="완료").length}건 미완료</span>
          <span style={{margin:"0 6px",color:"#cbd5e1"}}>·</span>
          <span>{sorted.filter(t=>t.st==="완료").length}건 완료</span>
        </span>
        {/* 상세 펼치기/접기 — 상세내용 컬럼 표시 여부 토글 */}
        <button onClick={()=>setExpandMode(p=>!p)} title="상세내용 펼치기/접기"
          style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,padding:"4px 10px",borderRadius:6,border:`1.5px solid ${expandMode?"#7c3aed":"#e2e8f0"}`,background:expandMode?"#7c3aed":"#fff",color:expandMode?"#fff":"#94a3b8",cursor:"pointer",fontWeight:600,transition:"all .15s",flexShrink:0}}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="4.5" height="11" rx="1" fill={expandMode?"#fff":"#cbd5e1"}/>
            <rect x="7" y="1" width="5" height="5" rx="1" fill={expandMode?"#c4b5fd":"#e2e8f0"}/>
            <rect x="7" y="7" width="5" height="5" rx="1" fill={expandMode?"#c4b5fd":"#e2e8f0"}/>
          </svg>
          {expandMode?"상세 접기":"상세 펼치기"}
        </button>
      </div>
      {/* 저장된 필터 칩 행 — 저장된 필터가 있을 때 항상 표시 (현재 적용 중이면 진한 색으로 강조) */}
      {savedFilters.length > 0 && <div style={{display:"flex",flexWrap:"wrap" as const,alignItems:"center",gap:6,padding:"4px 12px 8px",paddingBottom:(filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search||filters.fav||sortCol||activeSortFields.length>0)?2:8}}>
        <BookmarkIcon style={{...ICON_SM, color:"#94a3b8", flexShrink:0}}/>
        {savedFilters.map(sf=>{
          const on = isSfActive(sf);
          return (
            <Chip key={sf.id} active
              bg={on ? "#2563eb" : "#f1f5f9"} fg={on ? "#fff" : "#64748b"} borderColor={on ? "#2563eb" : "#e2e8f0"}
              icon={<BookmarkIcon style={ICON_SM}/>}
              onClick={()=>toggleSavedFilter(sf)}
              onRemove={()=>deleteSavedFilter(sf.id)}
            >{sf.name}</Chip>
          );
        })}
      </div>}
      {/* Row 2: 필터 칩 + 정렬 칩 — active 항목 있을 때만 표시 */}
      {(filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search||filters.fav||sortCol||activeSortFields.length>0)&&<div style={{display:"flex",flexWrap:"wrap" as const,alignItems:"center",gap:6,padding:"6px 12px 8px",paddingLeft:savedFilters.length>0?32:12,paddingTop:savedFilters.length>0?2:6}}>
        {/* 검색어 칩 */}
        {search&&<Chip active bg="#dbeafe" fg="#1d4ed8" borderColor="#bfdbfe" icon={<MagnifyingGlassIcon style={ICON_SM}/>} onRemove={()=>setSearch("")}>"{search}"</Chip>}
        {/* 즐겨찾기 칩 */}
        {filters.fav&&<Chip active bg="#fef9c3" fg="#854d0e" borderColor="#fde68a" icon={<StarIcon style={ICON_SM}/>} onRemove={()=>togF("fav","")}>즐겨찾기</Chip>}
        {/* 프로젝트 칩 — 보라색 계열 */}
        {filters.proj.map((v:string)=><Chip key={v} active bg="#ede9fe" fg="#6d28d9" borderColor="#ddd6fe" icon={<FolderIcon style={ICON_SM}/>} onRemove={()=>togF("proj",v)}>{v==="__none__"?"미배정":aProj.find(p=>String(p.id)===v)?.name||v}</Chip>)}
        {/* 담당자 칩 — 분홍색 계열 */}
        {filters.who.map((v:string)=><Chip key={v} active bg="#fce7f3" fg="#9d174d" borderColor="#fbcfe8" icon={<UserIcon style={ICON_SM}/>} onRemove={()=>togF("who",v)}>{v}</Chip>)}
        {/* 우선순위 칩 — 우선순위별 색상 */}
        {filters.pri.map((v:string)=><Chip key={v} active bg={priBg[v]} fg={priC[v]} borderColor={`${priC[v]}44`} icon={<FlagIcon style={ICON_SM}/>} onRemove={()=>togF("pri",v)}>{v}</Chip>)}
        {/* 상태 칩 — 상태별 색상 */}
        {filters.st.map((v:string)=><Chip key={v} active bg={stBg[v]} fg={stC[v]} borderColor={`${stC[v]}44`} icon={<CheckCircleIcon style={ICON_SM}/>} onRemove={()=>togF("st",v)}>{v}</Chip>)}
        {/* 반복 칩 — 초록색 계열 */}
        {filters.repeat.map((v:string)=><Chip key={v} active bg="#f0fdf4" fg="#15803d" borderColor="#bbf7d0" icon={<ArrowPathIcon style={ICON_SM}/>} onRemove={()=>togF("repeat",v)}>{v}</Chip>)}
        {/* 누적 정렬 칩 — 인디고 계열, 개별 ×로 제거 가능 */}
        {activeSortFields.map(f=>{
          const lbl=({pid:"프로젝트",task:"업무내용",who:"담당자",due:"마감기한",pri:"우선순위",st:"상태",repeat:"반복",id:"기본"} as Record<string,string>)[f.col]||f.col;
          return<Chip key={f.col} active bg="#eef2ff" fg="#4338ca" borderColor="#c7d2fe" onRemove={()=>setActiveSortFields(prev=>prev.filter(x=>x.col!==f.col))}>{lbl}{f.dir==="asc"?" ↑":" ↓"}</Chip>;
        })}
        {/* 단일 정렬 칩 (누적 정렬 미사용 시 sortCol 표시) */}
        {sortCol&&activeSortFields.length===0&&<Chip active bg="#eef2ff" fg="#4338ca" borderColor="#c7d2fe" onRemove={()=>setSortCol(null)}>{({pid:"프로젝트",task:"업무내용",who:"담당자",due:"마감기한",pri:"우선순위",st:"상태",repeat:"반복",id:"기본"} as Record<string,string>)[sortCol]||sortCol}{sortDir==="asc"?" ↑":" ↓"}</Chip>}
        {/* 현재 필터 저장 — 이름 입력 인라인 or 저장 아이콘 버튼 */}
        {sfSaving ? (
          <>
            <input ref={sfInputRef} value={sfName} onChange={e=>setSfName(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"&&sfName.trim()){if(savedFilters.length>=10){setSfSaving(false);setSfName("");flash("필터는 최대 10개까지 저장할 수 있습니다","err");}else if(isDuplicateSf()){setSfSaving(false);setSfName("");flash("동일한 필터 조합이 이미 저장되어 있습니다","err");}else{saveCurrentFilter(sfName.trim(),filters,search);setSfSaving(false);setSfName("");}}
                if(e.key==="Escape"){setSfSaving(false);setSfName("");}
              }}
              placeholder="필터 이름" maxLength={20}
              style={{fontSize:11,padding:"3px 8px",border:"1px solid #dadce0",borderRadius:6,outline:"none",fontFamily:"inherit",width:100}}
            />
            <button onClick={()=>{if(sfName.trim()){if(savedFilters.length>=10){setSfSaving(false);setSfName("");flash("필터는 최대 10개까지 저장할 수 있습니다","err");}else if(isDuplicateSf()){setSfSaving(false);setSfName("");flash("동일한 필터 조합이 이미 저장되어 있습니다","err");}else{saveCurrentFilter(sfName.trim(),filters,search);setSfSaving(false);setSfName("");}}}}
              style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"none",background:"#1a73e8",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>저장</button>
            <button onClick={()=>{setSfSaving(false);setSfName("");}}
              style={{fontSize:11,padding:"3px 6px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",cursor:"pointer",fontFamily:"inherit"}}>취소</button>
          </>
        ) : (
          <button onClick={()=>setSfSaving(true)} title="현재 필터 조합 저장"
            style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4,flexShrink:0,transition:"color .12s"}}
            onMouseEnter={e=>{e.currentTarget.style.color="#334155";}}
            onMouseLeave={e=>{e.currentTarget.style.color="#94a3b8";}}>
            <BookmarkIcon style={ICON_SM}/>저장
          </button>
        )}
        {/* 필터 초기화 — 필터, 검색어, 정렬 모두 리셋 */}
        <button onClick={()=>{setSearch("");setFilters({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});setActiveSortFields([]);setSortCol(null);setSfSaving(false);setSfName("");}} style={{marginLeft:"auto",fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4,flexShrink:0}}>필터 초기화</button>
      </div>}
    </div>}
    {/* 메모뷰 헤더 — 리스트뷰와 동일한 흰 카드 구조로 통일 */}
    {todoView==="memo"&&<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,marginBottom:8}}>
      {/* Row 1: 검색 pill + 정렬 버튼 + 건수 — 리스트뷰와 동일한 레이아웃 */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:(savedFilters.length>0||filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search||filters.fav)?"1px solid #f1f5f9":"none"}}>
        <div style={{position:"relative",display:"flex",alignItems:"center",background:"#f1f3f4",borderRadius:24,padding:"6px 12px 6px 34px",flex:1,maxWidth:320}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5f6368",display:"flex",pointerEvents:"none"}}><MagnifyingGlassIcon style={ICON_SM}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="업무명, 상세내용 검색..." style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12,color:"#202124",fontFamily:"inherit"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"#80868b",border:"none",borderRadius:"50%",width:14,height:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}}><XMarkIcon style={{width:9,height:9,color:"#fff"}}/></button>}
        </div>
        {/* 메모뷰 정렬 버튼 */}
        <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}><MemoSortButtons/></div>
        <span style={{fontSize:12,color:"#64748b",marginLeft:"auto",flexShrink:0,whiteSpace:"nowrap" as const}}>
          <span style={{fontWeight:700,color:"#334155"}}>{sorted.filter(t=>t.st!=="완료").length}건 미완료</span>
          <span style={{margin:"0 6px",color:"#cbd5e1"}}>·</span>
          <span>{sorted.filter(t=>t.st==="완료").length}건 완료</span>
        </span>
      </div>
      {/* 저장된 필터 칩 — 리스트뷰와 동일 */}
      {savedFilters.length>0&&<div style={{display:"flex",flexWrap:"wrap" as const,alignItems:"center",gap:6,padding:"4px 12px 8px",paddingBottom:(filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search||filters.fav)?2:8}}>
        <BookmarkIcon style={{...ICON_SM, color:"#94a3b8", flexShrink:0}}/>
        {savedFilters.map(sf=>{
          const on = isSfActive(sf);
          return (
            <Chip key={sf.id} active
              bg={on?"#2563eb":"#f1f5f9"} fg={on?"#fff":"#64748b"} borderColor={on?"#2563eb":"#e2e8f0"}
              icon={<BookmarkIcon style={ICON_SM}/>}
              onClick={()=>toggleSavedFilter(sf)}
              onRemove={()=>deleteSavedFilter(sf.id)}
            >{sf.name}</Chip>
          );
        })}
      </div>}
      {/* 활성 필터 칩 — 리스트뷰와 동일한 스타일 */}
      {(filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search||filters.fav)&&<div style={{display:"flex",flexWrap:"wrap" as const,alignItems:"center",gap:6,padding:"6px 12px 8px",paddingLeft:savedFilters.length>0?32:12,paddingTop:savedFilters.length>0?2:6}}>
        {search&&<Chip active bg="#dbeafe" fg="#1d4ed8" borderColor="#bfdbfe" icon={<MagnifyingGlassIcon style={ICON_SM}/>} onRemove={()=>setSearch("")}>"{search}"</Chip>}
        {filters.fav&&<Chip active bg="#fef9c3" fg="#854d0e" borderColor="#fde68a" icon={<StarIcon style={ICON_SM}/>} onRemove={()=>togF("fav","")}>즐겨찾기</Chip>}
        {filters.proj.map((v:string)=><Chip key={v} active bg="#ede9fe" fg="#6d28d9" borderColor="#ddd6fe" icon={<FolderIcon style={ICON_SM}/>} onRemove={()=>togF("proj",v)}>{v==="__none__"?"미배정":aProj.find(p=>String(p.id)===v)?.name||v}</Chip>)}
        {filters.who.map((v:string)=><Chip key={v} active bg="#fce7f3" fg="#9d174d" borderColor="#fbcfe8" icon={<UserIcon style={ICON_SM}/>} onRemove={()=>togF("who",v)}>{v}</Chip>)}
        {filters.pri.map((v:string)=><Chip key={v} active bg={priBg[v]} fg={priC[v]} borderColor={`${priC[v]}44`} icon={<FlagIcon style={ICON_SM}/>} onRemove={()=>togF("pri",v)}>{v}</Chip>)}
        {filters.st.map((v:string)=><Chip key={v} active bg={stBg[v]} fg={stC[v]} borderColor={`${stC[v]}44`} icon={<CheckCircleIcon style={ICON_SM}/>} onRemove={()=>togF("st",v)}>{v}</Chip>)}
        {filters.repeat.map((v:string)=><Chip key={v} active bg="#f0fdf4" fg="#15803d" borderColor="#bbf7d0" icon={<ArrowPathIcon style={ICON_SM}/>} onRemove={()=>togF("repeat",v)}>{v}</Chip>)}
        <button onClick={()=>{setSearch("");setFilters({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});}} style={{marginLeft:"auto",fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4,flexShrink:0}}>필터 초기화</button>
      </div>}
    </div>}

    {/* 테이블 헤더 — 리스트뷰일 때 sticky 안에 포함 */}
    {todoView==="list"&&sorted.length>0&&<table ref={headerTableRef} style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
      <colgroup>
        {/* 컬럼 너비를 state로 관리 — 리사이즈 드래그 시 실시간 반영 */}
        {(expandMode ? colWidthsExpand : colWidthsNormal).map((w,i) => <col key={i} style={{width:`${w}%`}}/>)}
      </colgroup>
      <thead><tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
        {((expandMode
          ?[["pid","프로젝트"],["task","업무내용"],["det","상세내용"],["who","담당자"],["due","마감기한"]]
          :[["pid","프로젝트"],["task","업무내용"],["det","상세내용"],["who","담당자"],["due","마감기한"],["pri","우선순위"],["st","상태"]]
         ) as [string,string][]).map(([col,label], colIdx, colsList)=>{
          const fk = col === "pid" ? "proj" : col;
          const hasFilter = ["proj","who","pri","st"].includes(fk) && ((filters as any)[fk] as string[])?.length > 0;
          // 누적 정렬에서 해당 컬럼의 정렬 상태 확인
          const sf = activeSortFields.find(f => f.col === col);
          const isSorted = !!sf || sortCol === col;
          const sortDirForCol = sf ? sf.dir : (sortCol === col ? sortDir : null);
          // 몇 번째 정렬 기준인지 (1, 2, 3...)
          const sortRank = sf ? activeSortFields.indexOf(sf) + 1 : 0;
          const isActive = hasFilter || isSorted;
          const iconColor = isActive ? "#34a853" : "#5f6368";
          // 마지막 컬럼(체크박스 바로 앞)은 핸들 없음 — 조절 시 체크박스가 줄어드는 것 방지
          const hasResizeHandle = colIdx < colsList.length - 1;
          return <th key={col} style={{...S.th,cursor:"pointer",userSelect:"none" as const,position:"relative" as const,borderRight:"1px solid #e8edf4"}} onClick={e=>openColumnFilter(e,col)}>
            <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
              {label}
              {/* 정렬 상태 — 순번+방향을 하나로 통합 */}
              {isSorted ? (
                activeSortFields.length > 1 && sortRank > 0
                  ? <span style={{fontSize:10,fontWeight:700,color:"#1a73e8",display:"inline-flex",alignItems:"center",gap:1}}><span style={{fontSize:9,fontWeight:800,color:"#fff",background:"#1a73e8",borderRadius:99,width:13,height:13,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{sortRank}</span>{sortDirForCol==="asc"?"▲":"▼"}</span>
                  : <span style={{fontSize:10,fontWeight:700,color:"#1a73e8"}}>{sortDirForCol==="asc"?"▲":"▼"}</span>
              ) : (
                <span style={{fontSize:10,fontWeight:700,color:hasFilter?"#1a73e8":"#c0c8d4"}}>▼</span>
              )}
            </span>
            {/* 리사이즈 핸들 — 헤더에만 존재, tbody td에는 절대 없음 */}
            {hasResizeHandle&&<div
              onMouseDown={e=>onColResizeStart(e,colIdx)}
              onDoubleClick={onColResizeReset}
              onClick={e=>e.stopPropagation()}
              style={{position:"absolute",top:0,right:0,width:8,height:"100%",cursor:"col-resize",zIndex:10}}
              onMouseEnter={e=>{const l=e.currentTarget.firstChild as HTMLElement;if(l)l.style.background="#2563eb";}}
              onMouseLeave={e=>{const l=e.currentTarget.firstChild as HTMLElement;if(l)l.style.background="transparent";}}
            ><span style={{position:"absolute",right:0,top:0,width:2,height:"100%",background:"transparent",transition:"background .1s",pointerEvents:"none"}}/></div>}
          </th>;
        })}
        <th style={{...S.th,padding:"0 6px",textAlign:"center" as const}}>
          <input type="checkbox"
            checked={allVisibleSelected}
            ref={el=>{if(el)el.indeterminate=someVisibleSelected&&!allVisibleSelected;}}
            onChange={toggleSelectAll}
            title={allVisibleSelected?"전체 선택 해제":"전체 선택"}
            style={{cursor:"pointer",width:14,height:14,accentColor:"#2563eb",verticalAlign:"middle"}}/>
        </th>
      </tr></thead>
    </table>}

    {/* 컬럼 필터 드롭다운 — Google Sheets 스타일 */}
    {filterOpenCol && filterAnchorRect && ["pid","who","pri","st","due"].includes(filterOpenCol) &&
      <ColumnFilterDropdown
        col={filterOpenCol}
        label={{pid:"프로젝트",who:"담당자",pri:"우선순위",st:"상태",due:"마감기한"}[filterOpenCol]||filterOpenCol}
        currentSortDir={(()=>{ const sf = activeSortFields.find(f=>f.col===filterOpenCol); return sf ? sf.dir as "asc"|"desc" : (sortCol===filterOpenCol ? sortDir as "asc"|"desc" : null); })()}
        onSort={(col, dir) => {
          // 누적 정렬 — activeSortFields에 추가/업데이트/제거
          // 해당 컬럼 커스텀 순서 제거 (오름/내림 기본 정렬 사용)
          setCustomSortOrders(prev => { const n = {...prev}; delete n[col]; return n; });
          setSortCol(null); // activeSortFields 우선 사용
          if (dir === null) {
            // 같은 방향 다시 클릭 → 해당 컬럼만 제거
            setActiveSortFields(prev => prev.filter(f => f.col !== col));
          } else {
            setActiveSortFields(prev => {
              const idx = prev.findIndex(f => f.col === col);
              if (idx >= 0) {
                // 이미 있으면 방향만 업데이트
                const next = [...prev]; next[idx] = { col, dir }; return next;
              }
              // 없으면 맨 뒤에 추가 (하위 정렬 기준)
              return [...prev, { col, dir }];
            });
          }
        }}
        allValues={getColumnValues(filterOpenCol)}
        selectedValues={getSelectedForCol(filterOpenCol)}
        onFilterChange={handleFilterChange}
        customOrder={customSortOrders[filterOpenCol]}
        onCustomOrderChange={(col, order) => {
          // 커스텀 순서 저장 + activeSortFields에 누적 추가
          setCustomSortOrders(prev => ({...prev, [col]: order}));
          setSortCol(null);
          setActiveSortFields(prev => {
            const idx = prev.findIndex(f => f.col === col);
            if (idx >= 0) { const next = [...prev]; next[idx] = { col, dir: "asc" }; return next; }
            return [...prev, { col, dir: "asc" }];
          });
        }}
        onClose={()=>setFilterOpenCol(null)}
        anchorRect={filterAnchorRect}
      />
    }

    </div>{/* sticky div 끝 */}


{todoView==="memo"&&<MemoView sorted={sorted} showDone={showDone} setShowDone={setShowDone} gPr={gPr} aProj={visibleProj} members={visibleMembers} pris={pris} stats={stats} priC={priC} priBg={priBg} stC={stC} stBg={stBg} updTodo={updTodo} addTodo={addTodo} currentUser={currentUser} delTodo={delTodo} isFav={isFav} toggleFav={toggleFav} flash={flash} setDatePop={setDatePop} cols={memoCols}/>}
    {todoView==="list"&&sorted.length===0&&(()=>{
      // 필터/검색이 적용된 경우와 아닌 경우를 구분해 다른 안내 메시지와 CTA를 표시
      const hasFilter = filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||filters.fav||search;
      return <div style={{...S.card,padding:"52px 20px",textAlign:"center" as const}}>
        <div style={{marginBottom:14}}>{hasFilter?<MagnifyingGlassIcon style={{width:40,height:40}}/>:<InboxIcon style={{width:40,height:40}}/>}</div>
        <div style={{fontSize:15,fontWeight:700,color:"#475569",marginBottom:8}}>
          {hasFilter?"검색 결과가 없습니다":"아직 업무가 없습니다"}
        </div>
        <div style={{fontSize:12,color:"#94a3b8",marginBottom:24}}>
          {hasFilter?"다른 검색어나 필터를 시도해보세요":"팀과 함께할 첫 번째 업무를 추가해보세요"}
        </div>
        {hasFilter
          // 필터 있을 때: 초기화 버튼
          ? <button
              onClick={()=>{setSearch("");setFilters({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});}}
              style={{padding:"9px 22px",borderRadius:8,border:"none",background:"#2563eb",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              필터 초기화
            </button>
          // 필터 없을 때: 업무 추가 직접 입력 탭으로 이동
          : <button
              onClick={()=>setAddTab("manual")}
              style={{padding:"9px 22px",borderRadius:8,border:"none",background:"#2563eb",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              + 첫 업무 추가하기
            </button>
        }
      </div>;
    })()}
    {todoView==="list"&&sorted.length>0&&<div ref={tblDivRef} onScroll={()=>{setHoverRow(null);setHoverRowRect(null);}} style={{...S.card,padding:0,borderRadius:"0 0 12px 12px",borderTop:"none"}}>
        <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
          <colgroup>
            {/* 헤더 테이블과 동일한 colWidths state 참조 — 리사이즈 시 자동 동기화 */}
            {(expandMode ? colWidthsExpand : colWidthsNormal).map((w,i) => <col key={i} style={{width:`${w}%`}}/>)}
          </colgroup>
          <tbody>
            {sorted.filter(t=>t.st!=="완료").map((t,idx,arr)=>{const od=isOD(t.due,t.st);
              const plain=stripHtml(t.det||"");
              const isUrgent=t.pri==="긴급";const isHigh=t.pri==="높음";const isLow=t.pri==="낮음";
              const isSel=selectedIds.has(t.id);
              const isHover=hoverRow===t.id;
              // 우선순위 배경색 — 전체 행에 적용
              const rowPriBg=isUrgent?"#fff8f8":isHigh?"#fffdf5":"#fff";
              const rowPriBorder=isUrgent?"1px solid #fecaca":isHigh?"1px solid #fde68a":"1px solid #f1f5f9";
              // 업무내용 셀 좌측 2px 띠
              const taskBar=isUrgent?"inset 2px 0 0 #dc2626":isHigh?"inset 2px 0 0 #d97706":"none";
              const taskColor=isUrgent?"#b91c1c":isHigh?"#92400e":isLow?"#94a3b8":"#0f172a";
              const taskWeight=isUrgent?800:isHigh?700:isLow?400:600;
              // 선택/hover 시 배경 — 전체 행 공통
              const cellBg=isSel?(isUrgent?"#fee2e2":"#dbeafe"):isHover?(isUrgent?"#fff0f0":isHigh?"#fffbee":"#f0f7ff"):rowPriBg;
              // 전체 행 셀 공통 스타일
              const priCellStyle={background:cellBg,borderBottom:rowPriBorder} as const;
              // 드래그 드롭 표시선 — 이 행 위에 드롭 예정일 때
              const showDropLine=canDrag&&dragRowId!==null&&dragRowId!==t.id&&dropBeforeId===t.id;
              return <tr key={t.id} data-rowid={t.id}
                draggable={canDrag&&!editCell&&!datePop}
                onDragStart={e=>{if(!canDrag)return;setDragRowId(t.id);e.dataTransfer.effectAllowed="move";(e.currentTarget as HTMLElement).style.opacity="0.4";}}
                onDragEnd={()=>{setDragRowId(null);setDropBeforeId(null);setDropAtEnd(false);document.querySelectorAll<HTMLElement>("[data-rowid]").forEach(el=>el.style.opacity="");}}
                onDragOver={e=>{if(!canDrag||dragRowId===null||dragRowId===t.id){return;}e.preventDefault();e.dataTransfer.dropEffect="move";const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();const zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;const mouseY=e.clientY/zoom;if(mouseY<rect.top+rect.height/2){setDropBeforeId(t.id);setDropAtEnd(false);}else{const next=arr[idx+1];setDropBeforeId(next?.id??null);setDropAtEnd(!next);}}}
                onDrop={e=>{if(!canDrag||dragRowId===null||dragRowId===t.id)return;e.preventDefault();reorderTodo(dragRowId,dropAtEnd?null:dropBeforeId);setDragRowId(null);setDropBeforeId(null);setDropAtEnd(false);
                  // 수동 드래그 순서가 최우선 — 드롭 완료 시 컬럼 정렬 해제
                  setSortCol(null);setActiveSortFields([]);setCustomSortOrders({});}}
                onMouseEnter={e=>{if(editCell||datePop)return;setHoverRow(t.id);const r=(e.currentTarget as HTMLTableRowElement).getBoundingClientRect();setHoverRowRect({top:r.top,height:r.height});}}
                style={{borderBottom:"1px solid #f1f5f9",borderLeft:isSel?"3px solid #2563eb":undefined,
                  ...(showDropLine?{borderTop:"3px solid #2563eb"}:{}),
                  ...(canDrag&&!dragRowId?{cursor:"grab"}:{}),
                  ...(canDrag&&dragRowId===t.id?{opacity:.4}:{}),
                  // 프로젝트순 정렬 시 프로젝트 경계에 구분선 표시
                  ...(sortCol==="pid"&&idx>0&&gPr(arr[idx-1].pid).name!==gPr(t.pid).name?{borderTop:"2px solid #e2e8f0"}:{})}}>
                {/* 프로젝트 컬럼 — hover 시 전체 행과 동일한 배경색 적용 */}
                <CellEdit todo={t} field="pid" tdStyle={priCellStyle}>{(()=>{const p=gPr(t.pid);return <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:isHover?700:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,transition:"font-weight .12s"}}><span style={{...S.dot(p.color||"#94a3b8")}}/>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{p.name||"미배정"}</span></div>;})()}</CellEdit>
                {/* 업무내용 — 좌측 2px 띠 + 배경색 */}
                <td style={{...S.tdc,...priCellStyle,boxShadow:taskBar,overflow:"visible",...(expandMode?{whiteSpace:"normal" as const}:{})}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    {/* 즐겨찾기 버튼: 행 안에 항상 표시 */}
                    <button onClick={e=>{e.stopPropagation();toggleFav(t.id);}} title={isFav(t.id)?"즐겨찾기 해제":"즐겨찾기"}
                      style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"0 2px",lineHeight:1,color:isFav(t.id)?"#f59e0b":"#d1d5db",transition:"color .15s",flexShrink:0}}
                      onMouseEnter={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#fbbf24";}}
                      onMouseLeave={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#d1d5db";}}>{isFav(t.id)?<StarIcon style={ICON_SM}/>:<StarOutlineIcon style={ICON_SM}/>}</button>
                    <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"완료"});flash("업무가 완료 처리되었습니다");}}
                      style={{width:17,height:17,borderRadius:"50%",border:"2px solid #94a3b8",background:"#fff",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#16a34a";e.currentTarget.style.background="#f0fdf4";(e.currentTarget.querySelector("svg") as unknown as HTMLElement).style.opacity="1";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#94a3b8";e.currentTarget.style.background="#fff";(e.currentTarget.querySelector("svg") as unknown as HTMLElement).style.opacity="0";}}>
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{opacity:0,transition:"opacity .15s",pointerEvents:"none"}}><path d="M1 3.5L3.5 6L8 1" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                      {editCell?.id===t.id&&editCell?.field==="task"
                        ?<input autoFocus defaultValue={t.task} style={S.iinp}
                           onKeyDown={e=>{if((e as any).key==="Enter"){updTodo(t.id,{task:(e.target as HTMLInputElement).value});setEditCell(null);}if((e as any).key==="Escape")setEditCell(null);}}
                           onBlur={e=>{updTodo(t.id,{task:e.target.value});setEditCell(null);}}/>
                        :<div style={{display:"flex",alignItems:expandMode?"flex-start":"center",gap:3,minWidth:0}}>
                           <span style={{fontWeight:taskWeight,color:taskColor,cursor:permCanEdit(t.who)?"pointer":"default",fontSize:14,...(expandMode?{wordBreak:"break-word" as const}:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,minWidth:0})}} onClick={()=>{if(permCanEdit(t.who))setEditCell({id:t.id,field:"task"});}}>{t.task}</span>
                           <RepeatBadge repeat={t.repeat}/>
                           {od&&<span style={{color:"#dc2626",display:"inline-flex"}}><ExclamationTriangleIcon style={ICON_SM}/></span>}
                         </div>}
                    </div>
                  </div>
                </td>
                <td style={{...S.tdc,...priCellStyle,maxWidth:0,...(expandMode?{whiteSpace:"normal" as const,verticalAlign:"top" as const,cursor:permCanEdit(t.who)?"text":"default",wordBreak:"break-word" as const}:{})}}
                  onClick={expandMode&&permCanEdit(t.who)?e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setNotePopup({todo:t,x:r.left,y:r.bottom});}:undefined}>
                  {expandMode
                    ?<div style={{fontSize:13,color:plain?"#374151":"#c0c8d4",lineHeight:1.7,padding:"4px 6px",fontStyle:plain?"normal":"italic",borderRadius:6,border:"1px solid transparent",transition:"border-color .15s"}}
                        onMouseEnter={e=>{if(!permCanEdit(t.who))return;(e.currentTarget as HTMLDivElement).style.borderColor="#e2e8f0";(e.currentTarget as HTMLDivElement).style.background="#fafbfc";}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="transparent";(e.currentTarget as HTMLDivElement).style.background="transparent";}}
                        dangerouslySetInnerHTML={{__html:sanitize(t.det||"<span style='color:#c0c8d4;font-style:italic'>상세내용 추가...</span>")}}/>
                    :<span onClick={e=>{if(!permCanEdit(t.who))return;e.stopPropagation();const r=e.currentTarget.closest("td")!.getBoundingClientRect();setNotePopup({todo:t,x:r.left,y:r.bottom});}}
                        style={{fontSize:13,color:plain?"#475569":"#c0c8d4",fontStyle:plain?"normal":"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"block",cursor:permCanEdit(t.who)?"text":"default"}}>
                        {plain?plain.slice(0,50)+(plain.length>50?"…":""):"상세내용 추가..."}
                      </span>}
                </td>
                <CellEdit todo={t} field="who" tdStyle={priCellStyle}><div style={{display:"flex",alignItems:"center",gap:6,...(expandMode?{alignSelf:"flex-start" as const}:{})}}><span style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(t.who)},${avColor2(t.who)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}} title={t.who}>{avInitials(t.who)}</span><span style={{fontSize:13}}>{t.who}</span></div></CellEdit>
                {/* 마감기한 셀 — 날짜+D-day 뱃지 세로 배치 시 행 높이 증가 방지
                    padding을 10px→3px로 줄이고 뱃지 lineHeight 압축해 표준 행 높이 유지 */}
                <CellEdit todo={t} field="due" tdStyle={{...priCellStyle,padding:"3px 12px",verticalAlign:"middle" as const}}>{(()=>{const[dpart,tpart]=(t.due||"").split(" ");const fmt12v=(v: string)=>{if(!v)return "";const[hh,mm]=v.split(":").map(Number);const ap=hh<12?"오전":"오후";const h12=hh===0?12:hh>12?hh-12:hh;return `${ap} ${h12}:${fmt2(mm)}`;};const dd=dDay(t.due,t.st);return <div style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:1}}>
                  <span style={{fontSize:13,lineHeight:"17px",color:od?"#dc2626":"#64748b",whiteSpace:"nowrap" as const}}>{dpart?`${dpart}(${fDow(dpart)})`:"—"}{tpart?` ${fmt12v(tpart)}`:""}</span>
                  {dd&&<span style={{fontSize:10,fontWeight:700,color:dd.color,background:dd.bg,border:`1px solid ${dd.border}`,padding:"0 5px",borderRadius:4,lineHeight:"13px",letterSpacing:"0.02em",flexShrink:0}}>{dd.label}</span>}
                </div>;})()}</CellEdit>
                {!expandMode&&<>
                  <CellEdit todo={t} field="pri" tdStyle={priCellStyle}><span style={{...S.badge(priBg[t.pri],priC[t.pri],`1px solid ${priC[t.pri]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}><span>●</span>{t.pri}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                  <CellEdit todo={t} field="st" tdStyle={priCellStyle}><span style={{...S.badge(stBg[t.st],stC[t.st],`1px solid ${stC[t.st]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}>{t.st}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                </>}
                <td style={{...S.tdc,...priCellStyle,padding:"0 6px",textAlign:"center" as const,verticalAlign:"middle" as const}} onClick={e=>e.stopPropagation()}>
                  {/* 수정/삭제 권한이 하나라도 있을 때만 체크박스 표시 — 권한 없으면 빈 칸 */}
                  {(permCanEdit(t.who)||canDelete(t.who))
                    ?<input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,(e as any).shiftKey);}}
                      style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                    :null}
                </td>
              </tr>})}
            {/* 드래그 시 맨 끝에 놓을 수 있도록 드롭 영역 표시 */}
            {canDrag&&dragRowId!==null&&dropAtEnd&&<tr><td colSpan={99} style={{borderTop:"3px solid #2563eb",padding:0,height:0}}/></tr>}
            {sorted.filter(t=>t.st==="완료").length>0&&(()=>{
              const doneTodos=sorted.filter(t=>t.st==="완료");
              // 완료 섹션 전체선택 상태 계산
              const allDoneSel=doneTodos.length>0&&doneTodos.every(t=>selectedIds.has(t.id));
              const someDoneSel=doneTodos.some(t=>selectedIds.has(t.id))&&!allDoneSel;
              return <tr>
                {/* 완료 섹션 헤더 — 클릭으로 접기/펼치기, 우측에 전체선택 체크박스 */}
                <td colSpan={99} style={{padding:"6px 12px",background:"#f0fdf4",borderTop:"2px solid #bbf7d0",cursor:"pointer"}} onClick={()=>setShowDone(p=>!p)}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#16a34a",display:"inline-flex",alignItems:"center",gap:2}}><CheckIcon style={{width:12,height:12}}/> 완료됨</span>
                    <span style={{fontSize:10,color:"#86efac"}}>{doneTodos.length}건</span>
                    <span style={{fontSize:10,color:"#4ade80",marginLeft:"auto"}}>{showDone?"접기":"펼치기"}</span>
                    {/* 완료 항목 전체선택 체크박스 — 접기/펼치기 클릭과 분리 */}
                    {showDone&&<input type="checkbox"
                      checked={allDoneSel}
                      ref={el=>{if(el)el.indeterminate=someDoneSel;}}
                      onChange={()=>{}}
                      onClick={e=>{
                        e.stopPropagation(); // 접기/펼치기 클릭 차단
                        if(allDoneSel){
                          // 완료 항목 전체 선택 해제 — 기존 선택에서 완료 ID 제거
                          const doneIds=new Set(doneTodos.map(t=>t.id));
                          selAll([...Array.from(selectedIds)].filter((id:number)=>!doneIds.has(id)));
                        }else{
                          // 완료 항목 전체 선택 — 기존 선택에 완료 ID 추가
                          selAll([...Array.from(selectedIds),...doneTodos.map(t=>t.id)]);
                        }
                      }}
                      title={allDoneSel?"완료 항목 선택 해제":"완료 항목 전체 선택"}
                      style={{width:14,height:14,cursor:"pointer",accentColor:"#16a34a",marginLeft:6,flexShrink:0}}/>}
                  </div>
                </td>
              </tr>;
            })()}
            {showDone&&sorted.filter(t=>t.st==="완료").map(t=>{const plain=stripHtml(t.det||"");
              return <tr key={t.id} data-rowid={t.id} style={{borderBottom:"1px solid #f1f5f9",background:"#fafafa",opacity:.72}}
                onMouseEnter={e=>{if(editCell||datePop)return;setHoverRow(t.id);const r=(e.currentTarget as HTMLTableRowElement).getBoundingClientRect();setHoverRowRect({top:r.top,height:r.height});}}>

                {/* 완료 행 — 프로젝트 컬럼 */}
                <td style={S.tdc}>{(()=>{const p=gPr(t.pid);return <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:500,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}><span style={{...S.dot(p.color||"#94a3b8"),opacity:.5}}/><span>{p.name||"미배정"}</span></div>;})()}</td>
                <td style={S.tdc}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"대기"});flash("완료가 취소되었습니다");}}
                      style={{width:17,height:17,borderRadius:"50%",border:"2px solid #16a34a",background:"#16a34a",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
                      title="완료 취소">
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:14,color:"#94a3b8",textDecoration:"line-through"}}>{t.task}</span><RepeatBadge repeat={t.repeat}/></div>
                    </div>
                  </div>
                </td>
                <td style={{...S.tdc,...(expandMode?{verticalAlign:"top" as const}:{})}}>
                  {expandMode
                    ?<div style={{fontSize:13,color:plain?"#94a3b8":"#c0c8d4",lineHeight:1.7,padding:"2px 0",textDecoration:plain?"line-through":"none"}} dangerouslySetInnerHTML={{__html:sanitize(t.det||"—")}}/>
                    :<span style={{fontSize:13,color:"#c0c8d4",fontStyle:"italic",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{plain?plain.slice(0,50):"—"}</span>}
                </td>
                <td style={S.tdc}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(t.who)},${avColor2(t.who)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px",opacity:.5}} title={t.who}>{avInitials(t.who)}</span><span style={{fontSize:13,color:"#94a3b8"}}>{t.who}</span></div></td>
                <td style={S.tdc}><span style={{fontSize:13,color:"#94a3b8",textDecoration:"line-through"}}>{t.due}</span></td>
                {!expandMode&&<>
                  <td style={S.tdc}><span style={{...S.badge("#f1f5f9","#94a3b8")}}>{t.pri}</span></td>
                  <td style={S.tdc}><span style={{...S.badge(stBg[t.st],stC[t.st])}}>{t.st}</span></td>
                </>}
                <td style={{...S.tdc,padding:"0 6px",textAlign:"center" as const}} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,(e as any).shiftKey);}}
                    style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                </td>
              </tr>})}
          </tbody>
        </table>
    </div>}
    </div>

    {/* ── 리스트 hover 플로팅 액션 버튼 ───────────────────────── */}
    {/* mouseEnter/mouseLeave 대신 document mousemove로 좌표 감지 — 깜빡임 원천 차단 */}
    <HoverPopup hoverRow={hoverRow} hoverRowRect={hoverRowRect}
      setHoverRow={setHoverRow} setHoverRowRect={setHoverRowRect}
      sorted={sorted} tblDivRef={tblDivRef}
      setEditMod={setEditMod} delTodo={delTodo}
      popupOpen={!!(editCell||datePop)}/>

    {/* 컬럼 리사이즈 드래그 중 표 영역 안에서만 표시되는 파란 수직선 */}
    {/* top/height는 onColResizeStart에서 표 범위로 동적 계산 */}
    <div ref={resizeLineRef} style={{position:"fixed",top:0,left:0,width:2,height:0,background:"#1a73e8",boxShadow:"0 0 4px rgba(26,115,232,.4)",pointerEvents:"none",display:"none",zIndex:9999}}/>
  </div>;
}
