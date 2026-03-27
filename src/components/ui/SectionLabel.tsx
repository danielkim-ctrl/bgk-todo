import React from "react";
export function SectionLabel({num, title, sub, children}: {num: string, title: string, sub?: string, children?: React.ReactNode}) {
  return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
    <div style={{fontSize:10,fontWeight:800,color:"#fff",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",borderRadius:6,padding:"3px 8px",letterSpacing:.5,flexShrink:0}}>{num}</div>
    <div style={{fontSize:14,fontWeight:700,color:"#1a2332"}}>{title}</div>
    {sub&&<div style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>{sub}</div>}
    <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
    {children&&<div style={{flexShrink:0}}>{children}</div>}
  </div>;
}
