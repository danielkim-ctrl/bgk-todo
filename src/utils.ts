import { Project } from "./types";

export const td = () => new Date().toISOString().slice(0,10);
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
export const fmt2 = (n: number) => String(n).padStart(2,"0");
export const dateStr = (y: number, m: number, d: number) => `${y}-${fmt2(m+1)}-${fmt2(d)}`;
export const stripHtml = (h: string) => h ? h.replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").trim() : "";

export function expandRepeats(todos: any[], startDs: string, endDs: string) {
  const result: any[] = [];
  const start = new Date(startDs);
  const end = new Date(endDs);
  todos.forEach(t => {
    if (!t.repeat || t.repeat === "없음") {
      if (t.due >= startDs && t.due <= endDs) result.push({...t, _instance: false});
      return;
    }
    if (!t.due) { result.push({...t, _instance: false}); return; }
    let cur = new Date(t.due);
    while (cur > start) {
      if (t.repeat === "매일") cur.setDate(cur.getDate() - 1);
      else if (t.repeat === "매주") cur.setDate(cur.getDate() - 7);
      else if (t.repeat === "매월") cur.setMonth(cur.getMonth() - 1);
      else break;
    }
    while (cur <= end) {
      const ds = dateStr(cur.getFullYear(), cur.getMonth(), cur.getDate());
      if (ds >= startDs && ds <= endDs) result.push({...t, due: ds, _instance: ds !== t.due, _originDue: t.due});
      if (t.repeat === "매일") cur.setDate(cur.getDate() + 1);
      else if (t.repeat === "매주") cur.setDate(cur.getDate() + 7);
      else if (t.repeat === "매월") cur.setMonth(cur.getMonth() + 1);
      else break;
    }
  });
  return result;
}
