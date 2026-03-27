import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

const INIT_MEMBERS = ["김대윤","김현지","복경민","박정찬","이연수","김혜민"];
const INIT_PRI = ["긴급","높음","보통","낮음"];
const INIT_ST = ["대기","진행중","검토","완료"];
const INIT_PRI_C = {긴급:"#dc2626",높음:"#d97706",보통:"#2563eb",낮음:"#94a3b8"};
const INIT_PRI_BG = {긴급:"#fef2f2",높음:"#fff7ed",보통:"#eff6ff",낮음:"#f8fafc"};
const INIT_ST_C = {대기:"#64748b",진행중:"#2563eb",검토:"#d97706",완료:"#16a34a"};
const INIT_ST_BG = {대기:"#f1f5f9",진행중:"#dbeafe",검토:"#fef3c7",완료:"#dcfce7"};
const REPEAT_OPTS = ["없음","매일","매주","매월"];
const PROJ_PALETTE = ["#8b5cf6","#14b8a6","#2563eb","#f59e0b","#ef4444","#10b981","#f97316","#ec4899","#6366f1","#84cc16","#06b6d4","#a855f7","#0ea5e9","#d946ef","#f43f5e","#64748b"];
const REPEAT_LABEL = {없음:"",매일:"🔁 매일",매주:"🔁 매주",매월:"🔁 매월"};

const initProj = [
  {id:1,name:"만화웹툰2026아시아",color:"#8b5cf6",status:"활성"},
  {id:2,name:"유녹2026아시아",color:"#14b8a6",status:"활성"},
  {id:3,name:"WATER2026구매",color:"#2563eb",status:"활성"},
  {id:4,name:"WATER2026수출",color:"#f59e0b",status:"활성"}
];
const initTodos = [
  {id:1,pid:1,task:"중국 시안 디자인 확인",who:"김현지",due:"2026-04-02",pri:"긴급",st:"진행중",det:"착수보고 전까지 완료 필요",cre:"2026-03-26",done:null,repeat:"없음",progress:60},
  {id:2,pid:1,task:"참가기업 배포 메일 작성",who:"김대윤",due:"2026-04-07",pri:"높음",st:"대기",det:"강하나 차장에게 전달",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:3,pid:1,task:"중국 샘플북 인쇄 발주",who:"복경민",due:"2026-04-14",pri:"보통",st:"대기",det:"기업별 3권씩 별도 제작",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:4,pid:2,task:"니카이 컨퍼런스 장소 컨펌",who:"김혜민",due:"2026-03-30",pri:"긴급",st:"검토",det:"CKL도쿄 대관 가능 여부 확인",cre:"2026-03-26",done:null,repeat:"없음",progress:75},
  {id:5,pid:2,task:"일본 사전간담회 자료 준비",who:"김현지",due:"2026-04-17",pri:"높음",st:"대기",det:"4월 21일 역삼 간담회용",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:6,pid:2,task:"일본 자료제작 방향 정리",who:"이연수",due:"2026-04-10",pri:"보통",st:"진행중",det:"내부 논의 후 결정",cre:"2026-03-26",done:null,repeat:"없음",progress:40},
  {id:7,pid:3,task:"해외 바이어 리스트 정리",who:"박정찬",due:"2026-04-05",pri:"높음",st:"진행중",det:"아시아 지역 우선",cre:"2026-03-26",done:null,repeat:"없음",progress:55},
  {id:8,pid:3,task:"구매상담회 부스 배치안 작성",who:"김대윤",due:"2026-04-12",pri:"보통",st:"대기",det:"",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:9,pid:3,task:"통역 인력 섭외",who:"이연수",due:"2026-04-08",pri:"낮음",st:"완료",det:"중국어/일본어 각 2명",cre:"2026-03-26",done:"2026-03-25",repeat:"없음",progress:100},
  {id:10,pid:4,task:"수출 상담 매칭 시스템 점검",who:"복경민",due:"2026-04-03",pri:"긴급",st:"진행중",det:"매칭 알고리즘 테스트",cre:"2026-03-26",done:null,repeat:"없음",progress:30},
  {id:11,pid:4,task:"참가기업 홍보물 제작 지원",who:"박정찬",due:"2026-04-18",pri:"보통",st:"대기",det:"굿즈 vs 자체 프로모션 결정 필요",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:12,pid:4,task:"수출 성과보고서 양식 작성",who:"김혜민",due:"2026-04-22",pri:"낮음",st:"대기",det:"전년도 양식 기반 업데이트",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:13,pid:1,task:"토/일 프로그램 기획안",who:"김대윤",due:"2026-04-09",pri:"높음",st:"대기",det:"주말 프로그램 구성 고민",cre:"2026-03-26",done:null,repeat:"없음",progress:10},
  {id:14,pid:2,task:"CKL 착수보고 자료 준비",who:"복경민",due:"2026-04-10",pri:"긴급",st:"대기",det:"4월 10일 금요일 보고",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:15,pid:3,task:"중국 사전간담회 장소 예약",who:"김혜민",due:"2026-04-14",pri:"보통",st:"완료",det:"4월 14일 화 역삼",cre:"2026-03-26",done:"2026-03-26",repeat:"없음",progress:100},
  {id:16,pid:4,task:"북경센터 컨택포인트 연락",who:"이연수",due:"2026-03-28",pri:"긴급",st:"검토",det:"153㎡ 변경건 소통",cre:"2026-03-26",done:null,repeat:"없음",progress:50},
  {id:17,pid:2,task:"가예약 장소 기한 확인",who:"김혜민",due:"2026-03-29",pri:"높음",st:"진행중",det:"니카이 + 대체장소",cre:"2026-03-26",done:null,repeat:"없음",progress:70},
  {id:18,pid:4,task:"전시장 브로셔 컨택 정리",who:"김현지",due:"2026-04-01",pri:"보통",st:"대기",det:"브릿징 통해 직접 연락",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:19,pid:1,task:"주간 진행상황 팀 공유",who:"김대윤",due:"2026-03-31",pri:"보통",st:"대기",det:"매주 월요일 슬랙 보고",cre:"2026-03-26",done:null,repeat:"매주",progress:0},
  {id:20,pid:3,task:"일일 바이어 문의 확인",who:"박정찬",due:"2026-03-26",pri:"높음",st:"대기",det:"이메일 및 메신저 확인",cre:"2026-03-26",done:null,repeat:"매일",progress:0},
];

const td = () => new Date().toISOString().slice(0,10);
const isOD = (d,s) => s!=="완료"&&d&&new Date(d.split(" ")[0])<new Date(new Date().toDateString());
const dDay = (d,s) => {
  if(!d||s==="완료")return null;
  const today=new Date(new Date().toDateString());
  const due=new Date(d.split(" ")[0]);
  const diff=Math.round((due.getTime()-today.getTime())/(1000*60*60*24));
  if(diff===0)return{label:"D-day",color:"#dc2626",bg:"#fef2f2",border:"#fca5a5"};
  if(diff<0)return{label:`D+${Math.abs(diff)}`,color:"#dc2626",bg:"#fef2f2",border:"#fca5a5"};
  if(diff<=3)return{label:`D-${diff}`,color:"#d97706",bg:"#fff7ed",border:"#fcd34d"};
  if(diff<=7)return{label:`D-${diff}`,color:"#2563eb",bg:"#eff6ff",border:"#93c5fd"};
  return{label:`D-${diff}`,color:"#64748b",bg:"#f8fafc",border:"#e2e8f0"};
};
const gP = (ps,id) => ps.find(p=>p.id===id)||{id:0,name:"미분류",color:"#94a3b8"};
const fD = d => d?d.slice(5).replace("-","/"):"—";
const DOW = ["일","월","화","수","목","금","토"];
const fDow = d => { if(!d) return ""; const dt=new Date(d.split(" ")[0]); return isNaN(dt.getTime())?"":DOW[dt.getDay()]; };
const fmt2 = n => String(n).padStart(2,"0");
const dateStr = (y,m,d) => `${y}-${fmt2(m+1)}-${fmt2(d)}`;
const stripHtml = h => h ? h.replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").trim() : "";

function expandRepeats(todos, startDs, endDs) {
  const result = [];
  const start = new Date(startDs);
  const end = new Date(endDs);
  todos.forEach(t => {
    if (!t.repeat || t.repeat === "없음") {
      if (t.due >= startDs && t.due <= endDs) result.push({...t, _instance: false});
      return;
    }
    if (!t.due) { result.push({...t, _instance: false}); return; }
    let cur = new Date(t.due);
    while (cur > start) {
      if (t.repeat === "매일") cur.setDate(cur.getDate() - 1);
      else if (t.repeat === "매주") cur.setDate(cur.getDate() - 7);
      else if (t.repeat === "매월") cur.setMonth(cur.getMonth() - 1);
      else break;
    }
    while (cur <= end) {
      const ds = dateStr(cur.getFullYear(), cur.getMonth(), cur.getDate());
      if (ds >= startDs && ds <= endDs) result.push({...t, due: ds, _instance: ds !== t.due, _originDue: t.due});
      if (t.repeat === "매일") cur.setDate(cur.getDate() + 1);
      else if (t.repeat === "매주") cur.setDate(cur.getDate() + 7);
      else if (t.repeat === "매월") cur.setMonth(cur.getMonth() + 1);
      else break;
    }
  });
  return result;
}

const S = {
  wrap:{fontFamily:"'Pretendard', system-ui, sans-serif",background:"#f0f4f8",minHeight:"100vh",fontSize:13,color:"#1a2332"},
  hdr:{background:"#172f5a",color:"#fff",padding:"0 24px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(23,47,90,.3)"},
  hBtn:{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",fontSize:10,padding:"4px 12px",borderRadius:14,cursor:"pointer",fontWeight:600},
  hBdg:{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:10,padding:"3px 10px",borderRadius:14},
  nav:{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 24px",display:"flex",gap:2,position:"sticky",top:54,zIndex:99},
  navB:(a)=>({padding:"10px 14px",fontSize:12,fontWeight:a?600:500,color:a?"#2563eb":"#64748b",background:a?"#eff6ff":"none",border:"none",borderBottom:a?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}),
  main:{padding:"16px 24px",maxWidth:1400,margin:"0 auto"},
  card:{background:"#fff",borderRadius:10,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,.07)",border:"1px solid #e8edf4"},
  bp:{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Pretendard',system-ui,sans-serif"},
  bs:{background:"#f1f5f9",color:"#334155",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"'Pretendard',system-ui,sans-serif"},
  bd:{background:"#fef2f2",color:"#dc2626",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Pretendard',system-ui,sans-serif"},
  th:{padding:"10px 10px",textAlign:"left",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap",overflow:"hidden",background:"#f8fafc",position:"sticky" as const,top:0,zIndex:2,boxShadow:"0 2px 0 #e2e8f0"},
  tdc:{padding:"10px 10px",fontSize:13,color:"#334155",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  badge:(bg,c,border="1px solid transparent")=>({fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:6,background:bg||"#f1f5f9",color:c||"#64748b",display:"inline-flex",alignItems:"center",gap:4,border}),
  dot:(c)=>({width:6,height:6,borderRadius:"50%",background:c,flexShrink:0,display:"inline-block"}),
  pchip:()=>({display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"#f8fafc",border:"1px solid #e2e8f0",whiteSpace:"nowrap"}),
  iinp:{width:"100%",padding:"4px 6px",border:"1.5px solid #2563eb",borderRadius:5,fontSize:12,outline:"none",background:"#fff",boxShadow:"0 0 0 2px rgba(37,99,235,.12)"},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",padding:20},
  mbox:{background:"#fff",borderRadius:16,width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 10px 25px rgba(0,0,0,.1)"},
  repeatBadge:{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:99,background:"#e0f2fe",color:"#0369a1",display:"inline-flex",alignItems:"center",gap:2,marginLeft:4,whiteSpace:"nowrap"},
};

function Toast({msg,type}){if(!msg)return null;return <div style={{position:"fixed",bottom:24,right:24,background:type==="err"?"#dc2626":"#16a34a",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:12,fontWeight:600,zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,.15)",animation:"slideUp .25s ease",display:"flex",alignItems:"center",gap:6}}>{type==="err"?"❌":"✅"} {msg}</div>;}

function Modal({open,onClose,title,children,footer}){
  if(!open)return null;
  return <div style={S.modal} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div style={S.mbox}>
    <div style={{padding:"16px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:15,fontWeight:800}}>{title}</div><button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#f1f5f9",cursor:"pointer",fontSize:14,color:"#64748b"}}>✕</button></div>
    <div style={{padding:"16px 18px"}}>{children}</div>
    {footer&&<div style={{padding:"0 18px 16px",display:"flex",gap:6,justifyContent:"flex-end"}}>{footer}</div>}
  </div></div>;
}

function Chip({active,color,children,onClick}){return <button onClick={onClick} style={{fontSize:10,padding:"3px 9px",borderRadius:99,border:`1.5px solid ${active?"#2563eb":"#e2e8f0"}`,background:active?"#2563eb":"#fff",color:active?"#fff":"#64748b",cursor:"pointer",fontWeight:active?600:500,display:"inline-flex",alignItems:"center",gap:3}}>{color&&<span style={S.dot(color)}/>}{children}</button>;}

function DropPanel({items,current,onSelect,onClose,renderItem=null,alignRight=false}){
  const anchorRef = useRef(null);
  const [pos, setPos] = useState(null);

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
    const handler = e => { if(!e.target.closest('[data-droppanel]')) onClose(); };
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

function RepeatBadge({repeat}){
  if(!repeat||repeat==="없음")return null;
  return <span style={S.repeatBadge}>🔁 {repeat}</span>;
}

function DateTimePicker({datePop,onSave,onClose}:{datePop:{id:number,rect:DOMRect,value:string}|null,onSave:(id:number,val:string)=>void,onClose:()=>void}){
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
  let left=rect.left,top2=rect.bottom+6;
  if(left+W>window.innerWidth-8)left=window.innerWidth-W-8;
  if(top2+370>window.innerHeight)top2=rect.top-374;
  const firstDow=new Date(navY,navM,1).getDay();
  const startOff=(firstDow+6)%7;
  const dim=new Date(navY,navM+1,0).getDate();
  const cells:( number|null)[]=Array(startOff).fill(null);
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
      {/* 선택된 날짜 표시 */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px 8px",borderBottom:"1px solid #f1f5f9"}}>
        {selDay
          ?<div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
              <span style={{color:"#16a34a",fontSize:14,fontWeight:700}}>✓</span>
              <span style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{selDay.slice(5).replace("-","/")} {timeStr&&<span style={{fontSize:11,color:"#64748b",fontWeight:400}}>{timeStr}</span>}</span>
            </div>
          :<span style={{fontSize:12,color:"#94a3b8",flex:1}}>날짜를 선택하세요</span>}
        <button onClick={()=>setShowTime(p=>!p)} title="시간" style={{background:showTime?"#eff6ff":"none",border:"none",cursor:"pointer",color:showTime?"#2563eb":"#94a3b8",fontSize:13,padding:"3px 5px",borderRadius:5,flexShrink:0}}>⏱</button>
        {selDay&&<button onClick={()=>{onSave(datePop.id,"");onClose();}} title="삭제" style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:13,padding:"3px 5px",borderRadius:5,flexShrink:0}}>✕</button>}
      </div>
      {/* 빠른 날짜 선택 */}
      <div style={{display:"flex",gap:4,padding:"8px 10px",borderBottom:"1px solid #f1f5f9"}}>
        {quickDates.map(({label,ds})=>{const isSel=ds===selDay;return <button key={label} onClick={()=>pickQuick(ds)} style={{flex:1,fontSize:10,fontWeight:isSel?700:500,padding:"5px 2px",borderRadius:6,border:`1px solid ${isSel?"#2563eb":"#e2e8f0"}`,background:isSel?"#eff6ff":"#f8fafc",color:isSel?"#2563eb":"#64748b",cursor:"pointer",whiteSpace:"nowrap" as const}}>{label}</button>;})}
      </div>
      {/* 월 이동 */}
      <div style={{display:"flex",alignItems:"center",padding:"8px 10px 4px"}}>
        <button onClick={prevM} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:17,lineHeight:1,padding:"3px 6px",borderRadius:5}}>‹</button>
        <span style={{flex:1,textAlign:"center",fontSize:13,fontWeight:700,color:"#1e293b"}}>{navY}년 {navM+1}월</span>
        <button onClick={nextM} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:17,lineHeight:1,padding:"3px 6px",borderRadius:5}}>›</button>
      </div>
      {/* 요일 헤더 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 8px 2px"}}>
        {["월","화","수","목","금","토","일"].map((d,i)=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:i===5?"#60a5fa":i===6?"#f87171":"#94a3b8",padding:"2px 0"}}>{d}</div>)}
      </div>
      {/* 날짜 그리드 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 8px 8px",gap:1}}>
        {cells.map((d,i)=>{
          if(d===null)return <div key={`e${i}`}/>;
          const ds=`${navY}-${fmt2(navM+1)}-${fmt2(d)}`;
          const isToday=ds===todayStr,isSel=ds===selDay;
          const col=(startOff+d-1)%7; // 0=Mon
          return <button key={ds} onClick={()=>{setSelDay(ds);if(!showTime)save(ds,timeStr);}} style={{textAlign:"center",fontSize:12,padding:"6px 2px",borderRadius:7,border:"none",cursor:"pointer",background:isSel?"#2563eb":isToday?"#eff6ff":"transparent",color:isSel?"#fff":isToday?"#2563eb":col===5?"#3b82f6":col===6?"#ef4444":"#334155",fontWeight:isSel||isToday?700:400}}>{d}</button>;
        })}
      </div>
      {/* 시간 선택 — 30분 단위 목록 */}
      {showTime&&<div style={{borderTop:"1px solid #f1f5f9"}}>
        <div ref={timeListRef} style={{maxHeight:180,overflowY:"auto",padding:"4px 0"}}>
          {TIME_SLOTS.map(t=>{const isSel=t===timeStr;return <div key={t} data-sel={isSel?"1":undefined} onClick={()=>{setTimeStr(t);save(selDay,t);}} style={{padding:"6px 16px",fontSize:12,cursor:"pointer",background:isSel?"#eff6ff":"transparent",color:isSel?"#2563eb":"#334155",fontWeight:isSel?700:400}} onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}} onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLDivElement).style.background="transparent";}}>{fmt12(t)}</div>;})}
        </div>
      </div>}
    </div>,
    document.body
  );
}

