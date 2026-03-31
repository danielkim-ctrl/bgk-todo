import { useState, useRef, useEffect } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { RepeatConfig } from "../../types";

// ─── RepeatPicker — 공통 반복 설정 컴포넌트 ───────────────────────────────────
// CalendarView의 반복 UI를 추출하여 재사용 가능한 컴포넌트로 분리
// 리스트뷰(EditForm), 칸반뷰(EditForm), 캘린더뷰(SidebarAddTask/SidebarEditExpanded) 공통 사용

interface RepeatPickerProps {
  /** 현재 반복 값: "없음" | 레거시 문자열("매일","매주","매월") | RepeatConfig 객체 */
  value: any;
  /** 값이 변경될 때마다 호출 — "없음" 또는 RepeatConfig 객체를 전달 */
  onChange: (v: any) => void;
  /** 반복 시작 날짜 (RepeatConfig.start 필드에 사용) — 없으면 오늘로 설정 */
  startDate?: string;
}

/** value props → 내부 state 초기화 헬퍼 */
function initFromValue(value: any) {
  if (!value || value === "없음") {
    return { showDetail: false, interval: 1, unit: "일" as "일"|"주"|"월", time: "", endType: "none" as "none"|"date"|"count", endDate: "", endCount: 30 };
  }
  if (typeof value === "string") {
    // 레거시 문자열 "매일"/"매주"/"매월" → 내부 state 변환
    const unitMap: Record<string, "일"|"주"|"월"> = { "매일": "일", "매주": "주", "매월": "월" };
    return { showDetail: true, interval: 1, unit: unitMap[value] || "일" as "일"|"주"|"월", time: "", endType: "none" as "none"|"date"|"count", endDate: "", endCount: 30 };
  }
  // RepeatConfig 객체
  const c = value as RepeatConfig;
  return {
    showDetail: true,
    interval: c.interval || 1,
    unit: (c.unit || "일") as "일"|"주"|"월",
    time: c.time || "",
    endType: (c.endType || "none") as "none"|"date"|"count",
    endDate: c.endDate || "",
    endCount: c.endCount || 30,
  };
}

/** 내부 state → onChange에 전달할 출력값 빌드 */
function buildValue(
  showDetail: boolean,
  interval: number,
  unit: "일"|"주"|"월",
  time: string,
  endType: "none"|"date"|"count",
  endDate: string,
  endCount: number,
  startDate: string,
): any {
  if (!showDetail) return "없음";
  return {
    interval,
    unit,
    time: time || undefined,
    start: startDate,
    endType,
    endDate: endType === "date" ? endDate : undefined,
    endCount: endType === "count" ? endCount : undefined,
  };
}

