import { useRef, useEffect } from "react";
import { useTodoApp } from "./hooks/useTodoApp";
import { S } from "./styles";
import { isOD, dDay, fD, fDow, fmt2, stripHtml, dateStr } from "./utils";
import { REPEAT_OPTS, AVATAR_COLORS } from "./constants";

import { Toast } from "./components/ui/Toast";
import { Modal } from "./components/ui/Modal";
import { Chip } from "./components/ui/Chip";
import { DropPanel } from "./components/ui/DropPanel";
import { ProgressBar } from "./components/ui/ProgressBar";
import { RepeatBadge } from "./components/ui/RepeatBadge";
import { SectionLabel } from "./components/ui/SectionLabel";

import { DateTimePicker } from "./components/editor/DateTimePicker";
import { NotePopup } from "./components/editor/NotePopup";
import { CellRichPopup } from "./components/editor/CellRichPopup";

import { Sidebar } from "./components/sidebar/Sidebar";
import { AddTodoSection } from "./components/todo/AddTodoSection";
import { MemoView } from "./components/todo/MemoView";
import { EditForm } from "./components/todo/EditForm";
import { DetailView } from "./components/todo/DetailView";
import { Dashboard } from "./components/dashboard/Dashboard";
import { MultiMonthView } from "./components/calendar/MultiMonthView";
import { ProjMgr } from "./components/settings/ProjMgr";
import { SettingsMgr } from "./components/settings/SettingsMgr";