// ── 리치 텍스트 에디터 (모달형 팝업) ─────────────────────────
// ── 클릭형 진행률 박스 ────────────────────────────────────────
function ProgressBar({value=0, onChange}){
  const steps=[25,50,75,100];
  const pct=Math.round((value||0)/25)*25;
  const boxColor=(step)=>step===100?"#16a34a":step===75?"#84cc16":step===50?"#eab308":"#f97316";
  const textColor=pct===100?"#16a34a":pct>=50?"#ca8a04":pct>0?"#ea580c":"#94a3b8";
  return(
    <div style={{display:"flex",alignItems:"center",gap:2}}>
      {steps.map(step=>(
        <div key={step} onClick={e=>{e.stopPropagation();onChange(pct===step?step-25:step);}}
          title={`${step}%`}
          style={{flex:1,height:8,borderRadius:3,cursor:"pointer",
            background:pct>=step?boxColor(step):"#e2e8f0",
            border:`1px solid ${pct>=step?boxColor(step)+"99":"#d1d5db"}`,
            transition:"background .12s"}}/>
      ))}
      <span style={{fontSize:9,minWidth:22,textAlign:"right" as const,fontWeight:pct>0?600:400,color:textColor,flexShrink:0}}>
        {pct}%
      </span>
    </div>
  );
}

function RichEditor({value, onChange}){
  const ref = useRef(null);
  const isInit = useRef(false);
  useEffect(()=>{
    if(ref.current && !isInit.current){ ref.current.innerHTML = value||""; isInit.current=true; }
  },[]);
  const cmd=(command,val=null)=>{ ref.current.focus(); document.execCommand(command,false,val); onChange(ref.current.innerHTML); };
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
      {/* 글자색 A▪ */}
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
    <div ref={ref} contentEditable suppressContentEditableWarning onInput={()=>onChange(ref.current.innerHTML)}
      style={{minHeight:140,maxHeight:280,overflowY:"auto",padding:"10px 12px",fontSize:13,lineHeight:1.7,outline:"none",fontFamily:"'Pretendard',system-ui,sans-serif",color:"#1a2332"}}/>
  </div>;
}

