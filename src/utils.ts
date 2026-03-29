import { Project } from "./types";
import DOMPurify from "dompurify";

// HTML 문자열에서 악성 스크립트를 제거하고 안전한 HTML만 반환
export const sanitize = (html: string) => DOMPurify.sanitize(html);

export const fmt2 = (n: number) => String(n).padStart(2,"0");
export const td = () => { const d = new Date(); return `${d.getFullYear()}-${fmt2(d.getMonth()+1)}-${fmt2(d.getDate())}`; };
export const isOD = (d: string, s: string) => s!=="완료"&&d&&new Date(d.split(" ")[0])<new Date(new Date().toDateString());
export const dDay = (d: string, s: string) => {
  if(!d||s==="완료")return null;
  const today=new Date(new Date().toDateString());
  const due=new Date(d.split(" ")[0]);
  const diff=Math.round((due.getTime()-today.getTime())/(1000*60*60*24));
  if(diff===0)return{label:"D-day",color:"#dc2626",bg:"#fef2f2",border:"#fca5a5"};
  if(diff<0)return{label:`D+${Math.abs(diff)}`,color:"#dc2626",bg:"#fef2f2",border:"#fca5a5"};
  if(diff<=3)return{label:`D-${diff}`,color:"#d97706",bg:"#fff7ed",border:"#fcd34d"};
  if(diff<=7)return{label:`D-${diff}`,color:"#2563eb",bg:"#eff6ff",border:"#93c5fd"};
  return{label:`D-${diff}`,color:"#64748b",bg:"#f8fafc",border:"#e2e8f0"};
};
export const gP = (ps: Project[], id: number): Project => ps.find(p=>p.id===id)||{id:0,name:"미분류",color:"#94a3b8",status:""};
export const fD = (d: string) => d?d.slice(5).replace("-","/"):"—";
export const DOW = ["일","월","화","수","목","금","토"];
export const fDow = (d: string) => { if(!d) return ""; const dt=new Date(d.split(" ")[0]); return isNaN(dt.getTime())?"":DOW[dt.getDay()]; };
export const dateStr = (y: number, m: number, d: number) => `${y}-${fmt2(m+1)}-${fmt2(d)}`;
export const stripHtml = (h: string) => h ? h.replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").trim() : "";

// 반복 업무를 캘린더 범위 내에서 개별 인스턴스로 전개하는 함수
// 예: "매주" 반복 업무의 due가 3/1이면 → 3/1, 3/8, 3/15... 각 날짜에 인스턴스 생성
export function expandRepeats(todos: any[], startDs: string, endDs: string) {
  const result: any[] = [];
  const start = new Date(startDs);
  const end = new Date(endDs);
  todos.forEach(t => {
    // 비반복 업무: 범위 안에 있으면 그대로 표시
    if (!t.repeat || t.repeat === "없음") {
      const dueDate = t.due ? t.due.split(" ")[0] : "";
      if (dueDate && dueDate >= startDs && dueDate <= endDs) result.push({...t, _instance: false});
      return;
    }
    // 반복 업무인데 마감기한이 없으면 원본만 표시
    if (!t.due) { result.push({...t, _instance: false}); return; }
    const originDs = t.due.split(" ")[0];
    // 완료된 반복 업무는 원본 날짜만 표시하고 미래 인스턴스는 생성하지 않음
    if (t.st === "완료") {
      if (originDs >= startDs && originDs <= endDs) result.push({...t, _instance: false});
      return;
    }
    // 반복 업무: 마감기한 기준으로 과거/미래 인스턴스를 범위 내에서 생성
    let cur = new Date(t.due);
    // 범위 시작점까지 과거로 이동
    while (cur > start) {
      if (t.repeat === "매일") cur.setDate(cur.getDate() - 1);
      else if (t.repeat === "매주") cur.setDate(cur.getDate() - 7);
      else if (t.repeat === "매월") cur.setMonth(cur.getMonth() - 1);
      else break;
    }
    // 범위 끝까지 미래로 이동하며 인스턴스 생성
    while (cur <= end) {
      const ds = dateStr(cur.getFullYear(), cur.getMonth(), cur.getDate());
      if (ds >= startDs && ds <= endDs) {
        result.push({...t, due: ds, _instance: ds !== originDs, _originDue: originDs});
      }
      if (t.repeat === "매일") cur.setDate(cur.getDate() + 1);
      else if (t.repeat === "매주") cur.setDate(cur.getDate() + 7);
      else if (t.repeat === "매월") cur.setMonth(cur.getMonth() + 1);
      else break;
    }
  });
  return result;
}
