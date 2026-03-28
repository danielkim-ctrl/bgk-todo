# Code Rules — BGK Todo App

---

## 1. 일관성 원칙 (Consistency First)

**코드를 수정할 때는 해당 코드만 수정하지 않는다. 동일한 목적의 코드가 앱 어디에 있든 모두 함께 수정한다.**

### 예시
- 날짜 선택 UI를 변경했다면 → 리스트 뷰, 칸반 뷰, 수정 모달, 추가 폼 등 날짜를 입력하는 모든 곳에 동일하게 적용
- 버튼 스타일을 변경했다면 → 같은 역할의 버튼이 있는 모든 컴포넌트에 적용
- 상태 배지(badge) 디자인을 변경했다면 → 리스트, 칸반, 캘린더, 대시보드 등 배지가 쓰이는 모든 곳에 적용
- 드롭다운 선택 UI를 변경했다면 → 우선순위, 상태, 담당자, 프로젝트 등 드롭다운을 쓰는 모든 곳에 적용

### 체크 방법
수정 전 반드시 아래 질문에 답한다:
> "이와 동일한 역할을 하는 UI/로직이 다른 곳에도 있는가?"
있다면 그 모든 곳을 함께 수정한다.

---

## 2. 컴포넌트 재사용 원칙

- 동일한 UI 요소가 2곳 이상 쓰인다면 공통 컴포넌트로 분리한다.
- 공통 컴포넌트 없이 같은 UI를 각자 구현하지 않는다.
- 기존에 이미 만들어진 컴포넌트(DateTimePicker, DropPanel, Badge, Chip 등)가 있다면 새로 만들지 않고 그것을 재사용한다.

### 주요 공통 컴포넌트 목록 (신규 구현 금지)
| 역할 | 컴포넌트 |
|-----|---------|
| 날짜 선택 | `DateTimePicker` |
| 드롭다운 선택 | `DropPanel` |
| 모달 래퍼 | `Modal` |
| 상태/우선순위 배지 | `Badge` (styles.ts) |
| 필터 칩 | `Chip` |
| 진행률 바 | `ProgressBar` |
| 반복 배지 | `RepeatBadge` |
| 토스트 알림 | `Toast` |
| 리치 텍스트 입력 | `RichEditor` |

---

## 3. 스타일 관리

- 인라인 스타일은 `src/styles.ts`의 `S` 객체를 통해 관리한다.
- 동일한 스타일을 여러 컴포넌트에 직접 복붙하지 않는다.
- 새 스타일이 필요하면 `S` 객체에 추가하고 참조해서 사용한다.
- 색상값(hex)을 컴포넌트 내에 하드코딩하지 않는다. 색상은 항상 상수 또는 `S` 객체에서 가져온다.

---

## 4. 타입 관리

- 새로운 데이터 구조가 생기면 반드시 `src/types.ts`에 타입을 정의한다.
- `any` 타입 사용을 금지한다. 불가피한 경우 주석으로 이유를 명시한다.
- 기존 타입(`Todo`, `Project`, `Filters` 등)을 변경할 때 해당 타입을 사용하는 모든 곳을 함께 수정한다.

---

## 5. 상수 관리

- 하드코딩된 문자열(상태명, 우선순위명, 팀원명 등)을 컴포넌트 내부에 직접 쓰지 않는다.
- 고정값은 `src/constants.ts`에서 관리한다.
- 앱 전반에서 반복 사용되는 숫자(최대 글자 수, 기본값 등)도 상수로 정의한다.

---

## 6. 상태 관리

- 전역 앱 상태는 `src/hooks/useTodoApp.ts`에서 관리한다.
- 컴포넌트 내부에서만 쓰이는 UI 상태(모달 열림 여부 등)는 로컬 `useState`로 관리한다.
- `useTodoApp`에 이미 있는 상태를 컴포넌트 내부에 중복으로 선언하지 않는다.

---

## 7. 한글 주석 규칙

**코드를 작성하거나 수정할 때 비개발자도 이해할 수 있도록 한글 주석을 반드시 작성한다.**

### 주석을 달아야 하는 곳
- 함수/컴포넌트 상단 — 이 코드가 무슨 역할을 하는지 한 줄로 설명
- 조건문(`if`) — 왜 이 조건을 체크하는지 설명
- 복잡한 계산식 또는 로직 — 무엇을 계산하는지 설명
- 이벤트 핸들러 — 어떤 사용자 동작에 반응하는지 설명
- Firebase/API 호출부 — 어떤 데이터를 가져오거나 저장하는지 설명
- 상수/변수 선언부 — 이 값이 무엇을 의미하는지 설명

### 주석 작성 기준
- 코드가 **무엇을 하는지**보다 **왜 하는지**를 중심으로 설명한다.
- 개발 용어(state, render, callback 등)를 그대로 쓰지 않고 풀어서 설명한다.
- 한 줄 주석은 `//`, 여러 줄은 `/* */`를 사용한다.

### 예시

