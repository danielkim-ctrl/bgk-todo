import { useState } from "react";
import { S } from "../../styles";
import { isOD } from "../../utils";
import { Project } from "../../types";

export function Dashboard({todos,projects,members,priC,priBg,stC,stBg,gPr}: {
  todos: any[];
  projects: Project[];
  members: string[];
  priC: Record<string,string>;
  priBg: Record<string,string>;
  stC: Record<string,string>;
  stBg: Record<string,string>;
  gPr: (id: number) => Project;
}) {
  const [tab,setTab]=useState("member");
  const aProj=projects.filter(p=>p.status==="활성");
  const total=todos.length;
  const done=todos.filter(t=>t.st==="완료").length;
  const inProg=todos.filter(t=>t.st==="진행중"||t.st==="검토").length;
  const delayed=todos.filter(t=>isOD(t.due,t.st)).length;
  const avgProg=total?Math.round(todos.reduce((s,t)=>s+(t.progress||0),0)/total):0;

  const stColors: Record<string,string>={대기:"#94a3b8",진행중:"#2563eb",검토:"#d97706",완료:"#16a34a"};
  const stBgs: Record<string,string>={대기:"#f1f5f9",진행중:"#dbeafe",검토:"#fef3c7",완료:"#dcfce7"};

  const memberData=members.map(n=>{
    const mt=todos.filter(t=>t.who===n);
    const byProj=aProj.map(p=>({proj:p,cnt:mt.filter(t=>t.pid===p.id).length})).filter(x=>x.cnt>0);
    const bySt: Record<string,number>={대기:mt.filter(t=>t.st==="대기").length,진행중:mt.filter(t=>t.st==="진행중").length,검토:mt.filter(t=>t.st==="검토").length,완료:mt.filter(t=>t.st==="완료").length};
    const avgP=mt.length?Math.round(mt.reduce((s,t)=>s+(t.progress||0),0)/mt.length):0;
    const hasDelayed=mt.some(t=>isOD(t.due,t.st));
    return {name:n,total:mt.length,done:bySt["완료"],avgP,bySt,byProj,hasDelayed};
  }).filter(m=>m.total>0).sort((a,b)=>b.total-a.total);

  const projData=aProj.map(p=>{
    const pt=todos.filter(t=>t.pid===p.id);
    const byMember=members.map(n=>({name:n,cnt:pt.filter(t=>t.who===n).length})).filter(x=>x.cnt>0);
    const bySt: Record<string,number>={대기:pt.filter(t=>t.st==="대기").length,진행중:pt.filter(t=>t.st==="진행중").length,검토:pt.filter(t=>t.st==="검토").length,완료:pt.filter(t=>t.st==="완료").length};
    const avgP=pt.length?Math.round(pt.reduce((s,t)=>s+(t.progress||0),0)/pt.length):0;
    const delayed=pt.filter(t=>isOD(t.due,t.st)).length;
    return {proj:p,total:pt.length,done:bySt["완료"],avgP,bySt,byMember,delayed};
  }).filter(p=>p.total>0);

  const tS=(a: boolean)=>({padding:"8px 16px",fontSize:12,fontWeight:a?700:500,color:a?"#2563eb":"#64748b",background:a?"#eff6ff":"transparent",border:"none",borderBottom:a?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"});

  const StatBar=({bySt,total}: {bySt: Record<string,number>, total: number})=><div style={{display:"flex",height:6,borderRadius:99,overflow:"hidden",gap:1}}>
    {["대기","진행중","검토","완료"].map(s=>bySt[s]>0&&<div key={s} title={`${s}: ${bySt[s]}건`} style={{width:`${bySt[s]/total*100}%`,background:stColors[s],minWidth:3}}/>)}
  </div>;

  const MemberAvatar=({name,size=32}: {name: string, size?: number})=>{
    const colors=["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#d97706"];
    const bg=colors[members.indexOf(name)%colors.length];
    return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.38,flexShrink:0}}>{name[0]}</div>;
  };

  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      {([["#2563eb","📋",total,"전 체 업 무"],["#d97706","⚡",inProg,"진행 중"],["#16a34a","✅",done,"완 료"],["#dc2626","⚠️",delayed,"지 연"]] as [string,string,number,string][]).map(([c,ic,v,l])=>
        <div key={l} style={{...S.card,borderTop:`3px solid ${c}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:22}}>{ic}</div>
          <div><div style={{fontSize:26,fontWeight:800,color:c,lineHeight:1}}>{v}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{l}</div></div>
        </div>)}
    </div>

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
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>총 {m.total}건 · 완료 {m.done}건 · 평균 {m.avgP}%</div>
              </div>
              <div style={{fontSize:20,fontWeight:800,color:m.avgP===100?"#16a34a":m.avgP>=50?"#d97706":"#2563eb"}}>{m.avgP}<span style={{fontSize:10}}>%</span></div>
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
              <svg width={52} height={52} viewBox="0 0 52 52">
                <circle cx={26} cy={26} r={20} fill="none" stroke="#f1f5f9" strokeWidth={7}/>
                <circle cx={26} cy={26} r={20} fill="none" stroke={proj.color} strokeWidth={7}
                  strokeDasharray={`${avgP*1.257} 125.7`} strokeLinecap="round"
                  transform="rotate(-90 26 26)" opacity={.85}/>
                <text x={26} y={30} textAnchor="middle" fontSize={11} fontWeight={700} fill={proj.color}>{avgP}%</text>
              </svg>
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
