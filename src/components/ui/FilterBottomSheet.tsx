import { BottomSheet } from "./BottomSheet";

// ── FilterBottomSheet ──────────────────────────────────────────────────────────
// 모바일 전용 필터 바텀 시트.
// 프로젝트 / 담당자 / 우선순위 / 상태 필터를 칩(토글 버튼) 형태로 제공한다.
// 하단 "초기화" 버튼으로 모든 필터를 한번에 해제할 수 있다.

interface FilterBottomSheetProps {
  open: boolean;
  onClose: () => void;
  filters: any;
  togF: (key: string, val: string) => void;
  aProj: any[];           // 전체 프로젝트 목록
  members: string[];      // 전체 담당자 목록
  pris: string[];         // 우선순위 목록
  priC: Record<string, string>;
  stats: string[];        // 상태 목록
  stC: Record<string, string>;
}

// 필터 칩 기본 스타일 — 선택/비선택에 따라 배경/테두리/색상을 달리함
function FilterChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        borderRadius: 99,
        border: `1.5px solid ${active ? "#2563eb" : "#e2e8f0"}`,
        background: active ? "#eff6ff" : "#fff",
        color: active ? "#2563eb" : "#475569",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
        WebkitTapHighlightColor: "transparent",
        transition: "background .1s, border-color .1s",
      }}
    >
      {color && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
            display: "inline-block",
          }}
        />
      )}
      {label}
    </button>
  );
}

// 필터 섹션 타이틀
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

export function FilterBottomSheet({
  open, onClose, filters, togF, aProj, members, pris, priC, stats, stC,
}: FilterBottomSheetProps) {

  // 모든 필터가 비어있는지 확인 — 초기화 버튼 활성 여부에 사용
  const hasFilter =
    (filters.proj?.length || 0) +
    (filters.who?.length || 0) +
    (filters.pri?.length || 0) +
    (filters.st?.length || 0) > 0;

  // 모든 필터 초기화 — togF("__reset__", "all") 패턴 사용
  const resetAll = () => {
    togF("__reset__", "all");
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="필터" fullHeight={false}>
      <div style={{ paddingBottom: 8 }}>
        {/* 프로젝트 필터 */}
        {aProj.length > 0 && (
          <FilterSection title="프로젝트">
            {aProj.map((p: any) => (
              <FilterChip
                key={p.id}
                label={p.name}
                color={p.color}
                active={(filters.proj || []).includes(p.name)}
                onClick={() => togF("proj", p.name)}
              />
            ))}
          </FilterSection>
        )}

        {/* 담당자 필터 */}
        {members.length > 0 && (
          <FilterSection title="담당자">
            {members.map((m: string) => (
              <FilterChip
                key={m}
                label={m}
                active={(filters.who || []).includes(m)}
                onClick={() => togF("who", m)}
              />
            ))}
          </FilterSection>
        )}

        {/* 우선순위 필터 */}
        {pris.length > 0 && (
          <FilterSection title="우선순위">
            {pris.map((p: string) => (
              <FilterChip
                key={p}
                label={p}
                color={priC[p]}
                active={(filters.pri || []).includes(p)}
                onClick={() => togF("pri", p)}
              />
            ))}
          </FilterSection>
        )}

        {/* 상태 필터 */}
        {stats.length > 0 && (
          <FilterSection title="상태">
            {stats.map((s: string) => (
              <FilterChip
                key={s}
                label={s}
                color={stC[s]}
                active={(filters.st || []).includes(s)}
                onClick={() => togF("st", s)}
              />
            ))}
          </FilterSection>
        )}

        {/* 초기화 버튼 */}
        <button
          onClick={resetAll}
          disabled={!hasFilter}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            border: "none",
            background: hasFilter ? "#f1f5f9" : "#f8fafc",
            color: hasFilter ? "#334155" : "#cbd5e1",
            fontSize: 14,
            fontWeight: 600,
            cursor: hasFilter ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            marginTop: 4,
          }}
        >
          필터 초기화
        </button>
      </div>
    </BottomSheet>
  );
}
