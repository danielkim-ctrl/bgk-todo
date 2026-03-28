import { S } from "../../styles";
import { ArrowPathIcon, ICON_SM } from "./Icons";

export function RepeatBadge({repeat}: {repeat?: string}) {
  if(!repeat||repeat==="없음")return null;
  return <span style={S.repeatBadge}><ArrowPathIcon style={ICON_SM}/> {repeat}</span>;
}