// ── 메모 편집 패널 ─────────────────────────────────────────────
function NotePopup({todo, x, y, onSave, onClose}){
  const wrapRef=useRef(null);
  const ref=useRef(null);
  const onSaveRef=useRef(onSave);
  onSaveRef.current=onSave;
  const [size,setSize]=useState({w:460,h:300});
  const dragRef=useRef<{startX:number,startY:number,startW:number,startH:number}|null>(null);

  useEffect(()=>{
    if(ref.current){ref.current.innerHTML=todo.det||"";ref.current.focus();}
    const onDown=(e)=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))onClose();};
    const onKey=(e)=>{if(e.key==="Escape")onClose();};
    setTimeout(()=>document.addEventListener("mousedown",onDown),0);
    document.addEventListener("keydown",onKey);
    return()=>{
      if(ref.current)onSaveRef.current(ref.current.innerHTML);
      document.removeEventListener("mousedown",onDown);
      document.removeEventListener("keydown",onKey);
    };
  },[]);

  useEffect(()=>{
    const onMove=(e)=>{
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

  const cmd=(c)=>{ref.current.focus();document.execCommand(c,false,null);};
  const left=Math.min(Math.max(8,x),window.innerWidth-size.w-8);
  const top=(window.innerHeight-y<size.h+8)?y-size.h:y+6;
  const tools=[
    {label:"B",c:"bold",s:{fontWeight:800},title:"굵게"},
    {label:"I",c:"italic",s:{fontStyle:"italic"},title:"기울임"},
    {label:"U",c:"underline",s:{textDecoration:"underline"},title:"밑줄"},
    {label:"S",c:"strikeThrough",s:{textDecoration:"line-through"},title:"취소선"},
    {label:"•",c:"insertUnorderedList",title:"글머리 기호"},
    {label:"1.",c:"insertOrderedList",title:"번호 목록"},
  ];
  const editorH=size.h-82; // 헤더+툴바 높이 제외
  return <div ref={wrapRef}
    style={{position:"fixed",left,top,width:size.w,height:size.h,zIndex:3000,
      background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,
      boxShadow:"0 8px 32px rgba(0,0,0,.14)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
    {/* 헤더 */}
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
      <span style={{width:8,height:8,borderRadius:"50%",background:"#2563eb",flexShrink:0,display:"inline-block"}}/>
      <span style={{fontSize:12,fontWeight:700,color:"#1e3a8a",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{todo.task}</span>
      <button onMouseDown={e=>{e.preventDefault();onClose();}}
        style={{width:22,height:22,borderRadius:"50%",border:"none",background:"#e2e8f0",cursor:"pointer",fontSize:11,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>✕</button>
    </div>
    {/* 툴바 */}
    <div style={{display:"flex",gap:2,padding:"6px 10px",borderBottom:"1px solid #f1f5f9",alignItems:"center",background:"#fff",flexShrink:0}}>
      {tools.map(t=><button key={t.c} title={t.title} onMouseDown={e=>{e.preventDefault();cmd(t.c);}}
        style={{padding:"3px 9px",border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",
          fontSize:11,borderRadius:6,fontFamily:"inherit",color:"#334155",transition:"all .12s",...(t.s||{})}}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#eff6ff";(e.currentTarget as HTMLButtonElement).style.borderColor="#93c5fd";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="#f8fafc";(e.currentTarget as HTMLButtonElement).style.borderColor="#e2e8f0";}}
      >{t.label}</button>)}
    </div>
    {/* 편집 영역 */}
    <div ref={ref} contentEditable suppressContentEditableWarning
      onInput={()=>onSaveRef.current(ref.current.innerHTML)}
      style={{height:editorH,overflowY:"auto",padding:"12px 14px",
        fontSize:13,lineHeight:1.75,outline:"none",color:"#1e293b",
        fontFamily:"'Pretendard',system-ui,sans-serif",flex:1}}/>
    {/* 리사이즈 핸들 */}
    <div onMouseDown={e=>{e.preventDefault();e.stopPropagation();dragRef.current={startX:e.clientX,startY:e.clientY,startW:size.w,startH:size.h};}}
      style={{position:"absolute",right:0,bottom:0,width:18,height:18,cursor:"nwse-resize",display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:"3px",zIndex:1}}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M9 1L1 9M9 5L5 9M9 9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  </div>;
}

// ── 인라인 셀용 팝업 에디터 ────────────────────────────────────
function CellRichPopup({todo, onSave, onClose}){
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

// ── 로그인 화면 ─────────────────────────────────────────────────
const AVATAR_COLORS=["#2563eb","#16a34a","#d97706","#9333ea","#dc2626","#0d9488","#db2777","#ea580c"];
function LoginScreen({members,onLogin}:{members:string[],onLogin:(name:string)=>void}){
  return <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Pretendard',system-ui,sans-serif"}}>
    <div style={{background:"#fff",borderRadius:20,width:460,boxShadow:"0 24px 64px rgba(0,0,0,.15)",overflow:"hidden"}}>
      <div style={{background:"#172f5a",padding:"32px 36px",textAlign:"center"}}>
        <img src="/bgk_logo_white.png" alt="Bridging Group" style={{height:40,width:"auto",display:"block",margin:"0 auto"}}/>
      </div>
      <div style={{padding:"32px 36px"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:18,fontWeight:700,color:"#172f5a",marginBottom:6}}>팀 TODO 통합관리</div>
        <div style={{fontSize:13,color:"#94a3b8"}}>계속하려면 계정을 선택하세요</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {members.map((m,i)=>{
          const c=AVATAR_COLORS[i%AVATAR_COLORS.length];
          return <button key={m} onClick={()=>onLogin(m)}
            style={{padding:"14px 12px",border:"1.5px solid #e2e8f0",borderRadius:12,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .15s",fontFamily:"inherit",textAlign:"left"}}
            onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.borderColor=c;b.style.background=c+"11";b.style.transform="translateY(-1px)";b.style.boxShadow=`0 4px 12px ${c}22`;}}
            onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.borderColor="#e2e8f0";b.style.background="#fff";b.style.transform="none";b.style.boxShadow="none";}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${c},${AVATAR_COLORS[(i+3)%AVATAR_COLORS.length]})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,flexShrink:0}}>{m[0]}</div>
            <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{m}</span>
          </button>;
        })}
      </div>
    </div>
  </div>
</div>;
}

export default function App(){
  const [projects,setProjects]=useState<any[]>([]);
  const [todos,setTodos]=useState<any[]>([]);
  const historyRef=useRef<any[][]>([]);
  const redoRef=useRef<any[][]>([]);
  const detHoverTimerRef=useRef<any>(null);
  const noteLeaveTimerRef=useRef<any>(null);
const setTodosWithHistory=fn=>{
    setTodos(prev=>{
      historyRef.current=[...historyRef.current.slice(-49),prev]; // 최대 50단계
      redoRef.current=[]; // 새 변경 시 redo 스택 초기화
      return typeof fn==="function"?fn(prev):fn;
    });
  };
  const undo=()=>{
    if(!historyRef.current.length)return;
    setTodos(prev=>{
      redoRef.current=[...redoRef.current.slice(-49),prev];
      return historyRef.current.pop();
    });
    flash("이전 상태로 복원되었습니다");
  };
  const redo=()=>{
    if(!redoRef.current.length)return;
    setTodos(prev=>{
      historyRef.current=[...historyRef.current.slice(-49),prev];
      return redoRef.current.pop();
    });
    flash("작업이 다시 실행되었습니다");
  };
  const [nId,setNId]=useState(21);
  const [pNId,setPNId]=useState(5);
  const [loaded,setLoaded]=useState(false);
  const [members,setMembers]=useState(INIT_MEMBERS);
  const [pris,setPris]=useState(INIT_PRI);
  const [stats,setStats]=useState(INIT_ST);
  const [priC,setPriC]=useState({...INIT_PRI_C});
  const [priBg,setPriBg]=useState({...INIT_PRI_BG});
  const [stC,setStC]=useState({...INIT_ST_C});
  const [stBg,setStBg]=useState({...INIT_ST_BG});

  const [view,setView]=useState("list");
  const [toast,setToast]=useState({m:"",t:""});
  const [filters,setFilters]=useState<{proj:string[],who:string[],pri:string[],st:string[],repeat:string[],fav:string}>({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});
  const [favSidebar,setFavSidebar]=useState<{[k:string]:string[]}>(()=>{const u=localStorage.getItem("todo-current-user");if(!u)return{};try{return JSON.parse(localStorage.getItem(`todo-sidebar-favs-${u}`)||"{}");}catch{return {};}});
  const togFavSidebar=(key:string,val:string)=>setFavSidebar(prev=>{const cur=prev[key]||[];const next=cur.includes(val)?cur.filter(v=>v!==val):[...cur,val];const s={...prev,[key]:next};if(currentUser)localStorage.setItem(`todo-sidebar-favs-${currentUser}`,JSON.stringify(s));return s;});
  const [search,setSearch]=useState("");
  const [editCell,setEditCell]=useState(null);
  const [sortCol,setSortCol]=useState(null);
  const [sortDir,setSortDir]=useState("asc");
  const [newRows,setNewRows]=useState([]);
  const [kbF,setKbF]=useState("");
  const [kbFWho,setKbFWho]=useState("");
  const [dragId,setDragId]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const [calF,setCalF]=useState("");
  const [calFWho,setCalFWho]=useState("");
  const [calY,setCalY]=useState(new Date().getFullYear());
  const [calM,setCalM]=useState(new Date().getMonth());
  const [calD,setCalD]=useState(new Date().getDate());
  const [calView,setCalView]=useState("month");
  const [customDays,setCustomDays]=useState(4);
  const [editMod,setEditMod]=useState(null);
  const [detMod,setDetMod]=useState(null);
  const [projMod,setProjMod]=useState(false);
  const [settMod,setSettMod]=useState(false);
  const [chipAdd,setChipAdd]=useState(null);
  const [chipVal,setChipVal]=useState("");
  const [chipColor,setChipColor]=useState("#8b5cf6");
  const [aiText,setAiText]=useState("");
  const [aiLoad,setAiLoad]=useState(false);
  const [aiSt,setAiSt]=useState("");
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("team-todo-apikey")||"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");
  const [aiParsed,setAiParsed]=useState([]);
  const [addTab,setAddTab]=useState("manual");
  const [detPopup,setDetPopup]=useState(null); // {todo} or null
  const [notePopup,setNotePopup]=useState(null); // {todo,x,y} or null
  const [datePop,setDatePop]=useState<{id:number,rect:DOMRect,value:string}|null>(null);
  const [nrDatePop,setNrDatePop]=useState<{id:number,rect:DOMRect,value:string}|null>(null);
  const [hoverRow,setHoverRow]=useState<number|null>(null);
  const [currentUser,setCurrentUser]=useState<string|null>(()=>localStorage.getItem("todo-current-user"));
  const [userFavs,setUserFavs]=useState<{[u:string]:number[]}>(()=>{try{return JSON.parse(localStorage.getItem("todo-user-favs")||"{}");}catch{return {};}});
  const isFav=(id:number)=>currentUser?(userFavs[currentUser]||[]).includes(id):false;
  const toggleFav=(id:number)=>{if(!currentUser)return;setUserFavs(prev=>{const cur=prev[currentUser]||[];const next=cur.includes(id)?cur.filter(v=>v!==id):[...cur,id];return{...prev,[currentUser]:next};});};
  const [expandMode,setExpandMode]=useState(false);
  const [showDone,setShowDone]=useState(false);
  const [selectedIds,setSelectedIds]=useState<Set<number>>(new Set());
  const lastSelRef=useRef<number|null>(null);
  const addSecRef=useRef<HTMLDivElement>(null);
  const tblDivRef=useRef<HTMLDivElement>(null);
  const selAll=(ids:number[])=>setSelectedIds(new Set(ids));
  const clrSel=()=>setSelectedIds(new Set());
  const [movePop,setMovePop]=useState(false);

  useEffect(()=>{
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css";
    document.head.appendChild(link);
    return()=>document.head.removeChild(link);
  },[]);

  useEffect(()=>{
    const st=document.createElement("style");
    st.textContent=`
      @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      ::-webkit-scrollbar{width:5px;height:5px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
      ::-webkit-scrollbar-thumb:hover{background:#94a3b8}
    `;
    document.head.appendChild(st);
    return()=>document.head.removeChild(st);
  },[]);

  // localStorage: 초기 데이터 로드
  useEffect(()=>{
    try{
      const raw=localStorage.getItem("todo-v5");
      if(raw){
        const d=JSON.parse(raw);
        if(d.todos?.length)setTodos(d.todos);
        if(d.projects?.length)setProjects(d.projects);
        if(d.nId)setNId(d.nId);if(d.pNId)setPNId(d.pNId);
        if(d.pris)setPris(d.pris);if(d.stats)setStats(d.stats);
        if(d.priC)setPriC(d.priC);if(d.priBg)setPriBg(d.priBg);
        if(d.stC)setStC(d.stC);if(d.stBg)setStBg(d.stBg);
        if(d.members?.length)setMembers(d.members);
      }else{
        setTodos(initTodos);
        setProjects(initProj);
      }
    }catch(e){
      setTodos(initTodos);
      setProjects(initProj);
    }
    setLoaded(true);
  },[]);

  useEffect(()=>{if(currentUser)localStorage.setItem("todo-current-user",currentUser);else localStorage.removeItem("todo-current-user");},[currentUser]);
  useEffect(()=>{if(!currentUser){setFavSidebar({});return;}try{setFavSidebar(JSON.parse(localStorage.getItem(`todo-sidebar-favs-${currentUser}`)||"{}"));}catch{setFavSidebar({});}},[currentUser]);
  useEffect(()=>{localStorage.setItem("todo-user-favs",JSON.stringify(userFavs));},[userFavs]);
  // addSec 초기 maxHeight 설정 불필요 — onScroll에서만 제어

  // 롯데백화점 워크숍 데이터 최초 1회 seed
  useEffect(()=>{
    if(!loaded)return;
    if(localStorage.getItem("seed-lotte-2026"))return;
    if(projects.find(p=>p.name.includes("롯데백화점")))return;
    const newPid=Math.max(...projects.map(p=>p.id),0)+1;
    const base=Math.max(...todos.filter(t=>!Array.isArray(t)).map(t=>t.id),0)+1;
    const mk=(i,task,due,st,pri,det,progress)=>({id:base+i,pid:newPid,task,who:"김대윤",due,pri,st,det,cre:"2026-03-27",done:st==="완료"?"2026-03-27":null,repeat:"없음",progress});
    setProjects(prev=>[...prev,{id:newPid,name:"2026 롯데백화점 동행 워크숍",color:"#ef4444",status:"활성"}]);
    setTodos(prev=>[...prev.filter(t=>!Array.isArray(t)),...[
        mk(0,"참가사 선발 및 선발 공지","2026-03-06","진행중","긴급","최종 참가인원 체크 필수",50),
        mk(1,"롯데 호텔 담당자 인계","2026-03-06","완료","긴급","롯데호텔 관리 주체 확정 필요",100),
        mk(2,"롯데 호텔 추가 숙박 확보","2026-03-06","진행중","긴급","최종 객실: 80/61",50),
        mk(3,"[1차시] 직무 특강 1 연사 확정","2026-03-13","진행중","긴급","섭외비 확정, 숙소 및 항공 지원",50),
        mk(4,"[1차시] 직무 특강 2 연사 확정","2026-03-13","완료","긴급","이윤수, 조용헌, 환경재단 ESG 강사",100),
        mk(5,"[1차시] 명사 특강 연사 확정","2026-03-13","진행중","긴급","조용헌 교수님 항공권 발권 완료(272,000원)",50),
        mk(6,"[2차시] 직무 특강 1 연사 확정","2026-03-13","진행중","긴급","이윤수 강의 의뢰서 및 일정 체크 필요",50),
        mk(7,"[2차시] 직무 특강 2 연사 확정","2026-03-13","진행중","긴급","1차시와 동일",50),
        mk(8,"[2차시] 명사 특강 연사 확정","2026-03-13","진행중","긴급","1차시와 동일",50),
        mk(9,"[전체] 예산안 확정","2026-03-13","진행중","긴급","",50),
        mk(10,"[전체] 계약서 작성 및 선금 지급","2026-03-13","대기","긴급","",0),
        mk(11,"[2차시] 항공권 전달 및 발권","2026-03-24","진행중","긴급","",50),
        mk(12,"[1차시] 항공권 명단 전달 및 발권","2026-03-25","진행중","긴급","",50),
        mk(13,"[전체] 여행자보험 가입","2026-03-25","대기","긴급","",0),
        mk(14,"[전체] 레크레이션 상품 선정 및 구매","2026-03-27","완료","긴급","진행안함",100),
        mk(15,"[전체] 기념품 선정 및 구매","2026-03-27","진행중","긴급","시시호시 제주 전통술(3만원+@)",50),
        mk(16,"[전체] 제주도 사전 답사 및 호텔 미팅","2026-03-27","대기","긴급","03.23(월) 진행 예정",0),
        mk(17,"[전체] ESG 플로깅 프로그램 기획/확정","2026-03-27","진행중","긴급","장소 섭외, 지자체 협의, 스토리텔링 기획 필요",50),
        mk(18,"[전체] 해녀촌 기념품 체크","","대기","낮음","해녀촌 프로그램 취소, 성산일출봉/올레길로 변경",0),
        mk(19,"[전체] ESG 플로깅 현지 언론사 기사 초안","","대기","낮음","롯데백화점 작성",0),
        mk(20,"[전체] 플로깅 플랜B 수립","2026-03-27","진행중","긴급","우천시 선녀와나무꾼, 이너리스, 사려니 숲길",50),
        mk(21,"[1차시] 참석자 특이사항 수요조사","2026-04-10","대기","높음","식단, 알러지, 건강상태 조사",0),
        mk(22,"[2차시] 참석자 특이사항 수요조사","2026-04-10","대기","높음","체험 프로그램 분리 발송",0),
        mk(23,"[전체] 호텔 체크인 운영 방안 확정","2026-04-10","대기","높음","사전 체크인 후 현장 배부 예정",0),
        mk(24,"[전체] VIP 의전 체크","2026-04-10","완료","높음","모두 함께 버스 탑승",100),
        mk(25,"[전체] 연회장 레이아웃 구성","2026-04-10","대기","높음","크리스탈 볼룸 1,2,3 사용 / 무대 7.2M×3M",0),
        mk(26,"[전체] 브릿징·롯데백화점 인원별 R&R","2026-04-10","대기","높음","",0),
        mk(27,"[전체] 홍보물·기념품 사전 물류 배송","2026-04-10","대기","높음","행사 3~4일 전까지 호텔로 발송",0),
        mk(28,"[전체] 플로깅 키트 수령 및 호텔 발송","2026-04-10","대기","높음","롯데호텔 사전 협의 필요",0),
        mk(29,"[전체] 행사 브랜딩 홍보물 기획 및 출력","2026-04-10","대기","높음","명찰, 리플렛, 현수막, 버스 번호판 등",0),
        mk(30,"[전체] 안전 대책 수립","2026-04-10","대기","높음","병원 동선 파악, 구급약품 준비",0),
        mk(31,"[1차시] 참가사 안내문 발송","2026-04-17","대기","보통","일정표, 숙소, 준비물 안내",0),
        mk(32,"[2차시] 참가사 안내문 발송","2026-04-28","대기","보통","",0),
        mk(33,"[1차시] 호텔 예약 명단 확인 및 방 배정","","진행중","낮음","개인 사용분 개별 결제",50),
        mk(34,"[2차시] 호텔 예약 명단 확인 및 방 배정","","진행중","낮음","부문별 맞게 체험 프로그램 배정",50),
        mk(35,"롯데호텔 숙박·연회장 계약","","진행중","낮음","선금 입금 완료(3.16)",50),
        mk(36,"행사 키비주얼 제작 여부 확인","","완료","낮음","키비주얼 제작 완료(0313)",100),
        mk(37,"참가사 명단(출석체크용) 제작 - 파트너사","","대기","낮음","브릿징그룹 참가사명단 확인",0),
        mk(38,"참가사 명단(출석체크용) 제작 - 외주사","","대기","낮음","룸드롭 5,000원/객실",0),
        mk(39,"프로그램 일정표 수정 및 명찰용 스케쥴","","대기","낮음","명찰 뒤에 스케쥴표 인쇄",0),
        mk(40,"연회 음료 및 야식 준비","","대기","낮음","주류 영수증 처리 필요",0),
        mk(41,"헤드테이블 확인","","대기","낮음","VIP 및 파트너사 대표 좌석 지정",0),
    ]]);
    setNId(base+42);
    setPNId(newPid+1);
    localStorage.setItem("seed-lotte-2026","1");
  },[loaded]);

  // 변경 시 localStorage에 저장 (debounce)
  const skipFirst=useRef(false);
  useEffect(()=>{
    if(!loaded)return;
    if(!skipFirst.current){skipFirst.current=true;return;}
    const t=setTimeout(()=>{
      try{localStorage.setItem("todo-v5",JSON.stringify({todos,projects,nId,pNId,pris,stats,priC,priBg,stC,stBg,members}));}catch(e){}
    },400);
    return()=>clearTimeout(t);
  },[todos,projects,members,pris,stats,priC,priBg,stC,stBg,loaded]);

  const flash=(m,t="ok")=>{setToast({m,t});setTimeout(()=>setToast({m:"",t:""}),2500)};
  const aProj=projects.filter(p=>p.status==="활성");
  const gPr=id=>gP(projects,id);

  const updTodo=(id,u)=>setTodosWithHistory(p=>p.map(t=>{if(t.id!==id)return t;const n={...t,...u};if(u.st==="완료"&&t.st!=="완료")n.done=td();else if(u.st&&u.st!=="완료")n.done=null;return n}));
  const addTodo=t=>{
    const id=nId;setNId(nId+1);
    const newTodo={...t,id,cre:td(),done:t.st==="완료"?td():null,repeat:t.repeat||"없음"};
    setTodosWithHistory(p=>[...p,newTodo]);
    return id;
  };
  const delTodo=id=>{
    setTodosWithHistory(p=>p.filter(t=>t.id!==id));
    flash("업무가 삭제되었습니다","err");
  };

  const filtered=todos.filter(t=>{
    const q=search.toLowerCase();
    return(!q||t.task.toLowerCase().includes(q)||t.who.toLowerCase().includes(q)||gPr(t.pid).name.toLowerCase().includes(q))
      &&(filters.proj.length===0||filters.proj.some(v=>v==="__none__"?gPr(t.pid).id===0:String(t.pid)===v))
      &&(filters.st.length===0||filters.st.includes(t.st))
      &&(filters.pri.length===0||filters.pri.includes(t.pri))
      &&(filters.who.length===0||filters.who.includes(t.who))
      &&(filters.repeat.length===0||filters.repeat.includes(t.repeat))
      &&(!filters.fav||isFav(t.id));
  });

  const toggleSort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc")}};
  const priOrder={긴급:0,높음:1,보통:2,낮음:3};
  const stOrder={대기:0,진행중:1,검토:2,완료:3};
  const sorted=[...filtered].sort((a,b)=>{
    if(!sortCol)return 0;
    let va,vb;
    if(sortCol==="id"){va=a.id;vb=b.id}
    else if(sortCol==="pid"){va=gPr(a.pid).name;vb=gPr(b.pid).name}
    else if(sortCol==="task"){va=a.task;vb=b.task}
    else if(sortCol==="det"){va=stripHtml(a.det||"");vb=stripHtml(b.det||"")}
    else if(sortCol==="who"){va=a.who;vb=b.who}
    else if(sortCol==="due"){va=a.due||"9999";vb=b.due||"9999"}
    else if(sortCol==="pri"){va=priOrder[a.pri]??9;vb=priOrder[b.pri]??9}
    else if(sortCol==="st"){va=stOrder[a.st]??9;vb=stOrder[b.st]??9}
    else if(sortCol==="repeat"){va=a.repeat||"없음";vb=b.repeat||"없음"}
    else return 0;
    if(typeof va==="string")return sortDir==="asc"?va.localeCompare(vb):vb.localeCompare(va);
    return sortDir==="asc"?va-vb:vb-va;
  });
  const sortIcon=col=>sortCol===col?(sortDir==="asc"?"▲":"▼"):"⇅";
  const visibleTodoIds=sorted.filter(t=>t.st!=="완료").map(t=>t.id);
  const allVisibleSelected=visibleTodoIds.length>0&&visibleTodoIds.every(id=>selectedIds.has(id));
  const someVisibleSelected=visibleTodoIds.some(id=>selectedIds.has(id));
  const toggleSelectAll=()=>{if(allVisibleSelected){clrSel();}else{setSelectedIds(new Set(visibleTodoIds));lastSelRef.current=null;}};
  const handleCheck=(id:number,shift:boolean)=>{
    if(shift&&lastSelRef.current!==null){
      const ids=sorted.map(t=>t.id);
      const a=ids.indexOf(lastSelRef.current),b=ids.indexOf(id);
      if(a!==-1&&b!==-1){
        const [lo,hi]=a<b?[a,b]:[b,a];
        setSelectedIds(prev=>{const n=new Set(prev);ids.slice(lo,hi+1).forEach(rid=>n.add(rid));return n;});
        lastSelRef.current=id;
        return;
      }
    }
    setSelectedIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
    lastSelRef.current=id;
  };
  const togF=(k:string,v:string)=>{
    if(k==="fav"){setFilters(f=>({...f,fav:f.fav?"":"1"}));return;}
    if(v===""){setFilters(f=>({...f,[k]:[]}));return;}
    setFilters(f=>{const arr=f[k] as string[];return{...f,[k]:arr.includes(v)?arr.filter(x=>x!==v):[...arr,v]};});
  };

  const calDate=()=>new Date(calY,calM,calD);
  const setCalDate=d=>{setCalY(d.getFullYear());setCalM(d.getMonth());setCalD(d.getDate())};
  const calToday=()=>setCalDate(new Date());

  const calRangeDs=useMemo(()=>{
    const base=new Date(calY,calM,calD);
    let s,e;
    if(calView==="week"){const ws=new Date(base);ws.setDate(ws.getDate()-ws.getDay());const we=new Date(ws);we.setDate(we.getDate()+6);s=dateStr(ws.getFullYear(),ws.getMonth(),ws.getDate());e=dateStr(we.getFullYear(),we.getMonth(),we.getDate());}
    if(calView==="month"||calView==="agenda"){s=`${calY}-${fmt2(calM+1)}-01`;const ed=new Date(calY,calM+4,0);e=dateStr(ed.getFullYear(),ed.getMonth(),ed.getDate());}
    if(calView==="custom"){const ce=new Date(base);ce.setDate(ce.getDate()+customDays-1);s=dateStr(base.getFullYear(),base.getMonth(),base.getDate());e=dateStr(ce.getFullYear(),ce.getMonth(),ce.getDate());}
    s=s||dateStr(calY,calM,calD);e=e||dateStr(calY,calM,calD);
    return {s,e};
  },[calView,calY,calM,calD,customDays]);

  const ftodosBase=todos.filter(t=>(!calF||String(t.pid)===calF)&&(!calFWho||t.who===calFWho));
  const ftodosExpanded=useMemo(()=>expandRepeats(ftodosBase, calRangeDs.s, calRangeDs.e),[ftodosBase,calRangeDs]);

  const calNav=(dir)=>{
    const d=calDate();
    if(calView==="day")d.setDate(d.getDate()+dir);
    else if(calView==="week")d.setDate(d.getDate()+dir*7);
    else if(calView==="month"){d.setMonth(d.getMonth()+dir);d.setDate(1)}
    else if(calView==="custom")d.setDate(d.getDate()+dir*customDays);
    else if(calView==="agenda")d.setDate(d.getDate()+dir*14);
    setCalDate(d);
  };
  const calDays=["일","월","화","수","목","금","토"];
  const calTitle=()=>{
    const d=calDate();
    if(calView==="day")return `${calY}년 ${calM+1}월 ${calD}일 (${calDays[d.getDay()]})`;
    if(calView==="week"){const s=new Date(d);s.setDate(s.getDate()-s.getDay());const e=new Date(s);e.setDate(e.getDate()+6);return `${s.getMonth()+1}/${s.getDate()} — ${e.getMonth()+1}/${e.getDate()}, ${s.getFullYear()}`}
    if(calView==="month")return `${calY}년 ${calM+1}월`;
    if(calView==="custom")return `${customDays}일 뷰`;
    return "일정 목록";
  };
  const todayStr=td();
  const weekDates=()=>{const d=calDate();const s=new Date(d);s.setDate(s.getDate()-s.getDay());return Array.from({length:7},(_,i)=>{const x=new Date(s);x.setDate(x.getDate()+i);return x})};
  const customDates=()=>{const d=calDate();return Array.from({length:customDays},(_,i)=>{const x=new Date(d);x.setDate(x.getDate()+i);return x})};
  const agendaItems=()=>{const d=calDate();const items=[];for(let i=0;i<30;i++){const x=new Date(d);x.setDate(x.getDate()+i);const ds=dateStr(x.getFullYear(),x.getMonth(),x.getDate());const dayTodos=ftodosExpanded.filter(t=>t.due===ds);if(dayTodos.length)items.push({date:x,ds,todos:dayTodos})}return items};
  const evStyle=(p,repeat)=>({fontSize:10,padding:"2px 6px",borderRadius:4,marginBottom:1,cursor:"pointer",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderLeft:`3px solid ${p.color}`,background:repeat&&repeat!=="없음"?`${p.color}22`:`${p.color}15`,color:p.color,borderLeftStyle:repeat&&repeat!=="없음"?"dashed":"solid"});

  const CellEdit=({todo,field,children})=>{
    const isE=editCell?.id===todo.id&&editCell?.field===field;
    const stop=()=>setEditCell(null);
    const start=()=>setEditCell({id:todo.id,field});
    const save=val=>{updTodo(todo.id,{[field]:field==="pid"?parseInt(val):val});stop()};
    if(!isE)return <td style={S.tdc} onClick={e=>{if(field==="due"){const r=e.currentTarget.getBoundingClientRect();setDatePop({id:todo.id,rect:r,value:todo.due||""});}start();}}>{children}</td>;
    if(field==="task")return <td style={{...S.tdc,overflow:"visible"}}><input autoFocus defaultValue={todo.task} style={S.iinp} onKeyDown={e=>{if(e.key==="Enter")save(e.target.value);if(e.key==="Escape")stop()}} onBlur={e=>save(e.target.value)}/></td>;
    if(field==="due")return <td style={{...S.tdc,background:"#eff6ff"}}>{children}</td>;
    if(field==="pid")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><DropPanel items={aProj.map(p=>({value:String(p.id),label:p.name,color:p.color}))} current={String(todo.pid)} onSelect={v=>save(v)} onClose={stop} renderItem={it=><><span style={S.dot(it.color)}/>{it.label}</>}/></td>;
    if(field==="who")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><DropPanel items={members.map(m=>({value:m,label:m}))} current={todo.who} onSelect={v=>save(v)} onClose={stop} renderItem={it=><><span style={{width:16,height:16,borderRadius:"50%",background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700}}>{it.label[0]}</span>{it.label}</>}/></td>;
    if(field==="pri")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><span style={{...S.badge(priBg[todo.pri],priC[todo.pri],`1px solid ${priC[todo.pri]}55`),display:"inline-flex",alignItems:"center",gap:3,opacity:.85}}><span>●</span>{todo.pri}<span style={{fontSize:8,opacity:.6}}>▾</span></span><DropPanel items={pris.map(p=>({value:p,label:p,color:priC[p]}))} current={todo.pri} onSelect={v=>save(v)} onClose={stop} renderItem={it=><><span style={{...S.dot(it.color),width:8,height:8}}/>{it.label}</>}/></td>;
    if(field==="st")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><span style={{...S.badge(stBg[todo.st],stC[todo.st],`1px solid ${stC[todo.st]}55`),display:"inline-flex",alignItems:"center",gap:3,opacity:.85}}>{todo.st}<span style={{fontSize:8,opacity:.6}}>▾</span></span><DropPanel items={stats.map(s=>({value:s,label:s,color:stC[s]}))} current={todo.st} onSelect={v=>save(v)} onClose={stop} renderItem={it=><><span style={{...S.dot(it.color),width:8,height:8}}/>{it.label}</>}/></td>;
    if(field==="repeat")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><DropPanel items={REPEAT_OPTS.map(r=>({value:r,label:r}))} current={todo.repeat||"없음"} onSelect={v=>save(v)} onClose={stop} alignRight/></td>;
    return <td style={S.tdc}>{children}</td>;
  };

  const saveMod=f=>{if(!f.task||!f.pid||!f.who||!f.due){alert("업무명, 프로젝트, 담당자, 마감일은 필수 항목입니다.");return;}if(f.id){updTodo(parseInt(f.id),{pid:parseInt(f.pid),task:f.task,who:f.who,due:f.due,pri:f.pri,st:f.st,det:f.det,repeat:f.repeat||"없음"});flash("변경사항이 저장되었습니다")}else{addTodo({pid:parseInt(f.pid),task:f.task,who:f.who,due:f.due,pri:f.pri,st:f.st,det:f.det,repeat:f.repeat||"없음"});flash("업무가 등록되었습니다")}setEditMod(null)};
  const addNR=()=>setNewRows(r=>[...r,{pid:"",task:"",who:"",due:"",pri:"보통",det:"",repeat:"없음"}]);
  const isNREmpty=r=>!r.task&&!r.pid&&!r.who&&!r.due&&!r.det;
  const saveOneNR=i=>{const r=newRows[i];if(isNREmpty(r))return;addTodo({pid:r.pid?parseInt(r.pid):0,task:r.task||"제목 없음",who:r.who||"미배정",due:r.due||"",pri:r.pri||"보통",st:"대기",det:r.det||"",repeat:r.repeat||"없음"});setNewRows(p=>p.filter((_,j)=>j!==i));flash("업무가 등록되었습니다");};
  const saveNRs=()=>{const v=newRows.filter(r=>!isNREmpty(r));if(!v.length){setNewRows([]);return;}v.forEach(r=>addTodo({pid:r.pid?parseInt(r.pid):0,task:r.task||"제목 없음",who:r.who||"미배정",due:r.due||"",pri:r.pri||"보통",st:"대기",det:r.det||"",repeat:r.repeat||"없음"}));setNewRows([]);flash(`${v.length}건이 등록되었습니다`);};

  const parseAI=async()=>{
    if(!apiKey){setAiSt("API 키가 설정되지 않았습니다. 설정에서 먼저 저장해 주세요.");return;}
    if(!aiText.trim())return;setAiLoad(true);setAiSt("AI가 업무를 분석하고 있습니다...");
    try{
      const sysPrompt=`Task parser. Return ONLY a JSON array. Each item: {"task":string,"assignee":string or null,"due":"YYYY-MM-DD" or null,"priority":"보통"|"긴급"|"높음"|"낮음","project":string or null,"detail":string or null,"repeat":"없음"|"매일"|"매주"|"매월"}. @name=assignee. today=${td()}. projects:${aProj.map(p=>p.name).join(",")}. members:${members.join(",")}.`;
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2000,system:sysPrompt,messages:[{role:"user",content:`TODO추출:\n${aiText}`}]})});
      if(!r.ok)throw new Error(`API ${r.status}`);
      const d=await r.json();const raw=d.content.map(c=>c.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(raw);setAiParsed(parsed.map((t,i)=>({...t,_chk:true,_i:i})));setAiSt(`ok:${parsed.length}건의 업무가 추출되었습니다`);
    }catch(e){setAiSt(`err:분석 중 오류가 발생하였습니다: ${e.message}`);}
    setAiLoad(false);
  };
  const confirmAI=()=>{
    const checked=aiParsed.filter(t=>t._chk);
    if(!checked.length)return;
    const startId=nId;
    setNId(nId+checked.length);
    setTodosWithHistory(prev=>[...prev,...checked.map((t,i)=>{
      const mp=aProj.find(p=>t.project&&p.name.includes(t.project));
      return {pid:mp?mp.id:0,task:t.task||"",who:t.assignee||"미배정",due:t.due||"",pri:t.priority||"보통",st:"대기",det:t.detail||"",repeat:t.repeat||"없음",id:startId+i,cre:td(),done:null};
    })]);
    setAiParsed([]);setAiText("");setAiSt("");
    flash(`${checked.length}건이 AI를 통해 등록되었습니다`);
  };
  const addChip=()=>{if(!chipVal.trim())return;const v=chipVal.trim();
    if(chipAdd==="proj"){setProjects(p=>[...p,{id:pNId,name:v,color:chipColor,status:"활성"}]);setPNId(pNId+1);flash(`프로젝트 "${v}"이(가) 추가되었습니다`);}
    else if(chipAdd==="who"){if(!members.includes(v))setMembers(p=>[...p,v]);flash(`담당자 "${v}"이(가) 추가되었습니다`);}
    else if(chipAdd==="pri"){if(!pris.includes(v)){setPris(p=>[...p,v]);setPriC(p=>({...p,[v]:chipColor}));setPriBg(p=>({...p,[v]:chipColor+"18"}));}flash(`우선순위 "${v}"이(가) 추가되었습니다`);}
    else if(chipAdd==="st"){if(!stats.includes(v)){setStats(p=>[...p,v]);setStC(p=>({...p,[v]:chipColor}));setStBg(p=>({...p,[v]:chipColor+"18"}));}flash(`상태 "${v}"이(가) 추가되었습니다`);}
    setChipVal("");setChipAdd(null);};

  useEffect(()=>{
    const handler=e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="z"&&!e.shiftKey){
        if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.isContentEditable)return;
        e.preventDefault();undo();
      }
      if((e.ctrlKey||e.metaKey)&&e.key==="y"){
        if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.isContentEditable)return;
        e.preventDefault();redo();
      }
    };
    window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);
  },[]);

  useEffect(()=>{
    const handler=e=>{
      if(view!=="calendar")return;
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT"||e.target.isContentEditable)return;
      if(e.key==="1")setCalView("day");else if(e.key==="2")setCalView("week");else if(e.key==="3")setCalView("month");else if(e.key==="4")setCalView("custom");else if(e.key==="5")setCalView("agenda");
    };
    window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);
  },[view]);


