import { useRef } from "react";
import { S } from "../styles";
import { isOD, dateStr } from "../utils";
import { avColor, avColor2 } from "../utils/avatarUtils";
import { Chip } from "../components/ui/Chip";
import { RepeatBadge } from "../components/ui/RepeatBadge";
import { MultiMonthView } from "../components/calendar/MultiMonthView";
import { DateTimePicker } from "../components/editor/DateTimePicker";
import { Bars3Icon, ArrowPathIcon, UserIcon, ExclamationTriangleIcon, CalendarIcon, FolderIcon, CheckCircleIcon, CheckIcon, XMarkIcon, PencilSquareIcon, TrashIcon, BoltIcon, StarIcon, StarOutlineIcon, ICON_SM } from "../components/ui/Icons";

interface CalendarViewProps {
  // calendar state
  calView: string;
  setCalView: (v: string) => void;
  calY: number;
  calM: number;
  calD: number;
  calNav: (dir: number) => void;
  calTitle: () => string;
  calDays: string[];
  todayStr: string;
  customDays: number;
  setCustomDays: (v: number) => void;
  weekDates: () => Date[];
  customDates: () => Date[];
  agendaItems: () => any[];
  ftodosExpanded: any[];
  evStyle: (p: any, repeat?: string) => any;
  calF: string[];
  setCalF: (v: string[]) => void;
  calFWho: string[];
  setCalFWho: (v: string[]) => void;
  visibleProj: any[];
  members: string[];
  visibleMembers: string[];
  gPr: (pid: number) => any;
  pris: string[];
  priC: Record<string,string>;
  priBg: Record<string,string>;
  stC: Record<string,string>;
  stBg: Record<string,string>;
  todos: any[];
  updTodo: (id: number, updates: any) => void;
  addTodo: (todo: any) => void;
  delTodo: (id: number) => void;
  flash: (msg: string, type?: string) => void;
  setEditMod: (v: any) => void;
  currentUser: string|null;
  // calendar popovers
  calEvPop: {todo:any,x:number,y:number}|null;
  setCalEvPop: (v: {todo:any,x:number,y:number}|null) => void;
  calQA: {ds:string,h:number,x:number,y:number}|null;
  setCalQA: (v: {ds:string,h:number,x:number,y:number}|null) => void;
  calQATitle: string;
  setCalQATitle: (v: string) => void;
  calQADue: string;
  setCalQADue: (v: string) => void;
  calQAPid: string;
  setCalQAPid: (v: string) => void;
  calQAWho: string;
  setCalQAWho: (v: string) => void;
  calQAPri: string;
  setCalQAPri: (v: string) => void;
  calQAPicker: string|null;
  setCalQAPicker: (v: string|null) => void;
  calDayPop: {ds:string,todos:any[],x:number,y:number}|null;
  setCalDayPop: (v: {ds:string,todos:any[],x:number,y:number}|null) => void;
  calSidebarOpen: boolean;
  setCalSidebarOpen: (fn: (v: boolean) => boolean) => void;
  calSidebarAdding: boolean;
  setCalSidebarAdding: (v: boolean) => void;
  calSidebarAddTitle: string;
  setCalSidebarAddTitle: (v: string) => void;
  // calendar drag
  calDragId: number|null;
  setCalDragId: (v: number|null) => void;
  calDragOverDs: string|null;
  setCalDragOverDs: (v: string|null) => void;
  calDragOverH: number|null;
  setCalDragOverH: (v: number|null) => void;
  calDragStart: (id: number) => void;
  calDragEnd: () => void;
  calDropOnDate: (ds: string, h?: number) => void;
  calTodayKey: number;
  calTodayFn: () => void;
  setCalDate: (d: Date) => void;
  gridScrolled: React.MutableRefObject<boolean>;
  justOpenedPopup: React.MutableRefObject<boolean>;
  saveQA: () => void;
  openEvPop: (e: React.MouseEvent, t: any) => void;
  openQA: (e: React.MouseEvent, ds: string, h: number) => void;
  // sidebar state
  sidebarOrder: number[];
  setSidebarOrder: (order: number[]) => void;
  sidebarDragId: number|null;
  setSidebarDragId: (v: number|null) => void;
  sidebarDragOver: number|null;
  setSidebarDragOver: (v: number|null) => void;
  sidebarHoverId: number|null;
  setSidebarHoverId: (v: number|null) => void;
  sidebarEditId: number|null;
  setSidebarEditId: (v: number|null) => void;
  sidebarEditVal: string;
  setSidebarEditVal: (v: string) => void;
  sidebarDateId: number|null;
  setSidebarDateId: (v: number|null) => void;
  sidebarExpandId: number|null;
  sidebarDetId: number|null;
  setSidebarDetId: (v: number|null) => void;
  sidebarProjId: number|null;
  setSidebarProjId: (v: number|null) => void;
  sidebarExpand: (id: number|null) => void;
  sidebarDoneOpen: boolean;
  setSidebarDoneOpen: (fn: (v: boolean) => boolean) => void;
  secNodateOpen: boolean;
  setSecNodateOpen: (fn: (v: boolean) => boolean) => void;
  secTodayOpen: boolean;
  setSecTodayOpen: (fn: (v: boolean) => boolean) => void;
  secWeekOpen: boolean;
  setSecWeekOpen: (fn: (v: boolean) => boolean) => void;
  secLaterOpen: boolean;
  setSecLaterOpen: (fn: (v: boolean) => boolean) => void;
  starredIds: Set<number>;
  toggleStar: (id: number) => void;
  pendingComplete: Set<number>;
  handleSideComplete: (id: number, isDone: boolean) => void;
  detDivRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
}

