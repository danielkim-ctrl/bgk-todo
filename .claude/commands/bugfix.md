# 버그 수정 워크플로우 (bugfix)

> 오류 설명 → 원인 분석 → Playwright 검증 → 코드 수정 → 배포

## 발동 조건 (자동 발현)

다음 패턴의 메시지가 오면 자동으로 이 스킬을 발동한다:
- "~가 안 된다", "~가 사라진다", "~가 안 돼", "~가 깨진다"
- "버그", "오류", "에러", "이상해", "왜 이러지", "원복된다"
- "클릭해도 반응이 없어", "저장이 안 돼", "반영이 안 돼"
- "~건인데 ~건으로 고정돼", "계속 기존값이야"

## 모델 전략 (토큰 절약)

| 단계 | 모델 | 이유 |
|------|------|------|
| 파일 탐색·grep | Haiku | 반복적 파일 읽기, 속도 우선 |
| 원인 분석·해결책 설계 | Sonnet | 현재 대화 컨텍스트 보유 |
| 복잡한 race·아키텍처 버그 | Opus (선택) | 판단이 어려울 때 에스컬레이션 |
| 코드 수정·검증 | Sonnet | 품질 중요 |

## 실행 절차

### Phase 1 — 원인 분석 (Haiku로 탐색)

```bash
# 관련 파일 탐색
grep -r "키워드" src/ --include="*.tsx" --include="*.ts" -l
# 최근 커밋 확인
git log --oneline -5
# 관련 함수 코드 확인
```

1. 오류와 관련된 파일·함수를 빠르게 탐색
2. 후보 원인 2~3개 제시
3. 근본 원인 1개 확정 후 사용자에게 설명

**원인을 설명할 때 형식:**
```
## 원인
[한 문장 요약]

## 상세
[코드 흐름 설명 — 파일명:라인번호 포함]

## 수정 방향
[어떻게 고칠 것인지]
```

### Phase 2 — 수정 전 안전장치

```bash
# 수정 전 현재 상태 기록
git diff --stat
git stash list
```

- 수정할 파일 목록을 사용자에게 먼저 고지
- 복잡한 수정이면 사용자 확인 후 진행

### Phase 3 — Playwright 스크린샷 (before)

bugfix 폴더 네이밍 규칙: `bugfix/YYYYMMDD-버그키워드/`
- 오늘 날짜 + 버그 현상을 하이픈으로 연결 (예: `20260506-프로젝트-삭제-race`)
- `before/` 폴더에 수정 전 상황 캡처

```typescript
// tests/bugfix-YYYYMMDD.spec.ts (임시 파일 — 완료 후 삭제)
import { test } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "../bugfix/YYYYMMDD-버그키워드");

test("before: 오류 재현", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/before/01_오류상황.png` });
  // 오류 재현 시나리오...
  await page.screenshot({ path: `${DIR}/before/02_오류확인.png` });
});
```

```bash
mkdir -p bugfix/YYYYMMDD-버그키워드/before
mkdir -p bugfix/YYYYMMDD-버그키워드/after
npx playwright test tests/bugfix-YYYYMMDD.spec.ts
```

### Phase 4 — 코드 수정

code.rule.md 3단계 프로세스 적용:

**수정 전 체크**
- 동일 역할 코드가 다른 곳에도 있는가?
- 수정할 타입/인터페이스를 사용하는 파일이 더 있는가?

**수정 중 체크**
- `any` 타입 사용 금지
- 색상 하드코딩 금지
- 이모지 금지, Heroicons 사용

**수정 후 타입 체크**
```bash
npx tsc --noEmit
```
오류 있으면 즉시 수정. 오류 있는 상태로 다음 단계 진행 금지.

### Phase 5 — Playwright 스크린샷 (after)

```typescript
test("after: 수정 후 정상 동작 확인", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.waitForTimeout(2000);
  // 동일한 시나리오 재실행
  await page.screenshot({ path: `${DIR}/after/01_정상동작.png` });
  await page.screenshot({ path: `${DIR}/after/02_수정확인.png` });
});
```

- 수정 전과 **동일한 시나리오**로 after 스크린샷 캡처
- before/after 비교하여 개선 확인
- 임시 테스트 파일 삭제: `rm tests/bugfix-YYYYMMDD.spec.ts`

### Phase 6 — 사이드이펙트 점검

```
□ 리스트 / 칸반 / 캘린더 / 대시보드 뷰에서 정상 동작하는가?
□ Firebase 저장/불러오기에 영향이 없는가?
□ 타입 오류가 발생하지 않는가?
□ 동일 역할의 다른 컴포넌트도 함께 수정했는가?
```

### Phase 7 — 배포

deploy.md 스킬 실행:
```bash
npx tsc --noEmit          # 최종 타입 체크
git add <수정된 파일들>
git commit -m "fix: ..."
git push origin main
```

Firestore rules 변경이 있으면 함께 배포:
```bash
npx firebase deploy --only firestore:rules
```

### Phase 8 — 재발 방지 메모 (선택)

버그 패턴이 재발 가능성이 높으면 memory에 저장:
- 버그 유형, 원인 패턴, 해결책을 `memory/` 폴더에 기록

---

## 주요 주의사항

- **배포는 사용자 확인 후** — "배포해", "진행해" 명시적 승인 필요
- **디버그 로그 제거** — `console.log("[DEBUG]...")` 는 수정 완료 후 반드시 제거
- **임시 테스트 파일 삭제** — `tests/bugfix-*.spec.ts` 는 after 캡처 후 삭제
- **bugfix/ 스크린샷은 git 제외** — `.gitignore`에 `bugfix/*/` 등록됨 (README만 유지)
- **Firestore rules 변경 시** — 로컬 파일 수정 후 반드시 `firebase deploy --only firestore:rules` 실행

---

## 스크린샷 폴더 구조 참고

```
bugfix/
├── README.md                          ← 네이밍 규칙 문서 (git 포함)
└── 20260506-프로젝트-삭제-race/        ← 버그 하나당 폴더 하나
    ├── before/
    │   ├── 01_오류상황.png
    │   └── 02_오류확인.png
    └── after/
        ├── 01_정상동작.png
        └── 02_수정확인.png
```
