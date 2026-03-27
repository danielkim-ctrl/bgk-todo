import { S } from "../../styles";

export function Chip({active,color,children,onClick}: {
  active: boolean;
  color?: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return <button onClick={onClick} style={{fontSize:10,padding:"3px 9px",borderRadius:99,border:`1.5px solid ${active?"#2563eb":"#e2e8f0"}`,background:active?"#2563eb":"#fff",color:active?"#fff":"#64748b",cursor:"pointer",fontWeight:active?600:500,display:"inline-flex",alignItems:"center",gap:3}}>{color&&<span style={S.dot(color)}/>}{children}</button>;
}
