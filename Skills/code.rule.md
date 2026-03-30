# Code Rules — BGK Todo App

> **이 규칙은 코드를 읽거나 수정하거나 새로 작성하는 모든 작업에서 자동으로 적용된다.**
> Claude가 파일을 Edit/Write/Read하는 순간 이 규칙이 발동된다. 별도로 호출하지 않아도 된다.

---

## 🚦 언제 이 규칙이 발동되는가

| 작업 유형 | 발동 조건 | 적용 규칙 |
|----------|----------|----------|
| **파일 수정** | 어떤 `.tsx` `.ts` `.css` 파일이든 Edit/Write | 전체 규칙 적용 |
| **새 컴포넌트 생성** | 새 파일 Write | 2(재사용), 3(스타일), 4(타입), 7(주석), 8(폰트), 9(아이콘) |
| **UI 요소 변경** | 버튼, 배지, 드롭다운, 아이콘 등 수정 | 1(일관성), 10(아이콘), 11(Google UX), 12(hover) |
| **로직/상태 변경** | hook, service, util 수정 | 4(타입), 5(상수), 6(상태), 7(주석) |
| **스타일 변경** | 색상, 크기, 간격 수정 | 1(일관성), 3(스타일), 8(폰트) |
| **아이콘 추가/변경** | Heroicon import 또는 사용 | 9(금지사항), 10(매핑표) |
| **수정 완료 후** | 코드 변경 마무리 시점 | 13(사이드이펙트 점검) 필수 수행 |

---

## ⚡ 수정 작업 3단계 프로세스 (모든 코드 수정 시 필수)

코드를 수정하기 **전 → 중 → 후** 반드시 아래 순서를 따른다.

### STEP 1 — 수정 전: 영향 범위 파악

```
□ 이 UI/로직과 동일한 역할을 하는 곳이 앱에 몇 곳 더 있는가?
□ 이 컴포넌트를 사용하는 상위 컴포넌트는 어디인가?
□ 수정하는 타입/인터페이스를 사용하는 파일이 더 있는가?
□ 수정하는 상수/스타일을 참조하는 곳이 더 있는가?
```

→ 파악된 모든 연관 파일을 수정 범위에 포함한다.

```bash
grep -r "컴포넌트명" src/ --include="*.tsx"   # 사용처 전수 파악
grep -r "S\.스타일키" src/ --include="*.tsx"  # 스타일 참조 파악
```

### STEP 2 — 수정 중: 일관성 강제 체크

```
□ 같은 역할의 컴포넌트를 새로 만들지 않고 기존 것을 재사용하는가?
□ 색상값을 하드코딩하지 않고 S 객체 또는 상수를 쓰는가?
□ any 타입을 쓰지 않는가?
□ 이모지를 쓰지 않고 Heroicons를 쓰는가?
□ 아이콘이 매핑 표에 있는 것과 일치하는가?
□ 한글 주석이 "왜"를 설명하고 있는가?
```

### STEP 3 — 수정 후: 사이드 이펙트 점검

```
□ 리스트 / 칸반 / 캘린더 / 대시보드 뷰에서 정상 동작하는가?
□ 수정 모달/폼에서 정상 동작하는가?
□ Firebase 저장/불러오기에 영향이 없는가?
□ 타입 오류(TypeScript)가 발생하지 않는가?
□ 연관된 모든 파일을 함께 수정했는가?
```

→ 위 항목 중 하나라도 "아니오"라면 완료 선언을 하지 않는다.

---

## 1. 일관성 원칙 (Consistency First)

**코드를 수정할 때는 해당 코드만 수정하지 않는다. 동일한 목적의 코드가 앱 어디에 있든 모두 함께 수정한다.**

앱의 같은 기능이 화면마다 다르게 동작하면 사용자가 혼란스럽다. 일관성은 사용자 경험의 가장 기본이다.

### 예시
- 날짜 선택 UI를 변경했다면 → 리스트 뷰, 칸반 뷰, 수정 모달, 추가 폼 등 날짜를 입력하는 **모든 곳**에 동일하게 적용
- 버튼 스타일을 변경했다면 → 같은 역할의 버튼이 있는 **모든 컴포넌트**에 적용
- 상태 배지 디자인을 변경했다면 → 리스트, 칸반, 캘린더, 대시보드 등 배지가 쓰이는 **모든 곳**에 적용
- 드롭다운 선택 UI를 변경했다면 → 우선순위, 상태, 담당자, 프로젝트 등 드롭다운을 쓰는 **모든 곳**에 적용

