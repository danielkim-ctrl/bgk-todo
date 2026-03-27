import { S } from "../../styles";

export function Modal({open,onClose,title,children,footer}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if(!open)return null;
  return <div style={S.modal} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div style={S.mbox}>
    <div style={{padding:"16px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:15,fontWeight:800}}>{title}</div><button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"#f1f5f9",cursor:"pointer",fontSize:14,color:"#64748b"}}>✕</button></div>
    <div style={{padding:"16px 18px"}}>{children}</div>
    {footer&&<div style={{padding:"0 18px 16px",display:"flex",gap:6,justifyContent:"flex-end"}}>{footer}</div>}
  </div></div>;
}
