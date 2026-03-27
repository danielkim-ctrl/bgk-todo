import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./src/firebase";
import { useAuth } from "./src/AuthContext";

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
const isOD = (d,s) => s!=="완료"&&d&&new Date(d)<new Date(new Date().toDateString());
const gP = (ps,id) => ps.find(p=>p.id===id)||{id:0,name:"미분류",color:"#94a3b8"};
const fD = d => d?d.slice(5).replace("-","/"):"—";
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
  hdr:{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",color:"#fff",padding:"0 24px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(30,58,138,.25)"},
  hBtn:{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",color:"#fff",fontSize:10,padding:"4px 12px",borderRadius:14,cursor:"pointer",fontWeight:600},
  hBdg:{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:10,padding:"3px 10px",borderRadius:14},
  nav:{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 24px",display:"flex",gap:2,position:"sticky",top:54,zIndex:99},
  navB:(a)=>({padding:"10px 14px",fontSize:12,fontWeight:a?600:500,color:a?"#2563eb":"#64748b",background:a?"#eff6ff":"none",border:"none",borderBottom:a?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}),
  main:{padding:"16px 24px",maxWidth:1400,margin:"0 auto"},
  card:{background:"#fff",borderRadius:10,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,.07)",border:"1px solid #e8edf4"},
  bp:{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Pretendard',system-ui,sans-serif"},
  bs:{background:"#f1f5f9",color:"#334155",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"'Pretendard',system-ui,sans-serif"},
  bd:{background:"#fef2f2",color:"#dc2626",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Pretendard',system-ui,sans-serif"},
  th:{padding:"10px 10px",textAlign:"left",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap",overflow:"hidden",background:"#f8fafc"},
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

function DropPanel({items,current,onSelect,onClose,renderItem,alignRight}){
  const anchorRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(()=>{
    if(!anchorRef.current) return;
    const td = anchorRef.current.closest('td');
    if(!td) return;
    const rect = td.getBoundingClientRect();
    const panelH = Math.min(220, items.length * 28 + 36);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= panelH + 4 ? rect.bottom + 2 : rect.top - panelH - 2;
    const left = alignRight ? rect.right - 140 : rect.left;
    setPos({ top: Math.max(4, top), left: Math.max(4, Math.min(left, window.innerWidth - 144)) });
  }, []);

  useEffect(()=>{
    const handler = e => { if(!e.target.closest('[data-droppanel]')) onClose(); };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  return <>
    <span ref={anchorRef}/>
    {pos && createPortal(
      <div data-droppanel style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9999,background:"#fff",borderRadius:6,boxShadow:"0 4px 16px rgba(0,0,0,.12)",border:"1.5px solid #2563eb",padding:4,minWidth:120,maxHeight:220,overflowY:"auto"}}>
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


// ── 리치 텍스트 에디터 (모달형 팝업) ─────────────────────────
// ── 드래그 진행률 바 ────────────────────────────────────────
function ProgressBar({value=0, onChange}){
  const trackRef=useRef(null);
  const dragging=useRef(false);
  const [isDragging,setIsDragging]=useState(false);

  const pct=Math.round(Math.max(0,Math.min(100,value)));
  // 0%=회색, 1~49%=주황, 50~79%=황금, 80~99%=연두, 100%=초록
  const grad = pct===0
    ? "#e2e8f0"
    : pct===100
    ? "linear-gradient(90deg,#16a34a,#4ade80)"
    : pct>=80
    ? "linear-gradient(90deg,#ca8a04,#a3e635)"
    : pct>=50
    ? "linear-gradient(90deg,#ea580c,#eab308)"
    : "linear-gradient(90deg,#dc2626,#f97316)";

  const calc=e=>{
    const rect=trackRef.current.getBoundingClientRect();
    const x=Math.max(0,Math.min(e.clientX-rect.left,rect.width));
    return Math.round(Math.round(x/rect.width*10)*10);
  };

  const onMouseDown=e=>{
    e.stopPropagation();
    dragging.current=true;
    setIsDragging(true);
    onChange(calc(e));
    const onMove=ev=>{if(dragging.current)onChange(calc(ev));};
    const onUp=ev=>{dragging.current=false;setIsDragging(false);onChange(calc(ev));window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  };

  return <div ref={trackRef} onMouseDown={onMouseDown}
    style={{width:"100%",height:6,borderRadius:99,background:"#f1f5f9",cursor:"ew-resize",position:"relative",userSelect:"none"}}>
    <div style={{height:"100%",borderRadius:99,background:grad,width:`${pct}%`,transition:dragging.current?"none":"width .1s"}}/>
    {/* 드래그 핸들 */}
    <div style={{position:"absolute",top:"50%",left:`${pct}%`,transform:"translate(-50%,-50%)",
      width:12,height:12,borderRadius:"50%",background:"#fff",border:"2px solid",
      borderColor:pct===0?"#cbd5e1":pct===100?"#16a34a":pct>=50?"#eab308":"#f97316",
      boxShadow:"0 1px 4px rgba(0,0,0,.15)",pointerEvents:"none"}}/>
    {isDragging&&pct>0&&<div style={{position:"absolute",top:-22,left:`${pct}%`,transform:"translateX(-50%)",
      fontSize:9,fontWeight:700,color:"#fff",background:pct===0?"#94a3b8":pct===100?"#16a34a":pct>=50?"#ca8a04":"#ea580c",
      padding:"1px 5px",borderRadius:4,pointerEvents:"none",whiteSpace:"nowrap"}}>
      {pct}%
    </div>}
  </div>;
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

// ── 스티키노트 스타일 메모 팝업 ─────────────────────────────────
function NotePopup({todo, x, y, onSave, onClose}){
  const wrapRef=useRef(null);
  const ref=useRef(null);
  const onSaveRef=useRef(onSave);
  onSaveRef.current=onSave;
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
  const cmd=(c)=>{ref.current.focus();document.execCommand(c,false,null);};
  const PW=240;
  const left=Math.min(x,window.innerWidth-PW-8);
  const top=(window.innerHeight-y<200)?y-200:y+4;
  const tools=[
    {label:"B",c:"bold",s:{fontWeight:800},title:"굵게"},
    {label:"I",c:"italic",s:{fontStyle:"italic"},title:"기울임"},
    {label:"U",c:"underline",s:{textDecoration:"underline"},title:"밑줄"},
    {label:"S",c:"strikeThrough",s:{textDecoration:"line-through"},title:"취소선"},
    {label:"•",c:"insertUnorderedList",title:"목록"},
  ];
  return <div ref={wrapRef}
    style={{position:"fixed",left,top,width:PW,zIndex:3000,
      background:"#fefce8",border:"1px solid #c9b84c",borderRadius:5,
      boxShadow:"2px 6px 20px rgba(0,0,0,.18)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",gap:1,padding:"4px 6px",background:"#f9e84a",borderBottom:"1px solid #c9b84c",alignItems:"center"}}>
      {tools.map(t=><button key={t.c} title={t.title} onMouseDown={e=>{e.preventDefault();cmd(t.c);}}
        style={{padding:"2px 7px",border:"none",background:"transparent",cursor:"pointer",
          fontSize:11,borderRadius:3,fontFamily:"inherit",color:"#1a1a1a",...(t.s||{})}}>{t.label}</button>)}
      <button onMouseDown={e=>{e.preventDefault();onClose();}}
        style={{marginLeft:"auto",padding:"2px 6px",border:"none",background:"transparent",
          cursor:"pointer",fontSize:13,color:"#7a6800",lineHeight:1}}>✕</button>
    </div>
    <div ref={ref} contentEditable suppressContentEditableWarning
      onInput={()=>onSaveRef.current(ref.current.innerHTML)}
      style={{minHeight:100,maxHeight:200,overflowY:"auto",padding:"8px 10px",
        fontSize:12,lineHeight:1.65,outline:"none",
        fontFamily:"'Pretendard',system-ui,sans-serif",color:"#1a1a1a"}}/>
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

export default function App(){
  const { user, userProfile, authLoading, signInWithGoogle, signOut: logout } = useAuth();
  const [projects,setProjects]=useState<any[]>([]);
  const [todos,setTodos]=useState<any[]>([]);
  const historyRef=useRef<any[][]>([]);
  const redoRef=useRef<any[][]>([]);
  const detHoverTimerRef=useRef<any>(null);
  const noteLeaveTimerRef=useRef<any>(null);
  const snapshotIgnore=useRef(false);
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
    flash("↩️ 되돌리기");
  };
  const redo=()=>{
    if(!redoRef.current.length)return;
    setTodos(prev=>{
      historyRef.current=[...historyRef.current.slice(-49),prev];
      return redoRef.current.pop();
    });
    flash("↪️ 다시 실행");
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
  const [filters,setFilters]=useState({proj:"",who:"",pri:"",st:"",repeat:""});
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
  const [hoverRow,setHoverRow]=useState<number|null>(null);

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

  // Firestore: 초기 데이터 시드 + 실시간 리스너
  useEffect(()=>{
    if(!user)return;
    (async()=>{
      // localStorage 설정값 복원 (멤버/우선순위/상태 커스텀 색상 등)
      try{
        const raw=localStorage.getItem("todo-v5");
        if(raw){const d=JSON.parse(raw);
          if(d.pris)setPris(d.pris);if(d.stats)setStats(d.stats);
          if(d.priC)setPriC(d.priC);if(d.priBg)setPriBg(d.priBg);
          if(d.stC)setStC(d.stC);if(d.stBg)setStBg(d.stBg);
        }
      }catch(e){}
      // Firestore가 비어있으면 localStorage 데이터 마이그레이션
      const snap=await getDocs(collection(db,"todos"));
      if(snap.empty){
        let seedTodos=initTodos.map(t=>({...t,createdBy:"",private:false}));
        let seedProjs=initProj;
        try{
          const raw=localStorage.getItem("todo-v5");
          if(raw){const d=JSON.parse(raw);
            if(d.todos?.length)seedTodos=d.todos.map((t:any)=>({...t,createdBy:"",private:false}));
            if(d.projects?.length)seedProjs=d.projects;
            if(d.nId)setNId(d.nId);if(d.pNId)setPNId(d.pNId);
          }
        }catch(e){}
        const batch=writeBatch(db);
        seedTodos.forEach(t=>batch.set(doc(db,"todos",String(t.id)),t));
        seedProjs.forEach(p=>batch.set(doc(db,"projects",String(p.id)),p));
        await batch.commit();
      }
      setLoaded(true);
    })();
    // 실시간 리스너
    const unsubT=onSnapshot(collection(db,"todos"),snap=>{
      if(snapshotIgnore.current)return;
      setTodos(snap.docs.map(d=>d.data() as any));
    });
    const unsubP=onSnapshot(collection(db,"projects"),snap=>{
      setProjects(snap.docs.map(d=>d.data() as any));
      setLoaded(true);
    });
    const unsubU=onSnapshot(collection(db,"users"),snap=>{
      const names=snap.docs.map(d=>d.data().displayName as string).filter(Boolean);
      if(names.length)setMembers(names);
    });
    return()=>{unsubT();unsubP();unsubU()};
  },[user]);

  // todo 변경 시 Firestore에 저장 (debounce)
  const skipFirst=useRef(false);
  useEffect(()=>{
    if(!loaded||!user)return;
    if(!skipFirst.current){skipFirst.current=true;return;}
    const t=setTimeout(()=>{
      snapshotIgnore.current=true;
      const batch=writeBatch(db);
      todos.forEach(todo=>batch.set(doc(db,"todos",String(todo.id)),todo));
      batch.commit()
        .then(()=>setTimeout(()=>{snapshotIgnore.current=false;},600))
        .catch(()=>{snapshotIgnore.current=false;});
      // 설정값은 여전히 localStorage에 저장
      try{localStorage.setItem("todo-v5",JSON.stringify({pris,stats,priC,priBg,stC,stBg}));}catch(e){}
    },400);
    return()=>clearTimeout(t);
  },[todos,loaded,user]);

  const flash=(m,t="ok")=>{setToast({m,t});setTimeout(()=>setToast({m:"",t:""}),2500)};
  const aProj=projects.filter(p=>p.status==="활성");
  const gPr=id=>gP(projects,id);

  const updTodo=(id,u)=>setTodosWithHistory(p=>p.map(t=>{if(t.id!==id)return t;const n={...t,...u};if(u.st==="완료"&&t.st!=="완료")n.done=td();else if(u.st&&u.st!=="완료")n.done=null;return n}));
  const addTodo=t=>{
    const id=nId;setNId(nId+1);
    const newTodo={...t,id,cre:td(),done:t.st==="완료"?td():null,repeat:t.repeat||"없음",createdBy:user?.uid||"",private:false};
    setTodosWithHistory(p=>[...p,newTodo]);
    setDoc(doc(db,"todos",String(id)),newTodo).catch(console.error);
    return id;
  };
  const delTodo=id=>{
    setTodosWithHistory(p=>p.filter(t=>t.id!==id));
    deleteDoc(doc(db,"todos",String(id))).catch(console.error);
    flash("삭제","err");
  };

  const filtered=todos.filter(t=>{
    // 다른 사람의 나만보기 todo 숨김
    if(t.private&&t.createdBy&&t.createdBy!==user?.uid)return false;
    const q=search.toLowerCase();
    return(!q||t.task.toLowerCase().includes(q)||t.who.toLowerCase().includes(q)||gPr(t.pid).name.toLowerCase().includes(q))
      &&(!filters.proj||String(t.pid)===filters.proj)
      &&(!filters.st||t.st===filters.st)
      &&(!filters.pri||t.pri===filters.pri)
      &&(!filters.who||t.who===filters.who)
      &&(!filters.repeat||t.repeat===filters.repeat);
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
  const togF=(k,v)=>setFilters(f=>({...f,[k]:f[k]===v?"":v}));

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
    if(!isE)return <td style={S.tdc} onClick={start}>{children}</td>;
    if(field==="task")return <td style={{...S.tdc,overflow:"visible"}}><input autoFocus defaultValue={todo.task} style={S.iinp} onKeyDown={e=>{if(e.key==="Enter")save(e.target.value);if(e.key==="Escape")stop()}} onBlur={e=>save(e.target.value)}/></td>;
    if(field==="due")return <td style={{...S.tdc,overflow:"visible"}}><input type="date" autoFocus defaultValue={todo.due} style={S.iinp} onChange={e=>save(e.target.value)} onBlur={stop}/></td>;
    if(field==="pid")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><DropPanel items={aProj.map(p=>({value:String(p.id),label:p.name,color:p.color}))} current={String(todo.pid)} onSelect={v=>save(v)} onClose={stop} renderItem={it=><><span style={S.dot(it.color)}/>{it.label}</>}/></td>;
    if(field==="who")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><DropPanel items={members.map(m=>({value:m,label:m}))} current={todo.who} onSelect={v=>save(v)} onClose={stop} renderItem={it=><><span style={{width:16,height:16,borderRadius:"50%",background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700}}>{it.label[0]}</span>{it.label}</>}/></td>;
    if(field==="pri")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><DropPanel items={pris.map(p=>({value:p,label:p,color:priC[p]}))} current={todo.pri} onSelect={v=>save(v)} onClose={stop} alignRight renderItem={it=><><span style={{...S.dot(it.color),width:8,height:8}}/>{it.label}</>}/></td>;
    if(field==="st")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><DropPanel items={stats.map(s=>({value:s,label:s,color:stC[s]}))} current={todo.st} onSelect={v=>save(v)} onClose={stop} alignRight renderItem={it=><><span style={{...S.dot(it.color),width:8,height:8}}/>{it.label}</>}/></td>;
    if(field==="repeat")return <td style={{...S.tdc,overflow:"visible",position:"relative"}}><DropPanel items={REPEAT_OPTS.map(r=>({value:r,label:r}))} current={todo.repeat||"없음"} onSelect={v=>save(v)} onClose={stop} alignRight/></td>;
    return <td style={S.tdc}>{children}</td>;
  };

  const saveMod=f=>{if(!f.task||!f.pid||!f.who||!f.due){alert("필수 입력");return;}if(f.id){updTodo(parseInt(f.id),{pid:parseInt(f.pid),task:f.task,who:f.who,due:f.due,pri:f.pri,st:f.st,det:f.det,repeat:f.repeat||"없음"});flash("수정 완료")}else{addTodo({pid:parseInt(f.pid),task:f.task,who:f.who,due:f.due,pri:f.pri,st:f.st,det:f.det,repeat:f.repeat||"없음"});flash("등록!")}setEditMod(null)};
  const addNR=()=>setNewRows(r=>[...r,{pid:"",task:"",who:"",due:"",pri:"보통",det:"",repeat:"없음"}]);
  const isNREmpty=r=>!r.task&&!r.pid&&!r.who&&!r.due&&!r.det;
  const saveOneNR=i=>{const r=newRows[i];if(isNREmpty(r))return;addTodo({pid:r.pid?parseInt(r.pid):0,task:r.task||"제목 없음",who:r.who||"미배정",due:r.due||"",pri:r.pri||"보통",st:"대기",det:r.det||"",repeat:r.repeat||"없음"});setNewRows(p=>p.filter((_,j)=>j!==i));flash("등록!");};
  const saveNRs=()=>{const v=newRows.filter(r=>!isNREmpty(r));if(!v.length){setNewRows([]);return;}v.forEach(r=>addTodo({pid:r.pid?parseInt(r.pid):0,task:r.task||"제목 없음",who:r.who||"미배정",due:r.due||"",pri:r.pri||"보통",st:"대기",det:r.det||"",repeat:r.repeat||"없음"}));setNewRows([]);flash(`${v.length}개 등록!`);};

  const parseAI=async()=>{
    if(!apiKey){setAiSt("❌ API 키를 먼저 저장하세요");return;}
    if(!aiText.trim())return;setAiLoad(true);setAiSt("AI 분석 중...");
    try{
      const sysPrompt=`Task parser. Return ONLY a JSON array. Each item: {"task":string,"assignee":string or null,"due":"YYYY-MM-DD" or null,"priority":"보통"|"긴급"|"높음"|"낮음","project":string or null,"detail":string or null,"repeat":"없음"|"매일"|"매주"|"매월"}. @name=assignee. today=${td()}. projects:${aProj.map(p=>p.name).join(",")}. members:${members.join(",")}.`;
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1000,system:sysPrompt,messages:[{role:"user",content:`TODO추출:\n${aiText}`}]})});
      if(!r.ok)throw new Error(`API ${r.status}`);
      const d=await r.json();const raw=d.content.map(c=>c.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(raw);setAiParsed(parsed.map((t,i)=>({...t,_chk:true,_i:i})));setAiSt(`✅ ${parsed.length}개 추출!`);
    }catch(e){setAiSt(`❌ ${e.message}`);}
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
    flash(`🤖 ${checked.length}개 AI등록!`);
  };

  const addChip=()=>{if(!chipVal.trim())return;const v=chipVal.trim();
    if(chipAdd==="proj"){setProjects(p=>[...p,{id:pNId,name:v,color:chipColor,status:"활성"}]);setPNId(pNId+1);flash(`프로젝트 "${v}"`);}
    else if(chipAdd==="who"){if(!members.includes(v))setMembers(p=>[...p,v]);flash(`담당자 "${v}"`);}
    else if(chipAdd==="pri"){if(!pris.includes(v)){setPris(p=>[...p,v]);setPriC(p=>({...p,[v]:chipColor}));setPriBg(p=>({...p,[v]:chipColor+"18"}));}flash(`우선순위 "${v}"`);}
    else if(chipAdd==="st"){if(!stats.includes(v)){setStats(p=>[...p,v]);setStC(p=>({...p,[v]:chipColor}));setStBg(p=>({...p,[v]:chipColor+"18"}));}flash(`상태 "${v}"`);}
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


  // 로그인 안 된 경우 로그인 화면
  if(!user){
    return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#1e3a8a,#2563eb)",fontFamily:"'Pretendard',system-ui,sans-serif"}}>
      <div style={{background:"#fff",borderRadius:20,padding:"48px 52px",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.2)",width:360}}>
        <div style={{fontSize:48,marginBottom:12}}>✅</div>
        <div style={{fontSize:22,fontWeight:800,color:"#1a2332",marginBottom:8}}>팀 TODO 통합관리</div>
        <div style={{fontSize:13,color:"#64748b",marginBottom:32}}>팀원만 접근할 수 있습니다.<br/>Google 계정으로 로그인해 주세요.</div>
        <button onClick={signInWithGoogle} style={{width:"100%",padding:"13px",background:"#fff",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,color:"#334155",boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z"/></svg>
          Google로 로그인
        </button>
      </div>
    </div>;
  }

  return <div style={S.wrap}>
    <header style={S.hdr}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:30,height:30,background:"rgba(255,255,255,.2)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✅</div>
        <div style={{fontSize:15,fontWeight:700}}>팀 TODO 통합관리</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <button style={S.hBtn} onClick={()=>setProjMod(true)}>📁 프로젝트</button>
        <button style={S.hBtn} onClick={()=>setSettMod(true)}>⚙️ 설정</button>
        <button style={{...S.hBtn,opacity:historyRef.current.length?1:.4}} onClick={undo} title="되돌리기 (Ctrl+Z)">↩️ 되돌리기</button>
        <button style={{...S.hBtn,opacity:redoRef.current.length?1:.4}} onClick={redo} title="다시 실행 (Ctrl+Y)">↪️ 다시 실행</button>
        <span style={S.hBdg}>{todos.length}건</span>
        <div style={{width:1,height:16,background:"rgba(255,255,255,.3)",margin:"0 2px"}}/>
        {userProfile?.photoURL&&<img src={userProfile.photoURL} style={{width:26,height:26,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(255,255,255,.5)"}} alt=""/>}
        <span style={{...S.hBdg,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userProfile?.displayName||user.email}</span>
        <button style={{...S.hBtn,background:"rgba(255,100,100,.25)"}} onClick={logout}>로그아웃</button>
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
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#64748b"}}><span>{t.who}</span><span style={{color:od?"#dc2626":"#94a3b8"}}>{od?"⚠️":""}{fD(t.due)}</span></div>
                  </div>}):<div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:10}}>없음</div>}
              </div>
            </div>})}
        </div>
      </div>}

      {view==="list"&&<div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        {/* ── Sidebar ──────────────────────────────────── */}
        <div style={{width:196,flexShrink:0,background:"#fff",borderRadius:10,border:"1px solid #e8edf4",position:"sticky",top:100,maxHeight:"calc(100vh - 112px)",overflowY:"auto",boxShadow:"0 1px 3px rgba(0,0,0,.07)"}}>
          <div style={{padding:"12px 12px 8px",borderBottom:"1px solid #f1f5f9"}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:12,pointerEvents:"none"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="검색..." style={{width:"100%",padding:"6px 8px 6px 26px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:11,outline:"none",boxSizing:"border-box",background:"#f8fafc"}}/>
            </div>
          </div>
          {([["프로젝트","proj",aProj.map(p=>({v:String(p.id),l:p.name,c:p.color,n:todos.filter(t=>t.pid===p.id).length}))],
            ["담당자","who",[...new Set(todos.map(t=>t.who).concat(members))].map(n=>({v:n,l:n,n:todos.filter(t=>t.who===n).length}))],
            ["우선순위","pri",pris.map(p=>({v:p,l:p,c:priC[p],n:todos.filter(t=>t.pri===p).length}))],
            ["상태","st",stats.map(s=>({v:s,l:s,c:stC[s],n:todos.filter(t=>t.st===s).length}))],
          ] as [string,string,{v:string,l:string,c?:string,n:number}[]][]).map(([label,key,items])=><div key={key}>
            <span style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:.8,padding:"10px 12px 4px",display:"block"}}>{label}</span>
            <div onClick={()=>togF(key,"")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",cursor:"pointer",background:!filters[key]?"#eff6ff":"transparent",color:!filters[key]?"#2563eb":"#475569",fontWeight:!filters[key]?600:400,fontSize:12,userSelect:"none" as const}}>
              <span style={{flex:1}}>전체</span>
              <span style={{fontSize:10,color:!filters[key]?"#93c5fd":"#94a3b8",background:!filters[key]?"#dbeafe":"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:600,flexShrink:0}}>{todos.length}</span>
            </div>
            {items.map(it=><div key={it.v} onClick={()=>togF(key,it.v)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",cursor:"pointer",background:filters[key]===it.v?"#eff6ff":"transparent",color:filters[key]===it.v?"#2563eb":"#475569",fontWeight:filters[key]===it.v?600:400,fontSize:12,userSelect:"none" as const}}>
              {it.c&&<span style={{width:6,height:6,borderRadius:"50%",background:it.c,flexShrink:0,display:"inline-block"}}/>}
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{it.l}</span>
              <span style={{fontSize:10,color:"#94a3b8",background:"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:500,flexShrink:0}}>{it.n}</span>
            </div>)}
            {key!=="st"&&key!=="who"&&<div style={{padding:"2px 8px 4px"}}>
              <button onClick={()=>{setChipAdd(key);setChipVal("");const used=projects.map((pr:{color:string})=>pr.color);setChipColor(key==="proj"?(PROJ_PALETTE.find(c=>!used.includes(c))||PROJ_PALETTE[0]):"#8b5cf6")}} style={{fontSize:10,color:"#94a3b8",background:"none",border:"1px dashed #d1d5db",borderRadius:5,padding:"2px 10px",cursor:"pointer",width:"100%"}}>+ 추가</button>
            </div>}
          </div>)}
          {(search||filters.proj||filters.who||filters.pri||filters.st)&&<div style={{padding:"8px 12px",borderTop:"1px solid #f1f5f9"}}>
            <button onClick={()=>{setSearch("");setFilters({proj:"",who:"",pri:"",st:"",repeat:""})}} style={{width:"100%",padding:"5px",fontSize:11,color:"#64748b",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:6,cursor:"pointer"}}>✕ 필터 초기화</button>
          </div>}
        </div>

        {/* ── Main content ─────────────────────────────── */}
        <div style={{flex:1,minWidth:0}}>

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
                <colgroup><col style={{width:120}}/><col/><col style={{width:100}}/><col style={{width:70}}/><col style={{width:110}}/><col style={{width:56}}/><col style={{width:70}}/><col style={{width:44}}/></colgroup>
                <thead><tr style={{background:"#f0f7ff",borderBottom:"1px solid #c7d8f0"}}>{["프로젝트","업무내용","메모","담당자","마감일","우선순위","반복",""].map((h,i)=><th key={i} style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#64748b",textAlign:"left"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {newRows.map((r,i)=>{const empty=isNREmpty(r);return <tr key={"nr"+i} style={{background:i%2===0?"#eef4ff":"#e8f0fe",borderBottom:i===newRows.length-1?"none":"1px solid #c7d8f0"}}>
                    <td style={{padding:"5px 6px"}}><select value={r.pid} onChange={e=>{const n=[...newRows];n[i].pid=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 3px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}><option value="">프로젝트</option>{aProj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                    <td style={{padding:"5px 6px"}}><input value={r.task} onChange={e=>{const n=[...newRows];n[i].task=e.target.value;setNewRows(n)}} onKeyDown={e=>{if(e.key==="Enter"){if(!isNREmpty(newRows[i]))saveOneNR(i);else addNR()}}} placeholder="업무 내용" autoFocus={i===newRows.length-1} style={{width:"100%",padding:"5px 8px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:11,outline:"none",background:"#fff",fontWeight:600}}/></td>
                    <td style={{padding:"5px 6px"}}>
                      {/* 새 행 메모 — 클릭 시 팝업 에디터 */}
                      <div onClick={()=>setDetPopup({_newRow:i, det:r.det||"", task:r.task||"새 업무"})}
                        style={{width:"100%",padding:"5px 6px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,cursor:"text",color:r.det?stripHtml(r.det)?"#334155":"#94a3b8":"#94a3b8",minHeight:28,display:"flex",alignItems:"center",background:"#fff"}}>
                        {r.det&&stripHtml(r.det)?stripHtml(r.det).slice(0,20)+(stripHtml(r.det).length>20?"…":""):<span style={{color:"#bfcfe8"}}>메모 (서식 포함)</span>}
                      </div>
                    </td>
                    <td style={{padding:"5px 6px"}}><select value={r.who} onChange={e=>{const n=[...newRows];n[i].who=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 3px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}><option value="">담당자</option>{members.map(m=><option key={m}>{m}</option>)}</select></td>
                    <td style={{padding:"5px 6px"}}><input type="date" value={r.due} onChange={e=>{const n=[...newRows];n[i].due=e.target.value;setNewRows(n)}} style={{width:"100%",padding:"4px 3px",border:"1.5px solid #93b4f0",borderRadius:6,fontSize:10,background:"#fff",outline:"none"}}/></td>
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
              {aiSt&&<span style={{fontSize:11,fontWeight:600,color:aiSt.startsWith("✅")?"#16a34a":"#dc2626"}}>{aiSt}</span>}
              {aiText&&<button style={{...S.bs,fontSize:10,marginLeft:"auto"}} onClick={()=>{setAiText("");setAiSt("");setAiParsed([])}}>초기화</button>}
            </div>
            {aiParsed.length>0&&<div style={{marginTop:12,border:"1.5px solid #ddd6fe",borderRadius:10,overflow:"hidden"}}>
              <div style={{padding:"8px 14px",background:"#f5f3ff",borderBottom:"1px solid #ddd6fe",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,color:"#7c3aed"}}>✨ {aiParsed.length}건 추출됨</span>
                <div style={{display:"flex",gap:4}}><button style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",padding:"4px 14px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}} onClick={confirmAI}>등록</button><button style={{...S.bs,fontSize:10}} onClick={()=>setAiParsed([])}>취소</button></div>
              </div>
              <div style={{maxHeight:260,overflowY:"auto"}}>
                {aiParsed.map((t,i)=>{const mp=aProj.find(p=>t.project&&p.name.includes(t.project));return <div key={i} style={{padding:"8px 14px",borderBottom:"1px solid #f3f0ff",display:"flex",gap:8,alignItems:"center",background:i%2?"#fdfcff":"#fff"}}>
                  <input type="checkbox" checked={t._chk} onChange={e=>{const n=[...aiParsed];n[i]._chk=e.target.checked;setAiParsed(n)}}/>
                  <div style={{flex:1}}>
                    <input defaultValue={t.task} onChange={e=>{const n=[...aiParsed];n[i].task=e.target.value;setAiParsed(n)}} style={{width:"100%",padding:"4px 8px",border:"1.5px solid #ddd6fe",borderRadius:6,fontSize:12,fontWeight:600,outline:"none",marginBottom:5,background:"#fdfcff"}}/>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      <select defaultValue={mp?mp.id:""} onChange={e=>{const n=[...aiParsed];n[i].project=aProj.find(p=>p.id===parseInt(e.target.value))?.name||"";setAiParsed(n)}} style={{padding:"3px 6px",border:"1px solid #ddd6fe",borderRadius:5,fontSize:10,background:"#fff"}}><option value="">프로젝트</option>{aProj.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
                      <select defaultValue={members.find(m=>t.assignee&&m.includes(t.assignee))||""} onChange={e=>{const n=[...aiParsed];n[i].assignee=e.target.value;setAiParsed(n)}} style={{padding:"3px 6px",border:"1px solid #ddd6fe",borderRadius:5,fontSize:10,background:"#fff"}}><option value="">담당자</option>{members.map(m=><option key={m}>{m}</option>)}</select>
                      <input type="date" defaultValue={t.due||""} onChange={e=>{const n=[...aiParsed];n[i].due=e.target.value;setAiParsed(n)}} style={{padding:"3px 6px",border:"1px solid #ddd6fe",borderRadius:5,fontSize:10,background:"#fff"}}/>
                      <select defaultValue={t.priority||"보통"} onChange={e=>{const n=[...aiParsed];n[i].priority=e.target.value;setAiParsed(n)}} style={{padding:"3px 6px",border:"1px solid #ddd6fe",borderRadius:5,fontSize:10,background:"#fff"}}>{pris.map(p=><option key={p}>{p}</option>)}</select>
                      <select defaultValue={t.repeat||"없음"} onChange={e=>{const n=[...aiParsed];n[i].repeat=e.target.value;setAiParsed(n)}} style={{padding:"3px 6px",border:"1px solid #ddd6fe",borderRadius:5,fontSize:10,background:"#fff"}}>{REPEAT_OPTS.map(r=><option key={r}>{r}</option>)}</select>
                    </div>
                  </div>
                  <button onClick={()=>setAiParsed(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:13,opacity:.4}}>✕</button>
                </div>})}
              </div>
            </div>}
          </div>}
        </div>

        <SectionLabel num="02" title="업무 리스트" sub={`총 ${sorted.length}건${filters.proj||filters.who||filters.pri||filters.st||filters.repeat||search?" (필터 적용 중)":""}`}/>
        {sorted.length===0&&<div style={{...S.card,padding:"36px 20px",textAlign:"center" as const,color:"#94a3b8"}}><div style={{fontSize:28,marginBottom:6}}>📭</div><div style={{fontSize:13,fontWeight:600}}>업무가 없습니다</div></div>}
        {sorted.length>0&&<div style={{...S.card,padding:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderBottom:"1px solid #f1f5f9",background:"#fafbfc"}}>
            <span style={{fontSize:12,color:"#64748b"}}>
              <span style={{fontWeight:700,color:"#334155"}}>{sorted.filter(t=>t.st!=="완료").length}건 미완료</span>
              <span style={{margin:"0 6px",color:"#cbd5e1"}}>·</span>
              <span>{sorted.filter(t=>t.st==="완료").length}건 완료</span>
            </span>
            <div style={{display:"flex",gap:4}}>
              {([["due","마감순"],["pri","우선순위순"],["id","기본"]] as [string,string][]).map(([col,label])=>
                <button key={col} onClick={()=>toggleSort(col)} style={{fontSize:11,padding:"3px 10px",borderRadius:99,border:`1px solid ${sortCol===col?"#2563eb":"#e2e8f0"}`,background:sortCol===col?"#2563eb":"#fff",color:sortCol===col?"#fff":"#64748b",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:3}}>
                  {label}{sortCol===col&&<span style={{fontSize:8}}>{sortDir==="asc"?"▲":"▼"}</span>}
                </button>)}
            </div>
          </div>
          {(filters.proj||filters.who||filters.pri||filters.st||filters.repeat||search)&&
            <div style={{display:"flex",flexWrap:"wrap" as const,alignItems:"center",gap:6,padding:"8px 14px",borderBottom:"1px solid #f1f5f9",background:"#f0f7ff"}}>
              <span style={{fontSize:11,color:"#64748b",fontWeight:600,flexShrink:0}}>적용된 필터</span>
              {search&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#dbeafe",color:"#1d4ed8",border:"1px solid #bfdbfe"}}>
                🔍 "{search}" <button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#1d4ed8",padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {filters.proj&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#ede9fe",color:"#6d28d9",border:"1px solid #ddd6fe"}}>
                📁 {aProj.find(p=>String(p.id)===filters.proj)?.name||filters.proj} <button onClick={()=>togF("proj","")} style={{background:"none",border:"none",cursor:"pointer",color:"#6d28d9",padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {filters.who&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#fce7f3",color:"#9d174d",border:"1px solid #fbcfe8"}}>
                👤 {filters.who} <button onClick={()=>togF("who","")} style={{background:"none",border:"none",cursor:"pointer",color:"#9d174d",padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {filters.pri&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:priBg[filters.pri],color:priC[filters.pri],border:`1px solid ${priC[filters.pri]}44`}}>
                ● {filters.pri} <button onClick={()=>togF("pri","")} style={{background:"none",border:"none",cursor:"pointer",color:priC[filters.pri],padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {filters.st&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:stBg[filters.st],color:stC[filters.st],border:`1px solid ${stC[filters.st]}44`}}>
                {filters.st} <button onClick={()=>togF("st","")} style={{background:"none",border:"none",cursor:"pointer",color:stC[filters.st],padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {filters.repeat&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}}>
                🔁 {filters.repeat} <button onClick={()=>togF("repeat","")} style={{background:"none",border:"none",cursor:"pointer",color:"#15803d",padding:0,fontSize:12,lineHeight:1}}>×</button>
              </span>}
              <button onClick={()=>{setSearch("");setFilters({proj:"",who:"",pri:"",st:"",repeat:""});}} style={{marginLeft:"auto",fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4}}>전체 초기화</button>
            </div>}
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",minWidth:780,borderCollapse:"collapse",tableLayout:"fixed"}}>
              <colgroup>
                <col style={{width:"26%"}}/>{/* task */}
                <col style={{width:"20%"}}/>{/* det */}
                <col style={{width:86}}/>{/* progress */}
                <col style={{width:80}}/>{/* who */}
                <col style={{width:88}}/>{/* due */}
                <col style={{width:72}}/>{/* pri */}
                <col style={{width:72}}/>{/* st */}
                <col style={{width:68}}/>{/* actions */}
              </colgroup>
              <thead><tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
                {([["task","업무내용"],["det","상세내용"],["progress","진행률"],["who","담당자"],["due","마감기한"],["pri","우선순위"],["st","상태"]] as [string,string][]).map(([col,label])=>
                  <th key={col} style={{...S.th,cursor:"pointer",userSelect:"none" as const}} onClick={()=>toggleSort(col)}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:3}}>{label}<span style={{fontSize:8,color:sortCol===col?"#2563eb":"#c0c8d4"}}>{sortIcon(col)}</span></span>
                  </th>)}
                <th style={S.th}></th>
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
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"완료"});flash("완료!");}}
                          style={{width:17,height:17,borderRadius:"50%",border:"2px solid #94a3b8",background:"#fff",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all .15s"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#16a34a";e.currentTarget.style.background="#f0fdf4";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#94a3b8";e.currentTarget.style.background="#fff";}}>
                        </button>
                        <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                          {editCell?.id===t.id&&editCell?.field==="task"
                            ?<input autoFocus defaultValue={t.task} style={S.iinp}
                               onKeyDown={e=>{if(e.key==="Enter"){updTodo(t.id,{task:e.target.value});setEditCell(null);}if(e.key==="Escape")setEditCell(null);}}
                               onBlur={e=>{updTodo(t.id,{task:e.target.value});setEditCell(null);}}/>
                            :<div style={{display:"flex",alignItems:"center",gap:3}}>
                               <span style={{fontWeight:taskWeight,color:taskColor,cursor:"pointer",fontSize:14}} onClick={()=>setEditCell({id:t.id,field:"task"})}>{t.task}</span>
                               {od&&<span style={{color:"#dc2626",fontSize:9}}>⚠️</span>}
                             </div>}
                          {!filters.proj&&(()=>{const p=gPr(t.pid);return p.id?<span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:99,background:p.color+"18",color:p.color,border:`1px solid ${p.color}33`,whiteSpace:"nowrap" as const,alignSelf:"flex-start" as const,display:"inline-block"}}>{p.name}</span>:null;})()}
                        </div>
                      </div>
                    </td>
                    <td style={{...S.tdc,cursor:"text",maxWidth:0}}
                      onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setNotePopup({todo:t,x:r.left,y:r.bottom});}}>
                      <span style={{fontSize:13,color:plain?"#475569":"#c0c8d4",fontStyle:plain?"normal":"italic",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>
                        {plain?plain.slice(0,50)+(plain.length>50?"…":""):"메모 추가..."}
                      </span>
                    </td>
                    <td style={{...S.tdc,overflow:"visible"}} onClick={e=>e.stopPropagation()}>
                      <div style={{padding:"0 4px"}}><ProgressBar value={t.progress??0} onChange={v=>updTodo(t.id,{progress:v})}/></div>
                    </td>
                    <CellEdit todo={t} field="who"><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0}}>{t.who[0]}</span><span style={{fontSize:13}}>{t.who}</span></div></CellEdit>
                    <CellEdit todo={t} field="due"><span style={{fontSize:13,color:od?"#dc2626":"#64748b"}}>{t.due}</span></CellEdit>
                    <CellEdit todo={t} field="pri"><span style={{...S.badge(priBg[t.pri],priC[t.pri],`1px solid ${priC[t.pri]}55`)}}><span style={{marginRight:3}}>●</span>{t.pri}</span></CellEdit>
                    <CellEdit todo={t} field="st"><span style={{...S.badge(stBg[t.st],stC[t.st],`1px solid ${stC[t.st]}55`)}}>{t.st}</span></CellEdit>
                    <td style={{...S.tdc,padding:"4px 6px"}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:3,justifyContent:"center",opacity:hoverRow===t.id?1:0,transition:"opacity .15s"}}>
                        {t.createdBy===user?.uid&&<button onClick={e=>{e.stopPropagation();updTodo(t.id,{private:!t.private});}} title={t.private?"나만보기 해제":"나만보기"} style={{background:t.private?"#eff6ff":"#f1f5f9",border:"none",cursor:"pointer",fontSize:10,color:t.private?"#2563eb":"#94a3b8",borderRadius:5,padding:"3px 6px"}}>{t.private?"🔒":"🔓"}</button>}
                        <button onClick={()=>setEditMod(t)} style={{background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:10,color:"#475569",borderRadius:5,padding:"3px 6px"}}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();delTodo(t.id)}} style={{background:"#fee2e2",border:"none",cursor:"pointer",fontSize:10,color:"#dc2626",borderRadius:5,padding:"3px 6px",fontWeight:700}}>🗑️</button>
                      </div>
                    </td>
                  </tr>})}
                {/* 완료된 항목 구분선 */}
                {sorted.filter(t=>t.st==="완료").length>0&&<tr>
                  <td colSpan={8} style={{padding:"8px 12px 4px",background:"#f0fdf4",borderTop:"2px solid #bbf7d0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>✓ 완료됨</span>
                      <span style={{fontSize:10,color:"#86efac"}}>{sorted.filter(t=>t.st==="완료").length}건</span>
                    </div>
                  </td>
                </tr>}
                {/* 완료 항목 */}
                {sorted.filter(t=>t.st==="완료").map(t=>{const plain=stripHtml(t.det||"");
                  return <tr key={t.id} style={{borderBottom:"1px solid #f1f5f9",background:"#fafafa",opacity:.72}}>
                    <td style={S.tdc}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"대기"});flash("완료 취소");}}
                          style={{width:17,height:17,borderRadius:"50%",border:"2px solid #16a34a",background:"#16a34a",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
                          title="완료 취소">
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                          <span style={{fontSize:14,color:"#94a3b8",textDecoration:"line-through"}}>{t.task}</span>
                          {!filters.proj&&(()=>{const p=gPr(t.pid);return p.id?<span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:99,background:"#f1f5f9",color:"#94a3b8",border:"1px solid #e2e8f0",whiteSpace:"nowrap" as const,alignSelf:"flex-start" as const,display:"inline-block"}}>{p.name}</span>:null;})()}
                        </div>
                      </div>
                    </td>
                    <td style={S.tdc}><span style={{fontSize:13,color:"#c0c8d4",fontStyle:"italic",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{plain?plain.slice(0,50):"—"}</span></td>
                    <td style={S.tdc}/>
                    <td style={S.tdc}><span style={{fontSize:13,color:"#94a3b8"}}>{t.who}</span></td>
                    <td style={S.tdc}><span style={{fontSize:13,color:"#94a3b8",textDecoration:"line-through"}}>{t.due}</span></td>
                    <td style={S.tdc}><span style={{...S.badge("#f1f5f9","#94a3b8")}}>{t.pri}</span></td>
                    <td style={S.tdc}><span style={{...S.badge(stBg[t.st],stC[t.st])}}>{t.st}</span></td>
                    <td style={{...S.tdc,padding:"4px 6px"}} onClick={e=>e.stopPropagation()}>
                      <button onClick={e=>{e.stopPropagation();delTodo(t.id)}} style={{background:"#fee2e2",border:"none",cursor:"pointer",fontSize:10,color:"#dc2626",borderRadius:5,padding:"3px 6px",fontWeight:700}}>🗑️</button>
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

    <Modal open={!!editMod} onClose={()=>setEditMod(null)} title={editMod?.id?"업무 수정":"새 업무"} footer={<>{editMod?.id&&<button style={{...S.bd,marginRight:"auto"}} onClick={()=>{const id=parseInt(editMod.id);setEditMod(null);delTodo(id)}}>🗑️ 삭제</button>}<button style={S.bs} onClick={()=>setEditMod(null)}>취소</button><button style={S.bp} onClick={()=>saveMod(editMod)}>💾 저장</button></>}>
      {editMod&&<EditForm f={editMod} onChange={setEditMod} proj={aProj} members={members} pris={pris} stats={stats}/>}
    </Modal>

    <Modal open={!!detMod} onClose={()=>setDetMod(null)} title={detMod?.task||""} footer={<><button style={{...S.bd,marginRight:"auto"}} onClick={()=>{delTodo(detMod.id);setDetMod(null)}}>🗑️</button><button style={S.bs} onClick={()=>setDetMod(null)}>닫기</button><button style={S.bp} onClick={()=>{setEditMod(detMod);setDetMod(null)}}>✏️ 수정</button></>}>
      {detMod&&<DetailView t={detMod} p={gPr(detMod.pid)} stats={stats} stC={stC} stBg={stBg} priC={priC} priBg={priBg} onSt={st=>{updTodo(detMod.id,{st});setDetMod({...detMod,st});flash(`"${st}"`)}}/>}
    </Modal>

    <Modal open={projMod} onClose={()=>setProjMod(false)} title="📁 프로젝트 관리" footer={<button style={S.bs} onClick={()=>setProjMod(false)}>닫기</button>}>
      <ProjMgr projects={projects} todos={todos}
        onAdd={p=>{const np={...p,id:pNId};setProjects(prev=>[...prev,np]);setPNId(pNId+1);setDoc(doc(db,"projects",String(pNId)),np).catch(console.error);flash(`"${p.name}" 추가`)}}
        onDel={id=>{if(todos.some(t=>t.pid===id)){alert("업무 존재");return;}setProjects(p=>p.filter(x=>x.id!==id));deleteDoc(doc(db,"projects",String(id))).catch(console.error);flash("삭제","err")}}
        onEdit={(id,u)=>{setProjects(p=>p.map(x=>{if(x.id!==id)return x;const nx={...x,...u};setDoc(doc(db,"projects",String(id)),nx).catch(console.error);return nx;}));flash("수정 완료")}}/>
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
      onSave={text=>updTodo(notePopup.todo.id,{det:text})}
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
        <button onClick={()=>{if(window.confirm("삭제?"))onDel(p.id)}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8"}}>🗑️</button>
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
    if(tab==="members"){if(!members.includes(v))setMembers(p=>[...p,v]);flash(`담당자 "${v}"`);}
    else if(tab==="pris"){if(!pris.includes(v)){setPris(p=>[...p,v]);setPriC(p=>({...p,[v]:nc}));setPriBg(p=>({...p,[v]:nc+"18"}));}flash(`우선순위 "${v}"`);}
    else{if(!stats.includes(v)){setStats(p=>[...p,v]);setStC(p=>({...p,[v]:nc}));setStBg(p=>({...p,[v]:nc+"18"}));}flash(`상태 "${v}"`);}
    setNv("")};
  const edit=old=>{const n=prompt("이름:",old);if(!n||!n.trim()||n.trim()===old)return;const v=n.trim();
    if(tab==="members")setMembers(p=>p.map(m=>m===old?v:m));
    else if(tab==="pris"){setPris(p=>p.map(x=>x===old?v:x));setPriC(p=>{const c={...p};c[v]=c[old];delete c[old];return c});setPriBg(p=>{const c={...p};c[v]=c[old];delete c[old];return c});}
    else{setStats(p=>p.map(x=>x===old?v:x));setStC(p=>{const c={...p};c[v]=c[old];delete c[old];return c});setStBg(p=>{const c={...p};c[v]=c[old];delete c[old];return c});}
    flash(`수정 완료`)};
  const tryDel=v=>{const cnt=tab==="members"?todos.filter(t=>t.who===v).length:tab==="pris"?todos.filter(t=>t.pri===v).length:todos.filter(t=>t.st===v).length;
    if(cnt){flash(`${cnt}개 업무 사용 중`,"err");return;}setDelConfirm({value:v,tab});};
  const doDel=()=>{if(!delConfirm)return;const v=delConfirm.value;
    if(delConfirm.tab==="members")setMembers(p=>p.filter(m=>m!==v));
    else if(delConfirm.tab==="pris"){setPris(p=>p.filter(x=>x!==v));setPriC(p=>{const c={...p};delete c[v];return c});setPriBg(p=>{const c={...p};delete c[v];return c});}
    else{setStats(p=>p.filter(x=>x!==v));setStC(p=>{const c={...p};delete c[v];return c});setStBg(p=>{const c={...p};delete c[v];return c});}
    flash(`"${v}" 삭제`,"err");setDelConfirm(null);};
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
        <button onClick={()=>{const k=keyDraft.trim();localStorage.setItem("team-todo-apikey",k);setApiKey(k);flash("API 키 저장됨");}}
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
      {tab==="members"
        ?<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#f0f7ff",borderRadius:8,border:"1px solid #bfdbfe"}}>
           <span style={{fontSize:16}}>🔑</span>
           <span style={{fontSize:11,color:"#1d4ed8",lineHeight:1.5}}>담당자는 <b>Google 로그인</b>을 완료한 팀원이 자동으로 등록됩니다.<br/>새 팀원이 앱에 로그인하면 이 목록에 추가됩니다.</span>
         </div>
        :<><div style={{fontSize:11,fontWeight:600,marginBottom:6}}>{tab==="pris"?"새 우선순위":"새 상태"} 추가</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input type="color" value={nc} onChange={e=>setNc(e.target.value)} style={{width:34,height:30,borderRadius:6,cursor:"pointer",border:"1px solid #e2e8f0"}}/>
            <input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}} placeholder="항목명" style={{flex:1,padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
            <button style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={add}>추가</button>
          </div></>}
    </div>
  </div>;
}