if(!currentUser) return <LoginScreen members={members} onLogin={name=>setCurrentUser(name)}/>;

return <div style={S.wrap}>
    <header style={S.hdr}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <img src="/bgk_logo_white.png" alt="Bridging Group" onClick={()=>window.location.reload()} style={{height:32,width:"auto",display:"block",flexShrink:0,cursor:"pointer"}}/>
        <div style={{width:1,height:20,background:"rgba(255,255,255,.3)"}}/>
        <div style={{fontSize:14,fontWeight:700,letterSpacing:"0.01em"}}>팀 TODO 통합관리</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <button style={S.hBtn} onClick={()=>setProjMod(true)}>📁 프로젝트</button>
        <button style={S.hBtn} onClick={()=>setSettMod(true)}>⚙️ 설정</button>
        <button style={{...S.hBtn,opacity:historyRef.current.length?1:.4}} onClick={undo} title="되돌리기 (Ctrl+Z)">↩️ 되돌리기</button>
        <button style={{...S.hBtn,opacity:redoRef.current.length?1:.4}} onClick={redo} title="다시 실행 (Ctrl+Y)">↪️ 다시 실행</button>
        <span style={S.hBdg}>{todos.length}건</span>
        <div style={{width:1,height:20,background:"rgba(255,255,255,.25)",margin:"0 4px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.25)",border:"1.5px solid rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>{currentUser?.[0]}</div>
          <span style={{fontSize:12,fontWeight:600,color:"#fff"}}>{currentUser}</span>
          <button style={{...S.hBtn,fontSize:10,padding:"3px 10px",background:"rgba(255,255,255,.12)"}} onClick={()=>setCurrentUser(null)}>로그아웃</button>
        </div>
      </div>
    </header>

    <nav style={S.nav}>
      {[["dashboard","📊 대시보드"],["kanban","📌 칸반"],["list","📋 리스트"],["calendar","📅 캘린더"]].map(([k,l])=><button key={k} style={S.navB(view===k)} onClick={()=>setView(k)}>{l}</button>)}
    </nav>

    <main style={S.main}>
      {view==="dashboard"&&<Dashboard todos={todos} projects={projects} members={members} priC={priC} priBg={priBg} stC={stC} stBg={stBg} gPr={gPr}/>}

      {view==="kanban"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}><Chip active={kbF===""} onClick={()=>setKbF("")}>전체</Chip>{aProj.map(p=><Chip key={p.id} active={kbF===String(p.id)} color={p.color} onClick={()=>setKbF(kbF===String(p.id)?"":String(p.id))}>{p.name}</Chip>)}</div>
          <button style={S.bp} onClick={()=>setEditMod({pid:"",task:"",who:"",due:"",pri:"보통",st:"대기",det:"",repeat:"없음"})}>+ 새 업무</button>
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
          <Chip active={kbFWho===""} onClick={()=>setKbFWho("")}>전체</Chip>
          {[...new Set(todos.map(t=>t.who))].map(n=><Chip key={n} active={kbFWho===n} onClick={()=>setKbFWho(kbFWho===n?"":n)}>{n}</Chip>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,alignItems:"start"}}>
          {stats.map(st=>{const items=todos.filter(t=>t.st===st&&(!kbF||String(t.pid)===kbF)&&(!kbFWho||t.who===kbFWho));
            const isOver=dragOver===st;
            return <div key={st} style={{borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)",transition:"transform .15s"}}
              onDragOver={e=>{e.preventDefault();setDragOver(st);}}
              onDragLeave={()=>setDragOver(null)}
              onDrop={e=>{e.preventDefault();if(dragId)updTodo(dragId,{st});setDragId(null);setDragOver(null);}}>
              <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:6,fontWeight:700,fontSize:12,background:isOver?stC[st]+"22":stBg[st]||"#f1f5f9",color:stC[st]||"#334155",transition:"background .15s"}}>
                <span style={{...S.dot(stC[st]||"#94a3b8"),width:8,height:8}}/>{st}
                <span style={{marginLeft:"auto",fontSize:10,padding:"1px 6px",borderRadius:99,background:"rgba(255,255,255,.3)"}}>{items.length}</span>
              </div>
              <div style={{background:isOver?"#f0f7ff":"#f8fafc",padding:6,minHeight:120,display:"flex",flexDirection:"column",gap:5,transition:"background .15s",
                outline:isOver?`2px dashed ${stC[st]||"#2563eb"}`:"none",outlineOffset:-2,borderRadius:"0 0 10px 10px"}}>
                {items.length?items.map(t=>{const p=gPr(t.pid),od=isOD(t.due,t.st);
                  return <div key={t.id}
                    draggable
                    onDragStart={e=>{setDragId(t.id);e.dataTransfer.effectAllowed="move";}}
                    onDragEnd={()=>{setDragId(null);setDragOver(null);}}
                    onClick={()=>setDetMod(t)}
                    style={{background:"#fff",borderRadius:7,padding:10,boxShadow:"0 1px 3px rgba(0,0,0,.08)",borderLeft:`3px solid ${priC[t.pri]||"#94a3b8"}`,cursor:"grab",
                      opacity:dragId===t.id?.4:1,transform:dragId===t.id?"scale(.97)":"scale(1)",transition:"opacity .15s,transform .15s"}}>
                    <div style={{fontSize:8,color:"#94a3b8",display:"flex",alignItems:"center",gap:3,marginBottom:2}}><span style={{...S.dot(p.color),width:4,height:4}}/>{p.name}</div>
                    <div style={{fontSize:11,fontWeight:600,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>{t.task}<RepeatBadge repeat={t.repeat}/></div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:9,color:"#64748b"}}><span>{t.who}</span><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:od?"#dc2626":"#94a3b8"}}>{fD(t.due)}</span>{(()=>{const dd=dDay(t.due,t.st);return dd?<span style={{fontSize:9,fontWeight:700,color:dd.color,background:dd.bg,border:`1px solid ${dd.border}`,padding:"0 4px",borderRadius:3}}>{dd.label}</span>:null;})()}</span></div>
                  </div>}):<div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:10}}>없음</div>}
              </div>
            </div>})}
        </div>
      </div>}

      {view==="list"&&<div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        {/* ── Sidebar ──────────────────────────────────── */}
        <div style={{width:196,flexShrink:0,background:"#fff",borderRadius:10,border:"1px solid #e8edf4",position:"sticky",top:100,maxHeight:"calc(100vh - 112px)",boxShadow:"0 1px 3px rgba(0,0,0,.07)",display:"flex",flexDirection:"column" as const}}>
          <div style={{flex:1,overflowY:"auto" as const}}>
          <div style={{padding:"12px 12px 8px",borderBottom:"1px solid #f1f5f9"}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:12,pointerEvents:"none"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="검색..." style={{width:"100%",padding:"6px 24px 6px 26px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:11,outline:"none",boxSizing:"border-box",background:"#f8fafc"}}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",background:"#94a3b8",border:"none",borderRadius:"50%",width:14,height:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>
                <span style={{color:"#fff",fontSize:9,fontWeight:700,lineHeight:1}}>✕</span>
              </button>}
            </div>
          </div>
          <div style={{padding:"8px 12px 4px",borderBottom:"1px solid #f1f5f9"}}>
            <div onClick={()=>setFilters(f=>({...f,fav:f.fav?"":"1"}))} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",cursor:"pointer",background:filters.fav?"#fefce8":"transparent",borderRadius:6,fontSize:12,color:filters.fav?"#b45309":"#475569",fontWeight:filters.fav?700:400,userSelect:"none" as const,transition:"background .12s"}}>
              <span style={{fontSize:13,lineHeight:1}}>{filters.fav?"★":"☆"}</span>
              <span style={{flex:1}}>즐겨찾기</span>
              <span style={{fontSize:10,color:filters.fav?"#d97706":"#94a3b8",background:filters.fav?"#fde68a":"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:600,flexShrink:0}}>{todos.filter(t=>isFav(t.id)).length}</span>
            </div>
          </div>
          {([["프로젝트","proj",aProj.map(p=>({v:String(p.id),l:p.name,c:p.color,n:todos.filter(t=>t.pid===p.id).length}))],
            ["담당자","who",[...new Set(todos.map(t=>t.who).concat(members))].map(n=>({v:n,l:n,n:todos.filter(t=>t.who===n).length}))],
            ["우선순위","pri",pris.map(p=>({v:p,l:p,c:priC[p],n:todos.filter(t=>t.pri===p).length}))],
            ["상태","st",stats.map(s=>({v:s,l:s,c:stC[s],n:todos.filter(t=>t.st===s).length}))],
          ] as [string,string,{v:string,l:string,c?:string,n:number}[]][]).map(([label,key,items])=><div key={key}>
            <span style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:.8,padding:"10px 12px 4px",display:"block"}}>{label}</span>
            {(()=>{const empty=(filters[key] as string[]).length===0;return(<div onClick={()=>togF(key,"")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",cursor:"pointer",background:empty?"#eff6ff":"transparent",color:empty?"#2563eb":"#475569",fontWeight:empty?600:400,fontSize:12,userSelect:"none" as const}}>
              <span style={{flex:1}}>전체</span>
              <span style={{fontSize:10,color:empty?"#93c5fd":"#94a3b8",background:empty?"#dbeafe":"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:600,flexShrink:0}}>{todos.length}</span>
            </div>);})()}
            {key==="proj"&&(()=>{const sel=(filters[key] as string[]).includes("__none__");return(<div onClick={()=>togF(key,"__none__")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",cursor:"pointer",background:sel?"#eff6ff":"transparent",color:sel?"#2563eb":"#475569",fontWeight:sel?600:400,fontSize:12,userSelect:"none" as const}}>
              <span style={{flex:1}}>미배정</span>
              <span style={{fontSize:10,color:sel?"#93c5fd":"#94a3b8",background:sel?"#dbeafe":"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:600,flexShrink:0}}>{todos.filter(t=>gPr(t.pid).id===0).length}</span>
            </div>);})()}
            {[...items].sort((a,b)=>{const fa=(favSidebar[key]||[]).includes(a.v)?0:1,fb=(favSidebar[key]||[]).includes(b.v)?0:1;return fa-fb;}).map(it=>{const isFav=(favSidebar[key]||[]).includes(it.v);const sel=(filters[key] as string[]).includes(it.v);return <div key={it.v} onClick={()=>togF(key,it.v)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px 4px 6px",cursor:"pointer",background:sel?"#eff6ff":"transparent",color:sel?"#2563eb":"#475569",fontWeight:sel?600:400,fontSize:12,userSelect:"none" as const}}>
              <button onClick={e=>{e.stopPropagation();togFavSidebar(key,it.v);}} title={isFav?"고정 해제":"상단 고정"} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,padding:"0 2px",lineHeight:1,color:isFav?"#f59e0b":"#d1d5db",flexShrink:0,transition:"color .12s"}} onMouseEnter={e=>{if(!isFav)(e.currentTarget as HTMLButtonElement).style.color="#fbbf24";}} onMouseLeave={e=>{if(!isFav)(e.currentTarget as HTMLButtonElement).style.color="#d1d5db";}}>{isFav?"★":"☆"}</button>
              {it.c&&<span style={{width:6,height:6,borderRadius:"50%",background:it.c,flexShrink:0,display:"inline-block"}}/>}
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{it.l}</span>
              <span style={{fontSize:10,color:"#94a3b8",background:"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:500,flexShrink:0}}>{it.n}</span>
            </div>;})}

            {key!=="st"&&<div style={{padding:"2px 8px 4px"}}>
              <button onClick={()=>{setChipAdd(key);setChipVal("");const used=projects.map((pr:{color:string})=>pr.color);setChipColor(key==="proj"?(PROJ_PALETTE.find(c=>!used.includes(c))||PROJ_PALETTE[0]):"#8b5cf6")}} style={{fontSize:10,color:"#94a3b8",background:"none",border:"1px dashed #d1d5db",borderRadius:5,padding:"2px 10px",cursor:"pointer",width:"100%"}}>+ 추가</button>
            </div>}
          </div>)}
          </div>{/* /scrollable */}
          <div style={{padding:"8px 12px",borderTop:"1px solid #f1f5f9",flexShrink:0}}>
            {(()=>{const active=!!(search||filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.fav);return(<button onClick={()=>{setSearch("");setFilters({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});}} style={{width:"100%",padding:"6px",fontSize:11,color:active?"#2563eb":"#94a3b8",background:active?"#eff6ff":"#f8fafc",border:`1px solid ${active?"#bfdbfe":"#e2e8f0"}`,borderRadius:6,cursor:"pointer",fontWeight:active?600:400,transition:"all .15s"}}>✕ 필터 초기화</button>);})()}
          </div>
        </div>

        {/* ── Main content ─────────────────────────────── */}
        <div style={{flex:1,minWidth:0}}>

        <div ref={addSecRef} style={{overflow:"hidden"}}>
        <SectionLabel num="01" title="업무 추가" sub="직접 입력 또는 AI 자동 생성"/>
        <div style={{...S.card,padding:0,marginBottom:10,overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:"2px solid #e2e8f0"}}>
            <button onClick={()=>{setAddTab("manual");setNewRows(r=>r.length?r:[{pid:"",task:"",who:"",due:"",pri:"보통",det:"",repeat:"없음"}]);}} style={{flex:1,padding:"11px 0",fontSize:12,fontWeight:addTab==="manual"?700:500,color:addTab==="manual"?"#2563eb":"#64748b",background:addTab==="manual"?"#eff6ff":"#f8fafc",border:"none",borderBottom:addTab==="manual"?"2px solid #2563eb":"2px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:-2}}>＋ 직접 입력</button>
            <button onClick={()=>{setAddTab("ai");setNewRows([]);}} style={{flex:1,padding:"11px 0",fontSize:12,fontWeight:addTab==="ai"?700:500,color:addTab==="ai"?"#7c3aed":"#64748b",background:addTab==="ai"?"#f5f3ff":"#f8fafc",border:"none",borderBottom:addTab==="ai"?"2px solid #7c3aed":"2px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:-2}}>🤖 AI 자동 입력</button>
          </div>
          {addTab==="manual"&&<div style={{padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:newRows.length?10:0}}>
              <button onClick={addNR} style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"7px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:15,lineHeight:1}}>＋</span> 행 추가</button>
              {newRows.length>0&&<><button style={{...S.bp,fontSize:11,padding:"6px 14px"}} onClick={saveNRs}>💾 {newRows.length}개 저장</button><button style={{...S.bs,fontSize:11,padding:"6px 12px"}} onClick={()=>setNewRows([])}>✕ 전체 취소</button></>}
            </div>
            {newRows.length>0&&<div style={{border:"1.5px solid #c7d8f0",borderRadius:8,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <colgroup><col style={{width:120}}/><col style={{width:240}}/><col/><col style={{width:70}}/><col style={{width:110}}/><col style={{width:56}}/><col style={{width:70}}/><col style={{width:44}}/></colgroup>
                <thead><tr style={{background:"#f0f7ff",borderBottom:"1px solid #c7d8f0"}}>{["프로젝트","업무내용","상세내용","담당자","마감일","우선순위","반복",""].map((h,i)=><th key={i} style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#64748b",textAlign:"left"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {newRows.map((r,i)=>{const empty=isNREmpty(r);return <tr key={"nr"+i} style={{background:i%2===0?"#eef4ff":"#e8f0fe",borderBottom:i===newRows.length-1?"none":"1px solid #c7d8f0"}}>
                    <td style={{padding:"5px 6px"}}><select value={r.pid} onChange={e=>{const n=[...newRows];n[i].pid=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 3px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}><option value="">프로젝트</option>{aProj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                    <td style={{padding:"5px 6px"}}><input value={r.task} onChange={e=>{const n=[...newRows];n[i].task=e.target.value;setNewRows(n)}} onKeyDown={e=>{if(e.key==="Enter"){if(!isNREmpty(newRows[i]))saveOneNR(i);else addNR()}}} placeholder="업무 내용" autoFocus={i===newRows.length-1} style={{width:"100%",padding:"5px 8px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:11,outline:"none",background:"#fff",fontWeight:600}}/></td>
                    <td style={{padding:"5px 6px"}}>
                      {/* 새 행 상세내용 — NotePopup 방식 */}
                      <div onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setNotePopup({todo:{id:`__nr_${i}`,task:r.task||"새 업무",det:r.det||""},x:rect.left,y:rect.bottom,_newRow:i});}}
                        style={{width:"100%",padding:"5px 6px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,cursor:"text",color:r.det?stripHtml(r.det)?"#334155":"#94a3b8":"#94a3b8",minHeight:28,display:"flex",alignItems:"center",background:"#fff"}}>
                        {r.det&&stripHtml(r.det)?stripHtml(r.det).slice(0,20)+(stripHtml(r.det).length>20?"…":""):<span style={{color:"#bfcfe8"}}>상세내용 추가...</span>}
                      </div>
                    </td>
                    <td style={{padding:"5px 6px"}}><select value={r.who} onChange={e=>{const n=[...newRows];n[i].who=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 3px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}><option value="">담당자</option>{members.map(m=><option key={m}>{m}</option>)}</select></td>
                    <td style={{padding:"5px 6px"}}><div onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setNrDatePop({id:i,rect,value:r.due||""});}} style={{width:"100%",padding:"4px 6px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",cursor:"pointer",color:r.due?"#334155":"#94a3b8",whiteSpace:"nowrap"}}>{r.due?fD(r.due):"날짜 선택"}</div></td>
                    <td style={{padding:"5px 6px"}}><select value={r.pri} onChange={e=>{const n=[...newRows];n[i].pri=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 2px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}>{pris.map(p=><option key={p}>{p}</option>)}</select></td>
                    <td style={{padding:"5px 6px"}}><select value={r.repeat||"없음"} onChange={e=>{const n=[...newRows];n[i].repeat=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 2px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}>{REPEAT_OPTS.map(p=><option key={p}>{p}</option>)}</select></td>
                    <td style={{padding:"5px 4px",textAlign:"center"}}>
                      <button onClick={()=>saveOneNR(i)} disabled={empty} style={{background:empty?"#f1f5f9":"#2563eb",border:"none",color:empty?"#cbd5e1":"#fff",cursor:empty?"default":"pointer",fontSize:10,fontWeight:700,borderRadius:5,padding:"4px 5px",marginRight:2}}>✓</button>
                      <button onClick={()=>setNewRows(r=>r.filter((_,j)=>j!==i))} style={{background:"#fee2e2",border:"none",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700,borderRadius:5,padding:"4px 5px"}}>✕</button>
                    </td>
                  </tr>})}
                </tbody>
              </table>
            </div>}
          </div>}
          {addTab==="ai"&&<div style={{padding:"14px 16px"}}>
            <p style={{fontSize:11,color:"#64748b",margin:"0 0 10px"}}>자유롭게 업무를 입력하면 AI가 자동으로 TODO를 생성합니다.<br/>담당자는 @이름, 마감일은 "4월 10일", 반복은 "매일/매주/매월"처럼 입력하세요.</p>
            <textarea value={aiText} onChange={e=>setAiText(e.target.value)} rows={4} placeholder={"예시:\n1. 일일 바이어 문의 확인 @박정찬 매일\n2. 주간 진행상황 공유 @김대윤 매주 월요일\n3. 중국 시안 확인 @김현지 4월 5일 긴급"} style={{width:"100%",padding:"10px 12px",border:"1.5px solid #ddd6fe",borderRadius:8,fontSize:12,outline:"none",resize:"vertical",lineHeight:1.7,boxSizing:"border-box",background:"#fdfcff"}}/>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
              <button style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",opacity:aiLoad?.6:1}} onClick={parseAI} disabled={aiLoad}>{aiLoad?"⏳ 분석 중...":"🤖 TODO 자동 생성"}</button>
              {aiSt&&<span style={{fontSize:11,fontWeight:600,color:aiSt.startsWith("ok:")?"#16a34a":"#dc2626"}}>{aiSt.startsWith("ok:")||aiSt.startsWith("err:")?aiSt.slice(aiSt.indexOf(":")+1):aiSt}</span>}
              {aiText&&<button style={{...S.bs,fontSize:10,marginLeft:"auto"}} onClick={()=>{setAiText("");setAiSt("");setAiParsed([])}}>초기화</button>}
            </div>
            {aiParsed.length>0&&<div style={{marginTop:12,border:"1.5px solid #ddd6fe",borderRadius:10,overflow:"hidden"}}>
              {/* 헤더 */}
              <div style={{padding:"10px 14px",background:"#f5f3ff",borderBottom:"1px solid #ddd6fe",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="checkbox" checked={aiParsed.every(t=>t._chk)}
                    ref={el=>{if(el)el.indeterminate=aiParsed.some(t=>t._chk)&&!aiParsed.every(t=>t._chk);}}
                    onChange={e=>setAiParsed(p=>p.map(t=>({...t,_chk:e.target.checked})))}
                    style={{cursor:"pointer",accentColor:"#7c3aed",width:13,height:13}}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#7c3aed"}}>✨ {aiParsed.filter(t=>t._chk).length} / {aiParsed.length}건 선택됨</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",padding:"5px 18px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={confirmAI}>등록</button>
                  <button style={{...S.bs,fontSize:11}} onClick={()=>setAiParsed([])}>취소</button>
                </div>
              </div>
              {/* 카드 목록 */}
              <div style={{maxHeight:340,overflowY:"auto"}}>
                {aiParsed.map((t,i)=>{
                  const mp=aProj.find(p=>t.project&&p.name.includes(t.project));
                  const pc=mp?.color||"#94a3b8";
                  const prc=priC[t.priority||"보통"]||"#2563eb";
                  const prBg=priBg[t.priority||"보통"]||"#eff6ff";
                  const selStyle={padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:600,cursor:"pointer",outline:"none",appearance:"none" as const,WebkitAppearance:"none" as const,border:"1px solid"} as const;
                  return <div key={i} style={{padding:"11px 14px",borderBottom:"1px solid #f3f0ff",display:"flex",gap:10,alignItems:"flex-start",background:t._chk?(i%2===0?"#fff":"#fdfcff"):"#f8f9fb",opacity:t._chk?1:0.45,transition:"opacity .15s",borderLeft:`3px solid ${t._chk?pc:"#e2e8f0"}`}}>
                    <input type="checkbox" checked={t._chk} style={{marginTop:3,cursor:"pointer",flexShrink:0,accentColor:"#7c3aed",width:13,height:13}}
                      onChange={e=>{const n=[...aiParsed];n[i]._chk=e.target.checked;setAiParsed(n);}}/>
                    <div style={{flex:1,minWidth:0}}>
                      {/* 업무명 */}
                      <input value={t.task} onChange={e=>{const n=[...aiParsed];n[i].task=e.target.value;setAiParsed(n);}}
                        style={{width:"100%",border:"none",borderBottom:"1.5px solid transparent",fontSize:13,fontWeight:600,padding:"1px 0",outline:"none",background:"transparent",color:"#0f172a",transition:"border-color .15s",boxSizing:"border-box"}}
                        onFocus={e=>(e.target.style.borderBottomColor="#7c3aed")}
                        onBlur={e=>(e.target.style.borderBottomColor="transparent")}/>
                      {/* 배지 행 */}
                      <div style={{display:"flex",gap:5,flexWrap:"wrap" as const,marginTop:7,alignItems:"center"}}>
                        {/* 프로젝트 */}
                        <select value={mp?.id||""} onChange={e=>{const n=[...aiParsed];n[i].project=aProj.find(p=>p.id===parseInt(e.target.value))?.name||"";setAiParsed(n);}}
                          style={{...selStyle,borderColor:pc+"55",background:pc+"18",color:pc}}>
                          <option value="">📁 미배정</option>
                          {aProj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {/* 담당자 */}
                        <select value={members.find(m=>m===t.assignee)||t.assignee||""} onChange={e=>{const n=[...aiParsed];n[i].assignee=e.target.value;setAiParsed(n);}}
                          style={{...selStyle,borderColor:"#e2e8f0",background:"#f1f5f9",color:"#475569"}}>
                          <option value="">👤 미배정</option>
                          {members.map(m=><option key={m}>{m}</option>)}
                        </select>
                        {/* 마감일 */}
                        <input type="date" value={t.due||""} onChange={e=>{const n=[...aiParsed];n[i].due=e.target.value;setAiParsed(n);}}
                          style={{padding:"2px 7px",border:"1px solid #e2e8f0",borderRadius:99,fontSize:10,background:"#f1f5f9",color:t.due?"#334155":"#94a3b8",outline:"none",cursor:"pointer"}}/>
                        {/* 우선순위 */}
                        <select value={t.priority||"보통"} onChange={e=>{const n=[...aiParsed];n[i].priority=e.target.value;setAiParsed(n);}}
                          style={{...selStyle,borderColor:prc+"55",background:prBg,color:prc}}>
                          {pris.map(p=><option key={p}>{p}</option>)}
                        </select>
                        {/* 반복 */}
                        <select value={t.repeat||"없음"} onChange={e=>{const n=[...aiParsed];n[i].repeat=e.target.value;setAiParsed(n);}}
                          style={{...selStyle,borderColor:"#e2e8f0",background:"#f1f5f9",color:t.repeat&&t.repeat!=="없음"?"#7c3aed":"#94a3b8"}}>
                          {REPEAT_OPTS.map(r=><option key={r}>{r}</option>)}
                        </select>
                        {/* 메모 미리보기 */}
                        {t.detail&&<span style={{fontSize:10,color:"#94a3b8",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,maxWidth:160}}>💬 {t.detail}</span>}
                      </div>
                    </div>
                    {/* 삭제 */}
                    <button onClick={()=>setAiParsed(p=>p.filter((_,j)=>j!==i))}
                      style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:15,padding:"2px 3px",flexShrink:0,lineHeight:1,marginTop:1,transition:"color .12s"}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#dc2626"}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="#cbd5e1"}>✕</button>
                  </div>;
                })}
              </div>
            </div>}
          </div>}
        </div>
        </div>{/* /addSecRef */}

        <SectionLabel num="02" title="업무 리스트" sub={`총 ${sorted.length}건${filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search?" (필터 적용 중)":""}`}/>
        {sorted.length===0&&<div style={{...S.card,padding:"36px 20px",textAlign:"center" as const,color:"#94a3b8"}}><div style={{fontSize:28,marginBottom:6}}>📭</div><div style={{fontSize:13,fontWeight:600}}>업무가 없습니다</div></div>}
        {sorted.length>0&&<div style={{...S.card,padding:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderBottom:"1px solid #f1f5f9",background:"#fafbfc"}}>
            <span style={{fontSize:12,color:"#64748b"}}>
              <span style={{fontWeight:700,color:"#334155"}}>{sorted.filter(t=>t.st!=="완료").length}건 미완료</span>
              <span style={{margin:"0 6px",color:"#cbd5e1"}}>·</span>
              <span>{sorted.filter(t=>t.st==="완료").length}건 완료</span>
            </span>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              {([["due","마감순"],["pri","우선순위순"],["id","기본"]] as [string,string][]).map(([col,label])=>
                <button key={col} onClick={()=>toggleSort(col)} style={{fontSize:11,padding:"3px 10px",borderRadius:99,border:`1px solid ${sortCol===col?"#2563eb":"#e2e8f0"}`,background:sortCol===col?"#2563eb":"#fff",color:sortCol===col?"#fff":"#64748b",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:3}}>
                  {label}{sortCol===col&&<span style={{fontSize:8}}>{sortDir==="asc"?"▲":"▼"}</span>}
                </button>)}
              <div style={{width:1,height:16,background:"#e2e8f0",margin:"0 2px"}}/>
              <button onClick={()=>setExpandMode(p=>!p)} title="상세내용 펼치기/접기"
                style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,padding:"4px 10px",borderRadius:6,border:`1.5px solid ${expandMode?"#7c3aed":"#e2e8f0"}`,background:expandMode?"#7c3aed":"#fff",color:expandMode?"#fff":"#94a3b8",cursor:"pointer",fontWeight:600,transition:"all .15s"}}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="1" y="1" width="4.5" height="11" rx="1" fill={expandMode?"#fff":"#cbd5e1"}/>
                  <rect x="7" y="1" width="5" height="5" rx="1" fill={expandMode?"#c4b5fd":"#e2e8f0"}/>
                  <rect x="7" y="7" width="5" height="5" rx="1" fill={expandMode?"#c4b5fd":"#e2e8f0"}/>
                </svg>
                {expandMode?"상세 접기":"상세 펼치기"}
              </button>
            </div>
          </div>
          {(filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search)&&
            <div style={{display:"flex",flexWrap:"wrap" as const,alignItems:"center",gap:6,padding:"8px 14px",borderBottom:"1px solid #f1f5f9",background:"#f0f7ff"}}>
              <span style={{fontSize:11,color:"#64748b",fontWeight:600,flexShrink:0}}>적용된 필터</span>
              {search&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#dbeafe",color:"#1d4ed8",border:"1px solid #bfdbfe"}}>
                🔍 "{search}" <button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#1d4ed8",padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {filters.proj.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#ede9fe",color:"#6d28d9",border:"1px solid #ddd6fe"}}>
                📁 {v==="__none__"?"미배정":aProj.find(p=>String(p.id)===v)?.name||v} <button onClick={()=>togF("proj",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#6d28d9",padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>)}
              {filters.who.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#fce7f3",color:"#9d174d",border:"1px solid #fbcfe8"}}>
                👤 {v} <button onClick={()=>togF("who",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#9d174d",padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>)}
              {filters.pri.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:priBg[v],color:priC[v],border:`1px solid ${priC[v]}44`}}>
                ● {v} <button onClick={()=>togF("pri",v)} style={{background:"none",border:"none",cursor:"pointer",color:priC[v],padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>)}
              {filters.st.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:stBg[v],color:stC[v],border:`1px solid ${stC[v]}44`}}>
                {v} <button onClick={()=>togF("st",v)} style={{background:"none",border:"none",cursor:"pointer",color:stC[v],padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>)}
              {filters.repeat.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}}>
                🔁 {v} <button onClick={()=>togF("repeat",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#15803d",padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>)}
              <button onClick={()=>{setSearch("");setFilters({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});}} style={{marginLeft:"auto",fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4}}>전체 초기화</button>
            </div>}
          <div ref={tblDivRef} style={{overflowX:"auto",overflowY:"auto",maxHeight:"calc(100vh - 260px)"}}
            onScroll={e=>{
              const sy=(e.target as HTMLDivElement).scrollTop;
              if(addSecRef.current){
                if(sy===0){
                  addSecRef.current.style.maxHeight="";
                  addSecRef.current.style.opacity="1";
                } else {
                  const h=addSecRef.current.scrollHeight;
                  const ratio=Math.max(0,1-sy/Math.max(h,1));
                  addSecRef.current.style.maxHeight=`${ratio*h}px`;
                  addSecRef.current.style.opacity=String(Math.max(0,ratio*2-0.2).toFixed(2));
                }
              }
              if(tblDivRef.current){
                const sy2=sy>0?Math.min(sy,200):0;
                tblDivRef.current.style.maxHeight=`calc(100vh - 260px + ${sy2}px)`;
              }
            }}>
            <table style={{width:"100%",minWidth:800,borderCollapse:"collapse",tableLayout:"fixed"}}>
              <colgroup>
                {expandMode?<>
                  <col style={{width:"27%"}}/>
                  <col style={{width:"40%"}}/>
                  <col style={{width:"10%"}}/>
                  <col style={{width:"12%"}}/>
                  <col style={{width:"8%"}}/>
                  <col style={{width:"3%"}}/>
                </>:<>
                  <col style={{width:"27%"}}/>
                  <col style={{width:"19%"}}/>
                  <col style={{width:"8%"}}/>
                  <col style={{width:"10%"}}/>
                  <col style={{width:"9%"}}/>
                  <col style={{width:"8%"}}/>
                  <col style={{width:"9%"}}/>
                  <col style={{width:"7%"}}/>
                  <col style={{width:"3%"}}/>
                </>}
              </colgroup>
              <thead><tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
                {((expandMode
                  ?[["task","업무내용"],["det","상세내용"],["who","담당자"],["due","마감기한"]]
                  :[["task","업무내용"],["det","상세내용"],["who","담당자"],["due","마감기한"],["pri","우선순위"],["st","상태"],["progress","진행률"]]
                 ) as [string,string][]).map(([col,label])=>
                  <th key={col} style={{...S.th,cursor:"pointer",userSelect:"none" as const}} onClick={()=>toggleSort(col)}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:3}}>{label}<span style={{fontSize:8,color:sortCol===col?"#2563eb":"#c0c8d4"}}>{sortIcon(col)}</span></span>
                  </th>)}
                <th style={S.th}></th>
                <th style={{...S.th,width:36,padding:"0 6px",textAlign:"center" as const}}>
                  <input type="checkbox"
                    checked={allVisibleSelected}
                    ref={el=>{if(el)el.indeterminate=someVisibleSelected&&!allVisibleSelected;}}
                    onChange={toggleSelectAll}
                    title={allVisibleSelected?"전체 선택 해제":"전체 선택"}
                    style={{cursor:"pointer",width:14,height:14,accentColor:"#2563eb",verticalAlign:"middle"}}/>
                </th>
              </tr></thead>
              <tbody>
                {/* 미완료 항목 */}
                {sorted.filter(t=>t.st!=="완료").map(t=>{const od=isOD(t.due,t.st);
                  const plain=stripHtml(t.det||"");
                  const isUrgent=t.pri==="긴급";const isHigh=t.pri==="높음";const isLow=t.pri==="낮음";
                  const rowBg=isUrgent?"#fff8f8":isHigh?"#fffdf5":"#fff";
                  const rowBorder=isUrgent?"1px solid #fecaca":isHigh?"1px solid #fde68a":"1px solid #f1f5f9";
                  const taskColor=isUrgent?"#b91c1c":isHigh?"#92400e":isLow?"#94a3b8":"#0f172a";
                  const taskWeight=isUrgent?800:isHigh?700:isLow?400:600;
                  return <tr key={t.id}
                    onMouseEnter={()=>setHoverRow(t.id)}
                    onMouseLeave={()=>setHoverRow(null)}
                    style={{borderBottom:rowBorder,background:hoverRow===t.id?isUrgent?"#fff0f0":isHigh?"#fffbee":"#f0f7ff":rowBg,...(isUrgent?{boxShadow:"inset 3px 0 0 #dc2626"}:isHigh?{boxShadow:"inset 3px 0 0 #d97706"}:{})}}>
                    <td style={{...S.tdc,overflow:"visible"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"완료"});flash("업무가 완료 처리되었습니다");}}
                          style={{width:17,height:17,borderRadius:"50%",border:"2px solid #94a3b8",background:"#fff",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all .15s"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#16a34a";e.currentTarget.style.background="#f0fdf4";(e.currentTarget.querySelector("svg") as HTMLElement).style.opacity="1";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#94a3b8";e.currentTarget.style.background="#fff";(e.currentTarget.querySelector("svg") as HTMLElement).style.opacity="0";}}>
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{opacity:0,transition:"opacity .15s",pointerEvents:"none"}}><path d="M1 3.5L3.5 6L8 1" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                          {editCell?.id===t.id&&editCell?.field==="task"
                            ?<input autoFocus defaultValue={t.task} style={S.iinp}
                               onKeyDown={e=>{if(e.key==="Enter"){updTodo(t.id,{task:e.target.value});setEditCell(null);}if(e.key==="Escape")setEditCell(null);}}
                               onBlur={e=>{updTodo(t.id,{task:e.target.value});setEditCell(null);}}/>
                            :<div style={{display:"flex",alignItems:"center",gap:3}}>
                               <span style={{fontWeight:taskWeight,color:taskColor,cursor:"pointer",fontSize:14}} onClick={()=>setEditCell({id:t.id,field:"task"})}>{t.task}</span>
                               <RepeatBadge repeat={t.repeat}/>
                               {od&&<span style={{color:"#dc2626",fontSize:9}}>⚠️</span>}
                             </div>}
                          {!filters.proj.length&&(()=>{const p=gPr(t.pid);return p.id?<span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:99,background:p.color+"18",color:p.color,border:`1px solid ${p.color}33`,whiteSpace:"nowrap" as const,alignSelf:"flex-start" as const,display:"inline-block"}}>{p.name}</span>:null;})()}
                        </div>
                      </div>
                    </td>
                    <td style={{...S.tdc,maxWidth:0,...(expandMode?{verticalAlign:"top" as const,cursor:"text"}:{})}}
                      onClick={expandMode?e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setNotePopup({todo:t,x:r.left,y:r.bottom});}:undefined}>
                      {expandMode
                        ?<div style={{fontSize:13,color:plain?"#374151":"#c0c8d4",lineHeight:1.7,padding:"4px 6px",fontStyle:plain?"normal":"italic",borderRadius:6,border:"1px solid transparent",transition:"border-color .15s"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="#e2e8f0";(e.currentTarget as HTMLDivElement).style.background="#fafbfc";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="transparent";(e.currentTarget as HTMLDivElement).style.background="transparent";}}
                            dangerouslySetInnerHTML={{__html:t.det||"<span style='color:#c0c8d4;font-style:italic'>메모 추가...</span>"}}/>
                        :<span onClick={e=>{e.stopPropagation();const r=e.currentTarget.closest("td")!.getBoundingClientRect();setNotePopup({todo:t,x:r.left,y:r.bottom});}}
                            style={{fontSize:13,color:plain?"#475569":"#c0c8d4",fontStyle:plain?"normal":"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"block",cursor:"text"}}>
                            {plain?plain.slice(0,50)+(plain.length>50?"…":""):"메모 추가..."}
                          </span>}
                    </td>
                    <CellEdit todo={t} field="who"><div style={{display:"flex",alignItems:"center",gap:4,...(expandMode?{alignSelf:"flex-start" as const}:{})}}><span style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0}}>{t.who[0]}</span><span style={{fontSize:13}}>{t.who}</span></div></CellEdit>
                    <CellEdit todo={t} field="due">{(()=>{const[dpart,tpart]=(t.due||"").split(" ");const fmt12=(v:string)=>{if(!v)return "";const[hh,mm]=v.split(":").map(Number);const ap=hh<12?"오전":"오후";const h12=hh===0?12:hh>12?hh-12:hh;return `${ap} ${h12}:${fmt2(mm)}`;};const dd=dDay(t.due,t.st);return <div style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:2}}>
                      <span style={{fontSize:13,color:od?"#dc2626":"#64748b"}}>{dpart?`${dpart}(${fDow(dpart)})`:"—"}</span>
                      {tpart&&<span style={{fontSize:13,color:od?"#dc2626":"#94a3b8",fontWeight:400}}>{fmt12(tpart)}</span>}
                      {dd&&<span style={{fontSize:10,fontWeight:700,color:dd.color,background:dd.bg,border:`1px solid ${dd.border}`,padding:"1px 6px",borderRadius:4,letterSpacing:"0.02em"}}>{dd.label}</span>}
                    </div>;})()}</CellEdit>
                    {!expandMode&&<>
                      <CellEdit todo={t} field="pri"><span style={{...S.badge(priBg[t.pri],priC[t.pri],`1px solid ${priC[t.pri]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}><span>●</span>{t.pri}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                      <CellEdit todo={t} field="st"><span style={{...S.badge(stBg[t.st],stC[t.st],`1px solid ${stC[t.st]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}>{t.st}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                      <td style={{...S.tdc,overflow:"visible"}} onClick={e=>e.stopPropagation()}>
                        <div style={{padding:"0 4px"}}><ProgressBar value={t.progress??0} onChange={v=>updTodo(t.id,{progress:v})}/></div>
                      </td>
                    </>}
                    <td style={{...S.tdc,padding:"4px 6px",verticalAlign:"middle" as const}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:3,justifyContent:"center",alignItems:"center",opacity:1}}>
                        <button onClick={()=>toggleFav(t.id)} title={isFav(t.id)?"즐겨찾기 해제":"즐겨찾기"} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"2px 3px",lineHeight:1,color:isFav(t.id)?"#f59e0b":"#d1d5db",transition:"color .15s",flexShrink:0}} onMouseEnter={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#fbbf24";}} onMouseLeave={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#d1d5db";}}>{isFav(t.id)?"★":"☆"}</button>
                        <button onClick={()=>setEditMod(t)} style={{background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:10,color:"#475569",borderRadius:5,padding:"3px 6px"}}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();delTodo(t.id)}} style={{background:"#fee2e2",border:"none",cursor:"pointer",fontSize:10,color:"#dc2626",borderRadius:5,padding:"3px 6px",fontWeight:700}}>🗑️</button>
                      </div>
                    </td>
                    <td style={{...S.tdc,padding:"0 6px",textAlign:"center" as const,verticalAlign:"middle" as const}} onClick={e=>e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,e.shiftKey);}}
                        style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                    </td>
                  </tr>})}
                {/* 완료된 항목 구분선 */}
                {sorted.filter(t=>t.st==="완료").length>0&&<tr>
                  <td colSpan={99} style={{padding:"6px 12px",background:"#f0fdf4",borderTop:"2px solid #bbf7d0",cursor:"pointer"}} onClick={()=>setShowDone(p=>!p)}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>✓ 완료됨</span>
                      <span style={{fontSize:10,color:"#86efac"}}>{sorted.filter(t=>t.st==="완료").length}건</span>
                      <span style={{fontSize:10,color:"#4ade80",marginLeft:"auto"}}>{showDone?"접기":"펼치기"}</span>
                    </div>
                  </td>
                </tr>}
                {/* 완료 항목 */}
                {showDone&&sorted.filter(t=>t.st==="완료").map(t=>{const plain=stripHtml(t.det||"");
                  return <tr key={t.id} style={{borderBottom:"1px solid #f1f5f9",background:"#fafafa",opacity:.72}}>
                    <td style={S.tdc}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"대기"});flash("완료가 취소되었습니다");}}
                          style={{width:17,height:17,borderRadius:"50%",border:"2px solid #16a34a",background:"#16a34a",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
                          title="완료 취소">
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:14,color:"#94a3b8",textDecoration:"line-through"}}>{t.task}</span><RepeatBadge repeat={t.repeat}/></div>
                          {!filters.proj.length&&(()=>{const p=gPr(t.pid);return p.id?<span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:99,background:"#f1f5f9",color:"#94a3b8",border:"1px solid #e2e8f0",whiteSpace:"nowrap" as const,alignSelf:"flex-start" as const,display:"inline-block"}}>{p.name}</span>:null;})()}
                        </div>
                      </div>
                    </td>
                    <td style={{...S.tdc,...(expandMode?{verticalAlign:"top" as const}:{})}}>
                      {expandMode
                        ?<div style={{fontSize:13,color:plain?"#94a3b8":"#c0c8d4",lineHeight:1.7,padding:"2px 0",textDecoration:plain?"line-through":"none"}} dangerouslySetInnerHTML={{__html:t.det||"—"}}/>
                        :<span style={{fontSize:13,color:"#c0c8d4",fontStyle:"italic",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{plain?plain.slice(0,50):"—"}</span>}
                    </td>
                    <td style={S.tdc}><span style={{fontSize:13,color:"#94a3b8"}}>{t.who}</span></td>
                    <td style={S.tdc}><span style={{fontSize:13,color:"#94a3b8",textDecoration:"line-through"}}>{t.due}</span></td>
                    {!expandMode&&<>
                      <td style={S.tdc}><span style={{...S.badge("#f1f5f9","#94a3b8")}}>{t.pri}</span></td>
                      <td style={S.tdc}><span style={{...S.badge(stBg[t.st],stC[t.st])}}>{t.st}</span></td>
                      <td style={S.tdc}/>
                    </>}
                    <td style={{...S.tdc,padding:"4px 6px"}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:3,justifyContent:"center",alignItems:"center"}}>
                        <button onClick={()=>toggleFav(t.id)} title={isFav(t.id)?"즐겨찾기 해제":"즐겨찾기"} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"2px 3px",lineHeight:1,color:isFav(t.id)?"#f59e0b":"#d1d5db",transition:"color .15s"}} onMouseEnter={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#fbbf24";}} onMouseLeave={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#d1d5db";}}>{isFav(t.id)?"★":"☆"}</button>
                        <button onClick={e=>{e.stopPropagation();delTodo(t.id)}} style={{background:"#fee2e2",border:"none",cursor:"pointer",fontSize:10,color:"#dc2626",borderRadius:5,padding:"3px 6px",fontWeight:700}}>🗑️</button>
                      </div>
                    </td>
                    <td style={{...S.tdc,padding:"0 6px",textAlign:"center" as const}} onClick={e=>e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,e.shiftKey);}}
                        style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                    </td>
                  </tr>})}
              </tbody>
            </table>
          </div>
        </div>}
        </div>
      </div>}

      {view==="calendar"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>calNav(-1)} style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:13,color:"#64748b"}}>◀</button>
            <button onClick={()=>calNav(1)} style={{width:28,height:28,borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:13,color:"#64748b"}}>▶</button>
            <button onClick={calToday} style={{...S.bs,fontSize:11,padding:"4px 10px"}}>오늘</button>
            <div style={{fontSize:15,fontWeight:800,minWidth:180}}>{calTitle()}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {[["day","일",1],["week","주",2],["month","월",3],["custom",`${customDays}일`,4],["agenda","일정",5]].map(([k,l,n])=>
              <button key={k} onClick={()=>setCalView(k)} style={{padding:"5px 10px",borderRadius:6,border:`1.5px solid ${calView===k?"#2563eb":"#e2e8f0"}`,background:calView===k?"#2563eb":"#fff",color:calView===k?"#fff":"#64748b",fontSize:11,fontWeight:calView===k?600:500,cursor:"pointer"}}>
                <span style={{fontSize:9,opacity:.6,fontWeight:700}}>{n}</span>{l}
              </button>)}
            {calView==="custom"&&<input type="number" min="2" max="14" value={customDays} onChange={e=>setCustomDays(Math.max(2,Math.min(14,parseInt(e.target.value)||4)))} style={{width:44,padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,textAlign:"center"}}/>}
          </div>
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>
          <Chip active={calF===""} onClick={()=>setCalF("")}>전체</Chip>
          {aProj.map(p=><Chip key={p.id} active={calF===String(p.id)} color={p.color} onClick={()=>setCalF(calF===String(p.id)?"":String(p.id))}>{p.name}</Chip>)}
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
          <Chip active={calFWho===""} onClick={()=>setCalFWho("")}>전체</Chip>
          {[...new Set(todos.map(t=>t.who))].map(n=><Chip key={n} active={calFWho===n} onClick={()=>setCalFWho(calFWho===n?"":n)}>{n}</Chip>)}
        </div>
        <div style={{fontSize:10,color:"#94a3b8",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:3}}><span style={{width:12,height:8,borderLeft:"3px dashed #64748b",display:"inline-block"}}/> 반복 업무</span>
          <span style={{display:"inline-flex",alignItems:"center",gap:3}}><span style={{width:12,height:8,borderLeft:"3px solid #64748b",display:"inline-block"}}/> 일반 업무</span>
        </div>

        {calView==="day"&&<div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
          <div style={{maxHeight:500,overflowY:"auto"}}>
            {Array.from({length:24},(_,h)=>{
              const ds=dateStr(calY,calM,calD);
              const hTodos=ftodosExpanded.filter(t=>t.due===ds);
              return <div key={h} style={{display:"flex",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{width:60,padding:"8px",fontSize:10,color:"#94a3b8",textAlign:"right",borderRight:"1px solid #f1f5f9",flexShrink:0}}>{h===0?"종일":h<12?`오전 ${h}시`:h===12?"오후 12시":`오후 ${h-12}시`}</div>
                <div style={{flex:1,minHeight:40,padding:"2px 8px"}}>
                  {h===0&&hTodos.map((t,ii)=>{const p=gPr(t.pid);return <div key={t.id+"_"+ii} onClick={()=>setDetMod(todos.find(x=>x.id===t.id)||t)} style={evStyle(p,t.repeat)}>{t.repeat&&t.repeat!=="없음"?"🔁 ":""}{t.task} — {t.who}</div>})}
                </div>
              </div>})}
          </div>
        </div>}

        {calView==="week"&&<div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
          <div style={{display:"grid",gridTemplateColumns:"60px repeat(7,1fr)",borderBottom:"2px solid #e2e8f0"}}>
            <div style={{padding:8,borderRight:"1px solid #f1f5f9"}}/>
            {weekDates().map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;
              return <div key={i} style={{padding:"8px 4px",textAlign:"center",borderRight:i<6?"1px solid #f1f5f9":"none",background:isT?"#eff6ff":"transparent"}}>
                <div style={{fontSize:10,color:i===0?"#dc2626":"#64748b",fontWeight:600}}>{calDays[i]}</div>
                <div style={{fontSize:16,fontWeight:800,color:isT?"#fff":"#334155",marginTop:2,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#2563eb",width:28,height:28,borderRadius:"50%"}:{})}}>{d.getDate()}</div>
              </div>})}
          </div>
          <div style={{maxHeight:500,overflowY:"auto"}}>
            {[0,8,9,10,11,12,13,14,15,16,17,18].map(h=>
              <div key={h} style={{display:"grid",gridTemplateColumns:"60px repeat(7,1fr)",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{padding:"6px 8px",fontSize:10,color:"#94a3b8",textAlign:"right",borderRight:"1px solid #f1f5f9"}}>{h===0?"종일":h<12?`오전${h}`:h===12?"오후12":`오후${h-12}`}</div>
                {weekDates().map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;const dayT=h===0?ftodosExpanded.filter(t=>t.due===ds):[];
                  return <div key={i} style={{minHeight:36,padding:"1px 3px",borderRight:i<6?"1px solid #f1f5f9":"none",background:isT?"#fafcff":"transparent"}}>
                    {dayT.map((t,ii)=>{const p=gPr(t.pid);return <div key={t.id+"_"+ii} onClick={()=>setDetMod(todos.find(x=>x.id===t.id)||t)} style={{...evStyle(p,t.repeat),fontSize:9}}>{t.repeat&&t.repeat!=="없음"?"🔁 ":""}{t.task}</div>})}
                  </div>})}
              </div>)}
          </div>
        </div>}

        {calView==="month"&&<MultiMonthView calY={calY} calM={calM} ftodos={ftodosExpanded} todayStr={todayStr} gPr={gPr} setDetMod={t=>setDetMod(todos.find(x=>x.id===t.id)||t)} setCalDate={setCalDate} setCalView={setCalView} calDays={calDays} evStyle={evStyle}/>}

        {calView==="custom"&&<div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
          <div style={{display:"grid",gridTemplateColumns:`60px repeat(${customDays},1fr)`,borderBottom:"2px solid #e2e8f0"}}>
            <div style={{padding:8,borderRight:"1px solid #f1f5f9"}}/>
            {customDates().map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const isT=ds===todayStr;
              return <div key={i} style={{padding:"8px 4px",textAlign:"center",borderRight:i<customDays-1?"1px solid #f1f5f9":"none",background:isT?"#eff6ff":"transparent"}}>
                <div style={{fontSize:10,color:d.getDay()===0?"#dc2626":"#64748b",fontWeight:600}}>{calDays[d.getDay()]}</div>
                <div style={{fontSize:16,fontWeight:800,color:isT?"#fff":"#334155",marginTop:2,...(isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#2563eb",width:28,height:28,borderRadius:"50%"}:{})}}>{d.getDate()}</div>
              </div>})}
          </div>
          <div style={{maxHeight:500,overflowY:"auto"}}>
            {[0,9,10,11,12,13,14,15,16,17].map(h=>
              <div key={h} style={{display:"grid",gridTemplateColumns:`60px repeat(${customDays},1fr)`,borderBottom:"1px solid #f1f5f9"}}>
                <div style={{padding:"6px 8px",fontSize:10,color:"#94a3b8",textAlign:"right",borderRight:"1px solid #f1f5f9"}}>{h===0?"종일":h<12?`오전${h}`:h===12?"오후12":`오후${h-12}`}</div>
                {customDates().map((d,i)=>{const ds=dateStr(d.getFullYear(),d.getMonth(),d.getDate());const dayT=h===0?ftodosExpanded.filter(t=>t.due===ds):[];
                  return <div key={i} style={{minHeight:36,padding:"1px 3px",borderRight:i<customDays-1?"1px solid #f1f5f9":"none"}}>
                    {dayT.map((t,ii)=>{const p=gPr(t.pid);return <div key={t.id+"_"+ii} onClick={()=>setDetMod(todos.find(x=>x.id===t.id)||t)} style={{...evStyle(p,t.repeat),fontSize:9}}>{t.repeat&&t.repeat!=="없음"?"🔁 ":""}{t.task}</div>})}
                  </div>})}
              </div>)}
          </div>
        </div>}

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
                {item.todos.map((t,ii)=>{const p=gPr(t.pid);const od=isOD(t.due,t.st);
                  return <div key={t.id+"_"+ii} onClick={()=>setDetMod(todos.find(x=>x.id===t.id)||t)} style={{padding:"10px 16px 10px 66px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:4,height:28,borderRadius:2,background:p.color,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
                        {t.task}{od&&<span style={{color:"#dc2626",fontSize:10}}>⚠️</span>}<RepeatBadge repeat={t.repeat}/>
                      </div>
                      <div style={{fontSize:10,color:"#94a3b8",marginTop:2,display:"flex",gap:8}}>
                        <span>{p.name}</span><span>{t.who}</span><span style={S.badge(priBg[t.pri],priC[t.pri])}>{t.pri}</span><span style={S.badge(stBg[t.st],stC[t.st])}>{t.st}</span>
                      </div>
                    </div>
                  </div>})}
              </div>})}
          </div>}
        </div>}
        <div style={{marginTop:8,textAlign:"center",fontSize:10,color:"#94a3b8"}}>키보드 단축키: 1일 2주 3월 4커스텀 5일정</div>
      </div>}
    </main>

    <DateTimePicker datePop={datePop} onSave={(id,val)=>{updTodo(id,{due:val});setDatePop(null);setEditCell(null);}} onClose={()=>{setDatePop(null);setEditCell(null);}}/>
    <DateTimePicker datePop={nrDatePop} onSave={(id,val)=>{const n=[...newRows];n[id].due=val;setNewRows(n);setNrDatePop(null);}} onClose={()=>setNrDatePop(null)}/>
    {/* 다중 선택 액션바 */}
    {selectedIds.size>0&&<div onClick={()=>setMovePop(false)} style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",zIndex:2000,display:"flex",alignItems:"center",gap:2,background:"#1e293b",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.35)",padding:"8px 10px 8px 14px",animation:"slideUp .2s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"#2563eb",color:"#fff",fontSize:11,fontWeight:800,marginRight:8,flexShrink:0}}>{selectedIds.size}</div>
      {[
        {label:"복제하기",icon:"⧉",fn:()=>{const base=Math.max(...todos.map(t=>t.id),0);let i=1;const copies=todos.filter(t=>selectedIds.has(t.id)).map(t=>({...t,id:base+i++,task:t.task+" (복사)",cre:td(),done:null}));setTodos(p=>[...p,...copies]);setNId(n=>n+copies.length);clrSel();flash(`${copies.length}건이 복제되었습니다`)}},
        {label:"완료 표시",icon:"✓",fn:()=>{selectedIds.forEach(id=>updTodo(id,{st:"완료",done:td(),progress:100}));flash(`${selectedIds.size}건이 완료 처리되었습니다`);clrSel()}},
        {label:"삭제",icon:"🗑",fn:()=>{if(!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`))return;setTodos(p=>p.filter(t=>!selectedIds.has(t.id)));flash(`${selectedIds.size}건이 삭제되었습니다`,"err");clrSel()},danger:true},
      ].map(({label,icon,fn,danger})=>
        <button key={label} onClick={fn} style={{display:"flex",alignItems:"center",gap:5,background:danger?"#dc2626":"transparent",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:danger?"#fff":"#cbd5e1",fontSize:12,fontWeight:600,transition:"background .12s"}}
          onMouseEnter={e=>{if(!danger)(e.currentTarget as HTMLButtonElement).style.background="#334155";}}
          onMouseLeave={e=>{if(!danger)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
          <span style={{fontSize:13}}>{icon}</span>{label}
        </button>
      )}
      <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setMovePop(p=>!p)}
          style={{display:"flex",alignItems:"center",gap:5,background:movePop?"#334155":"transparent",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"#cbd5e1",fontSize:12,fontWeight:600}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#334155";}}
          onMouseLeave={e=>{if(!movePop)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
          <span style={{fontSize:13}}>📁</span>프로젝트 이동
        </button>
        {movePop&&<div style={{position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#fff",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.18)",border:"1px solid #e2e8f0",minWidth:200,overflow:"hidden",zIndex:10}}>
          <div style={{padding:"8px 12px 6px",fontSize:11,fontWeight:700,color:"#94a3b8",borderBottom:"1px solid #f1f5f9"}}>이동할 프로젝트 선택</div>
          {aProj.map(p=><button key={p.id} onClick={()=>{setTodos(prev=>prev.map(t=>selectedIds.has(t.id)?{...t,pid:p.id}:t));flash(`${selectedIds.size}건이 "${p.name}" 프로젝트로 이동되었습니다`);setMovePop(false);clrSel();}}
            style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#334155",textAlign:"left" as const}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#f8fafc";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="none";}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:p.color,flexShrink:0,display:"inline-block"}}/>
            {p.name}
          </button>)}
        </div>}
      </div>
      <div style={{width:1,height:20,background:"#334155",margin:"0 4px"}}/>
      <button onClick={clrSel} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:16,padding:"4px 6px",borderRadius:6,lineHeight:1}}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#334155";(e.currentTarget as HTMLButtonElement).style.color="#fff";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="none";(e.currentTarget as HTMLButtonElement).style.color="#64748b";}}>✕</button>
    </div>}

    <Modal open={!!editMod} onClose={()=>setEditMod(null)} title={editMod?.id?"업무 수정":"새 업무"} footer={<>{editMod?.id&&<button style={{...S.bd,marginRight:"auto"}} onClick={()=>{const id=parseInt(editMod.id);setEditMod(null);delTodo(id)}}>🗑️ 삭제</button>}<button style={S.bs} onClick={()=>setEditMod(null)}>취소</button><button style={S.bp} onClick={()=>saveMod(editMod)}>💾 저장</button></>}>
      {editMod&&<EditForm f={editMod} onChange={setEditMod} proj={aProj} members={members} pris={pris} stats={stats}/>}
    </Modal>

    <Modal open={!!detMod} onClose={()=>setDetMod(null)} title={detMod?.task||""} footer={<><button style={{...S.bd,marginRight:"auto"}} onClick={()=>{delTodo(detMod.id);setDetMod(null)}}>🗑️</button><button style={S.bs} onClick={()=>setDetMod(null)}>닫기</button><button style={S.bp} onClick={()=>{setEditMod(detMod);setDetMod(null)}}>✏️ 수정</button></>}>
      {detMod&&<DetailView t={detMod} p={gPr(detMod.pid)} stats={stats} stC={stC} stBg={stBg} priC={priC} priBg={priBg} onSt={st=>{updTodo(detMod.id,{st});setDetMod({...detMod,st});flash(`상태가 "${st}"(으)로 변경되었습니다`)}}/>}
    </Modal>

    <Modal open={projMod} onClose={()=>setProjMod(false)} title="📁 프로젝트 관리" footer={<button style={S.bs} onClick={()=>setProjMod(false)}>닫기</button>}>
      <ProjMgr projects={projects} todos={todos}
        onAdd={p=>{const np={...p,id:pNId};setProjects(prev=>[...prev,np]);setPNId(pNId+1);flash(`"${p.name}" 프로젝트가 추가되었습니다`)}}
        onDel={id=>{if(todos.some(t=>t.pid===id)){alert("해당 프로젝트에 업무가 존재하여 삭제할 수 없습니다.");return;}setProjects(p=>p.filter(x=>x.id!==id));flash("프로젝트가 삭제되었습니다","err")}}
        onEdit={(id,u)=>{setProjects(p=>p.map(x=>{if(x.id!==id)return x;return{...x,...u};}));flash("프로젝트 정보가 수정되었습니다")}}/>
    </Modal>

    <Modal open={settMod} onClose={()=>setSettMod(false)} title="⚙️ 설정" footer={<button style={S.bs} onClick={()=>setSettMod(false)}>닫기</button>}>
      <SettingsMgr members={members} setMembers={setMembers} pris={pris} setPris={setPris} stats={stats} setStats={setStats} priC={priC} setPriC={setPriC} priBg={priBg} setPriBg={setPriBg} stC={stC} setStC={setStC} stBg={stBg} setStBg={setStBg} todos={todos} flash={flash} apiKey={apiKey} setApiKey={setApiKey}/>
    </Modal>

    {chipAdd&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setChipAdd(null)}}>
      <div style={{background:"#fff",borderRadius:12,padding:20,width:320,boxShadow:"0 10px 25px rgba(0,0,0,.15)"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{({proj:"📁 프로젝트",who:"👤 담당자",pri:"🔥 우선순위",st:"📋 상태"})[chipAdd]} 추가</div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
          {chipAdd!=="who"&&<input type="color" value={chipColor} onChange={e=>setChipColor(e.target.value)} style={{width:36,height:34,padding:1,borderRadius:6,cursor:"pointer",border:"1px solid #e2e8f0"}}/>}
          <input autoFocus value={chipVal} onChange={e=>setChipVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addChip()}} placeholder="이름 입력" style={{flex:1,padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}><button style={S.bs} onClick={()=>setChipAdd(null)}>취소</button><button style={S.bp} onClick={addChip}>추가</button></div>
      </div>
    </div>}
    <Toast msg={toast.m} type={toast.t}/>
    {notePopup&&<NotePopup
      key={notePopup.todo.id}
      todo={notePopup.todo}
      x={notePopup.x}
      y={notePopup.y}
      onSave={text=>{if(notePopup._newRow!=null){const n=[...newRows];n[notePopup._newRow].det=text;setNewRows(n);}else{updTodo(notePopup.todo.id,{det:text});}}}
      onClose={()=>setNotePopup(null)}
    />}
    {detPopup&&<CellRichPopup
      todo={detPopup}
      onSave={html=>{
        if(detPopup._newRow!=null){
          const n=[...newRows]; n[detPopup._newRow].det=html; setNewRows(n);
        } else {
          updTodo(detPopup.id,{det:html});
        }
      }}
      onClose={()=>setDetPopup(null)}
    />}
  </div>;
}

function Dashboard({todos,projects,members,priC,priBg,stC,stBg,gPr}){
  const [tab,setTab]=useState("member"); // "member" | "project"
  const aProj=projects.filter(p=>p.status==="활성");
  const total=todos.length;
  const done=todos.filter(t=>t.st==="완료").length;
  const inProg=todos.filter(t=>t.st==="진행중"||t.st==="검토").length;
  const delayed=todos.filter(t=>isOD(t.due,t.st)).length;
  const avgProg=total?Math.round(todos.reduce((s,t)=>s+(t.progress||0),0)/total):0;

  const stColors={대기:"#94a3b8",진행중:"#2563eb",검토:"#d97706",완료:"#16a34a"};
  const stBgs={대기:"#f1f5f9",진행중:"#dbeafe",검토:"#fef3c7",완료:"#dcfce7"};

  // 팀원별 데이터
  const memberData=members.map(n=>{
    const mt=todos.filter(t=>t.who===n);
    const byProj=aProj.map(p=>({proj:p,cnt:mt.filter(t=>t.pid===p.id).length})).filter(x=>x.cnt>0);
    const bySt={대기:mt.filter(t=>t.st==="대기").length,진행중:mt.filter(t=>t.st==="진행중").length,검토:mt.filter(t=>t.st==="검토").length,완료:mt.filter(t=>t.st==="완료").length};
    const avgP=mt.length?Math.round(mt.reduce((s,t)=>s+(t.progress||0),0)/mt.length):0;
    const hasDelayed=mt.some(t=>isOD(t.due,t.st));
    return {name:n,total:mt.length,done:bySt["완료"],avgP,bySt,byProj,hasDelayed};
  }).filter(m=>m.total>0).sort((a,b)=>b.total-a.total);

  // 프로젝트별 데이터
  const projData=aProj.map(p=>{
    const pt=todos.filter(t=>t.pid===p.id);
    const byMember=members.map(n=>({name:n,cnt:pt.filter(t=>t.who===n).length})).filter(x=>x.cnt>0);
    const bySt={대기:pt.filter(t=>t.st==="대기").length,진행중:pt.filter(t=>t.st==="진행중").length,검토:pt.filter(t=>t.st==="검토").length,완료:pt.filter(t=>t.st==="완료").length};
    const avgP=pt.length?Math.round(pt.reduce((s,t)=>s+(t.progress||0),0)/pt.length):0;
    const delayed=pt.filter(t=>isOD(t.due,t.st)).length;
    return {proj:p,total:pt.length,done:bySt["완료"],avgP,bySt,byMember,delayed};
  }).filter(p=>p.total>0);

  const tS=a=>({padding:"8px 16px",fontSize:12,fontWeight:a?700:500,color:a?"#2563eb":"#64748b",background:a?"#eff6ff":"transparent",border:"none",borderBottom:a?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"});

  const StatBar=({bySt,total})=><div style={{display:"flex",height:6,borderRadius:99,overflow:"hidden",gap:1}}>
    {["대기","진행중","검토","완료"].map(s=>bySt[s]>0&&<div key={s} title={`${s}: ${bySt[s]}건`} style={{width:`${bySt[s]/total*100}%`,background:stColors[s],minWidth:3}}/>)}
  </div>;

  const MemberAvatar=({name,size=32})=>{
    const colors=["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#d97706"];
    const bg=colors[members.indexOf(name)%colors.length];
    return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.38,flexShrink:0}}>{name[0]}</div>;
  };

  return <div>
    {/* 요약 카드 4개 */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      {[["#2563eb","📋",total,"전 체 업 무"],["#d97706","⚡",inProg,"진행 중"],["#16a34a","✅",done,"완 료"],["#dc2626","⚠️",delayed,"지 연"]].map(([c,ic,v,l])=>
        <div key={l} style={{...S.card,borderTop:`3px solid ${c}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:22}}>{ic}</div>
          <div><div style={{fontSize:26,fontWeight:800,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{l}</div></div>
        </div>)}
    </div>

    {/* 전체 진행률 + 상태 분포 */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>전체 평균 진행률</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:8}}>
          <div style={{fontSize:36,fontWeight:800,color:"#1a2332",lineHeight:1}}>{avgProg}<span style={{fontSize:18,color:"#94a3b8"}}>%</span></div>
        </div>
        <div style={{height:10,borderRadius:99,background:"#f1f5f9",overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:99,background:avgProg===100?"#16a34a":avgProg>=50?"linear-gradient(90deg,#ea580c,#eab308)":"linear-gradient(90deg,#dc2626,#f97316)",width:`${avgProg}%`,transition:"width .3s"}}/>
        </div>
      </div>
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>상태별 분포</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {["대기","진행중","검토","완료"].map(s=>{const cnt=todos.filter(t=>t.st===s).length;const pct=total?Math.round(cnt/total*100):0;
            return <div key={s} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:42,fontSize:10,fontWeight:600,color:stColors[s],textAlign:"right"}}>{s}</div>
              <div style={{flex:1,height:8,borderRadius:99,background:"#f1f5f9",overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:99,background:stColors[s],width:`${pct}%`,transition:"width .3s"}}/>
              </div>
              <div style={{fontSize:10,color:"#64748b",width:30,textAlign:"right"}}>{cnt}건</div>
            </div>})}
        </div>
      </div>
    </div>

    {/* 탭: 인원별 / 프로젝트별 */}
    <div style={{...S.card,padding:0,overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"2px solid #e2e8f0"}}>
        <button style={tS(tab==="member")} onClick={()=>setTab("member")}>👤 인원별 업무 현황</button>
        <button style={tS(tab==="project")} onClick={()=>setTab("project")}>📁 프로젝트별 업무 현황</button>
      </div>

      {/* 인원별 */}
      {tab==="member"&&<div style={{padding:16}}>
        {/* 리소스 히트맵 헤더 */}
        <div style={{display:"grid",gridTemplateColumns:"120px repeat("+aProj.length+",1fr)",gap:4,marginBottom:8,alignItems:"center"}}>
          <div style={{fontSize:10,color:"#94a3b8"}}></div>
          {aProj.map(p=><div key={p.id} style={{fontSize:9,fontWeight:700,color:p.color,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>)}
        </div>
        {/* 히트맵 행 */}
        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:20}}>
          {memberData.map(m=><div key={m.name} style={{display:"grid",gridTemplateColumns:"120px repeat("+aProj.length+",1fr)",gap:4,alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <MemberAvatar name={m.name} size={22}/>
              <span style={{fontSize:11,fontWeight:600,color:"#1a2332"}}>{m.name}</span>
              {m.hasDelayed&&<span title="지연 업무 있음" style={{fontSize:9,color:"#dc2626"}}>⚠️</span>}
            </div>
            {aProj.map(p=>{
              const cnt=m.byProj.find(x=>x.proj.id===p.id)?.cnt||0;
              const intensity=cnt===0?0:Math.min(1,cnt/4);
              return <div key={p.id} title={`${m.name} × ${p.name}: ${cnt}건`}
                style={{height:28,borderRadius:6,background:cnt===0?"#f8fafc":`${p.color}${Math.round(intensity*200+30).toString(16).padStart(2,"0")}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,
                  color:cnt===0?"#e2e8f0":cnt>=3?"#fff":p.color,border:`1px solid ${cnt===0?"#f1f5f9":p.color+"44"}`}}>
                {cnt>0?cnt:""}
              </div>})}
          </div>)}
        </div>

        {/* 담당자 카드 */}
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>담당자 상세</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
          {memberData.map(m=><div key={m.name} style={{border:"1.5px solid #e2e8f0",borderRadius:10,padding:12,background:"#fafafa"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <MemberAvatar name={m.name}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontWeight:700,fontSize:13}}>{m.name}</span>
                  {m.hasDelayed&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600}}>⚠️ 지연</span>}
                </div>
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>총 {m.total}건 · 완료 {m.done}건 · 평균 {m.avgP}%</div>
              </div>
              <div style={{fontSize:20,fontWeight:800,color:m.avgP===100?"#16a34a":m.avgP>=50?"#d97706":"#2563eb"}}>{m.avgP}<span style={{fontSize:10}}>%</span></div>
            </div>
            <StatBar bySt={m.bySt} total={m.total}/>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:8}}>
              {["대기","진행중","검토","완료"].map(s=>m.bySt[s]>0&&
                <span key={s} style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:stBgs[s],color:stColors[s],fontWeight:600}}>{s} {m.bySt[s]}</span>)}
            </div>
            <div style={{marginTop:8,display:"flex",gap:3,flexWrap:"wrap"}}>
              {m.byProj.map(({proj,cnt})=><span key={proj.id} style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,border:`1px solid ${proj.color}33`}}>{proj.name} {cnt}</span>)}
            </div>
          </div>)}
        </div>
      </div>}

      {/* 프로젝트별 */}
      {tab==="project"&&<div style={{padding:16}}>
        {/* 프로젝트 × 담당자 히트맵 */}
        <div style={{display:"grid",gridTemplateColumns:"140px repeat("+memberData.length+",1fr)",gap:4,marginBottom:8,alignItems:"center"}}>
          <div/>
          {memberData.map(m=><div key={m.name} style={{textAlign:"center"}}>
            <MemberAvatar name={m.name} size={22}/>
          </div>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:20}}>
          {projData.map(({proj,byMember,total:pt})=><div key={proj.id} style={{display:"grid",gridTemplateColumns:"140px repeat("+memberData.length+",1fr)",gap:4,alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:proj.color,flexShrink:0,display:"inline-block"}}/>
              <span style={{fontSize:10,fontWeight:700,color:proj.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{proj.name}</span>
            </div>
            {memberData.map(m=>{
              const cnt=byMember.find(x=>x.name===m.name)?.cnt||0;
              const intensity=cnt===0?0:Math.min(1,cnt/4);
              return <div key={m.name} title={`${proj.name} × ${m.name}: ${cnt}건`}
                style={{height:28,borderRadius:6,background:cnt===0?"#f8fafc":`${proj.color}${Math.round(intensity*200+30).toString(16).padStart(2,"0")}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,
                  color:cnt===0?"#e2e8f0":cnt>=3?"#fff":proj.color,border:`1px solid ${cnt===0?"#f1f5f9":proj.color+"44"}`}}>
                {cnt>0?cnt:""}
              </div>})}
          </div>)}
        </div>

        {/* 프로젝트 카드 */}
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>프로젝트 상세</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {projData.map(({proj,total:pt,done,avgP,bySt,byMember,delayed})=><div key={proj.id}
            style={{border:`1.5px solid ${proj.color}44`,borderLeft:`4px solid ${proj.color}`,borderRadius:10,padding:14,background:"#fafafa"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span style={{fontWeight:700,fontSize:14,color:proj.color}}>{proj.name}</span>
                  {delayed>0&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600}}>⚠️ 지연 {delayed}건</span>}
                </div>
                <div style={{fontSize:10,color:"#64748b"}}>총 {pt}건 · 완료 {done}건 · 평균 진행률 {avgP}%</div>
              </div>
              {/* 미니 도넛 (SVG) */}
              <svg width={52} height={52} viewBox="0 0 52 52">
                <circle cx={26} cy={26} r={20} fill="none" stroke="#f1f5f9" strokeWidth={7}/>
                <circle cx={26} cy={26} r={20} fill="none" stroke={proj.color} strokeWidth={7}
                  strokeDasharray={`${avgP*1.257} 125.7`} strokeLinecap="round"
                  transform="rotate(-90 26 26)" opacity={.85}/>
                <text x={26} y={30} textAnchor="middle" fontSize={11} fontWeight={700} fill={proj.color}>{avgP}%</text>
              </svg>
            </div>
            <StatBar bySt={bySt} total={pt}/>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8,alignItems:"center"}}>
              {["대기","진행중","검토","완료"].map(s=>bySt[s]>0&&
                <span key={s} style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:stBgs[s],color:stColors[s],fontWeight:600}}>{s} {bySt[s]}</span>)}
              <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                {byMember.map(({name,cnt})=><div key={name} title={`${name}: ${cnt}건`} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:"#64748b"}}>
                  <MemberAvatar name={name} size={18}/><span>{cnt}</span>
                </div>)}
              </div>
            </div>
          </div>)}
        </div>
      </div>}
    </div>
  </div>;
}

