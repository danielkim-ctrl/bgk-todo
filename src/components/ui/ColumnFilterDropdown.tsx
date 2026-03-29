import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, ChevronRightIcon } from "./Icons";

// 컬럼 헤더 클릭 시 표시되는 필터+정렬+커스텀 순서 드롭다운
interface ColumnFilterDropdownProps {
  col: string;
  label: string;
  // 현재 컬럼의 정렬 방향 (null이면 정렬 안 됨)
  currentSortDir: "asc" | "desc" | null;
  onSort: (col: string, dir: "asc" | "desc" | null) => void;
  allValues: { key: string; label: string; color?: string; count: number }[];
  selectedValues: string[];
  onFilterChange: (col: string, values: string[]) => void;
  customOrder?: string[];
  onCustomOrderChange?: (col: string, order: string[]) => void;
  onClose: () => void;
  anchorRect: { top: number; left: number; bottom: number; right: number };
}

export function ColumnFilterDropdown({
  col, label, currentSortDir, onSort,
  allValues, selectedValues, onFilterChange,
  customOrder, onCustomOrderChange,
  onClose, anchorRect,
}: ColumnFilterDropdownProps) {
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<string[]>(selectedValues);
  const [showOrder, setShowOrder] = useState(false);

  // 체크된 항목만으로 커스텀 순서를 구성 — 체크 변경 시 자동 동기화
  const checkedKeys = tempSelected.length === 0
    ? allValues.map(v => v.key)  // 빈 배열 = 전체 선택
    : tempSelected.filter(k => k !== "__NONE__");
  const [tempOrder, setTempOrder] = useState<string[]>(
    customOrder ? customOrder.filter(k => checkedKeys.includes(k)) : checkedKeys
  );
  // 체크 변경 시 순서 목록도 동기화
  useEffect(() => {
    setTempOrder(prev => {
      // 기존 순서에서 체크 해제된 것 제거 + 새로 체크된 것 뒤에 추가
      const kept = prev.filter(k => checkedKeys.includes(k));
      const added = checkedKeys.filter(k => !kept.includes(k));
      return [...kept, ...added];
    });
  }, [tempSelected.join(",")]);

  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? allValues.filter(v => v.label.toLowerCase().includes(search.toLowerCase()))
    : allValues;
  const allChecked = tempSelected.length === 0;

  // 줌 보정
  const zoom = typeof document !== "undefined"
    ? parseFloat(getComputedStyle(document.documentElement).zoom) || 1 : 1;
  const rr = {
    top: anchorRect.top / zoom, left: anchorRect.left / zoom,
    bottom: anchorRect.bottom / zoom, right: anchorRect.right / zoom,
  };
  const vw = (typeof window !== "undefined" ? window.innerWidth : 1200) / zoom;
  const vh = (typeof window !== "undefined" ? window.innerHeight : 800) / zoom;
  const ddW = 280;
  const ddH = 460;
  let left = rr.left;
  if (left + ddW > vw - 8) left = vw - ddW - 8;
  if (left < 8) left = 8;
  // 항상 헤더 아래에 표시 (Google Sheets 동작) — 넘치면 스크롤 가능하도록 maxHeight 조정
  let top = rr.bottom + 2;

  // 바깥 클릭 / 스크롤 / ESC 닫기
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const t = setTimeout(() => document.addEventListener("mousedown", h, true), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h, true); };
  }, [onClose]);
  useEffect(() => { const h = () => onClose(); window.addEventListener("scroll", h, true); return () => window.removeEventListener("scroll", h, true); }, [onClose]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, [onClose]);

  // ── 필터 ──
  const toggleVal = (key: string) => {
    if (allChecked) {
      setTempSelected(allValues.map(v => v.key).filter(k => k !== key));
    } else if (tempSelected.includes(key)) {
      const next = tempSelected.filter(k => k !== key);
      setTempSelected(next.length === 0 ? [] : next);
    } else {
      const next = [...tempSelected, key];
      setTempSelected(next.length >= allValues.length ? [] : next);
    }
  };
  const selectAll = () => setTempSelected([]);
  const clearAll = () => setTempSelected(["__NONE__"]);

  // 사용자가 드래그/화살표로 직접 순서를 바꿨는지만 추적
  const orderManuallyChanged = useRef(false);

  // 확인 — 필터 적용 + 순서 변경됐으면 커스텀 순서도 함께 적용
  const confirm = () => {
    onFilterChange(col, tempSelected);
    if (orderManuallyChanged.current && onCustomOrderChange) onCustomOrderChange(col, tempOrder);
    onClose();
  };

  // ── 정렬 ──
  const applySort = (dir: "asc" | "desc") => {
    if (currentSortDir === dir) onSort(col, null);
    else onSort(col, dir);
    onClose();
  };
  // 드래그 — 마우스 Y 좌표 기반으로 삽입 위치 계산 (최상단 이동 포함)
  const onDragStart = useCallback((e: React.DragEvent, i: number) => {
    dragIdx.current = i;
    e.dataTransfer.effectAllowed = "move";
  }, []);
  const onDragOver = useCallback((e: React.DragEvent, i: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // 아이템 상반부에 올리면 해당 위치 앞으로, 하반부면 뒤로
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const dropIdx = e.clientY < mid ? i : i + 1;
    setDragOverIdx(dropIdx);
  }, []);
  const onDragLeave = useCallback(() => setDragOverIdx(null), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIdx.current;
    let to = dragOverIdx;
    setDragOverIdx(null);
    if (from === null || to === null || from === to || from === to - 1) { dragIdx.current = null; return; }
    orderManuallyChanged.current = true;
    setTempOrder(prev => {
      const arr = [...prev];
      const [m] = arr.splice(from, 1);
      const insertAt = to > from ? to - 1 : to;
      arr.splice(insertAt, 0, m);
      return arr;
    });
    dragIdx.current = null;
  }, [dragOverIdx]);
  const onDragEnd = useCallback(() => { dragIdx.current = null; setDragOverIdx(null); }, []);
  const moveItem = (from: number, dir: number) => {
    const to = from + dir;
    if (to < 0 || to >= tempOrder.length) return;
    orderManuallyChanged.current = true;
    setTempOrder(prev => { const arr = [...prev]; [arr[from], arr[to]] = [arr[to], arr[from]]; return arr; });
  };

  const ascLabel = col === "due" ? "빠른 날짜순 정렬" : "오름차순 정렬 (ㄱ→ㅎ)";
  const descLabel = col === "due" ? "늦은 날짜순 정렬" : "내림차순 정렬 (ㅎ→ㄱ)";
  const itemMap = Object.fromEntries(allValues.map(v => [v.key, v]));
  const hoverBg = (e: React.MouseEvent, bg: string) => { (e.currentTarget as HTMLElement).style.background = bg; };

  return createPortal(
    <div ref={ref} style={{
      position: "fixed", top, left, zIndex: 9999,
      background: "#fff", border: "1px solid #dadce0", borderRadius: 8,
      boxShadow: "0 4px 16px rgba(0,0,0,.15)", width: ddW,
      fontFamily: "'Pretendard', system-ui, sans-serif", fontSize: 13, color: "#1f1f1f",
    }}>

      {/* ── 1. 정렬 섹션 ── */}
      <div style={{ padding: "4px 0", borderBottom: "1px solid #e8eaed" }}>
        {[["asc", ascLabel, "↑"], ["desc", descLabel, "↓"]].map(([dir, lbl, icon]) => (
          <div key={dir}
            onClick={() => applySort(dir as "asc" | "desc")}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 16px",
              cursor: "pointer", fontSize: 13,
              color: currentSortDir === dir ? "#1a73e8" : "#1f1f1f",
              fontWeight: currentSortDir === dir ? 600 : 400,
            }}
            onMouseEnter={e => hoverBg(e, "#f1f3f4")} onMouseLeave={e => hoverBg(e, "transparent")}
          >
            <span style={{ width: 18, textAlign: "center" as const, fontSize: 14, color: "#5f6368" }}>{icon}</span>
            {lbl}
          </div>
        ))}
      </div>

      {/* ── 2. 값별 필터 (체크박스) ── */}
      <div style={{ borderBottom: "1px solid #e8eaed" }}>
        <div style={{ padding: "8px 12px" }}>
          <input type="text" placeholder="검색" value={search}
            onChange={e => setSearch(e.target.value)} autoFocus
            style={{ width: "100%", padding: "6px 10px", border: "1px solid #dadce0", borderRadius: 4, font: "inherit", fontSize: 12, outline: "none", fontFamily: "inherit" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#1a73e8"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,115,232,.15)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#dadce0"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, padding: "2px 16px 6px", fontSize: 11 }}>
          <span onClick={selectAll} style={{ color: "#1a73e8", cursor: "pointer", fontWeight: 500 }}>모두 선택</span>
          <span style={{ color: "#5f6368" }}>-</span>
          <span onClick={clearAll} style={{ color: "#1a73e8", cursor: "pointer", fontWeight: 500 }}>지우기</span>
          <span style={{ marginLeft: "auto", color: "#5f6368", fontSize: 10 }}>{filtered.length}개</span>
        </div>
        <div style={{ maxHeight: 200, overflowY: "auto" as const, padding: "2px 0" }}>
          {filtered.map(v => {
            const checked = allChecked || tempSelected.includes(v.key);
            return (
              <label key={v.key}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 16px", cursor: "pointer", fontSize: 12 }}
                onMouseEnter={e => hoverBg(e, "#f1f3f4")} onMouseLeave={e => hoverBg(e, "transparent")}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleVal(v.key)}
                  style={{ width: 14, height: 14, accentColor: "#1a73e8", cursor: "pointer" }} />
                {v.color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, flexShrink: 0 }} />}
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{v.label}</span>
                <span style={{ fontSize: 10, color: "#5f6368" }}>{v.count}</span>
              </label>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", textAlign: "center" as const }}>일치하는 항목 없음</div>
          )}
        </div>
      </div>

      {/* ── 3. 사용자 지정 순서 (체크된 항목만) ── */}
      {onCustomOrderChange && checkedKeys.length > 1 && (
        <div style={{ borderBottom: "1px solid #e8eaed" }}>
          <div
            onClick={() => setShowOrder(p => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
              cursor: "pointer", fontSize: 12, color: showOrder ? "#1a73e8" : "#5f6368", fontWeight: 500,
            }}
            onMouseEnter={e => hoverBg(e, "#f1f3f4")} onMouseLeave={e => hoverBg(e, "transparent")}
          >
            {showOrder
              ? <ChevronDownIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
              : <ChevronRightIcon style={{ width: 12, height: 12, flexShrink: 0 }} />}
            사용자 지정 순서 ({checkedKeys.length}개)
          </div>
          {showOrder && (
            <div>
              <div style={{ maxHeight: 160, overflowY: "auto" as const, padding: "2px 0" }}>
                {tempOrder.map((key, i) => {
                  const item = itemMap[key];
                  if (!item) return null;
                  return (
                    <div key={key} draggable
                      onDragStart={e => onDragStart(e, i)}
                      onDragOver={e => onDragOver(e, i)}
                      onDragLeave={onDragLeave}
                      onDrop={e => onDrop(e)}
                      onDragEnd={onDragEnd}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                        cursor: "grab", fontSize: 12, userSelect: "none" as const,
                        // 삽입 위치 표시 — 위쪽(i) 또는 아래쪽(i+1)
                        borderTop: dragOverIdx === i ? "2px solid #1a73e8" : "2px solid transparent",
                        borderBottom: dragOverIdx === i + 1 && i === tempOrder.length - 1 ? "2px solid #1a73e8" : "none",
                        background: dragOverIdx === i || dragOverIdx === i + 1 ? "#e8f0fe" : "transparent",
                        opacity: dragIdx.current === i ? 0.4 : 1,
                      }}
                      onMouseEnter={e => { if (dragOverIdx === null) hoverBg(e, "#f8fafc"); }}
                      onMouseLeave={e => { if (dragOverIdx === null) hoverBg(e, "transparent"); }}
                    >
                      <span style={{ color: "#cbd5e1", fontSize: 12, lineHeight: 1, flexShrink: 0 }}>⠿</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", width: 14, textAlign: "center" as const, flexShrink: 0 }}>{i + 1}</span>
                      {item.color && <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, flexShrink: 0 }} />}
                      <span style={{ flex: 1, fontWeight: 500, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.label}</span>
                      <span style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                        <button disabled={i === 0} onClick={e => { e.stopPropagation(); moveItem(i, -1); }}
                          style={{ width: 16, height: 16, border: "none", background: i === 0 ? "transparent" : "#f1f5f9", borderRadius: 3, cursor: i === 0 ? "default" : "pointer", fontSize: 9, color: i === 0 ? "#e2e8f0" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", padding: 0 }}>▲</button>
                        <button disabled={i === tempOrder.length - 1} onClick={e => { e.stopPropagation(); moveItem(i, 1); }}
                          style={{ width: 16, height: 16, border: "none", background: i === tempOrder.length - 1 ? "transparent" : "#f1f5f9", borderRadius: 3, cursor: i === tempOrder.length - 1 ? "default" : "pointer", fontSize: 9, color: i === tempOrder.length - 1 ? "#e2e8f0" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", padding: 0 }}>▼</button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "4px 12px 6px", fontSize: 10, color: "#94a3b8", textAlign: "center" as const }}>
                순서를 변경한 뒤 확인을 누르면 적용됩니다
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. 하단 버튼 ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "8px 12px" }}>
        <button onClick={onClose}
          style={{ padding: "6px 16px", borderRadius: 4, font: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "none", border: "1px solid #dadce0", color: "#1f1f1f", fontFamily: "inherit" }}
          onMouseEnter={e => hoverBg(e, "#f1f3f4")} onMouseLeave={e => hoverBg(e, "none")}
        >취소</button>
        <button onClick={confirm}
          style={{ padding: "6px 16px", borderRadius: 4, font: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#1a73e8", border: "1px solid #1a73e8", color: "#fff", fontFamily: "inherit" }}
          onMouseEnter={e => hoverBg(e, "#1557b0")} onMouseLeave={e => hoverBg(e, "#1a73e8")}
        >확인</button>
      </div>
    </div>,
    document.body
  );
}
