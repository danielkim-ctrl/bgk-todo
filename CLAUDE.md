# BGK Todo — Claude 작업 가이드

## 프로젝트 개요

- **목적**: BGK 팀 TODO 통합관리 웹앱
- **스택**: React + TypeScript, Firebase Firestore, Anthropic Claude API
- **전체 폰트**: Pretendard 패밀리 (`'Pretendard', system-ui, sans-serif`) — ExtraBold, Bold, SemiBold, Medium, Regular 등 Pretendard 계열 굵기는 자유롭게 사용 가능. 다른 폰트 패밀리(monospace, serif 등)는 사용 금지
- **UI/UX 표준**: Google 생태계(Google Tasks, Google Calendar, Gmail, Google Sheets 등)의 UI 디자인과 인터랙션 패턴을 표준으로 삼아 개발 — 시각적 스타일(색상, 여백, 카드/리스트 형태, 버튼 모양, 아이콘 배치 등)과 동작 방식 모두 Google 서비스와 가장 유사한 형태로 구현
- **주요 뷰**: 리스트 / 칸반 / 캘린더 / 대시보드

## 구조 요약

```
src/
 ├── App.tsx                  # 레이아웃, 헤더, 네비게이션, 모달
 ├── views/                   # 뷰 컴포넌트 (KanbanView, ListView, CalendarView)
 ├── components/              # 공통 UI 컴포넌트 (ui/, editor/, todo/, sidebar/ ...)
 ├── hooks/
 │   ├── useTodoApp.ts        # 마스터 훅 (하위 훅 조합)
 │   ├── useAI.ts             # AI 파싱 상태·로직
 │   ├── useCalendar.ts       # 캘린더 상태·로직
 │   └── useUserSettings.ts   # 사용자별 설정·저장
 ├── services/aiService.ts    # Anthropic API 호출 (Haiku, 스트리밍)
 ├── auth/PermissionContext.tsx
 ├── types.ts
 ├── constants.ts
 ├── styles.ts                # 인라인 스타일 S 객체
 └── utils.ts
```

## 자동 적용 규칙

아래 파일들의 규칙은 모든 작업에 자동으로 적용됩니다.

@Skills/code.rule.md

## UI 디자인 기준

@Skills/UIdesigner.md

## UX 디자인 기준

@Skills/UXdesigner.md

## QA 점검 기준

@Skills/QA.md

## 기획 판단 기준

@Skills/planning.md

## 현재 앱 기획 평가 및 개선 로드맵

@Skills/planning-review.md

## CSS Zoom 설정

- 앱 전체에 `zoom: 1.0`이 적용되어 있음 (기본값, 별도 확대 없음)
- zoom 값이 1.0이므로 좌표 관련 코딩 시 별도 zoom 보정이 필요 없음
- 단, 추후 zoom 값이 변경될 경우 아래 사항을 주의:
  - `getBoundingClientRect()`, `clientX/Y`, `window.innerWidth/Height` 등은 zoom 미적용 원본 좌표를 반환하므로, zoom ≠ 1.0이면 실제 화면 위치와 매칭 시 보정 필요
  - `position: fixed/absolute` 요소의 `top/left` 계산 시 zoom 보정 필요
  - 드래그앤드롭, 팝업/드롭다운 위치 계산, 마우스 좌표 기반 로직에서 zoom 오차 주의
- zoom 값 변경 시 이 항목과 코드 내 zoom 보정 로직을 함께 업데이트할 것

## 팝업/드롭다운 위치 규칙

- **모든 팝업(DateTimePicker, DropPanel, NotePopup 등)은 스크롤과 무관하게 트리거 요소에 붙어 있어야 한다**
- `position: fixed`로 열린 팝업은 스크롤 시 트리거 요소와 분리되어 화면에 고정됨 → 사용자에게 부자연스러움
- **해결 방법**: 팝업이 열린 상태에서 스크롤 이벤트 발생 시:
  - (방법 A) 트리거 요소의 `getBoundingClientRect()`를 다시 읽어 팝업 위치를 실시간 갱신하거나
  - (방법 B) 스크롤 발생 시 팝업을 자동으로 닫거나
  - 두 방법 중 해당 팝업의 UX에 맞는 것을 선택 (간단한 선택 팝업은 B, 복잡한 입력 팝업은 A 권장)
- 새 팝업/드롭다운 컴포넌트를 만들거나 수정할 때 반드시 스크롤 시 위치 동작을 확인할 것

## 응답 시 Skill 사용 여부 안내 규칙

- 모든 작업 응답 시작 시 **어떤 Skill을 사용하는지 명시**한다.
- Skill을 사용하지 않는 경우 **"Skill 없이 수행합니다"** 라고 명시한다.
- 형식 예시:
  - `[Skill: simplify 사용]`
  - `[Skill: 사용 안 함 — Read/Edit 도구로 직접 수행]`

## 핵심 원칙 요약 (빠른 참조)

1. **일관성**: UI 변경 시 동일 역할의 모든 곳을 함께 수정
2. **컴포넌트 재사용**: DateTimePicker, DropPanel, Modal, Chip 등 기존 공통 컴포넌트 재사용
3. **스타일**: `src/styles.ts`의 `S` 객체 사용, 하드코딩 금지
4. **타입**: `src/types.ts`에 정의, `any` 사용 금지
5. **상수**: `src/constants.ts`에서 관리
6. **전역 상태**: `useTodoApp` → 로컬 UI 상태만 컴포넌트 내 `useState`
7. **한글 주석**: 비개발자도 이해할 수 있도록 "왜"를 중심으로 작성
8. **폰트 통일**: Pretendard 패밀리만 사용 (ExtraBold~Regular 굵기 자유), 다른 폰트 패밀리 금지
9. **이모지 금지**: UI에 이모지 사용 금지, `@heroicons/react` (Heroicons)만 사용
10. **아이콘 일관성**: 같은 개념(프로젝트, 담당자, 우선순위 등)은 매핑 표에 지정된 동일한 Heroicons 아이콘 사용
11. **수정 후 점검**: 리스트/칸반/캘린더/대시보드 모든 뷰에서 동작 확인
12. **UI/UX 표준**: Google 생태계(Tasks, Calendar, Gmail, Sheets)의 시각적 디자인 + 인터랙션 패턴을 표준으로 삼아 개발
13. **아이콘 hover**: 클릭 가능한 아이콘(접기/펼치기, 닫기 등)에는 반드시 hover 효과 적용 — 색상 진하게(`#334155`) + stroke-width 두껍게(1.5→2.5)
14. **테이블 colgroup 합계 100%**: `<colgroup>`의 모든 `<col width>` 합이 반드시 **정확히 100%**여야 함 — 미달 시 우측에 빈 흰색 칸이 생기고, 초과 시 가로 스크롤 발생. 컬럼을 추가/삭제/조정할 때 헤더 테이블과 본문 테이블의 colgroup을 항상 동일하게 맞추고, expandMode/일반 모드 모두 합계를 검증할 것
