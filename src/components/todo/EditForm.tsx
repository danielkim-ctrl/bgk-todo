import { useState, useRef, useEffect } from "react";
import { RichEditor } from "../editor/RichEditor";
import { Project, ActivityLog, Attachment } from "../../types";
import { DocumentTextIcon, ArrowPathIcon, PaperClipIcon, LinkIcon, XMarkIcon, PlusIcon, ICON_SM } from "../ui/Icons";
import { RepeatPicker } from "../ui/RepeatPicker";

// ── 로그 패널 ──────────────────────────────────────────────────────────────────
// 활동 기록 타임라인 + 메모 입력창
function LogPanel({ logs, gPr, onAddComment }: {
  logs: ActivityLog[];
  gPr?: (pid: number) => Project;
  onAddComment?: (text: string) => void;
}) {
  const [comment, setComment] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 최신순으로 정렬
  const reversed = [...logs].reverse();

  // 타임스탬프 → 표시용 문자열
  const fmtAt = (at: string) => {
    const d = new Date(at);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const yest = new Date(now); yest.setDate(yest.getDate() - 1);
    if (isSameDay(d, now)) return `오늘 ${hm}`;
    if (isSameDay(d, yest)) return `어제 ${hm}`;
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hm}`;
  };

  // 이름 첫 글자로 아바타 배경색 결정
  const avatarColor = (name: string) => {
    const palette = ["#2563eb","#16a34a","#d97706","#9333ea","#dc2626","#0d9488","#db2777","#ea580c"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  };

  // 액션 한글 설명
  const actionDesc = (log: ActivityLog) => {
    if (log.action === "create") return "업무를 등록했습니다";
    if (log.action === "complete") return "완료 처리했습니다";
    if (log.action === "reopen") return "완료를 취소했습니다";
    if (log.action === "comment") return "메모를 남겼습니다";
    if (log.changes?.length) {
      const fields = log.changes.map(c => c.field).join(", ");
      return `${fields}을(를) 변경했습니다`;
    }
    return "수정했습니다";
  };

  // pid → 프로젝트 이름 변환
  const resolveVal = (field: string, val: string) => {
    if (field === "프로젝트" && gPr && val && !isNaN(Number(val))) {
      return gPr(Number(val))?.name || val;
    }
    return val || "(없음)";
  };

  const handleSaveComment = () => {
    const text = comment.trim();
    if (!text || !onAddComment) return;
    onAddComment(text);
    setComment("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 로그 목록 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", maxHeight: 340, paddingRight: 2 }}>
        {reversed.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
            아직 활동 기록이 없습니다
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {/* 수직선 */}
            {reversed.length > 1 && (
              <div style={{
                position: "absolute", left: 11, top: 24, bottom: 24,
                width: 1, background: "#e2e8f0", zIndex: 0,
              }} />
            )}
            {reversed.map((log) => (
              <div key={log.id} style={{ display: "flex", gap: 10, padding: "8px 0", position: "relative", zIndex: 1 }}>
                {/* 아바타 */}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: avatarColor(log.who), color: "#fff",
                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid #fff",
                }}>{log.who.slice(0, 1)}</div>

                {/* 본문 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>{log.who}</span>
                    {" "}
                    <span style={{ color: "#64748b" }}>{actionDesc(log)}</span>
                  </div>

                  {/* 변경값 카드 */}
                  {log.changes && log.changes.length > 0 && (
                    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                      {log.changes.map((c, ci) => (
                        <div key={ci} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: "#f8fafc", border: "1px solid #e2e8f0",
                          borderRadius: 6, padding: "2px 8px", fontSize: 11,
                          maxWidth: "100%",
                        }}>
                          <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 10, minWidth: 40, flexShrink: 0 }}>
                            {c.field}
                          </span>
                          {c.from && (
                            <>
                              <span style={{ color: "#94a3b8", textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                {resolveVal(c.field, c.from)}
                              </span>
                              <span style={{ color: "#94a3b8", flexShrink: 0 }}>→</span>
                            </>
                          )}
                          <span style={{ color: "#334155", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                            {resolveVal(c.field, c.to)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 메모 본문 */}
                  {log.comment && (
                    <div style={{
                      marginTop: 4, background: "#f8fafc", border: "1px solid #e2e8f0",
                      borderRadius: 8, padding: "6px 10px",
                      fontSize: 12, color: "#334155", lineHeight: 1.6,
                    }}>
                      {log.comment}
                    </div>
                  )}

                  {/* 타임스탬프 */}
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                    {fmtAt(log.at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 메모 입력 */}
      {onAddComment && (
        <div style={{ paddingTop: 10, borderTop: "1px solid #e2e8f0", marginTop: 4 }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveComment(); }}
            placeholder="메모 남기기... (Ctrl+Enter 저장)"
            rows={2}
            style={{
              width: "100%", padding: "7px 10px",
              border: "1.5px solid #e2e8f0", borderRadius: 7,
              fontSize: 12, fontFamily: "inherit", resize: "none",
              boxSizing: "border-box" as const, outline: "none",
              transition: "border-color .12s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
            <button
              onClick={handleSaveComment}
              disabled={!comment.trim()}
              style={{
                padding: "5px 14px", borderRadius: 6, border: "none",
                background: comment.trim() ? "#2563eb" : "#e2e8f0",
                color: comment.trim() ? "#fff" : "#94a3b8",
                fontSize: 12, fontWeight: 600,
                cursor: comment.trim() ? "pointer" : "default",
                fontFamily: "inherit",
              }}
            >저장</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 편집 폼 ────────────────────────────────────────────────────────────────────
// ── 첨부 파일/링크 관리 영역 ──────────────────────────────────────────────────
function AttachmentSection({ attachments, onChange }: { attachments: Attachment[]; onChange: (v: Attachment[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  // URL에서 파일 타입 자동 감지
  const detectType = (u: string): Attachment["type"] => {
    if (u.includes("docs.google.com/spreadsheets")) return "sheets";
    if (u.includes("docs.google.com/document")) return "docs";
    if (u.includes("drive.google.com")) return "drive";
    return "link";
  };

  // URL에서 이름 자동 추출 (비어있을 때)
  const autoName = (u: string): string => {
    try { return new URL(u).hostname.replace("www.", ""); } catch { return "링크"; }
  };

  const typeIcon: Record<string, { bg: string; color: string; label: string }> = {
    sheets: { bg: "#e8f5e9", color: "#16a34a", label: "Sheets" },
    docs: { bg: "#e3f2fd", color: "#2563eb", label: "Docs" },
    drive: { bg: "#fff3e0", color: "#f59e0b", label: "Drive" },
    link: { bg: "#f1f5f9", color: "#64748b", label: "Link" },
    file: { bg: "#fce4ec", color: "#dc2626", label: "File" },
  };

  const handleAdd = () => {
    if (!url.trim()) return;
    const newAtt: Attachment = { name: name.trim() || autoName(url), url: url.trim(), type: detectType(url) };
    onChange([...attachments, newAtt]);
    setName(""); setUrl(""); setAdding(false);
  };

  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
        <PaperClipIcon style={ICON_SM} /> 첨부 {attachments.length > 0 && <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>({attachments.length})</span>}
      </label>
      {/* 첨부 목록 */}
      {attachments.length > 0 && (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
          {attachments.map((att, i) => {
            const t = typeIcon[att.type] || typeIcon.link;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: i < attachments.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: t.bg, color: t.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 700 }}>
                  <LinkIcon style={{ width: 14, height: 14 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 500, color: "#334155", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#2563eb"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                  >{att.name}</a>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{t.label}</div>
                </div>
                {/* 삭제 버튼 */}
                <button onClick={() => onChange(attachments.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", padding: 2, transition: "color .12s", flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#cbd5e1"; }}
                ><XMarkIcon style={{ width: 14, height: 14 }} /></button>
              </div>
            );
          })}
        </div>
      )}
      {/* 추가 폼 */}
      {adding ? (
        <div style={{ border: "1px solid #2563eb", borderRadius: 8, padding: 10, background: "#f8faff" }}>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL 입력 (https://...)"
            style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", fontFamily: "inherit", marginBottom: 6 }}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
            autoFocus />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="표시 이름 (선택, 비우면 자동)"
            style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", fontFamily: "inherit", marginBottom: 8 }}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }} />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button onClick={() => { setAdding(false); setName(""); setUrl(""); }}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>취소</button>
            <button onClick={handleAdd}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>추가</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: "100%", padding: "8px", border: "1px dashed #cbd5e1", borderRadius: 8, background: "none", color: "#94a3b8", fontSize: 11, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all .12s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.color = "#2563eb"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
        ><PlusIcon style={{ width: 12, height: 12 }} /> 파일/링크 추가</button>
      )}
    </div>
  );
}

export function EditForm({ f, onChange, proj, members, pris, stats, currentUser, gPr, onAddComment }: {
  f: any;
  onChange: (v: any) => void;
  proj: Project[];
  members: string[];
  pris: string[];
  stats: string[];
  currentUser?: string | null;
  gPr?: (pid: number) => Project;
  onAddComment?: (text: string) => void;
}) {
  const [tab, setTab] = useState<"form" | "log">("form");
  const u = (k: string, v: any) => onChange({ ...f, [k]: v });
  const logs: ActivityLog[] = f.logs || [];
  const logCount = logs.length;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px",
    fontSize: 12, fontWeight: 600,
    color: active ? "#2563eb" : "#64748b",
    border: "none", background: "none", cursor: "pointer",
    borderBottom: `2px solid ${active ? "#2563eb" : "transparent"}`,
    fontFamily: "inherit",
    transition: "color .12s, border-color .12s",
  });

  return (
    <>
      {/* 탭 헤더 */}
      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 14 }}>
        <button style={tabStyle(tab === "form")} onClick={() => setTab("form")}>상세</button>
        <button style={tabStyle(tab === "log")} onClick={() => setTab("log")}>
          로그
          {logCount > 0 && (
            <span style={{
              marginLeft: 5, background: tab === "log" ? "#2563eb" : "#94a3b8",
              color: "#fff", fontSize: 9, fontWeight: 700,
              padding: "1px 5px", borderRadius: 99,
              verticalAlign: "middle",
            }}>{logCount}</span>
          )}
        </button>
      </div>

      {/* 상세 탭 */}
      {tab === "form" && <>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>프로젝트 *</label>
          <select value={f.pid || ""} onChange={e => u("pid", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }}>
            <option value="">선택</option>
            {/* 트리형 프로젝트 목록 — 상위 아래에 세부 들여쓰기 */}
            {proj.filter(p => !p.parentId).flatMap(p => {
              const children = proj.filter(ch => ch.parentId === p.id);
              return [
                <option key={p.id} value={p.id}>{p.name}</option>,
                ...children.map(ch => <option key={ch.id} value={ch.id}>&nbsp;&nbsp;└ {ch.name}</option>)
              ];
            })}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>업무내용 *</label>
          <input value={f.task || ""} onChange={e => u("task", e.target.value)} maxLength={50} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>담당자 *</label>
            <select value={f.who || ""} onChange={e => u("who", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }}>
              <option value="">선택</option>
              {members.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>마감기한 *</label>
            <input type="date" value={f.due || ""} onChange={e => u("due", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>우선순위</label>
            <select value={f.pri || "보통"} onChange={e => u("pri", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }}>
              {pris.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>상태</label>
            <select value={f.st || "대기"} onChange={e => u("st", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }}>
              {stats.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {/* 반복 설정 */}
        <div style={{ marginBottom: 12 }}>
          <RepeatPicker value={f.repeat || "없음"} onChange={v => u("repeat", v)} startDate={f.due || ""} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
            <DocumentTextIcon style={ICON_SM} /> 상세내용
          </label>
          <RichEditor value={f.det || ""} onChange={v => u("det", v)} />
        </div>
        {/* 첨부 파일/링크 영역 */}
        <AttachmentSection
          attachments={f.attachments || []}
          onChange={v => u("attachments", v)}
        />
      </>}

      {/* 로그 탭 */}
      {tab === "log" && (
        <LogPanel
          logs={logs}
          gPr={gPr}
          onAddComment={onAddComment}
        />
      )}
    </>
  );
}