```tsx
// 나쁜 예 — 코드를 그대로 읽은 것
const filtered = todos.filter(t => t.status === 'done')

// 좋은 예 — 왜 하는지, 무슨 의미인지 설명
// 완료된 업무만 골라서 별도로 표시하기 위해 분리
const completedTodos = todos.filter(t => t.status === 'done')
```

```tsx
// 나쁜 예
if (!user) return null

// 좋은 예
// 로그인하지 않은 상태에서는 화면을 렌더링하지 않음
if (!user) return null
```

```tsx
// 나쁜 예
// handleClick function
const handleClick = () => { ... }

// 좋은 예
// 업무 카드를 클릭했을 때 상세 수정 모달을 열어주는 함수
const handleClick = () => { ... }
```

### 주석을 달지 않아도 되는 곳
- 변수명만으로 의미가 명확한 단순 대입 (`const title = todo.title`)
- 이미 주석이 있는 공통 컴포넌트를 단순 호출하는 JSX

---

## 8. 폰트 통일

- 앱 전체에서 **Pretendard 패밀리**만 사용한다: `'Pretendard', system-ui, sans-serif`
- Pretendard 계열 굵기(ExtraBold, Bold, SemiBold, Medium, Regular 등)는 자유롭게 사용할 수 있다.
- 다른 폰트 패밀리(`monospace`, `serif`, `cursive` 등)는 사용하지 않는다.
- 새 컴포넌트를 만들 때 `fontFamily`를 직접 쓰지 않고, 최상위 `S.wrap`에서 상속받게 한다.
- `input`, `button`, `textarea`, `select` 등 폼 요소에는 `fontFamily: 'inherit'`을 사용한다.

---

## 9. 이모지 사용 금지 — Heroicons 사용

**UI에 이모지(📁 ⚙️ ✅ ❌ 🔥 📅 👤 📋 🔁 📊 📌 ↩️ 등)를 사용하지 않는다.**

### 이유
- 이모지는 OS/브라우저마다 렌더링이 다르다 (Windows ↔ macOS ↔ Android 전부 다르게 보임)
- 디자인 톤이 통일되지 않아 앱이 산만해 보인다
- 크기/색상/정렬을 CSS로 세밀하게 제어할 수 없다

### 아이콘 라이브러리: Heroicons

