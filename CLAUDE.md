# BGK Todo — Claude 작업 가이드

## 프로젝트 개요

- **목적**: BGK 팀 TODO 통합관리 웹앱
- **스택**: React + TypeScript, Firebase Firestore, Anthropic Claude API
- **주요 뷰**: 리스트 / 메모(스티키노트) / 칸반 / 캘린더 / 대시보드

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

## QA 점검 기준

@Skills/QA.md

## 기획 판단 기준

@Skills/planning.md

## 현재 앱 기획 평가 및 개선 로드맵

@Skills/planning-review.md

## 핵심 원칙 요약 (빠른 참조)

1. **일관성**: UI 변경 시 동일 역할의 모든 곳을 함께 수정
2. **컴포넌트 재사용**: DateTimePicker, DropPanel, Modal, Chip 등 기존 공통 컴포넌트 재사용
3. **스타일**: `src/styles.ts`의 `S` 객체 사용, 하드코딩 금지
4. **타입**: `src/types.ts`에 정의, `any` 사용 금지
5. **상수**: `src/constants.ts`에서 관리
6. **전역 상태**: `useTodoApp` → 로컬 UI 상태만 컴포넌트 내 `useState`
7. **한글 주석**: 비개발자도 이해할 수 있도록 "왜"를 중심으로 작성
8. **수정 후 점검**: 리스트/칸반/캘린더/대시보드 모든 뷰에서 동작 확인
