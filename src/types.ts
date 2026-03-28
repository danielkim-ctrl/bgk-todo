export interface Project {
  id: number;
  name: string;
  color: string;
  status: string;
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

// ─── 권한 시스템 ─────────────────────────────────────────────────────────────

/** 사용자 역할 */
export type Role = "admin" | "manager" | "member" | "viewer";

/** 세분화된 권한 목록 */
export type Permission =
  | "todo.create"
  | "todo.edit.own"    // 본인 할일만 수정
  | "todo.edit.all"    // 모든 할일 수정
  | "todo.delete.own"
  | "todo.delete.all"
  | "project.manage"
  | "member.manage"
  | "priority.manage"
  | "settings.edit"
  | "ai.use";

/** 역할별 기본 권한 매핑 (나중에 커스터마이징 가능하도록 Record 형태) */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin:   ["todo.create","todo.edit.all","todo.delete.all","project.manage","member.manage","priority.manage","settings.edit","ai.use"],
  manager: ["todo.create","todo.edit.all","todo.delete.own","project.manage","settings.edit","ai.use"],
  member:  ["todo.create","todo.edit.own","todo.delete.own","ai.use"],
  viewer:  [],
};

/** 사용자별 역할 정보 (나중에 Firestore에서 관리 예정) */
export interface UserRole {
  name: string;  // members 배열의 이름과 동일
  role: Role;
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