export function CalendarView(props: CalendarViewProps) {
  const {
    calView, setCalView, calY, calM, calD, calNav, calTitle, calDays,
    todayStr, customDays, setCustomDays, weekDates, customDates, agendaItems,
    ftodosExpanded, evStyle, calF, setCalF, calFWho, setCalFWho,
    visibleProj, members, visibleMembers, gPr, pris, priC, priBg, stC, stBg,
    todos, updTodo, addTodo, delTodo, flash, setEditMod, currentUser,
    calEvPop, setCalEvPop, calQA, setCalQA, calQATitle, setCalQATitle,
    calQADue, setCalQADue, calQAPid, setCalQAPid, calQAWho, setCalQAWho,
    calQAPri, setCalQAPri, calQAPicker, setCalQAPicker,
    calDayPop, setCalDayPop, calSidebarOpen, setCalSidebarOpen,
    calSidebarAdding, setCalSidebarAdding, calSidebarAddTitle, setCalSidebarAddTitle,
    calDragId, setCalDragId, calDragOverDs, setCalDragOverDs, calDragOverH, setCalDragOverH,
    calDragStart, calDragEnd, calDropOnDate, calTodayKey, calTodayFn, setCalDate,
    gridScrolled, justOpenedPopup, saveQA, openEvPop, openQA,
    sidebarOrder, setSidebarOrder, sidebarDragId, setSidebarDragId,
    sidebarDragOver, setSidebarDragOver, sidebarHoverId, setSidebarHoverId,
    sidebarEditId, setSidebarEditId, sidebarEditVal, setSidebarEditVal,
    sidebarDateId, setSidebarDateId, sidebarExpandId, sidebarDetId, setSidebarDetId,
    sidebarProjId, setSidebarProjId, sidebarExpand,
    sidebarDoneOpen, setSidebarDoneOpen, secNodateOpen, setSecNodateOpen,
    secTodayOpen, setSecTodayOpen, secWeekOpen, setSecWeekOpen,
    secLaterOpen, setSecLaterOpen, starredIds, toggleStar,
    pendingComplete, handleSideComplete, detDivRefs,
  } = props;

  return <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
    {/* ── 메인 캘린더 영역 ── */}
    <div style={{flex:1,minWidth:0}}>
    <div data-cal-header style={{position:"sticky",top:94,zIndex:50,background:"#f0f4f8",paddingBottom:8,marginBottom:0}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8,alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>calNav(-1)} style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:13,color:"#64748b"}}>◀</button>
        <button onClick={()=>calNav(1)} style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:13,color:"#64748b"}}>▶</button>
        <button onClick={calTodayFn} style={{...S.bs,fontSize:11,padding:"4px 10px"}}>오늘</button>
        <div style={{fontSize:15,fontWeight:800,minWidth:180}}>{calTitle()}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        {[["day","일",1],["week","주",2],["month","월",3],["custom",`${customDays}일`,4],["agenda","일정",5]].map(([k,l,n])=>
          <button key={k} onClick={()=>setCalView(k as string)} style={{padding:"5px 10px",borderRadius:6,border:`1.5px solid ${calView===k?"#2563eb":"#e2e8f0"}`,background:calView===k?"#2563eb":"#fff",color:calView===k?"#fff":"#64748b",fontSize:11,fontWeight:calView===k?600:500,cursor:"pointer"}}>
            <span style={{fontSize:10,opacity:.6,fontWeight:700}}>{n}</span>{l}
          </button>)}
        {calView==="custom"&&<input type="number" min="2" max="14" value={customDays} onChange={e=>setCustomDays(Math.max(2,Math.min(14,parseInt(e.target.value)||4)))} style={{width:44,padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,textAlign:"center"}}/>}
        {/* 우측 사이드바 토글 버튼 */}
        <button onClick={()=>setCalSidebarOpen(v=>!v)} title={calSidebarOpen?"사이드바 닫기":"사이드바 열기"} style={{marginLeft:4,width:28,height:28,borderRadius:6,border:`1.5px solid ${calSidebarOpen?"#2563eb":"#e2e8f0"}`,background:calSidebarOpen?"#eff6ff":"#fff",cursor:"pointer",fontSize:14,color:calSidebarOpen?"#2563eb":"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}><Bars3Icon style={ICON_SM}/></button>
      </div>
    </div>
    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
      <Chip active={calF.length===0} onClick={()=>setCalF([])}>전체</Chip>
      {visibleProj.map(p=><Chip key={p.id} active={calF.includes(String(p.id))} color={p.color} onClick={()=>setCalF(calF.includes(String(p.id))?calF.filter(x=>x!==String(p.id)):[...calF,String(p.id)])}>{p.name}</Chip>)}
    </div>
    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
      <Chip active={calFWho.length===0} onClick={()=>setCalFWho([])}>전체</Chip>
      {members.map(n=><Chip key={n} active={calFWho.includes(n)} onClick={()=>setCalFWho(calFWho.includes(n)?calFWho.filter(x=>x!==n):[...calFWho,n])}>{n}</Chip>)}
    </div>
    <div style={{fontSize:10,color:"#94a3b8",display:"flex",alignItems:"center",gap:6}}>
      <span style={{display:"inline-flex",alignItems:"center",gap:3}}><span style={{width:12,height:8,borderLeft:"3px dashed #64748b",display:"inline-block"}}/> 반복 업무</span>
      <span style={{display:"inline-flex",alignItems:"center",gap:3}}><span style={{width:12,height:8,borderLeft:"3px solid #64748b",display:"inline-block"}}/> 일반 업무</span>
    </div>
    </div>

    {calView==="day"&&(()=>{
      const ds=dateStr(calY,calM,calD);
      const allDayTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&!t.due.includes(" "));
      const timedTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&t.due.includes(" "));
      const getH=(due:string)=>parseInt((due.split(" ")[1]||"0:0").split(":")[0])||0;
      const isT=ds===todayStr;
      const dow=new Date(ds).getDay();
      const isSun=dow===0;const isSat=dow===6;
      const hourH=48;
      const now=new Date();
      const nowTop=isT?(now.getHours()*60+now.getMinutes())/60*hourH:-1;
      return <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",display:"flex",flexDirection:"column" as const}}>
        <div style={{display:"grid",gridTemplateColumns:"56px 1fr",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
          <div style={{textAlign:"center",padding:"10px 0",background:isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
            <div style={{fontSize:11,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[dow]}</div>
            <div style={{fontSize:28,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:42,height:42,borderRadius:"50%",fontSize:22}:{})}}>{calD}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"56px 1fr",borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:40}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
          {(()=>{const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;return(
          <div style={{padding:"4px 6px",display:"flex",flexDirection:"column" as const,gap:2,
            background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":"#fff",
            outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,overflow:"hidden",
            cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
            data-calcell
            onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,0);}}
            onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(-1);}}}
            onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
            onDrop={e=>{e.preventDefault();calDropOnDate(ds);}}>
            {allDayTodos.length===0
              ?<span style={{fontSize:10,color:"#cbd5e1",fontStyle:"italic",padding:"4px 0"}}>클릭하여 종일 업무 추가</span>
              :allDayTodos.map((t,ii)=>{const p=gPr(t.pid);const isThisDragging=calDragId===t.id;return(
                <div key={t.id+"_"+ii}
                  draggable
                  onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                  onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                  onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                  style={{...evStyle(p,t.repeat),whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:4,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{}),maxWidth:"100%"}}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",minWidth:0,flex:1,display:"inline-flex",alignItems:"center",gap:2}}>{t.repeat&&t.repeat!=="없음"&&<><ArrowPathIcon style={ICON_SM}/>{" "}</>}{t.task}</span>
                  {t.who&&<span style={{opacity:.7,fontSize:10,flexShrink:0}}> · {t.who}</span>}
                </div>);})}
          </div>);})()}
        </div>
        <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
          ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
          {Array.from({length:24},(_,h)=>{
            const hTodos=timedTodos.filter(t=>getH(t.due)===h);
            const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
            return <div key={h} style={{display:"grid",gridTemplateColumns:"56px 1fr",minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:10,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
              </div>
              <div style={{background:isDragOverCell?"#eff6ff":isT?"#fafcff":"#fff",
                outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                padding:hTodos.length>0?"2px 4px":0,overflow:"hidden",
                cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                data-calcell
                onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,h);}}
                onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(h);}}}
                onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                onDrop={e=>{e.preventDefault();calDropOnDate(ds,h);}}>
                {hTodos.map((t,ii)=>{const p=gPr(t.pid);const tl=(t.due.split(" ")[1]||"").slice(0,5);const isThisDragging=calDragId===t.id;return(
                  <div key={t.id+"_"+ii}
                    draggable
                    onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                    onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                    onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                    style={{...evStyle(p,t.repeat),display:"flex",alignItems:"center",gap:4,padding:"2px 8px",marginBottom:2,whiteSpace:"nowrap" as const,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{}),maxWidth:"100%",overflow:"hidden"}}>
                    <span style={{fontSize:8,fontWeight:700,flexShrink:0,opacity:.9}}>{tl}</span>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",minWidth:0,flex:1,display:"inline-flex",alignItems:"center",gap:2}}>{t.repeat&&t.repeat!=="없음"&&<ArrowPathIcon style={ICON_SM}/>}{t.task}</span>
                    {t.who&&<span style={{opacity:.7,fontSize:8,flexShrink:0}}> · {t.who}</span>}
                  </div>);})}
              </div>
            </div>;})}
          {nowTop>=0&&<div style={{position:"absolute",top:nowTop,left:0,right:0,display:"flex",alignItems:"center",pointerEvents:"none",zIndex:3}}>
            <div style={{width:56,flexShrink:0}}/>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#ea4335",flexShrink:0,marginLeft:-5}}/>
            <div style={{flex:1,height:2,background:"#ea4335"}}/>
          </div>}
        </div>
      </div>;
    })()}

    {calView==="week"&&(()=>{
      const wDates=weekDates();
      const hourH=48;
      const now=new Date();
      const nowTop=(now.getHours()*60+now.getMinutes())/60*hourH;
      const hasToday=wDates.some(d=>dateStr(d.getFullYear(),d.getMonth(),d.getDate())===todayStr);
      return <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",display:"flex",flexDirection:"column" as const}}>
        {/* 헤더: 요일 + 날짜 */}
        <div style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
          {wDates.map((d,i)=>{
            const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
            const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
            return <div key={i} style={{textAlign:"center",padding:"10px 4px",borderRight:i<6?"1px solid #e2e8f0":"none",background:isT?"#eff6ff":isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
              <div style={{fontSize:10,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[d.getDay()]}</div>
              <div style={{fontSize:22,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:34,height:34,borderRadius:"50%",fontSize:18}:{})}}>{d.getDate()}</div>
            </div>;})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:36}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
          {wDates.map((d,i)=>{
            const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
            const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
            const allDayT=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&!t.due.includes(" "));
            const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;
            return <div key={i} data-calcell
              style={{padding:"2px 3px",borderRight:i<6?"1px solid #e2e8f0":"none",
                background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,overflow:"hidden",
                cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
              onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,0);}}
              onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(-1);}}}
              onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
              onDrop={e=>{e.preventDefault();calDropOnDate(ds);}}>
              {allDayT.map((t,ii)=>{const p=gPr(t.pid);const isThisDragging=calDragId===t.id;return(
                <div key={t.id+"_"+ii}
                  draggable
                  onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                  onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                  onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                  style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{})}}>
                  <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:2}}>{t.repeat&&t.repeat!=="없음"&&<ArrowPathIcon style={ICON_SM}/>}{t.task}</div>
                  {t.who&&<div style={{fontSize:8,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:2}}><UserIcon style={ICON_SM}/> {t.who}</div>}
                </div>);})}
            </div>;})}
        </div>
        <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
          ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
          {Array.from({length:24},(_,h)=>{
            const getH=(due:string)=>parseInt((due.split(" ")[1]||"0:0").split(":")[0])||0;
            return <div key={h} style={{display:"grid",gridTemplateColumns:"56px repeat(7,1fr)",minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:10,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
              </div>
              {wDates.map((d,i)=>{
                const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
                const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                const hTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&t.due.includes(" ")&&getH(t.due)===h);
                const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
                return <div key={i} data-calcell
                  style={{borderRight:i<6?"1px solid #f1f5f9":"none",
                    background:isDragOverCell?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                    outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                    padding:hTodos.length>0?"2px 3px":0,overflow:"hidden",
                    cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                  onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,h);}}
                  onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(h);}}}
                  onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                  onDrop={e=>{e.preventDefault();calDropOnDate(ds,h);}}>
                  {hTodos.map((t,ii)=>{const p=gPr(t.pid);const tl=(t.due.split(" ")[1]||"").slice(0,5);const isThisDragging=calDragId===t.id;return(
                    <div key={t.id+"_"+ii}
                      draggable
                      onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                      onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                      onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                      style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{})}}>
                      <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}><span style={{fontSize:8,fontWeight:700,opacity:.9}}>{tl} </span>{t.task}</div>
                      {t.who&&<div style={{fontSize:7,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:1}}><UserIcon style={{width:8,height:8,flexShrink:0}}/> {t.who}</div>}
                    </div>);})}
                </div>;})}
            </div>;})}
          {hasToday&&<div style={{position:"absolute",top:nowTop,left:0,right:0,display:"flex",alignItems:"center",pointerEvents:"none",zIndex:3}}>
            <div style={{width:56,flexShrink:0}}/>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#ea4335",flexShrink:0,marginLeft:-5}}/>
            <div style={{flex:1,height:2,background:"#ea4335"}}/>
          </div>}
        </div>
      </div>;
    })()}

    {calView==="month"&&<MultiMonthView calY={calY} calM={calM} ftodos={ftodosExpanded} todayStr={todayStr} gPr={gPr} onEvClick={openEvPop} onDayClick={(e,ds)=>openQA(e,ds,0)} onMoreClick={(e,ds,ts)=>{e.stopPropagation();const zm=parseFloat(getComputedStyle(document.documentElement).zoom)||1;const r=(e.currentTarget as HTMLElement).getBoundingClientRect();const vw=window.innerWidth/zm;const vh=window.innerHeight/zm;setCalDayPop({ds,todos:ts,x:Math.max(8,Math.min(r.right/zm+4,vw-292)),y:Math.max(8,Math.min(r.top/zm,vh-370))});setCalEvPop(null);setCalQA(null);}} setCalDate={setCalDate} setCalView={setCalView} calDays={calDays} evStyle={evStyle} calDragId={calDragId} calDragOverDs={calDragOverDs} onCalDragStart={calDragStart} onCalDragEnd={calDragEnd} onCalDrop={calDropOnDate} setCalDragOverDs={setCalDragOverDs} sidebarDragId={sidebarDragId} calTodayKey={calTodayKey}/>}

    {calView==="custom"&&(()=>{
      const cDates=customDates();
      const hourH=48;
      const now=new Date();
      const nowTop=(now.getHours()*60+now.getMinutes())/60*hourH;
      const hasToday=cDates.some(d=>dateStr(d.getFullYear(),d.getMonth(),d.getDate())===todayStr);
      return <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",display:"flex",flexDirection:"column" as const}}>
        {/* 헤더: 요일 + 날짜 */}
        <div style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 4px",lineHeight:1.3}}>GMT<br/>+9</div>
          {cDates.map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
            return <div key={i} style={{textAlign:"center",padding:"10px 4px",borderRight:i<customDays-1?"1px solid #e2e8f0":"none",background:isT?"#eff6ff":isSun?"#fff5f5":isSat?"#f0f4ff":"#fff"}}>
              <div style={{fontSize:10,fontWeight:700,color:isSun?"#dc2626":isSat?"#2563eb":"#64748b"}}>{calDays[d.getDay()]}</div>
              <div style={{fontSize:18,fontWeight:400,lineHeight:1.1,color:isT?"#fff":"#334155",marginTop:4,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1a73e8",width:30,height:30,borderRadius:"50%",fontSize:15}:{})}}>{d.getDate()}</div>
            </div>;})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,borderBottom:"2px solid #e2e8f0",flexShrink:0,minHeight:36}}>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",borderRight:"1px solid #e2e8f0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:10}}>종일</div>
          {cDates.map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
            const allDayT=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&!t.due.includes(" "));
            const isDragOverAllDay=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===-1;
            return <div key={i} data-calcell
              style={{padding:"2px 3px",borderRight:i<customDays-1?"1px solid #e2e8f0":"none",
                background:isDragOverAllDay?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                outline:isDragOverAllDay?"2px solid #2563eb":"none",outlineOffset:-2,overflow:"hidden",
                cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
              onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,0);}}
              onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(-1);}}}
              onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
              onDrop={e=>{e.preventDefault();calDropOnDate(ds);}}>
              {allDayT.map((t,ii)=>{const p=gPr(t.pid);const isThisDragging=calDragId===t.id;return(
                <div key={t.id+"_"+ii}
                  draggable
                  onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                  onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                  onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                  style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{})}}>
                  <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:2}}>{t.repeat&&t.repeat!=="없음"&&<ArrowPathIcon style={ICON_SM}/>}{t.task}</div>
                  {t.who&&<div style={{fontSize:8,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:2}}><UserIcon style={ICON_SM}/> {t.who}</div>}
                </div>);})}
            </div>;})}
        </div>
        <div style={{position:"relative",overflowY:"auto",maxHeight:460}}
          ref={el=>{if(el&&!gridScrolled.current){el.scrollTop=0;gridScrolled.current=true;}}}>
          {Array.from({length:24},(_,h)=>{
            const getH=(due:string)=>parseInt((due.split(" ")[1]||"0:0").split(":")[0])||0;
            return <div key={h} style={{display:"grid",gridTemplateColumns:`56px repeat(${customDays},1fr)`,minHeight:hourH,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:10,color:"#94a3b8",textAlign:"right",paddingRight:8,borderRight:"1px solid #e2e8f0",paddingTop:h===0?4:0,lineHeight:1,minHeight:hourH,boxSizing:"border-box" as const}}>
                {h===0?"":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}
              </div>
              {cDates.map((d,i)=>{
                const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());
                const isT=ds===todayStr;const isSun=d.getDay()===0;const isSat=d.getDay()===6;
                const hTodos=ftodosExpanded.filter(t=>t.due&&t.due.split(" ")[0]===ds&&t.due.includes(" ")&&getH(t.due)===h);
                const isDragOverCell=(calDragId!==null||sidebarDragId!==null)&&calDragOverDs===ds&&calDragOverH===h;
                return <div key={i} data-calcell
                  style={{borderRight:i<customDays-1?"1px solid #f1f5f9":"none",
                    background:isDragOverCell?"#eff6ff":isT?"#fafcff":isSun?"#fff8f8":isSat?"#f8f9ff":"#fff",
                    outline:isDragOverCell?"2px solid #2563eb":"none",outlineOffset:-2,
                    padding:hTodos.length>0?"2px 3px":0,overflow:"hidden",
                    cursor:(calDragId!==null||sidebarDragId!==null)?"copy":"pointer",transition:"background .1s"}}
                  onClick={e=>{if(!calDragId&&!sidebarDragId)openQA(e,ds,h);}}
                  onDragOver={e=>{if(calDragId!==null||sidebarDragId!==null){e.preventDefault();setCalDragOverDs(ds);setCalDragOverH(h);}}}
                  onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setCalDragOverDs(null);setCalDragOverH(null);}}}
                  onDrop={e=>{e.preventDefault();calDropOnDate(ds,h);}}>
                  {hTodos.map((t,ii)=>{const p=gPr(t.pid);const tl=(t.due.split(" ")[1]||"").slice(0,5);const isThisDragging=calDragId===t.id;return(
                    <div key={t.id+"_"+ii}
                      draggable
                      onDragStart={e=>{e.stopPropagation();calDragStart(t.id);}}
                      onDragEnd={e=>{e.stopPropagation();calDragEnd();}}
                      onClick={e=>{e.stopPropagation();if(!isThisDragging)openEvPop(e,t);}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.filter="brightness(.92)";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.filter="none";}}
                      style={{...evStyle(p,t.repeat),marginBottom:1,cursor:"grab",opacity:isThisDragging?(t._instance?0.28:0.4):(t._instance?0.7:1),transition:"opacity .15s, filter .12s",...(t._instance?{borderLeft:"2px dashed "+p.color}:{})}}>
                      <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}><span style={{fontSize:8,fontWeight:700,opacity:.9}}>{tl} </span>{t.task}</div>
                      {t.who&&<div style={{fontSize:7,opacity:.75,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"flex",alignItems:"center",gap:1}}><UserIcon style={{width:8,height:8,flexShrink:0}}/> {t.who}</div>}
                    </div>);})}
                  </div>;})}
            </div>;})}
          {hasToday&&<div style={{position:"absolute",top:nowTop,left:0,right:0,display:"flex",alignItems:"center",pointerEvents:"none",zIndex:3}}>
            <div style={{width:56,flexShrink:0}}/>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#ea4335",flexShrink:0,marginLeft:-5}}/>
            <div style={{flex:1,height:2,background:"#ea4335"}}/>
          </div>}
        </div>
      </div>;
    })()}

    {calView==="agenda"&&<div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
      {agendaItems().length===0?<div style={{padding:40,textAlign:"center",color:"#94a3b8",fontSize:12}}>예정된 업무 없음</div>:
      <div style={{maxHeight:600,overflowY:"auto"}}>
        {agendaItems().map(item=>{
          const d=item.date;const isT=item.ds===todayStr;const isSun=d.getDay()===0;
          return <div key={item.ds}>
            <div style={{padding:"10px 16px",background:isT?"#eff6ff":"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:1}}>
              <div style={{textAlign:"center",minWidth:40}}>
                <div style={{fontSize:10,color:isSun?"#dc2626":"#64748b",fontWeight:600}}>{calDays[d.getDay()]}</div>
                <div style={{fontSize:22,fontWeight:800,color:isT?"#fff":"#334155",...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#2563eb",width:32,height:32,borderRadius:"50%"}:{})}}>{d.getDate()}</div>
              </div>
              <div style={{fontSize:12,color:"#64748b"}}>{d.getFullYear()}년 {d.getMonth()+1}월</div>
              <span style={{fontSize:10,color:"#94a3b8",marginLeft:"auto"}}>{item.todos.length}건</span>
            </div>
            {item.todos.map((t: any,ii: number)=>{const p=gPr(t.pid);const od=isOD(t.due,t.st);
              return <div key={t.id+"_"+ii} onClick={e=>openEvPop(e,t)} style={{padding:"10px 16px 10px 66px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"background .12s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
                <div style={{width:4,height:28,borderRadius:2,background:p.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
                    {t.task}{od&&<span style={{color:"#dc2626",display:"inline-flex"}}><ExclamationTriangleIcon style={ICON_SM}/></span>}<RepeatBadge repeat={t.repeat}/>
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2,display:"flex",gap:8}}>
                    <span>{p.name}</span><span>{t.who}</span><span style={S.badge(priBg[t.pri],priC[t.pri])}>{t.pri}</span><span style={S.badge(stBg[t.st],stC[t.st])}>{t.st}</span>
                  </div>
                </div>
              </div>})}
          </div>})}
      </div>}
    </div>}
    <div style={{marginTop:8,textAlign:"center",fontSize:10,color:"#94a3b8"}}>키보드 단축키: T오늘 ←→이동 D일 W주 M월 A일정</div>
    </div>{/* ── 메인 캘린더 영역 끝 ── */}

    {/* ── 우측 사이드바: 나의 할일 ── */}
    {calSidebarOpen&&(()=>{
      const myAll=todos.filter(t=>t.who===currentUser&&!t._instance);
      const active=myAll.filter(t=>t.st!=="완료"&&!pendingComplete.has(t.id));
      const animating=myAll.filter(t=>pendingComplete.has(t.id));
      const done=myAll.filter(t=>t.st==="완료");
      const pct=myAll.length>0?Math.round(done.length/myAll.length*100):0;

      const applyOrder=(arr:any[])=>{
        if(!sidebarOrder.length)return arr;
        const idx=new Map(sidebarOrder.map((id,i)=>[id,i]));
        return [...arr].sort((a,b)=>(idx.has(a.id)?idx.get(a.id)!:9999)-(idx.has(b.id)?idx.get(b.id)!:9999));
      };

      const we=new Date(todayStr);we.setDate(we.getDate()+6);
      const weekEndD=dateStr(we.getFullYear(),we.getMonth(),we.getDate());
      const qDays=(n:number)=>{const d=new Date(todayStr);d.setDate(d.getDate()+n);return dateStr(d.getFullYear(),d.getMonth(),d.getDate());};

      // 날짜 없음 섹션 분리
      const secNoDate=applyOrder(active.filter(t=>!t.due?.split(" ")[0]));
      const secToday=applyOrder(active.filter(t=>{const d=t.due?.split(" ")[0]||"";return !!d&&d<=todayStr;}));
      const secWeek=applyOrder(active.filter(t=>{const d=t.due?.split(" ")[0]||"";return !!d&&d>todayStr&&d<=weekEndD;}));
      const secLater=applyOrder(active.filter(t=>{const d=t.due?.split(" ")[0]||"";return !!d&&d>weekEndD;}));

      // 섹션 헤더 컴포넌트 (sticky + 접기/펼치기)
      const SecHdr=({label,count,open,onToggle}:{label:string,count:number,open:boolean,onToggle:()=>void})=>
        <button onClick={onToggle} style={{width:"100%",padding:"7px 12px 5px",border:"none",borderBottom:"1px solid #f1f5f9",background:"#fafafa",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:".5px",textAlign:"left" as const,fontFamily:"inherit",position:"sticky" as const,top:0,zIndex:1}}>
          <span style={{fontSize:7,display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
          {label}<span style={{fontWeight:400,marginLeft:2}}>{count}</span>
        </button>;

      const renderTodo=(t:any,isDoneSec=false)=>{
        const p=gPr(t.pid);
        const isAnim=pendingComplete.has(t.id);
        const isDone=t.st==="완료"||isAnim;
        const od=isOD(t.due,t.st);
        const isHov=sidebarHoverId===t.id;
        const isEd=sidebarEditId===t.id;
        const isDragOv=sidebarDragOver===t.id;
        const isDragging=sidebarDragId===t.id;
        const isExp=sidebarExpandId===t.id&&!isDoneSec;
        const isStarred=starredIds.has(t.id);
        const dueDateStr=t.due?.split(" ")[0]||"";

        // ★ 드래그 중에는 same element(key 동일)를 유지 → DOM unmount 방지
        //   (다른 key로 early-return하면 드래그 소스가 사라져 브라우저가 drag 취소)

        return <div key={t.id+"_sb"}
          draggable={!isDoneSec&&!isEd&&!isExp}
          onDragStart={e=>{
            const ghost=document.createElement("div");
            ghost.style.cssText=`position:absolute;top:${window.scrollY}px;left:-9999px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:9px 14px 9px 12px;font-size:13px;font-weight:500;color:#1e293b;box-shadow:0 8px 24px rgba(0,0,0,.18);width:220px;white-space:nowrap;overflow:hidden;font-family:Pretendard,system-ui,sans-serif;display:flex;align-items:center;gap:9px;box-sizing:border-box;pointer-events:none;`;
            const circle=document.createElement("span");
            circle.style.cssText="width:14px;height:14px;border-radius:50%;border:1.5px solid #d1d5db;flex-shrink:0;display:block;";
            const label=document.createElement("span");
            label.style.cssText="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;";
            label.textContent=t.task;
            ghost.appendChild(circle);ghost.appendChild(label);
            document.body.appendChild(ghost);
            ghost.getBoundingClientRect();
            e.dataTransfer.setDragImage(ghost,16,22);
            requestAnimationFrame(()=>{if(ghost.parentNode)ghost.parentNode.removeChild(ghost);});
            setSidebarDragId(t.id);document.body.style.cursor="grabbing";
          }}
          onDragEnd={()=>{setSidebarDragId(null);setSidebarDragOver(null);setCalDragOverDs(null);setCalDragOverH(null);document.body.style.cursor="";}}
          onDragOver={e=>{e.preventDefault();if(sidebarDragId!==t.id)setSidebarDragOver(t.id);}}
          onDrop={e=>{
            e.preventDefault();
            if(sidebarDragId===null||sidebarDragId===t.id){setSidebarDragOver(null);return;}
            const allIds=myAll.map(x=>x.id);
            const base=[...new Set([...sidebarOrder.filter(id=>allIds.includes(id)),...allIds])];
            const from=base.indexOf(sidebarDragId);const to=base.indexOf(t.id);
            if(from<0||to<0){setSidebarDragOver(null);return;}
            const neo=[...base];neo.splice(from,1);neo.splice(to,0,sidebarDragId);
            setSidebarOrder(neo);
            setSidebarDragId(null);setSidebarDragOver(null);document.body.style.cursor="";
          }}
          onMouseEnter={()=>setSidebarHoverId(t.id)}
          onMouseLeave={()=>setSidebarHoverId(null)}
          onClick={e=>{e.stopPropagation();if(!isDoneSec&&!isEd){sidebarExpand(isExp?null:t.id);setSidebarDateId(null);}}}
          style={{
            position:"relative" as const,
            padding:isDoneSec?"8px 12px 8px 10px":`${isExp?"10px":"8px"} 36px ${isExp?"12px":"8px"} 22px`,
            /* 드롭 타겟: 상단에 파란 선 (배경 변경 없이 레이아웃 유지) */
            borderTop:isDragOv&&!isDragging?"2px solid #2563eb":"2px solid transparent",
            borderBottom:`1px solid ${isExp?"#e8f0fe":"#f1f5f9"}`,
            display:"flex",alignItems:"flex-start",gap:9,
            cursor:isExp?"default":isHov&&!isDoneSec?"grab":"default",
            background:isExp?"#f8fbff":isHov&&!isDoneSec&&!isDragging?"#fafafa":"#fff",
            /* 드래그 중: 반투명하게 — DOM 유지로 drag 취소 방지 */
            opacity:isDragging?0.25:isAnim?.35:1,
            transition:"background .12s,opacity .2s,border-top-color .1s",
          }}>

          {/* 드래그 핸들 (비확장 상태에서만) */}
          {!isDoneSec&&!isExp&&
            <div style={{position:"absolute" as const,left:3,top:0,bottom:0,width:16,
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"#c7d2db",fontSize:13,cursor:"grab",userSelect:"none" as const,letterSpacing:"-1px",
              opacity:isHov?1:0,transition:"opacity .15s",pointerEvents:"none" as const}}>⠿</div>}

          {/* 완료 토글 */}
          <button onClick={e=>{e.stopPropagation();handleSideComplete(t.id,isDone);}}
            style={{width:18,height:18,borderRadius:"50%",flexShrink:0,marginTop:2,
              border:`1.5px solid ${isDone?"#22c55e":isHov&&!isDoneSec?"#4ade80":"#d1d5db"}`,
              background:isDone?"#22c55e":"transparent",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:10,color:"#fff",padding:0,
              transition:"border-color .2s,background .2s",boxSizing:"border-box" as const}}>
            {isDone&&<CheckIcon style={{width:10,height:10}}/>}
          </button>

          {/* 내용 */}
          <div style={{flex:1,minWidth:0}} onClick={e=>e.stopPropagation()}>
            {/* 제목 */}
            {isEd
              ?<input autoFocus value={sidebarEditVal}
                onChange={e=>setSidebarEditVal(e.target.value)}
                onBlur={()=>{if(sidebarEditVal.trim())updTodo(t.id,{task:sidebarEditVal.trim()});setSidebarEditId(null);}}
                onKeyDown={e=>{if(e.key==="Enter"){if(sidebarEditVal.trim())updTodo(t.id,{task:sidebarEditVal.trim()});setSidebarEditId(null);}else if(e.key==="Escape")setSidebarEditId(null);}}
                onClick={ev=>ev.stopPropagation()}
                style={{width:"100%",border:"none",borderBottom:"1.5px solid #2563eb",outline:"none",fontSize:13,fontWeight:500,color:"#0f172a",background:"transparent",padding:"0 0 2px",fontFamily:"inherit"}}
              />
              :<div style={{display:"flex",alignItems:"center",gap:4}}>
                <div
                  onClick={ev=>{ev.stopPropagation();if(!isDoneSec){sidebarExpand(isExp?null:t.id);setSidebarDateId(null);}}}
                  title={isExp?"접기 (클릭)":"펼치기"}
                  style={{fontSize:13,fontWeight:isDone?400:500,flex:1,minWidth:0,
                    color:isDone?"#b0bec5":od&&!isDone?"#c0392b":"#1e293b",
                    textDecoration:isDone?"line-through":"none",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,
                    cursor:isDoneSec?"default":"pointer",
                    display:"flex",alignItems:"center",gap:4,lineHeight:"1.4"}}>
                  {t.repeat&&t.repeat!=="없음"&&<RepeatBadge repeat={t.repeat}/>}
                  {t.task}
                </div>
                {isExp&&!isDoneSec&&<button
                  onClick={ev=>{ev.stopPropagation();setSidebarEditId(t.id);setSidebarEditVal(t.task);}}
                  title="이름 수정"
                  style={{background:"none",border:"none",cursor:"pointer",color:"#c7d2db",fontSize:12,padding:"1px 3px",borderRadius:3,flexShrink:0,lineHeight:1,fontFamily:"inherit"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color="#2563eb"}
                  onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color="#c7d2db"}><PencilSquareIcon style={ICON_SM}/></button>}
              </div>}

            {/* 비확장: 메타 (날짜 / 프로젝트 + 우선순위) */}
            {!isExp&&<div style={{display:"flex",flexDirection:"column",gap:2,marginTop:3}}>
              {dueDateStr&&<span style={{fontSize:11,color:od&&!isDone?"#e53e3e":"#94a3b8",lineHeight:"16px"}}>
                {od&&!isDone&&<ExclamationTriangleIcon style={{...ICON_SM,display:"inline"}}/>}{dueDateStr}
              </span>}
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,color:"#b0bec5"}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:p.color||"#94a3b8",display:"inline-block",flexShrink:0}}/>
                  {p.name}
                </span>
                {t.pri&&t.pri!=="보통"&&<span style={{...S.badge(priBg[t.pri],priC[t.pri]),fontSize:10}}>{t.pri}</span>}
              </div>
            </div>}

            {/* 확장: 세부정보 + 날짜 컨트롤 */}
            {isExp&&<div onClick={ev=>ev.stopPropagation()}>
              {/* 세부정보 */}
              <div style={{marginTop:6,display:"flex",alignItems:"flex-start",gap:6}}>
                <span style={{color:"#94a3b8",marginTop:2,flexShrink:0}}><Bars3Icon style={ICON_SM}/></span>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  data-det-ph="세부정보 추가"
                  ref={el=>{
                    if(el){
                      detDivRefs.current.set(t.id,el);
                      if(document.activeElement!==el) el.innerHTML=t.det||"";
                    } else {
                      detDivRefs.current.delete(t.id);
                    }
                  }}
                  onFocus={()=>setSidebarDetId(t.id)}
                  onBlur={e=>{
                    const html=e.currentTarget.innerHTML==="<br>"?"":e.currentTarget.innerHTML;
                    if(html!==(t.det||"")) updTodo(t.id,{det:html});
                    setSidebarDetId(null);
                  }}
                  onKeyDown={ev=>{
                    if(!(ev.ctrlKey||ev.metaKey)) return;
                    const cmds: Record<string,string>={b:"bold",i:"italic",u:"underline",s:"strikeThrough"};
                    const cmd=cmds[ev.key.toLowerCase()];
                    if(cmd){ev.preventDefault();(document as any).execCommand(cmd,false);}
                  }}
                  onClick={ev=>ev.stopPropagation()}
                  style={{flex:1,minHeight:36,outline:"none",fontSize:12,color:"#475569",
                    lineHeight:1.6,borderBottom:"1px solid #e2e8f0",paddingBottom:2,
                    wordBreak:"break-word" as const,fontFamily:"inherit"}}
                />
              </div>
              {/* 날짜 */}
              <div style={{marginTop:8}}>
                <button onClick={()=>setSidebarDateId(sidebarDateId===t.id?null:t.id)}
                  style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,
                    padding:"3px 8px",borderRadius:10,
                    border:`1px solid ${od&&!isDone?"#fecaca":"#e2e8f0"}`,
                    background:od&&!isDone?"#fef2f2":"#f8fafc",
                    color:od&&!isDone?"#e53e3e":"#475569",
                    cursor:"pointer",fontFamily:"inherit"}}>
                  <CalendarIcon style={ICON_SM}/> {dueDateStr||"날짜 추가"}
                  {dueDateStr&&<span onClick={ev=>{ev.stopPropagation();updTodo(t.id,{due:""});setSidebarDateId(null);}}
                    style={{marginLeft:2,color:"#94a3b8",fontSize:12,lineHeight:1}}>×</span>}
                </button>
              </div>
              {/* 프로젝트 + 우선순위 (날짜 아래) */}
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6}}>
                <div style={{position:"relative" as const}}>
                  <button onClick={ev=>{ev.stopPropagation();setSidebarProjId(sidebarProjId===t.id?null:t.id);setSidebarDateId(null);}}
                    style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,color:"#64748b",
                      border:"1px solid #e2e8f0",borderRadius:8,padding:"2px 7px",
                      background:"#f8fafc",cursor:"pointer",fontFamily:"inherit"}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:p.color||"#94a3b8",display:"inline-block",flexShrink:0}}/>
                    {p.name}<span style={{fontSize:8,color:"#94a3b8",marginLeft:1}}>▾</span>
                  </button>
                  {sidebarProjId===t.id&&<div onClick={ev=>ev.stopPropagation()}
                    style={{position:"absolute" as const,top:"calc(100% + 2px)",left:0,zIndex:200,
                      background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,
                      boxShadow:"0 4px 16px rgba(0,0,0,.12)",minWidth:140,overflow:"hidden"}}>
                    {visibleProj.map(pr=><div key={pr.id}
                      onClick={()=>{updTodo(t.id,{pid:pr.id});setSidebarProjId(null);}}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",
                        cursor:"pointer",fontSize:12,color:"#334155",
                        background:pr.id===t.pid?"#eff6ff":"transparent"}}
                      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=pr.id===t.pid?"#eff6ff":"#f8fafc"}
                      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=pr.id===t.pid?"#eff6ff":"transparent"}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:pr.color,display:"inline-block",flexShrink:0}}/>
                      {pr.name}
                      {pr.id===t.pid&&<span style={{marginLeft:"auto",display:"inline-flex"}}><CheckIcon style={{width:12,height:12,color:"#2563eb"}}/></span>}
                    </div>)}
                  </div>}
                </div>
                {t.pri&&t.pri!=="보통"&&<span style={{...S.badge(priBg[t.pri],priC[t.pri]),fontSize:10}}>{t.pri}</span>}
              </div>
              {/* 날짜 선택 모달 */}
              {sidebarDateId===t.id&&
                <div onClick={ev=>ev.stopPropagation()} style={{marginTop:6,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 10px"}}>
                  <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap" as const}}>
                    {([["오늘",0],["내일",1],["다음 주",7]] as [string,number][]).map(([l,n])=>
                      <button key={l} onClick={()=>{updTodo(t.id,{due:qDays(n)});setSidebarDateId(null);}}
                        style={{fontSize:10,padding:"2px 8px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#334155",fontFamily:"inherit"}}>{l}</button>)}
                  </div>
                  <input type="date"
                    defaultValue={t.due?.split(" ")[0]||""}
                    onChange={e=>{if(e.target.value){updTodo(t.id,{due:e.target.value});setSidebarDateId(null);}}}
                    style={{width:"100%",fontSize:11,padding:"3px 6px",border:"1px solid #e2e8f0",borderRadius:8,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const,background:"#fff"}}
                  />
                </div>}
              {/* 접기 + 삭제 */}
              <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button onClick={ev=>{ev.stopPropagation();sidebarExpand(null);setSidebarDateId(null);}}
                  style={{fontSize:11,padding:"3px 8px",borderRadius:8,border:"1px solid #e2e8f0",
                    background:"#f8fafc",color:"#94a3b8",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>
                  <span style={{fontSize:10}}>▲</span> 접기
                </button>
                <button onClick={ev=>{ev.stopPropagation();if(confirm(`"${t.task}" 삭제?`)){delTodo(t.id);sidebarExpand(null);}}}
                  style={{fontSize:11,padding:"3px 10px",borderRadius:8,border:"1px solid #fecaca",
                    background:"#fef2f2",color:"#ef4444",cursor:"pointer",fontFamily:"inherit"}}>
                  삭제
                </button>
              </div>
            </div>}
          </div>

          {/* ★ 즐겨찾기 — 항상 우상단 표시 */}
          {!isDoneSec&&
            <button onClick={e=>{e.stopPropagation();toggleStar(t.id);}}
              title={isStarred?"즐겨찾기 해제":"즐겨찾기"}
              style={{position:"absolute" as const,right:5,top:isExp?10:9,
                width:24,height:24,border:"none",background:"transparent",
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,color:isStarred?"#f59e0b":"#d1d5db",padding:0,
                transition:"color .15s,transform .15s",
                transform:isStarred?"scale(1.1)":"scale(1)"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=isStarred?"#d97706":"#94a3b8";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=isStarred?"#f59e0b":"#d1d5db";}}>
              {isStarred?<StarIcon style={ICON_SM}/>:<StarOutlineIcon style={ICON_SM}/>}
            </button>}
        </div>;
      };

      return <div style={{width:268,flexShrink:0,background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,.10)",border:"1px solid #e2e8f0",position:"sticky",top:102,alignSelf:"flex-start",display:"flex",flexDirection:"column",maxHeight:"calc(100vh - 112px)"}}>
        {/* 헤더: 진행률 바 포함 */}
        <div style={{padding:"12px 14px 8px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:myAll.length>0?7:0}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>나의 할 일</div>
              <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{currentUser} · {active.length}건 진행 · {done.length}건 완료</div>
            </div>
            <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(currentUser||"")},${avColor2(currentUser||"")})`,fontSize:14,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,flexShrink:0}}>{(currentUser||"?").slice(-1)}</div>
          </div>
          {/* 진행률 바 */}
          {myAll.length>0&&<div style={{height:3,borderRadius:99,background:"#e2e8f0",overflow:"hidden"}} title={`${pct}% 완료`}>
            <div style={{height:"100%",width:`${pct}%`,background:pct===100?"#22c55e":"#2563eb",borderRadius:99,transition:"width .4s"}}/>
          </div>}
        </div>
        {/* 업무 추가 — 인라인 입력 */}
        <div style={{padding:"8px 12px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
          {calSidebarAdding
            ?<div onClick={e=>e.stopPropagation()}>
              <input autoFocus value={calSidebarAddTitle}
                onChange={e=>setCalSidebarAddTitle(e.target.value)}
                onKeyDown={e=>{
                  if(e.key==="Enter"&&calSidebarAddTitle.trim()){
                    addTodo({pid:0,task:calSidebarAddTitle.trim(),who:currentUser||"",due:todayStr,pri:"보통",st:"대기",det:"",repeat:"없음"});
                    setCalSidebarAddTitle("");setCalSidebarAdding(false);flash("업무가 등록되었습니다");
                  }
                  if(e.key==="Escape"){setCalSidebarAdding(false);setCalSidebarAddTitle("");}
                }}
                placeholder="업무 제목 입력 후 Enter..."
                style={{width:"100%",padding:"7px 10px",border:"1.5px solid #2563eb",borderRadius:8,fontSize:12,outline:"none",boxSizing:"border-box" as const,fontFamily:"inherit"}}/>
              <div style={{display:"flex",justifyContent:"flex-end",gap:4,marginTop:5}}>
                <button onClick={()=>{setCalSidebarAdding(false);setCalSidebarAddTitle("");}}
                  style={{fontSize:11,padding:"4px 8px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#64748b",fontFamily:"inherit"}}>취소</button>
                <button onClick={()=>{if(calSidebarAddTitle.trim()){addTodo({pid:0,task:calSidebarAddTitle.trim(),who:currentUser||"",due:todayStr,pri:"보통",st:"대기",det:"",repeat:"없음"});setCalSidebarAddTitle("");setCalSidebarAdding(false);flash("업무가 등록되었습니다");}}}
                  style={{fontSize:11,padding:"3px 12px",borderRadius:6,border:"none",background:"#2563eb",cursor:"pointer",color:"#fff",fontFamily:"inherit",fontWeight:600}}>추가</button>
              </div>
            </div>
            :<button onClick={()=>setCalSidebarAdding(true)}
              style={{width:"100%",padding:"8px",border:"1.5px dashed #e2e8f0",borderRadius:8,background:"#f8fafc",cursor:"pointer",fontSize:12,color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontFamily:"inherit",transition:"all .2s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#93c5fd";(e.currentTarget as HTMLButtonElement).style.color="#2563eb";(e.currentTarget as HTMLButtonElement).style.background="#eff6ff";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#e2e8f0";(e.currentTarget as HTMLButtonElement).style.color="#94a3b8";(e.currentTarget as HTMLButtonElement).style.background="#f8fafc";}}>
              + 업무 추가
            </button>}
        </div>
        {/* 목록 — flex:1 + overflowY:auto 로 남은 높이 채움 */}
        <div style={{flex:1,overflowY:"auto"}}>
          {animating.map(t=>renderTodo(t))}
          {secNoDate.length>0&&<SecHdr label="날짜 없음" count={secNoDate.length} open={secNodateOpen} onToggle={()=>setSecNodateOpen(v=>!v)}/>}
          {secNodateOpen&&secNoDate.map(t=>renderTodo(t))}
          {secToday.length>0&&<SecHdr label="오늘" count={secToday.length} open={secTodayOpen} onToggle={()=>setSecTodayOpen(v=>!v)}/>}
          {secTodayOpen&&secToday.map(t=>renderTodo(t))}
          {secWeek.length>0&&<SecHdr label="이번 주" count={secWeek.length} open={secWeekOpen} onToggle={()=>setSecWeekOpen(v=>!v)}/>}
          {secWeekOpen&&secWeek.map(t=>renderTodo(t))}
          {secLater.length>0&&<SecHdr label="나중에" count={secLater.length} open={secLaterOpen} onToggle={()=>setSecLaterOpen(v=>!v)}/>}
          {secLaterOpen&&secLater.map(t=>renderTodo(t))}
          {active.length===0&&animating.length===0&&
            <div style={{padding:"28px 16px 12px",textAlign:"center",color:"#cbd5e1",fontSize:12,lineHeight:1.8}}>
              <div style={{marginBottom:6}}><CheckCircleIcon style={{width:26,height:26}}/></div>
              <div>할일이 없습니다</div>
              <div style={{fontSize:10,marginTop:3,color:"#d1d5db"}}>위 버튼으로 추가하세요 ↑</div>
            </div>}
          {done.length>0&&<>
            <button onClick={()=>setSidebarDoneOpen(v=>!v)}
              style={{width:"100%",padding:"10px 12px",border:"none",borderTop:"1px solid #f1f5f9",background:"#fafafa",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:"#64748b",textAlign:"left" as const,fontFamily:"inherit"}}>
              <span style={{fontSize:8,display:"inline-block",transform:sidebarDoneOpen?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
              완료됨 <span style={{color:"#94a3b8",fontWeight:400}}>{done.length}</span>
            </button>
            {sidebarDoneOpen&&done.map(t=>renderTodo(t,true))}
          </>}
        </div>
      </div>;
    })()}

    {/* ── 이벤트 상세 팝오버 ─────────────────────────────────── */}
    {calEvPop&&(()=>{const t=calEvPop.todo;const p=gPr(t.pid);const od=isOD(t.due,t.st);const isInst=!!t._instance;return(
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",left:calEvPop.x,top:calEvPop.y,zIndex:9100,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.20)",border:`1px solid ${isInst?"#93c5fd":"#e2e8f0"}`,width:296}}>
        {/* 반복 인스턴스 안내 배너 */}
        {isInst&&<div style={{padding:"6px 14px",background:"#eff6ff",borderRadius:"12px 12px 0 0",fontSize:10,color:"#2563eb",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
          <ArrowPathIcon style={{width:12,height:12}}/> 반복 일정 · 원본 날짜: {t._originDue}
        </div>}
        <div style={{padding:"12px 14px 10px",display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:4,borderRadius:2,background:p.color,flexShrink:0,minHeight:48,alignSelf:"stretch",opacity:isInst?.6:1}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:6,lineHeight:1.3}}>
              {t.task}{od&&<span style={{color:"#dc2626",marginLeft:4,display:"inline-flex"}}><ExclamationTriangleIcon style={ICON_SM}/></span>}
            </div>
            <div style={{fontSize:11,color:"#64748b",display:"flex",flexDirection:"column" as const,gap:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:p.color,display:"inline-block",flexShrink:0}}/><span style={{color:p.color,fontWeight:600}}>{p.name}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:3}}><UserIcon style={ICON_SM}/> {t.who||"미배정"}</div>
              {t.due&&<div style={{display:"flex",alignItems:"center",gap:3}}><CalendarIcon style={ICON_SM}/> {t.due}</div>}
            </div>
            <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap" as const}}>
              <span style={{...S.badge(priBg[t.pri],priC[t.pri]),fontSize:10}}>{t.pri}</span>
              <span style={{...S.badge(stBg[t.st],stC[t.st]),fontSize:10}}>{t.st}</span>
              {t.repeat&&t.repeat!=="없음"&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#f0fdf4",color:"#16a34a",display:"inline-flex",alignItems:"center",gap:2}}><ArrowPathIcon style={ICON_SM}/> {t.repeat}</span>}
            </div>
          </div>
          <button onClick={()=>setCalEvPop(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:"0 2px",flexShrink:0,lineHeight:1,display:"flex",alignItems:"center"}}><XMarkIcon style={ICON_SM}/></button>
        </div>
        <div style={{padding:"8px 14px 12px",borderTop:"1px solid #f1f5f9",display:"flex",gap:6}}>
          {/* 반복 인스턴스는 원본 수정 버튼으로 안내, 일반 업무는 직접 수정 */}
          <button onClick={()=>{setEditMod(isInst?{...t,due:t._originDue}:t);setCalEvPop(null);}} style={{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,color:"#475569",fontWeight:500,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:3}}><PencilSquareIcon style={ICON_SM}/> {isInst?"원본 수정":"수정"}</button>
          {t.st!=="완료"&&!isInst&&<button onClick={()=>{updTodo(t.id,{st:"완료",done:todayStr});setCalEvPop(null);flash("완료 처리되었습니다");}} style={{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid #bbf7d0",background:"#f0fdf4",cursor:"pointer",fontSize:12,color:"#16a34a",fontWeight:600,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:3}}><CheckIcon style={{width:12,height:12}}/> 완료</button>}
          {!isInst&&<button onClick={()=>{if(confirm(`"${t.task}" 업무를 삭제하시겠습니까?`)){delTodo(t.id);setCalEvPop(null);}}} style={{padding:"6px 10px",borderRadius:6,border:"1px solid #fca5a5",background:"#fff5f5",cursor:"pointer",fontSize:12,color:"#dc2626",display:"inline-flex",alignItems:"center"}}><TrashIcon style={ICON_SM}/></button>}
        </div>
      </div>
    );})()}

    {/* ── 빠른 업무 추가 팝오버 ──────────────────────────────── */}
    {calQA&&(()=>{
      const qd=(n:number)=>{const d=new Date(calQA.ds);d.setDate(d.getDate()+n);return dateStr(d.getFullYear(),d.getMonth(),d.getDate());};
      const selProj=visibleProj.find(p=>String(p.id)===calQAPid);
      const iconBtn=(active:boolean)=>({display:"inline-flex",alignItems:"center",gap:3,fontSize:11,padding:"3px 8px",borderRadius:99,border:`1px solid ${active?"#2563eb":"#e2e8f0"}`,background:active?"#eff6ff":"#f8fafc",color:active?"#2563eb":"#64748b",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" as const});
      return <div onClick={e=>e.stopPropagation()} style={{position:"fixed",left:calQA.x,top:calQA.y,zIndex:9100,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.20)",border:"1.5px solid #2563eb",width:300}}>
        <div style={{padding:"12px 14px 8px"}}>
          <input autoFocus value={calQATitle} onChange={e=>setCalQATitle(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")saveQA();if(e.key==="Escape"){setCalQA(null);setCalQATitle("");}}}
            placeholder="업무 제목 입력..."
            style={{width:"100%",padding:"8px 10px",border:"1.5px solid #2563eb",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box" as const}}/>
          {/* 아이콘 빠른선택 */}
          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap" as const}}>
            <button style={iconBtn(!!calQADue)} onClick={()=>setCalQAPicker(calQAPicker==="date"?null:"date")}>
              <CalendarIcon style={ICON_SM}/> {calQADue?calQADue.slice(5).replace("-","/"):"날짜"}
              {calQADue&&<span onClick={ev=>{ev.stopPropagation();setCalQADue("");setCalQAPicker(null);}} style={{marginLeft:2,color:"#94a3b8"}}>×</span>}
            </button>
            <button style={iconBtn(!!calQAPid)} onClick={()=>setCalQAPicker(calQAPicker==="proj"?null:"proj")}>
              <FolderIcon style={ICON_SM}/> {selProj?<><span style={{width:6,height:6,borderRadius:"50%",background:selProj.color,display:"inline-block"}}/>{selProj.name}</>:"프로젝트"}
            </button>
            <button style={iconBtn(!!calQAWho&&calQAWho!==currentUser)} onClick={()=>setCalQAPicker(calQAPicker==="who"?null:"who")}>
              <UserIcon style={ICON_SM}/> {calQAWho||"담당자"}
            </button>
            <button style={iconBtn(calQAPri!=="보통")} onClick={()=>setCalQAPicker(calQAPicker==="pri"?null:"pri")}>
              <BoltIcon style={ICON_SM}/> {calQAPri}
            </button>
          </div>
          {/* 피커 패널 */}
          {calQAPicker==="date"&&<div style={{marginTop:8,padding:"8px 10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap" as const}}>
              <button onClick={()=>{setCalQADue(calQA.ds);setCalQAPicker(null);}} style={{fontSize:10,padding:"2px 8px",borderRadius:99,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#334155",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:2}}><CalendarIcon style={ICON_SM}/> {calQA.ds.slice(5).replace("-","/")}</button>
              {([["오늘",0],["내일",1],["다음주",7]] as [string,number][]).map(([l,n])=>
                <button key={l} onClick={()=>{setCalQADue(qd(n));setCalQAPicker(null);}} style={{fontSize:10,padding:"2px 8px",borderRadius:99,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",color:"#334155",fontFamily:"inherit"}}>{l}</button>)}
            </div>
            <input type="date" defaultValue={calQADue} onChange={e=>{setCalQADue(e.target.value);setCalQAPicker(null);}} style={{width:"100%",fontSize:11,padding:"3px 6px",border:"1px solid #e2e8f0",borderRadius:7,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const}}/>
          </div>}
          {calQAPicker==="proj"&&<div style={{marginTop:8,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden",maxHeight:160,overflowY:"auto" as const}}>
            {visibleProj.map(pr=><div key={pr.id} onClick={()=>{setCalQAPid(String(pr.id));setCalQAPicker(null);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",cursor:"pointer",fontSize:12,color:"#334155",background:String(pr.id)===calQAPid?"#eff6ff":"transparent"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=String(pr.id)===calQAPid?"#eff6ff":"#f1f5f9"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=String(pr.id)===calQAPid?"#eff6ff":"transparent"}>
              <span style={{width:8,height:8,borderRadius:"50%",background:pr.color,display:"inline-block",flexShrink:0}}/>
              {pr.name}{String(pr.id)===calQAPid&&<span style={{marginLeft:"auto",display:"inline-flex"}}><CheckIcon style={{width:12,height:12,color:"#2563eb"}}/></span>}
            </div>)}
          </div>}
          {calQAPicker==="who"&&<div style={{marginTop:8,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden",maxHeight:160,overflowY:"auto" as const}}>
            {visibleMembers.map(m=><div key={m} onClick={()=>{setCalQAWho(m);setCalQAPicker(null);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",cursor:"pointer",fontSize:12,color:"#334155",background:m===calQAWho?"#eff6ff":"transparent"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=m===calQAWho?"#eff6ff":"#f1f5f9"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=m===calQAWho?"#eff6ff":"transparent"}>
              {m}{m===calQAWho&&<span style={{marginLeft:"auto",display:"inline-flex"}}><CheckIcon style={{width:12,height:12,color:"#2563eb"}}/></span>}
            </div>)}
          </div>}
          {calQAPicker==="pri"&&<div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap" as const}}>
            {pris.map(pr=><button key={pr} onClick={()=>{setCalQAPri(pr);setCalQAPicker(null);}}
              style={{fontSize:10,padding:"3px 10px",borderRadius:99,border:`1px solid ${calQAPri===pr?"#2563eb":"#e2e8f0"}`,background:calQAPri===pr?"#eff6ff":"#f8fafc",color:calQAPri===pr?"#2563eb":"#64748b",cursor:"pointer",fontFamily:"inherit",fontWeight:calQAPri===pr?700:400}}>{pr}</button>)}
          </div>}
        </div>
        <div style={{padding:"0 14px 12px",display:"flex",gap:6}}>
          <button onClick={()=>{setCalQA(null);setCalQATitle("");}} style={{padding:"6px 12px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,color:"#64748b"}}>취소</button>
          <button onClick={saveQA} disabled={!calQATitle.trim()} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:calQATitle.trim()?"#2563eb":"#cbd5e1",cursor:calQATitle.trim()?"pointer":"default",fontSize:12,color:"#fff",fontWeight:600}}>저장</button>
          <button onClick={()=>{setEditMod({pid:calQAPid,task:calQATitle.trim(),who:calQAWho,due:calQADue,pri:calQAPri,st:"대기",det:"",repeat:"없음"});setCalQA(null);setCalQATitle("");}}
            style={{padding:"6px 10px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:12,color:"#475569"}}>더보기</button>
        </div>
      </div>;
    })()}

    {/* ── 월 뷰 날짜 더보기 팝오버 ──────────────────────────── */}
    {calDayPop&&<div onClick={e=>e.stopPropagation()} style={{position:"fixed",left:calDayPop.x,top:calDayPop.y,zIndex:9100,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.20)",border:"1px solid #e2e8f0",width:280,maxHeight:360,display:"flex",flexDirection:"column" as const}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:12,fontWeight:700,color:"#334155",display:"flex",alignItems:"center",gap:3}}><CalendarIcon style={ICON_SM}/> {calDayPop.ds.slice(5).replace("-","/")} <span style={{color:"#94a3b8",fontWeight:400}}>({calDayPop.todos.length}건)</span></div>
        <button onClick={()=>setCalDayPop(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",lineHeight:1,display:"flex",alignItems:"center"}}><XMarkIcon style={ICON_SM}/></button>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"6px 8px"}}>
        {calDayPop.todos.map((t,ii)=>{const p=gPr(t.pid);return(
          <div key={t.id+"_"+ii} onClick={e=>openEvPop(e,t)} style={{padding:"6px 10px",borderRadius:7,borderLeft:`3px solid ${p.color}`,background:`${p.color}10`,cursor:"pointer",marginBottom:4,transition:"background .1s"}}
            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=`${p.color}22`}
            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=`${p.color}10`}>
            <div style={{fontSize:12,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.task}</div>
            <div style={{fontSize:10,color:"#94a3b8",display:"flex",gap:6,marginTop:2}}>
              <span>{t.who||"미배정"}</span>
              <span style={S.badge(stBg[t.st],stC[t.st])}>{t.st}</span>
            </div>
          </div>
        );})}
      </div>
      <div style={{padding:"8px 14px",borderTop:"1px solid #f1f5f9",flexShrink:0}}>
        <button onClick={()=>{const d=new Date(calDayPop.ds);setCalDate(d);setCalView("day");setCalDayPop(null);}}
          style={{width:"100%",padding:"6px",borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontSize:11,color:"#475569"}}>일 뷰로 이동</button>
      </div>
    </div>}
  </div>;
}
