export function Toast({msg,type}: {msg: string, type: string}) {
  if(!msg)return null;
  return <div style={{position:"fixed",bottom:24,right:24,background:type==="err"?"#dc2626":"#16a34a",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:12,fontWeight:600,zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,.15)",animation:"slideUp .25s ease",display:"flex",alignItems:"center",gap:6}}>{type==="err"?"❌":"✅"} {msg}</div>;
}
