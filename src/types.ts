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
