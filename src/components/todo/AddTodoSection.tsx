import { useRef, useState, useEffect } from "react";
import { REPEAT_OPTS } from "../../constants";
import { S } from "../../styles";
import { fD, stripHtml } from "../../utils";
import { NewRow, DatePopState } from "../../types";
import { Project } from "../../types";
import { SectionLabel } from "../ui/SectionLabel";

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

export function AddTodoSection({
  addTab, setAddTab, newRows, setNewRows, addNR, saveNRs, saveOneNR, isNREmpty,
  aProj, members, pris, setNotePopup, setNrDatePop, aiText, setAiText,
  aiFiles, setAiFiles, aiLoad, aiSt, setAiSt, aiParsed, setAiParsed, parseAI, confirmAI,
  priC, priBg, currentUser
}: AddTodoSectionProps) {
  const addSecRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [bulkOpen, setBulkOpen] = useState<string|null>(null);
  const applyBulk = (field: string, value: string) => { setAiParsed((p: any[]) => p.map((t: any) => t._chk ? {...t, [field]: value} : t)); setBulkOpen(null); };
  useEffect(() => { if (!bulkOpen) return; const close = () => setBulkOpen(null); document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, [bulkOpen]);

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

  return (
    <div ref={addSecRef} style={{overflow:"hidden"}}>
    <SectionLabel num="01" title="업무 추가" sub="직접 입력 또는 AI 자동 생성"/>
    <div style={{...S.card,padding:0,marginBottom:10,overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:collapsed?"none":"2px solid #e2e8f0"}}>
        <button onClick={()=>{if(addTab==="manual"){if(collapsed){setCollapsed(false);setNewRows((r:NewRow[])=>r.length?r:[{pid:"",task:"",who:currentUser||"",due:"",pri:"보통",det:"",repeat:"없음"}]);}else{setCollapsed(true);}}else{setAddTab("manual");setCollapsed(false);setNewRows((r:NewRow[])=>r.length?r:[{pid:"",task:"",who:currentUser||"",due:"",pri:"보통",det:"",repeat:"없음"}]);}}} style={{flex:1,padding:"11px 0",fontSize:12,fontWeight:addTab==="manual"?700:500,color:addTab==="manual"?"#2563eb":"#64748b",background:addTab==="manual"&&!collapsed?"#eff6ff":"#f8fafc",border:"none",borderBottom:addTab==="manual"&&!collapsed?"2px solid #2563eb":"2px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:-2}}>＋ 직접 입력 {addTab==="manual"&&<span style={{fontSize:9,opacity:.6}}>{collapsed?"▼":"▲"}</span>}</button>
        <button onClick={()=>{if(addTab==="ai"){setCollapsed(p=>!p);}else{setAddTab("ai");setCollapsed(false);setNewRows([]);}}} style={{flex:1,padding:"11px 0",fontSize:12,fontWeight:addTab==="ai"?700:500,color:addTab==="ai"?"#7c3aed":"#64748b",background:addTab==="ai"&&!collapsed?"#f5f3ff":"#f8fafc",border:"none",borderBottom:addTab==="ai"&&!collapsed?"2px solid #7c3aed":"2px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:-2}}>🤖 AI 자동 입력 {addTab==="ai"&&<span style={{fontSize:9,opacity:.6}}>{collapsed?"▼":"▲"}</span>}</button>
      </div>
      {!collapsed&&addTab==="manual"&&<div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:newRows.length?10:0}}>
          <button onClick={addNR} style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"7px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:15,lineHeight:1}}>＋</span> 행 추가</button>
          {newRows.length>0&&<><button style={{...S.bp,fontSize:11,padding:"6px 14px"}} onClick={saveNRs}>💾 {newRows.length}개 저장</button><button style={{...S.bs,fontSize:11,padding:"6px 12px"}} onClick={()=>setNewRows([])}>✕ 전체 취소</button></>}
        </div>
        {newRows.length>0&&<div style={{border:"1.5px solid #c7d8f0",borderRadius:8,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
            <colgroup><col style={{width:120}}/><col style={{width:240}}/><col/><col style={{width:70}}/><col style={{width:110}}/><col style={{width:56}}/><col style={{width:70}}/><col style={{width:44}}/></colgroup>
            <thead><tr style={{background:"#f0f7ff",borderBottom:"1px solid #c7d8f0"}}>{["프로젝트","업무내용","상세내용","담당자","마감일","우선순위","반복",""].map((h,i)=><th key={i} style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#64748b",textAlign:"left"}}>{h}</th>)}</tr></thead>
            <tbody>
              {newRows.map((r,i)=>{const empty=isNREmpty(r);return <tr key={"nr"+i} style={{background:i%2===0?"#eef4ff":"#e8f0fe",borderBottom:i===newRows.length-1?"none":"1px solid #c7d8f0"}}>
                <td style={{padding:"5px 6px"}}><select value={r.pid} onChange={e=>{const n=[...newRows];n[i].pid=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 3px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}><option value="">프로젝트</option>{aProj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                <td style={{padding:"5px 6px"}}><input value={r.task} onChange={e=>{const n=[...newRows];n[i].task=e.target.value;setNewRows(n)}} onKeyDown={e=>{if(e.key==="Enter"){if(!isNREmpty(newRows[i]))saveOneNR(i);else addNR()}}} placeholder="업무 내용" autoFocus={i===newRows.length-1} style={{width:"100%",padding:"5px 8px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:11,outline:"none",background:"#fff",fontWeight:600}}/></td>
                <td style={{padding:"5px 6px"}}>
                  <div onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setNotePopup({todo:{id:`__nr_${i}`,task:r.task||"새 업무",det:r.det||""},x:rect.left,y:rect.bottom,_newRow:i});}}
                    style={{width:"100%",padding:"5px 6px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,cursor:"text",color:r.det?stripHtml(r.det)?"#334155":"#94a3b8":"#94a3b8",minHeight:28,display:"flex",alignItems:"center",background:"#fff"}}>
                    {r.det&&stripHtml(r.det)?stripHtml(r.det).slice(0,20)+(stripHtml(r.det).length>20?"…":""):<span style={{color:"#bfcfe8"}}>상세내용 추가...</span>}
                  </div>
                </td>
                <td style={{padding:"5px 6px"}}><select value={r.who} onChange={e=>{const n=[...newRows];n[i].who=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 3px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}><option value="">담당자</option>{members.map(m=><option key={m}>{m}</option>)}</select></td>
                <td style={{padding:"5px 6px"}}><div onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setNrDatePop({id:i,rect,value:r.due||"" });}} style={{width:"100%",padding:"4px 6px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",cursor:"pointer",color:r.due?"#334155":"#94a3b8",whiteSpace:"nowrap"}}>{r.due?fD(r.due):"날짜 선택"}</div></td>
                <td style={{padding:"5px 6px"}}><select value={r.pri} onChange={e=>{const n=[...newRows];n[i].pri=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 2px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}>{pris.map(p=><option key={p}>{p}</option>)}</select></td>
                <td style={{padding:"5px 6px"}}><select value={r.repeat||"없음"} onChange={e=>{const n=[...newRows];n[i].repeat=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 2px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}>{REPEAT_OPTS.map(p=><option key={p}>{p}</option>)}</select></td>
                <td style={{padding:"5px 4px",textAlign:"center"}}>
                  <button onClick={()=>saveOneNR(i)} disabled={empty} style={{background:empty?"#f1f5f9":"#2563eb",border:"none",color:empty?"#cbd5e1":"#fff",cursor:empty?"default":"pointer",fontSize:10,fontWeight:700,borderRadius:5,padding:"4px 5px",marginRight:2}}>✓</button>
                  <button onClick={()=>setNewRows((r: NewRow[])=>r.filter((_,j)=>j!==i))} style={{background:"#fee2e2",border:"none",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700,borderRadius:5,padding:"4px 5px"}}>✕</button>
                </td>
              </tr>})}
            </tbody>
          </table>
        </div>}
      </div>}
      {!collapsed&&addTab==="ai"&&<div style={{padding:"14px 16px"}}>
        <p style={{fontSize:11,color:"#64748b",margin:"0 0 10px"}}>자유롭게 업무를 입력하거나 파일·이미지를 첨부하면 AI가 자동으로 TODO를 생성합니다.<br/>담당자는 @이름, 마감일은 "4월 10일", 반복은 "매일/매주/매월"처럼 입력하세요.</p>

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
          <span style={{fontSize:20}}>📎</span>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:dragOver?"#7c3aed":"#6d28d9"}}>파일·이미지 첨부</div>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>이미지, PDF, 텍스트 파일 · 드래그 또는 클릭</div>
          </div>
          {aiFiles.length>0&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:"#7c3aed",background:"#ede9fe",borderRadius:99,padding:"2px 8px"}}>{aiFiles.length}개 첨부됨</span>}
        </div>

        {/* 첨부 파일 목록 */}
        {aiFiles.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
          {aiFiles.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:8,padding:"4px 8px",maxWidth:200}}>
              {f.type.startsWith("image/")?
                <img src={`data:${f.type};base64,${f.data}`} style={{width:32,height:32,objectFit:"cover",borderRadius:4,flexShrink:0}}/>:
                <span style={{fontSize:20,flexShrink:0}}>{f.type==="application/pdf"?"📄":"📝"}</span>}
              <span style={{fontSize:10,color:"#4c1d95",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{f.name}</span>
              <button onClick={e=>{e.stopPropagation();setAiFiles((p:AiFile[])=>p.filter((_,j)=>j!==i));}}
                style={{background:"none",border:"none",cursor:"pointer",color:"#a78bfa",fontSize:13,padding:0,lineHeight:1,flexShrink:0}}>✕</button>
            </div>
          ))}
        </div>}

        <textarea value={aiText} onChange={e=>setAiText(e.target.value)} rows={3} placeholder={"예시:\n1. 일일 바이어 문의 확인 @박정찬 매일\n2. 주간 진행상황 공유 @김대윤 매주 월요일\n3. 중국 시안 확인 @김현지 4월 5일 긴급"} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #ddd6fe",borderRadius:8,fontSize:12,outline:"none",resize:"vertical",lineHeight:1.7,boxSizing:"border-box" as const,background:"#fdfcff"}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
          <button style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",opacity:aiLoad?.6:1}} onClick={parseAI} disabled={aiLoad}>{aiLoad?"⏳ 분석 중...":"🤖 TODO 자동 생성"}</button>
          {aiSt&&<span style={{fontSize:11,fontWeight:600,color:aiSt.startsWith("ok:")?"#16a34a":"#dc2626"}}>{aiSt.startsWith("ok:")||aiSt.startsWith("err:")?aiSt.slice(aiSt.indexOf(":")+1):aiSt}</span>}
          {(aiText||aiFiles.length>0)&&<button style={{...S.bs,fontSize:10,marginLeft:"auto"}} onClick={()=>{setAiText("");setAiSt("");setAiParsed([]);setAiFiles([]);}}>초기화</button>}
        </div>
        {aiParsed.length>0&&<div style={{marginTop:12,border:"1.5px solid #ddd6fe",borderRadius:10,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",background:"#f5f3ff",borderBottom:"1px solid #ddd6fe",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <input type="checkbox" checked={aiParsed.every(t=>t._chk)}
                ref={el=>{if(el)el.indeterminate=aiParsed.some(t=>t._chk)&&!aiParsed.every(t=>t._chk);}}
                onChange={e=>setAiParsed((p: any[])=>p.map(t=>({...t,_chk:e.target.checked})))}
                style={{cursor:"pointer",accentColor:"#7c3aed",width:13,height:13}}/>
              <span style={{fontSize:12,fontWeight:700,color:"#7c3aed"}}>✨ {aiParsed.filter(t=>t._chk).length} / {aiParsed.length}건 선택됨</span>
              <div style={{display:"flex",gap:4}} onMouseDown={e=>e.stopPropagation()}>
                {([
                  {key:"project",icon:"📁",label:"프로젝트",opts:aProj.map(p=>({label:p.name,value:p.name}))},
                  {key:"assignee",icon:"👤",label:"담당자",opts:members.map(m=>({label:m,value:m}))},
                  {key:"priority",icon:"⚡",label:"우선순위",opts:pris.map(p=>({label:p,value:p}))},
                  {key:"repeat",icon:"🔁",label:"반복",opts:["없음","매일","매주","매월"].map(r=>({label:r,value:r}))},
                ] as {key:string,icon:string,label:string,opts:{label:string,value:string}[]}[]).map(({key,icon,label,opts})=>(
                  <div key={key} style={{position:"relative"}}>
                    <button title={`${label} 일괄배정`} onMouseDown={e=>{e.stopPropagation();setBulkOpen(bulkOpen===key?null:key);}}
                      style={{background:bulkOpen===key?"#ddd6fe":"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:12,color:"#7c3aed",transition:"background .1s"}}>
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
                <div style={{position:"relative"}}>
                  <button title="마감일 일괄배정" onMouseDown={e=>{e.stopPropagation();setBulkOpen(bulkOpen==="due"?null:"due");}}
                    style={{background:bulkOpen==="due"?"#ddd6fe":"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:12,color:"#7c3aed",transition:"background .1s"}}>
                    📅
                  </button>
                  {bulkOpen==="due"&&<div onMouseDown={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:200,background:"#fff",border:"1px solid #ddd6fe",borderRadius:8,boxShadow:"0 6px 20px rgba(124,58,237,.15)",padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginBottom:6}}>마감일 일괄배정</div>
                    <input type="date" autoFocus onMouseDown={e=>e.stopPropagation()} onChange={e=>{if(e.target.value)applyBulk("due",e.target.value);}}
                      style={{padding:"4px 8px",border:"1px solid #ddd6fe",borderRadius:6,fontSize:12,outline:"none",color:"#4c1d95"}}/>
                  </div>}
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
              const selStyle={padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:600,cursor:"pointer",outline:"none",appearance:"none" as const,WebkitAppearance:"none" as const,border:"1px solid"} as const;
              return <div key={i} style={{padding:"11px 14px",borderBottom:"1px solid #f3f0ff",display:"flex",gap:10,alignItems:"flex-start",background:t._chk?(i%2===0?"#fff":"#fdfcff"):"#f8f9fb",opacity:t._chk?1:0.45,transition:"opacity .15s",borderLeft:`3px solid ${t._chk?pc:"#e2e8f0"}`}}>
                <input type="checkbox" checked={t._chk} style={{marginTop:3,cursor:"pointer",flexShrink:0,accentColor:"#7c3aed",width:13,height:13}}
                  onChange={e=>{const n=[...aiParsed];n[i]._chk=e.target.checked;setAiParsed(n);}}/>
                <div style={{flex:1,minWidth:0}}>
                  <input value={t.task} onChange={e=>{const n=[...aiParsed];n[i].task=e.target.value;setAiParsed(n);}}
                    style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:13,fontWeight:600,padding:"1px 0",outline:"none",background:"transparent",color:"#0f172a",transition:"border-color .15s",boxSizing:"border-box" as const}}
                    onFocus={e=>(e.target.style.borderBottomColor="#7c3aed")}
                    onBlur={e=>(e.target.style.borderBottomColor="transparent")}/>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap" as const,marginTop:7,alignItems:"center"}}>
                    <select value={mp?.id||""} onChange={e=>{const n=[...aiParsed];n[i].project=aProj.find(p=>p.id===parseInt(e.target.value))?.name||"";setAiParsed(n);}}
                      style={{...selStyle,borderColor:pc+"55",background:pc+"18",color:pc}}>
                      <option value="">📁 미배정</option>
                      {aProj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={members.find(m=>m===t.assignee)||t.assignee||""} onChange={e=>{const n=[...aiParsed];n[i].assignee=e.target.value;setAiParsed(n);}}
                      style={{...selStyle,borderColor:"#e2e8f0",background:"#f1f5f9",color:"#475569"}}>
                      <option value="">👤 미배정</option>
                      {members.map(m=><option key={m}>{m}</option>)}
                    </select>
                    <input type="date" value={t.due||""} onChange={e=>{const n=[...aiParsed];n[i].due=e.target.value;setAiParsed(n);}}
                      style={{padding:"2px 7px",border:"1px solid #e2e8f0",borderRadius:99,fontSize:10,background:"#f1f5f9",color:t.due?"#334155":"#94a3b8",outline:"none",cursor:"pointer"}}/>
                    <select value={t.priority||"보통"} onChange={e=>{const n=[...aiParsed];n[i].priority=e.target.value;setAiParsed(n);}}
                      style={{...selStyle,borderColor:prc+"55",background:prBg,color:prc}}>
                      {pris.map(p=><option key={p}>{p}</option>)}
                    </select>
                    <select value={t.repeat||"없음"} onChange={e=>{const n=[...aiParsed];n[i].repeat=e.target.value;setAiParsed(n);}}
                      style={{...selStyle,borderColor:"#e2e8f0",background:"#f1f5f9",color:t.repeat&&t.repeat!=="없음"?"#7c3aed":"#94a3b8"}}>
                      {REPEAT_OPTS.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <input value={t.detail||""} onChange={e=>{const n=[...aiParsed];n[i].detail=e.target.value;setAiParsed(n);}} placeholder="💬 상세내용 입력..."
                    style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:10,padding:"3px 0",marginTop:5,outline:"none",background:"transparent",color:"#64748b",boxSizing:"border-box" as const,transition:"border-color .15s"}}
                    onFocus={e=>(e.target.style.borderBottomColor="#7c3aed")}
                    onBlur={e=>(e.target.style.borderBottomColor="transparent")}/>
                </div>
                <button onClick={()=>setAiParsed((p: any[])=>p.filter((_,j)=>j!==i))}
                  style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:15,padding:"2px 3px",flexShrink:0,lineHeight:1,marginTop:1,transition:"color .12s"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#dc2626"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="#cbd5e1"}>✕</button>
              </div>;
            })}
          </div>
        </div>}
      </div>}
    </div>
    </div>
  );
}
