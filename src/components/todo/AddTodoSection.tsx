import React, { useRef, useState, useEffect } from "react";
import { repeatLabel } from "../../constants";
import { S } from "../../styles";
import { fD, stripHtml } from "../../utils";
import { NewRow, DatePopState, TodoTemplate, TemplateItem } from "../../types";
import { Project } from "../../types";
import { SectionLabel } from "../ui/SectionLabel";
import { FolderIcon, UserIcon, BoltIcon, ArrowPathIcon, CalendarIcon, PaperClipIcon, DocumentIcon, DocumentTextIcon, SparklesIcon, CheckIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon, RectangleStackIcon, TrashIcon, PencilSquareIcon, StarIcon, StarOutlineIcon, ICON_SM } from "../ui/Icons";
import { RepeatPicker } from "../ui/RepeatPicker";

type AiFile = { name: string; type: string; data: string; textContent?: string };

interface AddTodoSectionProps {
  addTab: string;
  setAddTab: (v: string) => void;
  newRows: NewRow[];
  setNewRows: (fn: any) => void;
  addNR: () => void;
  saveNRs: () => void;
  saveOneNR: (i: number) => void;
  isNREmpty: (r: NewRow) => boolean;
  aProj: Project[];
  members: string[];
  pris: string[];
  setNotePopup: (v: any) => void;
  setNrDatePop: (v: DatePopState | null) => void;
  aiText: string;
  setAiText: (v: string) => void;
  aiFiles: AiFile[];
  setAiFiles: (fn: any) => void;
  aiLoad: boolean;
  aiSt: string;
  setAiSt: (v: string) => void;
  aiParsed: any[];
  setAiParsed: (fn: any) => void;
  parseAI: () => void;
  confirmAI: () => void;
  priC: Record<string, string>;
  priBg: Record<string, string>;
  currentUser: string | null;
  // AI 결과 행 날짜 선택용 DateTimePicker 연동
  setDatePop?: (v: DatePopState | null) => void;
  // 이전 분석 결과 복원 (⑤ 히스토리)
  aiHistory?: any[];
  restoreAiHistory?: () => void;
  // 업무 템플릿
  templates?: TodoTemplate[];
  addTemplate?: (tpl: Omit<TodoTemplate, "id" | "createdAt" | "useCount" | "lastUsedAt">) => string;
  updTemplate?: (id: string, patch: Partial<TodoTemplate>) => void;
  delTemplate?: (id: string) => void;
  applyTemplate?: (id: string, baseDate: string, defaultWho: string) => void;
  addTodo?: (t: Record<string, unknown>) => void;
  flash?: (msg: string, type?: string) => void;
  // 템플릿 일괄 등록 — 히스토리 1회만 push하여 Undo 1번으로 전체 되돌리기 가능
  confirmTplItems?: (items: Record<string, unknown>[]) => void;
  selectedTeamId?: string | null;  // 현재 선택된 팀 — 템플릿 팀 필터 연동
  // 템플릿 즐겨찾기 — 사용자별 개인 설정
  tplFavs?: string[];
  setTplFavs?: (fn: (prev: string[]) => string[]) => void;
}

const readAsBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = e => {
    const result = e.target?.result as string | null;
    if (!result) { reject(new Error("파일을 읽을 수 없습니다")); return; }
    resolve(result.split(",")[1] ?? "");
  };
  reader.onerror = () => reject(new Error(reader.error?.message ?? "읽기 오류"));
  reader.readAsDataURL(file);
});

const readAsText = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = e => resolve((e.target?.result as string) ?? "");
  reader.onerror = () => reject(new Error(reader.error?.message ?? "읽기 오류"));
  reader.readAsText(file);
});

const ACCEPT_TYPES = "image/*,application/pdf,text/plain,text/markdown,text/csv,.md,.csv";

// 직접 입력 테이블 셀 공통 스타일 — 높이 28px 통일
const cellInput: React.CSSProperties = {
  width: "100%", padding: "0 6px", border: "1.5px solid #e2e8f0", borderRadius: 6,
  fontSize: 11, background: "#fff", outline: "none", fontFamily: "inherit",
  height: 28, boxSizing: "border-box",
};

// AI 결과 행 배지 공통 스타일 — 높이 26px으로 확대하여 가독성 향상
const aiSelBase: React.CSSProperties = {
  padding: "0 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
  cursor: "pointer", outline: "none", border: "1px solid",
  appearance: "none", WebkitAppearance: "none",
  height: 26, lineHeight: "26px", boxSizing: "border-box",
  fontFamily: "inherit",
};

