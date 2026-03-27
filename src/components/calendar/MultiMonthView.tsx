import { fmt2, dateStr } from "../../utils";
import { Project } from "../../types";

export function MultiMonthView({calY,calM,ftodos,todayStr,gPr,setDetMod,setCalDate,setCalView,calDays,evStyle}: {
  calY: number;
  calM: number;
  ftodos: any[];
  todayStr: string;
  gPr: (id: number) => Project;
  setDetMod: (t: any) => void;
  setCalDate: (d: Date) => void;
  setCalView: (v: string) => void;
  calDays: string[];
  evStyle: (p: Project, repeat: string) => React.CSSProperties;
}) {
  const months=Array.from({length:3},(_,i)=>{let y=calY,m=calM+i;if(m>11){m-=12;y++;}return{y,m}});
  const monthCellsFor=(y: number,m: number)=>{
    const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),pd=new Date(y,m,0).getDate();
    let c: {d:number,cur:boolean,ds?:string,isT?:boolean}[]=[];
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
