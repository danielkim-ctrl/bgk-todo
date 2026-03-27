import { S } from "../../styles";

export function RepeatBadge({repeat}: {repeat?: string}) {
  if(!repeat||repeat==="없음")return null;
  return <span style={S.repeatBadge}>🔁 {repeat}</span>;
}
