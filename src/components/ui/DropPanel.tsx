import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// 클릭한 셀 바로 아래에 표시되는 드롭다운
// position:fixed + portal(document.body)로 overflow:auto 스크롤 컨테이너를 탈출
// 위치는 외부에서 anchorRect(클릭 시점 td의 getBoundingClientRect)로 전달받음
export function DropPanel({items,current,onSelect,onClose,renderItem=null,alignRight=false,anchorRect}: {
  items: {value: string, label: string, color?: string}[];
  current: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  renderItem?: ((it: any) => React.ReactNode) | null;
  alignRight?: boolean;
  anchorRect?: {top:number,left:number,bottom:number,right:number};
}) {
  const [focusIdx, setFocusIdx] = useState(() => items.findIndex(it => it.value === current));
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{top:number,left:number}|null>(null);

  // 위치 계산: anchorRect(클릭 시점) 우선, 없으면 DOM에서 측정
  useEffect(()=>{
    let rect: DOMRect|{top:number,left:number,bottom:number,right:number};
    if (anchorRect) {
      rect = anchorRect;
    } else if (anchorRef.current) {
      const td = anchorRef.current.closest('td');
      if (!td) return;
      rect = td.getBoundingClientRect();
    } else return;

    // 브라우저 줌 보정 — getBoundingClientRect()는 줌 적용된 값이지만 position:fixed는 CSS 픽셀 기준
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const r = { top: rect.top / zoom, left: rect.left / zoom, bottom: rect.bottom / zoom, right: rect.right / zoom };
    const vw = window.innerWidth / zoom;
    const vh = window.innerHeight / zoom;

    const panelW = 160;
    const panelH = Math.min(220, items.length * 30 + 36);
    const spaceBelow = vh - r.bottom;
    const top = spaceBelow >= panelH + 4 ? r.bottom + 1 : r.top - panelH - 1;
    const left = alignRight ? r.right - panelW : r.left;
    setPos({
      top: Math.max(4, Math.min(top, vh - panelH - 4)),
      left: Math.max(4, Math.min(left, vw - panelW - 4))
    });
  }, []);

  useEffect(()=>{ if(pos) panelRef.current?.focus(); }, [pos]);

  // 스크롤 발생 시 팝업 닫기 — position:fixed 팝업이 트리거 요소와 분리되는 것을 방지
  // 단, 패널 내부 스크롤(목록 자체 스크롤)은 닫기 제외
  useEffect(()=>{
    const onScroll=(e: Event)=>{
      if(panelRef.current?.contains(e.target as Node))return;
      onClose();
    };
    window.addEventListener("scroll",onScroll,true);
    return()=>window.removeEventListener("scroll",onScroll,true);
  },[onClose]);

  // 바깥 클릭 닫기 — 마운트 직후 무시
  useEffect(()=>{
    let ok = false;
    const t = requestAnimationFrame(() => { ok = true; });
    const handler = (e: MouseEvent) => {
      if(!ok) return;
      if(!(e.target as HTMLElement).closest('[data-droppanel]')) onClose();
    };
    document.addEventListener('mousedown', handler, true);
    return () => { cancelAnimationFrame(t); document.removeEventListener('mousedown', handler, true); };
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (focusIdx >= 0 && focusIdx < items.length) onSelect(items[focusIdx].value); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return <>
    <span ref={anchorRef} style={{position:"absolute",width:0,height:0,overflow:"hidden"}}/>
    {pos && createPortal(
      <div ref={panelRef} data-droppanel tabIndex={-1} onKeyDown={handleKeyDown}
        style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9999,background:"#fff",borderRadius:8,
          boxShadow:"0 4px 16px rgba(0,0,0,.12)",border:"1px solid #e2e8f0",padding:4,
          minWidth:140,maxHeight:220,overflowY:"auto",outline:"none"}}>
        {items.map((it,i)=>(
          <div key={i} onClick={()=>onSelect(it.value)} onMouseEnter={()=>setFocusIdx(i)}
            style={{padding:"6px 10px",borderRadius:6,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",
              background:focusIdx===i?"#eff6ff":current===it.value?"#f0fdf4":"#fff",
              fontWeight:current===it.value?600:400,
              outline:focusIdx===i?"1px solid #bfdbfe":"none"} as React.CSSProperties}>
            {renderItem?renderItem(it):<span>{it.label}</span>}
          </div>
        ))}
        <div onClick={onClose} style={{padding:"5px 10px",fontSize:10,color:"#94a3b8",cursor:"pointer",borderTop:"1px solid #f1f5f9",marginTop:2}}>닫기</div>
      </div>,
      document.body
    )}
  </>;
}
