import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function DropPanel({items,current,onSelect,onClose,renderItem=null,alignRight=false}: {
  items: {value: string, label: string, color?: string}[];
  current: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  renderItem?: ((it: any) => React.ReactNode) | null;
  alignRight?: boolean;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{top:number,left:number}|null>(null);

  useEffect(()=>{
    if(!anchorRef.current) return;
    const td = anchorRef.current.closest('td');
    if(!td) return;
    const tdRect = td.getBoundingClientRect();
    const badge = anchorRef.current.previousElementSibling as HTMLElement|null;
    const ref = badge ? badge.getBoundingClientRect() : tdRect;
    const panelW = 130;
    const panelH = Math.min(220, items.length * 28 + 36);
    const spaceBelow = window.innerHeight - ref.bottom;
    const top = spaceBelow >= panelH + 4 ? ref.bottom : ref.top - panelH;
    const left = alignRight ? ref.right - panelW : ref.left;
    setPos({ top: Math.max(4, top), left: Math.max(4, Math.min(left, window.innerWidth - panelW - 4)) });
  }, []);

  useEffect(()=>{
    const handler = (e: MouseEvent) => { if(!(e.target as HTMLElement).closest('[data-droppanel]')) onClose(); };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  return <>
    <span ref={anchorRef}/>
    {pos && createPortal(
      <div data-droppanel style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9999,background:"#fff",borderRadius:6,boxShadow:"0 4px 12px rgba(0,0,0,.1)",border:"1px solid #e2e8f0",padding:4,minWidth:130,maxHeight:220,overflowY:"auto"}}>
        {items.map((it,i)=><div key={i} onClick={()=>onSelect(it.value)} style={{padding:"5px 8px",borderRadius:4,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5,background:current===it.value?"#eff6ff":"#fff",fontWeight:current===it.value?600:400}}>{renderItem?renderItem(it):<span>{it.label}</span>}</div>)}
        <div onClick={onClose} style={{padding:"4px 8px",fontSize:10,color:"#94a3b8",cursor:"pointer",borderTop:"1px solid #f1f5f9",marginTop:2}}>닫기</div>
      </div>,
      document.body
    )}
  </>;
}
