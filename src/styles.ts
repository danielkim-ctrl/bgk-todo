// ── BGK Todo 전역 스타일 시스템 ──────────────────────────────────────
// 모든 인라인 스타일은 이 S 객체를 통해 관리한다.
// 수정 시 동일 역할의 모든 곳에 자동 반영되도록 여기서만 변경한다.

const T = 'all .15s ease';  // 기본 transition — 모든 인터랙티브 요소에 사용

export const S = {
  // ── 레이아웃 ─────────────────────────────────────────────────────
  wrap:{fontFamily:"'Pretendard', system-ui, sans-serif",background:"#f0f4f8",minHeight:"100vh",fontSize:13,color:"#1a2332",lineHeight:1.5},
  hdr:{background:"#172f5a",color:"#fff",padding:"0 24px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky" as const,top:0,zIndex:100,boxShadow:"0 1px 4px rgba(23,47,90,.12)"},
  nav:{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 24px",display:"flex",gap:4,position:"sticky" as const,top:52,zIndex:99,height:40},
  main:{padding:"16px 24px",maxWidth:1400,margin:"0 auto"},

  // ── 내비 탭 ──────────────────────────────────────────────────────
  navB:(a: boolean)=>({padding:"8px 16px",fontSize:12,fontWeight:a?600:400,color:a?"#2563eb":"#64748b",background:a?"#eff6ff":"none",border:"none",borderBottom:a?"2px solid #2563eb":"2px solid transparent",cursor:"pointer",display:"inline-flex" as const,alignItems:"center" as const,gap:4,transition:T}),

  // ── 버튼 ─────────────────────────────────────────────────────────
  hBtn:{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",color:"#fff",fontSize:11,padding:"4px 12px",borderRadius:14,cursor:"pointer",fontWeight:600,display:"inline-flex" as const,alignItems:"center" as const,gap:4,transition:T},
  bp:{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" as const,fontFamily:"inherit",display:"inline-flex" as const,alignItems:"center" as const,gap:4,transition:T},
  bs:{background:"#f1f5f9",color:"#334155",border:"none",padding:"8px 12px",borderRadius:8,fontSize:12,fontWeight:400,cursor:"pointer",fontFamily:"inherit",display:"inline-flex" as const,alignItems:"center" as const,gap:4,transition:T},
  bd:{background:"#fef2f2",color:"#dc2626",border:"none",padding:"8px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"inline-flex" as const,alignItems:"center" as const,gap:4,transition:T},

  // ── 테이블 ───────────────────────────────────────────────────────
  th:{padding:"10px 12px",textAlign:"left" as const,fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:0,whiteSpace:"nowrap" as const,overflow:"hidden",background:"#f8fafc",position:"sticky" as const,top:0,zIndex:2,boxShadow:"0 1px 0 #e2e8f0"},
  tdc:{padding:"10px 12px",fontSize:13,color:"#334155",whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis"},

  // ── 카드·컨테이너 ───────────────────────────────────────────────
  card:{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.08)",border:"1px solid #e2e8f0",transition:T},

  // ── 배지·칩·도트 ────────────────────────────────────────────────
  badge:(bg: string,c: string,border="1px solid transparent")=>({fontSize:11,fontWeight:600,padding:"4px 8px",borderRadius:6,background:bg||"#f1f5f9",color:c||"#64748b",display:"inline-flex",alignItems:"center",gap:4,border,lineHeight:1}),
  dot:(c: string)=>({width:8,height:8,borderRadius:"50%",background:c,flexShrink:0,display:"inline-block"}),
  pchip:()=>({display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"4px 8px",borderRadius:99,background:"#f8fafc",border:"1px solid #e2e8f0",whiteSpace:"nowrap" as const}),
  repeatBadge:{fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:99,background:"#e0f2fe",color:"#0369a1",display:"inline-flex",alignItems:"center",gap:2,marginLeft:4,whiteSpace:"nowrap" as const,lineHeight:1},

  // ── 인라인 입력 ─────────────────────────────────────────────────
  iinp:{width:"100%",padding:"4px 8px",border:"1.5px solid #2563eb",borderRadius:6,fontSize:12,outline:"none",background:"#fff",boxShadow:"0 0 0 2px rgba(37,99,235,.12)",fontFamily:"inherit"},

  // ── 모달 ─────────────────────────────────────────────────────────
  modal:{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.35)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(2px)",padding:20},
  mbox:{background:"#fff",borderRadius:12,width:"100%",maxWidth:640,maxHeight:"90vh",overflowY:"auto" as const,boxShadow:"0 12px 28px rgba(0,0,0,.15)"},

  // ── 그림자 단계 ─────────────────────────────────────────────────
  shadow:{
    sm: "0 1px 4px rgba(0,0,0,.08)",          // 카드
    md: "0 4px 12px rgba(0,0,0,.1)",           // 드롭다운, 팝오버
    lg: "0 8px 20px rgba(0,0,0,.12)",          // 플로팅 패널
    xl: "0 12px 28px rgba(0,0,0,.15)",         // 모달
  },

  // ── hover 색상 ──────────────────────────────────────────────────
  hover:{
    primary: "#1d4ed8",       // bp hover
    secondary: "#e2e8f0",     // bs hover
    danger: "#fee2e2",        // bd hover
    row: "#f8fafc",           // 테이블 행 hover
    navTab: "#f1f5f9",        // 내비 탭 hover
  },
};
