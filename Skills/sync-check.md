# 설정-뷰 연동 점검 (sync-check)

> 설정(SettingsMgr)에서 변경한 값이 모든 뷰에 올바르게 반영되는지 코드 레벨에서 자동 점검한다.

## 발동 조건

- 사용자가 `/sync-check` 또는 "설정 연동 확인해" 요청 시
- 설정 관련 코드(memberColors, priC, stC 등) 수정 후

## 점검 절차

### 1단계: 담당자 색상 누락 찾기

`avColor()`만 쓰고 `memberColors` 체크를 안 하는 곳을 찾는다:

```bash
# memberColors 없이 avColor만 쓰는 아바타 — 설정 색상 미반영 위험
grep -rn "avColor(" src/ --include="*.tsx" | grep -v "memberColors" | grep -v "node_modules"
```

**기대 결과**: 모든 아바타에 `memberColors[name] || avColor(name)` 패턴 적용

### 2단계: 우선순위/상태 색상 하드코딩 찾기

```bash
# priC/stC를 안 쓰고 색상을 직접 쓴 곳 — 설정 변경 미반영 위험
grep -rn "background.*#.*pri\|color.*#.*pri\|background.*#.*stat" src/ --include="*.tsx"
```

### 3단계: 설정 props 전달 추적

새 컴포넌트에 memberColors, priC, stC 등이 전달되지 않은 곳을 찾는다:

```bash
# memberColors를 사용하는 파일 목록 vs 아바타를 렌더링하는 파일 목록 비교
grep -rln "memberColors" src/ --include="*.tsx"
grep -rln "avColor\|avColor2\|avInitials" src/ --include="*.tsx"
```

두 목록이 일치하지 않으면 → `memberColors` 미전달 파일 존재

### 4단계: Firestore 저장/복원 일치 확인

```bash
# 저장되는 필드
grep -o "[a-zA-Z]*:" src/hooks/useTodoApp.ts | head -30  # data 객체 근처

# 복원되는 필드
grep "if (d\." src/hooks/useTodoApp.ts
```

### 5단계: 크로스 뷰 일관성

모든 뷰에서 동일 데이터가 동일하게 표시되는지 확인:

| 확인 항목 | 리스트 | 메모 | 칸반 | 캘린더 | 대시보드 |
|----------|--------|------|------|--------|---------|
| 담당자 아바타 색상 | memberColors 사용? | memberColors 사용? | — | — | — |
| 프로젝트 도트 색상 | p.color? | p.color? | p.color? | p.color? | p.color? |
| 우선순위 배지 | priC 사용? | priC 사용? | priC 사용? | — | priC 사용? |
| 상태 배지 | stC 사용? | — | stC 사용? | — | stC 사용? |

## 보고 형식

```
### 연동 점검 결과

✅ 정상: N개 항목
❌ 누락: N개 항목
  - [파일:행] 설명

### 조치 필요 사항
1. ...
```
