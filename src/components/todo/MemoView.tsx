import React, { useState, useRef, useEffect } from "react";
import { Todo, Project, DatePopState } from "../../types";
import { isOD, dDay, fD } from "../../utils";
import { avColor, avColor2, avInitials } from "../../utils/avatarUtils";
import { ListBulletIcon, CalendarIcon, FolderIcon, StarIcon, StarOutlineIcon, CheckIcon, XMarkIcon, TrashIcon, ICON_SM } from "../ui/Icons";
import { DateTimePicker } from "../editor/DateTimePicker";

interface MemoViewProps {
  sorted: Todo[];
  showDone: boolean;
  setShowDone: (fn: any) => void;
  gPr: (pid: number) => Project;
  aProj: Project[];
  members: string[];
  pris: string[];
  stats: string[];
  priC: Record<string, string>;
  priBg: Record<string, string>;
  stC: Record<string, string>;
  stBg: Record<string, string>;
  updTodo: (id: number, patch: Partial<Todo>) => void;
  addTodo: (t: any) => void;
  currentUser: string;
  cols?: number;
  delTodo: (id: number) => void;
  isFav: (id: number) => boolean;
  toggleFav: (id: number) => void;
  flash: (msg: string, type?: string) => void;
  setDatePop: (v: DatePopState | null) => void;
  memberColors?: Record<string, string>;
}

const NOTE_PALETTE = [
  { bg: "#fff9c4", header: "#fff176", border: "#f0d800" },
  { bg: "#ffd6e0", header: "#ffb3c6", border: "#ff85a1" },
  { bg: "#e8d5f5", header: "#d4b0f0", border: "#b97fe8" },
  { bg: "#c9e4ff", header: "#a8d4ff", border: "#74b8ff" },
  { bg: "#e8e8e8", header: "#d4d4d4", border: "#b0b0b0" },
];
const getNote = (t: { noteColor?: number }) => NOTE_PALETTE[t.noteColor ?? 0];

type DropType = { id: number; field: string } | null;
type InsertPos = number | "end" | null;

// 안드로이드 아이콘 드래그 스타일 — 놓을 위치 미리 보기
function PlaceholderCard() {
  return (
    <div style={{
      minHeight: 240,
      border: "2.5px dashed #2563eb",
      borderRadius: 6,
      background: "rgba(37,99,235,0.07)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      boxSizing: "border-box" as const,
      animation: "memo-ph-pulse 1.1s ease-in-out infinite",
      pointerEvents: "none" as const,
    }}>
      <ListBulletIcon style={{ width: 24, height: 24, opacity: 0.35 }} />
      <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, opacity: 0.7, letterSpacing: 0.2 }}>여기에 놓기</span>
    </div>
  );
}

