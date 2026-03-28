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
  // 키보드 포커스 인덱스 (-1 = 없음)
  const [focusIdx, setFocusIdx] = useState(() => items.findIndex(it => it.value === current));
  const panelRef = useRef<HTMLDivElement>(null);

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

  // 패널 열리면 포커스 이동
  useEffect(()=>{
    if(pos) panelRef.current?.focus();
  }, [pos]);

  // 마우스 바깥 클릭 시 닫기
  useEffect(()=>{
    const handler = (e: MouseEvent) => { if(!(e.target as HTMLElement).closest('[data-droppanel]')) onClose(); };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  // 키보드 이벤트: Arrow↑↓로 이동, Enter로 선택, Escape로 닫기
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusIdx >= 0 && focusIdx < items.length) onSelect(items[focusIdx].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return <>
    <span ref={anchorRef}/>
    {pos && createPortal(
      <div
        ref={panelRef}
        data-droppanel
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9999,background:"#fff",borderRadius:6,boxShadow:"0 4px 12px rgba(0,0,0,.1)",border:"1px solid #e2e8f0",padding:4,minWidth:130,maxHeight:220,overflowY:"auto",outline:"none"}}>
        {items.map((it,i)=>(
          <div key={i}
            onClick={()=>onSelect(it.value)}
            onMouseEnter={()=>setFocusIdx(i)}
            style={{padding:"5px 8px",borderRadius:4,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5,
              background:focusIdx===i?"#eff6ff":current===it.value?"#f0fdf4":"#fff",
              fontWeight:current===it.value?600:400,
              outline:focusIdx===i?"1px solid #bfdbfe":"none"}}>
            {renderItem?renderItem(it):<span>{it.label}</span>}
          </div>
        ))}
        <div onClick={onClose} style={{padding:"4px 8px",fontSize:10,color:"#94a3b8",cursor:"pointer",borderTop:"1px solid #f1f5f9",marginTop:2}}>닫기</div>
      </div>,
      document.body
    )}
  </>;
}
