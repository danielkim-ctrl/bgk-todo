import { useEffect, useRef, useState, useCallback } from "react";
import { fmt2, dateStr } from "../../utils";
import { Project } from "../../types";
import { ArrowPathIcon, ICON_SM } from "../ui/Icons";

// 월 컨테이너가 뷰포트에 보일 때만 내용을 렌더하는 래퍼 컴포넌트
function LazyMonth({children,placeholder}: {children: React.ReactNode,placeholder: React.ReactNode}) {
  const ref=useRef<HTMLDivElement|null>(null);
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    const el=ref.current;
    if(!el) return;
    // 뷰포트 위아래 200px 여유를 두고 미리 렌더링 시작
    // 한 번 보이면 visible을 다시 false로 되돌리지 않음 — 캘린더 특성상 한번 렌더된 월은 유지하는 것이 UX에 유리
    const obs=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting) setVisible(true);
    },{rootMargin:"200px 0px"});
    obs.observe(el);
    return ()=>obs.disconnect();
  },[]);

  return <div ref={ref}>{visible?children:placeholder}</div>;
}

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

  // 오늘 날짜가 소속된 월의 헤더가 화면 상단(sticky 헤더 바로 아래)에 위치하도록 스크롤
  // scrollIntoView 후 sticky 헤더 높이만큼 보정하여 월 헤더가 가려지지 않게 한다.
  useEffect(()=>{
    const targetIdx=calY===todayYear?todayMonthIdx:0;
    const id=requestAnimationFrame(()=>{
      const el=monthRefs.current[targetIdx];
      if(!el) return;
      // sticky 헤더의 실제 하단 위치를 기준으로 월 헤더를 그 바로 아래에 배치
      const headerEl=document.querySelector('[data-cal-header]');
      const headerBottom=headerEl?headerEl.getBoundingClientRect().bottom:0;
      // 월 헤더의 현재 화면 위치와 헤더 하단 사이의 차이만큼 스크롤
      const elTop=el.getBoundingClientRect().top;
      // 월 헤더를 sticky 헤더 하단에 딱 붙이기
      window.scrollBy({top:elTop-headerBottom+1});
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

  // 월 헤더만 렌더하는 플레이스홀더 — 아직 뷰포트에 보이지 않는 월에 표시
  // 월 컨텐츠가 로드되기 전 보여주는 플레이스홀더 — 고정 높이로 레이아웃 시프트 최소화
  const renderMonthPlaceholder = useCallback((y: number, m: number) => {
    return <>
      <div style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{y}년 {monthNames[m]}</div>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,.2)"}}/>
      </div>
      <div style={{minHeight:500,background:"#f8fafc"}}/>
    </>;
  }, [calY, todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  // 월 전체 콘텐츠를 렌더하는 함수
  const renderMonthContent = (y: number, m: number) => <>
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
        return <div key={i} data-calcell
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
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
              style={{...evStyle(p,t.repeat),fontSize:11,padding:"3px 7px",marginBottom:2,
                cursor:"grab",opacity:isThisDragging?.4:1,
                transition:"opacity .15s, filter .12s"}}>
              {t.repeat&&t.repeat!=="없음"&&<ArrowPathIcon style={ICON_SM} />}{t.task}
            </div>;
          })}
          {dayT.length>4&&<div onClick={e=>{e.stopPropagation();onMoreClick(e,c.ds!,dayT);}}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#dbeafe";(e.currentTarget as HTMLDivElement).style.color="#1d4ed8";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";(e.currentTarget as HTMLDivElement).style.color="#2563eb";}}
            style={{fontSize:10,color:"#2563eb",paddingLeft:4,cursor:"pointer",fontWeight:600,borderRadius:4,transition:"background .1s,color .1s"}}>+{dayT.length-4}건 더보기</div>}
        </div>;})}
    </div>
  </>;

  return <div style={{display:"flex",flexDirection:"column",gap:0,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
    {months.map(({y,m},mi)=><div key={`${y}-${m}`} ref={el=>{monthRefs.current[mi]=el;}}>
      <LazyMonth placeholder={renderMonthPlaceholder(y,m)}>
        {renderMonthContent(y,m)}
      </LazyMonth>
    </div>)}
  </div>;
}
