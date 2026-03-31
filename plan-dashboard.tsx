import { useState, useEffect, useRef } from "react";

// ── 타입 ──────────────────────────────────────────────────────
type Cat = "bug" | "ux" | "feature" | "tech";
type Pri = "high" | "medium" | "low";
type St  = "todo" | "inprogress" | "done" | "hold";

interface Item {
  id: string;
  cat: Cat;
  title: string;
  desc: string;
  priority: Pri;
  status: St;
  note?: string;
  updatedAt?: string;
}

// ── 초기 데이터 ───────────────────────────────────────────────
const INIT: Item[] = [
  { id:"B-1", cat:"bug",     priority:"high",   status:"todo", title:"완료 항목 행 컬럼 불일치",        desc:"완료 행 구분선 colSpan={10}인데 실제 열은 11개 — 진행률 컬럼 추가 후 미반영" },
  { id:"B-2", cat:"bug",     priority:"high",   status:"todo", title:"완료 항목 진행률 컬럼 누락",      desc:"완료 행 JSX에서 progress 셀이 생략됨" },
  { id:"B-3", cat:"bug",     priority:"medium", status:"todo", title:"NotePopup 스크롤 위치 틀어짐",    desc:"페이지 스크롤 후 클릭하면 팝업 위치가 어긋남" },
  { id:"U-1", cat:"ux",      priority:"high",   status:"todo", title:"캘린더 날짜 클릭 → 업무 추가",    desc:"날짜 클릭 시 해당 마감일로 추가 모달 열기" },
  { id:"U-2", cat:"ux",      priority:"medium", status:"todo", title:"칸반 카드 인라인 편집",           desc:"칸반 상세 모달에서 읽기 전용 → 직접 편집 가능" },
  { id:"U-3", cat:"ux",      priority:"low",    status:"todo", title:"리스트 행 드래그 순서 변경",       desc:"드래그로 행 순서 재정렬 기능 추가" },
  { id:"U-4", cat:"ux",      priority:"low",    status:"todo", title:"반응형 레이아웃",                 desc:"모바일·좁은 화면 대응 (900px 이하 현재 가로 스크롤만)" },
  { id:"F-1", cat:"feature", priority:"high",   status:"todo", title:"엑셀/CSV 내보내기",               desc:"현재 필터 적용된 목록을 파일로 다운로드" },
  { id:"F-2", cat:"feature", priority:"medium", status:"todo", title:"마감 임박 알림 뱃지",             desc:"헤더에 D-3 이내 업무 카운트 노출" },
  { id:"F-3", cat:"feature", priority:"medium", status:"todo", title:"담당자별 업무량 차트",            desc:"대시보드에 per-person 로드 시각화" },
  { id:"F-4", cat:"feature", priority:"low",    status:"todo", title:"업무 간 의존성 (선후행)",         desc:"A 완료 후 B 시작 연결 기능" },
  { id:"F-5", cat:"feature", priority:"medium", status:"todo", title:"비활성 프로젝트 아카이브 뷰",     desc:"비활성 프로젝트의 todo 별도 탭으로 분리" },
  { id:"T-1", cat:"tech",    priority:"low",    status:"todo", title:"단일 파일 컴포넌트 분리",         desc:"team-todo.tsx 1파일 ~1000줄 → 컴포넌트별 파일로 분리" },
  { id:"T-2", cat:"tech",    priority:"medium", status:"todo", title:"localStorage 버전 마이그레이션", desc:"스키마 변경 시 기존 데이터 유실 방지 로직" },
  { id:"T-3", cat:"tech",    priority:"medium", status:"todo", title:"데이터 백업/복원 UI",             desc:"설정에서 JSON export/import" },
  { id:"U-5", cat:"ux",      priority:"medium", status:"todo", title:"team-todo 모바일 UI/UX 반응형",    desc:"사이드바→바텀시트, 테이블→카드 레이아웃, 터치 최적화(44px 터치 영역, 스와이프 제스처). 현재 UI 마무리 후 진행." },
];

