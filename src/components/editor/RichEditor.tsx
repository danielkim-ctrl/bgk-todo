import { useRef, useEffect } from "react";

export function RichEditor({value, onChange}: {value: string, onChange: (v: string) => void}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInit = useRef(false);
  useEffect(()=>{
    if(ref.current && !isInit.current){ ref.current.innerHTML = value||""; isInit.current=true; }
  },[]);
  const cmd=(command: string,val: string|null=null)=>{ ref.current!.focus(); document.execCommand(command,false,val!); onChange(ref.current!.innerHTML); };
  const colors=["#dc2626","#d97706","#16a34a","#2563eb","#7c3aed","#0f172a","#64748b"];
  const tools=[
    {label:"B",c:"bold",s:{fontWeight:700},t:"굵게"},
    {label:"I",c:"italic",s:{fontStyle:"italic"},t:"기울임"},
    {label:"U",c:"underline",s:{textDecoration:"underline"},t:"밑줄"},
    {label:"S",c:"strikeThrough",s:{textDecoration:"line-through"},t:"취소선"},
    {label:"•",c:"insertUnorderedList",t:"글머리 목록"},
    {label:"1.",c:"insertOrderedList",t:"번호 목록"},
  ];
  return <div style={{border:"1.5px solid #e2e8f0",borderRadius:8,overflow:"hidden",background:"#fff"}}>
    <div style={{display:"flex",gap:2,flexWrap:"wrap",padding:"5px 8px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",alignItems:"center"}}>
      {tools.map(t=><button key={t.c} title={t.t} onMouseDown={e=>{e.preventDefault();cmd(t.c);}}
        style={{padding:"3px 7px",borderRadius:5,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:11,...(t.s||{}),fontFamily:"inherit"}}>{t.label}</button>)}
      <div style={{width:1,height:16,background:"#e2e8f0",margin:"0 2px"}}/>
      <div style={{position:"relative",display:"inline-flex"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#334155",marginRight:2,lineHeight:1}}>A</span>
        <div style={{display:"flex",gap:2,alignItems:"center"}}>
          {colors.map(c=><button key={c} title={`글자색`} onMouseDown={e=>{e.preventDefault();cmd("foreColor",c);}}
            style={{width:13,height:13,borderRadius:"50%",background:c,border:"1.5px solid #fff",outline:"1px solid #e2e8f0",cursor:"pointer",flexShrink:0}}/>)}
        </div>
      </div>
      <div style={{width:1,height:16,background:"#e2e8f0",margin:"0 2px"}}/>
      <button title="서식 제거" onMouseDown={e=>{e.preventDefault();cmd("removeFormat");}}
        style={{padding:"2px 6px",borderRadius:5,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:10,color:"#94a3b8"}}>✕서식</button>
    </div>
    <div ref={ref} contentEditable suppressContentEditableWarning onInput={()=>onChange(ref.current!.innerHTML)}
      style={{minHeight:140,maxHeight:280,overflowY:"auto",padding:"10px 12px",fontSize:13,lineHeight:1.7,outline:"none",fontFamily:"'Pretendard',system-ui,sans-serif",color:"#1a2332"}}/>
  </div>;
}