- **패키지**: `@heroicons/react` (https://github.com/tailwindlabs/heroicons)
- **스타일**: `24/outline`을 기본으로 사용한다 (선이 깔끔하고 가독성 높음)
- 강조가 필요한 경우에만 `24/solid` 사용 (예: 즐겨찾기 활성 상태)
- 아이콘 크기는 인라인 `style`로 `width`, `height`를 지정한다 (기본 `16px`)
- 아이콘 색상은 `currentColor`를 기본으로 하여 부모의 `color`를 자동 상속한다

### import 규칙

```tsx
// 기본 — outline 스타일
import { FolderIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline'

// 강조 — solid 스타일 (즐겨찾기 활성 등 제한적 사용)
import { StarIcon } from '@heroicons/react/24/solid'
```

### 예시

```tsx
// 나쁜 예 — 이모지 직접 사용
<button>📁 프로젝트</button>
<span>👤 {assignee}</span>
<span>📅 {dueDate}</span>

// 좋은 예 — Heroicons 사용
import { FolderIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline'

<button><FolderIcon style={{width:14,height:14}}/> 프로젝트</button>
<span><UserIcon style={{width:14,height:14}}/> {assignee}</span>
<span><CalendarIcon style={{width:14,height:14}}/> {dueDate}</span>
```

---

## 10. 아이콘 일관성 원칙

**같은 의미의 아이콘은 앱 전체에서 동일한 Heroicons 아이콘을 사용한다.**

### 아이콘 매핑 표 (단일 출처)

동일한 개념에는 반드시 아래 지정된 아이콘을 사용한다. 임의로 다른 아이콘으로 대체하지 않는다.

| 개념 | Heroicons 컴포넌트 | import 경로 | 사용처 |
|------|-------------------|-------------|--------|
| 프로젝트 | `FolderIcon` | `24/outline` | 사이드바, 헤더, 카드, 필터, 드롭다운, 대시보드 |
| 담당자 | `UserIcon` | `24/outline` | 사이드바, 헤더, 카드, 필터, 드롭다운, 대시보드 |
| 마감기한 | `CalendarIcon` | `24/outline` | 카드, 입력 폼, 캘린더 뷰, 대시보드 |
| 우선순위 | `FlagIcon` | `24/outline` | 카드, 입력 폼, 필터, 설정, 대시보드 |
| 상태 | `CheckCircleIcon` | `24/outline` | 카드, 입력 폼, 필터, 설정, 대시보드 |
| 반복 | `ArrowPathIcon` | `24/outline` | 카드, 입력 폼, 필터, 배지 |
| 설정 | `Cog6ToothIcon` | `24/outline` | 헤더 |
| 되돌리기 | `ArrowUturnLeftIcon` | `24/outline` | 헤더 |
| 다시 실행 | `ArrowUturnRightIcon` | `24/outline` | 헤더 |
| 삭제 | `TrashIcon` | `24/outline` | 카드, 모달, 일괄 작업 |
| 즐겨찾기 (비활성) | `StarIcon` | `24/outline` | 카드, 필터 |
| 즐겨찾기 (활성) | `StarIcon` | `24/solid` | 카드, 필터 |
| 대시보드 | `ChartBarIcon` | `24/outline` | 탭 네비게이션 |
| 칸반 | `ViewColumnsIcon` | `24/outline` | 탭 네비게이션 |
| 리스트 | `ListBulletIcon` | `24/outline` | 탭 네비게이션 |
| 성공 알림 | `CheckIcon` | `24/outline` | 토스트 |
| 오류 알림 | `XMarkIcon` | `24/outline` | 토스트 |
| 검색 | `MagnifyingGlassIcon` | `24/outline` | 검색창 |
| 닫기 | `XMarkIcon` | `24/outline` | 모달, 패널 |
| 추가 | `PlusIcon` | `24/outline` | 버튼, 카드 |
| 메모 | `DocumentTextIcon` | `24/outline` | 탭 네비게이션 |

### 체크 방법
아이콘을 추가하거나 변경할 때 반드시 아래 질문에 답한다:
> "이 개념에 이미 지정된 Heroicons 아이콘이 매핑 표에 있는가?"
있다면 그 아이콘을 그대로 사용한다. 없다면 https://heroicons.com 에서 적절한 아이콘을 선택하고 매핑 표를 업데이트한다.

---

## 11. UX 표준 — Google 생태계 기준

**UI/UX 설계 시 Google 서비스(Google Tasks, Google Calendar, Gmail, Google Sheets 등)의 인터랙션 패턴을 표준으로 삼는다.**

### 이유
- 대부분의 사용자가 Google 서비스에 익숙하므로, 동일한 패턴을 따르면 학습 비용이 0에 가깝다
- 검증된 UX 패턴이므로 실수할 확률이 낮다

### 적용 기준
- **리스트 조작**: Google Tasks / Google Sheets 방식 (인라인 편집, 체크박스 완료, 드래그 정렬)
- **캘린더**: Google Calendar 방식 (날짜 클릭 빠른 추가, 이벤트 드래그 이동, 월/주/일 뷰 전환)
- **칸반**: 업계 표준 (Trello/Notion 칸반 — 드래그로 상태 변경)
- **알림/토스트**: Gmail 방식 (하단 토스트 + "실행 취소" 버튼)
- **모달/다이얼로그**: Google Material Design 가이드라인 (명확한 제목, 우측 하단 액션 버튼, ESC/외부 클릭 닫기)
- **필터/검색**: Gmail 방식 (검색창 + 필터 칩 조합)
- **키보드 단축키**: Google 서비스의 공통 단축키 패턴 참고 (?, Ctrl+Z 등)

### 새 기능 설계 시 체크
> "Google 서비스에서 이와 같은 기능은 어떻게 동작하는가?"
해당 패턴이 있다면 그것을 따른다. 없거나 맞지 않는 경우에만 독자적으로 설계한다.

---

## 12. 아이콘 hover 효과 규칙

**클릭 가능한 아이콘(접기/펼치기, 닫기, 설정 등)에는 반드시 hover 효과를 적용한다.**

### 이유
- hover 없는 아이콘은 클릭 가능한지 알 수 없다
- 미세한 시각 피드백이 앱의 완성도를 결정한다

### 적용 방법
- **색상 진하게**: 기본 `#94a3b8` → hover 시 `#334155`
- **stroke 두껍게**: Heroicons의 `stroke-width`를 기본 `1.5` → hover 시 `2.5`로 변경
- **transition 적용**: `transition: "color .12s"`로 부드럽게 전환

### 구현 패턴

```tsx
<button
  style={{ color: "#94a3b8", transition: "color .12s" }}
  onMouseEnter={e => {
    e.currentTarget.style.color = "#334155";
    (e.currentTarget.querySelector("svg") as SVGElement|null)
      ?.setAttribute("stroke-width", "2.5");
  }}
  onMouseLeave={e => {
    e.currentTarget.style.color = "#94a3b8";
    (e.currentTarget.querySelector("svg") as SVGElement|null)
      ?.setAttribute("stroke-width", "1.5");
  }}
>
  <ChevronDownIcon style={{ width: 12, height: 12 }} />
</button>
```

### 적용 대상
- 사이드바 섹션 접기/펼치기 아이콘
- 사이드바 확장/좁히기 아이콘
- 모달/패널 닫기 아이콘
- 업무 추가 섹션 접기/펼치기 아이콘
- 테이블 행 hover 시 나타나는 액션 아이콘

---

## 13. 수정 시 사이드 이펙트 점검

코드 수정 후 반드시 아래 항목을 점검한다:

- [ ] 리스트 뷰에서 정상 동작하는가?
- [ ] 칸반 뷰에서 정상 동작하는가?
- [ ] 캘린더 뷰에서 정상 동작하는가?
- [ ] 대시보드 뷰에서 정상 동작하는가?
- [ ] 수정 모달/폼에서 정상 동작하는가?
- [ ] Firebase 저장/불러오기에 영향이 없는가?
- [ ] 타입 오류가 발생하지 않는가?
