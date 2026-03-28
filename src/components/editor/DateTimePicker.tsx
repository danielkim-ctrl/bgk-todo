import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { fmt2, dateStr } from "../../utils";
import { DatePopState } from "../../types";
import { CheckIcon, XMarkIcon } from "../ui/Icons";

export function DateTimePicker({datePop,onSave,onClose}: {
  datePop: DatePopState | null;
  onSave: (id: number, val: string) => void;
  onClose: () => void;
}) {
  const today=new Date();
  const todayStr=`${today.getFullYear()}-${fmt2(today.getMonth()+1)}-${fmt2(today.getDate())}`;
  const [navY,setNavY]=useState(today.getFullYear());
  const [navM,setNavM]=useState(today.getMonth());
  const [selDay,setSelDay]=useState("");
  const [timeStr,setTimeStr]=useState("");
  const [showTime,setShowTime]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const timeListRef=useRef<HTMLDivElement>(null);
  const TIME_SLOTS:string[]=[];
  for(let h=0;h<24;h++)for(let m=0;m<60;m+=30)TIME_SLOTS.push(`${fmt2(h)}:${fmt2(m)}`);
  const fmt12=(t:string)=>{if(!t)return "";const[hh,mm]=t.split(":").map(Number);const ap=hh<12?"오전":"오후";const h12=hh===0?12:hh>12?hh-12:hh;return `${ap} ${h12}:${fmt2(mm)}`;};
  useEffect(()=>{
    if(timeListRef.current&&timeStr){const el=timeListRef.current.querySelector('[data-sel="1"]') as HTMLElement;if(el)el.scrollIntoView({block:"center"});}
  },[showTime,timeStr]);
  useEffect(()=>{
    if(!datePop)return;
    const pd=(datePop.value||"").split(" ")[0]||"";
    const pt=(datePop.value||"").split(" ")[1]||"";
    if(pd){const[y,m]=pd.split("-").map(Number);setNavY(y);setNavM(m-1);}
    else{setNavY(today.getFullYear());setNavM(today.getMonth());}
    setSelDay(pd);setTimeStr(pt);setShowTime(!!pt);
  },[datePop?.id,datePop?.value]);
  useEffect(()=>{
    if(!datePop)return;
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))onClose();};
    document.addEventListener("mousedown",h,true);
    return()=>document.removeEventListener("mousedown",h,true);
  },[datePop,onClose]);
  if(!datePop)return null;
  const save=(day=selDay,t=timeStr)=>{if(!day)return;onSave(datePop.id,t?`${day} ${t}`:day);};
  const {rect}=datePop;
  const W=252;
  // 브라우저 줌 보정 — getBoundingClientRect()는 줌 적용된 값이지만 position:fixed는 CSS 픽셀 기준
  const zoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const rr={top:rect.top/zoom,left:rect.left/zoom,bottom:rect.bottom/zoom,right:rect.right/zoom};
  const vw=window.innerWidth/zoom, vh=window.innerHeight/zoom;
  let left=Math.max(8, Math.min(rr.left, vw-W-8));
  let top2=rr.bottom+4;
  if(top2+370>vh)top2=Math.max(8, rr.top-374);
  const firstDow=new Date(navY,navM,1).getDay();
  const startOff=(firstDow+6)%7;
  const dim=new Date(navY,navM+1,0).getDate();
  const cells:(number|null)[]=Array(startOff).fill(null);
  for(let d=1;d<=dim;d++)cells.push(d);
  const prevM=()=>{if(navM===0){setNavM(11);setNavY(y=>y-1);}else setNavM(m=>m-1);};
  const nextM=()=>{if(navM===11){setNavM(0);setNavY(y=>y+1);}else setNavM(m=>m+1);};
  const addDays=(n:number)=>{const d=new Date(today);d.setDate(d.getDate()+n);return dateStr(d.getFullYear(),d.getMonth(),d.getDate());};
  const korDow=(today.getDay()+6)%7;
  const thisFriday=korDow<=4?addDays(4-korDow):addDays(4-korDow+7);
  const nextMon=addDays(7-korDow);
  const quickDates=[{label:"오늘",ds:todayStr},{label:"내일",ds:addDays(1)},{label:"모레",ds:addDays(2)},{label:"이번주 금",ds:thisFriday},{label:"다음주",ds:nextMon}];
  const pickQuick=(ds:string)=>{setSelDay(ds);setNavY(parseInt(ds.slice(0,4)));setNavM(parseInt(ds.slice(5,7))-1);if(!showTime)save(ds,timeStr);};
  return createPortal(
    <div ref={ref} style={{position:"fixed",left,top:top2,zIndex:9999,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.18)",border:"1px solid #e2e8f0",width:W,fontFamily:"'Pretendard',system-ui,sans-serif",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px 8px",borderBottom:"1px solid #f1f5f9"}}>
        {selDay
          ?<div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
              <CheckIcon style={{width:14,height:14,color:"#16a34a"}}/>
              <span style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{selDay.slice(5).replace("-","/")} {timeStr&&<span style={{fontSize:11,color:"#64748b",fontWeight:400}}>{timeStr}</span>}</span>
            </div>
          :<span style={{fontSize:12,color:"#94a3b8",flex:1}}>날짜를 선택하세요</span>}
        <button onClick={()=>setShowTime(p=>!p)} title="시간" style={{background:showTime?"#eff6ff":"none",border:"none",cursor:"pointer",color:showTime?"#2563eb":"#94a3b8",fontSize:13,padding:"3px 5px",borderRadius:6,flexShrink:0}}>⏱</button>
        {selDay&&<button onClick={()=>{onSave(datePop.id,"");onClose();}} title="삭제" style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:13,padding:"3px 5px",borderRadius:6,flexShrink:0,display:"inline-flex",alignItems:"center"}}><XMarkIcon style={{width:13,height:13}}/></button>}
      </div>
      <div style={{display:"flex",gap:4,padding:"8px 10px",borderBottom:"1px solid #f1f5f9"}}>
        {quickDates.map(({label,ds})=>{const isSel=ds===selDay;return <button key={label} onClick={()=>pickQuick(ds)} style={{flex:1,fontSize:10,fontWeight:isSel?700:500,padding:"5px 2px",borderRadius:6,border:`1px solid ${isSel?"#2563eb":"#e2e8f0"}`,background:isSel?"#eff6ff":"#f8fafc",color:isSel?"#2563eb":"#64748b",cursor:"pointer",whiteSpace:"nowrap" as const}}>{label}</button>;})}
      </div>
      <div style={{display:"flex",alignItems:"center",padding:"8px 10px 4px"}}>
        <button onClick={prevM} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:17,lineHeight:1,padding:"3px 6px",borderRadius:6}}>‹</button>
        <span style={{flex:1,textAlign:"center",fontSize:13,fontWeight:700,color:"#1e293b"}}>{navY}년 {navM+1}월</span>
        <button onClick={nextM} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:17,lineHeight:1,padding:"3px 6px",borderRadius:6}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 8px 2px"}}>
        {["월","화","수","목","금","토","일"].map((d,i)=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:i===5?"#60a5fa":i===6?"#f87171":"#94a3b8",padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 8px 8px",gap:1}}>
        {cells.map((d,i)=>{
          if(d===null)return <div key={`e${i}`}/>;
          const ds=`${navY}-${fmt2(navM+1)}-${fmt2(d)}`;
          const isToday=ds===todayStr,isSel=ds===selDay;
          const col=(startOff+d-1)%7;
          return <button key={ds} onClick={()=>{setSelDay(ds);if(!showTime)save(ds,timeStr);}} style={{textAlign:"center",fontSize:12,padding:"6px 2px",borderRadius:7,border:"none",cursor:"pointer",background:isSel?"#2563eb":isToday?"#eff6ff":"transparent",color:isSel?"#fff":isToday?"#2563eb":col===5?"#3b82f6":col===6?"#ef4444":"#334155",fontWeight:isSel||isToday?700:400}}>{d}</button>;
        })}
      </div>
      {showTime&&<div style={{borderTop:"1px solid #f1f5f9"}}>
        <div ref={timeListRef} style={{maxHeight:180,overflowY:"auto",padding:"4px 0"}}>
          {TIME_SLOTS.map(t=>{const isSel=t===timeStr;return <div key={t} data-sel={isSel?"1":undefined} onClick={()=>{setTimeStr(t);save(selDay,t);}} style={{padding:"6px 16px",fontSize:12,cursor:"pointer",background:isSel?"#eff6ff":"transparent",color:isSel?"#2563eb":"#334155",fontWeight:isSel?700:400}} onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}} onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLDivElement).style.background="transparent";}}>{fmt12(t)}</div>;})}
        </div>
      </div>}
    </div>,
    document.body
  );
}