### 체크 방법
수정 전 반드시 아래 질문에 답한다:
> "이와 동일한 역할을 하는 UI/로직이 다른 곳에도 있는가?"
있다면 그 모든 곳을 함께 수정한다.

---

## 2. 컴포넌트 재사용 원칙

**기존 공통 컴포넌트가 있으면 절대 새로 만들지 않는다.**

새 컴포넌트를 만드는 순간 버그도 두 배가 된다. 공통 컴포넌트를 고치면 한 번에 전체가 고쳐지지만, 따로 만들면 고칠 때마다 N곳을 찾아가야 한다.

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

### 위반 패턴

```tsx
// ❌ input type="date" 직접 사용 → ✅ <DateTimePicker value={date} onChange={setDate} />
// ❌ position:absolute div로 드롭다운 직접 구현 → ✅ <DropPanel options={...} />
```

---

## 3. 스타일 관리

**색상/크기/간격을 컴포넌트 내부에 직접 쓰지 않는다.**

- 인라인 스타일은 `src/styles.ts`의 `S` 객체를 통해 관리한다.
- 동일한 스타일을 여러 컴포넌트에 직접 복붙하지 않는다.
- 새 스타일이 필요하면 `S` 객체에 추가하고 참조해서 사용한다.
- 색상값(hex)을 컴포넌트 내에 하드코딩하지 않는다.

### 위반 패턴

```tsx
// ❌ 하드코딩
<div style={{ color: '#2563eb', fontSize: 13 }}>
// ✅ S 객체 참조
<div style={S.primaryText}>

// ❌ 여러 컴포넌트에 같은 스타일 복붙
<span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>
// ✅ styles.ts에 정의 후 참조
<span style={S.badge}>
```

---

## 4. 타입 관리

**`any`는 타입을 포기하는 것이다. 쓰지 않는다.**

- 새로운 데이터 구조가 생기면 반드시 `src/types.ts`에 타입을 정의한다.
- `any` 타입 사용을 금지한다. 불가피한 경우 `// TODO: 타입 정의 필요 — 이유:` 주석과 함께 `unknown`을 사용한다.
- 기존 타입(`Todo`, `Project`, `Filters` 등)을 변경할 때 해당 타입을 사용하는 **모든 파일**을 함께 수정한다.

```bash
# 타입 변경 전 반드시 실행
grep -r "Todo\b\|Project\b\|Filters\b" src/ --include="*.ts" --include="*.tsx"
```

---

## 5. 상수 관리

**문자열/숫자를 컴포넌트 안에 직접 쓰면 변경할 때 전수 수정이 필요해진다.**

- 하드코딩된 문자열(상태명, 우선순위명, 팀원명 등)을 컴포넌트 내부에 직접 쓰지 않는다.
- 고정값은 `src/constants.ts`에서 관리한다.
- 앱 전반에서 반복 사용되는 숫자(최대 글자 수, 기본값 등)도 상수로 정의한다.

```tsx
// ❌ if (todo.priority === '긴급') / <input maxLength={200} />
// ✅ if (todo.priority === PRIORITY.URGENT) / <input maxLength={MAX_TITLE_LENGTH} />
```

---

## 6. 상태 관리

**전역 상태와 로컬 상태를 혼용하지 않는다.**

- 전역 앱 상태는 `src/hooks/useTodoApp.ts`에서 관리한다.
- 컴포넌트 내부에서만 쓰이는 UI 상태(모달 열림 여부 등)는 로컬 `useState`로 관리한다.
- `useTodoApp`에 이미 있는 상태를 컴포넌트 내부에 중복으로 선언하지 않는다.

```
→ 다른 컴포넌트에서도 필요한가?          YES → useTodoApp
→ 새로고침 후에도 유지되어야 하나?        YES → useTodoApp + Firebase
→ 이 컴포넌트 내부에서만 쓰이는 상태인가?  YES → 로컬 useState
```

---

## 7. 한글 주석 규칙

**코드를 작성하거나 수정할 때 비개발자도 이해할 수 있도록 한글 주석을 반드시 작성한다.**

