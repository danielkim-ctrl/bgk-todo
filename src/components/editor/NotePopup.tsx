import { useRef, useEffect, useState } from "react";

export function NotePopup({todo, x, y, onSave, onClose}: {
  todo: any;
  x: number;
  y: number;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const wrapRef=useRef<HTMLDivElement>(null);
  const ref=useRef<HTMLDivElement>(null);
  const onSaveRef=useRef(onSave);
  onSaveRef.current=onSave;
  const [size,setSize]=useState({w:460,h:300});
  const dragRef=useRef<{startX:number,startY:number,startW:number,startH:number}|null>(null);

  useEffect(()=>{
    if(ref.current){ref.current.innerHTML=todo.det||"";ref.current.focus();}
    const onDown=(e: MouseEvent)=>{if(wrapRef.current&&!wrapRef.current.contains(e.target as Node))onClose();};
    const onKey=(e: KeyboardEvent)=>{if(e.key==="Escape")onClose();};
    const onScroll=()=>onClose();
    setTimeout(()=>document.addEventListener("mousedown",onDown),0);
    document.addEventListener("keydown",onKey);
    window.addEventListener("scroll",onScroll,true);
    return()=>{
      if(ref.current)onSaveRef.current(ref.current.innerHTML);
      document.removeEventListener("mousedown",onDown);
      document.removeEventListener("keydown",onKey);
      window.removeEventListener("scroll",onScroll,true);
    };
  },[]);

  useEffect(()=>{
    const onMove=(e: MouseEvent)=>{
      if(!dragRef.current)return;
      const dw=e.clientX-dragRef.current.startX;
      const dh=e.clientY-dragRef.current.startY;
      setSize({w:Math.max(300,dragRef.current.startW+dw),h:Math.max(200,dragRef.current.startH+dh)});
    };
    const onUp=()=>{dragRef.current=null;};
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
    return()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
  },[]);

  const cmd=(c: string)=>{ref.current!.focus();document.execCommand(c,false,null!);};
  const zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const ax=x/zoom, ay=y/zoom;
  const vw=window.innerWidth/zoom, vh=window.innerHeight/zoom;
  const left=Math.min(Math.max(8,ax),vw-size.w-8);
  const top=(vh-ay<size.h+8)?ay-size.h:ay+6;
  const tools=[
    {label:"B",c:"bold",s:{fontWeight:800},title:"굵게"},
    {label:"I",c:"italic",s:{fontStyle:"italic"},title:"기울임"},
    {label:"U",c:"underline",s:{textDecoration:"underline"},title:"밑줄"},
    {label:"S",c:"strikeThrough",s:{textDecoration:"line-through"},title:"취소선"},
    {label:"•",c:"insertUnorderedList",title:"글머리 기호"},
    {label:"1.",c:"insertOrderedList",title:"번호 목록"},
  ];
  const editorH=size.h-82;
  return <div ref={wrapRef}
    style={{position:"fixed",left,top,width:size.w,height:size.h,zIndex:3000,
      background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,
      boxShadow:"0 8px 32px rgba(0,0,0,.14)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:"#2563eb",flexShrink:0,display:"inline-block"}}/>
      <span style={{fontSize:12,fontWeight:700,color:"#1e3a8a",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{todo.task}</span>
      <button onMouseDown={e=>{e.preventDefault();onClose();}}
        style={{width:22,height:22,borderRadius:"50%",border:"none",background:"#e2e8f0",cursor:"pointer",fontSize:11,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>✕</button>
    </div>
    <div style={{display:"flex",gap:2,padding:"6px 10px",borderBottom:"1px solid #f1f5f9",alignItems:"center",background:"#fff",flexShrink:0}}>
      {tools.map(t=><button key={t.c} title={t.title} onMouseDown={e=>{e.preventDefault();cmd(t.c);}}
        style={{padding:"3px 9px",border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",
          fontSize:11,borderRadius:6,fontFamily:"inherit",color:"#334155",transition:"all .12s",...(t.s||{})}}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#eff6ff";(e.currentTarget as HTMLButtonElement).style.borderColor="#93c5fd";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="#f8fafc";(e.currentTarget as HTMLButtonElement).style.borderColor="#e2e8f0";}}
      >{t.label}</button>)}
    </div>
    <div ref={ref} contentEditable suppressContentEditableWarning
      onInput={()=>onSaveRef.current(ref.current!.innerHTML)}
      style={{height:editorH,overflowY:"auto",padding:"12px 14px",
        fontSize:13,lineHeight:1.75,outline:"none",color:"#1e293b",
        fontFamily:"'Pretendard',system-ui,sans-serif",flex:1}}/>
    <div onMouseDown={e=>{e.preventDefault();e.stopPropagation();dragRef.current={startX:e.clientX,startY:e.clientY,startW:size.w,startH:size.h};}}
      style={{position:"absolute",right:0,bottom:0,width:18,height:18,cursor:"nwse-resize",display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:"3px",zIndex:1}}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M9 1L1 9M9 5L5 9M9 9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  </div>;
}
