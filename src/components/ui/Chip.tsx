import { S } from "../../styles";

// 필터 칩 공통 컴포넌트 — 사이드바 필터, 리스트 필터 영역 등에서 재사용
export function Chip({active,color,bg,fg,borderColor,icon,children,onClick,onRemove}: {
  active: boolean;
  color?: string;          // dot 색상 (프로젝트 등)
  bg?: string;             // 카테고리별 배경색 (필터 칩용)
  fg?: string;             // 카테고리별 글자색 (필터 칩용)
  borderColor?: string;    // 테두리색 (필터 칩용)
  icon?: React.ReactNode;  // 앞쪽 아이콘 (검색, 담당자 등)
  children: React.ReactNode;
  onClick?: () => void;
  onRemove?: () => void;   // × 버튼 클릭 시 필터 해제
}) {
  // bg/fg가 지정되면 카테고리 색상 사용, 아니면 기본 active/inactive 색상
  const hasCat = bg && fg;
  const baseBg = hasCat ? bg : (active ? "#2563eb" : "#fff");
  const baseFg = hasCat ? fg : (active ? "#fff" : "#64748b");
  const baseBorder = hasCat ? (borderColor || `${fg}44`) : (active ? "#2563eb" : "#e2e8f0");

  return <button onClick={onClick} style={{
    fontSize:10, padding:"4px 8px", borderRadius:99,
    border:`1.5px solid ${baseBorder}`,
    background:baseBg, color:baseFg,
    cursor: onClick ? "pointer" : "default",
    fontWeight: active ? 600 : 500,
    display:"inline-flex", alignItems:"center", gap:3,
    fontFamily:"inherit", lineHeight:1, whiteSpace:"nowrap",
  }}>
    {color && <span style={S.dot(color)}/>}
    {icon}
    {children}
    {onRemove && <span
      role="button"
      onClick={e => { e.stopPropagation(); onRemove(); }}
      style={{
        cursor:"pointer", marginLeft:1, fontSize:12, lineHeight:1,
        color: hasCat ? fg : "rgba(255,255,255,.7)",
        opacity: 0.7, transition:"opacity .12s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.opacity = "1"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.opacity = "0.7"; }}
    >×</span>}
  </button>;
}