### 언제 주석을 달아야 하는가 (발동 조건)

아래 중 하나라도 해당하면 주석 없이 완료 선언을 하지 않는다:

| 상황 | 설명 내용 |
|------|----------|
| 함수/컴포넌트 새로 만들 때 | 이 코드가 무슨 역할을 하는가 |
| if 조건문 작성 시 | 왜 이 조건을 체크하는가 |
| 복잡한 계산/변환 로직 | 무엇을 계산하는가, 왜 이렇게 계산하는가 |
| 이벤트 핸들러 작성 시 | 어떤 사용자 행동에 반응하는가 |
| Firebase/API 호출 | 어떤 데이터를 가져오거나 저장하는가 |
| zoom 보정 계산 | zoom 1.5 보정임을 명시 |

### 주석 작성 기준
- **무엇을** 하는지보다 **왜** 하는지를 중심으로 설명한다.
- 개발 용어를 그대로 쓰지 않고 풀어서 설명한다.

### 좋은 주석 vs 나쁜 주석

```tsx
// ❌ const filtered = todos.filter(t => t.status === 'done')
// ✅ // 완료된 업무만 목록 하단에 접혀 표시하기 위해 분리
//    const completedTodos = todos.filter(t => t.status === 'done')

// ❌ if (!user) return null
// ✅ // 로그인하지 않은 상태에서는 렌더링하지 않음 — Firebase auth 로드 전 깜빡임 방지
//    if (!user) return null

// ❌ const x = rect.left / 1.5
// ✅ // 앱 전체에 zoom:1.5 적용으로 getBoundingClientRect() 좌표를 보정
//    const correctedLeft = rect.left / 1.5
```

### 주석을 달지 않아도 되는 곳
- 변수명만으로 의미가 명확한 단순 대입 (`const title = todo.title`)
- 이미 주석이 있는 공통 컴포넌트를 단순 호출하는 JSX

---

## 8. 폰트 통일

**Pretendard 외 다른 폰트 패밀리는 사용하지 않는다.**

- 앱 전체에서 **Pretendard 패밀리**만 사용: `'Pretendard', system-ui, sans-serif`
- Pretendard 계열 굵기(ExtraBold, Bold, SemiBold, Medium, Regular)는 자유롭게 사용 가능.
- `monospace`, `serif`, `cursive` 등 다른 폰트 패밀리는 사용하지 않는다.
- 새 컴포넌트에서 `fontFamily`를 직접 지정하지 않고 최상위 `S.wrap`에서 상속받는다.
- `input`, `button`, `textarea`, `select`에는 `fontFamily: 'inherit'`을 사용한다.

---

## 9. 이모지 사용 금지 — Heroicons 사용

**UI에 이모지를 사용하지 않는다. Heroicons만 사용한다.**

- 이모지는 OS/브라우저마다 렌더링이 다르다 (Windows ↔ macOS ↔ Android)
- CSS로 크기/색상/정렬을 제어할 수 없다
- 앱 전체 톤이 산만해진다

### Heroicons 사용 규칙
- **패키지**: `@heroicons/react`
- **기본 스타일**: `24/outline` (선이 깔끔함)
- **강조 전용**: `24/solid` (즐겨찾기 활성 등 제한적 사용)
- **크기**: 인라인 `style`로 `width`, `height` 지정 (기본 `16px`)
- **색상**: `currentColor` 기본 (부모 `color` 자동 상속)

```tsx
// ❌ 금지
<button>📁 프로젝트</button>

// ✅ 허용
import { FolderIcon } from '@heroicons/react/24/outline'
<button><FolderIcon style={{width:14,height:14}}/> 프로젝트</button>
```

---

## 10. 아이콘 일관성 원칙

**같은 개념에는 전체 앱에서 반드시 동일한 아이콘을 사용한다.**

### 아이콘 매핑 표 (단일 출처 — 이 표에 없는 개념은 추가 후 사용)

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

### 새 아이콘 추가 프로세스
1. 위 매핑 표에서 해당 개념이 이미 있는지 확인
2. 있으면 → 그 아이콘 그대로 사용 (다른 아이콘으로 대체 금지)
3. 없으면 → heroicons.com에서 선택 후 매핑 표에 행 추가 후 사용

---

## 11. UI/UX 표준 — Google 생태계 기준

