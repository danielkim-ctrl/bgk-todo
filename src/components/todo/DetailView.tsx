import { S } from "../../styles";
import { isOD, sanitize } from "../../utils";
import { Project } from "../../types";
import { repeatLabel } from "../../constants";
import { ArrowPathIcon, ExclamationTriangleIcon, DocumentTextIcon, ICON_SM } from "../ui/Icons";

export function DetailView({t,p,stats,stC,stBg,priC,priBg,onSt}: {
  t: any;
  p: Project;
  stats: string[];
  stC: Record<string,string>;
  stBg: Record<string,string>;
  priC: Record<string,string>;
  priBg: Record<string,string>;
  onSt: (st: string) => void;
}) {
  const od=isOD(t.due,t.st);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"#f8fafc",border:"1px solid #e2e8f0"}}><span style={{width:6,height:6,borderRadius:"50%",background:p.color,display:"inline-block"}}/>{p.name}</div>
      <span style={{...S.badge(priBg[t.pri],priC[t.pri])}}>{t.pri}</span>
      <span style={{...S.badge(stBg[t.st],stC[t.st])}}>{t.st}</span>
      {t.repeat&&t.repeat!=="없음"&&<span style={S.repeatBadge}><ArrowPathIcon style={ICON_SM}/> {repeatLabel(t.repeat)}</span>}
      {od&&<span style={{fontSize:10,padding:"1px 5px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600,display:"inline-flex",alignItems:"center",gap:2}}><ExclamationTriangleIcon style={ICON_SM}/>지연</span>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,background:"#f8fafc",padding:10,borderRadius:7,fontSize:12}}>
      <div><div style={{fontSize:10,color:"#94a3b8"}}>담당자</div><b>{t.who}</b></div>
      <div><div style={{fontSize:10,color:"#94a3b8"}}>마감기한</div><b style={{color:od?"#dc2626":"inherit"}}>{t.due}</b></div>
      <div><div style={{fontSize:10,color:"#94a3b8"}}>등록</div>{t.cre||"—"}</div>
      <div><div style={{fontSize:10,color:"#94a3b8"}}>완료</div>{t.done||"—"}</div>
    </div>
    {t.det&&<div>
      <div style={{fontSize:10,fontWeight:600,color:"#64748b",marginBottom:6,display:"flex",alignItems:"center",gap:3}}><DocumentTextIcon style={ICON_SM}/> 상세내용</div>
      <div style={{fontSize:13,lineHeight:1.7,padding:"10px 12px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}
        dangerouslySetInnerHTML={{__html: sanitize(t.det)}}/>
    </div>}
    <div><div style={{fontSize:10,fontWeight:600,color:"#64748b",marginBottom:5}}>상태 변경</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{stats.map(s=><button key={s} onClick={()=>onSt(s)} style={{padding:"4px 10px",borderRadius:99,border:`1.5px solid ${t.st===s?"#2563eb":"#e2e8f0"}`,background:t.st===s?"#eff6ff":"#fff",color:t.st===s?"#2563eb":"#64748b",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>)}</div>
    </div>
  </div>;
}
