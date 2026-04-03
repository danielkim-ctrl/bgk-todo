import { useState, useRef, useEffect } from "react";
import { AVATAR_COLORS } from "../../constants";
import { Team } from "../../types";

interface LoginScreenProps {
  members: string[];
  memberPins: Record<string, string>;
  teams: Team[];
  onLogin: (name: string) => void;
}

export function LoginScreen({ members, memberPins, teams, onLogin }: LoginScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected) { setPin(""); setError(""); inputRef.current?.focus(); }
  }, [selected]);

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

  // 멤버를 팀별로 그룹화
  const teamGroups: { team: Team | null; members: string[] }[] = [];
  const assigned = new Set<string>();

  // 팀별 멤버 그룹
  teams.forEach(t => {
    const teamMembers = t.members.map(m => m.name).filter(n => members.includes(n));
    if (teamMembers.length > 0) {
      teamGroups.push({ team: t, members: teamMembers });
      teamMembers.forEach(n => assigned.add(n));
    }
  });

  // 미배정 멤버
  const unassigned = members.filter(m => !assigned.has(m));
  if (unassigned.length > 0) {
    teamGroups.push({ team: null, members: unassigned });
  }

  // 아바타 색상
  const getColor = (name: string) => {
    const idx = members.indexOf(name);
    return AVATAR_COLORS[Math.max(0, idx) % AVATAR_COLORS.length];
  };
  const getColor2 = (name: string) => {
    const idx = members.indexOf(name);
    return AVATAR_COLORS[(Math.max(0, idx) + 3) % AVATAR_COLORS.length];
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Pretendard',system-ui,sans-serif", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#172f5a", padding: "20px 36px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,.25)" }}>
        <img src={`${import.meta.env.BASE_URL}bgk_logo_white.png`} alt="Bridging Group" style={{ height: 40, width: "auto", display: "block", margin: "0 auto" }} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 20, width: 720, maxWidth: "95%", boxShadow: "0 24px 64px rgba(0,0,0,.12)", padding: "32px 40px", position: "relative" }}>

          {!selected ? (
            /* ── 이름 선택 화면 — 팀별 그룹 ── */
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#172f5a", marginBottom: 6 }}>팀 TODO 통합관리</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>계속하려면 계정을 선택하세요</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {teamGroups.map((group, gi) => {
                  const tc = group.team?.color || "#94a3b8";
                  return (
                    <div key={gi} style={{
                      borderRadius: 14,
                      border: `1px solid ${group.team ? tc + "30" : "#e2e8f0"}`,
                      background: group.team ? tc + "06" : "#fafbfc",
                    }}>
                      {/* 팀 헤더 — 팀 색상 강조 바 */}
                      <div style={{
                        padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                        background: group.team ? tc + "12" : "#f1f5f9",
                        borderBottom: `1px solid ${group.team ? tc + "20" : "#e2e8f0"}`,
                        borderRadius: "14px 14px 0 0",
                      }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: tc, flexShrink: 0, boxShadow: `0 0 0 3px ${tc}25` }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: group.team ? "#1e293b" : "#94a3b8" }}>
                          {group.team ? group.team.name : "미배정"}
                        </span>
                        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>{group.members.length}명</span>
                      </div>

                      {/* 멤버 카드 그리드 */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: 10 }}>
                        {group.members.map(m => {
                          const c = getColor(m);
                          return (
                            <button key={m} onClick={() => setSelected(m)}
                              style={{
                                padding: "10px 10px", border: "1.5px solid transparent", borderRadius: 10,
                                background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                                gap: 9, transition: "all .15s", fontFamily: "inherit", textAlign: "left",
                                boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                              }}
                              onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = tc; b.style.transform = "translateY(-2px)"; b.style.boxShadow = `0 6px 16px ${tc}20`; }}
                              onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "transparent"; b.style.transform = "none"; b.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: "50%",
                                background: `linear-gradient(135deg,${c},${getColor2(m)})`,
                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, fontWeight: 800, flexShrink: 0,
                              }}>{m[0]}</div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{m}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── PIN 입력 화면 ── */
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <button onClick={() => { setSelected(null); setAttempts(0); }}
                  style={{ position: "absolute", left: 36, top: 36, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, transition: "color .12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}>
                  ← 다른 계정
                </button>

                {(() => {
                  const c = getColor(selected);
                  return (
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${c},${getColor2(selected)})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, margin: "0 auto 12px" }}>
                      {selected[0]}
                    </div>
                  );
                })()}
                <div style={{ fontSize: 16, fontWeight: 700, color: "#172f5a", marginBottom: 4 }}>{selected}</div>
                {/* 소속 팀 표시 */}
                {(() => {
                  const myTeams = teams.filter(t => t.members.some(m => m.name === selected));
                  return myTeams.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 8 }}>
                      {myTeams.map(t => (
                        <span key={t.id} style={{ fontSize: 11, color: t.color, background: t.color + "15", padding: "2px 8px", borderRadius: 99, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.color }} />
                          {t.name}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
                <div style={{ fontSize: 12, color: "#94a3b8" }}>6자리 PIN을 입력하세요</div>
              </div>

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

              {error && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 12 }}>
                  {error}
                </div>
              )}

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
