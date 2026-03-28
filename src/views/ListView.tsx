import { S } from "../styles";
import { isOD, dDay, fDow, fmt2, stripHtml } from "../utils";
import { REPEAT_OPTS } from "../constants";
import { avColor, avColor2, avInitials } from "../utils/avatarUtils";
import { Sidebar } from "../components/sidebar/Sidebar";
import { AddTodoSection } from "../components/todo/AddTodoSection";
import { MemoView } from "../components/todo/MemoView";
import { SectionLabel } from "../components/ui/SectionLabel";
import { DropPanel } from "../components/ui/DropPanel";
import { RepeatBadge } from "../components/ui/RepeatBadge";

interface ListViewProps {
  // sidebar props
  search: string;
  setSearch: (v: string) => void;
  filters: any;
  setFilters: (v: any) => void;
  togF: (type: string, val: string) => void;
  todos: any[];
  aProj: any[];
  members: string[];
  pris: string[];
  priC: Record<string,string>;
  priBg: Record<string,string>;
  stats: string[];
  stC: Record<string,string>;
  stBg: Record<string,string>;
  favSidebar: any;
  togFavSidebar: (key: string, val: string) => void;
  isFav: (id: number) => boolean;
  gPr: (pid: number) => any;
  setChipAdd: (v: any) => void;
  setChipVal: (v: string) => void;
  setChipColor: (v: string) => void;
  projects: any[];
  hiddenProjects: number[];
  toggleHideProject: (id: number) => void;
  hiddenMembers: string[];
  toggleHideMember: (name: string) => void;
  visibleProj: any[];
  visibleMembers: string[];
  // AddTodoSection props
  addTab: any;
  setAddTab: (v: any) => void;
  newRows: any[];
  setNewRows: (v: any[]) => void;
  addNR: () => void;
  saveNRs: () => void;
  saveOneNR: (i: number) => void;
  isNREmpty: (row: any) => boolean;
  setNotePopup: (v: any) => void;
  setNrDatePop: (v: any) => void;
  aiText: string;
  setAiText: (v: string) => void;
  aiFiles: any[];
  setAiFiles: (v: any[]) => void;
  aiLoad: boolean;
  aiSt: any;
  setAiSt: (v: any) => void;
  aiParsed: any;
  setAiParsed: (v: any) => void;
  parseAI: () => void;
  confirmAI: () => void;
  sorted: any[];
  currentUser: string|null;
  // list view controls
  todoView: string;
  setTodoView: (v: "list"|"memo") => void;
  memoCols: number;
  setMemoCols: (v: number) => void;
  showDone: boolean;
  setShowDone: (value: boolean | ((prev: boolean) => boolean)) => void;
  expandMode: boolean;
  setExpandMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  sortCol: string;
  sortDir: string;
  sortIcon: (col: string) => string;
  toggleSort: (col: string) => void;
  selectedIds: Set<number>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  handleCheck: (id: number, shift: boolean) => void;
  toggleSelectAll: () => void;
  toggleFav: (id: number) => void;
  addTodo: (todo: any) => void;
  updTodo: (id: number, updates: any) => void;
  flash: (msg: string, type?: string) => void;
  delTodo: (id: number) => void;
  setEditMod: (v: any) => void;
  // cell edit
  editCell: {id: number; field: string}|null;
  setEditCell: (v: {id: number; field: string}|null) => void;
  datePop: any;
  setDatePop: (v: any) => void;
  // hover row
  hoverRow: number|null;
  setHoverRow: (v: number|null) => void;
  hoverRowRect: {top: number; height: number}|null;
  setHoverRowRect: (v: {top: number; height: number}|null) => void;
  hoverLeaveTimer: React.MutableRefObject<any>;
  // refs
  addSecRef: React.RefObject<HTMLDivElement>;
  tblDivRef: React.RefObject<HTMLDivElement>;
}

