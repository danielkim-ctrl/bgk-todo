import React, { useRef, useState, useEffect } from "react";
import { REPEAT_OPTS } from "../../constants";
import { S } from "../../styles";
import { fD, stripHtml } from "../../utils";
import { NewRow, DatePopState } from "../../types";
import { Project } from "../../types";
import { SectionLabel } from "../ui/SectionLabel";
import { FolderIcon, UserIcon, BoltIcon, ArrowPathIcon, CalendarIcon, PaperClipIcon, DocumentIcon, DocumentTextIcon, SparklesIcon, CheckIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon, ICON_SM } from "../ui/Icons";

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
  priC, priBg, currentUser, setDatePop
}: AddTodoSectionProps) {
  const addSecRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [bulkOpen, setBulkOpen] = useState<string|null>(null);
  const applyBulk = (field: string, value: string) => { setAiParsed((p: any[]) => p.map((t: any) => t._chk ? {...t, [field]: value} : t)); setBulkOpen(null); };
  useEffect(() => { if (!bulkOpen) return; const close = () => setBulkOpen(null); document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, [bulkOpen]);

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

  // 전체 취소 — 내용이 있으면 확인 요청 (UB-10)
  const handleCancelAll = () => {
    const hasContent = newRows.some(r => r.task || r.det);
    if (newRows.length >= 2 && hasContent) {
      if (!confirm(`${newRows.length}개 행을 삭제하시겠습니까?`)) return;
    }
    setNewRows([]);
  };

  return (
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
                <td style={{padding:"4px 6px"}}><select value={r.repeat||"없음"} onChange={e=>{const n=[...newRows];n[i].repeat=e.target.value;setNewRows(n)}} style={{...cellInput,fontSize:10}}>{REPEAT_OPTS.map(p=><option key={p}>{p}</option>)}</select></td>
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
        {/* UB-9: 핵심 키워드 강조 */}
        <p style={{fontSize:11,color:"#64748b",margin:"0 0 10px",lineHeight:1.6}}>
          자유롭게 업무를 입력하거나 파일·이미지를 첨부하면 AI가 자동으로 TODO를 생성합니다.<br/>
          담당자는 <b style={{color:"#334155"}}>@이름</b>, 마감기한은 <b style={{color:"#334155"}}>"4월 10일"</b>, 반복은 <b style={{color:"#334155"}}>"매일/매주/매월"</b>처럼 입력하세요.
        </p>

        {/* 파일 첨부 영역 */}
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

        <textarea value={aiText} onChange={e=>setAiText(e.target.value)} rows={3} placeholder={"예시:\n1. 일일 바이어 문의 확인 @박정찬 매일\n2. 주간 진행상황 공유 @김대윤 매주 월요일\n3. 중국 시안 확인 @김현지 4월 5일 긴급"} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #ddd6fe",borderRadius:8,fontSize:12,outline:"none",resize:"vertical",lineHeight:1.7,boxSizing:"border-box" as const,background:"#fdfcff",fontFamily:"inherit"}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
          {/* UB-5: 로딩 시 스피너 아이콘 회전 */}
          <button style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:700,cursor:aiLoad?"default":"pointer",opacity:aiLoad?.7:1,display:"inline-flex",alignItems:"center",gap:5}} onClick={parseAI} disabled={aiLoad}>
            {aiLoad
              ? <><ArrowPathIcon style={{width:14,height:14,animation:"spin 1s linear infinite"}}/> 분석 중...</>
              : <>TODO 자동 생성</>}
          </button>
          {/* 상태 메시지 + UB-6: 오류 시 재시도 버튼 */}
          {aiSt&&<>
            <span style={{fontSize:11,fontWeight:600,color:aiSt.startsWith("ok:")?"#16a34a":"#dc2626"}}>
              {aiSt.startsWith("ok:")||aiSt.startsWith("err:")?aiSt.slice(aiSt.indexOf(":")+1):aiSt}
            </span>
            {aiSt.startsWith("err:")&&<button onClick={parseAI} style={{fontSize:10,fontWeight:600,color:"#7c3aed",background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 10px",cursor:"pointer"}}>다시 시도</button>}
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
            <div style={{display:"flex",gap:6}}>
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
                    <select value={t.repeat||"없음"} onChange={e=>{const n=[...aiParsed];n[i].repeat=e.target.value;setAiParsed(n);}}
                      style={{...aiSelBase,borderColor:"#e2e8f0",background:"#f1f5f9",color:t.repeat&&t.repeat!=="없음"?"#7c3aed":"#94a3b8"}}>
                      {REPEAT_OPTS.map(r=><option key={r}>{r}</option>)}
                    </select>
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
  );
}
