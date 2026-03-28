import { useState } from "react";
import { S } from "../../styles";
import { isOD, stripHtml } from "../../utils";
import { Project, DeletedTodo } from "../../types";

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

  const stColors: Record<string,string>={대기:"#94a3b8",진행중:"#2563eb",검토:"#d97706",완료:"#16a34a"};
  const stBgs: Record<string,string>={대기:"#f1f5f9",진행중:"#dbeafe",검토:"#fef3c7",완료:"#dcfce7"};

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

  const StatBar=({bySt,total}: {bySt: Record<string,number>, total: number})=><div style={{display:"flex",height:6,borderRadius:99,overflow:"hidden",gap:1}}>
    {["대기","진행중","검토","완료"].map(s=>bySt[s]>0&&<div key={s} title={`${s}: ${bySt[s]}건`} style={{width:`${bySt[s]/total*100}%`,background:stColors[s],minWidth:3}}/>)}
  </div>;

  const MemberAvatar=({name,size=32}: {name: string, size?: number})=>{
    const colors=["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#d97706"];
    const bg=colors[members.indexOf(name)%colors.length];
    return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.38,flexShrink:0}}>{name[0]}</div>;
  };

  // KPI 카드 클릭 시 전달할 상태 필터 — 각 카드가 어떤 상태 목록으로 이동하는지 정의
  const kpiCards: [string,string,number,string,string[]][] = [
    ["#2563eb","📋",total,"전 체 업 무",[]],
    ["#d97706","⚡",inProg,"진행 중",["진행중","검토"]],
    ["#16a34a","✅",done,"완 료",["완료"]],
    ["#dc2626","⚠️",delayed,"지 연",[]],
  ];

  return <div>
    {/* 기간 필터 버튼 — 마감기한 기준으로 KPI 숫자 범위 조정 */}
    <div style={{display:"flex",gap:6,marginBottom:14,justifyContent:"flex-end"}}>
      {(["all","week","month"] as const).map((p,i)=>{
        const labels=["전 체","이번 주","이번 달"];
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
            cursor:onNavigate?"pointer":"default",transition:"box-shadow .15s"}}
          onMouseEnter={e=>{if(onNavigate)(e.currentTarget as HTMLDivElement).style.boxShadow="0 4px 16px rgba(0,0,0,.12)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 1px 3px rgba(0,0,0,.07)";}}>
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
        <button style={tS(tab==="member")} onClick={()=>setTab("member")}>👤 인원별 업무 현황</button>
        <button style={tS(tab==="project")} onClick={()=>setTab("project")}>📁 프로젝트별 업무 현황</button>
        <button style={tS(tab==="daily")} onClick={()=>setTab("daily")}>📅 데일리 활동</button>
      </div>

      {tab==="member"&&<div style={{padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:"120px repeat("+aProj.length+",1fr)",gap:4,marginBottom:8,alignItems:"center"}}>
          <div style={{fontSize:10,color:"#94a3b8"}}></div>
          {aProj.map(p=><div key={p.id} style={{fontSize:9,fontWeight:700,color:p.color,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>)}
        </div>
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
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>총 {m.total}건 · 완료 {m.done}건</div>
              </div>
            </div>
            <StatBar bySt={m.bySt} total={m.total}/>
            <div style={{display:"flex",gap:3,flexWrap:"wrap" as const,marginTop:8}}>
              {["대기","진행중","검토","완료"].map(s=>m.bySt[s]>0&&
                <span key={s} style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:stBgs[s],color:stColors[s],fontWeight:600}}>{s} {m.bySt[s]}</span>)}
            </div>
            <div style={{marginTop:8,display:"flex",gap:3,flexWrap:"wrap" as const}}>
              {m.byProj.map(({proj,cnt})=><span key={proj.id} style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,border:`1px solid ${proj.color}33`}}>{proj.name} {cnt}</span>)}
            </div>
          </div>)}
        </div>
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
                  {totalCompleted>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#dcfce7",color:"#16a34a",fontWeight:600}}>✓{totalCompleted} 완료</span>}
                  {totalDeleted>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600}}>−{totalDeleted} 삭제</span>}
                </div>
              </div>

              {/* 인원별 카드 */}
              <div style={{display:"flex",flexDirection:"column",gap:6,paddingLeft:8,borderLeft:"2px solid #e2e8f0"}}>
                {perMember.map(({name,added,completed,deleted})=>(
                  <div key={name} style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
                    {/* 인원 헤더 */}
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#fafafa",borderBottom:"1px solid #f1f5f9"}}>
                      <MemberAvatar name={name} size={22}/>
                      <span style={{fontWeight:700,fontSize:12,color:"#1a2332"}}>{name}</span>
                      <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
                        {added.length>0&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#eff6ff",color:"#2563eb",fontWeight:700}}>+{added.length}</span>}
                        {completed.length>0&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#dcfce7",color:"#16a34a",fontWeight:700}}>✓{completed.length}</span>}
                        {deleted.length>0&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:700}}>−{deleted.length}</span>}
                      </div>
                    </div>

                    {/* 컬럼 헤더 — 8컬럼 고정 레이아웃: 아이콘·업무명·프로젝트·우선순위·상태·반복·진행률·마감 */}
                    <div style={{display:"grid",gridTemplateColumns:"16px 1fr 78px 40px 44px 36px 38px",gap:0,padding:"3px 12px",borderBottom:"1px solid #f1f5f9",alignItems:"center"}}>
                      <div/>
                      <div style={{fontSize:9,color:"#94a3b8",fontWeight:600}}>업무명</div>
                      <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textAlign:"center" as const}}>프로젝트</div>
                      <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textAlign:"center" as const}}>우선순위</div>
                      <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textAlign:"center" as const}}>상태</div>
                      <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textAlign:"center" as const}}>반복</div>
                      <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textAlign:"right" as const}}>마감</div>
                    </div>

                    {/* 업무 목록 — 모든 행이 동일한 8컬럼 grid 구조 */}
                    <div style={{padding:"4px 0"}}>
                      {/* 추가된 업무 */}
                      {added.map(t=>{
                        const proj = gPr(t.pid);
                        const hasRepeat = t.repeat && t.repeat !== "없음";
                        return <div key={"a"+t.id} style={{display:"grid",gridTemplateColumns:"16px 1fr 78px 40px 44px 36px 38px",gap:0,padding:"4px 12px",alignItems:"start"}}>
                          <span style={{width:14,height:14,borderRadius:"50%",background:"#dbeafe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#2563eb",fontWeight:700,alignSelf:"flex-start",marginTop:2}}>+</span>
                          {/* 업무명 + 상세내용 두 줄 */}
                          <div style={{overflow:"hidden",paddingRight:6}}>
                            <div style={{fontSize:11,color:"#1a2332",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.task}</div>
                            {stripHtml(t.det)&&<div style={{fontSize:9,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginTop:1}}>{stripHtml(t.det)}</div>}
                          </div>
                          {/* 프로젝트 */}
                          {proj.id!==0
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,textAlign:"center" as const,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{proj.name}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>미배정</span>}
                          {/* 우선순위 */}
                          {t.pri
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:priBg[t.pri]||"#f1f5f9",color:priC[t.pri]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{t.pri}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {/* 상태 */}
                          {t.st
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:stBg[t.st]||"#f1f5f9",color:stC[t.st]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{t.st}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {/* 반복 — "없음"이면 — */}
                          {hasRepeat
                            ? <span style={{fontSize:9,color:"#7c3aed",textAlign:"center" as const,fontWeight:600}}>{t.repeat.replace("매","")}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {/* 마감기한 */}
                          {t.due
                            ? <span style={{fontSize:9,color:"#64748b",textAlign:"right" as const}}>{t.due.slice(5).replace("-","/")}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"right" as const}}>—</span>}
                        </div>;
                      })}

                      {/* 완료된 업무 */}
                      {completed.map(t=>{
                        const proj = gPr(t.pid);
                        const hasRepeat = t.repeat && t.repeat !== "없음";
                        return <div key={"c"+t.id} style={{display:"grid",gridTemplateColumns:"16px 1fr 78px 40px 44px 36px 38px",gap:0,padding:"4px 12px",alignItems:"start"}}>
                          <span style={{width:14,height:14,borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#16a34a",fontWeight:700,alignSelf:"flex-start",marginTop:2}}>✓</span>
                          <div style={{overflow:"hidden",paddingRight:6}}>
                            <div style={{fontSize:11,color:"#94a3b8",textDecoration:"line-through",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.task}</div>
                            {stripHtml(t.det)&&<div style={{fontSize:9,color:"#cbd5e1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginTop:1}}>{stripHtml(t.det)}</div>}
                          </div>
                          {proj.id!==0
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,textAlign:"center" as const,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{proj.name}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>미배정</span>}
                          {t.pri
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:priBg[t.pri]||"#f1f5f9",color:priC[t.pri]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{t.pri}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {t.st
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:stBg[t.st]||"#f1f5f9",color:stC[t.st]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{t.st}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {hasRepeat
                            ? <span style={{fontSize:9,color:"#7c3aed",textAlign:"center" as const,fontWeight:600}}>{t.repeat.replace("매","")}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {t.due
                            ? <span style={{fontSize:9,color:"#94a3b8",textAlign:"right" as const}}>{t.due.slice(5).replace("-","/")}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"right" as const}}>—</span>}
                        </div>;
                      })}

                      {/* 삭제된 업무 — st·repeat·progress 필드 포함 (DeletedTodo에 저장됨) */}
                      {deleted.map(d=>{
                        const proj = gPr(d.pid);
                        const hasRepeat = d.repeat && d.repeat !== "없음";
                        return <div key={"d"+d.id} style={{display:"grid",gridTemplateColumns:"16px 1fr 78px 40px 44px 36px 38px",gap:0,padding:"4px 12px",alignItems:"start",opacity:.65}}>
                          <span style={{width:14,height:14,borderRadius:"50%",background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#dc2626",fontWeight:700,alignSelf:"flex-start",marginTop:2}}>−</span>
                          <div style={{overflow:"hidden",paddingRight:6}}>
                            <div style={{fontSize:11,color:"#94a3b8",textDecoration:"line-through",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{d.task}</div>
                            {stripHtml(d.det)&&<div style={{fontSize:9,color:"#cbd5e1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginTop:1}}>{stripHtml(d.det)}</div>}
                          </div>
                          {proj.id!==0
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:proj.color+"18",color:proj.color,fontWeight:600,textAlign:"center" as const,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{proj.name}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>미배정</span>}
                          {d.pri
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:priBg[d.pri]||"#f1f5f9",color:priC[d.pri]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{d.pri}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {d.st
                            ? <span style={{fontSize:9,padding:"1px 4px",borderRadius:99,background:stBg[d.st]||"#f1f5f9",color:stC[d.st]||"#64748b",fontWeight:600,textAlign:"center" as const}}>{d.st}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {hasRepeat
                            ? <span style={{fontSize:9,color:"#7c3aed",textAlign:"center" as const,fontWeight:600}}>{d.repeat.replace("매","")}</span>
                            : <span style={{fontSize:9,color:"#cbd5e1",textAlign:"center" as const}}>—</span>}
                          {/* 삭제된 업무는 마감기한 미보관 */}
                          <span style={{fontSize:9,color:"#cbd5e1",textAlign:"right" as const}}>—</span>
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

        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10}}>프로젝트 상세</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {projData.map(({proj,total:pt,done,bySt,byMember,delayed})=><div key={proj.id}
            style={{border:`1.5px solid ${proj.color}44`,borderLeft:`4px solid ${proj.color}`,borderRadius:10,padding:14,background:"#fafafa"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span style={{fontWeight:700,fontSize:14,color:proj.color}}>{proj.name}</span>
                  {delayed>0&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#fee2e2",color:"#dc2626",fontWeight:600}}>⚠️ 지연 {delayed}건</span>}
                </div>
                <div style={{fontSize:10,color:"#64748b"}}>총 {pt}건 · 완료 {done}건</div>
              </div>
            </div>
            <StatBar bySt={bySt} total={pt}/>
            <div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginTop:8,alignItems:"center"}}>
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