export function RepeatPicker({ value, onChange, startDate = "" }: RepeatPickerProps) {
  // value prop으로 내부 state 초기화 (마운트 시 1회)
  const init = initFromValue(value);
  const [showDetail, setShowDetail] = useState(init.showDetail);
  const [interval, setIntervalVal] = useState(init.interval);
  const [unit, setUnit] = useState<"일"|"주"|"월">(init.unit);
  const [time, setTime] = useState(init.time);
  const [endType, setEndType] = useState<"none"|"date"|"count">(init.endType);
  const [endDate, setEndDate] = useState(init.endDate);
  const [endCount, setEndCount] = useState(init.endCount);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);
  // 라디오 name 충돌 방지 — 같은 페이지에 여러 RepeatPicker가 존재할 때
  const uid = useRef(`rep_${Math.random().toString(36).slice(2)}`);

  // showDetail 토글 시 onChange 호출
  useEffect(() => {
    onChange(buildValue(showDetail, interval, unit, time, endType, endDate, endCount, startDate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetail]);

  // 시간 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!showTimePicker) return;
    const h = (e: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(e.target as Node)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener("mousedown", h, true);
    return () => document.removeEventListener("mousedown", h, true);
  }, [showTimePicker]);

  /** 내부 값이 바뀔 때마다 부모에게 전달 */
  const emit = (
    sd: boolean, iv: number, u: "일"|"주"|"월", tm: string,
    et: "none"|"date"|"count", ed: string, ec: number
  ) => {
    onChange(buildValue(sd, iv, u, tm, et, ed, ec, startDate));
  };

  const handleToggle = () => {
    const next = !showDetail;
    setShowDetail(next);
    // emit은 useEffect에서 처리
  };

  const handleInterval = (v: number) => {
    setIntervalVal(v);
    emit(showDetail, v, unit, time, endType, endDate, endCount);
  };
  const handleUnit = (u: "일"|"주"|"월") => {
    setUnit(u);
    emit(showDetail, interval, u, time, endType, endDate, endCount);
  };
  const handleTime = (t: string) => {
    setTime(t);
    emit(showDetail, interval, unit, t, endType, endDate, endCount);
  };
  const handleEndType = (et: "none"|"date"|"count") => {
    setEndType(et);
    emit(showDetail, interval, unit, time, et, endDate, endCount);
  };
  const handleEndDate = (ed: string) => {
    setEndDate(ed);
    emit(showDetail, interval, unit, time, endType, ed, endCount);
  };
  const handleEndCount = (ec: number) => {
    setEndCount(ec);
    emit(showDetail, interval, unit, time, endType, endDate, ec);
  };

  // 반복 요약 라벨 (토글 행 우측에 표시)
  const summaryLabel = showDetail
    ? (interval === 1 ? `매${unit}` : `${interval}${unit}마다`)
    : "";

  return (
    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
      {/* ── 반복 토글 행 ── */}
      <div
        onClick={handleToggle}
        style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginBottom: 6, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
      >
        <ArrowPathIcon style={{ width: 13, height: 13 }} />
        반복 {showDetail ? "▾" : "▸"}
        {showDetail && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#1a73e8", fontWeight: 500 }}>
            {summaryLabel}
          </span>
        )}
      </div>

      {/* ── 상세 설정 (펼침 상태) ── */}
      {showDetail && (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {/* 간격: 숫자 입력 + 일/주/월 버튼 */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="number"
              min={1}
              value={interval}
              onChange={e => handleInterval(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: 44, padding: "5px 6px", border: "1px solid #dadce0", borderRadius: 6, fontSize: 12, textAlign: "center" as const, outline: "none", fontFamily: "inherit" }}
            />
            {(["일", "주", "월"] as const).map(u => (
              <button key={u} onClick={() => handleUnit(u)}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, border: `1px solid ${unit === u ? "#1a73e8" : "#e2e8f0"}`, background: unit === u ? "#e8f0fe" : "#fff", color: unit === u ? "#1a73e8" : "#334155", cursor: "pointer", fontFamily: "inherit", fontWeight: unit === u ? 600 : 400 }}>
                {u}
              </button>
            ))}
          </div>

          {/* 시간 선택 드롭다운 */}
          <div style={{ position: "relative" as const }} ref={timePickerRef}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>시간</div>
            <button
              onClick={() => setShowTimePicker(v => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", fontSize: 11, border: "1px solid #dadce0", borderRadius: 6, background: "#fff", color: time ? "#1a73e8" : "#5f6368", cursor: "pointer", fontFamily: "inherit", fontWeight: time ? 600 : 400 }}
            >
              <span>{time || "시간 설정"}</span>
              <span style={{ fontSize: 9, color: "#94a3b8" }}>▾</span>
            </button>
            {/* 시간 드롭다운 목록 */}
            {showTimePicker && (
              <div style={{ position: "absolute" as const, top: "100%", left: 0, right: 0, zIndex: 100, border: "1px solid #dadce0", borderRadius: 6, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: 2 }}>
                {/* 없음 (시간 미설정) */}
                <div
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleTime(""); setShowTimePicker(false); }}
                  style={{ padding: "6px 12px", fontSize: 11, cursor: "pointer", background: !time ? "#e8f0fe" : "#fff", color: !time ? "#1a73e8" : "#334155", fontWeight: !time ? 600 : 400, borderBottom: "1px solid #f1f3f4" }}
                  onMouseEnter={e => { if (time) (e.currentTarget as HTMLElement).style.background = "#f1f3f4"; }}
                  onMouseLeave={e => { if (time) (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                >
                  없음
                </div>
                {/* 00:00 ~ 23:30, 30분 단위 */}
                <div style={{ maxHeight: 150, overflowY: "auto" as const }}>
                  {Array.from({ length: 48 }, (_, i) => {
                    const hh = String(Math.floor(i / 2)).padStart(2, "0");
                    const mm = i % 2 === 0 ? "00" : "30";
                    const tv = `${hh}:${mm}`;
                    return (
                      <div key={tv}
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleTime(tv); setShowTimePicker(false); }}
                        style={{ padding: "6px 12px", fontSize: 11, cursor: "pointer", background: time === tv ? "#e8f0fe" : "transparent", color: time === tv ? "#1a73e8" : "#334155", fontWeight: time === tv ? 600 : 400 }}
                        onMouseEnter={e => { if (time !== tv) (e.currentTarget as HTMLElement).style.background = "#f1f3f4"; }}
                        onMouseLeave={e => { if (time !== tv) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        {tv}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 종료 조건 라디오 */}
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>종료</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                <input type="radio" name={uid.current} checked={endType === "none"} onChange={() => handleEndType("none")} style={{ accentColor: "#1a73e8" }} /> 없음
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                <input type="radio" name={uid.current} checked={endType === "date"} onChange={() => handleEndType("date")} style={{ accentColor: "#1a73e8" }} /> 날짜
                {endType === "date" && (
                  <input type="date" value={endDate} onChange={e => handleEndDate(e.target.value)}
                    style={{ fontSize: 10, padding: "2px 6px", border: "1px solid #dadce0", borderRadius: 4, outline: "none", fontFamily: "inherit" }} />
                )}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                <input type="radio" name={uid.current} checked={endType === "count"} onChange={() => handleEndType("count")} style={{ accentColor: "#1a73e8" }} /> 반복
                {endType === "count" && (
                  <>
                    <input type="number" min={1} value={endCount} onChange={e => handleEndCount(parseInt(e.target.value) || 1)}
                      style={{ width: 40, fontSize: 10, padding: "2px 4px", border: "1px solid #dadce0", borderRadius: 4, textAlign: "center" as const, outline: "none", fontFamily: "inherit" }} />
                    <span style={{ fontSize: 10, color: "#5f6368" }}>회</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