function LoginScreen({members,onLogin}: {members: string[], onLogin: (name: string) => void}) {
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

export default function App() {
  const app = useTodoApp();
  const {
    projects, setProjects, todos, setTodos, nId, setNId, pNId, setPNId,
    members, setMembers, pris, setPris, stats, setStats,
    priC, setPriC, priBg, setPriBg, stC, setStC, stBg, setStBg,
    view, setView, toast, filters, setFilters, favSidebar, togFavSidebar,
    search, setSearch, editCell, setEditCell, sortCol, sortDir,
    newRows, setNewRows, kbF, setKbF, kbFWho, setKbFWho,
    dragId, setDragId, dragOver, setDragOver,
    calF, setCalF, calFWho, setCalFWho, calY, calM, calD,
    calView, setCalView, customDays, setCustomDays,
    editMod, setEditMod, detMod, setDetMod, projMod, setProjMod, settMod, setSettMod,
    chipAdd, setChipAdd, chipVal, setChipVal, chipColor, setChipColor,
    aiText, setAiText, aiLoad, aiSt, setAiSt, apiKey, setApiKey,
    aiParsed, setAiParsed, addTab, setAddTab,
    detPopup, setDetPopup, notePopup, setNotePopup,
    datePop, setDatePop, nrDatePop, setNrDatePop,
    hoverRow, setHoverRow, currentUser, setCurrentUser,
    userFavs, isFav, toggleFav,
    expandMode, setExpandMode, todoView, setTodoView, showDone, setShowDone, memoCols, setMemoCols,
    selectedIds, lastSelRef, addSecRef, tblDivRef,
    clrSel, movePop, setMovePop,
    historyRef, redoRef,
    aProj, gPr, filtered, sorted, sortIcon,
    visibleTodoIds, allVisibleSelected, someVisibleSelected,
    ftodosExpanded, calRangeDs, todayStr, calDays,
    undo, redo, flash, updTodo, addTodo, delTodo,
    toggleSort, togF, handleCheck, toggleSelectAll,
    calDate, setCalDate, calToday, calNav, calTitle, weekDates, customDates, agendaItems, evStyle,
    saveMod, addNR, isNREmpty, saveOneNR, saveNRs,
    parseAI, confirmAI, addChip,
  } = app;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (todoView !== "memo") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 5) setMemoCols(n);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [todoView, setMemoCols]);

  if (!currentUser) return <LoginScreen members={members} onLogin={name => setCurrentUser(name)}/>;

  const CellEdit = ({todo, field, children}: {todo: any, field: string, children: React.ReactNode}) => {
    const isE = editCell?.id === todo.id && editCell?.field === field;
    const stop = () => setEditCell(null);
    const start = () => setEditCell({id: todo.id, field});
    const save = (val: string) => { updTodo(todo.id, {[field]: field === "pid" ? parseInt(val) : val}); stop(); };
    if (!isE) return <td style={S.tdc} onClick={e => { if (field === "due") { const r = e.currentTarget.getBoundingClientRect(); setDatePop({id: todo.id, rect: r, value: todo.due || ""}); } start(); }}>{children}</td>;
    if (field === "task") return <td style={{...S.tdc, overflow:"visible"}}><input autoFocus defaultValue={todo.task} style={S.iinp} onKeyDown={e => { if ((e as any).key === "Enter") save((e.target as HTMLInputElement).value); if ((e as any).key === "Escape") stop(); }} onBlur={e => save(e.target.value)}/></td>;
    if (field === "due") return <td style={{...S.tdc, background:"#eff6ff"}}>{children}</td>;
    if (field === "pid") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={aProj.map(p => ({value: String(p.id), label: p.name, color: p.color}))} current={String(todo.pid)} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={S.dot(it.color!)}/>{it.label}</>}/></td>;
    if (field === "who") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={members.map(m => ({value: m, label: m}))} current={todo.who} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{width:16,height:16,borderRadius:"50%",background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700}}>{it.label[0]}</span>{it.label}</>}/></td>;
    if (field === "pri") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><span style={{...S.badge(priBg[todo.pri], priC[todo.pri], `1px solid ${priC[todo.pri]}55`), display:"inline-flex", alignItems:"center", gap:3, opacity:.85}}><span>●</span>{todo.pri}<span style={{fontSize:8,opacity:.6}}>▾</span></span><DropPanel items={pris.map(p => ({value: p, label: p, color: priC[p]}))} current={todo.pri} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{...S.dot(it.color!), width:8, height:8}}/>{it.label}</>}/></td>;
    if (field === "st") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><span style={{...S.badge(stBg[todo.st], stC[todo.st], `1px solid ${stC[todo.st]}55`), display:"inline-flex", alignItems:"center", gap:3, opacity:.85}}>{todo.st}<span style={{fontSize:8,opacity:.6}}>▾</span></span><DropPanel items={stats.map(s => ({value: s, label: s, color: stC[s]}))} current={todo.st} onSelect={v => save(v)} onClose={stop} renderItem={it => <><span style={{...S.dot(it.color!), width:8, height:8}}/>{it.label}</>}/></td>;
    if (field === "repeat") return <td style={{...S.tdc, overflow:"visible", position:"relative"}}><DropPanel items={REPEAT_OPTS.map(r => ({value: r, label: r}))} current={todo.repeat || "없음"} onSelect={v => save(v)} onClose={stop} alignRight/></td>;
    return <td style={S.tdc}>{children}</td>;
  };

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
        <Sidebar
          search={search} setSearch={setSearch} filters={filters} togF={togF}
          todos={todos} aProj={aProj} members={members} pris={pris} priC={priC}
          stats={stats} stC={stC} favSidebar={favSidebar} togFavSidebar={togFavSidebar}
          isFav={isFav} gPr={gPr} setChipAdd={setChipAdd} setChipVal={setChipVal}
          setChipColor={setChipColor} projects={projects}
        />

        <div style={{flex:1,minWidth:0}}>
        <div ref={addSecRef} style={{overflow:"hidden"}}>
        <AddTodoSection
          addTab={addTab} setAddTab={setAddTab} newRows={newRows} setNewRows={setNewRows}
          addNR={addNR} saveNRs={saveNRs} saveOneNR={saveOneNR} isNREmpty={isNREmpty}
          aProj={aProj} members={members} pris={pris} setNotePopup={setNotePopup}
          setNrDatePop={setNrDatePop} aiText={aiText} setAiText={setAiText}
          aiLoad={aiLoad} aiSt={aiSt} setAiSt={setAiSt} aiParsed={aiParsed}
          setAiParsed={setAiParsed} parseAI={parseAI} confirmAI={confirmAI}
          priC={priC} priBg={priBg} sorted={sorted} filters={filters}
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
          {filters.proj.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#ede9fe",color:"#6d28d9",border:"1px solid #ddd6fe"}}>📁 {v==="__none__"?"미배정":aProj.find(p=>String(p.id)===v)?.name||v} <button onClick={()=>togF("proj",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#6d28d9",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          {filters.who.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#fce7f3",color:"#9d174d",border:"1px solid #fbcfe8"}}>👤 {v} <button onClick={()=>togF("who",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#9d174d",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          {filters.pri.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:priBg[v],color:priC[v],border:`1px solid ${priC[v]}44`}}>● {v} <button onClick={()=>togF("pri",v)} style={{background:"none",border:"none",cursor:"pointer",color:priC[v],padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          {filters.st.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:stBg[v],color:stC[v],border:`1px solid ${stC[v]}44`}}>{v} <button onClick={()=>togF("st",v)} style={{background:"none",border:"none",cursor:"pointer",color:stC[v],padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
          {filters.repeat.map(v=><span key={v} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}}>🔁 {v} <button onClick={()=>togF("repeat",v)} style={{background:"none",border:"none",cursor:"pointer",color:"#15803d",padding:0,fontSize:12,lineHeight:1}}>×</button></span>)}
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

        {todoView==="memo"&&<MemoView sorted={sorted} showDone={showDone} setShowDone={setShowDone} gPr={gPr} aProj={aProj} members={members} pris={pris} stats={stats} priC={priC} priBg={priBg} stC={stC} stBg={stBg} updTodo={updTodo} addTodo={addTodo} currentUser={currentUser} delTodo={delTodo} isFav={isFav} toggleFav={toggleFav} flash={flash} cols={memoCols}/>}
        {todoView==="list"&&sorted.length===0&&<div style={{...S.card,padding:"36px 20px",textAlign:"center" as const,color:"#94a3b8"}}><div style={{fontSize:28,marginBottom:6}}>📭</div><div style={{fontSize:13,fontWeight:600}}>업무가 없습니다</div></div>}
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
                  <col style={{width:"25%"}}/>
                  <col style={{width:"37%"}}/>
                  <col style={{width:"10%"}}/>
                  <col style={{width:"11%"}}/>
                  <col style={{width:"12%"}}/>
                  <col style={{width:"5%"}}/>
                </>:<>
                  <col style={{width:"27%"}}/>
                  <col style={{width:"19%"}}/>
                  <col style={{width:"9%"}}/>
                  <col style={{width:"11%"}}/>
                  <col style={{width:"9%"}}/>
                  <col style={{width:"9%"}}/>
                  <col style={{width:"12%"}}/>
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
                    <td style={{...S.tdc,overflow:"visible",...(expandMode?{whiteSpace:"normal" as const,verticalAlign:"top" as const}:{})}}>
                      <div style={{display:"flex",alignItems:expandMode?"flex-start":"center",gap:12}}>
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
                    <CellEdit todo={t} field="who"><div style={{display:"flex",alignItems:"center",gap:4,...(expandMode?{alignSelf:"flex-start" as const}:{})}}><span style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0}}>{t.who[0]}</span><span style={{fontSize:13}}>{t.who}</span></div></CellEdit>
                    <CellEdit todo={t} field="due">{(()=>{const[dpart,tpart]=(t.due||"").split(" ");const fmt12v=(v: string)=>{if(!v)return "";const[hh,mm]=v.split(":").map(Number);const ap=hh<12?"오전":"오후";const h12=hh===0?12:hh>12?hh-12:hh;return `${ap} ${h12}:${fmt2(mm)}`;};const dd=dDay(t.due,t.st);return <div style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:2}}>
                      <span style={{fontSize:13,color:od?"#dc2626":"#64748b"}}>{dpart?`${dpart}(${fDow(dpart)})`:"—"}</span>
                      {tpart&&<span style={{fontSize:13,color:od?"#dc2626":"#94a3b8",fontWeight:400}}>{fmt12v(tpart)}</span>}
                      {dd&&<span style={{fontSize:10,fontWeight:700,color:dd.color,background:dd.bg,border:`1px solid ${dd.border}`,padding:"1px 6px",borderRadius:4,letterSpacing:"0.02em"}}>{dd.label}</span>}
                    </div>;})()}</CellEdit>
                    {!expandMode&&<>
                      <CellEdit todo={t} field="pri"><span style={{...S.badge(priBg[t.pri],priC[t.pri],`1px solid ${priC[t.pri]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}><span>●</span>{t.pri}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                      <CellEdit todo={t} field="st"><span style={{...S.badge(stBg[t.st],stC[t.st],`1px solid ${stC[t.st]}55`),display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",transition:"filter .12s"}} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter="brightness(.93)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter="none"}>{t.st}<span style={{fontSize:8,opacity:.5}}>▾</span></span></CellEdit>
                    </>}
                    <td style={{...S.tdc,padding:"4px 6px",verticalAlign:"middle" as const}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:3,justifyContent:"center",alignItems:"center",opacity:1}}>
                        <button onClick={()=>toggleFav(t.id)} title={isFav(t.id)?"즐겨찾기 해제":"즐겨찾기"} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"2px 3px",lineHeight:1,color:isFav(t.id)?"#f59e0b":"#d1d5db",transition:"color .15s",flexShrink:0}} onMouseEnter={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#fbbf24";}} onMouseLeave={e=>{if(!isFav(t.id))(e.currentTarget as HTMLButtonElement).style.color="#d1d5db";}}>{isFav(t.id)?"★":"☆"}</button>
                        <button onClick={()=>setEditMod(t)} style={{background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:10,color:"#475569",borderRadius:5,padding:"3px 6px"}}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();delTodo(t.id)}} style={{background:"#fee2e2",border:"none",cursor:"pointer",fontSize:10,color:"#dc2626",borderRadius:5,padding:"3px 6px",fontWeight:700}}>🗑️</button>
                      </div>
                    </td>
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
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={()=>{}} onClick={(e)=>{e.stopPropagation();handleCheck(t.id,(e as any).shiftKey);}}
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
              <button key={k} onClick={()=>setCalView(k as string)} style={{padding:"5px 10px",borderRadius:6,border:`1.5px solid ${calView===k?"#2563eb":"#e2e8f0"}`,background:calView===k?"#2563eb":"#fff",color:calView===k?"#fff":"#64748b",fontSize:11,fontWeight:calView===k?600:500,cursor:"pointer"}}>
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
                {item.todos.map((t: any,ii: number)=>{const p=gPr(t.pid);const od=isOD(t.due,t.st);
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

    {selectedIds.size>0&&<div onClick={()=>setMovePop(false)} style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",zIndex:2000,display:"flex",alignItems:"center",gap:2,background:"#1e293b",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.35)",padding:"8px 10px 8px 14px",animation:"slideUp .2s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"#2563eb",color:"#fff",fontSize:11,fontWeight:800,marginRight:8,flexShrink:0}}>{selectedIds.size}</div>
      {[
        {label:"복제하기",icon:"⧉",fn:()=>{const base=Math.max(...todos.map(t=>t.id),0);let i=1;const copies=todos.filter(t=>selectedIds.has(t.id)).map(t=>({...t,id:base+i++,task:t.task+" (복사)",cre:todayStr,done:null}));setTodos((p: any)=>[...p,...copies]);setNId((n: number)=>n+copies.length);clrSel();flash(`${copies.length}건이 복제되었습니다`)}},
        {label:"완료 표시",icon:"✓",fn:()=>{selectedIds.forEach(id=>updTodo(id,{st:"완료",done:todayStr,progress:100}));flash(`${selectedIds.size}건이 완료 처리되었습니다`);clrSel()}},
        {label:"삭제",icon:"🗑",fn:()=>{if(!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`))return;setTodos((p: any)=>p.filter((t: any)=>!selectedIds.has(t.id)));flash(`${selectedIds.size}건이 삭제되었습니다`,"err");clrSel()},danger:true},
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
          {aProj.map(p=><button key={p.id} onClick={()=>{setTodos((prev: any)=>prev.map((t: any)=>selectedIds.has(t.id)?{...t,pid:p.id}:t));flash(`${selectedIds.size}건이 "${p.name}" 프로젝트로 이동되었습니다`);setMovePop(false);clrSel();}}
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
        onAdd={p=>{const np={...p,id:pNId};setProjects((prev: any)=>[...prev,np]);setPNId(pNId+1);flash(`"${p.name}" 프로젝트가 추가되었습니다`)}}
        onDel={id=>{if(todos.some(t=>t.pid===id)){alert("해당 프로젝트에 업무가 존재하여 삭제할 수 없습니다.");return;}setProjects((p: any)=>p.filter((x: any)=>x.id!==id));flash("프로젝트가 삭제되었습니다","err")}}
        onEdit={(id,u)=>{setProjects((p: any)=>p.map((x: any)=>{if(x.id!==id)return x;return{...x,...u};}));flash("프로젝트 정보가 수정되었습니다")}}/>
    </Modal>

    <Modal open={settMod} onClose={()=>setSettMod(false)} title="⚙️ 설정" footer={<button style={S.bs} onClick={()=>setSettMod(false)}>닫기</button>}>
      <SettingsMgr members={members} setMembers={setMembers} pris={pris} setPris={setPris} stats={stats} setStats={setStats} priC={priC} setPriC={setPriC} priBg={priBg} setPriBg={setPriBg} stC={stC} setStC={setStC} stBg={stBg} setStBg={setStBg} todos={todos} flash={flash} apiKey={apiKey} setApiKey={setApiKey}/>
    </Modal>

    {chipAdd&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setChipAdd(null)}}>
      <div style={{background:"#fff",borderRadius:12,padding:20,width:320,boxShadow:"0 10px 25px rgba(0,0,0,.15)"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{({proj:"📁 프로젝트",who:"👤 담당자",pri:"🔥 우선순위",st:"📋 상태"} as any)[chipAdd]} 추가</div>
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
      onSave={text=>{if(notePopup._newRow!=null){const n=[...newRows];n[notePopup._newRow!].det=text;setNewRows(n);}else{updTodo(notePopup.todo.id,{det:text});}}}
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
