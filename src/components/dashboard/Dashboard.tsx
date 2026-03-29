import { useState } from "react";
import { S } from "../../styles";
import { isOD, stripHtml } from "../../utils";
import { Project, DeletedTodo } from "../../types";
import { CheckCircleIcon, ExclamationTriangleIcon, UserIcon, FolderIcon, CalendarIcon, ListBulletIcon, CheckIcon, BoltIcon, ICON_SM } from "../ui/Icons";

export function Dashboard({todos,projects,members,priC,priBg,stC,stBg,gPr,deletedLog=[],onNavigate}: {
  todos: any[];
  projects: Project[];
  members: string[];
  priC: Record<string,string>;
  priBg: Record<string,string>;
  stC: Record<string,string>;
  stBg: Record<string,string>;
  gPr: (id: number) => Project;
  deletedLog?: DeletedTodo[];
  /** KPI 카드 클릭 시 리스트 뷰로 이동하는 콜백 (상태 필터 배열 전달) */
  onNavigate?: (stFilter: string[]) => void;
}) {
  const [tab,setTab]=useState("member");
  // KPI 기간 필터 — 마감기한 기준으로 표시 범위 조정
  const [period,setPeriod]=useState<"all"|"week"|"month">("all");
  // 데일리 활동 탭 필터 상태
  const [dayRange,setDayRange]=useState<7|30|0>(7); // 0 = 전체
  const [dayWho,setDayWho]=useState("전체");
  const aProj=projects.filter(p=>p.status==="활성");

  // ── 기간 필터 적용 ───────────────────────────────────────────────────────
  const todayIso=new Date().toISOString().slice(0,10);
  const weekEnd=(()=>{const d=new Date();d.setDate(d.getDate()+6);return d.toISOString().slice(0,10);})();
  // 이번 달 마지막 날
  const monthEndDate=new Date(new Date().getFullYear(),new Date().getMonth()+1,0);
  const monthEnd=monthEndDate.toISOString().slice(0,10);

  // 기간 필터에 맞는 todo 목록 — 마감기한이 해당 범위 안에 있거나 전체 모드일 때
  const baseTodos = period==="all" ? todos
    : period==="week" ? todos.filter(t=>t.due&&t.due.split(" ")[0]>=todayIso&&t.due.split(" ")[0]<=weekEnd)
    : todos.filter(t=>t.due&&t.due.split(" ")[0].slice(0,7)===todayIso.slice(0,7)); // 이번 달

  const total=baseTodos.length;
  const done=baseTodos.filter(t=>t.st==="완료").length;
  const inProg=baseTodos.filter(t=>t.st==="진행중"||t.st==="검토").length;
  const delayed=baseTodos.filter(t=>isOD(t.due,t.st)).length;

  // 사용자 설정에서 커스텀한 상태 색상을 사용 (props의 stC/stBg)
  const stColors = stC;
  const stBgs = stBg;

  const memberData=members.map(n=>{
    const mt=todos.filter(t=>t.who===n);
    const byProj=aProj.map(p=>({proj:p,cnt:mt.filter(t=>t.pid===p.id).length})).filter(x=>x.cnt>0);
    const bySt: Record<string,number>={대기:mt.filter(t=>t.st==="대기").length,진행중:mt.filter(t=>t.st==="진행중").length,검토:mt.filter(t=>t.st==="검토").length,완료:mt.filter(t=>t.st==="완료").length};
    const hasDelayed=mt.some(t=>isOD(t.due,t.st));
    return {name:n,total:mt.length,done:bySt["완료"],bySt,byProj,hasDelayed};
  }).filter(m=>m.total>0).sort((a,b)=>b.total-a.total);

  const projData=aProj.map(p=>{
    const pt=todos.filter(t=>t.pid===p.id);
    const byMember=members.map(n=>({name:n,cnt:pt.filter(t=>t.who===n).length})).filter(x=>x.cnt>0);
    const bySt: Record<string,number>={대기:pt.filter(t=>t.st==="대기").length,진행중:pt.filter(t=>t.st==="진행중").length,검토:pt.filter(t=>t.st==="검토").length,완료:pt.filter(t=>t.st==="완료").length};
    const delayed=pt.filter(t=>isOD(t.due,t.st)).length;
    return {proj:p,total:pt.length,done:bySt["완료"],bySt,byMember,delayed};
  }).filter(p=>p.total>0);

  // 데일리 활동 로그 계산
  const todayStr = new Date().toISOString().slice(0,10);
  const cutoff = dayRange === 0 ? null : (() => {
    const d = new Date(); d.setDate(d.getDate() - dayRange + 1);
    return d.toISOString().slice(0,10);
  })();

  // 날짜 범위 + 인원 필터를 적용한 todo 목록
  const dailyTodos = todos.filter(t => {
    if (dayWho !== "전체" && t.who !== dayWho) return false;
    const inCre  = !cutoff || (t.cre  && t.cre  >= cutoff);
    const inDone = !cutoff || (t.done && t.done >= cutoff);
    return inCre || inDone;
  });

  // 같은 필터를 삭제 로그에도 적용
  const dailyDeleted = deletedLog.filter(d => {
    if (dayWho !== "전체" && d.who !== dayWho) return false;
    return !cutoff || d.deletedAt >= cutoff;
  });

  // 활동이 있는 날짜 목록 (내림차순) — 추가/완료/삭제 모두 포함
  const dailyDates = (() => {
    const dateSet = new Set<string>();
    dailyTodos.forEach(t => {
      if (t.cre)  dateSet.add(t.cre.slice(0,10));
      if (t.done) dateSet.add(t.done.slice(0,10));
    });
    dailyDeleted.forEach(d => dateSet.add(d.deletedAt.slice(0,10)));
    return [...dateSet].sort((a,b) => b.localeCompare(a));
  })();

  // 날짜별 + 인원별 활동 그룹화
  const dailyLog = dailyDates.map(date => {
    const label = date === todayStr ? `${date} (오늘)` : date;
    const whoSet = new Set<string>();
    dailyTodos.forEach(t => {
      if (t.cre?.slice(0,10)  === date) whoSet.add(t.who);
      if (t.done?.slice(0,10) === date) whoSet.add(t.who);
    });
    dailyDeleted.forEach(d => {
      if (d.deletedAt.slice(0,10) === date) whoSet.add(d.who);
    });
    const perMember = [...whoSet].map(name => ({
      name,
      added:     dailyTodos.filter(t => t.who === name && t.cre?.slice(0,10)  === date),
      completed: dailyTodos.filter(t => t.who === name && t.done?.slice(0,10) === date),
      deleted:   dailyDeleted.filter(d => d.who === name && d.deletedAt.slice(0,10) === date),
    }));
    const totalAdded     = perMember.reduce((s,m) => s + m.added.length,     0);
    const totalCompleted = perMember.reduce((s,m) => s + m.completed.length,  0);
    const totalDeleted   = perMember.reduce((s,m) => s + m.deleted.length,    0);
    return { date, label, perMember, totalAdded, totalCompleted, totalDeleted };
  });

  // 데일리 탭 날짜 범위 버튼 목록 (JSX 밖에서 정의해 타입 캐스팅 오류 방지)
  const dayRangeOpts: {v: 7|30|0; l: string}[] = [
    {v:7, l:"최근 7일"},
    {v:30, l:"최근 30일"},
    {v:0, l:"전체"},
  ];

  const tS=(a: boolean)=>({padding:"8px 16px",fontSize:12,fontWeight:a?700:500,color:a?"#2563eb":"#64748b",background:a?"#eff6ff":"transparent",border:"none",borderBottom:a?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"});

  // 담당자 카드 펼침 상태 — 클릭 시 해당 담당자 업무 목록 토글
  const [expandedMember, setExpandedMember] = useState<string|null>(null);

  // ── 오늘의 브리핑 데이터 계산 ──────────────────────────────────────────────
  // 지연 업무: 마감일이 오늘 이전이고 완료되지 않은 것
  const overdueItems = todos.filter(t => isOD(t.due, t.st));
  // 오늘 마감 업무: due가 오늘이고 완료 아닌 것
  const todayItems = todos.filter(t => t.due && t.due.slice(0,10) === todayIso && t.st !== "완료");
  // 내일 마감 업무
  const tomorrowIso = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); })();
  const tomorrowItems = todos.filter(t => t.due && t.due.slice(0,10) === tomorrowIso && t.st !== "완료");

  // 브리핑 섹션 접힘 상태
  const [briefOpen, setBriefOpen] = useState(true);

  const StatBar=({bySt,total}: {bySt: Record<string,number>, total: number})=><div style={{display:"flex",height:6,borderRadius:99,overflow:"hidden",gap:1}}>
    {["대기","진행중","검토","완료"].map(s=>bySt[s]>0&&<div key={s} title={`${s}: ${bySt[s]}건`} style={{width:`${bySt[s]/total*100}%`,background:stColors[s],minWidth:3}}/>)}
  </div>;

  const MemberAvatar=({name,size=32}: {name: string, size?: number})=>{
    const colors=["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#d97706"];
    const bg=colors[members.indexOf(name)%colors.length];
    return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.38,flexShrink:0}}>{name[0]}</div>;
  };

  // KPI 카드 클릭 시 전달할 상태 필터 — 각 카드가 어떤 상태 목록으로 이동하는지 정의
  const kpiCards: [string,React.ReactNode,number,string,string[]][] = [
    ["#2563eb",<ListBulletIcon style={{width:22,height:22}}/>,total,"전체 업무",[]],
    ["#d97706",<BoltIcon style={{width:22,height:22}}/>,inProg,"진행중",["진행중","검토"]],
    ["#16a34a",<CheckCircleIcon style={{width:22,height:22}}/>,done,"완료",["완료"]],
    ["#dc2626",<ExclamationTriangleIcon style={{width:22,height:22,color:"#dc2626"}}/>,delayed,"지연",["__overdue__"]],
  ];

  // 브리핑 섹션 내 업무 한 줄 렌더 — 담당자명·우선순위·상태 뱃지 포함
  const BriefRow = ({t, showWho=true}: {t: any, showWho?: boolean}) => {
    const proj = gPr(t.pid);
    const isOver = isOD(t.due, t.st);
    const isToday = t.due && t.due.slice(0,10) === todayIso;
    return (
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:8,
        transition:"background .12s",cursor:"default",borderLeft:`3px solid ${isOver?"#dc2626":isToday?"#d97706":"#e2e8f0"}`}}
        onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
        {/* 우선순위 도트 */}
        <span style={{width:8,height:8,borderRadius:"50%",background:priC[t.pri]||"#94a3b8",flexShrink:0}}/>
        {/* 업무명 */}
        <span style={{flex:1,fontSize:12,color:"#1a2332",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}
          title={t.task}>{t.task}</span>
        {/* 담당자 */}
        {showWho && <span style={{fontSize:11,color:"#64748b",whiteSpace:"nowrap" as const,flexShrink:0}}>{t.who}</span>}
        {/* 프로젝트 칩 */}
        {proj.id !== 0 && <span style={{fontSize:10,padding:"2px 7px",borderRadius:99,
          background:proj.color+"18",color:proj.color,fontWeight:600,flexShrink:0,
          overflow:"hidden",textOverflow:"ellipsis",maxWidth:80,whiteSpace:"nowrap" as const}}>{proj.name}</span>}
        {/* 상태 */}
        <span style={{fontSize:10,padding:"2px 7px",borderRadius:99,
          background:stBg[t.st]||"#f1f5f9",color:stC[t.st]||"#64748b",fontWeight:600,flexShrink:0}}>{t.st}</span>
        {/* 마감 D-day */}
        {t.due && <span style={{fontSize:10,fontWeight:700,color:isOver?"#dc2626":isToday?"#d97706":"#64748b",
          flexShrink:0,minWidth:32,textAlign:"right" as const}}>
          {isOver ? `D+${Math.floor((new Date(todayIso).getTime()-new Date(t.due.slice(0,10)).getTime())/86400000)}` : "D-day"}
        </span>}
      </div>
    );
  };

  return <div>
    {/* ── 오늘의 브리핑 ───────────────────────────────────────────────────── */}
    {(overdueItems.length > 0 || todayItems.length > 0 || tomorrowItems.length > 0) && (
      <div style={{...S.card,marginBottom:16,padding:0,overflow:"hidden"}}>
        {/* 헤더 */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",
          background:"linear-gradient(135deg,#1e3a5f,#1a2f5a)",cursor:"pointer"}}
          onClick={()=>setBriefOpen(o=>!o)}>
          <CalendarIcon style={{width:16,height:16,color:"#93c5fd"}}/>
          <span style={{fontWeight:700,fontSize:13,color:"#fff",flex:1}}>오늘의 브리핑</span>
          <span style={{fontSize:11,color:"#93c5fd"}}>
            {todayIso.replace(/-/g,".")} 기준
          </span>
          {/* 요약 뱃지 */}
          {overdueItems.length > 0 &&
            <span style={{fontSize:11,padding:"2px 10px",borderRadius:99,background:"#dc2626",color:"#fff",fontWeight:700}}>
              지연 {overdueItems.length}건
            </span>}
          {todayItems.length > 0 &&
            <span style={{fontSize:11,padding:"2px 10px",borderRadius:99,background:"#d97706",color:"#fff",fontWeight:700}}>
              오늘 마감 {todayItems.length}건
            </span>}
          {tomorrowItems.length > 0 &&
            <span style={{fontSize:11,padding:"2px 10px",borderRadius:99,background:"#2563eb",color:"#fff",fontWeight:700}}>
              내일 마감 {tomorrowItems.length}건
            </span>}
          <span style={{color:"#93c5fd",fontSize:12,marginLeft:4}}>{briefOpen?"▲":"▼"}</span>
        </div>

        {briefOpen && <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:16}}>
          {/* 지연 업무 */}
          {overdueItems.length > 0 && (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <ExclamationTriangleIcon style={{width:14,height:14,color:"#dc2626"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>지연 업무 — 즉시 확인 필요</span>
                <span style={{fontSize:11,color:"#dc2626",marginLeft:"auto"}}>{overdueItems.length}건</span>
              </div>
              {/* 담당자별로 묶기 */}
              {members.filter(n => overdueItems.some(t => t.who === n)).map(name => {
                const items = overdueItems.filter(t => t.who === name);
                return (
                  <div key={name} style={{marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <MemberAvatar name={name} size={20}/>
                      <span style={{fontSize:11,fontWeight:700,color:"#1a2332"}}>{name}</span>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600}}>{items.length}건</span>
                    </div>
                    <div style={{paddingLeft:26}}>
                      {items.map(t => <BriefRow key={t.id} t={t} showWho={false}/>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 오늘 마감 */}
          {todayItems.length > 0 && (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <CalendarIcon style={{width:14,height:14,color:"#d97706"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#d97706"}}>오늘 마감</span>
                <span style={{fontSize:11,color:"#d97706",marginLeft:"auto"}}>{todayItems.length}건</span>
              </div>
              {members.filter(n => todayItems.some(t => t.who === n)).map(name => {
                const items = todayItems.filter(t => t.who === name);
                return (
                  <div key={name} style={{marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <MemberAvatar name={name} size={20}/>
                      <span style={{fontSize:11,fontWeight:700,color:"#1a2332"}}>{name}</span>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#fff7ed",color:"#d97706",fontWeight:600}}>{items.length}건</span>
                    </div>
                    <div style={{paddingLeft:26}}>
                      {items.map(t => <BriefRow key={t.id} t={t} showWho={false}/>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 내일 마감 */}
          {tomorrowItems.length > 0 && (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <CalendarIcon style={{width:14,height:14,color:"#2563eb"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>내일 마감</span>
                <span style={{fontSize:11,color:"#2563eb",marginLeft:"auto"}}>{tomorrowItems.length}건</span>
              </div>
              {members.filter(n => tomorrowItems.some(t => t.who === n)).map(name => {
                const items = tomorrowItems.filter(t => t.who === name);
                return (
                  <div key={name} style={{marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <MemberAvatar name={name} size={20}/>
                      <span style={{fontSize:11,fontWeight:700,color:"#1a2332"}}>{name}</span>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#eff6ff",color:"#2563eb",fontWeight:600}}>{items.length}건</span>
                    </div>
                    <div style={{paddingLeft:26}}>
                      {items.map(t => <BriefRow key={t.id} t={t} showWho={false}/>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>}
      </div>
    )}

    {/* 기간 필터 버튼 — 마감기한 기준으로 KPI 숫자 범위 조정 */}
    <div style={{display:"flex",gap:6,marginBottom:14,justifyContent:"flex-end"}}>
      {(["all","week","month"] as const).map((p,i)=>{
        const labels=["전체","이번 주","이번 달"];
        const active=period===p;
        return <button key={p} onClick={()=>setPeriod(p)}
          style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${active?"#2563eb":"#e2e8f0"}`,
            background:active?"#2563eb":"#fff",color:active?"#fff":"#64748b",
            fontSize:12,fontWeight:active?700:500,cursor:"pointer",transition:"all .15s"}}>
          {labels[i]}
        </button>;
      })}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      {kpiCards.map(([c,ic,v,l,stF])=>
        // KPI 카드 클릭 시 리스트 뷰로 이동하며 해당 상태 필터 자동 적용
        <div key={l} onClick={()=>onNavigate?.(stF)}
          style={{...S.card,borderTop:`3px solid ${c}`,display:"flex",alignItems:"center",gap:12,
            cursor:onNavigate?"pointer":"default",transition:"all .2s ease"}}
          onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.boxShadow="0 6px 20px rgba(0,0,0,.13)";el.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.boxShadow="0 1px 3px rgba(0,0,0,.07)";el.style.transform="none";}}>
          <div style={{fontSize:22}}>{ic}</div>
          <div><div style={{fontSize:26,fontWeight:800,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{l}</div></div>
        </div>)}
    </div>

    <div style={{marginBottom:20}}>
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>상태별 분포</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {["대기","진행중","검토","완료"].map(s=>{const cnt=todos.filter(t=>t.st===s).length;const pct=total?Math.round(cnt/total*100):0;
            return <div key={s} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:42,fontSize:10,fontWeight:600,color:stColors[s],textAlign:"right" as const}}>{s}</div>
              <div style={{flex:1,height:8,borderRadius:99,background:"#f1f5f9",overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:99,background:stColors[s],width:`${pct}%`,transition:"width .3s"}}/>
              </div>
              <div style={{fontSize:10,color:"#64748b",width:30,textAlign:"right" as const}}>{cnt}건</div>
            </div>})}
        </div>
      </div>
    </div>

    <div style={{...S.card,padding:0,overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"2px solid #e2e8f0"}}>
        <button style={{...tS(tab==="member"),display:"flex",alignItems:"center",gap:4}} onClick={()=>setTab("member")}><UserIcon style={ICON_SM}/> 인원별 업무 현황</button>
        <button style={{...tS(tab==="project"),display:"flex",alignItems:"center",gap:4}} onClick={()=>setTab("project")}><FolderIcon style={ICON_SM}/> 프로젝트별 업무 현황</button>
        <button style={{...tS(tab==="daily"),display:"flex",alignItems:"center",gap:4}} onClick={()=>setTab("daily")}><CalendarIcon style={ICON_SM}/> 데일리 활동</button>
      </div>

      {tab==="member"&&<div style={{padding:16}}>
        {memberData.length===0?<div style={{textAlign:"center",padding:"32px 16px",color:"#94a3b8",fontSize:12}}>표시할 인원별 데이터가 없습니다</div>:<>
        <div style={{display:"grid",gridTemplateColumns:"120px repeat("+aProj.length+",1fr)",gap:4,marginBottom:8,alignItems:"center"}}>
          <div style={{fontSize:10,color:"#94a3b8"}}></div>
          {aProj.map(p=><div key={p.id} title={p.name} style={{fontSize:10,fontWeight:700,color:p.color,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:20}}>
          {memberData.map(m=><div key={m.name} style={{display:"grid",gridTemplateColumns:"120px repeat("+aProj.length+",1fr)",gap:4,alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <MemberAvatar name={m.name} size={22}/>
              <span style={{fontSize:11,fontWeight:600,color:"#1a2332"}}>{m.name}</span>
              {m.hasDelayed&&<span title="지연 업무 있음" style={{display:"inline-flex",color:"#dc2626"}}><ExclamationTriangleIcon style={{width:12,height:12}}/></span>}
            </div>
            {aProj.map(p=>{
              const cnt=m.byProj.find(x=>x.proj.id===p.id)?.cnt||0;
              const intensity=cnt===0?0:Math.min(1,cnt/4);
              return <div key={p.id} title={`${m.name} × ${p.name}: ${cnt}건`}
                style={{height:28,borderRadius:6,background:cnt===0?"#f8fafc":`${p.color}${Math.round(intensity*200+30).toString(16).padStart(2,"0")}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,
                  color:cnt===0?"#e2e8f0":cnt>=3?"#fff":p.color,border:`1px solid ${cnt===0?"#f1f5f9":p.color+"44"}`,
                  transition:"transform .12s, box-shadow .12s",cursor:cnt>0?"pointer":"default"}}
                onMouseEnter={e=>{if(cnt>0){(e.currentTarget as HTMLDivElement).style.transform="scale(1.1)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 2px 8px rgba(0,0,0,.15)";}}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="none";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
                {cnt>0?cnt:""}
              </div>})}
          </div>)}
        </div>

        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>담당자 상세 <span style={{fontWeight:400,color:"#94a3b8"}}>— 클릭하면 업무 목록을 볼 수 있어요</span></div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {memberData.map(m=>{
            const isExp = expandedMember === m.name;
            // 담당자의 완료되지 않은 업무 — 우선순위순(긴급→높음→보통→낮음), 마감일순으로 정렬
            const priOrder: Record<string,number> = {긴급:0,높음:1,보통:2,낮음:3};
            const mTodos = todos.filter(t=>t.who===m.name && t.st!=="완료")
              .sort((a,b)=>(priOrder[a.pri]??9)-(priOrder[b.pri]??9) || (a.due||"").localeCompare(b.due||""));
            const mDone = todos.filter(t=>t.who===m.name && t.st==="완료");
            return (
              <div key={m.name} style={{border:`1.5px solid ${isExp?"#2563eb33":"#e2e8f0"}`,borderRadius:10,
                background:"#fafafa",overflow:"hidden",transition:"box-shadow .15s, border-color .15s",
                boxShadow:isExp?"0 4px 14px rgba(37,99,235,.1)":"none"}}>
                {/* 카드 헤더 — 클릭으로 업무 목록 토글 */}
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",
                  background:isExp?"#f0f6ff":"#fafafa",transition:"background .15s"}}
                  onClick={()=>setExpandedMember(isExp?null:m.name)}
                  onMouseEnter={e=>{if(!isExp)(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}}
                  onMouseLeave={e=>{if(!isExp)(e.currentTarget as HTMLDivElement).style.background="#fafafa";}}>
                  <MemberAvatar name={m.name}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontWeight:700,fontSize:13,color:"#1a2332"}}>{m.name}</span>
                      {m.hasDelayed&&<span style={{fontSize:10,padding:"1px 5px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600,display:"inline-flex",alignItems:"center",gap:2}}><ExclamationTriangleIcon style={{width:10,height:10}}/> 지연</span>}
                    </div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>
                      총 {m.total}건 · 진행중 {mTodos.length}건 · 완료 {m.done}건
                    </div>
                  </div>
                  {/* 상태 진행바 */}
                  <div style={{width:120}}>
                    <StatBar bySt={m.bySt} total={m.total}/>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap" as const,marginTop:6}}>
                      {["대기","진행중","검토","완료"].map(s=>m.bySt[s]>0&&
                        <span key={s} style={{fontSize:10,padding:"1px 5px",borderRadius:99,background:stBgs[s],color:stColors[s],fontWeight:600}}>{s} {m.bySt[s]}</span>)}
                    </div>
                  </div>
                  {/* 프로젝트 칩 */}
                  <div style={{display:"flex",gap:3,flexWrap:"wrap" as const}}>
                    {m.byProj.map(({proj,cnt})=><span key={proj.id} style={{fontSize:10,padding:"2px 6px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,border:`1px solid ${proj.color}33`}}>{cnt}</span>)}
                  </div>
                  {/* 펼침 토글 아이콘 */}
                  <span style={{fontSize:11,color:isExp?"#2563eb":"#94a3b8",transition:"color .15s",marginLeft:4}}>{isExp?"▲":"▼"}</span>
                </div>

                {/* 펼침 — 진행중 업무 목록 */}
                {isExp && <div style={{borderTop:"1px solid #e2e8f0",padding:"8px 0"}}>
                  {/* 테이블 헤더 */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 90px 56px 56px 64px",gap:0,
                    padding:"4px 14px",marginBottom:2}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#94a3b8"}}>업무</span>
                    <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",textAlign:"center" as const}}>프로젝트</span>
                    <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",textAlign:"center" as const}}>우선순위</span>
                    <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",textAlign:"center" as const}}>상태</span>
                    <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",textAlign:"right" as const}}>마감일</span>
                  </div>
                  {mTodos.length === 0
                    ? <div style={{padding:"12px 14px",fontSize:12,color:"#94a3b8",textAlign:"center" as const}}>
                        진행중인 업무가 없습니다
                      </div>
                    : mTodos.map(t => {
                        const proj = gPr(t.pid);
                        const isOver = isOD(t.due, t.st);
                        const isTdy = t.due && t.due.slice(0,10) === todayIso;
                        return (
                          <div key={t.id} style={{display:"grid",gridTemplateColumns:"1fr 90px 56px 56px 64px",gap:0,
                            padding:"6px 14px",borderLeft:`3px solid ${isOver?"#dc2626":isTdy?"#d97706":"transparent"}`,
                            transition:"background .12s",cursor:"default",alignItems:"center"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
                            {/* 업무명 */}
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{width:7,height:7,borderRadius:"50%",background:priC[t.pri]||"#94a3b8",flexShrink:0}}/>
                              <span title={t.task} style={{fontSize:12,color:"#1a2332",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.task}</span>
                            </div>
                            {/* 프로젝트 */}
                            <div style={{textAlign:"center" as const}}>
                              {proj.id!==0
                                ? <span title={proj.name} style={{fontSize:10,padding:"2px 6px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,display:"inline-block",maxWidth:80}}>{proj.name}</span>
                                : <span style={{fontSize:10,color:"#cbd5e1"}}>—</span>}
                            </div>
                            {/* 우선순위 */}
                            <div style={{textAlign:"center" as const}}>
                              <span style={{fontSize:10,padding:"2px 5px",borderRadius:99,background:priBg[t.pri]||"#f1f5f9",color:priC[t.pri]||"#64748b",fontWeight:600}}>{t.pri}</span>
                            </div>
                            {/* 상태 */}
                            <div style={{textAlign:"center" as const}}>
                              <span style={{fontSize:10,padding:"2px 5px",borderRadius:99,background:stBg[t.st]||"#f1f5f9",color:stC[t.st]||"#64748b",fontWeight:600}}>{t.st}</span>
                            </div>
                            {/* 마감 */}
                            <div style={{textAlign:"right" as const}}>
                              {t.due
                                ? <span style={{fontSize:11,fontWeight:700,color:isOver?"#dc2626":isTdy?"#d97706":"#64748b"}}>
                                    {isOver
                                      ? `D+${Math.floor((new Date(todayIso).getTime()-new Date(t.due.slice(0,10)).getTime())/86400000)}`
                                      : isTdy ? "D-day" : t.due.slice(5).replace("-","/")}
                                  </span>
                                : <span style={{fontSize:11,color:"#cbd5e1"}}>—</span>}
                            </div>
                          </div>
                        );
                      })
                  }
                  {/* 완료 업무 요약 */}
                  {mDone.length > 0 && (
                    <div style={{margin:"8px 14px 4px",padding:"6px 10px",borderRadius:8,background:"#f0fdf4",
                      display:"flex",alignItems:"center",gap:8}}>
                      <CheckCircleIcon style={{width:14,height:14,color:"#16a34a"}}/>
                      <span style={{fontSize:11,color:"#16a34a",fontWeight:600}}>완료 {mDone.length}건</span>
                      <div style={{flex:1,display:"flex",gap:4,flexWrap:"wrap" as const}}>
                        {mDone.slice(0,4).map(t=>(
                          <span key={t.id} style={{fontSize:10,color:"#64748b",textDecoration:"line-through",
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.task}</span>
                        ))}
                        {mDone.length > 4 && <span style={{fontSize:10,color:"#94a3b8"}}>외 {mDone.length-4}건</span>}
                      </div>
                    </div>
                  )}
                </div>}
              </div>
            );
          })}
        </div>
      </>}
      </div>}

      {tab==="daily"&&<div style={{padding:16}}>
        {/* 필터 바 */}
        <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center",flexWrap:"wrap" as const}}>
          <div style={{display:"flex",gap:4,background:"#f1f5f9",borderRadius:99,padding:3}}>
            {dayRangeOpts.map(({v,l})=>
              <button key={v} onClick={()=>setDayRange(v)}
                style={{padding:"4px 12px",fontSize:11,fontWeight:dayRange===v?700:500,
                  background:dayRange===v?"#fff":"transparent",color:dayRange===v?"#1a2332":"#64748b",
                  border:"none",borderRadius:99,cursor:"pointer",boxShadow:dayRange===v?"0 1px 3px #0001":"none",transition:"all .15s"}}>{l}</button>)}
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
            {["전체",...members].map(n=>{
              const colors=["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#d97706"];
              const isAll = n==="전체";
              const active = dayWho===n;
              const bg = isAll ? "#0f172a" : colors[members.indexOf(n)%colors.length];
              return <button key={n} onClick={()=>setDayWho(n)}
                style={{padding:"3px 10px",fontSize:11,fontWeight:active?700:500,
                  background:active?bg:"#f1f5f9",color:active?"#fff":"#64748b",
                  border:"none",borderRadius:99,cursor:"pointer",transition:"all .15s"}}>{n}</button>;
            })}
          </div>
        </div>

        {dailyLog.length===0&&<div style={{textAlign:"center" as const,padding:"48px 0",color:"#94a3b8",fontSize:13}}>
          해당 기간에 활동 내역이 없습니다.
        </div>}

        {/* 날짜별 타임라인 */}
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {dailyLog.map(({date,label,perMember,totalAdded,totalCompleted,totalDeleted})=>(
            <div key={date}>
              {/* 날짜 헤더 */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{fontWeight:800,fontSize:12,color:date===todayStr?"#2563eb":"#1a2332",
                  background:date===todayStr?"#eff6ff":"transparent",padding:date===todayStr?"2px 8px":"0",
                  borderRadius:99,whiteSpace:"nowrap" as const}}>{label}</div>
                <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
                {/* 날짜별 요약 배지 */}
                <div style={{display:"flex",gap:4}}>
                  {totalAdded>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#eff6ff",color:"#2563eb",fontWeight:600}}>+{totalAdded} 추가</span>}
                  {totalCompleted>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#dcfce7",color:"#16a34a",fontWeight:600,display:"inline-flex",alignItems:"center",gap:2}}><CheckIcon style={{width:10,height:10}}/>{totalCompleted} 완료</span>}
                  {totalDeleted>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600}}>−{totalDeleted} 삭제</span>}
                </div>
              </div>

              {/* 인원별 카드 */}
              <div style={{display:"flex",flexDirection:"column",gap:6,paddingLeft:8,borderLeft:"2px solid #e2e8f0"}}>
                {perMember.map(({name,added,completed,deleted})=>(
                  <div key={name} style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,overflow:"hidden",transition:"box-shadow .15s, transform .15s"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 14px rgba(0,0,0,.1)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-1px)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="none";(e.currentTarget as HTMLDivElement).style.transform="none";}}>
                    {/* 인원 헤더 */}
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#fafafa",borderBottom:"1px solid #f1f5f9"}}>
                      <MemberAvatar name={name} size={22}/>
                      <span style={{fontWeight:700,fontSize:12,color:"#1a2332"}}>{name}</span>
                      <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
                        {added.length>0&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#eff6ff",color:"#2563eb",fontWeight:700}}>+{added.length}</span>}
                        {completed.length>0&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#dcfce7",color:"#16a34a",fontWeight:700,display:"inline-flex",alignItems:"center",gap:2}}><CheckIcon style={{width:10,height:10}}/>{completed.length}</span>}
                        {deleted.length>0&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:700}}>−{deleted.length}</span>}
                      </div>
                    </div>

                    {/* 컬럼 헤더 — 8컬럼 고정 레이아웃: 아이콘·업무내용·프로젝트·우선순위·상태·반복·진행률·마감 */}
                    <div style={{display:"grid",gridTemplateColumns:"16px 1fr 78px 40px 44px 36px 38px",gap:0,padding:"3px 12px",borderBottom:"1px solid #f1f5f9",alignItems:"center"}}>
                      <div/>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>업무내용</div>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textAlign:"center" as const}}>프로젝트</div>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textAlign:"center" as const}}>우선순위</div>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textAlign:"center" as const}}>상태</div>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textAlign:"center" as const}}>반복</div>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textAlign:"right" as const}}>마감기한</div>
                    </div>

                    {/* 업무 목록 — 모든 행이 동일한 8컬럼 grid 구조 */}
                    <div style={{padding:"4px 0"}}>
                      {/* 추가된 업무 */}
                      {added.map(t=>{
                        const proj = gPr(t.pid);
                        const hasRepeat = t.repeat && t.repeat !== "없음";
                        return <div key={"a"+t.id} style={{display:"grid",gridTemplateColumns:"16px 1fr 78px 40px 44px 36px 38px",gap:0,padding:"4px 12px",alignItems:"start",borderRadius:6,transition:"background .12s",cursor:"default"}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
                          <span style={{width:14,height:14,borderRadius:"50%",background:"#dbeafe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#2563eb",fontWeight:700,alignSelf:"flex-start",marginTop:2}}>+</span>
                          {/* 업무내용 + 상세내용 두 줄 */}
                          <div style={{overflow:"hidden",paddingRight:6}}>
                            <div title={t.task} style={{fontSize:11,color:"#1a2332",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.task}</div>
                            {stripHtml(t.det)&&<div style={{fontSize:10,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginTop:1}}>{stripHtml(t.det)}</div>}
                          </div>
                          {/* 프로젝트 */}
                          {proj.id!==0
                            ? <span title={proj.name} style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,textAlign:"center" as const,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{proj.name}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>미배정</span>}
                          {/* 우선순위 */}
                          {t.pri
                            ? <span style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:priBg[t.pri]||"#f1f5f9",color:priC[t.pri]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{t.pri}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {/* 상태 */}
                          {t.st
                            ? <span style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:stBg[t.st]||"#f1f5f9",color:stC[t.st]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{t.st}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {/* 반복 — "없음"이면 — */}
                          {hasRepeat
                            ? <span style={{fontSize:10,color:"#7c3aed",textAlign:"center" as const,fontWeight:600}}>{t.repeat.replace("매","")}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {/* 마감기한 */}
                          {t.due
                            ? <span style={{fontSize:10,color:"#64748b",textAlign:"right" as const}}>{t.due.slice(5).replace("-","/")}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"right" as const}}>—</span>}
                        </div>;
                      })}

                      {/* 완료된 업무 */}
                      {completed.map(t=>{
                        const proj = gPr(t.pid);
                        const hasRepeat = t.repeat && t.repeat !== "없음";
                        return <div key={"c"+t.id} style={{display:"grid",gridTemplateColumns:"16px 1fr 78px 40px 44px 36px 38px",gap:0,padding:"4px 12px",alignItems:"start",borderRadius:6,transition:"background .12s",cursor:"default"}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
                          <span style={{width:14,height:14,borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",color:"#16a34a",alignSelf:"flex-start",marginTop:2}}><CheckIcon style={{width:10,height:10}}/></span>
                          <div style={{overflow:"hidden",paddingRight:6}}>
                            <div title={t.task} style={{fontSize:11,color:"#94a3b8",textDecoration:"line-through",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.task}</div>
                            {stripHtml(t.det)&&<div style={{fontSize:10,color:"#cbd5e1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginTop:1}}>{stripHtml(t.det)}</div>}
                          </div>
                          {proj.id!==0
                            ? <span title={proj.name} style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,textAlign:"center" as const,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{proj.name}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>미배정</span>}
                          {t.pri
                            ? <span style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:priBg[t.pri]||"#f1f5f9",color:priC[t.pri]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{t.pri}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {t.st
                            ? <span style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:stBg[t.st]||"#f1f5f9",color:stC[t.st]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{t.st}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {hasRepeat
                            ? <span style={{fontSize:10,color:"#7c3aed",textAlign:"center" as const,fontWeight:600}}>{t.repeat.replace("매","")}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {t.due
                            ? <span style={{fontSize:10,color:"#94a3b8",textAlign:"right" as const}}>{t.due.slice(5).replace("-","/")}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"right" as const}}>—</span>}
                        </div>;
                      })}

                      {/* 삭제된 업무 — st·repeat·progress 필드 포함 (DeletedTodo에 저장됨) */}
                      {deleted.map(d=>{
                        const proj = gPr(d.pid);
                        const hasRepeat = d.repeat && d.repeat !== "없음";
                        return <div key={"d"+d.id} style={{display:"grid",gridTemplateColumns:"16px 1fr 78px 40px 44px 36px 38px",gap:0,padding:"4px 12px",alignItems:"start",opacity:.65,borderRadius:6,transition:"background .12s",cursor:"default"}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background="#f8fafc";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background="transparent";}}>
                          <span style={{width:14,height:14,borderRadius:"50%",background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#dc2626",fontWeight:700,alignSelf:"flex-start",marginTop:2}}>−</span>
                          <div style={{overflow:"hidden",paddingRight:6}}>
                            <div title={d.task} style={{fontSize:11,color:"#94a3b8",textDecoration:"line-through",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{d.task}</div>
                            {stripHtml(d.det)&&<div style={{fontSize:10,color:"#cbd5e1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginTop:1}}>{stripHtml(d.det)}</div>}
                          </div>
                          {proj.id!==0
                            ? <span title={proj.name} style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,textAlign:"center" as const,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{proj.name}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>미배정</span>}
                          {d.pri
                            ? <span style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:priBg[d.pri]||"#f1f5f9",color:priC[d.pri]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{d.pri}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {d.st
                            ? <span style={{fontSize:10,padding:"1px 4px",borderRadius:99,background:stBg[d.st]||"#f1f5f9",color:stC[d.st]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{d.st}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {hasRepeat
                            ? <span style={{fontSize:10,color:"#7c3aed",textAlign:"center" as const,fontWeight:600}}>{d.repeat.replace("매","")}</span>
                            : <span style={{fontSize:10,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {/* 삭제된 업무는 마감기한 미보관 */}
                          <span style={{fontSize:10,color:"#cbd5e1",textAlign:"right" as const}}>—</span>
                        </div>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>}

      {tab==="project"&&<div style={{padding:16}}>
        {projData.length===0?<div style={{textAlign:"center",padding:"32px 16px",color:"#94a3b8",fontSize:12}}>표시할 프로젝트별 데이터가 없습니다</div>:<>
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
              <span title={proj.name} style={{fontSize:10,fontWeight:700,color:proj.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{proj.name}</span>
            </div>
            {memberData.map(m=>{
              const cnt=byMember.find(x=>x.name===m.name)?.cnt||0;
              const intensity=cnt===0?0:Math.min(1,cnt/4);
              return <div key={m.name} title={`${proj.name} × ${m.name}: ${cnt}건`}
                style={{height:28,borderRadius:6,background:cnt===0?"#f8fafc":`${proj.color}${Math.round(intensity*200+30).toString(16).padStart(2,"0")}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,
                  color:cnt===0?"#e2e8f0":cnt>=3?"#fff":proj.color,border:`1px solid ${cnt===0?"#f1f5f9":proj.color+"44"}`,
                  transition:"transform .12s, box-shadow .12s",cursor:cnt>0?"pointer":"default"}}
                onMouseEnter={e=>{if(cnt>0){(e.currentTarget as HTMLDivElement).style.transform="scale(1.1)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 2px 8px rgba(0,0,0,.15)";}}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="none";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
                {cnt>0?cnt:""}
              </div>})}
          </div>)}
        </div>

        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>프로젝트 상세</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {projData.map(({proj,total:pt,done,bySt,byMember,delayed})=><div key={proj.id}
            style={{border:`1.5px solid ${proj.color}44`,borderLeft:`4px solid ${proj.color}`,borderRadius:10,padding:14,background:"#fafafa",transition:"box-shadow .15s, transform .15s",cursor:"default"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 14px rgba(0,0,0,.1)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="none";(e.currentTarget as HTMLDivElement).style.transform="none";}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span style={{fontWeight:700,fontSize:14,color:proj.color}}>{proj.name}</span>
                  {delayed>0&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600,display:"inline-flex",alignItems:"center",gap:2}}><ExclamationTriangleIcon style={{width:10,height:10}}/> 지연 {delayed}건</span>}
                </div>
                <div style={{fontSize:10,color:"#64748b"}}>총 {pt}건 · 완료 {done}건</div>
              </div>
            </div>
            <StatBar bySt={bySt} total={pt}/>
            <div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginTop:8,alignItems:"center"}}>
              {["대기","진행중","검토","완료"].map(s=>bySt[s]>0&&
                <span key={s} style={{fontSize:10,padding:"2px 6px",borderRadius:99,background:stBgs[s],color:stColors[s],fontWeight:600}}>{s} {bySt[s]}</span>)}
              <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                {byMember.map(({name,cnt})=><div key={name} title={`${name}: ${cnt}건`} style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#64748b"}}>
                  <MemberAvatar name={name} size={18}/><span>{cnt}</span>
                </div>)}
              </div>
            </div>
          </div>)}
        </div>
      </>}
      </div>}
    </div>
  </div>;
}