// ── 메타데이터 ────────────────────────────────────────────────
const CAT: Record<Cat, { emoji:string; label:string; color:string; bg:string; border:string }> = {
  bug:     { emoji:"🔴", label:"버그",        color:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
  ux:      { emoji:"🟡", label:"UX 개선",     color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
  feature: { emoji:"🟢", label:"신규 기능",   color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
  tech:    { emoji:"🔵", label:"기술 개선",   color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
};

const PRI: Record<Pri, { label:string; color:string; bg:string }> = {
  high:   { label:"긴급", color:"#dc2626", bg:"#fef2f2" },
  medium: { label:"보통", color:"#d97706", bg:"#fff7ed" },
  low:    { label:"낮음", color:"#94a3b8", bg:"#f8fafc" },
};

const STATUS: Record<St, { label:string; color:string; bg:string; next:St }> = {
  todo:       { label:"대기",   color:"#64748b", bg:"#f1f5f9", next:"inprogress" },
  inprogress: { label:"진행중", color:"#2563eb", bg:"#dbeafe", next:"done"       },
  done:       { label:"완료",   color:"#16a34a", bg:"#dcfce7", next:"hold"       },
  hold:       { label:"보류",   color:"#9333ea", bg:"#f3e8ff", next:"todo"       },
};

const ST_KEYS: St[] = ["todo","inprogress","done","hold"];
const today = new Date().toISOString().slice(0,10);

// ── 유틸 ──────────────────────────────────────────────────────
const genId = (cat:Cat, items:Item[]) => {
  const prefix = cat==="bug"?"B":cat==="ux"?"U":cat==="feature"?"F":"T";
  const nums = items.filter(i=>i.cat===cat).map(i=>parseInt(i.id.split("-")[1])||0);
  return `${prefix}-${(Math.max(0,...nums)+1)}`;
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function PlanDashboard() {
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const r = localStorage.getItem("plan-v1");
      if (r) {
        const saved: Item[] = JSON.parse(r);
        const savedIds = new Set(saved.map(i => i.id));
        const newItems = INIT.filter(i => !savedIds.has(i.id));
        return newItems.length ? [...saved, ...newItems] : saved;
      }
    } catch {}
    return INIT;
  });
  const [fCat,  setFCat]  = useState<Cat|"">("");
  const [fSt,   setFSt]   = useState<St|"">("");
  const [fPri,  setFPri]  = useState<Pri|"">("");
  const [noteId, setNoteId] = useState<string|null>(null);
  const [noteVal, setNoteVal] = useState("");
  const [addingCat, setAddingCat] = useState<Cat|null>(null);
  const [addForm, setAddForm] = useState({title:"",desc:"",priority:"medium" as Pri});
  const noteRef = useRef<HTMLInputElement>(null);
  const [autoText, setAutoText] = useState("");
  const [autoLoad, setAutoLoad] = useState(false);
  const [autoLog, setAutoLog] = useState<string[]>([]);
  const [showAuto, setShowAuto] = useState(false);
  const apiKey = "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";

  useEffect(()=>{ localStorage.setItem("plan-v1",JSON.stringify(items)); },[items]);

  useEffect(()=>{ if(noteId&&noteRef.current) noteRef.current.focus(); },[noteId]);

  const cycleStatus = (id:string) => setItems(p=>p.map(it=>
    it.id===id ? {...it, status:STATUS[it.status].next, updatedAt:today} : it
  ));

  const saveNote = (id:string) => {
    setItems(p=>p.map(it=>it.id===id?{...it,note:noteVal}:it));
    setNoteId(null);
  };

  const addItem = () => {
    if(!addForm.title.trim()||!addingCat) return;
    const newItem:Item = {
      id: genId(addingCat, items),
      cat: addingCat,
      title: addForm.title.trim(),
      desc: addForm.desc.trim(),
      priority: addForm.priority,
      status: "todo",
      updatedAt: today,
    };
    setItems(p=>[...p,newItem]);
    setAddForm({title:"",desc:"",priority:"medium"});
    setAddingCat(null);
  };

  const deleteItem = (id:string) => setItems(p=>p.filter(it=>it.id!==id));

  const autoProcess = async () => {
    if(!autoText.trim()) return;
    setAutoLoad(true);
    setAutoLog(["🔍 Claude가 내용을 분석 중..."]);
    try {
      const sysPrompt = `You are a development task parser. Return ONLY a JSON array. Each item: {"title":string,"desc":string,"category":"bug"|"ux"|"feature"|"tech","priority":"high"|"medium"|"low"}. Classify: bugs→bug, UI/UX→ux, new features→feature, code/infra improvements→tech.`;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body: JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1500,system:sysPrompt,messages:[{role:"user",content:`아래 내용을 개발 태스크로 분류해줘:\n${autoText}`}]})
      });
      if(!r.ok) throw new Error(`API ${r.status}`);
      const d = await r.json();
      const raw = d.content.map((c:any)=>c.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed: {title:string;desc:string;category:Cat;priority:Pri}[] = JSON.parse(raw);
      setAutoLog(prev=>[...prev, `✅ ${parsed.length}건 추출 완료 — 순차 등록 시작...`]);
      for(let i=0; i<parsed.length; i++) {
        await new Promise(res=>setTimeout(res,350));
        const t = parsed[i];
        const newItem: Item = {
          id: genId(t.category, items),
          cat: t.category,
          title: t.title,
          desc: t.desc,
          priority: t.priority,
          status: "todo",
          updatedAt: today,
        };
        setItems(prev=>[...prev, newItem]);
        setAutoLog(prev=>[...prev, `📝 [${i+1}/${parsed.length}] [${t.category.toUpperCase()}] "${t.title}" 등록 완료`]);
      }
      setAutoLog(prev=>[...prev, `🎉 총 ${parsed.length}건 자동 처리 완료!`]);
      setAutoText("");
    } catch(e:any) {
      setAutoLog(prev=>[...prev, `❌ 오류: ${e.message}`]);
    }
    setAutoLoad(false);
  };

  const resetToInit = () => { if(confirm("초기 데이터로 되돌리겠습니까?")) setItems(INIT); };

  // ── 집계 ──────────────────────────────────────────────────────
  const total = items.length;
  const doneCount = items.filter(i=>i.status==="done").length;
  const progress = total ? Math.round(doneCount/total*100) : 0;
  const stCounts = ST_KEYS.map(st=>({ st, count:items.filter(i=>i.status===st).length }));

  const filtered = items.filter(i=>
    (!fCat || i.cat===fCat) &&
    (!fSt  || i.status===fSt) &&
    (!fPri || i.priority===fPri)
  );

  const anyFilter = fCat||fSt||fPri;

  return (
    <div style={{fontFamily:"'Pretendard',system-ui,sans-serif",background:"#f0f4f8",minHeight:"100vh",fontSize:13,color:"#1a2332"}}>

      {/* ── 헤더 ── */}
      <header style={{background:"linear-gradient(135deg,#1e3a8a,#2563eb)",color:"#fff",padding:"0 28px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,background:"rgba(255,255,255,.18)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🗺️</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,letterSpacing:"-.3px"}}>팀 TODO — 개발 기획 대시보드</div>
            <div style={{fontSize:10,opacity:.65,marginTop:1}}>team-todo.tsx 개선 로드맵 · 기준일 {today}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>{setShowAuto(v=>!v);setAutoLog([]);}} style={{background:showAuto?"rgba(255,255,255,.3)":"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:10,padding:"4px 12px",borderRadius:14,cursor:"pointer",fontWeight:showAuto?700:400}}>🚀 자동 처리</button>
        <button onClick={resetToInit} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",color:"rgba(255,255,255,.75)",fontSize:10,padding:"4px 12px",borderRadius:14,cursor:"pointer"}}>초기화</button>
          <div style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",padding:"4px 14px",borderRadius:14,fontSize:12,fontWeight:700}}>
            {doneCount} / {total} 완료 ({progress}%)
          </div>
        </div>
      </header>

      <main style={{padding:"20px 28px",maxWidth:1100,margin:"0 auto"}}>

        {/* ── 자동 처리 패널 ── */}
        {showAuto&&(
          <div style={{background:"#fff",borderRadius:14,padding:"16px 20px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)",border:"1.5px solid #6ee7b7"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#059669",marginBottom:8}}>🚀 자동 처리 — 내용을 입력하면 Claude가 분류해서 자동 등록합니다</div>
            <textarea value={autoText} onChange={e=>setAutoText(e.target.value)} rows={4}
              placeholder={"예시:\n로그인 버튼 클릭 시 500 에러 발생\n모바일에서 레이아웃 깨짐\n엑셀 내보내기 기능 필요\nLocalStorage 버전 마이그레이션 처리"}
              style={{width:"100%",padding:"10px 12px",border:"1.5px solid #6ee7b7",borderRadius:8,fontSize:12,outline:"none",resize:"vertical",lineHeight:1.7,boxSizing:"border-box" as const,background:"#f0fdf4",marginBottom:10}}/>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={autoProcess} disabled={autoLoad||!autoText.trim()}
                style={{background:autoLoad?"#6ee7b7":"linear-gradient(135deg,#059669,#047857)",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:700,cursor:autoLoad?"not-allowed":"pointer",opacity:(autoLoad||!autoText.trim())?.6:1}}>
                {autoLoad?"⏳ 처리 중...":"🚀 자동 처리 시작"}
              </button>
              {!autoLoad&&autoText&&<button onClick={()=>{setAutoText("");setAutoLog([]);}} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:11,cursor:"pointer"}}>초기화</button>}
            </div>
            {autoLog.length>0&&(
              <div style={{marginTop:12,background:"#022c22",borderRadius:10,padding:"12px 14px",maxHeight:180,overflowY:"auto" as const,fontFamily:"monospace"}}>
                {autoLog.map((line,i)=>(
                  <div key={i} style={{fontSize:11,color:line.startsWith("❌")?"#f87171":line.startsWith("🎉")?"#34d399":line.startsWith("📝")?"#6ee7b7":"#a7f3d0",marginBottom:3,lineHeight:1.5}}>{line}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 요약 카드 ── */}
        <div style={{background:"#fff",borderRadius:14,padding:"18px 22px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)"}}>
          {/* 상태별 카운트 */}
          <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:16}}>
            {stCounts.map(({st,count})=>{
              const m=STATUS[st];
              const active=fSt===st;
              return (
                <div key={st} onClick={()=>setFSt(active?"":st as St)}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",opacity:fSt&&!active?.4:1,transition:"opacity .15s"}}>
                  <div style={{fontSize:26,fontWeight:900,color:m.color,lineHeight:1}}>{count}</div>
                  <div style={{fontSize:10,padding:"2px 10px",borderRadius:99,background:active?m.color:m.bg,color:active?"#fff":m.color,fontWeight:700,transition:"all .15s"}}>{m.label}</div>
                </div>
              );
            })}
            {/* 전체 진행 바 */}
            <div style={{flex:1,marginLeft:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,fontWeight:600,color:"#64748b"}}>전체 진행률</span>
                <span style={{fontSize:14,fontWeight:900,color:progress===100?"#16a34a":"#2563eb"}}>{progress}%</span>
              </div>
              <div style={{height:10,background:"#e2e8f0",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",background:progress===100?"linear-gradient(90deg,#16a34a,#4ade80)":"linear-gradient(90deg,#2563eb,#60a5fa)",borderRadius:99,width:`${progress}%`,transition:"width .4s ease"}}/>
              </div>
            </div>
          </div>

          {/* 카테고리 & 우선순위 필터 */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {(Object.keys(CAT) as Cat[]).map(cat=>{
              const m=CAT[cat];
              const cnt=items.filter(i=>i.cat===cat).length;
              const doneCnt=items.filter(i=>i.cat===cat&&i.status==="done").length;
              const active=fCat===cat;
              return (
                <button key={cat} onClick={()=>setFCat(active?"":cat)}
                  style={{padding:"6px 16px",borderRadius:8,border:`1.5px solid ${active?m.color:m.border}`,background:active?m.bg:"#fff",color:active?m.color:"#64748b",cursor:"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
                  {m.emoji} {m.label}
                  <span style={{fontSize:10,opacity:.7,fontWeight:400}}>{doneCnt}/{cnt}</span>
                </button>
              );
            })}
            <div style={{width:1,height:24,background:"#e2e8f0",margin:"0 4px"}}/>
            {(Object.keys(PRI) as Pri[]).map(pri=>{
              const m=PRI[pri];
              const active=fPri===pri;
              return (
                <button key={pri} onClick={()=>setFPri(active?"":pri)}
                  style={{padding:"4px 12px",borderRadius:99,border:`1.5px solid ${active?m.color:"#e2e8f0"}`,background:active?m.bg:"#fff",color:active?m.color:"#94a3b8",fontSize:10,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                  {m.label}
                </button>
              );
            })}
            {anyFilter&&(
              <button onClick={()=>{setFCat("");setFSt("");setFPri("");}}
                style={{padding:"4px 12px",borderRadius:99,border:"1.5px solid #e2e8f0",background:"#fff",color:"#94a3b8",fontSize:10,cursor:"pointer",marginLeft:4}}>
                ✕ 필터 초기화
              </button>
            )}
          </div>
        </div>

        {/* ── 카테고리별 목록 ── */}
        {(Object.keys(CAT) as Cat[]).map(cat=>{
          const catItems = filtered.filter(i=>i.cat===cat);
          if(!catItems.length && fCat && fCat!==cat) return null;
          const m = CAT[cat];
          const catTotal = items.filter(i=>i.cat===cat).length;
          const catDone  = items.filter(i=>i.cat===cat&&i.status==="done").length;
          const isAdding = addingCat===cat;

          return (
            <div key={cat} style={{marginBottom:20}}>
              {/* 카테고리 헤더 */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:900,color:m.color}}>{m.emoji} {m.label}</div>
                <div style={{flex:1,height:1.5,background:`linear-gradient(90deg,${m.border},transparent)`}}/>
                <div style={{fontSize:11,color:m.color,fontWeight:700,marginRight:8}}>{catDone}/{catTotal}</div>
                <button onClick={()=>setAddingCat(isAdding?null:cat)}
                  style={{padding:"3px 12px",borderRadius:99,border:`1.5px solid ${isAdding?m.color:m.border}`,background:isAdding?m.bg:"#fff",color:isAdding?m.color:"#94a3b8",fontSize:10,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                  {isAdding?"취소":"＋ 추가"}
                </button>
              </div>

              {/* 새 항목 추가 폼 */}
              {isAdding&&(
                <div style={{background:m.bg,border:`1.5px dashed ${m.color}`,borderRadius:10,padding:"12px 16px",marginBottom:8}}>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <input value={addForm.title} onChange={e=>setAddForm(f=>({...f,title:e.target.value}))}
                      placeholder="항목 제목 *"
                      onKeyDown={e=>{if(e.key==="Enter")addItem();if(e.key==="Escape")setAddingCat(null);}}
                      autoFocus
                      style={{flex:2,padding:"6px 10px",border:`1.5px solid ${m.color}`,borderRadius:6,fontSize:12,fontWeight:600,outline:"none",background:"#fff"}}/>
                    <select value={addForm.priority} onChange={e=>setAddForm(f=>({...f,priority:e.target.value as Pri}))}
                      style={{padding:"6px 8px",border:`1.5px solid ${m.color}`,borderRadius:6,fontSize:11,background:"#fff",outline:"none"}}>
                      {(Object.keys(PRI) as Pri[]).map(p=><option key={p} value={p}>{PRI[p].label}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <input value={addForm.desc} onChange={e=>setAddForm(f=>({...f,desc:e.target.value}))}
                      placeholder="설명 (선택)"
                      style={{flex:1,padding:"6px 10px",border:"1.5px solid #e2e8f0",borderRadius:6,fontSize:11,outline:"none",background:"#fff"}}/>
                    <button onClick={addItem} style={{padding:"6px 18px",background:m.color,color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:700,cursor:"pointer"}}>등록</button>
                  </div>
                </div>
              )}

              {/* 빈 상태 */}
              {!catItems.length&&(
                <div style={{textAlign:"center",padding:"24px 0",color:"#94a3b8",fontSize:12,background:"#fff",borderRadius:10,border:"1px solid #f1f5f9"}}>
                  {fSt||fPri ? "필터 조건에 맞는 항목 없음" : "항목 없음"}
                </div>
              )}

              {/* 항목 카드들 */}
              {catItems.map(item=>{
                const st  = STATUS[item.status];
                const pri = PRI[item.priority];
                const isDone = item.status==="done";
                const isNote = noteId===item.id;

                return (
                  <div key={item.id} style={{background:"#fff",borderRadius:10,padding:"12px 16px",marginBottom:6,boxShadow:"0 1px 3px rgba(0,0,0,.06)",borderLeft:`3px solid ${m.color}`,opacity:isDone?.55:1,transition:"opacity .2s"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:10}}>

                      {/* 상태 토글 버튼 */}
                      <button onClick={()=>cycleStatus(item.id)} title="클릭해서 상태 변경"
                        style={{flexShrink:0,padding:"3px 12px",borderRadius:99,border:`1.5px solid ${st.color}`,background:st.bg,color:st.color,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",marginTop:2,transition:"all .15s"}}>
                        {st.label}
                      </button>

                      {/* 본문 */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                          <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",fontFamily:"monospace",flexShrink:0}}>{item.id}</span>
                          <span style={{fontSize:12,fontWeight:700,color:isDone?"#94a3b8":"#0f172a",textDecoration:isDone?"line-through":"none"}}>{item.title}</span>
                        </div>
                        {item.desc&&<div style={{fontSize:11,color:"#64748b",lineHeight:1.55,marginBottom:item.note?4:0}}>{item.desc}</div>}
                        {item.note&&!isNote&&(
                          <div style={{marginTop:5,padding:"4px 10px",background:"#fffbeb",borderRadius:5,fontSize:11,color:"#92400e",borderLeft:"2px solid #fcd34d"}}>
                            💬 {item.note}
                          </div>
                        )}
                        {isNote&&(
                          <div style={{marginTop:8,display:"flex",gap:6}}>
                            <input ref={noteRef} value={noteVal} onChange={e=>setNoteVal(e.target.value)}
                              onKeyDown={e=>{if(e.key==="Enter")saveNote(item.id);if(e.key==="Escape")setNoteId(null);}}
                              placeholder="메모 입력 후 Enter..."
                              style={{flex:1,padding:"5px 10px",border:"1.5px solid #2563eb",borderRadius:6,fontSize:11,outline:"none",boxShadow:"0 0 0 2px rgba(37,99,235,.12)"}}/>
                            <button onClick={()=>saveNote(item.id)} style={{padding:"5px 14px",background:"#2563eb",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>저장</button>
                            <button onClick={()=>setNoteId(null)} style={{padding:"5px 10px",background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:6,fontSize:11,cursor:"pointer"}}>취소</button>
                          </div>
                        )}
                      </div>

                      {/* 오른쪽 메타 */}
                      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                        <span style={{padding:"2px 8px",borderRadius:99,background:pri.bg,color:pri.color,fontSize:9,fontWeight:700}}>{pri.label}</span>
                        <button onClick={()=>{setNoteId(isNote?null:item.id);setNoteVal(item.note||"");}}
                          title="메모"
                          style={{width:26,height:26,borderRadius:7,border:"1px solid #e2e8f0",background:isNote?"#eff6ff":"#f8fafc",color:isNote?"#2563eb":"#94a3b8",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                          💬
                        </button>
                        <button onClick={()=>deleteItem(item.id)} title="삭제"
                          style={{width:26,height:26,borderRadius:7,border:"1px solid #fecaca",background:"#fff",color:"#dc2626",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",opacity:.5,transition:"opacity .15s"}}
                          onMouseEnter={e=>(e.currentTarget.style.opacity="1")}
                          onMouseLeave={e=>(e.currentTarget.style.opacity=".5")}>
                          🗑
                        </button>
                        {item.updatedAt&&<span style={{fontSize:9,color:"#c0c8d4",whiteSpace:"nowrap"}}>{item.updatedAt}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {filtered.length===0&&!Object.keys(CAT).some(cat=>addingCat===cat)&&(
          <div style={{textAlign:"center",padding:"80px 0",color:"#94a3b8",fontSize:14}}>
            조건에 맞는 항목이 없습니다
          </div>
        )}

        {/* 하단 여백 */}
        <div style={{height:40}}/>
      </main>
    </div>
  );
}
