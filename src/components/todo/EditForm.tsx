import { RichEditor } from "../editor/RichEditor";
import { Project } from "../../types";
import { DocumentTextIcon, ICON_SM } from "../ui/Icons";
import { RepeatPicker } from "../ui/RepeatPicker";

export function EditForm({f,onChange,proj,members,pris,stats}: {
  f: any;
  onChange: (v: any) => void;
  proj: Project[];
  members: string[];
  pris: string[];
  stats: string[];
}) {
  const u=(k: string,v: any)=>onChange({...f,[k]:v});
  return <>
    <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>프로젝트 *</label><select value={f.pid||""} onChange={e=>u("pid",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}><option value="">선택</option>{proj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>업무내용 *</label><input value={f.task||""} onChange={e=>u("task",e.target.value)} maxLength={50} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>담당자 *</label><select value={f.who||""} onChange={e=>u("who",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}><option value="">선택</option>{members.map(m=><option key={m}>{m}</option>)}</select></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>마감기한 *</label><input type="date" value={f.due||""} onChange={e=>u("due",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}/></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>우선순위</label><select value={f.pri||"보통"} onChange={e=>u("pri",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}>{pris.map(p=><option key={p}>{p}</option>)}</select></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>상태</label><select value={f.st||"대기"} onChange={e=>u("st",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}>{stats.map(s=><option key={s}>{s}</option>)}</select></div>
    </div>
    {/* 반복 설정 — RepeatPicker 공통 컴포넌트 사용 */}
    <div style={{marginBottom:12}}>
      <RepeatPicker value={f.repeat||"없음"} onChange={v=>u("repeat",v)} startDate={f.due||""}/>
    </div>
    <div style={{marginBottom:4}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"flex",alignItems:"center",gap:3,marginBottom:6}}><DocumentTextIcon style={ICON_SM}/> 상세내용</label>
      <RichEditor value={f.det||""} onChange={v=>u("det",v)}/>
    </div>
  </>;
}
