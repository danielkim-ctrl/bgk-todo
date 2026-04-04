# BGK Todo — Claude 작업 가이드

## 프로젝트 개요

- **목적**: BGK 팀 TODO 통합관리 웹앱
- **스택**: React + TypeScript, Firebase Firestore, Anthropic Claude API
- **폰트**: Pretendard 패밀리만 사용 (다른 폰트 패밀리 금지)
- **UI/UX 표준**: Google 생태계(Tasks, Calendar, Gmail, Sheets) 패턴 기준
- **주요 뷰**: 리스트 / 칸반 / 캘린더 / 대시보드

## 구조 요약

```
src/
 ├── App.tsx                  # 레이아웃, 헤더, 네비게이션, 모달
 ├── views/                   # KanbanView, ListView, CalendarView
 ├── components/              # 공통 UI (ui/, editor/, todo/, sidebar/)
 ├── hooks/
 │   ├── useTodoApp.ts        # 마스터 훅 (전역 상태 + Firestore 연동)
 │   ├── useAI.ts             # AI 파싱 로직
 │   ├── useCalendar.ts       # 캘린더 로직
 │   └── useUserSettings.ts   # 사용자별 설정
 ├── services/aiService.ts    # Anthropic API 호출
 ├── auth/PermissionContext.tsx
 ├── types.ts                 # 모든 타입 정의
 ├── constants.ts             # 상수
 ├── styles.ts                # 인라인 스타일 S 객체
 └── utils.ts
```

## 자동 적용 규칙

@Skills/code.rule.md

## 핵심 원칙 (빠른 참조)

1. **일관성**: UI 변경 시 동일 역할의 모든 곳을 함께 수정
2. **컴포넌트 재사용**: DateTimePicker, DropPanel, Modal, Chip 등 기존 공통 컴포넌트만 사용
3. **스타일**: `styles.ts`의 `S` 객체 사용, 색상 하드코딩 금지
4. **타입**: `types.ts`에 정의, `any` 금지
5. **상수**: `constants.ts`에서 관리
6. **전역 상태**: `useTodoApp` → 로컬 UI 상태만 컴포넌트 내 `useState`
7. **한글 주석**: "왜"를 중심으로 작성
8. **아이콘**: `@heroicons/react` (Heroicons)만 사용, 이모지 금지
9. **수정 후 점검**: 모든 뷰(리스트/칸반/캘린더/대시보드)에서 동작 확인
10. **설정-뷰 연동**: 색상/멤버/프로젝트 변경 시 모든 뷰에 즉시 반영 확인
11. **colgroup 합계 100%**: 테이블 컬럼 너비 합 검증 필수

## 팝업 위치 규칙

- 팝업은 스크롤과 무관하게 트리거 요소에 붙어야 함
- 스크롤 시: (A) 위치 실시간 갱신 또는 (B) 자동 닫기

## 데모 페이지 규칙

- `demo/YYYYMMDD-기능명-demo.html` 형식
- 앱과 동일한 색상·폰트·컴포넌트 스타일 사용

## Skill 안내 규칙

- 응답 시작 시 사용 Skill 명시: `[Skill: planning 사용]` 또는 `[Skill: 사용 안 함 — Read/Edit 도구로 직접 수행]`

## Skill 참조 (필요 시 호출)

### 분석·점검
- **@Skills/UIdesigner.md** — UI 디테일 점검 (폰트, 색상, 간격, hover)
- **@Skills/UXdesigner.md** — 사용자 흐름·인터랙션 점검
- **@Skills/QA.md** — 버그·보안·성능·설정연동 점검
- **@Skills/planning.md** — 기능 기획·우선순위·리스크 분석
- **@Skills/planning-review.md** — 현재 앱 기획 평가 및 개선 로드맵

### 자동화 워크플로우
- **@Skills/sync-check.md** — 설정-뷰 연동 자동 점검 (색상/멤버/프로젝트 반영 누락 탐지)
- **@Skills/deploy.md** — 타입 체크 → 커밋 → GitHub 푸시 원스텝
- **@Skills/feature.md** — 새 기능 개발 워크플로우 (기획→데모→구현→QA→배포)
