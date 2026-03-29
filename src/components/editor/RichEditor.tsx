import { useRef, useEffect } from "react";
import { XMarkIcon } from "../ui/Icons";

export function RichEditor({value, onChange}: {value: string, onChange: (v: string) => void}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInit = useRef(false);
  useEffect(()=>{
    if(ref.current && !isInit.current){ ref.current.innerHTML = value||""; isInit.current=true; }
  },[]);
  const cmd=(command: string,val: string|null=null)=>{ ref.current!.focus(); document.execCommand(command,false,val!); onChange(ref.current!.innerHTML); };
  const colors=["#dc2626","#d97706","#16a34a","#2563eb","#7c3aed","#0f172a","#64748b"];
  // 체크박스 서식 토글 — 불릿/넘버링과 동일한 토글 방식
  const toggleCheckList = () => {
    const el = ref.current!;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // 커서/선택 범위가 속한 li 목록 수집
    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer as Node;
    const root = ancestor.nodeType === 3 ? ancestor.parentElement! : ancestor as HTMLElement;

    // 가장 가까운 ul/ol 찾기
    const list = root.closest('ul, ol');

    // ── 이미 체크박스 ul 안이면 → 일반 텍스트로 해제 ──────────────────
    if (list && list.tagName === 'UL' && list.querySelector('input[type="checkbox"]')) {
      const items = Array.from(list.querySelectorAll('li'));
      const texts = items.map(li => {
        // span 안 텍스트만 추출 (체크박스 input 제외)
        const span = li.querySelector('span');
        return span ? span.textContent || '' : li.textContent || '';
      }).filter(t => t && t !== '\u200b');
      const replacement = texts.map(t => `<div>${t || '\u200b'}</div>`).join('');
      list.outerHTML = replacement || '<div>\u200b</div>';
      onChange(el.innerHTML);
      return;
    }

    // ── 불릿(ul) 또는 넘버링(ol) 안이면 → 먼저 해제 후 체크박스로 변환 ──
    if (list) {
      // execCommand로 기존 리스트 해제
      if (list.tagName === 'UL') document.execCommand('insertUnorderedList', false, undefined);
      else document.execCommand('insertOrderedList', false, undefined);
    }

    // ── 체크박스 li 생성 헬퍼 ──────────────────────────────────────────
    const makeLi = (text: string) =>
      `<li><label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" style="width:14px;height:14px;accent-color:#2563eb;cursor:pointer;flex-shrink:0"/> <span>${text || '\u200b'}</span></label></li>`;

    const selectedText = sel.toString();
    if (selectedText.trim()) {
      // 선택 텍스트를 줄 단위로 체크박스 li 변환
      const lines = selectedText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
      document.execCommand('insertHTML', false,
        `<ul style="list-style:none;padding-left:4px;margin:4px 0">${lines.map(makeLi).join('')}</ul>`
      );
    } else {
      // 선택 없으면 빈 체크박스 한 줄
      document.execCommand('insertHTML', false,
        `<ul style="list-style:none;padding-left:4px;margin:4px 0">${makeLi('')}</ul>`
      );
    }
    onChange(el.innerHTML);
  };
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
        style={{padding:"3px 7px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:11,...(t.s||{}),fontFamily:"inherit"}}>{t.label}</button>)}
      {/* 체크박스 목록 버튼 — 네모 체크 서식 삽입 */}
      <button title="체크박스 목록" onMouseDown={e=>{e.preventDefault();toggleCheckList();}}
        style={{padding:"3px 7px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:11,fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:3}}>
        <span style={{width:11,height:11,border:"1.5px solid #334155",borderRadius:2,display:"inline-block",flexShrink:0}}/>
        <span style={{fontSize:10,color:"#334155"}}>체크</span>
      </button>
      <div style={{width:1,height:16,background:"#e2e8f0",margin:"0 2px"}}/>
      <div style={{position:"relative",display:"inline-flex"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#334155",marginRight:2,lineHeight:1}}>A</span>
        <div style={{display:"flex",gap:2,alignItems:"center"}}>
          {colors.map(c=><button key={c} title={`글자색`} onMouseDown={e=>{e.preventDefault();cmd("foreColor",c);}}
            style={{width:13,height:13,borderRadius:"50%",background:c,border:"1.5px solid #fff",outline:"1px solid #e2e8f0",cursor:"pointer",flexShrink:0}}/>)}
        </div>
      </div>
      <div style={{width:1,height:16,background:"#e2e8f0",margin:"0 2px"}}/>
      <button title="서식 제거" onMouseDown={e=>{e.preventDefault();cmd("removeFormat");}}
        style={{padding:"2px 6px",borderRadius:6,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:10,color:"#94a3b8",display:"inline-flex",alignItems:"center",gap:2}}><XMarkIcon style={{width:10,height:10}}/> 서식</button>
    </div>
    <div ref={ref} contentEditable suppressContentEditableWarning onInput={()=>onChange(ref.current!.innerHTML)}
      style={{minHeight:140,maxHeight:280,overflowY:"auto",padding:"10px 12px",fontSize:13,lineHeight:1.7,outline:"none",fontFamily:"'Pretendard',system-ui,sans-serif",color:"#1a2332"}}/>
  </div>;
}
