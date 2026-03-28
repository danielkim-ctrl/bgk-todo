import { S } from "../styles";
import { isOD, dDay, fD } from "../utils";
import { Chip } from "../components/ui/Chip";
import { RepeatBadge } from "../components/ui/RepeatBadge";

interface KanbanViewProps {
  todos: any[];
  stats: string[];
  pris: string[];
  priC: Record<string,string>;
  priBg: Record<string,string>;
  stC: Record<string,string>;
  stBg: Record<string,string>;
  kbF: string[];
  setKbF: (v: string[]) => void;
  kbFWho: string[];
  setKbFWho: (v: string[]) => void;
  members: string[];
  visibleProj: any[];
  kanbanOrder: number[];
  setKanbanOrder: (order: number[]) => void;
  kbInsert: {beforeId: number|null; st: string}|null;
  setKbInsert: (v: {beforeId: number|null; st: string}|null) => void;
  dragId: number|null;
  setDragId: (v: number|null) => void;
  dragOver: string|null;
  setDragOver: (v: string|null) => void;
  gPr: (pid: number) => any;
  updTodo: (id: number, updates: any) => void;
  setEditMod: (v: any) => void;
  setDetMod: (v: any) => void;
  flash: (msg: string, type?: string) => void;
}

export function KanbanView({
  todos, stats, pris, priC, priBg, stC, stBg,
  kbF, setKbF, kbFWho, setKbFWho, members, visibleProj,
  kanbanOrder, setKanbanOrder, kbInsert, setKbInsert,
  dragId, setDragId, dragOver, setDragOver,
  gPr, updTodo, setEditMod, setDetMod, flash,
}: KanbanViewProps) {
  return <div>
    {/* 프로젝트 필터 + 새 업무 버튼 */}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6,alignItems:"flex-start"}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <Chip active={kbF.length===0} onClick={()=>setKbF([])}>전체</Chip>
        {visibleProj.map(p=><Chip key={p.id} active={kbF.includes(String(p.id))} color={p.color} onClick={()=>setKbF(kbF.includes(String(p.id))?kbF.filter(x=>x!==String(p.id)):[...kbF,String(p.id)])}>{p.name}</Chip>)}
      </div>
      <button style={S.bp} onClick={()=>setEditMod({pid:"",task:"",who:"",due:"",pri:"보통",st:"대기",det:"",repeat:"없음"})}>+ 새 업무</button>
    </div>
    {/* 담당자 필터 */}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
      <Chip active={kbFWho.length===0} onClick={()=>setKbFWho([])}>전체</Chip>
      {members.map(n=><Chip key={n} active={kbFWho.includes(n)} onClick={()=>setKbFWho(kbFWho.includes(n)?kbFWho.filter(x=>x!==n):[...kbFWho,n])}>{n}</Chip>)}
    </div>
    {/* 칸반 보드 */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,alignItems:"start"}}>
      {stats.map(st=>{
        // kanbanOrder 기준으로 카드 정렬
        const raw=todos.filter(t=>t.st===st&&(!kbF.length||kbF.includes(String(t.pid)))&&(!kbFWho.length||kbFWho.includes(t.who)));
        const items=(()=>{
          if(!kanbanOrder.length) return raw;
          const idx=new Map(kanbanOrder.map((id,i)=>[id,i]));
          return [...raw].sort((a,b)=>(idx.has(a.id)?idx.get(a.id)!:9999)-(idx.has(b.id)?idx.get(b.id)!:9999));
        })();
        const isOver=dragOver===st;
        return <div key={st} style={{borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}
          onDragOver={e=>{
            e.preventDefault();
            // 카드 위가 아닌 컬럼 빈 영역 → 맨 끝 삽입
            if(!(e.target as HTMLElement).closest('[data-kbcard]')){
              setDragOver(st);
              setKbInsert({beforeId:null,st});
            }
          }}
          onDragLeave={e=>{if(!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)){setDragOver(null);setKbInsert(null);}}}
          onDrop={e=>{
            e.preventDefault();
            if(dragId){
              const dt=todos.find(t=>t.id===dragId);
              // ① 항상 드롭된 컬럼의 st 사용 (kbInsert.st는 다른 컬럼에서 온 stale 값일 수 있음)
              updTodo(dragId,{st});
              // kanbanOrder 업데이트
              const allIds=todos.map(t=>t.id);
              const base=[...new Set([...kanbanOrder.filter(id=>allIds.includes(id)),...allIds])];
              const fromIdx=base.indexOf(dragId);
              if(fromIdx>=0) base.splice(fromIdx,1);
              // ② beforeId가 dragId 자신이면 무시 (self-reference 방지)
              const safeBeforeId=kbInsert?.st===st&&kbInsert?.beforeId!=null&&kbInsert.beforeId!==dragId
                ?kbInsert.beforeId:null;
              if(safeBeforeId!=null){
                // 지정 카드 앞에 삽입
                const toIdx=base.indexOf(safeBeforeId);
                if(toIdx>=0) base.splice(toIdx,0,dragId); else base.push(dragId);
              } else {
                base.push(dragId);
              }
              setKanbanOrder(base);
              if(dt?.st!==st) flash(`'${dt?.task||"업무"}'를 '${st}'으로 이동했습니다`);
            }
            setDragId(null);setDragOver(null);setKbInsert(null);document.body.style.cursor="";
          }}>
          {/* 칼럼 헤더 */}
          <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:6,fontWeight:700,fontSize:12,background:isOver?stC[st]+"33":stBg[st]||"#f1f5f9",color:stC[st]||"#334155",transition:"background .15s"}}>
            <span style={{...S.dot(stC[st]||"#94a3b8"),width:8,height:8}}/>{st}
            <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"rgba(0,0,0,.12)",color:"inherit"}}>{items.length}</span>
              <button onClick={()=>setEditMod({pid:"",task:"",who:"",due:"",pri:"보통",st,det:"",repeat:"없음"})} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,lineHeight:1,color:stC[st]||"#64748b",padding:"0 2px",opacity:.75,fontWeight:300}} title={`${st} 업무 추가`}>+</button>
            </span>
          </div>
          {/* 칼럼 바디 */}
          <div style={{background:isOver?"#f0f7ff":"#f8fafc",padding:6,minHeight:120,maxHeight:"calc(100vh - 280px)",overflowY:"auto",display:"flex",flexDirection:"column",gap:0,transition:"background .15s",
            outline:isOver?`2px dashed ${stC[st]||"#2563eb"}`:"none",outlineOffset:-2,borderRadius:"0 0 10px 10px"}}>
            {items.length?items.map((t,cardIdx)=>{
              const p=gPr(t.pid),od=isOD(t.due,t.st),isDragging=dragId===t.id;
              const showLine=kbInsert?.st===st&&kbInsert?.beforeId===t.id;
              return <div key={t.id}>
                {/* 삽입 위치 파란 라인 */}
                {showLine&&<div style={{height:3,background:"#2563eb",borderRadius:2,margin:"2px 4px 4px"}}/>}
                {isDragging
                  ?<div style={{borderRadius:7,minHeight:72,border:"2px dashed #cbd5e1",background:"#f1f5f9",marginBottom:5}}/>
                  :<div data-kbcard
                      draggable
                      onDragStart={e=>{setDragId(t.id);e.dataTransfer.effectAllowed="move";document.body.style.cursor="grabbing";}}
                      onDragEnd={()=>{setDragId(null);setDragOver(null);setKbInsert(null);document.body.style.cursor="";}}
                      onDragOver={e=>{
                        e.preventDefault();e.stopPropagation();
                        setDragOver(st);
                        const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
                        // 카드 상반부 → 이 카드 앞에, 하반부 → 다음 카드 앞에 삽입
                        if(e.clientY<rect.top+rect.height/2){
                          setKbInsert({beforeId:t.id,st});
                        } else {
                          const next=items[cardIdx+1];
                          setKbInsert({beforeId:next?.id??null,st});
                        }
                      }}
                      onClick={()=>setDetMod(t)}
                      style={{background:"#fff",borderRadius:7,padding:10,boxShadow:"0 1px 3px rgba(0,0,0,.08)",borderLeft:`4px solid ${priC[t.pri]||"#94a3b8"}`,cursor:"grab",transition:"box-shadow .15s",marginBottom:5}}>
                      <div style={{fontSize:10,color:"#94a3b8",display:"flex",alignItems:"center",gap:4,marginBottom:3}}><span style={{...S.dot(p.color),width:6,height:6}}/>{p.name}</div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:5,display:"flex",alignItems:"center",gap:4}}>{t.task}<RepeatBadge repeat={t.repeat}/></div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:"#64748b"}}><span>{t.who}</span><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:od?"#dc2626":"#94a3b8"}}>{fD(t.due)}</span>{(()=>{const dd=dDay(t.due,t.st);return dd?<span style={{fontSize:10,fontWeight:700,color:dd.color,background:dd.bg,border:`1px solid ${dd.border}`,padding:"0 5px",borderRadius:3}}>{dd.label}</span>:null;})()}</span></div>
                    </div>}
              </div>;
            }):<div style={{textAlign:"center",padding:"28px 8px",color:"#cbd5e1",fontSize:11,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <span style={{fontSize:22,opacity:.6}}>📋</span>
                <span>업무가 없습니다</span>
                <span style={{fontSize:10,color:"#d1d5db"}}>카드를 드래그해서 이동하세요</span>
              </div>}
            {/* 컬럼 맨 끝 삽입 라인 */}
            {kbInsert?.st===st&&kbInsert?.beforeId===null&&<div style={{height:3,background:"#2563eb",borderRadius:2,margin:"2px 4px"}}/>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
