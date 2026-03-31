import React, { useRef, useState, useEffect } from "react";
import { repeatLabel } from "../../constants";
import { S } from "../../styles";
import { fD, stripHtml } from "../../utils";
import { NewRow, DatePopState } from "../../types";
import { Project } from "../../types";
import { SectionLabel } from "../ui/SectionLabel";
import { FolderIcon, UserIcon, BoltIcon, ArrowPathIcon, CalendarIcon, PaperClipIcon, DocumentIcon, DocumentTextIcon, SparklesIcon, CheckIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon, ICON_SM } from "../ui/Icons";
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

// AI 결과 행 배지 공통 스타일 — 높이 22px 통일
const aiSelBase: React.CSSProperties = {
  padding: "0 8px", borderRadius: 99, fontSize: 10, fontWeight: 600,
  cursor: "pointer", outline: "none", border: "1px solid",
  appearance: "none", WebkitAppearance: "none",
  height: 22, lineHeight: "22px", boxSizing: "border-box",
  fontFamily: "inherit",
};

export function AddTodoSection({
  addTab, setAddTab, newRows, setNewRows, addNR, saveNRs, saveOneNR, isNREmpty,
  aProj, members, pris, setNotePopup, setNrDatePop, aiText, setAiText,
  aiFiles, setAiFiles, aiLoad, aiSt, setAiSt, aiParsed, setAiParsed, parseAI, confirmAI,
  priC, priBg, currentUser, setDatePop, aiHistory, restoreAiHistory
}: AddTodoSectionProps) {
  const addSecRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [bulkOpen, setBulkOpen] = useState<string|null>(null);
  // 직접 입력 테이블의 반복 팝오버 — 몇 번째 행이 열려 있는지 + 팝업 위치
  const [repPop, setRepPop] = useState<{idx: number; rect: DOMRect}|null>(null);
  const repPopRef = useRef<HTMLDivElement>(null);
  // AI 결과 행 반복 팝오버 — 직접 입력 행의 repPop과 동일한 패턴으로 별도 관리
  const [aiRepPop, setAiRepPop] = useState<{idx: number; rect: DOMRect}|null>(null);
  const aiRepPopRef = useRef<HTMLDivElement>(null);
  const applyBulk = (field: string, value: string) => { setAiParsed((p: any[]) => p.map((t: any) => t._chk ? {...t, [field]: value} : t)); setBulkOpen(null); };
  useEffect(() => { if (!bulkOpen) return; const close = () => setBulkOpen(null); document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, [bulkOpen]);
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
                <td style={{padding:"4px 6px"}}><select value={r.pid} onChange={e=>{const n=[...newRows];n[i].pid=e.target.value;setNewRows(n)}} style={{...cellInput,fontSize:10}}><option value="">프로젝트</option>{aProj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
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
          style={{border:`2px dashed ${dragOver?"#7c3aed":"#ddd6fe"}`,borderRadius:8,padding:"12px 16px",marginBottom:10,cursor:"pointer",background:dragOver?"#f5f3ff":"#fdfcff",transition:"all .15s",display:"flex",alignItems:"center",gap:10}}>
          <PaperClipIcon style={{width:20,height:20,flexShrink:0}} />
          <div>
            <div style={{fontSize:12,fontWeight:600,color:dragOver?"#7c3aed":"#6d28d9"}}>파일·이미지 첨부</div>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>이미지, PDF, 텍스트 파일 · 드래그 또는 클릭</div>
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

        {/* 이미지 붙여넣기는 전역 핸들러가 처리하고, textarea 포커스 중에는 stopPropagation으로 중복 방지 */}
        <textarea value={aiText} onChange={e=>setAiText(e.target.value)} onPaste={handlePaste} rows={3} placeholder={"회의 내용이나 메모를 그대로 붙여넣어 보세요.\n\n예) 오늘 회의에서 나온 내용 —\n\n바이어관리\n박정찬이 중국 바이어 문의 매일 확인하기로 함.\n\n디자인\n김현지가 시안 3개 4월 5일까지 긴급 처리.\n\n주간보고\n김대윤이 보고서 월요일마다 올리기로 함."} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #ddd6fe",borderRadius:8,fontSize:12,outline:"none",resize:"vertical",lineHeight:1.7,boxSizing:"border-box" as const,background:"#fdfcff",fontFamily:"inherit"}}/>
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
                  {key:"project",icon:<FolderIcon style={ICON_SM} />,label:"프로젝트",opts:aProj.map(p=>({label:p.name,value:p.name}))},
                  {key:"assignee",icon:<UserIcon style={ICON_SM} />,label:"담당자",opts:members.map(m=>({label:m,value:m}))},
                  {key:"priority",icon:<BoltIcon style={ICON_SM} />,label:"우선순위",opts:pris.map(p=>({label:p,value:p}))},
                  {key:"repeat",icon:<ArrowPathIcon style={ICON_SM} />,label:"반복",opts:["없음","매일","매주","매월"].map(r=>({label:r,value:r}))},
                ] as {key:string,icon:React.ReactNode,label:string,opts:{label:string,value:string}[]}[]).map(({key,icon,label,opts})=>(
                  <div key={key} style={{position:"relative"}}>
                    <button title={`${label} 일괄배정`} onMouseDown={e=>{e.stopPropagation();setBulkOpen(bulkOpen===key?null:key);}}
                      style={{background:bulkOpen===key?"#ddd6fe":"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:12,color:"#7c3aed",transition:"background .1s",display:"inline-flex",alignItems:"center"}}>
                      {icon}
                    </button>
                    {bulkOpen===key&&<div onMouseDown={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:200,background:"#fff",border:"1px solid #ddd6fe",borderRadius:8,minWidth:130,boxShadow:"0 6px 20px rgba(124,58,237,.15)",overflow:"hidden"}}>
                      <div style={{padding:"5px 10px",fontSize:10,color:"#94a3b8",fontWeight:600,borderBottom:"1px solid #f3f0ff",background:"#faf9ff"}}>{label} 일괄배정</div>
                      {opts.map(o=>(
                        <div key={o.value} onMouseDown={()=>applyBulk(key,o.value)}
                          style={{padding:"7px 12px",fontSize:12,cursor:"pointer",color:"#4c1d95",background:"#fff"}}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#f5f3ff"}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
                          {o.label}
                        </div>
                      ))}
                    </div>}
                  </div>
                ))}
                {/* 마감기한 일괄배정 — DateTimePicker 사용 */}
                <div style={{position:"relative"}}>
                  <button title="마감기한 일괄배정" onMouseDown={e=>{
                    e.stopPropagation();
                    if(setDatePop){
                      const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
                      // id -9999 = 일괄배정 전용 (App.tsx에서 분기 처리)
                      setDatePop({id:-9999,rect,value:""});
                    }
                  }}
                    style={{background:bulkOpen==="due"?"#ddd6fe":"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:12,color:"#7c3aed",transition:"background .1s",display:"inline-flex",alignItems:"center"}}>
                    <CalendarIcon style={ICON_SM} />
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
              return <div key={i} style={{padding:"11px 14px",borderBottom:"1px solid #f3f0ff",display:"flex",gap:10,alignItems:"flex-start",background:t._chk?(i%2===0?"#fff":"#fdfcff"):"#f8f9fb",opacity:t._chk?1:0.45,transition:"opacity .15s",borderLeft:`3px solid ${t._chk?pc:"#e2e8f0"}`}}>
                <input type="checkbox" checked={t._chk} style={{marginTop:3,cursor:"pointer",flexShrink:0,accentColor:"#7c3aed",width:13,height:13}}
                  onChange={e=>{const n=[...aiParsed];n[i]._chk=e.target.checked;setAiParsed(n);}}/>
                <div style={{flex:1,minWidth:0}}>
                  <input value={t.task} onChange={e=>{const n=[...aiParsed];n[i].task=e.target.value;setAiParsed(n);}}
                    style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:13,fontWeight:600,padding:"1px 0",outline:"none",background:"transparent",color:"#0f172a",transition:"border-color .15s",boxSizing:"border-box" as const,fontFamily:"inherit"}}
                    onFocus={e=>(e.target.style.borderBottomColor="#7c3aed")}
                    onBlur={e=>(e.target.style.borderBottomColor="transparent")}/>
                  {/* UA-8: 배지 높이 22px 통일 (aiSelBase) */}
                  <div style={{display:"flex",gap:5,flexWrap:"wrap" as const,marginTop:7,alignItems:"center"}}>
                    <select value={mp?.id||""} onChange={e=>{const n=[...aiParsed];n[i].project=aProj.find(p=>p.id===parseInt(e.target.value))?.name||"";setAiParsed(n);}}
                      style={{...aiSelBase,borderColor:pc+"55",background:pc+"18",color:pc}}>
                      <option value="">미배정</option>
                      {aProj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
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
                    style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:10,padding:"3px 0",marginTop:5,outline:"none",background:"transparent",color:"#64748b",boxSizing:"border-box" as const,transition:"border-color .15s",fontFamily:"inherit"}}
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
