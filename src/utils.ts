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
export const gP = (ps: Project[], id: number): Project => ps.find(p=>p.id===id)||{id:0,name:"미배정",color:"#94a3b8",status:""};
// 세부 프로젝트의 상위 프로젝트를 반환
export const getParentProj = (ps: Project[], p: Project): Project | null => p.parentId ? ps.find(x => x.id === p.parentId) || null : null;
// 상위 프로젝트의 모든 하위 ID 목록 (자신 포함)
export const getChildIds = (ps: Project[], parentId: number): number[] => [parentId, ...ps.filter(p => p.parentId === parentId).map(p => p.id)];
// 프로젝트 표시명: 세부면 "상위 › 세부", 아니면 그냥 이름
export const projLabel = (ps: Project[], p: Project, short = false): string => {
  const parent = getParentProj(ps, p);
  if (!parent) return p.name;
  return short ? p.name : `${parent.name} › ${p.name}`;
};
// 최상위 프로젝트만 필터 (parentId 없는 것)
export const topProjects = (ps: Project[]): Project[] => ps.filter(p => !p.parentId);
// 특정 상위의 하위 프로젝트들
export const childProjects = (ps: Project[], parentId: number): Project[] => ps.filter(p => p.parentId === parentId);
export const fD = (d: string) => d?d.slice(5).replace("-","/"):"—";
export const DOW = ["일","월","화","수","목","금","토"];
export const fDow = (d: string) => { if(!d) return ""; const dt=new Date(d.split(" ")[0]); return isNaN(dt.getTime())?"":DOW[dt.getDay()]; };
export const dateStr = (y: number, m: number, d: number) => `${y}-${fmt2(m+1)}-${fmt2(d)}`;
export const stripHtml = (h: string) => h ? h.replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").trim() : "";

// 반복 업무의 현재 due를 기준으로 다음 마감기한을 계산한다
// due가 없으면 오늘을 기준으로 계산
export function getNextDue(due: string, repeat: any): string | null {
  if (!repeat || repeat === "없음") return null;

  // 기준일: due가 있으면 due, 없으면 오늘
  const base = due ? due.split(" ")[0] : td();
  const cur = new Date(base);
  if (isNaN(cur.getTime())) return null;

  let interval = 1;
  let unit: "일" | "주" | "월" | null = null;

  if (typeof repeat === "string") {
    if (repeat === "매일") unit = "일";
    else if (repeat === "매주") unit = "주";
    else if (repeat === "매월") unit = "월";
  } else if (typeof repeat === "object") {
    interval = repeat.interval || 1;
    unit = repeat.unit || null;
  }

  if (!unit) return null;

  if (unit === "일") cur.setDate(cur.getDate() + interval);
  else if (unit === "주") cur.setDate(cur.getDate() + 7 * interval);
  else if (unit === "월") {
    // 말일 처리: 이번 달 31일 → 다음 달에 31일 없으면 말일로
    const targetMonth = cur.getMonth() + interval;
    const targetYear = cur.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = targetMonth % 12;
    const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
    cur.setFullYear(targetYear);
    cur.setMonth(normalizedMonth);
    cur.setDate(Math.min(cur.getDate(), lastDay));
  }

  return `${cur.getFullYear()}-${fmt2(cur.getMonth() + 1)}-${fmt2(cur.getDate())}`;
}

// 반복 설정 표시용 문자열 변환 (유틸 공통 함수)
export function fmtRepeatLabel(repeat: any): string {
  if (!repeat || repeat === "없음") return "없음";
  if (typeof repeat === "string") return repeat;
  if (repeat.interval === 1) return `매${repeat.unit}`;
  return `${repeat.interval}${repeat.unit}마다`;
}