export function AddTodoSection({
  addTab, setAddTab, newRows, setNewRows, addNR, saveNRs, saveOneNR, isNREmpty,
  aProj, members, pris, setNotePopup, setNrDatePop, aiText, setAiText,
  aiFiles, setAiFiles, aiLoad, aiSt, setAiSt, aiParsed, setAiParsed, parseAI, confirmAI,
  priC, priBg, currentUser, setDatePop, aiHistory, restoreAiHistory,
  templates = [], addTemplate, updTemplate, delTemplate, applyTemplate,
  addTodo, flash, confirmTplItems, selectedTeamId, tplFavs = [], setTplFavs,
}: AddTodoSectionProps) {
  // 트리형 프로젝트 option 목록 — 상위 아래에 세부 들여쓰기
  const projOptions = aProj.filter(p => !p.parentId).flatMap(p => {
    const children = aProj.filter(ch => ch.parentId === p.id);
    return [
      <option key={p.id} value={p.id}>{p.name}</option>,
      ...children.map(ch => <option key={ch.id} value={ch.id}>&nbsp;&nbsp;└ {ch.name}</option>)
    ];
  });
  const addSecRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [bulkOpen, setBulkOpen] = useState<string|null>(null);
  // ── 템플릿 탭 상태 ──
  const [tplSearch, setTplSearch] = useState(""); // 검색어
  const [tplTeamFilter, setTplTeamFilter] = useState<"all"|"my"|"shared">("all"); // 팀별 필터
  const [tplSort, setTplSort] = useState<"recent"|"name"|"count">("recent"); // 정렬
  const [tplCategory, setTplCategory] = useState<string>(""); // 카테고리 필터
  const [tplPreview, setTplPreview] = useState<string|null>(null); // 미리보기 중인 템플릿 ID
  const [tplCreating, setTplCreating] = useState(false); // 새 템플릿 생성 폼 열림
  const [tplEditId, setTplEditId] = useState<string|null>(null); // 수정 중인 템플릿 ID
  const [tplNewName, setTplNewName] = useState("");
  const [tplNewCategory, setTplNewCategory] = useState(""); // 새 템플릿 카테고리
  const [tplBulkOpen, setTplBulkOpen] = useState<string|null>(null); // 템플릿 일괄배정 드롭다운
  const [tplBulkRepeatOpen, setTplBulkRepeatOpen] = useState<DOMRect|null>(null); // 템플릿 반복 일괄배정 팝업
  const tplBulkRepeatRef = useRef<HTMLDivElement>(null);
  // 템플릿 개별 행 반복 팝업 — AI의 aiRepPop과 동일한 패턴
  const [tplRepPop, setTplRepPop] = useState<{idx: number; rect: DOMRect}|null>(null);
  const tplRepPopRef = useRef<HTMLDivElement>(null);
  const [tplNewItems, setTplNewItems] = useState<TemplateItem[]>([{task:"",pri:"보통",offsetDays:0}]);
  const [tplApplyId, setTplApplyId] = useState<string|null>(null); // 적용 대상 ID
  const [tplBaseDate, setTplBaseDate] = useState(new Date().toISOString().slice(0,10));
  const [tplBulkWho, setTplBulkWho] = useState("");
  // 적용 미리보기 — AI 결과와 동일한 편집 가능 행 목록
  const [tplApplyItems, setTplApplyItems] = useState<(TemplateItem & {_chk:boolean;who:string;due:string;project:string})[]>([]);
  // 카테고리 목록 추출
  const tplCategories = [...new Set(templates.map(t=>t.category).filter(Boolean))] as string[];
  // 검색 + 팀 + 카테고리 필터링 + 정렬
  const filteredTpls = templates
    .filter(t=>{
      // 검색 — 이름 + 내부 업무명 + 설명
      if(tplSearch.trim()){
        const q=tplSearch.toLowerCase();
        if(!t.name.toLowerCase().includes(q)&&!t.items.some(it=>it.task.toLowerCase().includes(q))&&!(t.description||"").toLowerCase().includes(q))return false;
      }
      // 팀 필터
      if(tplTeamFilter==="my"&&selectedTeamId&&t.teamId!==selectedTeamId&&t.teamId)return false;
      if(tplTeamFilter==="shared"&&t.teamId)return false;
      // 카테고리 필터
      if(tplCategory&&t.category!==tplCategory)return false;
      return true;
    })
    .sort((a,b)=>{
      // 즐겨찾기 항상 최상단
      const aFav=tplFavs.includes(a.id)?1:0;
      const bFav=tplFavs.includes(b.id)?1:0;
      if(aFav!==bFav)return bFav-aFav;
      // 정렬
      if(tplSort==="recent")return (b.lastUsedAt||"").localeCompare(a.lastUsedAt||"");
      if(tplSort==="name")return a.name.localeCompare(b.name);
      if(tplSort==="count")return (b.useCount||0)-(a.useCount||0);
      return 0;
    });
  // 반복 일괄배정 팝업 — bulkOpen과 분리하여 별도 관리 (RepeatPicker 내부 클릭과 충돌 방지)
  const [bulkRepeatOpen, setBulkRepeatOpen] = useState<DOMRect|null>(null);
  const bulkRepeatRef = useRef<HTMLDivElement>(null);
  // 직접 입력 테이블의 반복 팝오버 — 몇 번째 행이 열려 있는지 + 팝업 위치
  const [repPop, setRepPop] = useState<{idx: number; rect: DOMRect}|null>(null);
  const repPopRef = useRef<HTMLDivElement>(null);
  // AI 결과 행 반복 팝오버 — 직접 입력 행의 repPop과 동일한 패턴으로 별도 관리
  const [aiRepPop, setAiRepPop] = useState<{idx: number; rect: DOMRect}|null>(null);
  const aiRepPopRef = useRef<HTMLDivElement>(null);
  const applyBulk = (field: string, value: string) => { setAiParsed((p: any[]) => p.map((t: any) => t._chk ? {...t, [field]: value} : t)); setBulkOpen(null); };
  // 템플릿 일괄배정 — AI의 applyBulk와 동일한 패턴
  const applyTplBulk = (field: string, value: string) => { setTplApplyItems(p => p.map(t => t._chk ? {...t, [field]: value} : t)); setTplBulkOpen(null); };
  // 일괄배정 드롭다운 바깥 클릭 시 닫기 — 열리는 mousedown과 충돌하지 않도록 다음 프레임에서 리스너 등록
  useEffect(() => {
    if (!bulkOpen) return;
    const close = (e: MouseEvent) => {
      // data-bulk-panel 내부 클릭은 무시 — RepeatPicker 등 내부 조작 보호
      const panel = document.querySelector("[data-bulk-panel]");
      if (panel && panel.contains(e.target as Node)) return;
      setBulkOpen(null);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", close), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", close); };
  }, [bulkOpen]);
  // 템플릿 일괄배정 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!tplBulkOpen) return;
    const close = (e: MouseEvent) => { setTplBulkOpen(null); };
    const t = setTimeout(() => document.addEventListener("mousedown", close), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", close); };
  }, [tplBulkOpen]);
  // 템플릿 반복 일괄배정 팝업 바깥 클릭 시 닫기
  useEffect(() => {
    if (!tplBulkRepeatOpen) return;
    const h = (e: MouseEvent) => {
      if (tplBulkRepeatRef.current && !tplBulkRepeatRef.current.contains(e.target as Node)) setTplBulkRepeatOpen(null);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h, true), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h, true); };
  }, [tplBulkRepeatOpen]);
  // 반복 일괄배정 팝업 바깥 클릭 시 닫기
  useEffect(() => {
    if (!bulkRepeatOpen) return;
    const h = (e: MouseEvent) => {
      if (bulkRepeatRef.current && !bulkRepeatRef.current.contains(e.target as Node)) setBulkRepeatOpen(null);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h, true), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h, true); };
  }, [bulkRepeatOpen]);
  // 템플릿 개별 행 반복 팝업 바깥 클릭 시 닫기
  useEffect(() => {
    if (!tplRepPop) return;
    const h = (e: MouseEvent) => {
      if (tplRepPopRef.current && !tplRepPopRef.current.contains(e.target as Node)) setTplRepPop(null);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h, true), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h, true); };
  }, [tplRepPop]);
  // 반복 팝오버 바깥 클릭 시 닫기
  useEffect(() => {
    if (!repPop) return;
    const h = (e: MouseEvent) => {
      if (repPopRef.current && !repPopRef.current.contains(e.target as Node)) setRepPop(null);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h, true), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h, true); };
  }, [repPop]);
  // AI 결과 행 반복 팝오버 바깥 클릭 시 닫기
  useEffect(() => {
    if (!aiRepPop) return;
    const h = (e: MouseEvent) => {
      if (aiRepPopRef.current && !aiRepPopRef.current.contains(e.target as Node)) setAiRepPop(null);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h, true), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h, true); };
  }, [aiRepPop]);

  // 탭 클릭 — 다른 탭이면 전환+펼치기, 같은 탭이면 접기/펼치기 토글
  const handleTab = (tab: string) => {
    if (addTab === tab) {
      // 같은 탭 클릭 → 접기/펼치기
      if (collapsed) {
        setCollapsed(false);
        if (tab === "manual") setNewRows((r: NewRow[]) => r.length ? r : [{ pid: "", task: "", who: currentUser || "", due: "", pri: "보통", det: "", repeat: "없음" }]);
      } else {
        setCollapsed(true);
      }
    } else {
      // 다른 탭 클릭 → 전환 + 펼치기
      setAddTab(tab);
      setCollapsed(false);
      if (tab === "manual") {
        setNewRows((r: NewRow[]) => r.length ? r : [{ pid: "", task: "", who: currentUser || "", due: "", pri: "보통", det: "", repeat: "없음" }]);
      }
    }
  };

  // 새 템플릿 저장
  const handleSaveTpl = () => {
    if(!tplNewName.trim()){alert("템플릿 이름을 입력해주세요.");return;}
    const validItems=tplNewItems.filter(it=>it.task.trim());
    if(!validItems.length){alert("업무 항목을 1개 이상 입력해주세요.");return;}
    addTemplate?.({
      name:tplNewName.trim(),
      items:validItems.map(it=>({task:it.task.trim(),pri:it.pri||"보통",offsetDays:it.offsetDays??0,det:it.det||"",repeat:it.repeat&&it.repeat!=="없음"?it.repeat:undefined})),
      createdBy:currentUser||"시스템",
      teamId:selectedTeamId||undefined,
      color:"#0891b2",
      category:tplNewCategory||undefined,
    });
    setTplCreating(false);setTplNewName("");setTplNewCategory("");setTplNewItems([{task:"",pri:"보통",offsetDays:0}]);
  };

  // 템플릿 수정 시작 — 기존 데이터를 폼에 로드
  const handleEditTpl = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    setTplEditId(id);
    setTplNewName(tpl.name);
    setTplNewCategory(tpl.category || "");
    setTplNewItems(tpl.items.map(it => ({ task: it.task, pri: it.pri || "보통", offsetDays: it.offsetDays ?? 0, det: it.det || "", repeat: it.repeat })));
    setTplCreating(true);
  };

  // 템플릿 수정 저장
  const handleUpdateTpl = () => {
    if (!tplEditId) return;
    if (!tplNewName.trim()) { alert("템플릿 이름을 입력해주세요."); return; }
    const validItems = tplNewItems.filter(it => it.task.trim());
    if (!validItems.length) { alert("업무 항목을 1개 이상 입력해주세요."); return; }
    updTemplate?.(tplEditId, {
      name: tplNewName.trim(),
      items: validItems.map(it => ({ task: it.task.trim(), pri: it.pri || "보통", offsetDays: it.offsetDays ?? 0, det: it.det || "", repeat: it.repeat && it.repeat !== "없음" ? it.repeat : undefined })),
      category: tplNewCategory || undefined,
    });
    setTplCreating(false); setTplEditId(null); setTplNewName(""); setTplNewCategory(""); setTplNewItems([{ task: "", pri: "보통", offsetDays: 0 }]);
  };

  // 템플릿 적용 — items를 편집 가능한 상태로 로드 (AI 결과 미리보기와 동일 패턴)
  const handleApplyTpl = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    const base = new Date().toISOString().slice(0, 10);
    const baseDt = new Date(base);
    setTplApplyId(id);
    setTplBaseDate(base);
    setTplBulkWho("");
    // 각 항목을 편집 가능한 형태로 변환 — D+N 기반 날짜 계산
    setTplApplyItems(tpl.items.map(item => {
      let due = "";
      if (item.offsetDays !== undefined && item.offsetDays >= 0) {
        const d = new Date(baseDt);
        d.setDate(d.getDate() + item.offsetDays);
        due = d.toISOString().slice(0, 10);
      }
      return { ...item, _chk: true, who: "", due, project: aProj.find(p => p.id === item.pid)?.name || "" };
    }));
  };

  // 기준일 변경 시 모든 항목의 날짜 재계산
  const recalcTplDates = (newBase: string) => {
    setTplBaseDate(newBase);
    const baseDt = new Date(newBase);
    setTplApplyItems(prev => prev.map(item => {
      if (item.offsetDays === undefined || item.offsetDays < 0) return item;
      const d = new Date(baseDt);
      d.setDate(d.getDate() + item.offsetDays);
      return { ...item, due: d.toISOString().slice(0, 10) };
    }));
  };

  // 템플릿 등록 실행
  // 템플릿 등록 — 편집된 항목을 한 번에 일괄 생성 (히스토리 1회만 push)
  const handleConfirmTpl = () => {
    if (!tplApplyId || !confirmTplItems) return;
    const checked = tplApplyItems.filter(it => it._chk);
    if (!checked.length) return;
    const tpl = templates.find(t => t.id === tplApplyId);
    // 편집된 값을 반영하여 일괄 등록 콜백 호출
    const items = checked.map(item => {
      const mp = aProj.find(p => item.project && p.name.includes(item.project));
      return {
        pid: mp ? mp.id : (item.pid || 0),
        task: item.task,
        who: item.who || tplBulkWho || currentUser || "미배정",
        due: item.due || "",
        pri: item.pri || "보통",
        st: "대기",
        det: item.det || "",
        repeat: item.repeat || "없음",
      };
    });
    confirmTplItems(items);
    // 사용 통계 업데이트
    if (tpl) updTemplate?.(tplApplyId, { useCount: (tpl.useCount || 0) + 1, lastUsedAt: new Date().toISOString() });
    flash?.(`${checked.length}건의 업무가 템플릿에서 등록되었습니다`);
    setTplApplyId(null);
    setTplApplyItems([]);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const results: AiFile[] = [];
    for (const file of arr) {
      try {
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          const data = await readAsBase64(file);
          results.push({ name: file.name, type: file.type, data });
        } else {
          const textContent = await readAsText(file);
          results.push({ name: file.name, type: file.type || "text/plain", data: "", textContent });
        }
      } catch (e) {
        console.error("파일 읽기 실패:", file.name, e);
      }
    }
    if (results.length) setAiFiles((p: AiFile[]) => [...p, ...results]);
  };

  // ① 클립보드 붙여넣기 — textarea에서 이미지를 붙여넣을 때 사용 (텍스트는 기본 동작 유지)
  // stopPropagation으로 전역 핸들러와의 중복 처리를 방지
  const handlePaste = (e: React.ClipboardEvent) => {
    const imageFiles: File[] = [];
    Array.from(e.clipboardData.items).forEach(item => {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) imageFiles.push(f);
      }
    });
    if (imageFiles.length > 0) {
      e.preventDefault();
      e.stopPropagation(); // 전역 document 핸들러로 이벤트가 버블링되지 않도록 차단
      handleFiles(imageFiles);
    }
  };

  // ① AI 탭이 열린 동안 전역 paste 이벤트 감지 — 드롭존을 클릭하지 않아도 어디서든 Ctrl+V 동작
  useEffect(() => {
    if (addTab !== "ai" || collapsed) return;
    const onDocPaste = (e: ClipboardEvent) => {
      const imageFiles: File[] = [];
      Array.from(e.clipboardData?.items || []).forEach(item => {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) imageFiles.push(f);
        }
      });
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
      }
    };
    document.addEventListener("paste", onDocPaste);
    return () => document.removeEventListener("paste", onDocPaste);
  }, [addTab, collapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ③ 재분석 전 기존 결과 보존 확인 — 실수로 결과를 잃는 것을 방지
  const handleParseAI = () => {
    if (aiParsed.length > 0) {
      if (!confirm(`분석 결과 ${aiParsed.length}건이 있습니다.\n다시 분석하면 현재 결과가 사라집니다. 계속하시겠습니까?`)) return;
    }
    parseAI();
  };

  // 전체 취소 — 내용이 있으면 확인 요청 (UB-10)
  const handleCancelAll = () => {
    const hasContent = newRows.some(r => r.task || r.det);
    if (newRows.length >= 2 && hasContent) {
      if (!confirm(`${newRows.length}개 행을 삭제하시겠습니까?`)) return;
    }
    setNewRows([]);
  };

  return (
    <>
    <div ref={addSecRef} style={{overflow:"hidden"}}>
    <SectionLabel num="01" title="업무 추가" sub="직접 입력 또는 AI 자동 생성"/>
    <div style={{...S.card,padding:0,marginBottom:10,overflow:"hidden"}}>
      {/* ── 탭 바: 각 탭 어디를 클릭해도 전환+접기/펼치기 ── */}
      <div style={{display:"flex",borderBottom:"2px solid #e2e8f0"}}>
        {/* 직접 입력 탭 */}
        <button onClick={()=>handleTab("manual")}
          onMouseEnter={e=>{
            if(addTab!=="manual"){e.currentTarget.style.color="#334155";e.currentTarget.style.background="#f1f5f9";}
            const svg=e.currentTarget.querySelector("[data-chevron] svg") as SVGElement|null;
            if(svg){svg.setAttribute("stroke-width","2.5");svg.style.color="#334155";}
          }}
          onMouseLeave={e=>{
            if(addTab!=="manual"){e.currentTarget.style.color="#64748b";e.currentTarget.style.background="#f8fafc";}
            const svg=e.currentTarget.querySelector("[data-chevron] svg") as SVGElement|null;
            if(svg){svg.setAttribute("stroke-width","1.5");svg.style.color=addTab==="manual"?"#2563eb":"#94a3b8";}
          }}
          style={{
            flex:1, padding:"11px 12px", fontSize:12,
            fontWeight:addTab==="manual"?700:500,
            color:addTab==="manual"?"#2563eb":"#64748b",
            background:addTab==="manual"&&!collapsed?"#eff6ff":"#f8fafc",
            border:"none", borderBottom:addTab==="manual"&&!collapsed?"2px solid #2563eb":"2px solid transparent",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginBottom:-2,
            transition:"color .12s, background .12s",
        }}>
          <PlusIcon style={{width:14,height:14}}/> 직접 입력
          {addTab==="manual"&&<span data-chevron style={{display:"inline-flex",alignItems:"center",marginLeft:2}}>
            {collapsed
              ? <ChevronDownIcon style={{width:12,height:12,color:"#2563eb",transition:"color .12s"}}/>
              : <ChevronUpIcon style={{width:12,height:12,color:"#2563eb",transition:"color .12s"}}/>}
          </span>}
        </button>
        {/* AI 자동 입력 탭 */}
        <button onClick={()=>handleTab("ai")}
          onMouseEnter={e=>{
            if(addTab!=="ai"){e.currentTarget.style.color="#4c1d95";e.currentTarget.style.background="#f5f3ff";}
            const svg=e.currentTarget.querySelector("[data-chevron] svg") as SVGElement|null;
            if(svg){svg.setAttribute("stroke-width","2.5");svg.style.color="#4c1d95";}
          }}
          onMouseLeave={e=>{
            if(addTab!=="ai"){e.currentTarget.style.color="#64748b";e.currentTarget.style.background="#f8fafc";}
            const svg=e.currentTarget.querySelector("[data-chevron] svg") as SVGElement|null;
            if(svg){svg.setAttribute("stroke-width","1.5");svg.style.color=addTab==="ai"?"#7c3aed":"#94a3b8";}
          }}
          style={{
            flex:1, padding:"11px 12px", fontSize:12,
            fontWeight:addTab==="ai"?700:500,
            color:addTab==="ai"?"#7c3aed":"#64748b",
            background:addTab==="ai"&&!collapsed?"#f5f3ff":"#f8fafc",
            border:"none", borderBottom:addTab==="ai"&&!collapsed?"2px solid #7c3aed":"2px solid transparent",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginBottom:-2,
            transition:"color .12s, background .12s",
        }}>
          <SparklesIcon style={ICON_SM} /> AI 자동 입력
          {addTab==="ai"&&<span data-chevron style={{display:"inline-flex",alignItems:"center",marginLeft:2}}>
            {collapsed
              ? <ChevronDownIcon style={{width:12,height:12,color:"#7c3aed",transition:"color .12s"}}/>
              : <ChevronUpIcon style={{width:12,height:12,color:"#7c3aed",transition:"color .12s"}}/>}
          </span>}
        </button>
        {/* 템플릿 탭 */}
        <button onClick={()=>handleTab("tpl")}
          onMouseEnter={e=>{
            if(addTab!=="tpl"){e.currentTarget.style.color="#0e7490";e.currentTarget.style.background="#ecfeff";}
          }}
          onMouseLeave={e=>{
            if(addTab!=="tpl"){e.currentTarget.style.color="#64748b";e.currentTarget.style.background="#f8fafc";}
          }}
          style={{
            flex:1, padding:"11px 12px", fontSize:12,
            fontWeight:addTab==="tpl"?700:500,
            color:addTab==="tpl"?"#0891b2":"#64748b",
            background:addTab==="tpl"&&!collapsed?"#ecfeff":"#f8fafc",
            border:"none", borderBottom:addTab==="tpl"&&!collapsed?"2px solid #0891b2":"2px solid transparent",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginBottom:-2,
            transition:"color .12s, background .12s",
        }}>
          <RectangleStackIcon style={ICON_SM}/> 템플릿
          {addTab==="tpl"&&<span data-chevron style={{display:"inline-flex",alignItems:"center",marginLeft:2}}>
            {collapsed
              ? <ChevronDownIcon style={{width:12,height:12,color:"#0891b2",transition:"color .12s"}}/>
              : <ChevronUpIcon style={{width:12,height:12,color:"#0891b2",transition:"color .12s"}}/>}
          </span>}
        </button>
      </div>

      {/* ── 직접 입력 패널 ── */}
      {!collapsed&&addTab==="manual"&&<div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:newRows.length?10:0}}>
          {/* UA-6: 행 추가는 Secondary, 저장만 Primary */}
          <button onClick={addNR} style={{...S.bs,fontSize:12,fontWeight:600,padding:"7px 16px",display:"flex",alignItems:"center",gap:5}}>
            <PlusIcon style={{width:14,height:14}}/> 행 추가
          </button>
          {newRows.length>0&&<>
            <button style={{...S.bp,fontSize:11,padding:"6px 14px"}} onClick={saveNRs}>{newRows.length}개 저장</button>
            <button style={{...S.bs,fontSize:11,padding:"6px 12px",display:"inline-flex",alignItems:"center",gap:3}} onClick={handleCancelAll}>
              <XMarkIcon style={{width:12,height:12}}/> 전체 취소
            </button>
          </>}
        </div>
        {newRows.length>0&&<div style={{border:"1.5px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
          {/* UA-2: % 기반 열 너비 */}
          <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
            <colgroup>
              <col style={{width:"12%"}}/>
              <col style={{width:"24%"}}/>
              <col/>
              <col style={{width:"8%"}}/>
              <col style={{width:"12%"}}/>
              <col style={{width:"7%"}}/>
              <col style={{width:"7%"}}/>
              <col style={{width:"5%"}}/>
            </colgroup>
            <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {["프로젝트","업무내용 *","상세내용","담당자 *","마감기한","우선순위","반복",""].map((h,i)=>
                <th key={i} style={{padding:"6px 8px",fontSize:10,fontWeight:700,color:"#64748b",textAlign:"left"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {newRows.map((r,i)=>{const empty=isNREmpty(r);return <tr key={"nr"+i} style={{background:i%2===0?"#fafcff":"#f5f8ff",borderBottom:i===newRows.length-1?"none":"1px solid #e2e8f0"}}>
                <td style={{padding:"4px 6px"}}><select value={r.pid} onChange={e=>{const n=[...newRows];n[i].pid=e.target.value;setNewRows(n)}} style={{...cellInput,fontSize:10}}><option value="">프로젝트</option>{projOptions}</select></td>
                <td style={{padding:"4px 6px"}}><input value={r.task} onChange={e=>{const n=[...newRows];n[i].task=e.target.value;setNewRows(n)}} onKeyDown={e=>{if(e.key==="Enter"){if(!isNREmpty(newRows[i]))saveOneNR(i);else addNR()}}} placeholder="업무내용 (필수)" autoFocus={i===newRows.length-1} style={{...cellInput,fontWeight:600}}/></td>
                <td style={{padding:"4px 6px"}}>
                  <div onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setNotePopup({todo:{id:`__nr_${i}`,task:r.task||"새 업무",det:r.det||""},x:rect.left,y:rect.bottom,_newRow:i});}}
                    style={{...cellInput,cursor:"text",color:r.det&&stripHtml(r.det)?"#334155":"#94a3b8",display:"flex",alignItems:"center",padding:"0 6px"}}>
                    {r.det&&stripHtml(r.det)?stripHtml(r.det).slice(0,20)+(stripHtml(r.det).length>20?"…":""):<span style={{color:"#bfcfe8"}}>상세내용...</span>}
                  </div>
                </td>
                <td style={{padding:"4px 6px"}}><select value={r.who} onChange={e=>{const n=[...newRows];n[i].who=e.target.value;setNewRows(n)}} style={{...cellInput,fontSize:10}}><option value="">담당자</option>{members.map(m=><option key={m}>{m}</option>)}</select></td>
                <td style={{padding:"4px 6px"}}><div onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setNrDatePop({id:i,rect,value:r.due||""});}} style={{...cellInput,cursor:"pointer",color:r.due?"#334155":"#94a3b8",whiteSpace:"nowrap",display:"flex",alignItems:"center",padding:"0 6px"}}>{r.due?fD(r.due):"날짜 선택"}</div></td>
                <td style={{padding:"4px 6px"}}><select value={r.pri} onChange={e=>{const n=[...newRows];n[i].pri=e.target.value;setNewRows(n)}} style={{...cellInput,fontSize:10}}>{pris.map(p=><option key={p}>{p}</option>)}</select></td>
                {/* 반복 셀 — 클릭 시 RepeatPicker 팝오버 열기 */}
                <td style={{padding:"4px 6px",position:"relative"}}>
                  <div onClick={e=>{const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();setRepPop({idx:i,rect});}}
                    style={{...cellInput,cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:r.repeat&&r.repeat!=="없음"?"#1a73e8":"#94a3b8"}}>
                    <ArrowPathIcon style={{width:10,height:10,flexShrink:0}}/>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
                      {r.repeat&&r.repeat!=="없음"?repeatLabel(r.repeat):"반복"}
                    </span>
                  </div>
                </td>
                <td style={{padding:"4px 4px",textAlign:"center"}}>
                  <button onClick={()=>saveOneNR(i)} disabled={empty} style={{background:empty?"#f1f5f9":"#2563eb",border:"none",color:empty?"#cbd5e1":"#fff",cursor:empty?"default":"pointer",fontSize:10,fontWeight:700,borderRadius:6,padding:"4px 5px",marginRight:2,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><CheckIcon style={{width:12,height:12}}/></button>
                  <button onClick={()=>setNewRows((r: NewRow[])=>r.filter((_,j)=>j!==i))} style={{background:"#fee2e2",border:"none",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700,borderRadius:6,padding:"4px 5px",display:"inline-flex",alignItems:"center",justifyContent:"center"}}><XMarkIcon style={{width:12,height:12}}/></button>
                </td>
              </tr>})}
            </tbody>
          </table>
        </div>}
      </div>}

      {/* ── AI 자동 입력 패널 ── */}
      {!collapsed&&addTab==="ai"&&<div style={{padding:"14px 16px"}}>
        {/* ② API 키 미설정 경고 — localStorage에 키가 없으면 설정 안내 배너 표시 */}
        {!localStorage.getItem("team-todo-apikey")&&<div style={{display:"flex",alignItems:"center",gap:8,background:"#fef9c3",border:"1px solid #fde68a",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:11,color:"#92400e"}}>
          <span style={{fontWeight:700}}>API 키 미설정</span>
          <span>설정 메뉴에서 Anthropic API 키를 먼저 등록해야 AI 분석이 가능합니다.</span>
        </div>}
        {/* 안내 문구 — 형식 없이 자연어로 써도 된다는 것을 강조 */}
        <p style={{fontSize:11,color:"#64748b",margin:"0 0 10px",lineHeight:1.6}}>
          회의록, 메모, 카카오톡 내용 등 <b style={{color:"#334155"}}>형식 없이 그대로</b> 붙여넣으면 AI가 업무를 뽑아냅니다.<br/>
          이미지·PDF·텍스트 파일도 첨부 가능하고, 스크린샷은 <b style={{color:"#334155"}}>Ctrl+V</b>로 바로 붙여넣을 수 있습니다.
        </p>

        {/* 파일 첨부 영역 — ① 클립보드 붙여넣기(Ctrl+V)도 지원 */}
        <input ref={fileInputRef} type="file" multiple accept={ACCEPT_TYPES} style={{display:"none"}}
          onChange={e=>{if(e.target.files)handleFiles(e.target.files);e.target.value="";}}/>
        <div
          onDragEnter={e=>{e.preventDefault();setDragOver(true);}}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={e=>{e.preventDefault();setDragOver(false);}}
          onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files);}}
          onClick={()=>fileInputRef.current?.click()}
          style={{border:`2px dashed ${dragOver?"#7c3aed":"#ddd6fe"}`,borderRadius:12,padding:"14px 18px",marginBottom:12,cursor:"pointer",background:dragOver?"#f5f3ff":"#fdfcff",transition:"all .15s",display:"flex",alignItems:"center",gap:14}}>
          {/* 아이콘을 원형 배경 안에 배치하여 클릭 영역 명확화 */}
          <div style={{width:40,height:40,borderRadius:10,background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <PaperClipIcon style={{width:20,height:20,color:"#7c3aed"}} />
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:dragOver?"#7c3aed":"#6d28d9"}}>파일·이미지 첨부</div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>이미지, PDF, 텍스트 파일 · 드래그 또는 클릭 · Ctrl+V 스크린샷</div>
          </div>
          {aiFiles.length>0&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:"#7c3aed",background:"#ede9fe",borderRadius:99,padding:"2px 8px"}}>{aiFiles.length}개 첨부됨</span>}
        </div>

        {/* UB-8: 파일과 텍스트 관계 안내 */}
        {aiFiles.length>0&&<>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
            {aiFiles.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:8,padding:"4px 8px",maxWidth:200}}>
                {f.type.startsWith("image/")?
                  <img src={`data:${f.type};base64,${f.data}`} style={{width:32,height:32,objectFit:"cover",borderRadius:4,flexShrink:0}}/>:
                  <span style={{flexShrink:0,display:"inline-flex"}}>{f.type==="application/pdf"?<DocumentIcon style={{width:20,height:20}} />:<DocumentTextIcon style={{width:20,height:20}} />}</span>}
                <span style={{fontSize:10,color:"#4c1d95",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{f.name}</span>
                <button onClick={e=>{e.stopPropagation();setAiFiles((p:AiFile[])=>p.filter((_,j)=>j!==i));}}
                  style={{background:"none",border:"none",cursor:"pointer",color:"#a78bfa",fontSize:13,padding:0,lineHeight:1,flexShrink:0,display:"inline-flex",alignItems:"center"}}><XMarkIcon style={{width:12,height:12}}/></button>
              </div>
            ))}
          </div>
          <p style={{fontSize:10,color:"#94a3b8",margin:"0 0 8px"}}>첨부 파일과 아래 텍스트를 함께 분석합니다.</p>
        </>}

        {/* 텍스트 입력 — wrapper에 border를 두고 textarea는 border 없이 틈 없는 구조 */}
        <div data-ai-textarea-wrap style={{position:"relative",marginBottom:2,border:"1.5px solid #ddd6fe",borderRadius:12,background:"#fdfcff",transition:"border-color .15s, box-shadow .15s"}}>
          <textarea value={aiText} onChange={e=>setAiText(e.target.value)} onPaste={handlePaste} rows={7} placeholder={"회의 내용, 메모, 카카오톡 대화를 그대로 붙여넣으세요.\n\n예) 오늘 회의에서 나온 내용 —\n\n바이어관리\n박정찬이 중국 바이어 문의 매일 확인하기로 함.\n\n디자인\n김현지가 시안 3개 4월 5일까지 긴급 처리.\n\n주간보고\n김대윤이 보고서 월요일마다 올리기로 함."}
            ref={el => { if (el && !el.dataset.init) { el.dataset.init = "1"; el.style.height = "180px"; } }}
            style={{width:"100%",minHeight:120,padding:"14px 16px 20px",border:"none",borderRadius:"12px 12px 0 0",fontSize:13,outline:"none",resize:"none",overflow:"auto",lineHeight:1.8,boxSizing:"border-box" as const,background:"transparent",fontFamily:"inherit",display:"block"}}
            onFocus={e=>{
              const wrap=e.target.closest("[data-ai-textarea-wrap]") as HTMLElement|null;
              if(wrap){wrap.style.borderColor="#7c3aed";wrap.style.boxShadow="0 0 0 3px rgba(124,58,237,.1)";}
            }}
            onBlur={e=>{
              const wrap=e.target.closest("[data-ai-textarea-wrap]") as HTMLElement|null;
              if(wrap){wrap.style.borderColor="#ddd6fe";wrap.style.boxShadow="none";}
            }}/>
          {/* 글자 수 카운터 */}
          <span style={{position:"absolute",bottom:10,right:14,fontSize:11,color:"#94a3b8",pointerEvents:"none"}}>{aiText.length}자</span>
          {/* 하단 전체 드래그 핸들 — wrapper 안에서 틈 없이 배치 */}
          <div data-resize-handle
            style={{height:12,borderTop:"1px dashed #e2d8f5",cursor:"ns-resize",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .12s",borderRadius:"0 0 10px 10px"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#f5f3ff";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent";}}
            onMouseDown={e=>{
              e.preventDefault();
              const ta=e.currentTarget.parentElement?.querySelector("textarea") as HTMLTextAreaElement|null;
              if(!ta)return;
              const startY=e.clientY;
              const startH=ta.offsetHeight;
              const onMove=(ev:MouseEvent)=>{const nh=Math.max(120,startH+(ev.clientY-startY));ta.style.height=nh+"px";};
              const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
              document.addEventListener("mousemove",onMove);
              document.addEventListener("mouseup",onUp);
            }}>
            <div style={{width:32,height:3,borderRadius:2,background:"#cbd5e1"}}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
          {/* UB-5: 로딩 시 스피너 아이콘 회전 */}
          {/* ③ 기존 결과 있을 때 재분석 전 확인 — handleParseAI가 confirm 처리 */}
          <button style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:700,cursor:aiLoad?"default":"pointer",opacity:aiLoad?.7:1,display:"inline-flex",alignItems:"center",gap:5}} onClick={handleParseAI} disabled={aiLoad}>
            {aiLoad
              ? <><ArrowPathIcon style={{width:14,height:14,animation:"spin 1s linear infinite"}}/> 분석 중...</>
              : <>TODO 자동 생성</>}
          </button>
          {/* 상태 메시지 + 오류 시 재시도 버튼 */}
          {aiSt&&<>
            <span style={{fontSize:11,fontWeight:600,color:aiSt.startsWith("ok:")?"#16a34a":aiSt.startsWith("err:")?"#dc2626":"#64748b"}}>
              {aiSt.startsWith("ok:")||aiSt.startsWith("err:")?aiSt.slice(aiSt.indexOf(":")+1):aiSt}
            </span>
            {aiSt.startsWith("err:")&&<button onClick={handleParseAI} style={{fontSize:10,fontWeight:600,color:"#7c3aed",background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 10px",cursor:"pointer"}}>다시 시도</button>}
          </>}
          {(aiText||aiFiles.length>0)&&<button style={{...S.bs,fontSize:10,marginLeft:"auto"}} onClick={()=>{setAiText("");setAiSt("");setAiParsed([]);setAiFiles([]);}}>초기화</button>}
        </div>

        {/* 스피너 키프레임 */}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* ── AI 결과 미리보기 ── */}
        {aiParsed.length>0&&<div style={{marginTop:12,border:"1.5px solid #ddd6fe",borderRadius:10,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",background:"#f5f3ff",borderBottom:"1px solid #ddd6fe",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <input type="checkbox" checked={aiParsed.every(t=>t._chk)}
                ref={el=>{if(el)el.indeterminate=aiParsed.some(t=>t._chk)&&!aiParsed.every(t=>t._chk);}}
                onChange={e=>setAiParsed((p: any[])=>p.map(t=>({...t,_chk:e.target.checked})))}
                style={{cursor:"pointer",accentColor:"#7c3aed",width:13,height:13}}/>
              <span style={{fontSize:12,fontWeight:700,color:"#7c3aed",display:"inline-flex",alignItems:"center",gap:3}}><SparklesIcon style={ICON_SM} /> {aiParsed.filter(t=>t._chk).length} / {aiParsed.length}건 선택됨</span>
              <div style={{display:"flex",gap:4}} onMouseDown={e=>e.stopPropagation()}>
                {([
                  {key:"project",icon:<FolderIcon style={ICON_SM} />,label:"프로젝트",opts:aProj.filter(p=>!p.parentId).flatMap(p=>{const ch=aProj.filter(c=>c.parentId===p.id);return [{label:p.name,value:p.name},...ch.map(c=>({label:`  └ ${c.name}`,value:c.name}))];})},
                  {key:"assignee",icon:<UserIcon style={ICON_SM} />,label:"담당자",opts:members.map(m=>({label:m,value:m}))},
                  {key:"priority",icon:<BoltIcon style={ICON_SM} />,label:"우선순위",opts:pris.map(p=>({label:p,value:p}))},
                ] as {key:string,icon:React.ReactNode,label:string,opts:{label:string,value:string}[]}[]).map(({key,icon,label,opts})=>(
                  <div key={key} style={{position:"relative"}}>
                    {/* 일괄배정 버튼 — 아이콘 + 텍스트 라벨 병기로 발견 가능성 향상 */}
                    <button data-bulk={key} title={`${label} 일괄배정`} onMouseDown={e=>{e.stopPropagation();setBulkOpen(bulkOpen===key?null:key);}}
                      style={{background:bulkOpen===key?"#ddd6fe":"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#7c3aed",transition:"background .1s",display:"inline-flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
                      {icon} {label}
                    </button>
                    {bulkOpen===key&&(()=>{
                      // 부모 overflow:hidden에 잘리지 않도록 fixed 위치로 렌더링
                      const btnEl=document.querySelector(`[data-bulk="${key}"]`) as HTMLElement|null;
                      const r=btnEl?.getBoundingClientRect();
                      return <div onMouseDown={e=>e.stopPropagation()} style={{position:"fixed",top:r?(r.bottom+4):0,left:r?r.left:0,zIndex:1000,background:"#fff",border:"1px solid #ddd6fe",borderRadius:8,minWidth:180,maxWidth:320,boxShadow:"0 6px 20px rgba(124,58,237,.15)",overflow:"hidden"}}>
                        <div style={{padding:"6px 12px",fontSize:11,color:"#94a3b8",fontWeight:600,borderBottom:"1px solid #f3f0ff",background:"#faf9ff",whiteSpace:"nowrap" as const}}>{label} 일괄배정</div>
                        <div style={{maxHeight:280,overflowY:"auto"}}>
                          {opts.map(o=>(
                            <div key={o.value} onMouseDown={()=>applyBulk(key,o.value)}
                              style={{padding:"8px 14px",fontSize:13,cursor:"pointer",color:"#4c1d95",background:"#fff",whiteSpace:"nowrap" as const}}
                              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#f5f3ff"}
                              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
                              {o.label}
                            </div>
                          ))}
                        </div>
                      </div>;
                    })()}
                  </div>
                ))}
                {/* 반복 일괄배정 — RepeatPicker 팝업 사용 (별도 상태로 관리하여 내부 클릭 충돌 방지) */}
                <div style={{position:"relative"}}>
                  <button title="반복 일괄배정" onMouseDown={e=>{
                    e.stopPropagation();
                    if(bulkRepeatOpen){setBulkRepeatOpen(null);}
                    else{const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();setBulkRepeatOpen(rect);setBulkOpen(null);}
                  }}
                    style={{background:bulkRepeatOpen?"#ddd6fe":"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#7c3aed",transition:"background .1s",display:"inline-flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
                    <ArrowPathIcon style={ICON_SM} /> 반복
                  </button>
                </div>
                {/* 마감기한 일괄배정 — DateTimePicker 사용 */}
                <div style={{position:"relative"}}>
                  <button title="마감기한 일괄배정" onMouseDown={e=>{
                    e.stopPropagation();
                    if(setDatePop){
                      const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
                      setDatePop({id:-9999,rect,value:""});
                    }
                  }}
                    style={{background:bulkOpen==="due"?"#ddd6fe":"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#7c3aed",transition:"background .1s",display:"inline-flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
                    <CalendarIcon style={ICON_SM} /> 마감기한
                  </button>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {/* ⑤ 이전 분석 결과 복원 버튼 — 히스토리가 있을 때만 표시 */}
              {aiHistory&&aiHistory.length>0&&restoreAiHistory&&(
                <button onClick={restoreAiHistory} title="이전 분석 결과 복원"
                  style={{fontSize:10,fontWeight:600,color:"#7c3aed",background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"4px 10px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:3}}>
                  <ArrowPathIcon style={{width:11,height:11}}/> 이전 결과 ({aiHistory.length}건)
                </button>
              )}
              <button style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",padding:"5px 18px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={confirmAI}>등록</button>
              <button style={{...S.bs,fontSize:11}} onClick={()=>setAiParsed([])}>취소</button>
            </div>
          </div>
          <div style={{maxHeight:340,overflowY:"auto"}}>
            {aiParsed.map((t,i)=>{
              const mp=aProj.find(p=>t.project&&p.name.includes(t.project));
              const pc=mp?.color||"#94a3b8";
              const prc=priC[t.priority||"보통"]||"#2563eb";
              const prBg=priBg[t.priority||"보통"]||"#eff6ff";
              return <div key={i} style={{padding:"13px 18px",borderBottom:"1px solid #f3f0ff",display:"flex",gap:12,alignItems:"flex-start",background:t._chk?(i%2===0?"#fff":"#fdfcff"):"#f8f9fb",opacity:t._chk?1:0.45,transition:"opacity .15s",borderLeft:`3px solid ${t._chk?pc:"#e2e8f0"}`}}>
                <input type="checkbox" checked={t._chk} style={{marginTop:4,cursor:"pointer",flexShrink:0,accentColor:"#7c3aed",width:14,height:14}}
                  onChange={e=>{const n=[...aiParsed];n[i]._chk=e.target.checked;setAiParsed(n);}}/>
                <div style={{flex:1,minWidth:0}}>
                  <input value={t.task} onChange={e=>{const n=[...aiParsed];n[i].task=e.target.value;setAiParsed(n);}}
                    style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:14,fontWeight:600,padding:"2px 0",outline:"none",background:"transparent",color:"#0f172a",transition:"border-color .15s",boxSizing:"border-box" as const,fontFamily:"inherit"}}
                    onFocus={e=>(e.target.style.borderBottomColor="#7c3aed")}
                    onBlur={e=>(e.target.style.borderBottomColor="transparent")}/>
                  {/* UA-8: 배지 높이 22px 통일 (aiSelBase) */}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginTop:8,alignItems:"center"}}>
                    <select value={mp?.id||""} onChange={e=>{const n=[...aiParsed];n[i].project=aProj.find(p=>p.id===parseInt(e.target.value))?.name||"";setAiParsed(n);}}
                      style={{...aiSelBase,borderColor:pc+"55",background:pc+"18",color:pc}}>
                      <option value="">미배정</option>
                      {projOptions}
                    </select>
                    <select value={members.find(m=>m===t.assignee)||t.assignee||""} onChange={e=>{const n=[...aiParsed];n[i].assignee=e.target.value;setAiParsed(n);}}
                      style={{...aiSelBase,borderColor:"#e2e8f0",background:"#f1f5f9",color:"#475569"}}>
                      <option value="">미배정</option>
                      {members.map(m=><option key={m}>{m}</option>)}
                    </select>
                    {/* UA-7: 날짜 — DateTimePicker 사용 또는 통일된 스타일 */}
                    <div onClick={e=>{
                      if(setDatePop){
                        e.stopPropagation();
                        const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
                        // AI 행은 임시 ID로 -1000-i 사용, 저장 콜백에서 aiParsed 업데이트
                        setDatePop({id:-(1000+i),rect,value:t.due||""});
                      }
                    }} style={{...aiSelBase,borderColor:"#e2e8f0",background:"#f1f5f9",color:t.due?"#334155":"#94a3b8",display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer"}}>
                      <CalendarIcon style={{width:10,height:10,flexShrink:0}}/> {t.due?fD(t.due):"날짜"}
                    </div>
                    <select value={t.priority||"보통"} onChange={e=>{const n=[...aiParsed];n[i].priority=e.target.value;setAiParsed(n);}}
                      style={{...aiSelBase,borderColor:prc+"55",background:prBg,color:prc}}>
                      {pris.map(p=><option key={p}>{p}</option>)}
                    </select>
                    {/* ④ 반복 설정 — RepeatPicker 팝업으로 교체 (직접 입력 행과 동일한 패턴) */}
                    <div onClick={e=>{const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();setAiRepPop({idx:i,rect});}}
                      style={{...aiSelBase,borderColor:t.repeat&&t.repeat!=="없음"?"#a78bfa":"#e2e8f0",background:t.repeat&&t.repeat!=="없음"?"#f3f0ff":"#f1f5f9",color:t.repeat&&t.repeat!=="없음"?"#7c3aed":"#94a3b8",display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer"}}>
                      <ArrowPathIcon style={{width:10,height:10,flexShrink:0}}/>
                      {t.repeat&&t.repeat!=="없음"?repeatLabel(t.repeat):"반복"}
                    </div>
                  </div>
                  <input value={t.detail||""} onChange={e=>{const n=[...aiParsed];n[i].detail=e.target.value;setAiParsed(n);}} placeholder="상세내용 입력..."
                    style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:12,padding:"4px 0",marginTop:6,outline:"none",background:"transparent",color:"#64748b",boxSizing:"border-box" as const,transition:"border-color .15s",fontFamily:"inherit"}}
                    onFocus={e=>(e.target.style.borderBottomColor="#7c3aed")}
                    onBlur={e=>(e.target.style.borderBottomColor="transparent")}/>
                </div>
                <button onClick={()=>setAiParsed((p: any[])=>p.filter((_,j)=>j!==i))}
                  style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:15,padding:"2px 3px",flexShrink:0,lineHeight:1,marginTop:1,transition:"color .12s",display:"inline-flex",alignItems:"center"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#dc2626"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="#cbd5e1"}><XMarkIcon style={{width:12,height:12}}/></button>
              </div>;
            })}
          </div>
        </div>}
      </div>}

      {/* ── 템플릿 패널 ── */}
      {!collapsed&&addTab==="tpl"&&<div style={{padding:"14px 16px"}}>
        <p style={{fontSize:12,color:"#64748b",margin:"0 0 12px",lineHeight:1.6}}>
          자주 반복되는 업무 묶음을 <b style={{color:"#334155"}}>템플릿으로 저장</b>해두고, 필요할 때 <b style={{color:"#334155"}}>담당자·날짜만 바꿔 한 번에 등록</b>하세요.
        </p>

        {/* 검색 + 필터 바 */}
        {templates.length>0&&<div style={{marginBottom:10}}>
          {/* 검색 + 팀 필터 + 정렬 */}
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:tplCategories.length>0?8:0}}>
            <input value={tplSearch} onChange={e=>setTplSearch(e.target.value)} placeholder="템플릿 검색..."
              style={{flex:1,padding:"7px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:12,outline:"none",fontFamily:"inherit",background:"#fff",transition:"border-color .15s"}}
              onFocus={e=>{e.target.style.borderColor="#0891b2";}} onBlur={e=>{e.target.style.borderColor="#e2e8f0";}}/>
            {/* 팀 필터 */}
            <select value={tplTeamFilter} onChange={e=>setTplTeamFilter(e.target.value as "all"|"my"|"shared")}
              style={{padding:"6px 10px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,fontFamily:"inherit",cursor:"pointer",color:"#475569",background:"#fff"}}>
              <option value="all">전체</option>
              {selectedTeamId&&<option value="my">내 팀</option>}
              <option value="shared">공용</option>
            </select>
            {/* 정렬 */}
            <select value={tplSort} onChange={e=>setTplSort(e.target.value as "recent"|"name"|"count")}
              style={{padding:"6px 10px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,fontFamily:"inherit",cursor:"pointer",color:"#475569",background:"#fff"}}>
              <option value="recent">최근 사용순</option>
              <option value="name">이름순</option>
              <option value="count">사용 횟수순</option>
            </select>
          </div>
          {/* 카테고리 칩 필터 */}
          {tplCategories.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
            <span onClick={()=>setTplCategory("")}
              style={{fontSize:11,fontWeight:tplCategory?500:700,color:tplCategory?"#64748b":"#0891b2",background:tplCategory?"#f8fafc":"#ecfeff",border:`1px solid ${tplCategory?"#e2e8f0":"#a5f3fc"}`,borderRadius:99,padding:"3px 10px",cursor:"pointer",transition:"all .12s"}}>전체</span>
            {tplCategories.map(cat=>(
              <span key={cat} onClick={()=>setTplCategory(tplCategory===cat?"":cat)}
                style={{fontSize:11,fontWeight:tplCategory===cat?700:500,color:tplCategory===cat?"#0891b2":"#64748b",background:tplCategory===cat?"#ecfeff":"#f8fafc",border:`1px solid ${tplCategory===cat?"#a5f3fc":"#e2e8f0"}`,borderRadius:99,padding:"3px 10px",cursor:"pointer",transition:"all .12s"}}>{cat}</span>
            ))}
          </div>}
        </div>}

        {/* 템플릿 목록 */}
        {filteredTpls.length>0?<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12,maxHeight:240,overflowY:"auto"}}>
          {filteredTpls.map(tpl=>{
            const isFav=tplFavs.includes(tpl.id);
            return <div key={tpl.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",border:`1.5px solid ${tplPreview===tpl.id?"#0891b2":"#e2e8f0"}`,borderRadius:10,background:tplPreview===tpl.id?"#ecfeff":"#fff",cursor:"pointer",transition:"all .15s"}}
              onClick={()=>setTplPreview(tplPreview===tpl.id?null:tpl.id)}
              onMouseEnter={e=>{if(tplPreview!==tpl.id){(e.currentTarget as HTMLElement).style.borderColor="#a5f3fc";(e.currentTarget as HTMLElement).style.background="#f0fdfa";}}}
              onMouseLeave={e=>{if(tplPreview!==tpl.id){(e.currentTarget as HTMLElement).style.borderColor="#e2e8f0";(e.currentTarget as HTMLElement).style.background="#fff";}}}>
              {/* 즐겨찾기 별표 */}
              <button onClick={e=>{e.stopPropagation();setTplFavs?.(prev=>isFav?prev.filter(id=>id!==tpl.id):[...prev,tpl.id]);}}
                style={{background:"none",border:"none",cursor:"pointer",padding:2,flexShrink:0,color:isFav?"#f59e0b":"#d1d5db",transition:"color .12s"}}
                onMouseEnter={e=>{if(!isFav)(e.currentTarget as HTMLElement).style.color="#fbbf24";}}
                onMouseLeave={e=>{if(!isFav)(e.currentTarget as HTMLElement).style.color="#d1d5db";}}>
                {isFav?<StarIcon style={{width:14,height:14}}/>:<StarOutlineIcon style={{width:14,height:14}}/>}
              </button>
              {/* 아이콘 */}
              <div style={{width:32,height:32,borderRadius:8,background:(tpl.color||"#0891b2")+"18",color:tpl.color||"#0891b2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <RectangleStackIcon style={{width:16,height:16}}/>
              </div>
              {/* 정보 */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{tpl.name}</span>
                  {tpl.category&&<span style={{fontSize:9,fontWeight:600,color:"#0891b2",background:"#ecfeff",border:"1px solid #a5f3fc",borderRadius:4,padding:"1px 5px",flexShrink:0}}>{tpl.category}</span>}
                </div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:1,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap" as const}}>
                  <span>{tpl.createdBy}</span>
                  <span>·</span>
                  <span>{tpl.items.length}개 업무</span>
                  {tpl.useCount?<><span>·</span><span>{tpl.useCount}회 사용</span></>:null}
                  {tpl.lastUsedAt?<><span>·</span><span>{(() => { const d = new Date(tpl.lastUsedAt); const diff = Math.floor((Date.now() - d.getTime()) / 86400000); return diff === 0 ? "오늘" : diff === 1 ? "어제" : `${diff}일 전`; })()}</span></>:null}
                </div>
              </div>
              {/* 업무 수 배지 */}
              <span style={{fontSize:11,fontWeight:600,color:"#0891b2",background:"#ecfeff",border:"1px solid #a5f3fc",borderRadius:99,padding:"2px 10px",flexShrink:0}}>{tpl.items.length}개</span>
              {/* 적용 */}
              <button onClick={e=>{e.stopPropagation();handleApplyTpl(tpl.id);}} style={{background:"#ecfeff",border:"1px solid #a5f3fc",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,color:"#0891b2",cursor:"pointer",fontFamily:"inherit",flexShrink:0,display:"inline-flex",alignItems:"center",gap:3}}>
                적용
              </button>
              {/* 수정 */}
              <button onClick={e=>{e.stopPropagation();handleEditTpl(tpl.id);}} style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",padding:4,flexShrink:0,transition:"color .12s",display:"inline-flex"}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#0891b2"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="#cbd5e1"}>
                <PencilSquareIcon style={{width:14,height:14}}/>
              </button>
              {/* 삭제 */}
              <button onClick={e=>{e.stopPropagation();if(confirm(`"${tpl.name}" 템플릿을 삭제하시겠습니까?`))delTemplate?.(tpl.id);}} style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",padding:4,flexShrink:0,transition:"color .12s",display:"inline-flex"}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#dc2626"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="#cbd5e1"}>
                <TrashIcon style={{width:14,height:14}}/>
              </button>
            </div>;
          })}
        </div>:<div style={{padding:"24px 0",textAlign:"center"}}>
          <div style={{fontSize:13,color:"#64748b",fontWeight:600,marginBottom:4}}>저장된 템플릿이 없습니다</div>
          <div style={{fontSize:11,color:"#94a3b8"}}>아래에서 첫 번째 템플릿을 만들어 보세요</div>
        </div>}

        {/* 템플릿 적용 미리보기 */}
        {tplPreview&&(()=>{
          const tpl=templates.find(t=>t.id===tplPreview);
          if(!tpl)return null;
          return <div style={{border:"1.5px solid #a5f3fc",borderRadius:10,overflow:"hidden",marginBottom:12,background:"#f0fdfa"}}>
            <div style={{padding:"10px 14px",background:"#ecfeff",borderBottom:"1px solid #a5f3fc",display:"flex",alignItems:"center",gap:8}}>
              <RectangleStackIcon style={{width:14,height:14,color:"#0891b2"}}/>
              <span style={{fontSize:13,fontWeight:700,color:"#0891b2",flex:1}}>{tpl.name} 미리보기</span>
              <button onClick={()=>setTplPreview(null)} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",padding:2}}><XMarkIcon style={{width:14,height:14}}/></button>
            </div>
            <div style={{maxHeight:200,overflowY:"auto"}}>
              {tpl.items.map((item,i)=>(
                <div key={i} style={{padding:"6px 14px",borderBottom:"1px solid #e0f7fa",fontSize:12,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{flex:1,fontWeight:600,color:"#0f172a"}}>{item.task}</span>
                  {item.offsetDays!==undefined&&<span style={{fontSize:10,color:"#0891b2",background:"#ecfeff",border:"1px solid #a5f3fc",borderRadius:4,padding:"1px 6px",fontWeight:600,fontStyle:"italic"}}>D+{item.offsetDays}</span>}
                  <span style={{fontSize:10,color:priC[item.pri||"보통"]||"#2563eb",fontWeight:600}}>{item.pri||"보통"}</span>
                  {item.repeat&&item.repeat!=="없음"&&<span style={{fontSize:10,color:"#7c3aed",background:"#f3f0ff",border:"1px solid #ddd6fe",borderRadius:4,padding:"1px 6px",fontWeight:600}}>{item.repeat}</span>}
                </div>
              ))}
            </div>
          </div>;
        })()}

        {/* 새 템플릿 만들기 */}
        {!tplCreating?<div onClick={()=>setTplCreating(true)}
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"12px",border:"2px dashed #a5f3fc",borderRadius:10,color:"#0891b2",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",background:"#fafffe"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#0891b2";(e.currentTarget as HTMLElement).style.background="#ecfeff";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#a5f3fc";(e.currentTarget as HTMLElement).style.background="#fafffe";}}>
          <PlusIcon style={{width:14,height:14}}/> 새 템플릿 만들기
        </div>

        :<div style={{border:"1.5px solid #0891b2",borderRadius:10,overflow:"hidden",background:"#fff"}}>
          <div style={{padding:"12px 14px",background:"#ecfeff",borderBottom:"1px solid #a5f3fc"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input value={tplNewName} onChange={e=>setTplNewName(e.target.value)} placeholder="템플릿 이름 (예: 프로젝트 수주, 월간 정기보고)"
                style={{flex:1,padding:"8px 12px",border:"1.5px solid #a5f3fc",borderRadius:8,fontSize:13,fontWeight:600,outline:"none",fontFamily:"inherit",background:"#fff"}}
                onFocus={e=>{e.target.style.borderColor="#0891b2";}} onBlur={e=>{e.target.style.borderColor="#a5f3fc";}}
                autoFocus/>
              <select value={tplNewCategory} onChange={e=>setTplNewCategory(e.target.value)}
                style={{padding:"7px 10px",border:"1.5px solid #a5f3fc",borderRadius:8,fontSize:12,fontFamily:"inherit",color:"#475569",background:"#fff"}}>
                <option value="">카테고리 선택</option>
                <option value="프로젝트">프로젝트</option>
                <option value="정기업무">정기업무</option>
                <option value="인사/총무">인사/총무</option>
                <option value="영업">영업</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>
          <div style={{padding:"10px 14px"}}>
            <div style={{fontSize:11,fontWeight:600,color:"#64748b",marginBottom:6}}>업무 항목</div>
            {tplNewItems.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                <input value={item.task} onChange={e=>{const n=[...tplNewItems];n[i]={...n[i],task:e.target.value};setTplNewItems(n);}} placeholder="업무명"
                  style={{flex:1,padding:"5px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
                <select value={item.pri||"보통"} onChange={e=>{const n=[...tplNewItems];n[i]={...n[i],pri:e.target.value};setTplNewItems(n);}}
                  style={{padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,fontFamily:"inherit",width:60}}>
                  {pris.map(p=><option key={p}>{p}</option>)}
                </select>
                {/* 반복 설정 */}
                <select value={item.repeat||"없음"} onChange={e=>{const n=[...tplNewItems];n[i]={...n[i],repeat:e.target.value};setTplNewItems(n);}}
                  style={{padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,fontFamily:"inherit",width:56,color:item.repeat&&item.repeat!=="없음"?"#7c3aed":"#64748b"}}>
                  <option value="없음">반복</option>
                  <option value="매일">매일</option>
                  <option value="매주">매주</option>
                  <option value="매월">매월</option>
                </select>
                <input type="number" min={0} value={item.offsetDays??0} onChange={e=>{const n=[...tplNewItems];n[i]={...n[i],offsetDays:parseInt(e.target.value)||0};setTplNewItems(n);}} placeholder="D+"
                  style={{width:50,padding:"5px 6px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,textAlign:"center",outline:"none",fontFamily:"inherit"}} title="기준일 대비 마감일 (D+N)"/>
                <button onClick={()=>setTplNewItems(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",padding:2,transition:"color .12s"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#dc2626"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="#cbd5e1"}>
                  <XMarkIcon style={{width:12,height:12}}/>
                </button>
              </div>
            ))}
            <button onClick={()=>setTplNewItems(p=>[...p,{task:"",pri:"보통",offsetDays:0}])}
              style={{background:"none",border:"none",color:"#0891b2",fontSize:11,fontWeight:600,cursor:"pointer",padding:"4px 0",display:"flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
              <PlusIcon style={{width:12,height:12}}/> 항목 추가
            </button>
          </div>
          <div style={{padding:"8px 14px",borderTop:"1px solid #e2e8f0",display:"flex",gap:6,justifyContent:"flex-end"}}>
            <button onClick={()=>{setTplCreating(false);setTplEditId(null);setTplNewName("");setTplNewCategory("");setTplNewItems([{task:"",pri:"보통",offsetDays:0}]);}} style={{...S.bs,fontSize:11}}>취소</button>
            <button onClick={tplEditId ? handleUpdateTpl : handleSaveTpl} style={{background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",border:"none",padding:"6px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              <CheckIcon style={{width:12,height:12,display:"inline",verticalAlign:"middle",marginRight:3}}/> {tplEditId ? "수정 저장" : "저장"}
            </button>
          </div>
        </div>}

        {/* ── 템플릿 적용 미리보기 — AI 결과와 동일한 인라인 편집 UI ── */}
        {tplApplyId&&tplApplyItems.length>0&&(()=>{
          const tpl=templates.find(t=>t.id===tplApplyId);
          if(!tpl)return null;
          const checkedCount=tplApplyItems.filter(t=>t._chk).length;
          return <div style={{marginTop:12,border:"1.5px solid #a5f3fc",borderRadius:10,overflow:"hidden"}}>
            {/* 헤더 바 — AI 결과와 동일한 레이아웃, 템플릿 청록색 테마 */}
            <div style={{padding:"10px 14px",background:"#ecfeff",borderBottom:"1px solid #a5f3fc",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" as const}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" as const}}>
                {/* 전체 선택 체크박스 */}
                <input type="checkbox" checked={tplApplyItems.every(t=>t._chk)}
                  ref={el=>{if(el)el.indeterminate=tplApplyItems.some(t=>t._chk)&&!tplApplyItems.every(t=>t._chk);}}
                  onChange={e=>setTplApplyItems(p=>p.map(t=>({...t,_chk:e.target.checked})))}
                  style={{cursor:"pointer",accentColor:"#0891b2",width:14,height:14}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#0891b2",display:"inline-flex",alignItems:"center",gap:3}}>
                  <RectangleStackIcon style={ICON_SM}/> {checkedCount} / {tplApplyItems.length}건 선택됨
                </span>
                {/* 일괄배정 버튼들 — AI와 동일한 구조 (fixed 드롭다운 + RepeatPicker), 청록색 테마 */}
                <div style={{display:"flex",gap:4}} onMouseDown={e=>e.stopPropagation()}>
                  {/* 기준일 — 템플릿 전용 */}
                  <div style={{display:"inline-flex",alignItems:"center",gap:3,background:"#e0f7fa",border:"1px solid #a5f3fc",borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:600,color:"#0891b2"}}>
                    <CalendarIcon style={ICON_SM}/> 기준일
                    <input type="date" value={tplBaseDate} onChange={e=>recalcTplDates(e.target.value)}
                      style={{border:"none",background:"transparent",fontSize:11,fontFamily:"inherit",outline:"none",color:"#0891b2",fontWeight:600,width:100}}/>
                  </div>
                  {/* 프로젝트 / 담당자 / 우선순위 — AI와 동일한 fixed 드롭다운 */}
                  {([
                    {key:"project",icon:<FolderIcon style={ICON_SM}/>,label:"프로젝트",opts:aProj.filter(p=>!p.parentId).flatMap(p=>{const ch=aProj.filter(c=>c.parentId===p.id);return [{label:p.name,value:p.name},...ch.map(c=>({label:`  └ ${c.name}`,value:c.name}))];})},
                    {key:"who",icon:<UserIcon style={ICON_SM}/>,label:"담당자",opts:members.map(m=>({label:m,value:m}))},
                    {key:"pri",icon:<BoltIcon style={ICON_SM}/>,label:"우선순위",opts:pris.map(p=>({label:p,value:p}))},
                  ] as {key:string,icon:React.ReactNode,label:string,opts:{label:string,value:string}[]}[]).map(({key,icon,label,opts})=>(
                    <div key={key} style={{position:"relative"}}>
                      <button data-tpl-bulk={key} title={`${label} 일괄배정`} onMouseDown={e=>{e.stopPropagation();setTplBulkOpen(tplBulkOpen===key?null:key);}}
                        style={{background:tplBulkOpen===key?"#cffafe":"#e0f7fa",border:"1px solid #a5f3fc",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#0891b2",transition:"background .1s",display:"inline-flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
                        {icon} {label}
                      </button>
                      {tplBulkOpen===key&&(()=>{
                        const btnEl=document.querySelector(`[data-tpl-bulk="${key}"]`) as HTMLElement|null;
                        const r=btnEl?.getBoundingClientRect();
                        return <div onMouseDown={e=>e.stopPropagation()} style={{position:"fixed",top:r?(r.bottom+4):0,left:r?r.left:0,zIndex:1000,background:"#fff",border:"1px solid #a5f3fc",borderRadius:8,minWidth:180,maxWidth:320,boxShadow:"0 6px 20px rgba(8,145,178,.15)",overflow:"hidden"}}>
                          <div style={{padding:"6px 12px",fontSize:11,color:"#94a3b8",fontWeight:600,borderBottom:"1px solid #e0f7fa",background:"#f0fdfa",whiteSpace:"nowrap" as const}}>{label} 일괄배정</div>
                          <div style={{maxHeight:280,overflowY:"auto"}}>
                            {opts.map(o=>(
                              <div key={o.value} onMouseDown={()=>applyTplBulk(key,o.value)}
                                style={{padding:"8px 14px",fontSize:13,cursor:"pointer",color:"#0e7490",background:"#fff",whiteSpace:"nowrap" as const}}
                                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#f0fdfa"}
                                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
                                {o.label}
                              </div>
                            ))}
                          </div>
                        </div>;
                      })()}
                    </div>
                  ))}
                  {/* 반복 일괄배정 — RepeatPicker 팝업 */}
                  <div style={{position:"relative"}}>
                    <button title="반복 일괄배정" onMouseDown={e=>{
                      e.stopPropagation();
                      if(tplBulkRepeatOpen){setTplBulkRepeatOpen(null);}
                      else{const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();setTplBulkRepeatOpen(rect);setTplBulkOpen(null);}
                    }}
                      style={{background:tplBulkRepeatOpen?"#cffafe":"#e0f7fa",border:"1px solid #a5f3fc",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#0891b2",transition:"background .1s",display:"inline-flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
                      <ArrowPathIcon style={ICON_SM}/> 반복
                    </button>
                  </div>
                  {/* 마감기한 일괄배정 — date input으로 직접 처리 (로컬 상태이므로 DateTimePicker 불필요) */}
                  <label style={{background:"#e0f7fa",border:"1px solid #a5f3fc",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#0891b2",display:"inline-flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
                    <CalendarIcon style={ICON_SM}/> 마감기한
                    <input type="date" onChange={e=>{const v=e.target.value;if(v)setTplApplyItems(p=>p.map(t=>t._chk?{...t,due:v}:t));}}
                      style={{position:"absolute",opacity:0,width:0,height:0,pointerEvents:"none"}}
                      onClick={e=>e.stopPropagation()}/>
                  </label>
                </div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={handleConfirmTpl} style={{background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",border:"none",padding:"5px 18px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:4}}>
                  등록
                </button>
                <button onClick={()=>{setTplApplyId(null);setTplApplyItems([]);}} style={{...S.bs,fontSize:11}}>취소</button>
              </div>
            </div>
            {/* 업무 행 — AI 결과 행과 동일한 구조, 청록색 테마 */}
            <div style={{maxHeight:340,overflowY:"auto"}}>
              {tplApplyItems.map((t,i)=>{
                const mp=aProj.find(p=>t.project&&p.name.includes(t.project));
                const pc=mp?.color||"#94a3b8";
                const prc=priC[t.pri||"보통"]||"#2563eb";
                const prBg=(t.pri&&priC[t.pri])?priC[t.pri]+"18":"#eff6ff";
                return <div key={i} style={{padding:"13px 18px",borderBottom:"1px solid #e0f7fa",display:"flex",gap:12,alignItems:"flex-start",background:t._chk?(i%2===0?"#fff":"#f0fdfa"):"#f8f9fb",opacity:t._chk?1:0.45,transition:"opacity .15s",borderLeft:`3px solid ${t._chk?pc:"#e2e8f0"}`}}>
                  <input type="checkbox" checked={t._chk} style={{marginTop:4,cursor:"pointer",flexShrink:0,accentColor:"#0891b2",width:14,height:14}}
                    onChange={e=>{const n=[...tplApplyItems];n[i]={...n[i],_chk:e.target.checked};setTplApplyItems(n);}}/>
                  <div style={{flex:1,minWidth:0}}>
                    {/* 업무명 — 인라인 편집 */}
                    <input value={t.task} onChange={e=>{const n=[...tplApplyItems];n[i]={...n[i],task:e.target.value};setTplApplyItems(n);}}
                      style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:14,fontWeight:600,padding:"2px 0",outline:"none",background:"transparent",color:"#0f172a",transition:"border-color .15s",boxSizing:"border-box" as const,fontFamily:"inherit"}}
                      onFocus={e=>(e.target.style.borderBottomColor="#0891b2")}
                      onBlur={e=>(e.target.style.borderBottomColor="transparent")}/>
                    {/* 배지 행 */}
                    <div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginTop:8,alignItems:"center"}}>
                      {/* 프로젝트 */}
                      <select value={mp?.id||""} onChange={e=>{const n=[...tplApplyItems];n[i]={...n[i],project:aProj.find(p=>p.id===parseInt(e.target.value))?.name||"",pid:parseInt(e.target.value)||0};setTplApplyItems(n);}}
                        style={{...aiSelBase,borderColor:pc+"55",background:pc+"18",color:pc}}>
                        <option value="">미배정</option>
                        {projOptions}
                      </select>
                      {/* 담당자 */}
                      <select value={t.who||""} onChange={e=>{const n=[...tplApplyItems];n[i]={...n[i],who:e.target.value};setTplApplyItems(n);}}
                        style={{...aiSelBase,borderColor:"#e2e8f0",background:"#f1f5f9",color:"#475569"}}>
                        <option value="">미배정</option>
                        {members.map(m=><option key={m}>{m}</option>)}
                      </select>
                      {/* 날짜 */}
                      <div style={{...aiSelBase,borderColor:"#e2e8f0",background:"#f1f5f9",color:t.due?"#334155":"#94a3b8",display:"inline-flex",alignItems:"center",gap:3}}>
                        <CalendarIcon style={{width:10,height:10,flexShrink:0}}/> {t.due?fD(t.due):"날짜"}
                        {t.offsetDays!==undefined&&<span style={{fontSize:9,color:"#0891b2",fontStyle:"italic",marginLeft:2}}>D+{t.offsetDays}</span>}
                      </div>
                      {/* 우선순위 */}
                      <select value={t.pri||"보통"} onChange={e=>{const n=[...tplApplyItems];n[i]={...n[i],pri:e.target.value};setTplApplyItems(n);}}
                        style={{...aiSelBase,borderColor:prc+"55",background:prBg,color:prc}}>
                        {pris.map(p=><option key={p}>{p}</option>)}
                      </select>
                      {/* 반복 — RepeatPicker 팝업 사용 (AI 행과 동일) */}
                      <div onClick={e=>{const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();setTplRepPop({idx:i,rect});}}
                        style={{...aiSelBase,borderColor:t.repeat&&t.repeat!=="없음"?"#67e8f9":"#e2e8f0",background:t.repeat&&t.repeat!=="없음"?"#ecfeff":"#f1f5f9",color:t.repeat&&t.repeat!=="없음"?"#0891b2":"#94a3b8",display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer"}}>
                        <ArrowPathIcon style={{width:10,height:10,flexShrink:0}}/>
                        {t.repeat&&t.repeat!=="없음"?repeatLabel(t.repeat):"반복"}
                      </div>
                    </div>
                    {/* 상세내용 */}
                    <input value={t.det||""} onChange={e=>{const n=[...tplApplyItems];n[i]={...n[i],det:e.target.value};setTplApplyItems(n);}} placeholder="상세내용 입력..."
                      style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:12,padding:"4px 0",marginTop:6,outline:"none",background:"transparent",color:"#64748b",boxSizing:"border-box" as const,transition:"border-color .15s",fontFamily:"inherit"}}
                      onFocus={e=>(e.target.style.borderBottomColor="#0891b2")}
                      onBlur={e=>(e.target.style.borderBottomColor="transparent")}/>
                  </div>
                  {/* 삭제 버튼 */}
                  <button onClick={()=>setTplApplyItems(p=>p.filter((_,j)=>j!==i))}
                    style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:15,padding:"2px 3px",flexShrink:0,lineHeight:1,marginTop:1,transition:"color .12s",display:"inline-flex",alignItems:"center"}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#dc2626"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="#cbd5e1"}><XMarkIcon style={{width:12,height:12}}/></button>
                </div>;
              })}
            </div>
          </div>;
        })()}
      </div>}
    </div>
    </div>

    {/* ── AI 결과 행 반복 팝오버 — 직접 입력 행의 repPop과 동일한 구조 ── */}
    {aiRepPop && (
      <div
        ref={aiRepPopRef}
        style={{
          position: "fixed",
          top: aiRepPop.rect.bottom + 4,
          left: aiRepPop.rect.left,
          zIndex: 300,
          background: "#fff",
          border: "1px solid #ddd6fe",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(124,58,237,.15)",
          padding: "10px 14px",
          minWidth: 200,
          maxWidth: 260,
        }}
      >
        <RepeatPicker
          value={aiParsed[aiRepPop.idx]?.repeat || "없음"}
          onChange={v => {
            const n = [...aiParsed];
            if (n[aiRepPop.idx]) { n[aiRepPop.idx] = { ...n[aiRepPop.idx], repeat: v }; setAiParsed(n); }
          }}
          startDate={aiParsed[aiRepPop.idx]?.due || ""}
        />
        <button
          onClick={() => setAiRepPop(null)}
          style={{ width: "100%", marginTop: 10, padding: "5px", borderRadius: 6, border: "none", background: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >완료</button>
      </div>
    )}

    {/* ── 반복 일괄배정 팝업 — bulkOpen과 분리된 별도 상태 ── */}
    {bulkRepeatOpen && (
      <div
        ref={bulkRepeatRef}
        style={{
          position: "fixed",
          top: bulkRepeatOpen.bottom + 4,
          left: bulkRepeatOpen.left,
          zIndex: 1000,
          background: "#fff",
          border: "1px solid #ddd6fe",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(124,58,237,.15)",
          padding: "10px 14px",
          minWidth: 200,
          maxWidth: 260,
        }}
      >
        <RepeatPicker
          value="없음"
          onChange={v => {
            setAiParsed((p: any[]) => p.map((t: any) => t._chk ? { ...t, repeat: v } : t));
          }}
          startDate=""
        />
        <button
          onClick={() => setBulkRepeatOpen(null)}
          style={{ width: "100%", marginTop: 10, padding: "5px", borderRadius: 6, border: "none", background: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >완료</button>
      </div>
    )}

    {/* ── 템플릿 반복 일괄배정 팝업 — AI 반복 일괄배정과 동일한 구조 ── */}
    {tplBulkRepeatOpen && (
      <div
        ref={tplBulkRepeatRef}
        style={{
          position: "fixed",
          top: tplBulkRepeatOpen.bottom + 4,
          left: tplBulkRepeatOpen.left,
          zIndex: 1000,
          background: "#fff",
          border: "1px solid #a5f3fc",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(8,145,178,.15)",
          padding: "10px 14px",
          minWidth: 200,
          maxWidth: 260,
        }}
      >
        <RepeatPicker
          value="없음"
          onChange={v => {
            setTplApplyItems(p => p.map(t => t._chk ? { ...t, repeat: v } : t));
          }}
          startDate=""
        />
        <button
          onClick={() => setTplBulkRepeatOpen(null)}
          style={{ width: "100%", marginTop: 10, padding: "5px", borderRadius: 6, border: "none", background: "#0891b2", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >완료</button>
      </div>
    )}

    {/* ── 템플릿 개별 행 반복 팝업 — AI의 aiRepPop과 동일한 구조, 청록색 테마 ── */}
    {tplRepPop && (
      <div
        ref={tplRepPopRef}
        style={{
          position: "fixed",
          top: tplRepPop.rect.bottom + 4,
          left: tplRepPop.rect.left,
          zIndex: 300,
          background: "#fff",
          border: "1px solid #a5f3fc",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(8,145,178,.15)",
          padding: "10px 14px",
          minWidth: 200,
          maxWidth: 260,
        }}
      >
        <RepeatPicker
          value={tplApplyItems[tplRepPop.idx]?.repeat || "없음"}
          onChange={v => {
            const n = [...tplApplyItems];
            if (n[tplRepPop.idx]) { n[tplRepPop.idx] = { ...n[tplRepPop.idx], repeat: v }; setTplApplyItems(n); }
          }}
          startDate={tplApplyItems[tplRepPop.idx]?.due || ""}
        />
        <button
          onClick={() => setTplRepPop(null)}
          style={{ width: "100%", marginTop: 10, padding: "5px", borderRadius: 6, border: "none", background: "#0891b2", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >완료</button>
      </div>
    )}

    {/* ── 반복 팝오버 — 직접 입력 행의 반복 셀 클릭 시 표시 ── */}
    {repPop && (
      <div
        ref={repPopRef}
        style={{
          position: "fixed",
          // 팝오버를 클릭한 셀 아래쪽에 정렬 (zoom: 1.0이므로 보정 없음)
          top: repPop.rect.bottom + 4,
          left: repPop.rect.left,
          zIndex: 300,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,.12)",
          padding: "10px 14px",
          minWidth: 200,
          maxWidth: 260,
        }}
      >
        <RepeatPicker
          value={newRows[repPop.idx]?.repeat || "없음"}
          onChange={v => {
            const n = [...newRows];
            if (n[repPop.idx]) { n[repPop.idx] = { ...n[repPop.idx], repeat: v }; setNewRows(n); }
          }}
          startDate={newRows[repPop.idx]?.due || ""}
        />
        <button
          onClick={() => setRepPop(null)}
          style={{ width: "100%", marginTop: 10, padding: "5px", borderRadius: 6, border: "none", background: "#1a73e8", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >완료</button>
      </div>
    )}
    </>
  );
}
