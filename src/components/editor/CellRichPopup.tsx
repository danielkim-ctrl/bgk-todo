import { useState } from "react";
import { RichEditor } from "./RichEditor";

export function CellRichPopup({todo, onSave, onClose}: {
  todo: any;
  onSave: (html: string) => void;
  onClose: () => void;
}) {
  const [html, setHtml] = useState(todo.det||"");
  return <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.4)",backdropFilter:"blur(3px)"}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:"#fff",borderRadius:12,width:520,boxShadow:"0 10px 30px rgba(0,0,0,.15)",overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#1a2332"}}>📝 상세내용 편집<span style={{fontSize:11,color:"#94a3b8",fontWeight:400,marginLeft:8}}>{todo.task}</span></div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#94a3b8",lineHeight:1}}>✕</button>
      </div>
      <div style={{padding:"12px 16px"}}>
        <RichEditor value={html} onChange={setHtml}/>
      </div>
      <div style={{padding:"10px 16px",borderTop:"1px solid #e2e8f0",display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#334155",border:"none",padding:"7px 14px",borderRadius:8,fontSize:12,cursor:"pointer"}}>취소</button>
        <button onClick={()=>{onSave(html);onClose();}} style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"7px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ 저장</button>
      </div>
    </div>
  </div>;
}