// 반복 업무를 캘린더 범위 내에서 개별 인스턴스로 전개하는 함수
// ─────────────────────────────────────────────────────────────────────────────
// repeat 필드는 두 가지 형식을 모두 지원:
//   • 레거시 문자열: "매일" | "매주" | "매월"
//   • RepeatConfig 객체: { interval, unit, start, endType, endDate?, endCount? }
//
// 핵심 동작:
//   1. repeat.start가 있으면 해당 날짜 이전에는 인스턴스 생성하지 않음
//   2. repeat.endDate / endCount 제한 준수
//   3. 문자열 비교 대신 unit 필드로 처리 (객체 형식에서 "매주" 비교 실패 방지)
//   4. 성능: 범위 외 구간을 한 번에 건너뛰어 불필요한 반복 최소화
export function expandRepeats(todos: any[], startDs: string, endDs: string) {
  const result: any[] = [];
  todos.forEach(t => {
    // ── ① 비반복 업무 ────────────────────────────────────────────────────────
    if (!t.repeat || t.repeat === "없음") {
      const d = t.due ? t.due.split(" ")[0] : "";
      if (d && d >= startDs && d <= endDs) result.push({...t, _instance: false});
      return;
    }

    // ── ② 반복 설정 파싱 ─────────────────────────────────────────────────────
    // RepeatConfig 객체 또는 레거시 문자열 모두 { interval, unit } 형태로 통일
    let interval = 1;
    let unit: "일" | "주" | "월" | null = null;
    let repeatStartDs: string | null = null; // 반복 시작일 (이 날 이전에는 인스턴스 없음)
    let repeatEndDs: string | null = null;   // 반복 종료일
    let repeatMaxCount: number | null = null; // 최대 반복 횟수

    if (typeof t.repeat === "string") {
      // 레거시: "매일" → unit="일", "매주" → unit="주", "매월" → unit="월"
      if (t.repeat === "매일") unit = "일";
      else if (t.repeat === "매주") unit = "주";
      else if (t.repeat === "매월") unit = "월";
    } else if (t.repeat && typeof t.repeat === "object") {
      // RepeatConfig 객체: RepeatPicker 저장 형식
      interval = t.repeat.interval || 1;
      unit = t.repeat.unit || null;
      // repeat.start: 반복 시작일 — 이 날짜 이전의 인스턴스는 생성하지 않음
      if (t.repeat.start) repeatStartDs = t.repeat.start;
      if (t.repeat.endType === "date" && t.repeat.endDate) repeatEndDs = t.repeat.endDate;
      if (t.repeat.endType === "count" && t.repeat.endCount) repeatMaxCount = t.repeat.endCount;
    }

    // 인식 불가 → 비반복으로 폴백
    if (!unit) {
      const d = t.due ? t.due.split(" ")[0] : "";
      if (d && d >= startDs && d <= endDs) result.push({...t, _instance: false});
      return;
    }

    if (!t.due) { result.push({...t, _instance: false}); return; }
    const originDs = t.due.split(" ")[0]; // t.due에 시간 포함 시 날짜만 추출
    const isDone = t.st === "완료";

    // ── ③ 실질적 생성 범위 결정 ─────────────────────────────────────────────
    // instMinDs: max(캘린더범위시작, repeat.start)
    //   → repeat.start가 있으면 그 이전에는 인스턴스 생성 안 함 (시작날짜 반영)
    // instMaxDs: min(캘린더범위끝, repeat.endDate)
    //   → endDate가 있으면 그 이후에는 인스턴스 생성 안 함 (마감날짜 반영)
    const instMinDs = repeatStartDs && repeatStartDs > startDs ? repeatStartDs : startDs;
    const instMaxDs = repeatEndDs && repeatEndDs < endDs ? repeatEndDs : endDs;
    if (instMinDs > instMaxDs) return; // 유효 범위 없음

    // ── ④ 날짜 이동 헬퍼 ────────────────────────────────────────────────────
    const step = (d: Date, fwd: boolean) => {
      const m = fwd ? 1 : -1;
      if (unit === "일") d.setDate(d.getDate() + interval * m);
      else if (unit === "주") d.setDate(d.getDate() + 7 * interval * m);
      else if (unit === "월") d.setMonth(d.getMonth() + interval * m);
    };

    // ── ⑤ originDs 기준으로 instMinDs 직전까지 역방향 이동 ─────────────────
    // 목표: cur이 instMinDs 이하가 되는 지점을 찾아 forward loop의 시작점으로 삼음
    let cur = new Date(originDs);
    const minDate = new Date(instMinDs);

    if (cur > minDate) {
      // originDs가 instMinDs 이후 → 역방향 이동
      // 성능: 일/주 단위는 수학적으로 한 번에 건너뜀
      if (unit === "일" || unit === "주") {
        const stepMs = unit === "일" ? interval * 86400000 : interval * 7 * 86400000;
        const diff = cur.getTime() - minDate.getTime();
        const steps = Math.ceil(diff / stepMs);
        if (unit === "일") cur.setDate(cur.getDate() - steps * interval);
        else cur.setDate(cur.getDate() - steps * 7 * interval);
        // 혹시 과거로 너무 갔으면 1스텝 앞으로
        while (cur < minDate) step(cur, true);
      } else {
        // 월 단위: 반복 횟수가 적으므로 단순 반복
        while (cur > minDate) step(cur, false);
      }
    } else if (cur < minDate) {
      // originDs가 instMinDs 이전 → 앞으로 이동해서 instMinDs 직전 위치 찾기
      if (unit === "일" || unit === "주") {
        const stepMs = unit === "일" ? interval * 86400000 : interval * 7 * 86400000;
        const diff = minDate.getTime() - cur.getTime();
        const steps = Math.floor(diff / stepMs);
        if (unit === "일") cur.setDate(cur.getDate() + steps * interval);
        else cur.setDate(cur.getDate() + steps * 7 * interval);
      } else {
        while (cur < minDate) step(cur, true);
        // 과거로 1스텝 후 forward loop에서 처리
        if (cur > minDate) step(cur, false);
      }
    }
    // cur이 instMinDs 이전에 위치 → forward loop에서 instMinDs 이상인 것만 push

    // ── ⑥ forward loop: instMinDs ~ instMaxDs 범위 내 인스턴스 생성 ─────────
    let count = 0;
    const maxDate = new Date(instMaxDs);
    while (cur <= maxDate) {
      const ds = dateStr(cur.getFullYear(), cur.getMonth(), cur.getDate());
      if (ds >= instMinDs && ds <= instMaxDs) {
        // 원본 날짜: 완료 상태 그대로 / originDs 이후 인스턴스: 대기로 표시
        const instSt = isDone && ds > originDs ? "대기" : t.st;
        result.push({...t, st: instSt, due: ds, _instance: ds !== originDs, _originDue: originDs});
        count++;
        // endCount 초과 시 종료 (반복 횟수는 instMinDs 이후 기준으로 카운트)
        if (repeatMaxCount !== null && count >= repeatMaxCount) break;
      }
      step(cur, true);
    }
  });
  return result;
}