function SectionLabel({num, title, sub}){
  return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
    <div style={{fontSize:10,fontWeight:800,color:"#fff",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",borderRadius:6,padding:"3px 8px",letterSpacing:.5,flexShrink:0}}>{num}</div>
    <div style={{fontSize:14,fontWeight:700,color:"#1a2332"}}>{title}</div>
    {sub&&<div style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>{sub}</div>}
    <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
  </div>;
}

function MultiMonthView({calY,calM,ftodos,todayStr,gPr,setDetMod,setCalDate,setCalView,calDays,evStyle}){
  const months=Array.from({length:3},(_,i)=>{let y=calY,m=calM+i;if(m>11){m-=12;y++;}return{y,m}});
  const monthCellsFor=(y,m)=>{
    const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),pd=new Date(y,m,0).getDate();
    let c=[];
    for(let i=fd-1;i>=0;i--)c.push({d:pd-i,cur:false});
    for(let d=1;d<=dim;d++){const ds=dateStr(y,m,d);c.push({d,cur:true,ds,isT:ds===todayStr});}
    const rem=7-c.length%7;if(rem<7)for(let j=1;j<=rem;j++)c.push({d:j,cur:false});
    return c;
  };
  const monthNames=["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  return <div style={{display:"flex",flexDirection:"column",gap:0,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
    {months.map(({y,m},mi)=><div key={`${y}-${m}`}>
      <div style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{y}년 {monthNames[m]}</div>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,.2)"}}/>
        <div style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>{ftodos.filter(t=>t.due&&t.due.startsWith(`${y}-${fmt2(m+1)}`)).length}건</div>
      </div>
      {mi===0&&<div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
        {calDays.map((d,i)=><div key={d} style={{padding:"6px 4px",textAlign:"center",fontSize:10,fontWeight:700,color:i===0?"#dc2626":"#64748b"}}>{d}</div>)}
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#fff"}}>
        {monthCellsFor(y,m).map((c,i)=>{
          const dayT=c.ds?ftodos.filter(t=>t.due===c.ds):[];
          const isWeekStart=(i%7)===0;
          return <div key={i} style={{minHeight:84,padding:4,borderRight:((i+1)%7)?"1px solid #f1f5f9":"none",borderBottom:"1px solid #f1f5f9",background:c.isT?"#eff6ff":c.cur?"#fff":"#f8fafc",overflow:"hidden",cursor:c.ds?"pointer":"default"}}
            onClick={()=>{if(c.ds){const dd=new Date(c.ds);setCalDate(dd);setCalView("day")}}}>
            <div style={{fontSize:11,fontWeight:600,marginBottom:2,color:c.isT?"#fff":!c.cur?"#94a3b8":isWeekStart?"#dc2626":"#334155",...(c.isT?{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#2563eb",width:20,height:20,borderRadius:"50%",fontSize:10}:{padding:"1px 4px"})}}>
              {c.d}
            </div>
            {dayT.slice(0,3).map((t,ii)=>{const p=gPr(t.pid);return <div key={t.id+"_"+ii} onClick={e=>{e.stopPropagation();setDetMod(t)}} style={evStyle(p,t.repeat)}>{t.repeat&&t.repeat!=="없음"?"🔁 ":""}{t.task}</div>})}
            {dayT.length>3&&<div style={{fontSize:8,color:"#94a3b8",paddingLeft:4}}>+{dayT.length-3}</div>}
          </div>})}
      </div>
    </div>)}
  </div>;
}

function EditForm({f,onChange,proj,members,pris,stats}){
  const u=(k,v)=>onChange({...f,[k]:v});
  return <>
    <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>프로젝트 *</label><select value={f.pid||""} onChange={e=>u("pid",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}><option value="">선택</option>{proj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>업무내용 *</label><input value={f.task||""} onChange={e=>u("task",e.target.value)} maxLength={50} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>담당자 *</label><select value={f.who||""} onChange={e=>u("who",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}><option value="">선택</option>{members.map(m=><option key={m}>{m}</option>)}</select></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>마감기한 *</label><input type="date" value={f.due||""} onChange={e=>u("due",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}/></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>우선순위</label><select value={f.pri||"보통"} onChange={e=>u("pri",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}>{pris.map(p=><option key={p}>{p}</option>)}</select></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>상태</label><select value={f.st||"대기"} onChange={e=>u("st",e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:13,fontFamily:"inherit"}}>{stats.map(s=><option key={s}>{s}</option>)}</select></div>
    </div>
    <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:4}}>🔁 반복</label>
      <div style={{display:"flex",gap:6}}>
        {REPEAT_OPTS.map(r=><button key={r} onClick={()=>u("repeat",r)} style={{flex:1,padding:"7px 4px",borderRadius:7,border:`1.5px solid ${(f.repeat||"없음")===r?"#2563eb":"#e2e8f0"}`,background:(f.repeat||"없음")===r?"#eff6ff":"#fff",color:(f.repeat||"없음")===r?"#2563eb":"#64748b",fontSize:11,fontWeight:(f.repeat||"없음")===r?700:500,cursor:"pointer",fontFamily:"inherit"}}>{r==="없음"?"반복 없음":r}</button>)}
      </div>
    </div>
    {/* 리치 텍스트 에디터 */}
    <div style={{marginBottom:4}}><label style={{fontSize:11,fontWeight:600,color:"#334155",display:"block",marginBottom:6}}>📝 상세내용</label>
      <RichEditor value={f.det||""} onChange={v=>u("det",v)}/>
    </div>
  </>;
}

function DetailView({t,p,stats,stC,stBg,priC,priBg,onSt}){
  const od=isOD(t.due,t.st);
  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"#f8fafc",border:"1px solid #e2e8f0"}}><span style={{width:6,height:6,borderRadius:"50%",background:p.color,display:"inline-block"}}/>{p.name}</div>
      <span style={{...S.badge(priBg[t.pri],priC[t.pri])}}>{t.pri}</span>
      <span style={{...S.badge(stBg[t.st],stC[t.st])}}>{t.st}</span>
      {t.repeat&&t.repeat!=="없음"&&<span style={S.repeatBadge}>🔁 {t.repeat}</span>}
      {od&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600}}>⚠️지연</span>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,background:"#f8fafc",padding:10,borderRadius:7,fontSize:12}}>
      <div><div style={{fontSize:9,color:"#94a3b8"}}>담당자</div><b>{t.who}</b></div>
      <div><div style={{fontSize:9,color:"#94a3b8"}}>마감 기준일</div><b style={{color:od?"#dc2626":"inherit"}}>{t.due}</b></div>
      <div><div style={{fontSize:9,color:"#94a3b8"}}>등록</div>{t.cre||"—"}</div>
      <div><div style={{fontSize:9,color:"#94a3b8"}}>완료</div>{t.done||"—"}</div>
    </div>
    {t.det&&<div>
      <div style={{fontSize:10,fontWeight:600,color:"#64748b",marginBottom:6}}>📝 상세내용</div>
      <div style={{fontSize:13,lineHeight:1.7,padding:"10px 12px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}
        dangerouslySetInnerHTML={{__html: t.det}}/>
    </div>}
    <div><div style={{fontSize:10,fontWeight:600,color:"#64748b",marginBottom:5}}>상태 변경</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{stats.map(s=><button key={s} onClick={()=>onSt(s)} style={{padding:"4px 10px",borderRadius:99,border:`1.5px solid ${t.st===s?"#2563eb":"#e2e8f0"}`,background:t.st===s?"#eff6ff":"#fff",color:t.st===s?"#2563eb":"#64748b",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>)}</div>
    </div>
  </div>;
}

function ProjMgr({projects,todos,onAdd,onDel,onEdit}){
  const usedColors=projects.map(p=>p.color);
  const nextColor=PROJ_PALETTE.find(c=>!usedColors.includes(c))||PROJ_PALETTE[0];
  const [nm,setNm]=useState("");
  const [co,setCo]=useState(nextColor);
  return <>
    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
      {projects.map(p=>{const c=todos.filter(t=>t.pid===p.id).length;return <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:"#f8fafc",borderRadius:7,border:"1px solid #e2e8f0",fontSize:12}}>
        <input type="color" value={p.color} onChange={e=>onEdit(p.id,{color:e.target.value})} title="색상 변경" style={{width:20,height:20,padding:0,border:"1px solid #e2e8f0",borderRadius:4,cursor:"pointer",flexShrink:0}}/>
        <div style={{flex:1,fontWeight:600}}>{p.name}</div>
        <span style={{fontSize:10,color:"#94a3b8"}}>{c}건</span>
        <button onClick={()=>{const n=prompt("이름:",p.name);if(n)onEdit(p.id,{name:n.trim()})}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>✏️</button>
        <button onClick={()=>{if(window.confirm("해당 프로젝트를 삭제하시겠습니까?"))onDel(p.id)}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>🗑️</button>
      </div>})}
    </div>
    <div style={{borderTop:"1px solid #e2e8f0",paddingTop:10}}><div style={{fontSize:11,fontWeight:600,marginBottom:5}}>새 프로젝트</div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}><input type="color" value={co} onChange={e=>setCo(e.target.value)} style={{width:32,height:28,borderRadius:5,cursor:"pointer",border:"1px solid #e2e8f0"}}/><input value={nm} onChange={e=>setNm(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nm.trim()){onAdd({name:nm.trim(),color:co,status:"활성"});setNm("");const nu=[...usedColors,co];setCo(PROJ_PALETTE.find(c=>!nu.includes(c))||PROJ_PALETTE[0])}}} placeholder="이름" style={{flex:1,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,outline:"none",fontFamily:"inherit"}}/><button style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={()=>{if(!nm.trim())return;onAdd({name:nm.trim(),color:co,status:"활성"});setNm("");const nu=[...usedColors,co];setCo(PROJ_PALETTE.find(c=>!nu.includes(c))||PROJ_PALETTE[0])}}>추가</button></div>
    </div>
  </>;
}

function SettingsMgr({members,setMembers,pris,setPris,stats,setStats,priC,setPriC,priBg,setPriBg,stC,setStC,stBg,setStBg,todos,flash,apiKey,setApiKey}){
  const [tab,setTab]=useState("members");
  const [nv,setNv]=useState("");const [nc,setNc]=useState("#8b5cf6");
  const [delConfirm,setDelConfirm]=useState(null);
  const [keyDraft,setKeyDraft]=useState(apiKey||"");
  const tS=a=>({padding:"8px 14px",fontSize:12,fontWeight:a?600:500,color:a?"#2563eb":"#64748b",background:a?"#eff6ff":"transparent",border:"none",borderBottom:a?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"});
  const items=tab==="members"?members:tab==="pris"?pris:stats;
  const add=()=>{if(!nv.trim())return;const v=nv.trim();
    if(tab==="members"){if(!members.includes(v))setMembers(p=>[...p,v]);flash(`담당자 "${v}"이(가) 추가되었습니다`);}
    else if(tab==="pris"){if(!pris.includes(v)){setPris(p=>[...p,v]);setPriC(p=>({...p,[v]:nc}));setPriBg(p=>({...p,[v]:nc+"18"}));}flash(`우선순위 "${v}"이(가) 추가되었습니다`);}
    else{if(!stats.includes(v)){setStats(p=>[...p,v]);setStC(p=>({...p,[v]:nc}));setStBg(p=>({...p,[v]:nc+"18"}));}flash(`상태 "${v}"이(가) 추가되었습니다`);}
    setNv("")};
  const edit=old=>{const n=prompt("이름:",old);if(!n||!n.trim()||n.trim()===old)return;const v=n.trim();
    if(tab==="members")setMembers(p=>p.map(m=>m===old?v:m));
    else if(tab==="pris"){setPris(p=>p.map(x=>x===old?v:x));setPriC(p=>{const c={...p};c[v]=c[old];delete c[old];return c});setPriBg(p=>{const c={...p};c[v]=c[old];delete c[old];return c});}
    else{setStats(p=>p.map(x=>x===old?v:x));setStC(p=>{const c={...p};c[v]=c[old];delete c[old];return c});setStBg(p=>{const c={...p};c[v]=c[old];delete c[old];return c});}
    flash(`변경사항이 저장되었습니다`)};
  const tryDel=v=>{const cnt=tab==="members"?todos.filter(t=>t.who===v).length:tab==="pris"?todos.filter(t=>t.pri===v).length:todos.filter(t=>t.st===v).length;
    if(cnt){flash(`해당 항목을 사용 중인 업무가 ${cnt}건 있어 삭제할 수 없습니다`,"err");return;}setDelConfirm({value:v,tab});};
  const doDel=()=>{if(!delConfirm)return;const v=delConfirm.value;
    if(delConfirm.tab==="members")setMembers(p=>p.filter(m=>m!==v));
    else if(delConfirm.tab==="pris"){setPris(p=>p.filter(x=>x!==v));setPriC(p=>{const c={...p};delete c[v];return c});setPriBg(p=>{const c={...p};delete c[v];return c});}
    else{setStats(p=>p.filter(x=>x!==v));setStC(p=>{const c={...p};delete c[v];return c});setStBg(p=>{const c={...p};delete c[v];return c});}
    flash(`"${v}"이(가) 삭제되었습니다`,"err");setDelConfirm(null);};
  const chgColor=(v,c)=>{if(tab==="pris"){setPriC(p=>({...p,[v]:c}));setPriBg(p=>({...p,[v]:c+"18"}));}else{setStC(p=>({...p,[v]:c}));setStBg(p=>({...p,[v]:c+"18"}));}};
  return <div>
    <div style={{display:"flex",borderBottom:"1px solid #e2e8f0",marginBottom:14,flexWrap:"wrap"}}>
      <button style={tS(tab==="members")} onClick={()=>setTab("members")}>👤 담당자 ({members.length})</button>
      <button style={tS(tab==="pris")} onClick={()=>setTab("pris")}>🔥 우선순위 ({pris.length})</button>
      <button style={tS(tab==="stats")} onClick={()=>setTab("stats")}>📋 상태 ({stats.length})</button>
      <button style={tS(tab==="apikey")} onClick={()=>setTab("apikey")}>🔑 API 키</button>
    </div>
    {tab==="apikey"&&<div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>Anthropic API 키를 입력하세요. 브라우저 로컬에 저장됩니다.</div>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input type="password" value={keyDraft} onChange={e=>setKeyDraft(e.target.value)}
          placeholder="sk-ant-..." style={{flex:1,padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={()=>{const k=keyDraft.trim();localStorage.setItem("team-todo-apikey",k);setApiKey(k);flash("API 키가 저장되었습니다");}}
          style={{padding:"8px 14px",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>저장</button>
      </div>
      {apiKey&&<div style={{fontSize:11,color:"#16a34a",fontWeight:600}}>✅ API 키 설정됨</div>}
    </div>}
    <div style={{marginBottom:14,maxHeight:300,overflowY:"auto"}}>
      {items.map(v=>{const cnt=tab==="members"?todos.filter(t=>t.who===v).length:tab==="pris"?todos.filter(t=>t.pri===v).length:todos.filter(t=>t.st===v).length;
        const color=tab==="members"?undefined:tab==="pris"?(priC[v]||"#94a3b8"):(stC[v]||"#94a3b8");
        return <div key={v} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f8fafc",borderRadius:7,border:"1px solid #e2e8f0",fontSize:12,marginBottom:4}}>
          {color!==undefined?<input type="color" value={color} onChange={e=>chgColor(v,e.target.value)} style={{width:20,height:20,padding:0,border:"1px solid #e2e8f0",borderRadius:4,cursor:"pointer"}}/>:<span style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{v[0]}</span>}
          <span style={{flex:1,fontWeight:600}}>{v}</span><span style={{fontSize:10,color:"#94a3b8"}}>{cnt}건</span>
          <button onClick={()=>edit(v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>✏️</button>
          <button onClick={()=>tryDel(v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>🗑️</button>
        </div>})}
    </div>
    {delConfirm&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:12,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:12,color:"#dc2626",fontWeight:600}}>"{delConfirm.value}" 삭제할까요?</span>
      <div style={{display:"flex",gap:4}}><button onClick={doDel} style={{background:"#fef2f2",color:"#dc2626",border:"none",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}}>삭제</button><button onClick={()=>setDelConfirm(null)} style={{background:"#f1f5f9",color:"#334155",border:"none",padding:"4px 10px",borderRadius:8,fontSize:11,cursor:"pointer"}}>취소</button></div>
    </div>}
    <div style={{borderTop:"1px solid #e2e8f0",paddingTop:12}}>
      {(tab==="members"||tab==="pris"||tab==="stats")&&<>
        <div style={{fontSize:11,fontWeight:600,marginBottom:6}}>{tab==="members"?"새 담당자":tab==="pris"?"새 우선순위":"새 상태"} 추가</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {tab!=="members"&&<input type="color" value={nc} onChange={e=>setNc(e.target.value)} style={{width:34,height:30,borderRadius:6,cursor:"pointer",border:"1px solid #e2e8f0"}}/>}
          <input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}} placeholder={tab==="members"?"이름":"항목명"} style={{flex:1,padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
          <button style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={add}>추가</button>
        </div>
      </>}
    </div>
  </div>;
}
