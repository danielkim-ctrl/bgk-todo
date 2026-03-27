import { useState } from "react";
import { PROJ_PALETTE } from "../../constants";
import { S } from "../../styles";
import { Project } from "../../types";

export function ProjMgr({projects,todos,onAdd,onDel,onEdit}: {
  projects: Project[];
  todos: any[];
  onAdd: (p: Omit<Project,"id">) => void;
  onDel: (id: number) => void;
  onEdit: (id: number, u: Partial<Project>) => void;
}) {
  const usedColors=projects.map(p=>p.color);
  const nextColor=PROJ_PALETTE.find(c=>!usedColors.includes(c))||PROJ_PALETTE[0];
  const [nm,setNm]=useState("");
  const [co,setCo]=useState(nextColor);
  return <>
    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
      {projects.map(p=>{const c=todos.filter((t:any)=>t.pid===p.id).length;return <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:"#f8fafc",borderRadius:7,border:"1px solid #e2e8f0",fontSize:12}}>
        <input type="color" value={p.color} onChange={e=>onEdit(p.id,{color:e.target.value})} title="색상 변경" style={{width:20,height:20,padding:0,border:"1px solid #e2e8f0",borderRadius:4,cursor:"pointer",flexShrink:0}}/>
        <div style={{flex:1,fontWeight:600}}>{p.name}</div>
        <span style={{fontSize:10,color:"#94a3b8"}}>{c}건</span>
        <button onClick={()=>{const n=prompt("이름:",p.name);if(n)onEdit(p.id,{name:n.trim()})}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>✏️</button>
        <button onClick={()=>{if(window.confirm("해당 프로젝트를 삭제하시겠습니까?"))onDel(p.id)}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>🗑️</button>
      </div>})}
    </div>
    <div style={{borderTop:"1px solid #e2e8f0",paddingTop:10}}><div style={{fontSize:11,fontWeight:600,marginBottom:5}}>새 프로젝트</div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}><input type="color" value={co} onChange={e=>setCo(e.target.value)} style={{width:32,height:28,borderRadius:5,cursor:"pointer",border:"1px solid #e2e8f0"}}/><input value={nm} onChange={e=>setNm(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nm.trim()){onAdd({name:nm.trim(),color:co,status:"활성"});setNm("");const nu=[...usedColors,co];setCo(PROJ_PALETTE.find(c=>!nu.includes(c))||PROJ_PALETTE[0])}}} placeholder="이름" style={{flex:1,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,outline:"none",fontFamily:"inherit"}}/><button style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={()=>{if(!nm.trim())return;onAdd({name:nm.trim(),color:co,status:"활성"});setNm("");const nu=[...usedColors,co];setCo(PROJ_PALETTE.find(c=>!nu.includes(c))||PROJ_PALETTE[0])}}>추가</button></div>
    </div>
  </>;
}