function MemoCard({
  t, gPr, aProj, members, pris, stats,
  priC, priBg, stC, stBg,
  updTodo, delTodo, isFav, toggleFav, flash,
  setDatePop, memberColors = {},
  openDrop, setOpenDrop,
  isDragging,
  onHeaderDragStart,
  onCardDragOver,
  onCardDrop,
  onCardDragEnd,
}: {
  t: Todo;
  gPr: (pid: number) => Project;
  aProj: Project[];
  members: string[];
  pris: string[];
  stats: string[];
  priC: Record<string, string>;
  priBg: Record<string, string>;
  stC: Record<string, string>;
  stBg: Record<string, string>;
  updTodo: (id: number, patch: Partial<Todo>) => void;
  delTodo: (id: number) => void;
  isFav: (id: number) => boolean;
  toggleFav: (id: number) => void;
  flash: (msg: string, type?: string) => void;
  setDatePop: (v: DatePopState | null) => void;
  memberColors?: Record<string, string>;
  openDrop: DropType;
  setOpenDrop: (v: DropType) => void;
  isDragging: boolean;
  onHeaderDragStart: () => void;
  onCardDragOver: (e: React.DragEvent) => void;
  onCardDrop: (e: React.DragEvent) => void;
  onCardDragEnd: () => void;
}) {
  // 담당자 아바타 배경색 — 설정에서 커스텀 색상 우선, 없으면 자동 그라디언트
  const mAvBg = (name: string) => memberColors[name] || `linear-gradient(135deg,${avColor(name)},${avColor2(name)})`;
  const note = getNote(t);
  const p = gPr(t.pid);
  const od = isOD(t.due, t.st);
  const dd = dDay(t.due, t.st);

  // 메타 배지 공통 스타일 — 높이·폰트·정렬을 완전히 통일
  const badgeBase: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, padding: "0 6px",
    borderRadius: 99, height: 20, lineHeight: "20px",
    display: "inline-flex", alignItems: "center", gap: 2,
    boxSizing: "border-box", whiteSpace: "nowrap", cursor: "pointer",
    border: "1px solid transparent",
  };
  const isDone = t.st === "완료";
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = t.det || "";
    }
  }, [t.id]);

  const isOpen = (field: string) => openDrop?.id === t.id && openDrop?.field === field;
  const toggle = (field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDrop(isOpen(field) ? null : { id: t.id, field });
  };

  const cmd = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, undefined);
    if (editorRef.current) updTodo(t.id, { det: editorRef.current.innerHTML });
  };

  // 체크박스 서식 토글 — 불릿/넘버링과 동일한 토글 방식
  const toggleCheckList = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer as Node;
    const root = ancestor.nodeType === 3 ? ancestor.parentElement! : ancestor as HTMLElement;
    const list = root.closest('ul, ol');
    // 이미 체크박스 ul이면 → 일반 텍스트로 해제
    if (list && list.tagName === 'UL' && list.querySelector('input[type="checkbox"]')) {
      const items = Array.from(list.querySelectorAll('li'));
      const texts = items.map(li => { const span = li.querySelector('span'); return span ? span.textContent || '' : li.textContent || ''; }).filter(t => t && t !== '\u200b');
      list.outerHTML = texts.map(t => `<div>${t || '\u200b'}</div>`).join('') || '<div>\u200b</div>';
      updTodo(t.id, { det: el.innerHTML });
      return;
    }
    // 불릿/넘버링이면 먼저 해제
    if (list) {
      if (list.tagName === 'UL') document.execCommand('insertUnorderedList', false, undefined);
      else document.execCommand('insertOrderedList', false, undefined);
    }
    const makeLi = (text: string) =>
      `<li><label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" style="width:14px;height:14px;accent-color:#2563eb;cursor:pointer;flex-shrink:0"/> <span>${text || '\u200b'}</span></label></li>`;
    const selectedText = sel.toString();
    if (selectedText.trim()) {
      const lines = selectedText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
      document.execCommand('insertHTML', false, `<ul style="list-style:none;padding-left:4px;margin:4px 0">${lines.map(makeLi).join('')}</ul>`);
    } else {
      document.execCommand('insertHTML', false, `<ul style="list-style:none;padding-left:4px;margin:4px 0">${makeLi('')}</ul>`);
    }
    updTodo(t.id, { det: el.innerHTML });
  };

  const dropStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300,
    background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8,
    boxShadow: "0 6px 20px rgba(0,0,0,.13)", minWidth: 140, padding: "4px 0",
  };
  const dropItem = (active: boolean): React.CSSProperties => ({
    padding: "7px 12px", fontSize: 11, cursor: "pointer",
    background: active ? "#eff6ff" : "transparent",
    color: active ? "#2563eb" : "#334155",
    fontWeight: active ? 700 : 400,
    display: "flex", alignItems: "center", gap: 6,
  });

  return (
    <div
      onDragOver={onCardDragOver}
      onDrop={onCardDrop}
      style={{
        display: "flex", flexDirection: "column",
        background: note.bg, border: `1.5px solid ${isDone ? "#e2e8f0" : note.border}`,
        borderRadius: 6, overflow: "hidden",
        opacity: isDragging ? 0.28 : isDone ? 0.75 : 1,
        filter: isDone ? "saturate(0.3)" : "none",
        boxShadow: isDone ? "none" : isDragging ? "0 8px 24px rgba(37,99,235,.22)" : "2px 4px 12px rgba(0,0,0,.1)",
        minHeight: 240, transition: "box-shadow .15s, opacity .2s",
        outline: isDragging ? "2px solid #2563eb" : "none",
        outlineOffset: -1,
      }}
      onMouseEnter={e => { if (!isDone && !isDragging) (e.currentTarget as HTMLDivElement).style.boxShadow = "3px 6px 20px rgba(0,0,0,.16)"; }}
      onMouseLeave={e => { if (!isDone && !isDragging) (e.currentTarget as HTMLDivElement).style.boxShadow = "2px 4px 12px rgba(0,0,0,.1)"; }}
    >
      {/* ── 헤더 바 (드래그 핸들) ── */}
      <div
        draggable
        onDragStart={e => {
          e.stopPropagation();
          onHeaderDragStart();
          e.dataTransfer.effectAllowed = "move";
          // 드래그 고스트 이미지: 카드 전체
          const card = (e.currentTarget as HTMLElement).closest("[data-memocard]") as HTMLElement;
          if (card) {
            e.dataTransfer.setDragImage(card, card.offsetWidth / 2, 20);
          }
        }}
        onDragEnd={onCardDragEnd}
        style={{
          background: isDone ? "#f1f5f9" : note.header,
          padding: "6px 8px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4,
          borderBottom: `1px solid ${isDone ? "#e2e8f0" : note.border}`,
          flexWrap: "wrap", rowGap: 4,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none" as const,
        }}
        title="드래그하여 순서 변경"
      >
        {/* 드래그 핸들 아이콘 */}
        <span style={{ fontSize: 14, color: "rgba(0,0,0,0.3)", letterSpacing: "-1px", marginRight: 2, flexShrink: 0, padding: "2px 4px", cursor: "grab" }}>⠿⠿</span>

        {/* 메타 배지들 */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", flex: 1 }}>
          {/* 프로젝트 */}
          <div style={{ position: "relative" }}>
            <span onClick={e => toggle("proj", e)} style={{ ...badgeBase, fontWeight: 700, background: p.id ? p.color + "33" : "rgba(0,0,0,.08)", color: p.id ? p.color : "#64748b" }}>
              {p.id ? p.name : <><FolderIcon style={{width:10,height:10,flexShrink:0}} /> ▾</>}
            </span>
            {isOpen("proj") && (
              <div style={dropStyle} onClick={e => e.stopPropagation()}>
                <div style={dropItem(!t.pid)} onClick={() => { updTodo(t.id, { pid: 0 }); setOpenDrop(null); }}>미배정</div>
                {aProj.map(pr => (
                  <div key={pr.id} style={dropItem(t.pid === pr.id)} onClick={() => { updTodo(t.id, { pid: pr.id }); setOpenDrop(null); }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: pr.color, display: "inline-block", flexShrink: 0 }} />{pr.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 마감기한 */}
          <div style={{ position: "relative" }}>
            <span onClick={e => {
              e.stopPropagation();
              // 공통 DateTimePicker를 열기 위해 클릭한 요소의 위치 정보 전달
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setDatePop({ id: t.id, rect, value: t.due || "" });
              setOpenDrop(null);
            }} style={{ display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer", whiteSpace: "nowrap" }}>
              <span style={{ ...badgeBase, background: od ? "#fee2e2" : "rgba(0,0,0,.08)", color: od ? "#dc2626" : "#64748b" }}>
                <CalendarIcon style={{width:10,height:10,flexShrink:0}} /> {t.due ? fD(t.due) : "▾"}
              </span>
              {t.due && dd && (
                <span style={{ ...badgeBase, fontWeight: 700, background: dd.bg, color: dd.color, borderColor: dd.border }}>
                  {dd.label}
                </span>
              )}
            </span>
          </div>

          {/* 우선순위 */}
          <div style={{ position: "relative" }}>
            <span onClick={e => toggle("pri", e)} style={{ ...badgeBase, background: priBg[t.pri] ? priBg[t.pri] + "cc" : "rgba(0,0,0,.08)", color: priC[t.pri] || "#64748b" }}>
              {t.pri} ▾
            </span>
            {isOpen("pri") && (
              <div style={dropStyle} onClick={e => e.stopPropagation()}>
                {pris.map(pr => (
                  <div key={pr} style={dropItem(t.pri === pr)} onClick={() => { updTodo(t.id, { pri: pr }); setOpenDrop(null); }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: priC[pr] || "#94a3b8", display: "inline-block", flexShrink: 0 }} />{pr}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 상태 */}
          <div style={{ position: "relative" }}>
            <span onClick={e => toggle("st", e)} style={{ ...badgeBase, background: stBg[t.st] ? stBg[t.st] + "cc" : "rgba(0,0,0,.08)", color: stC[t.st] || "#64748b" }}>
              {t.st} ▾
            </span>
            {isOpen("st") && (
              <div style={dropStyle} onClick={e => e.stopPropagation()}>
                {stats.map(s => (
                  <div key={s} style={dropItem(t.st === s)} onClick={() => { updTodo(t.id, { st: s }); setOpenDrop(null); }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: stC[s] || "#94a3b8", display: "inline-block", flexShrink: 0 }} />{s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 색상 선택 */}
        <div style={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <button onClick={e => toggle("color", e)} title="색상 변경"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "0 4px", color: "#64748b", lineHeight: 1, letterSpacing: 0, height: 20, display: "inline-flex", alignItems: "center", boxSizing: "border-box" as const }}>···</button>
            {isOpen("color") && (
              <div style={{ ...dropStyle, right: 0, left: "auto", minWidth: "auto", padding: "8px 10px", display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                {NOTE_PALETTE.map((c, i) => (
                  <button key={i} onClick={() => { updTodo(t.id, { noteColor: i }); setOpenDrop(null); }}
                    title={["노랑","핑크","라벤더","파랑","회색"][i]}
                    style={{ width: 18, height: 18, borderRadius: "50%", background: c.header, border: (t.noteColor ?? 0) === i ? "2px solid #334155" : "1.5px solid rgba(0,0,0,.15)", cursor: "pointer", padding: 0, flexShrink: 0, transition: "transform .1s" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 업무내용 ── */}
      <div data-memocard style={{ padding: "8px 10px 2px" }}>
        <textarea
          defaultValue={t.task}
          disabled={isDone}
          rows={1}
          onBlur={e => { const v = e.target.value.trim(); if (v && v !== t.task) updTodo(t.id, { task: v }); else if (!v) e.target.value = t.task; }}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            resize: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
            color: isDone ? "#94a3b8" : "#1a2332", lineHeight: 1.4,
            textDecoration: isDone ? "line-through" : "none",
            cursor: isDone ? "default" : "text", boxSizing: "border-box", padding: 0,
            overflow: "hidden",
          }}
          onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
        />
      </div>

      {/* ── 내용 (contentEditable) ── */}
      <div
        ref={editorRef}
        contentEditable={!isDone}
        suppressContentEditableWarning
        onInput={() => { if (editorRef.current) updTodo(t.id, { det: editorRef.current.innerHTML }); }}
        data-placeholder="상세내용 입력"
        style={{
          flex: 1, padding: "4px 10px 6px 14px", fontSize: 12, lineHeight: 1.7,
          outline: "none", fontFamily: "inherit", color: "#334155",
          minHeight: 80, cursor: isDone ? "default" : "text",
          overflowY: "auto",
        }}
      />

      {/* ── 하단 서식 툴바 ── */}
      {!isDone && (
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          padding: "2px 4px", borderTop: `1px solid ${note.border}`,
          background: note.header,
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 8px", border: "none", borderRadius: 6, cursor: "pointer", color: "#334155", fontFamily: "serif" }}
            onMouseDown={e => { e.preventDefault(); cmd("bold"); }}>B</span>
          <span style={{ fontSize: 11, fontStyle: "italic", padding: "2px 4px", border: "none", borderRadius: 4, cursor: "pointer", color: "#334155", fontFamily: "serif" }}
            onMouseDown={e => { e.preventDefault(); cmd("italic"); }}>I</span>
          <span style={{ fontSize: 11, textDecoration: "underline", padding: "2px 4px", border: "none", borderRadius: 4, cursor: "pointer", color: "#334155", fontFamily: "serif" }}
            onMouseDown={e => { e.preventDefault(); cmd("underline"); }}>U</span>
          <span style={{ fontSize: 11, textDecoration: "line-through", padding: "2px 4px", border: "none", borderRadius: 4, cursor: "pointer", color: "#334155", fontFamily: "serif" }}
            onMouseDown={e => { e.preventDefault(); cmd("strikeThrough"); }}>S</span>
          <span title="번호 목록" style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, cursor: "pointer", color: "#334155", fontFamily: "inherit" }}
            onMouseDown={e => { e.preventDefault(); cmd("insertOrderedList"); }}>1≡</span>
          <span title="불릿 목록" style={{ fontSize: 13, padding: "2px 4px", borderRadius: 4, cursor: "pointer", color: "#334155" }}
            onMouseDown={e => { e.preventDefault(); cmd("insertUnorderedList"); }}>•≡</span>
          {/* 체크박스 목록 — 네모 체크 서식 삽입 */}
          <span title="체크박스 목록" style={{ fontSize: 11, padding: "2px 5px", borderRadius: 4, cursor: "pointer", color: "#334155", display: "inline-flex", alignItems: "center", gap: 3 }}
            onMouseDown={e => { e.preventDefault(); toggleCheckList(); }}>
            <span style={{ width: 11, height: 11, border: "1.5px solid #334155", borderRadius: 2, display: "inline-block", flexShrink: 0 }}/>
          </span>

          <div style={{ width: 1, height: 14, background: note.border, margin: "0 3px" }} />

          {/* 담당자 — 리스트뷰와 동일하게 avColor/avColor2/avInitials 사용 */}
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <div onClick={e => toggle("who", e)} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: mAvBg(t.who?.[0]||""), color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.5px" }}>
                {avInitials(t.who?.[0] || "?")}
              </span>
              <span style={{ fontSize: 10, color: "#475569" }}>{t.who?.[0] || "미배정"} ▾</span>
            </div>
            {isOpen("who") && (
              <div style={{ ...dropStyle, bottom: "calc(100% + 4px)", top: "auto", left: "auto", right: 0 }} onClick={e => e.stopPropagation()}>
                {members.map(m => (
                  <div key={m} style={dropItem((t.who||[]).includes(m))} onClick={() => { updTodo(t.id, { who: [m] }); setOpenDrop(null); }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: mAvBg(m), color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.5px" }}>{avInitials(m)}</span>
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 14, background: note.border, margin: "0 3px" }} />

          <button onClick={() => toggleFav(t.id)} title={isFav(t.id) ? "즐겨찾기 해제" : "즐겨찾기"}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px", color: isFav(t.id) ? "#f59e0b" : "#94a3b8", lineHeight: 1 }}>
            {isFav(t.id) ? <StarIcon style={{width:13,height:13}}/> : <StarOutlineIcon style={{width:13,height:13}}/>}
          </button>
          <button onClick={() => { updTodo(t.id, { st: "완료" }); flash("완료 처리되었습니다"); }} title="완료"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "2px 4px", color: "#16a34a", lineHeight: 1, display: "inline-flex", alignItems: "center" }}><CheckIcon style={{width:12,height:12}}/></button>
          <button onClick={() => { if (confirm("삭제하시겠습니까?")) { delTodo(t.id); flash("업무가 삭제되었습니다", "err"); } }} title="삭제"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "2px 4px", color: "#dc2626", lineHeight: 1, display: "inline-flex", alignItems: "center" }}><XMarkIcon style={{width:12,height:12}}/></button>
        </div>
      )}

      {/* 완료 시 하단 바 */}
      {isDone && (
        <div style={{ padding: "4px 8px 6px", display: "flex", alignItems: "center", gap: 4, borderTop: "1px solid #e2e8f0", background: "#f1f5f9" }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: mAvBg(t.who?.[0]||""), color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 6, fontWeight: 700, letterSpacing: "-0.5px" }}>{avInitials(t.who?.[0] || "?")}</span>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>{t.who?.[0] || "미배정"}</span>
          <button onClick={() => toggleFav(t.id)} title={isFav(t.id) ? "즐겨찾기 해제" : "즐겨찾기"}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px", color: isFav(t.id) ? "#f59e0b" : "#94a3b8", lineHeight: 1, marginLeft: "auto" }}>
            {isFav(t.id) ? <StarIcon style={{width:13,height:13}}/> : <StarOutlineIcon style={{width:13,height:13}}/>}
          </button>
          <button onClick={() => { if (confirm("삭제하시겠습니까?")) { delTodo(t.id); flash("업무가 삭제되었습니다", "err"); } }} title="삭제"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "2px 4px", color: "#dc2626", lineHeight: 1, display: "inline-flex", alignItems: "center" }}><XMarkIcon style={{width:12,height:12}}/></button>
        </div>
      )}
    </div>
  );
}

function AddCard({ addTodo, currentUser, flash, onDragOver, onDrop, aProj, members, pris, stats, priC, priBg, stC, stBg, memberColors = {} }: {
  addTodo: (t: any) => void;
  currentUser: string;
  flash: (m: string, t?: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  aProj: Project[];
  members: string[];
  pris: string[];
  stats: string[];
  priC: Record<string, string>;
  priBg: Record<string, string>;
  stC: Record<string, string>;
  stBg: Record<string, string>;
  memberColors?: Record<string, string>;
}) {
  // 담당자 아바타 배경색 — 설정에서 커스텀 색상 우선
  const mAvBg = (name: string) => memberColors[name] || `linear-gradient(135deg,${avColor(name)},${avColor2(name)})`;
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // 상세내용 입력 ref — contentEditable 사용 (MemoCard 상세내용과 동일한 방식)
  const detRef = useRef<HTMLDivElement>(null);

  // 신규 카드 초안 필드 — 열릴 때 기본값으로 초기화, 저장 시 addTodo로 전달
  const [pid, setPid] = useState(0);
  const [who, setWho] = useState(currentUser || "미배정");
  const [pri, setPri] = useState("보통");
  const [st, setSt] = useState("대기");
  const [due, setDue] = useState("");
  // 헤더 배지 드롭다운 — 한 번에 하나만 열림
  const [openField, setOpenField] = useState<string | null>(null);
  // 마감기한 DateTimePicker — AddCard 전용 로컬 상태
  const [localDatePop, setLocalDatePop] = useState<DatePopState | null>(null);

  // 카드 열릴 때 초안 필드 초기화 (담당자는 현재 사용자 기본값)
  const activate = () => {
    setPid(0);
    setWho(currentUser || members[0] || "미배정");
    setPri(pris.includes("보통") ? "보통" : pris[0] || "보통");
    setSt(stats.includes("대기") ? "대기" : stats[0] || "대기");
    setDue("");
    setOpenField(null);
    setActive(true);
    // 상세내용 초기화
    if (detRef.current) detRef.current.innerHTML = "";
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const save = () => {
    const v = inputRef.current?.value.trim();
    if (!v) { setActive(false); return; }
    const det = detRef.current?.innerHTML || "";
    addTodo({ task: v, who: who || "미배정", pid, due, pri, st, det, repeat: "없음" });
    flash("업무가 추가되었습니다");
    setActive(false);
  };

  const cancel = () => {
    setOpenField(null);
    setActive(false);
  };

  // MemoCard와 동일한 배지 기본 스타일 — 높이·폰트·정렬 통일
  const badgeBase: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, padding: "0 6px",
    borderRadius: 99, height: 20, lineHeight: "20px",
    display: "inline-flex", alignItems: "center", gap: 2,
    boxSizing: "border-box", whiteSpace: "nowrap", cursor: "pointer",
    border: "1px solid transparent",
  };

  // MemoCard와 동일한 드롭다운 스타일
  const dropStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 400,
    background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8,
    boxShadow: "0 6px 20px rgba(0,0,0,.13)", minWidth: 140, padding: "4px 0",
  };
  const dropItem = (isActive: boolean): React.CSSProperties => ({
    padding: "7px 12px", fontSize: 11, cursor: "pointer",
    background: isActive ? "#eff6ff" : "transparent",
    color: isActive ? "#2563eb" : "#334155",
    fontWeight: isActive ? 700 : 400,
    display: "flex", alignItems: "center", gap: 6,
    // 프로젝트명 등 긴 텍스트가 줄바꿈되지 않도록
    whiteSpace: "nowrap",
  });

  // 선택된 프로젝트 객체
  const selProj = aProj.find(p => p.id === pid);

  if (!active) return (
    <div
      onClick={activate}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ minHeight: 240, border: "2px dashed #cbd5e1", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", color: "#94a3b8", transition: "all .15s", background: "transparent" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLDivElement).style.color = "#2563eb"; (e.currentTarget as HTMLDivElement).style.background = "#f0f7ff"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#cbd5e1"; (e.currentTarget as HTMLDivElement).style.color = "#94a3b8"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>＋</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>추가하기</span>
    </div>
  );

  // 활성 카드: 흰 배경 + 파란 테두리 — 기존 메모 카드(색상 배경)와 명확히 구분되는 "신규 입력" 모드
  return (
    <div
      style={{ minHeight: 240, border: "2px solid #2563eb", borderRadius: 6, display: "flex", flexDirection: "column", background: "#fff", boxShadow: "0 4px 20px rgba(37,99,235,.15)", overflow: "hidden" }}
      onClick={() => setOpenField(null)}
    >
      {/* AddCard 전용 DateTimePicker — 마감기한 선택 */}
      <DateTimePicker
        datePop={localDatePop}
        onSave={(_, val) => { setDue(val); setLocalDatePop(null); }}
        onClose={() => setLocalDatePop(null)}
      />

      {/* ── 헤더: "신규" 뱃지 + 메타 필드 배지들 ── */}
      {/* 흰 카드의 헤더는 연파랑으로 — 색상 카드 헤더(노랑/핑크 등)와 확실히 다른 톤 */}
      <div style={{ background: "#eff6ff", padding: "6px 8px", display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", borderBottom: "1px solid #dbeafe" }}>

        {/* 신규 표시 배지 — 이 카드가 작성 중임을 시각적으로 명시 */}
        <span style={{ fontSize: 9, fontWeight: 800, color: "#2563eb", background: "#dbeafe", borderRadius: 4, padding: "1px 5px", letterSpacing: 0.3, marginRight: 2, flexShrink: 0 }}>
          신규
        </span>

        {/* 프로젝트 선택 */}
        <div style={{ position: "relative" }}>
          <span
            onClick={e => { e.stopPropagation(); setOpenField(openField === "proj" ? null : "proj"); }}
            style={{ ...badgeBase, fontWeight: 700, background: selProj ? selProj.color + "33" : "rgba(0,0,0,.07)", color: selProj ? selProj.color : "#64748b" }}
          >
            {selProj ? selProj.name : <><FolderIcon style={{ width: 10, height: 10, flexShrink: 0 }} /> ▾</>}
          </span>
          {openField === "proj" && (
            <div style={dropStyle} onClick={e => e.stopPropagation()}>
              <div style={dropItem(!pid)} onClick={() => { setPid(0); setOpenField(null); }}>미배정</div>
              {aProj.map(pr => (
                <div key={pr.id} style={dropItem(pid === pr.id)} onClick={() => { setPid(pr.id); setOpenField(null); }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: pr.color, display: "inline-block", flexShrink: 0 }} />
                  {pr.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 마감기한 — DateTimePicker 연동 (항상 아래 방향으로 열리도록 rect.bottom 상한 적용) */}
        <span
          onClick={e => {
            e.stopPropagation();
            const raw = (e.currentTarget as HTMLElement).getBoundingClientRect();
            // AddCard는 그리드 맨 끝에 위치해 화면 하단에 있는 경우가 많음
            // DateTimePicker는 rect.bottom+4 위치에서 팝업을 열고, 공간 부족 시 위로 열림
            // bottom을 뷰포트 40% 이내로 제한 → 항상 아래 방향으로 팝업이 열림
            const bottom = Math.min(raw.bottom, window.innerHeight * 0.4);
            const adjRect = { ...raw.toJSON(), top: bottom - raw.height, bottom } as unknown as DOMRect;
            setLocalDatePop({ id: 0, rect: adjRect, value: due });
            setOpenField(null);
          }}
          style={{ ...badgeBase, background: due ? "#dbeafe" : "rgba(0,0,0,.07)", color: due ? "#2563eb" : "#64748b" }}
        >
          <CalendarIcon style={{ width: 10, height: 10, flexShrink: 0 }} />
          {due ? fD(due) : "날짜 ▾"}
        </span>

        {/* 우선순위 선택 */}
        <div style={{ position: "relative" }}>
          <span
            onClick={e => { e.stopPropagation(); setOpenField(openField === "pri" ? null : "pri"); }}
            style={{ ...badgeBase, background: priBg[pri] ? priBg[pri] + "cc" : "rgba(0,0,0,.07)", color: priC[pri] || "#64748b" }}
          >
            {pri} ▾
          </span>
          {openField === "pri" && (
            <div style={dropStyle} onClick={e => e.stopPropagation()}>
              {pris.map(pr => (
                <div key={pr} style={dropItem(pri === pr)} onClick={() => { setPri(pr); setOpenField(null); }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: priC[pr] || "#94a3b8", display: "inline-block", flexShrink: 0 }} />
                  {pr}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상태 선택 */}
        <div style={{ position: "relative" }}>
          <span
            onClick={e => { e.stopPropagation(); setOpenField(openField === "st" ? null : "st"); }}
            style={{ ...badgeBase, background: stBg[st] ? stBg[st] + "cc" : "rgba(0,0,0,.07)", color: stC[st] || "#64748b" }}
          >
            {st} ▾
          </span>
          {openField === "st" && (
            <div style={dropStyle} onClick={e => e.stopPropagation()}>
              {stats.map(s => (
                <div key={s} style={dropItem(st === s)} onClick={() => { setSt(s); setOpenField(null); }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: stC[s] || "#94a3b8", display: "inline-block", flexShrink: 0 }} />
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 업무내용 입력 ── */}
      <div style={{ padding: "8px 10px 4px" }}>
        <textarea
          ref={inputRef}
          rows={2}
          placeholder="업무내용을 입력하세요..."
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") cancel(); }}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#1a2332", lineHeight: 1.5, boxSizing: "border-box", padding: 0 }}
        />
      </div>

      {/* ── 구분선 ── */}
      <div style={{ margin: "0 10px", borderTop: "1px dashed #dbeafe" }} />

      {/* ── 상세내용 입력 — MemoCard의 contentEditable 영역과 동일한 방식 ── */}
      <div
        ref={detRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="상세내용 입력"
        style={{ flex: 1, padding: "6px 10px 8px", fontSize: 12, lineHeight: 1.7, outline: "none", fontFamily: "inherit", color: "#334155", minHeight: 60, cursor: "text" }}
        onClick={e => e.stopPropagation()}
      />

      {/* ── 하단: 담당자 + 저장/취소 버튼 ── */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderTop: "1px solid #dbeafe", background: "#eff6ff" }}
        onClick={e => e.stopPropagation()}
      >
        {/* 담당자 선택 — 리스트뷰 아바타 스타일과 통일 (avColor/avColor2/avInitials) */}
        <div style={{ position: "relative", flex: 1 }}>
          <div
            onClick={() => setOpenField(openField === "who" ? null : "who")}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}
          >
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: mAvBg(who), color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.5px" }}>
              {avInitials(who || "?")}
            </span>
            <span style={{ fontSize: 10, color: "#475569" }}>{who || "미배정"} ▾</span>
          </div>
          {openField === "who" && (
            <div style={{ ...dropStyle, bottom: "calc(100% + 4px)", top: "auto", left: 0 }} onClick={e => e.stopPropagation()}>
              {members.map(m => (
                <div key={m} style={dropItem(who === m)} onClick={() => { setWho(m); setOpenField(null); }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: mAvBg(m), color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.5px" }}>{avInitials(m)}</span>
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} style={{ padding: "5px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>추가</button>
        <button onClick={cancel} style={{ padding: "5px 10px", background: "rgba(37,99,235,.08)", color: "#64748b", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>취소</button>
      </div>
    </div>
  );
}

export function MemoView({
  sorted, showDone, setShowDone,
  gPr, aProj, members, pris, stats,
  priC, priBg, stC, stBg,
  updTodo, addTodo, currentUser, cols = 3, delTodo, isFav, toggleFav, flash, setDatePop, memberColors = {},
}: MemoViewProps) {
  const [openDrop, setOpenDrop] = useState<DropType>(null);
  const active = sorted.filter(t => t.st !== "완료");
  const done = sorted.filter(t => t.st === "완료");

  // ── 드래그 순서 ──
  const [dragId, setDragId] = useState<number | null>(null);
  const [insertPos, setInsertPos] = useState<InsertPos>(null);

  // Todo.memoOrder 기준 정렬 (undefined인 카드는 뒤에)
  const orderedActive = [...active].sort((a, b) =>
    (a.memoOrder ?? Infinity) - (b.memoOrder ?? Infinity)
  );

  // 플레이스홀더를 포함한 표시 목록
  type DisplayItem = Todo | { __ph: true };
  const displayItems: DisplayItem[] = (() => {
    if (dragId === null || insertPos === null) return orderedActive;
    if (insertPos === "end") return [...orderedActive, { __ph: true }];
    const idx = orderedActive.findIndex(t => t.id === insertPos);
    if (idx >= 0) {
      return [...orderedActive.slice(0, idx), { __ph: true }, ...orderedActive.slice(idx)];
    }
    return [...orderedActive, { __ph: true }];
  })();

  const handleDragStart = (id: number) => {
    setDragId(id);
    setInsertPos(null);
    document.body.style.cursor = "grabbing";
  };

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (dragId === null || dragId === targetId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isLeft = e.clientX < rect.left + rect.width / 2;
    if (isLeft) {
      if (insertPos !== targetId) setInsertPos(targetId);
    } else {
      // 이 카드 다음 = 다음 카드 앞
      const tIdx = orderedActive.findIndex(t => t.id === targetId);
      let next: InsertPos = "end";
      for (let i = tIdx + 1; i < orderedActive.length; i++) {
        if (orderedActive[i].id !== dragId) { next = orderedActive[i].id; break; }
      }
      if (insertPos !== next) setInsertPos(next);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragId === null) return;

    // undefined 카드에 가상 순서 부여 (fractional indexing 계산용)
    const maxDefined = orderedActive.reduce((m, t) => t.memoOrder != null ? Math.max(m, t.memoOrder) : m, 0);
    let vIdx = 1;
    const withOrder = orderedActive.map(t => ({
      id: t.id,
      ord: t.memoOrder ?? maxDefined + (vIdx++) * 1000,
    }));

    const withoutDrag = withOrder.filter(t => t.id !== dragId);

    let newOrder: number;
    if (insertPos === null || insertPos === "end") {
      const last = withoutDrag[withoutDrag.length - 1];
      newOrder = last ? last.ord + 1000 : 1000;
    } else {
      const insertIdx = withoutDrag.findIndex(t => t.id === insertPos);
      if (insertIdx <= 0) {
        const first = withoutDrag[0];
        newOrder = first ? first.ord - 1000 : 1000;
      } else {
        const prev = withoutDrag[insertIdx - 1];
        const next = withoutDrag[insertIdx];
        newOrder = (prev.ord + next.ord) / 2;
      }
    }

    updTodo(dragId, { memoOrder: newOrder });
    setDragId(null);
    setInsertPos(null);
    document.body.style.cursor = "";
  };

  const handleDragEnd = () => {
    setDragId(null);
    setInsertPos(null);
    document.body.style.cursor = "";
  };

  const cardProps = { gPr, aProj, members, pris, stats, priC, priBg, stC, stBg, updTodo, delTodo, isFav, toggleFav, flash, setDatePop, openDrop, setOpenDrop, memberColors };

  return (
    <div onClick={() => setOpenDrop(null)}>
      {/* 플레이스홀더 펄스 애니메이션 */}
      <style>{`
        @keyframes memo-ph-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(37,99,235,0.25); }
          50% { opacity: 0.75; box-shadow: 0 0 0 6px rgba(37,99,235,0); }
        }
      `}</style>

      <div
        style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}
        onDragOver={e => { if (!(e.target as HTMLElement).closest("[data-memocard]")) e.preventDefault(); }}
        onDrop={handleDrop}
        onDragLeave={e => {
          if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
            setInsertPos(null);
          }
        }}
      >
        {displayItems.map((item) => {
          if ("__ph" in item) {
            return <PlaceholderCard key="__placeholder" />;
          }
          const todo = item as Todo;
          return (
            <MemoCard
              key={todo.id}
              t={todo}
              {...cardProps}
              isDragging={todo.id === dragId}
              onHeaderDragStart={() => handleDragStart(todo.id)}
              onCardDragOver={e => handleDragOver(e, todo.id)}
              onCardDrop={handleDrop}
              onCardDragEnd={handleDragEnd}
            />
          );
        })}
        <AddCard
          addTodo={addTodo}
          currentUser={currentUser}
          flash={flash}
          onDragOver={e => { e.preventDefault(); if (insertPos !== "end") setInsertPos("end"); }}
          onDrop={handleDrop}
          aProj={aProj}
          members={members}
          pris={pris}
          stats={stats}
          priC={priC}
          priBg={priBg}
          stC={stC}
          stBg={stBg}
          memberColors={memberColors}
        />
      </div>

      {done.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div onClick={e => { e.stopPropagation(); setShowDone((p: boolean) => !p); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f0fdf4", borderRadius: 8, cursor: "pointer", marginBottom: showDone ? 14 : 0, border: "1px solid #bbf7d0" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 4 }}><CheckIcon style={{width:12,height:12}}/> 완료됨</span>
            <span style={{ fontSize: 10, color: "#86efac" }}>{done.length}건</span>
            <span style={{ fontSize: 10, color: "#4ade80", marginLeft: "auto" }}>{showDone ? "접기" : "펼치기"}</span>
          </div>
          {showDone && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
              {done.map(t => (
                <MemoCard key={t.id} t={t} {...cardProps}
                  isDragging={false}
                  onHeaderDragStart={() => {}}
                  onCardDragOver={e => e.preventDefault()}
                  onCardDrop={e => e.preventDefault()}
                  onCardDragEnd={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
