import { useState, useRef, useEffect } from "react";
import { AVATAR_COLORS } from "../../constants";

interface LoginScreenProps {
  members: string[];
  memberPins: Record<string, string>;
  onLogin: (name: string) => void;
}

export function LoginScreen({ members, memberPins, onLogin }: LoginScreenProps) {
  // null = 이름 선택 화면, string = PIN 입력 화면
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // PIN 입력 화면 진입 시 자동 포커스
  useEffect(() => {
    if (selected) { setPin(""); setError(""); inputRef.current?.focus(); }
  }, [selected]);

  // PIN 검증
  const verify = () => {
    const correct = memberPins[selected!];
    if (!correct) { setError("PIN이 설정되지 않았습니다. 관리자에게 문의하세요."); return; }
    if (pin === correct) {
      onLogin(selected!);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setPin("");
      if (next >= 5) {
        setError("5회 실패 — 잠시 후 다시 시도하세요");
        setTimeout(() => { setAttempts(0); setError(""); }, 30000);
      } else {
        setError(`PIN이 일치하지 않습니다 (${next}/5)`);
      }
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Pretendard',system-ui,sans-serif", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#172f5a", padding: "20px 36px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,.25)" }}>
        <img src={`${import.meta.env.BASE_URL}bgk_logo_white.png`} alt="Bridging Group" style={{ height: 40, width: "auto", display: "block", margin: "0 auto" }} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 20, width: 480, maxWidth: "100%", boxShadow: "0 24px 64px rgba(0,0,0,.12)", padding: "32px 36px" }}>

          {!selected ? (
            /* ── 이름 선택 화면 ── */
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#172f5a", marginBottom: 6 }}>팀 TODO 통합관리</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>계속하려면 계정을 선택하세요</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {members.map((m, i) => {
                  const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <button key={m} onClick={() => setSelected(m)}
                      style={{ padding: "14px 12px", border: "1.5px solid #e2e8f0", borderRadius: 12, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all .15s", fontFamily: "inherit", textAlign: "left" }}
                      onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = c; b.style.background = c + "11"; b.style.transform = "translateY(-1px)"; b.style.boxShadow = `0 4px 12px ${c}22`; }}
                      onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "#e2e8f0"; b.style.background = "#fff"; b.style.transform = "none"; b.style.boxShadow = "none"; }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${c},${AVATAR_COLORS[(i + 3) % AVATAR_COLORS.length]})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{m[0]}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{m}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── PIN 입력 화면 ── */
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                {/* 뒤로가기 */}
                <button onClick={() => { setSelected(null); setAttempts(0); }}
                  style={{ position: "absolute" as const, left: 36, top: 92, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, transition: "color .12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}>
                  ← 다른 계정
                </button>

                {/* 선택된 사용자 아바타 */}
                {(() => {
                  const idx = members.indexOf(selected);
                  const c = AVATAR_COLORS[Math.max(0, idx) % AVATAR_COLORS.length];
                  return (
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${c},${AVATAR_COLORS[(Math.max(0, idx) + 3) % AVATAR_COLORS.length]})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, margin: "0 auto 12px" }}>
                      {selected[0]}
                    </div>
                  );
                })()}
                <div style={{ fontSize: 16, fontWeight: 700, color: "#172f5a", marginBottom: 4 }}>{selected}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>6자리 PIN을 입력하세요</div>
              </div>

              {/* PIN 입력 */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ""); setPin(v); setError(""); }}
                  onKeyDown={e => { if (e.key === "Enter" && pin.length === 6 && attempts < 5) verify(); }}
                  placeholder="● ● ● ● ● ●"
                  disabled={attempts >= 5}
                  style={{
                    width: 200, padding: "12px 16px", border: `2px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
                    borderRadius: 12, fontSize: 20, fontWeight: 700, textAlign: "center",
                    letterSpacing: "6px", outline: "none", fontFamily: "inherit",
                    background: attempts >= 5 ? "#f8fafc" : "#fff",
                    transition: "border-color .15s",
                  }}
                  onFocus={e => { if (!error) e.currentTarget.style.borderColor = "#2563eb"; }}
                  onBlur={e => { if (!error) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  autoFocus
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 12 }}>
                  {error}
                </div>
              )}

              {/* 로그인 버튼 */}
              <button
                onClick={verify}
                disabled={pin.length !== 6 || attempts >= 5}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  background: pin.length === 6 && attempts < 5 ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#e2e8f0",
                  color: pin.length === 6 && attempts < 5 ? "#fff" : "#94a3b8",
                  fontSize: 14, fontWeight: 700, cursor: pin.length === 6 && attempts < 5 ? "pointer" : "default",
                  fontFamily: "inherit", transition: "all .15s",
                }}>
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