export function ListView(props: ListViewProps) {
  const {
    search, setSearch, filters, setFilters, togF,
    todos, aProj, members, pris, priC, priBg, stats, stC, stBg,
    favSidebar, togFavSidebar, isFav, gPr, setChipAdd, setChipVal, setChipColor,
    projects, hiddenProjects, toggleHideProject, hiddenMembers, toggleHideMember,
    visibleProj, visibleMembers,
    addTab, setAddTab, newRows, setNewRows, addNR, saveNRs, saveOneNR, isNREmpty,
    setNotePopup, setNrDatePop, aiText, setAiText, aiFiles, setAiFiles,
    aiLoad, aiSt, setAiSt, aiParsed, setAiParsed, parseAI, confirmAI,
    sorted, currentUser,
    todoView, setTodoView, memoCols, setMemoCols, showDone, setShowDone,
    expandMode, setExpandMode, sortCol, sortDir, sortIcon, toggleSort,
    selectedIds, allVisibleSelected, someVisibleSelected, handleCheck, toggleSelectAll,
    toggleFav, addTodo, updTodo, flash, delTodo, setEditMod,
    editCell, setEditCell, datePop, setDatePop,
    hoverRow, setHoverRow, hoverRowRect, setHoverRowRect, hoverLeaveTimer,
    addSecRef, tblDivRef,
  } = props;

  const CellEdit = ({todo, field, children}: {todo: any, field: string, children: React.ReactNode}) => {
    const isE = editCell?.id === todo.id && editCell?.field === field;
    const stop = () => setEditCell(null);
    const start = () => setEditCell({id: todo.id, field});
    const save = (val: string) => { updTodo(todo.id, {[field]: field === "pid" ? parseInt(val) : val}); stop(); };
    if (!isE) return <td style={S.tdc} onClick={e => { if (field === "due") { const r = e.currentTarget.getBoundingClientRect(); setDatePop({id: todo.id, rect: r, value: todo.due || ""}); } start(); }}>{children}</td>;
    if (field === "task") return <td style={{...S.tdc, overflow:"visible"}}><input autoFocus defaultValue={todo.task} style={S.iinp} onKeyDown={e => { if ((e as any).key === "Enter") save((e.target as HTMLInputElement).value); if ((e as any).key === "Escape") stop(); }} onBlur={e => save(e.target.value)}/></td>;
    if (field === "due") return <td style={{...S.tdc, background:"#eff6ff"}}>{children}</td>;
    if (field === "pid") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={visibleProj.map(p => ({value: String(p.id), label: p.name, color: p.color}))} current={String(todo.pid)} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={S.dot(it.color!)}/>{it.label}</>}/></td>;
    if (field === "who") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={visibleMembers.map(m => ({value: m, label: m}))} current={todo.who} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(it.label)},${avColor2(it.label)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0}}>{avInitials(it.label)}</span>{it.label}</>}/></td>;
    if (field === "pri") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><span style={{...S.badge(priBg[todo.pri], priC[todo.pri], `1px solid ${priC[todo.pri]}55`), display:"inline-flex", alignItems:"center", gap:3, opacity:.85}}><span>●</span>{todo.pri}<span style={{fontSize:8,opacity:.6}}>▾</span></span><DropPanel items={pris.map(p => ({value: p, label: p, color: priC[p]}))} current={todo.pri} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{...S.dot(it.color!), width:8, height:8}}/>{it.label}</>}/></td>;
    if (field === "st") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><span style={{...S.badge(stBg[todo.st], stC[todo.st], `1px solid ${stC[todo.st]}55`), display:"inline-flex", alignItems:"center", gap:3, opacity:.85}}>{todo.st}<span style={{fontSize:8,opacity:.6}}>▾</span></span><DropPanel items={stats.map(s => ({value: s, label: s, color: stC[s]}))} current={todo.st} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{...S.dot(it.color!), width:8, height:8}}/>{it.label}</>}/></td>;
    if (field === "repeat") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={REPEAT_OPTS.map(r => ({value: r, label: r}))} current={todo.repeat || "없음"} onSelect={v => save(v)} onClose={stop} alignRight/></td>;
    return <td style={S.tdc}>{children}</td>;
  };

  return <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
    <Sidebar
      search={search} setSearch={setSearch} filters={filters} togF={togF}
      todos={todos} aProj={aProj} members={members} pris={pris} priC={priC}
      stats={stats} stC={stC} favSidebar={favSidebar} togFavSidebar={togFavSidebar}
      isFav={isFav} gPr={gPr} setChipAdd={setChipAdd} setChipVal={setChipVal}
      setChipColor={setChipColor} projects={projects}
      hiddenProjects={hiddenProjects} toggleHideProject={toggleHideProject}
      hiddenMembers={hiddenMembers} toggleHideMember={toggleHideMember}
    />

    <div style={{flex:1,minWidth:0}}>
    <div ref={addSecRef} style={{overflow:"hidden"}}>
    <AddTodoSection
      addTab={addTab} setAddTab={setAddTab} newRows={newRows} setNewRows={setNewRows}
      addNR={addNR} saveNRs={saveNRs} saveOneNR={saveOneNR} isNREmpty={isNREmpty}
      aProj={visibleProj} members={visibleMembers} pris={pris} setNotePopup={setNotePopup}
      setNrDatePop={setNrDatePop} aiText={aiText} setAiText={setAiText}
      aiFiles={aiFiles} setAiFiles={setAiFiles}
      aiLoad={aiLoad} aiSt={aiSt} setAiSt={setAiSt} aiParsed={aiParsed}
      setAiParsed={setAiParsed} parseAI={parseAI} confirmAI={confirmAI}
      priC={priC} priBg={priBg} currentUser={currentUser}
    />
    </div>

    <div style={{position:"sticky",top:94,zIndex:20,background:"#f0f4f8",paddingTop:4,paddingBottom:4,marginBottom:0}}>
    <SectionLabel num="02" title="업무 리스트" sub={`총 ${sorted.length}건${filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search?" (필터 적용 중)":""}`}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {todoView==="memo"&&<div style={{display:"flex",gap:3}}>
          {([1,2,3,4,5] as const).map(n=>(
            <button key={n} onClick={()=>setMemoCols(n)}
              style={{padding:"5px 12px",borderRadius:6,border:`1.5px solid ${memoCols===n?"#2563eb":"#e2e8f0"}`,background:memoCols===n?"#2563eb":"#fff",color:memoCols===n?"#fff":"#64748b",fontSize:13,fontWeight:memoCols===n?700:500,cursor:"pointer"}}>
              {n}
            </button>))}
        </div>}
        <div style={{display:"flex",border:"1.5px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
          {([["list","☰ 리스트"],["memo","📋 메모"]] as [string,string][]).map(([v,label])=>
            <button key={v} onClick={()=>setTodoView(v as "list"|"memo")} style={{fontSize:11,padding:"4px 12px",border:"none",borderRight:v==="list"?"1.5px solid #e2e8f0":"none",background:todoView===v?"#2563eb":"#fff",color:todoView===v?"#fff":"#64748b",cursor:"pointer",fontWeight:todoView===v?700:400,transition:"all .15s"}}>
              {label}
            </button>)}
        </div>
      </div>
    </SectionLabel>
    {/* 공통 필터 칩 */}
    {(filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||search)?<div style={{display:"flex",flexWrap:"wrap" as const,alignItems:"center",gap:6,padding:"8px 12px",marginBottom:8,borderRadius:8,background:"#f0f7ff",border:"1px solid #dbeafe"}}>
      <span style={{fontSize:11,color:"#64748b",fontWeight:600,flexShrink:0}}>적용된 필터</span>
      {search&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#dbeafe",color:"#1d4ed8",border:"1px solid #bfdbfe"}}>🔍 "{search}" <button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#1d4ed8",padding:0,fontSize:12,lineHeight:1}}>×</button></span>}
      {filters.proj.map((v: string)=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#ede9fe",color:"#6d28d9",border:"1px solid #ddd6fe"}}>📁 {v==="__none__"?"미배정":aProj.find(p=>String(p.id)===v)?.name||v} <button onClick={()=>togF("proj",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#6d28d9",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
      {filters.who.map((v: string)=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#fce7f3",color:"#9d174d",border:"1px solid #fbcfe8"}}>👤 {v} <button onClick={()=>togF("who",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#9d174d",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
      {filters.pri.map((v: string)=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:priBg[v],color:priC[v],border:`1px solid ${priC[v]}44`}}>● {v} <button onClick={()=>togF("pri",v)} style={{background:"none",border:"none",cursor:"pointer",color:priC[v],padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
      {filters.st.map((v: string)=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:stBg[v],color:stC[v],border:`1px solid ${stC[v]}44`}}>{v} <button onClick={()=>togF("st",v)} style={{background:"none",border:"none",cursor:"pointer",color:stC[v],padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
      {filters.repeat.map((v: string)=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}}>🔁 {v} <button onClick={()=>togF("repeat",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#15803d",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
      <button onClick={()=>{setSearch("");setFilters({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});}} style={{marginLeft:"auto",fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",padding:"2px 6px",borderRadius:4}}>전체 초기화</button>
    </div>:null}
    </div>

    {/* 공통 헤더 바: 건수 + 정렬 */}
    {sorted.length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderRadius:8,background:"#fafbfc",border:"1px solid #f1f5f9",marginBottom:8}}>
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
        {todoView==="list"&&<>
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
        </>}
      </div>
    </div>}

    {todoView==="memo"&&<MemoView sorted={sorted} showDone={showDone} setShowDone={setShowDone} gPr={gPr} aProj={visibleProj} members={visibleMembers} pris={pris} stats={stats} priC={priC} priBg={priBg} stC={stC} stBg={stBg} updTodo={updTodo} addTodo={addTodo} currentUser={currentUser} delTodo={delTodo} isFav={isFav} toggleFav={toggleFav} flash={flash} cols={memoCols}/>}
    {todoView==="list"&&sorted.length===0&&(()=>{
      // 필터/검색이 적용된 경우와 아닌 경우를 구분해 다른 안내 메시지와 CTA를 표시
      const hasFilter = filters.proj.length||filters.who.length||filters.pri.length||filters.st.length||filters.repeat.length||filters.fav||search;
      return <div style={{...S.card,padding:"52px 20px",textAlign:"center" as const}}>
        <div style={{fontSize:40,marginBottom:14}}>{hasFilter?"🔍":"📭"}</div>
        <div style={{fontSize:15,fontWeight:700,color:"#475569",marginBottom:8}}>
          {hasFilter?"검색 결과가 없습니다":"아직 업무가 없습니다"}
        </div>
        <div style={{fontSize:12,color:"#94a3b8",marginBottom:24}}>
          {hasFilter?"다른 검색어나 필터를 시도해보세요":"팀과 함께할 첫 번째 업무를 추가해보세요"}
        </div>
        {hasFilter
          // 필터 있을 때: 초기화 버튼
          ? <button
              onClick={()=>{setSearch("");setFilters({proj:[],who:[],pri:[],st:[],repeat:[],fav:""});}}
              style={{padding:"9px 22px",borderRadius:8,border:"none",background:"#2563eb",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              필터 초기화
            </button>
          // 필터 없을 때: 업무 추가 직접 입력 탭으로 이동
          : <button
              onClick={()=>setAddTab("direct")}
              style={{padding:"9px 22px",borderRadius:8,border:"none",background:"#2563eb",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              + 첫 업무 추가하기
            </button>
        }
      </div>;
    })()}
    {todoView==="list"&&sorted.length>0&&<div style={{...S.card,padding:0,overflow:"hidden"}}>
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
              <col style={{width:"30%"}}/>
              <col style={{width:"41%"}}/>
              <col style={{width:"11%"}}/>
              <col style={{width:"13%"}}/>
              <col style={{width:"5%"}}/>
            </>:<>
              <col style={{width:"32%"}}/>
              <col style={{width:"22%"}}/>
              <col style={{width:"10%"}}/>
              <col style={{width:"12%"}}/>
              <col style={{width:"10%"}}/>
              <col style={{width:"10%"}}/>
              <col style={{width:"4%"}}/>
            </>}
          </colgroup>
          <thead><tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
            {((expandMode
              ?[["task","업무내용"],["det","상세내용"],["who","담당자"],["due","마감기한"]]
              :[["task","업무내용"],["det","상세내용"],["who","담당자"],["due","마감기한"],["pri","우선순위"],["st","상태"]]
             ) as [string,string][]).map(([col,label])=>
              <th key={col} style={{...S.th,cursor:"pointer",userSelect:"none" as const}} onClick={()=>toggleSort(col)}>
                <span style={{display:"inline-flex",alignItems:"center",gap:3}}>{label}<span style={{fontSize:8,color:sortCol===col?"#2563eb":"#c0c8d4"}}>{sortIcon(col)}</span></span>
              </th>)}
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
            {sorted.filter(t=>t.st!=="완료").map((t,idx,arr)=>{const od=isOD(t.due,t.st);
              const plain=stripHtml(t.det||"");
              const isUrgent=t.pri==="긴급";const isHigh=t.pri==="높음";const isLow=t.pri==="낮음";
              const isSel=selectedIds.has(t.id);
              const prevIsSel=isSel&&idx>0&&selectedIds.has(arr[idx-1].id);
              const nextIsSel=isSel&&idx<arr.length-1&&selectedIds.has(arr[idx+1].id);
              const selShadow=["inset 2px 0 0 #2563eb","inset -2px 0 0 #2563eb",...(!prevIsSel?["inset 0 2px 0 #2563eb"]:[]),...(!nextIsSel?["inset 0 -2px 0 #2563eb"]:[])].join(",");
              const rowBg=isUrgent?"#fff8f8":isHigh?"#fffdf5":"#fff";
              const rowBorder=isUrgent?"1px solid #fecaca":isHigh?"1px solid #fde68a":"1px solid #f1f5f9";
              const taskColor=isUrgent?"#b91c1c":isHigh?"#92400e":isLow?"#94a3b8":"#0f172a";
              const taskWeight=isUrgent?800:isHigh?700:isLow?400:600;
              const bg=isSel?(isUrgent?"#fee2e2":"#dbeafe"):hoverRow===t.id?(isUrgent?"#fff0f0":isHigh?"#fffbee":"#f0f7ff"):rowBg;
              return <tr key={t.id}
                onMouseEnter={e=>{clearTimeout(hoverLeaveTimer.current);setHoverRow(t.id);const r=(e.currentTarget as HTMLTableRowElement).getBoundingClientRect();setHoverRowRect({top:r.top,height:r.height});}}
                onMouseLeave={()=>{hoverLeaveTimer.current=setTimeout(()=>{setHoverRow(null);setHoverRowRect(null);},80);}}
                style={{borderBottom:rowBorder,background:bg,...(isSel?{boxShadow:selShadow}:isUrgent?{boxShadow:"inset 3px 0 0 #dc2626"}:isHigh?{boxShadow:"inset 3px 0 0 #d97706"}:{})}}>
                <td style={{...S.tdc,overflow:"visible",...(expandMode?{whiteSpace:"normal" as const,verticalAlign:"top" as const}:{})}}>
                  <div style={{display:"flex",alignItems:expandMode?"flex-start":"center",gap:12}}>
                    {/* 즐겨찾기 버튼: 행 안에 항상 표시 */}
                    <button onClick={e=>{e.stopPropagation();toggleFav(t.id);}} title={isFav(t.id)?"즐겨찾기 해제":"즐겨찾기"}
                      style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"0 2px",lineHeight:1,color:isFav(t.id)?"#f59e0b":"#d1d5db",transition:"color .15s",flexShrink:0}}
                      onMouseEnter={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#fbbf24";}}
                      onMouseLeave={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#d1d5db";}}>{isFav(t.id)?"★":"☆"}</button>
                    <button onClick={e=>{e.stopPropagation();updTodo(t.id,{st:"완료"});flash("업무가 완료 처리되었습니다");}}
                      style={{width:17,height:17,borderRadius:"50%",border:"2px solid #94a3b8",background:"#fff",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#16a34a";e.currentTarget.style.background="#f0fdf4";(e.currentTarget.querySelector("svg") as HTMLElement).style.opacity="1";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#94a3b8";e.currentTarget.style.background="#fff";(e.currentTarget.querySelector("svg") as HTMLElement).style.opacity="0";}}>
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{opacity:0,transition:"opacity .15s",pointerEvents:"none"}}><path d="M1 3.5L3.5 6L8 1" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div style={{display:"flex",flexDirection:"column" as const,gap:2,minWidth:0}}>
                      {editCell?.id===t.id&&editCell?.field==="task"
                        ?<input autoFocus defaultValue={t.task} style={S.iinp}
                           onKeyDown={e=>{if((e as any).key==="Enter"){updTodo(t.id,{task:(e.target as HTMLInputElement).value});setEditCell(null);}if((e as any).key==="Escape")setEditCell(null);}}
                           onBlur={e=>{updTodo(t.id,{task:e.target.value});setEditCell(null);}}/>
                        :<div style={{display:"flex",alignItems:expandMode?"flex-start":"center",gap:3,minWidth:0}}>
                           <span style={{fontWeight:taskWeight,color:taskColor,cursor:"pointer",fontSize:14,...(expandMode?{wordBreak:"break-word" as const}:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,minWidth:0})}} onClick={()=>setEditCell({id:t.id,field:"task"})}>{t.task}</span>
                           <RepeatBadge repeat={t.repeat}/>
                           {od&&<span style={{color:"#dc2626",fontSize:9}}>⚠️</span>}
                         </div>}
                      {!filters.proj.length&&(()=>{const p=gPr(t.pid);return p.id?<span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:99,background:p.color+"18",color:p.color,border:`1px solid ${p.color}33`,whiteSpace:"nowrap" as const,alignSelf:"flex-start" as const,display:"inline-block"}}>{p.name}</span>:null;})()}
                    </div>
                  </div>
                </td>
                <td style={{...S.tdc,maxWidth:0,...(expandMode?{whiteSpace:"normal" as const,verticalAlign:"top" as const,cursor:"text",wordBreak:"break-word" as const}:{})}}
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
                <CellEdit todo={t} field="who"><div style={{display:"flex",alignItems:"center",gap:6,...(expandMode?{alignSelf:"flex-start" as const}:{})}}><span style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(t.who)},${avColor2(t.who)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}} title={t.who}>{avInitials(t.who)}</span><span style={{fontSize:13}}>{t.who}</span></div></CellEdit>
                <CellEdit todo={t} field="due">{(()=>{const[dpart,tpart]=(t.due||"").split(" ");const fmt12v=(v: string)=>{if(!v)return "";const[hh,mm]=v.split(":").map(Number);const ap=hh<12?"오전":"오후";const h12=hh===0?12:hh>12?hh-12:hh;return `${ap} ${h12}:${fmt2(mm)}`;};const dd=dDay(t.due,t.st);return <div style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:2}}>
                  <span style={{fontSize:13,color:od?"#dc2626":"#64748b"}}>{dpart?`${dpart}(${fDow(dpart)})`:"—"}</span>
                  {tpart&&<span style={{fontSize:13,color:od?"#dc2626":"#94a3b8",fontWeight:400}}>{fmt12v(tpart)}</span>}
                  {dd&&<span style={{fontSize:10,fontWeight:700,color:dd.color,background:dd.bg,border:`1px solid ${dd.border}`,padding:"1px 6px",borderRadius:4,letterSpacing:"0.02em"}}>{dd.label}</span>}
                </div>;})()}</CellEdit>
                {!expandMode&&<>
                  <CellEdit todo={t} field="pri"><span style={{...S.badge(priBg[t.pri],priC[t.pri],`1px solid ${priC[t.pri]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}><span>●</span>{t.pri}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                  <CellEdit todo={t} field="st"><span style={{...S.badge(stBg[t.st],stC[t.st],`1px solid ${stC[t.st]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}>{t.st}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                </>}
                <td style={{...S.tdc,padding:"0 6px",textAlign:"center" as const,verticalAlign:"middle" as const}} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,(e as any).shiftKey);}}
                    style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                </td>
              </tr>})}
            {sorted.filter(t=>t.st==="완료").length>0&&<tr>
              <td colSpan={99} style={{padding:"6px 12px",background:"#f0fdf4",borderTop:"2px solid #bbf7d0",cursor:"pointer"}} onClick={()=>setShowDone(p=>!p)}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>✓ 완료됨</span>
                  <span style={{fontSize:10,color:"#86efac"}}>{sorted.filter(t=>t.st==="완료").length}건</span>
                  <span style={{fontSize:10,color:"#4ade80",marginLeft:"auto"}}>{showDone?"접기":"펼치기"}</span>
                </div>
              </td>
            </tr>}
            {showDone&&sorted.filter(t=>t.st==="완료").map(t=>{const plain=stripHtml(t.det||"");
              return <tr key={t.id} style={{borderBottom:"1px solid #f1f5f9",background:"#fafafa",opacity:.72}}
                onMouseEnter={e=>{clearTimeout(hoverLeaveTimer.current);setHoverRow(t.id);const r=(e.currentTarget as HTMLTableRowElement).getBoundingClientRect();setHoverRowRect({top:r.top,height:r.height});}}
                onMouseLeave={()=>{hoverLeaveTimer.current=setTimeout(()=>{setHoverRow(null);setHoverRowRect(null);},80);}}>

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
                <td style={S.tdc}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${avColor(t.who)},${avColor2(t.who)})`,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,letterSpacing:"-0.5px",opacity:.5}} title={t.who}>{avInitials(t.who)}</span><span style={{fontSize:13,color:"#94a3b8"}}>{t.who}</span></div></td>
                <td style={S.tdc}><span style={{fontSize:13,color:"#94a3b8",textDecoration:"line-through"}}>{t.due}</span></td>
                {!expandMode&&<>
                  <td style={S.tdc}><span style={{...S.badge("#f1f5f9","#94a3b8")}}>{t.pri}</span></td>
                  <td style={S.tdc}><span style={{...S.badge(stBg[t.st],stC[t.st])}}>{t.st}</span></td>
                </>}
                <td style={{...S.tdc,padding:"0 6px",textAlign:"center" as const}} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,(e as any).shiftKey);}}
                    style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                </td>
              </tr>})}
          </tbody>
        </table>
      </div>
    </div>}
    </div>

    {/* ── 리스트 hover 플로팅 액션 버튼 ───────────────────────── */}
    {hoverRow&&hoverRowRect&&(()=>{
      const t=sorted.find(x=>x.id===hoverRow);
      if(!t) return null;
      const isDone=t.st==="완료";
      const tblRight=tblDivRef.current?tblDivRef.current.getBoundingClientRect().right:window.innerWidth-16;
      return <div
        style={{position:"fixed",top:hoverRowRect.top,left:tblRight+8,height:hoverRowRect.height,
          display:"flex",alignItems:"center",gap:4,zIndex:500,
          background:"#fff",borderRadius:8,boxShadow:"0 2px 10px rgba(0,0,0,.14)",
          border:"1px solid #e2e8f0",padding:"0 8px",pointerEvents:"auto"}}
        onMouseEnter={()=>clearTimeout(hoverLeaveTimer.current)}
        onMouseLeave={()=>{hoverLeaveTimer.current=setTimeout(()=>{setHoverRow(null);setHoverRowRect(null);},80);}}>
        {!isDone&&<button onClick={()=>setEditMod(t)}
          style={{background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:11,color:"#475569",borderRadius:5,padding:"3px 7px"}}>✏️</button>}
        <button onClick={e=>{e.stopPropagation();if(confirm(`"${t.task}" 업무를 삭제하시겠습니까?`)){delTodo(t.id);setHoverRow(null);setHoverRowRect(null);}}}
          style={{background:"#fee2e2",border:"none",cursor:"pointer",fontSize:11,color:"#dc2626",borderRadius:5,padding:"3px 7px",fontWeight:700}}>🗑️</button>
      </div>;
    })()}
  </div>;
}
