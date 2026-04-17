# 배포 (deploy)

> 타입 체크 → 변경 내용 분석 → 커밋 → GitHub 푸시를 한 번에 실행한다.

## 발동 조건

- 사용자가 `/deploy` 또는 "배포해", "git에 올려", "커밋하고 푸시해" 요청 시

## 실행 절차

### 1단계: 타입 체크 (빌드 검증)

```bash
npx tsc --noEmit
```

오류가 있으면 **즉시 중단**하고 오류 내용을 보고한다. 절대 오류가 있는 상태로 커밋하지 않는다.

### 2단계: 변경 내용 파악

```bash
git status --short
git diff --stat
git log --oneline -3
```

### 3단계: 커밋 메시지 작성

변경 내용을 분석하여 한글 커밋 메시지를 자동 생성한다:

**메시지 형식:**
```
<type>: <한 줄 요약>

## 상세 내용
- 변경사항 1
- 변경사항 2

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

**type 기준:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `style`: UI/스타일 변경
- `refactor`: 리팩토링
- `docs`: 문서 변경
- 여러 유형이 섞이면 가장 큰 변경 기준으로 선택

### 4단계: 커밋 + 푸시

```bash
git add <변경된 파일들>
git commit -m "<메시지>"
git push origin main
```

### 5단계: 결과 보고

```
✅ 배포 완료
- 커밋: <hash>
- 변경: N개 파일, +N줄 / -N줄
- 브랜치: main → origin/main
```

## 주의사항

- `.env`, `credentials.json` 등 민감 파일은 절대 커밋하지 않는다
- `git add .` 대신 변경된 파일을 명시적으로 지정한다
- 커밋 전 사용자에게 메시지를 보여주고 확인받는다
