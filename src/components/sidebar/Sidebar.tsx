import { PROJ_PALETTE } from "../../constants";
import { S } from "../../styles";
import { Filters } from "../../types";
import { Project } from "../../types";

interface SidebarProps {
  search: string;
  setSearch: (v: string) => void;
  filters: Filters;
  togF: (k: string, v: string) => void;
  todos: any[];
  aProj: Project[];
  members: string[];
  pris: string[];
  priC: Record<string,string>;
  stats: string[];
  stC: Record<string,string>;
  favSidebar: Record<string,string[]>;
  togFavSidebar: (key: string, val: string) => void;
  isFav: (id: number) => boolean;
  gPr: (id: number) => Project;
  setChipAdd: (v: string|null) => void;
  setChipVal: (v: string) => void;
  setChipColor: (v: string) => void;
  projects: Project[];
}

export function Sidebar({
  search, setSearch, filters, togF, todos, aProj, members, pris, priC, stats, stC,
  favSidebar, togFavSidebar, isFav, gPr, setChipAdd, setChipVal, setChipColor, projects
}: SidebarProps) {
  return (
    <div style={{width:196,flexShrink:0,background:"#fff",borderRadius:10,border:"1px solid #e8edf4",position:"sticky",top:100,maxHeight:"calc(100vh - 112px)",boxShadow:"0 1px 3px rgba(0,0,0,.07)",display:"flex",flexDirection:"column" as const}}>
      <div style={{flex:1,overflowY:"auto" as const}}>
      <div style={{padding:"12px 12px 8px",borderBottom:"1px solid #f1f5f9"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:12,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="검색..." style={{width:"100%",padding:"6px 24px 6px 26px",border:"1.5px solid #e2e8f0",borderRadius:7,fontSize:11,outline:"none",boxSizing:"border-box" as const,background:"#f8fafc"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",background:"#94a3b8",border:"none",borderRadius:"50%",width:14,height:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>
            <span style={{color:"#fff",fontSize:9,fontWeight:700,lineHeight:1}}>✕</span>
          </button>}
        </div>
      </div>
      <div style={{padding:"8px 12px 4px",borderBottom:"1px solid #f1f5f9"}}>
        <div onClick={()=>togF("fav","")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",cursor:"pointer",background:filters.fav?"#fefce8":"transparent",borderRadius:6,fontSize:12,color:filters.fav?"#b45309":"#475569",fontWeight:filters.fav?700:400,userSelect:"none" as const,transition:"background .12s"}}>
          <span style={{fontSize:13,lineHeight:1}}>{filters.fav?"★":"☆"}</span>
          <span style={{flex:1}}>즐겨찾기</span>
          <span style={{fontSize:10,color:filters.fav?"#d97706":"#94a3b8",background:filters.fav?"#fde68a":"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:600,flexShrink:0}}>{todos.filter(t=>isFav(t.id)).length}</span>
        </div>
      </div>
      {([["프로젝트","proj",aProj.map(p=>({v:String(p.id),l:p.name,c:p.color,n:todos.filter(t=>t.pid===p.id).length}))],
        ["담당자","who",[...new Set(todos.map((t:any)=>t.who).concat(members))].map(n=>({v:n,l:n,n:todos.filter((t:any)=>t.who===n).length}))],
        ["우선순위","pri",pris.map(p=>({v:p,l:p,c:priC[p],n:todos.filter((t:any)=>t.pri===p).length}))],
        ["상태","st",stats.map(s=>({v:s,l:s,c:stC[s],n:todos.filter((t:any)=>t.st===s).length}))],
      ] as [string,string,{v:string,l:string,c?:string,n:number}[]][]).map(([label,key,items])=><div key={key}>
        <span style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as const,letterSpacing:.8,padding:"10px 12px 4px",display:"block"}}>{label}</span>
        {(()=>{const empty=(filters[key as keyof Filters] as string[]).length===0;return(<div onClick={()=>togF(key,"")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",cursor:"pointer",background:empty?"#eff6ff":"transparent",color:empty?"#2563eb":"#475569",fontWeight:empty?600:400,fontSize:12,userSelect:"none" as const}}>
          <span style={{flex:1}}>전체</span>
          <span style={{fontSize:10,color:empty?"#93c5fd":"#94a3b8",background:empty?"#dbeafe":"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:600,flexShrink:0}}>{todos.length}</span>
        </div>);})()}
        {(()=>{const sel=(filters[key as keyof Filters] as string[]).includes("__none__");const cnt=key==="proj"?todos.filter(t=>gPr(t.pid).id===0).length:todos.filter((t:any)=>!(t as any)[key]).length;return(<div onClick={()=>togF(key,"__none__")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",cursor:"pointer",background:sel?"#eff6ff":"transparent",color:sel?"#2563eb":"#475569",fontWeight:sel?600:400,fontSize:12,userSelect:"none" as const}}>
          <span style={{flex:1}}>미배정</span>
          <span style={{fontSize:10,color:sel?"#93c5fd":"#94a3b8",background:sel?"#dbeafe":"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:600,flexShrink:0}}>{cnt}</span>
        </div>);})()}
        {[...items].sort((a,b)=>{const fa=(favSidebar[key]||[]).includes(a.v)?0:1,fb=(favSidebar[key]||[]).includes(b.v)?0:1;return fa-fb;}).map(it=>{const isItemFav=(favSidebar[key]||[]).includes(it.v);const sel=(filters[key as keyof Filters] as string[]).includes(it.v);return <div key={it.v} onClick={()=>togF(key,it.v)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px 4px 6px",cursor:"pointer",background:sel?"#eff6ff":"transparent",color:sel?"#2563eb":"#475569",fontWeight:sel?600:400,fontSize:12,userSelect:"none" as const}}>
          <button onClick={e=>{e.stopPropagation();togFavSidebar(key,it.v);}} title={isItemFav?"고정 해제":"상단 고정"} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,padding:"0 2px",lineHeight:1,color:isItemFav?"#f59e0b":"#d1d5db",flexShrink:0,transition:"color .12s"}} onMouseEnter={e=>{if(!isItemFav)(e.currentTarget as HTMLButtonElement).style.color="#fbbf24";}} onMouseLeave={e=>{if(!isItemFav)(e.currentTarget as HTMLButtonElement).style.color="#d1d5db";}}>{isItemFav?"★":"☆"}</button>
          {it.c&&<span style={{width:6,height:6,borderRadius:"50%",background:it.c,flexShrink:0,display:"inline-block"}}/>}
          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{it.l}</span>
          <span style={{fontSize:10,color:"#94a3b8",background:"#f1f5f9",borderRadius:99,padding:"0 5px",fontWeight:500,flexShrink:0}}>{it.n}</span>
        </div>;})}

        {(key==="proj"||key==="who")&&<div style={{padding:"2px 8px 4px"}}>
          <button onClick={()=>{setChipAdd(key);setChipVal("");const used=projects.map((pr:{color:string})=>pr.color);setChipColor(key==="proj"?(PROJ_PALETTE.find(c=>!used.includes(c))||PROJ_PALETTE[0]):"#8b5cf6")}} style={{fontSize:10,color:"#94a3b8",background:"none",border:"1px dashed #d1d5db",borderRadius:5,padding:"2px 10px",cursor:"pointer",width:"100%"}}>+ 추가</button>
        </div>}
      </div>)}
      </div>
      <div style={{padding:"8px 12px",borderTop:"1px solid #f1f5f9",flexShrink:0}}>
        {(()=>{const active=!!(search||filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.fav);return(<button onClick={()=>{setSearch("");togF("__reset__","");}} style={{width:"100%",padding:"6px",fontSize:11,color:active?"#2563eb":"#94a3b8",background:active?"#eff6ff":"#f8fafc",border:`1px solid ${active?"#bfdbfe":"#e2e8f0"}`,borderRadius:6,cursor:"pointer",fontWeight:active?600:400,transition:"all .15s"}}>✕ 필터 초기화</button>);})()}
      </div>
    </div>
  );
}
