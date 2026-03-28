import { XMarkIcon, CheckCircleIcon, ICON_SM } from "./Icons";

export function Toast({msg,type,action}: {msg: string, type: string, action?: {label: string, fn: () => void}}) {
  if(!msg)return null;
  return <div style={{position:"fixed",bottom:24,right:24,background:type==="err"?"#dc2626":"#16a34a",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:12,fontWeight:600,zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,.15)",animation:"slideUp .25s ease",display:"flex",alignItems:"center",gap:8}}>
    {type==="err"?<XMarkIcon style={ICON_SM}/>:<CheckCircleIcon style={ICON_SM}/>} {msg}
    {/* 액션 버튼 (예: AI 등록 후 실행 취소) */}
    {action&&<button onClick={action.fn} style={{marginLeft:4,background:"rgba(255,255,255,.25)",border:"1px solid rgba(255,255,255,.5)",borderRadius:6,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 10px",cursor:"pointer",flexShrink:0}}>{action.label}</button>}
  </div>;
}
