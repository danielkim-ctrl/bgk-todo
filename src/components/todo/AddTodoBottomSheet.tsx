import { useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { Project } from "../../types";

// ── AddTodoBottomSheet ────────────────────────────────────────────────────────
// 모바일 FAB 탭 시 열리는 업무 추가 바텀 시트.
// 핵심 필드(업무명, 담당자, 마감일, 우선순위, 상태, 프로젝트)만 표시하고
// 상세내용은 접힘 상태로 제공한다.

interface AddTodoBottomSheetProps {
  open: boolean;
  onClose: () => void;
  members: string[];
  pris: string[];
  stats: string[];
  visibleProj: Project[];
  currentUser: string | null;
  onSave: (todo: {
    task: string;
    who: string;
    due: string;
    pri: string;
    st: string;
    pid: number;
    det: string;
    repeat: string;
  }) => void;
}

// 필드 레이블 + 셀렉트 스타일 공통
const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 16, // iOS 자동 줌 방지 — 16px 이상 필수
  fontFamily: "'Pretendard', system-ui, sans-serif",
  background: "#fff",
  color: "#1a2332",
  outline: "none",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 4,
  display: "block",
};

export function AddTodoBottomSheet({
  open, onClose, members, pris, stats, visibleProj, currentUser, onSave,
}: AddTodoBottomSheetProps) {
  const [task, setTask] = useState("");
  const [who, setWho] = useState(currentUser || (members[0] ?? ""));
  const [due, setDue] = useState("");
  const [pri, setPri] = useState(pris[1] ?? pris[0] ?? "보통");
  const [st, setSt] = useState(stats[0] ?? "대기");
  const [pid, setPid] = useState<number>(visibleProj[0]?.id ?? 0);
  const [det, setDet] = useState("");
  const [showDet, setShowDet] = useState(false); // 상세내용 접힘/펼침

  // 바텀 시트 닫힐 때 폼 초기화
  const handleClose = () => {
    setTask(""); setWho(currentUser || members[0] || ""); setDue("");
    setPri(pris[1] ?? pris[0] ?? "보통"); setSt(stats[0] ?? "대기");
    setPid(visibleProj[0]?.id ?? 0); setDet(""); setShowDet(false);
    onClose();
  };

  const handleSave = () => {
    if (!task.trim()) return;
    onSave({ task: task.trim(), who, due, pri, st, pid, det, repeat: "없음" });
    handleClose();
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="새 업무 추가" fullHeight={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* 업무명 * */}
        <div>
          <label style={labelStyle}>업무명 <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            autoFocus
            value={task}
            onChange={e => setTask(e.target.value)}
            placeholder="업무명을 입력하세요"
            onKeyDown={e => { if (e.key === "Enter" && task.trim()) handleSave(); }}
            style={{
              ...selectStyle,
              resize: "none" as const,
            }}
          />
        </div>

        {/* 담당자 + 마감일 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>담당자</label>
            <div style={{ position: "relative" }}>
              <select value={who} onChange={e => setWho(e.target.value)} style={selectStyle}>
                {members.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#94a3b8" }}>▾</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>마감일</label>
            <input
              type="date"
              value={due.split(" ")[0] || ""}
              onChange={e => setDue(e.target.value)}
              style={{ ...selectStyle, colorScheme: "light" as any }}
            />
          </div>
        </div>

        {/* 우선순위 + 상태 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>우선순위</label>
            <div style={{ position: "relative" }}>
              <select value={pri} onChange={e => setPri(e.target.value)} style={selectStyle}>
                {pris.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#94a3b8" }}>▾</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>상태</label>
            <div style={{ position: "relative" }}>
              <select value={st} onChange={e => setSt(e.target.value)} style={selectStyle}>
                {stats.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#94a3b8" }}>▾</span>
            </div>
          </div>
        </div>

        {/* 프로젝트 */}
        <div>
          <label style={labelStyle}>프로젝트</label>
          <div style={{ position: "relative" }}>
            <select
              value={pid}
              onChange={e => setPid(parseInt(e.target.value) || 0)}
              style={selectStyle}
            >
              <option value={0}>없음</option>
              {/* 트리형 프로젝트 — 상위 아래에 세부 들여쓰기 */}
              {visibleProj.filter(p => !p.parentId).flatMap(p => {
                const children = visibleProj.filter(ch => ch.parentId === p.id);
                return [
                  <option key={p.id} value={p.id}>{p.name}</option>,
                  ...children.map(ch => <option key={ch.id} value={ch.id}>&nbsp;&nbsp;└ {ch.name}</option>)
                ];
              })}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#94a3b8" }}>▾</span>
          </div>
        </div>

        {/* 상세내용 (접힘) */}
        <div>
          <button
            onClick={() => setShowDet(p => !p)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#64748b", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}
          >
            상세내용 {showDet ? "▲" : "▼"}
          </button>
          {showDet && (
            <textarea
              value={det}
              onChange={e => setDet(e.target.value)}
              placeholder="상세 내용을 입력하세요"
              rows={4}
              style={{ ...selectStyle, marginTop: 6, resize: "vertical" as const }}
            />
          )}
        </div>

        {/* 저장 버튼 — 전체 너비 */}
        <button
          onClick={handleSave}
          disabled={!task.trim()}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: task.trim() ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#e2e8f0",
            color: task.trim() ? "#fff" : "#94a3b8",
            fontSize: 15,
            fontWeight: 700,
            cursor: task.trim() ? "pointer" : "not-allowed",
            fontFamily: "'Pretendard', system-ui, sans-serif",
            transition: "background .15s",
          }}
        >
          저장하기
        </button>
      </div>
    </BottomSheet>
  );
}
