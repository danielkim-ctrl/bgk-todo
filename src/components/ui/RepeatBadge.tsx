import { S } from "../../styles";
import { ArrowPathIcon, ICON_SM } from "./Icons";
import { repeatLabel } from "../../constants";

// 반복 배지 — 문자열("매일") 또는 RepeatConfig 객체 모두 지원
export function RepeatBadge({repeat}: {repeat?: any}) {
  const label = repeatLabel(repeat);
  if (!label) return null;
  return <span style={S.repeatBadge}><ArrowPathIcon style={ICON_SM}/> {label}</span>;
}
