import { useEffect, useRef } from "react";
import { fmt2, dateStr } from "../../utils";
import { Project } from "../../types";

export function MultiMonthView({calY,calM,ftodos,todayStr,gPr,onEvClick,onDayClick,onMoreClick,setCalDate,setCalView,calDays,evStyle,calDragId,calDragOverDs,onCalDragStart,onCalDragEnd,onCalDrop,setCalDragOverDs,sidebarDragId,calTodayKey}: {
  calY: number;
  calM: number;
  ftodos: any[];
  todayStr: string;
  gPr: (id: number) => Project;
  onEvClick: (e: React.MouseEvent, t: any) => void;
  onDayClick: (e: React.MouseEvent, ds: string) => void;
  onMoreClick: (e: React.MouseEvent, ds: string, todos: any[]) => void;
  setCalDate: (d: Date) => void;
  setCalView: (v: string) => void;
  calDays: string[];
  evStyle: (p: Project, repeat: string) => React.CSSProperties;
  calDragId: number|null;
  calDragOverDs: string|null;
  onCalDragStart: (id: number) => void;
  onCalDragEnd: () => void;
  onCalDrop: (ds: string) => void;
  setCalDragOverDs: (ds: string|null) => void;
  sidebarDragId: number|null;
  calTodayKey?: number;
}) {
  const months=Array.from({length:12},(_,i)=>({y:calY,m:i}));
  const monthRefs=useRef<(HTMLDivElement|null)[]>([]);
  const todayYear=todayStr?parseInt(todayStr.split("-")[0]):-1;
  const todayMonthIdx=todayStr?parseInt(todayStr.split("-")[1])-1:-1;

  useEffect(()=>{
    const targetIdx=calY===todayYear?todayMonthIdx:0;
    const id=requestAnimationFrame(()=>{
      const el=monthRefs.current[targetIdx];
      if(!el) return;
      const absTop=el.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop);
      const headerH=document.querySelector('[data-cal-header]')?.getBoundingClientRect().bottom??190;
      window.scrollTo({top:Math.max(0,absTop-headerH-8),behavior:"smooth"});
    });
    return ()=>cancelAnimationFrame(id);
  },[calY,calTodayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthCellsFor=(y: number,m: number)=>{
    const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),pd=new Date(y,m,0).getDate();
    let c: {d:number,cur:boolean,ds?:string,isT?:boolean}[]=[];
    for(let i=fd-1;i>=0;i--)c.push({d:pd-i,cur:false});
    for(let d=1;d<=dim;d++){const ds=dateStr(y,m,d);c.push({d,cur:true,ds,isT:ds===todayStr});}
    const rem=7-c.length%7;if(rem<7)for(let j=1;j<=rem;j++)c.push({d:j,cur:false});
    return c;
  };

  // 현재 드래그 중인 todo가 있는지 (캘린더 or 사이드바에서)
  const isDraggingAny = calDragId !== null || sidebarDragId !== null;

  const monthNames=["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  return <div style={{display:"flex",flexDirection:"column",gap:0,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
    {months.map(({y,m},mi)=><div key={`${y}-${m}`} ref={el=>{monthRefs.current[mi]=el;}}>
      <div style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{y}년 {monthNames[m]}</div>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,.2)"}}/>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>{ftodos.filter(t=>t.due&&t.due.split(" ")[0].startsWith(`${y}-${fmt2(m+1)}`)).length}건</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
        {calDays.map((d,i)=><div key={d} style={{padding:"8px 4px",textAlign:"center",fontSize:11,fontWeight:700,color:i===0?"#dc2626":"#64748b"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#fff"}}>
        {monthCellsFor(y,m).map((c,i)=>{
          const dayT=c.ds?ftodos.filter(t=>t.due&&t.due.split(" ")[0]===c.ds):[];
          const isWeekStart=(i%7)===0;
          const isDragOver=isDraggingAny&&c.ds===calDragOverDs;
          return <div key={i}
            style={{minHeight:120,padding:6,borderRight:((i+1)%7)?"1px solid #f1f5f9":"none",borderBottom:"1px solid #f1f5f9",
              background:isDragOver?"#eff6ff":c.isT?"#eff6ff":c.cur?"#fff":"#f8fafc",
              outline:isDragOver?"2px solid #2563eb":"none",outlineOffset:-2,
              overflow:"hidden",cursor:c.ds?(isDraggingAny?"copy":"pointer"):"default",
              transition:"background .1s,outline .1s"}}
            onClick={e=>{if(c.ds&&!isDraggingAny){const dd=new Date(c.ds);setCalDate(dd);onDayClick(e,c.ds);}}}
            onDragOver={e=>{if(c.ds&&isDraggingAny){e.preventDefault();setCalDragOverDs(c.ds);}}}
            onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))setCalDragOverDs(null);}}
            onDrop={e=>{e.preventDefault();if(c.ds)onCalDrop(c.ds);}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:3,color:c.isT?"#fff":!c.cur?"#94a3b8":isWeekStart?"#dc2626":"#334155",...(c.isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#2563eb",width:24,height:24,borderRadius:"50%",fontSize:12}:{padding:"1px 4px"})}}>
              {c.d}
            </div>
            {dayT.slice(0,4).map((t,ii)=>{
              const p=gPr(t.pid);
              const isThisDragging=calDragId===t.id;
              return <div key={t.id+"_"+ii}
                draggable
                onDragStart={e=>{e.stopPropagation();onCalDragStart(t.id);}}
                onDragEnd={e=>{e.stopPropagation();onCalDragEnd();}}
                onClick={e=>{e.stopPropagation();if(!isThisDragging)onEvClick(e,t);}}
                style={{...evStyle(p,t.repeat),fontSize:11,padding:"3px 7px",marginBottom:2,
                  cursor:"grab",opacity:isThisDragging?.4:1,
                  transition:"opacity .15s"}}>
                {t.repeat&&t.repeat!=="없음"?"🔁 ":""}{t.task}
              </div>;
            })}
            {dayT.length>4&&<div onClick={e=>{e.stopPropagation();onMoreClick(e,c.ds!,dayT);}}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#dbeafe";(e.currentTarget as HTMLDivElement).style.color="#1d4ed8";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";(e.currentTarget as HTMLDivElement).style.color="#2563eb";}}
              style={{fontSize:10,color:"#2563eb",paddingLeft:4,cursor:"pointer",fontWeight:600,borderRadius:4,transition:"background .1s,color .1s"}}>+{dayT.length-4}건 더보기</div>}
          </div>;})}
      </div>
    </div>)}
  </div>;
}