**UI 디자인과 인터랙션 모두 Google 서비스를 표준으로 삼는다.**

대상: Google Tasks, Google Calendar, Gmail, Google Sheets, Google Keep

> "Google 서비스에서 이와 같은 기능은 어떻게 보이고, 어떻게 동작하는가?"
>
> 해당 패턴이 있다면 UI와 동작 모두 그것을 따른다.

### 핵심 적용 기준

| 영역 | Google 기준 |
|------|------------|
| 전체 톤 | Material Design 3 — 밝은 배경, 부드러운 그림자, 둥근 모서리 |
| 주요 색상 | Google Blue(#1a73e8 계열) |
| 리스트 조작 | Google Tasks 방식 — 인라인 편집, 체크박스, 드래그 정렬 |
| 캘린더 | Google Calendar 방식 — 날짜 클릭 빠른 추가, 드래그 이동 |
| 토스트 | Gmail 방식 — 하단 토스트 + "실행 취소" 버튼 |
| 모달 | Material Design — 명확한 제목, 우측 하단 액션, ESC 닫기 |
| 필터/검색 | Gmail 방식 — 검색창 + 필터 칩 조합 |

---

## 12. 아이콘 hover 효과 규칙

**클릭 가능한 아이콘에는 반드시 hover 효과를 적용한다.**

hover 없는 아이콘은 클릭 가능한지 알 수 없다.

### 적용 기준

| 상태 | 색상 | stroke-width |
|------|------|-------------|
| 기본 | `#94a3b8` | `1.5` |
| hover | `#334155` | `2.5` |
| transition | `color .12s` | — |

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

### 적용 대상 (새로 추가하는 클릭 가능 아이콘에도 모두 적용)
- 사이드바 섹션 접기/펼치기 아이콘
- 사이드바 확장/좁히기 아이콘
- 모달/패널 닫기 아이콘
- 업무 추가 섹션 접기/펼치기 아이콘
- 테이블 행 hover 시 나타나는 액션 아이콘

---

## 13. 수정 시 사이드 이펙트 점검

**완료 선언 전 반드시 아래 전 항목을 확인한다. 하나라도 "아니오"면 완료 선언 금지.**

- [ ] 리스트 / 칸반 / 캘린더 / 대시보드 뷰에서 정상 동작하는가?
- [ ] 수정 모달/폼에서 정상 동작하는가?
- [ ] Firebase 저장/불러오기에 영향이 없는가?
- [ ] 타입 오류(TypeScript)가 발생하지 않는가?
- [ ] 동일 역할의 다른 컴포넌트도 함께 수정했는가?
- [ ] 공통 컴포넌트 대신 새로 만든 것은 없는가?
- [ ] 색상/크기를 하드코딩한 곳은 없는가?
- [ ] 이모지를 쓴 곳은 없는가?
- [ ] 매핑 표에 없는 아이콘을 임의로 쓴 곳은 없는가?
- [ ] position:fixed/absolute 팝업 좌표에 zoom 1.5 보정이 적용되었는가?
- [ ] getBoundingClientRect() 사용 시 zoom 보정이 적용되었는가?

---

## 빠른 참조 — 규칙 번호 색인

| 상황 | 참조 규칙 |
|------|----------|
| "이 UI를 수정하려는데 다른 곳도 고쳐야 하나?" | **#1 일관성** |
| "이 기능을 새 컴포넌트로 만들어도 되나?" | **#2 재사용** |
| "이 색상을 인라인으로 써도 되나?" | **#3 스타일** |
| "여기서 any를 써도 되나?" | **#4 타입** |
| "이 문자열을 직접 써도 되나?" | **#5 상수** |
| "이 상태를 어디에 선언해야 하나?" | **#6 상태** |
| "주석을 어떻게 써야 하나?" | **#7 주석** |
| "이 폰트를 써도 되나?" | **#8 폰트** |
| "아이콘을 이모지로 써도 되나?" | **#9 이모지 금지** |
| "이 개념에 어떤 아이콘을 써야 하나?" | **#10 아이콘 매핑** |
| "이 UI 패턴이 Google 서비스와 맞나?" | **#11 Google UX** |
| "이 버튼에 hover 효과가 필요한가?" | **#12 hover** |
| "수정이 끝났는데 완료 선언해도 되나?" | **#13 사이드이펙트** |
