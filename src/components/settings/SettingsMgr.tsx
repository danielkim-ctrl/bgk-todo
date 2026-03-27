import { useState } from "react";
import { S } from "../../styles";

export function SettingsMgr({members,setMembers,pris,setPris,stats,setStats,priC,setPriC,priBg,setPriBg,stC,setStC,stBg,setStBg,todos,flash,apiKey,setApiKey}: {
  members: string[];
  setMembers: (fn: any) => void;
  pris: string[];
  setPris: (fn: any) => void;
  stats: string[];
  setStats: (fn: any) => void;
  priC: Record<string,string>;
  setPriC: (fn: any) => void;
  priBg: Record<string,string>;
  setPriBg: (fn: any) => void;
  stC: Record<string,string>;
  setStC: (fn: any) => void;
  stBg: Record<string,string>;
  setStBg: (fn: any) => void;
  todos: any[];
  flash: (m: string, t?: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
}) {
  const [tab,setTab]=useState("members");
  const [nv,setNv]=useState("");const [nc,setNc]=useState("#8b5cf6");
  const [delConfirm,setDelConfirm]=useState<{value:string,tab:string}|null>(null);
  const [keyDraft,setKeyDraft]=useState(apiKey||"");
  const tS=(a: boolean)=>({padding:"8px 14px",fontSize:12,fontWeight:a?600:500,color:a?"#2563eb":"#64748b",background:a?"#eff6ff":"transparent",border:"none",borderBottom:a?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"});
  const items=tab==="members"?members:tab==="pris"?pris:stats;
  const add=()=>{if(!nv.trim())return;const v=nv.trim();
    if(tab==="members"){if(!members.includes(v))setMembers((p: string[])=>[...p,v]);flash(`담당자 "${v}"이(가) 추가되었습니다`);}
    else if(tab==="pris"){if(!pris.includes(v)){setPris((p: string[])=>[...p,v]);setPriC((p: any)=>({...p,[v]:nc}));setPriBg((p: any)=>({...p,[v]:nc+"18"}));}flash(`우선순위 "${v}"이(가) 추가되었습니다`);}
    else{if(!stats.includes(v)){setStats((p: string[])=>[...p,v]);setStC((p: any)=>({...p,[v]:nc}));setStBg((p: any)=>({...p,[v]:nc+"18"}));}flash(`상태 "${v}"이(가) 추가되었습니다`);}
    setNv("")};
  const edit=(old: string)=>{const n=prompt("이름:",old);if(!n||!n.trim()||n.trim()===old)return;const v=n.trim();
    if(tab==="members")setMembers((p: string[])=>p.map((m: string)=>m===old?v:m));
    else if(tab==="pris"){setPris((p: string[])=>p.map((x: string)=>x===old?v:x));setPriC((p: any)=>{const c={...p};c[v]=c[old];delete c[old];return c});setPriBg((p: any)=>{const c={...p};c[v]=c[old];delete c[old];return c});}
    else{setStats((p: string[])=>p.map((x: string)=>x===old?v:x));setStC((p: any)=>{const c={...p};c[v]=c[old];delete c[old];return c});setStBg((p: any)=>{const c={...p};c[v]=c[old];delete c[old];return c});}
    flash(`변경사항이 저장되었습니다`)};
  const tryDel=(v: string)=>{const cnt=tab==="members"?todos.filter((t:any)=>t.who===v).length:tab==="pris"?todos.filter((t:any)=>t.pri===v).length:todos.filter((t:any)=>t.st===v).length;
    if(cnt){flash(`해당 항목을 사용 중인 업무가 ${cnt}건 있어 삭제할 수 없습니다`,"err");return;}setDelConfirm({value:v,tab});};
  const doDel=()=>{if(!delConfirm)return;const v=delConfirm.value;
    if(delConfirm.tab==="members")setMembers((p: string[])=>p.filter((m: string)=>m!==v));
    else if(delConfirm.tab==="pris"){setPris((p: string[])=>p.filter((x: string)=>x!==v));setPriC((p: any)=>{const c={...p};delete c[v];return c});setPriBg((p: any)=>{const c={...p};delete c[v];return c});}
    else{setStats((p: string[])=>p.filter((x: string)=>x!==v));setStC((p: any)=>{const c={...p};delete c[v];return c});setStBg((p: any)=>{const c={...p};delete c[v];return c});}
    flash(`"${v}"이(가) 삭제되었습니다`,"err");setDelConfirm(null);};
  const chgColor=(v: string,c: string)=>{if(tab==="pris"){setPriC((p: any)=>({...p,[v]:c}));setPriBg((p: any)=>({...p,[v]:c+"18"}));}else{setStC((p: any)=>({...p,[v]:c}));setStBg((p: any)=>({...p,[v]:c+"18"}));}};
  return <div>
    <div style={{display:"flex",borderBottom:"1px solid #e2e8f0",marginBottom:14,flexWrap:"wrap" as const}}>
      <button style={tS(tab==="members")} onClick={()=>setTab("members")}>👤 담당자 ({members.length})</button>
      <button style={tS(tab==="pris")} onClick={()=>setTab("pris")}>🔥 우선순위 ({pris.length})</button>
      <button style={tS(tab==="stats")} onClick={()=>setTab("stats")}>📋 상태 ({stats.length})</button>
      <button style={tS(tab==="apikey")} onClick={()=>setTab("apikey")}>🔑 API 키</button>
    </div>
    {tab==="apikey"&&<div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>Anthropic API 키를 입력하세요. 브라우저 로컬에 저장됩니다.</div>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input type="password" value={keyDraft} onChange={e=>setKeyDraft(e.target.value)}
          placeholder="sk-ant-..." style={{flex:1,padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={()=>{const k=keyDraft.trim();localStorage.setItem("team-todo-apikey",k);setApiKey(k);flash("API 키가 저장되었습니다");}}
          style={{padding:"8px 14px",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>저장</button>
      </div>
      {apiKey&&<div style={{fontSize:11,color:"#16a34a",fontWeight:600}}>✅ API 키 설정됨</div>}
    </div>}
    <div style={{marginBottom:14,maxHeight:300,overflowY:"auto"}}>
      {items.map(v=>{const cnt=tab==="members"?todos.filter((t:any)=>t.who===v).length:tab==="pris"?todos.filter((t:any)=>t.pri===v).length:todos.filter((t:any)=>t.st===v).length;
        const color=tab==="members"?undefined:tab==="pris"?(priC[v]||"#94a3b8"):(stC[v]||"#94a3b8");
        return <div key={v} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f8fafc",borderRadius:7,border:"1px solid #e2e8f0",fontSize:12,marginBottom:4}}>
          {color!==undefined?<input type="color" value={color} onChange={e=>chgColor(v,e.target.value)} style={{width:20,height:20,padding:0,border:"1px solid #e2e8f0",borderRadius:4,cursor:"pointer"}}/>:<span style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{v[0]}</span>}
          <span style={{flex:1,fontWeight:600}}>{v}</span><span style={{fontSize:10,color:"#94a3b8"}}>{cnt}건</span>
          <button onClick={()=>edit(v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>✏️</button>
          <button onClick={()=>tryDel(v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>🗑️</button>
        </div>})}
    </div>
    {delConfirm&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:12,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:12,color:"#dc2626",fontWeight:600}}>"{delConfirm.value}" 삭제할까요?</span>
      <div style={{display:"flex",gap:4}}><button onClick={doDel} style={{background:"#fef2f2",color:"#dc2626",border:"none",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}}>삭제</button><button onClick={()=>setDelConfirm(null)} style={{background:"#f1f5f9",color:"#334155",border:"none",padding:"4px 10px",borderRadius:8,fontSize:11,cursor:"pointer"}}>취소</button></div>
    </div>}
    <div style={{borderTop:"1px solid #e2e8f0",paddingTop:12}}>
      {(tab==="members"||tab==="pris"||tab==="stats")&&<>
        <div style={{fontSize:11,fontWeight:600,marginBottom:6}}>{tab==="members"?"새 담당자":tab==="pris"?"새 우선순위":"새 상태"} 추가</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {tab!=="members"&&<input type="color" value={nc} onChange={e=>setNc(e.target.value)} style={{width:34,height:30,borderRadius:6,cursor:"pointer",border:"1px solid #e2e8f0"}}/>}
          <input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}} placeholder={tab==="members"?"이름":"항목명"} style={{flex:1,padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
          <button style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={add}>추가</button>
        </div>
      </>}
    </div>
  </div>;
}
