export interface Project {
  id: number;
  name: string;
  color: string;
  status: string;
}

// 활동 로그 엔트리 — todo의 생성/수정/완료/메모 이력을 기록
export interface ActivityLog {
  id: string;        // 고유 ID (타임스탬프+랜덤)
  at: string;        // ISO 타임스탬프
  who: string;       // 작성자 이름
  action: "create" | "update" | "complete" | "reopen" | "comment";
  changes?: { field: string; from: string; to: string }[]; // 변경된 필드 목록
  comment?: string;  // 메모 본문
}

export interface Todo {
  id: number;
  pid: number;
  task: string;
  who: string;
  due: string;
  pri: string;
  st: string;
  det: string;
  cre: string;
  done: string | null;
  repeat: string;
  noteColor?: number;
  memoOrder?: number;
  teamId?: string;       // 소속 팀 ID (미지정 시 관리자만 조회 가능)
  logs?: ActivityLog[];  // 활동 로그 기록
  _instance?: boolean;
  _originDue?: string;
}

export interface ToastState {
  m: string;
  t: string;
  /** 토스트에 표시할 액션 버튼 (예: "실행 취소") */
  action?: { label: string; fn: () => void };
}

export interface Filters {
  proj: string[];
  who: string[];
  pri: string[];
  st: string[];
  repeat: string[];
  fav: string;
}

export interface NewRow {
  pid: string;
  task: string;
  who: string;
  due: string;
  pri: string;
  det: string;
  repeat: string;
}

export interface AiParsed {
  task: string;
  assignee: string | null;
  due: string | null;
  priority: string;
  project: string | null;
  detail: string | null;
  repeat: string;
  _chk: boolean;
  _i: number;
}

export interface DatePopState {
  id: number;
  rect: DOMRect;
  value: string;
}

export interface NotePopupState {
  todo: any;
  x: number;
  y: number;
  _newRow?: number;
}

// ─── 팀·권한 시스템 ──────────────────────────────────────────────────────────

/** 팀 내 역할 — 3단계 */
export type TeamRole = "admin" | "editor" | "viewer";

/** 팀 소속 멤버 (1인 1팀 소속) */
export interface TeamMember {
  name: string;       // members 배열의 이름과 동일
  role: TeamRole;     // 팀 내 역할
}

/** 팀 (조직도 단위) */
export interface Team {
  id: string;                          // "team-001" 등 고유 ID
  name: string;                        // "마케팅팀"
  color: string;                       // "#2563eb"
  members: TeamMember[];               // 소속 멤버 + 역할
  projectIds: number[];                // 담당 프로젝트 ID 목록
  createdAt: string;                   // YYYY-MM-DD
}

/** 역할별 허용 동작 — UI에서 버튼 활성/비활성 판단용 */
export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  admin: "관리자",
  editor: "편집자",
  viewer: "뷰어",
};

export const TEAM_ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  admin:  ["todo.create","todo.edit.own","todo.edit.all","todo.delete.own","todo.delete.all","team.view.other","project.manage","member.manage","settings.edit","ai.use"],
  editor: ["todo.create","todo.edit.own","todo.edit.all","todo.delete.own","project.manage","member.manage","ai.use"],
  viewer: ["todo.create","todo.edit.own","todo.delete.own","ai.use"],
};

/** 권한 항목 목록 + 한글 라벨 — 관리자 권한 설정 UI에서 사용 */
export const ALL_PERMISSIONS: { key: string; label: string }[] = [
  { key: "todo.create",     label: "업무 생성" },
  { key: "todo.edit.own",   label: "본인 업무 수정" },
  { key: "todo.edit.all",   label: "타인 업무 수정" },
  { key: "todo.delete.own", label: "본인 업무 삭제" },
  { key: "todo.delete.all", label: "타인 업무 삭제" },
  { key: "team.view.other", label: "타 팀 조회" },
  { key: "project.manage",  label: "프로젝트 관리" },
  { key: "member.manage",   label: "멤버 관리" },
  { key: "settings.edit",   label: "설정 변경" },
  { key: "ai.use",          label: "AI 자동입력" },
];

// ─── 반복 설정 (Google Tasks 스타일) ──────────────────────────────────────────
// "없음" 문자열이면 반복 없음, 객체면 상세 반복 설정
// 레거시 호환: "매일"|"매주"|"매월" 문자열도 읽기 시 자동 변환
export interface RepeatConfig {
  interval: number;          // 반복 간격 (1 이상)
  unit: "일" | "주" | "월";  // 간격 단위
  time?: string;             // 반복 시간 (HH:MM, 선택)
  start: string;             // 시작 날짜 (YYYY-MM-DD)
  endType: "none" | "date" | "count"; // 종료 조건
  endDate?: string;          // endType="date" 시 종료 날짜
  endCount?: number;         // endType="count" 시 반복 횟수
}

// ─── 사용자 정의 정렬 순서 ────────────────────────────────────────────────────
// 각 정렬 기준(프로젝트, 담당자, 우선순위, 상태)별로 사용자가 원하는 값 나열 순서를 저장
// 예: { pid: ["3","1","2"] } → 프로젝트 ID 3번을 가장 먼저 표시
export interface CustomSortOrders {
  [sortCol: string]: string[];
}

// 다중 정렬 기준 — 여러 필드를 순서대로 적용 (예: 프로젝트순 → 그 안에서 담당자순)
export interface SortField {
  col: string;
  dir: "asc" | "desc";
}

// ─── 저장된 필터 조합 ──────────────────────────────────────────────────────────
// 사용자가 자주 쓰는 필터 조합을 이름과 함께 저장해두고 칩으로 빠르게 재적용
export interface SavedFilter {
  id: string;       // Date.now() 기반 고유 ID
  name: string;     // 사용자가 지정한 필터 이름
  filters: Filters; // 저장 시점의 필터 상태
  search: string;   // 저장 시점의 검색어
}

// ─── 삭제된 업무 기록 ──────────────────────────────────────────────────────────

// 삭제된 업무 기록 (localStorage에 보관, 데일리 활동 로그에서 사용)
export interface DeletedTodo {
  id: number;
  task: string;
  who: string;
  pid: number;
  pri: string;
  st: string;
  repeat: string;
  det: string;
  deletedAt: string; // "YYYY-MM-DD"
}
