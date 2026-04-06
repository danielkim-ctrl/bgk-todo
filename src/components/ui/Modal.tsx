import { useEffect } from "react";
import { S } from "../../styles";
import { XMarkIcon } from "./Icons";

// 모달 열림/닫힘 애니메이션용 키프레임을 한 번만 주입
const ANIM_ID = "modal-anim-kf";
function injectKeyframes() {
  if (document.getElementById(ANIM_ID)) return;
  const style = document.createElement("style");
  style.id = ANIM_ID;
  style.textContent = `
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`;
  document.head.appendChild(style);
}

export function Modal({open,onClose,title,children,footer,wide,onCtrlEnter}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  onCtrlEnter?: () => void; // Ctrl+Enter로 저장 — 저장 핸들러 전달
}) {
  // 모달 열릴 때: 애니메이션 주입 + ESC 키로 닫기 + Ctrl+Enter 저장 + 배경 스크롤 차단
  useEffect(()=>{
    if(!open) return;
    injectKeyframes();
    const handleKey = (e: KeyboardEvent) => {
      if(e.key==="Escape") onClose();
      // Ctrl+Enter 또는 Cmd+Enter → 저장
      if((e.ctrlKey||e.metaKey)&&e.key==="Enter"&&onCtrlEnter){e.preventDefault();onCtrlEnter();}
    };
    document.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = prev; };
  },[open, onClose, onCtrlEnter]);
  if(!open)return null;
  return <div style={{...S.modal,animation:"fadeIn .2s ease"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div style={{...S.mbox,...(wide?{maxWidth:960}:{}),animation:"slideIn .25s ease"}}>
    <div style={{padding:"18px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:16,fontWeight:800}}>{title}</div><button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#f1f5f9",cursor:"pointer",fontSize:14,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}><XMarkIcon style={{width:14,height:14}}/></button></div>
    <div style={{padding:"16px 18px"}}>{children}</div>
    {footer&&<div style={{padding:"0 18px 16px",display:"flex",gap:6,justifyContent:"flex-end"}}>{footer}</div>}
  </div></div>;
}
