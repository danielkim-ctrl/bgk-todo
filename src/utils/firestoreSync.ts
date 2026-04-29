import {
  doc, collection, setDoc, updateDoc, deleteDoc,
  onSnapshot, writeBatch, Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Todo, TodoTemplate } from "../types";

// 참조 헬퍼 — 서브컬렉션 경로를 한 곳에서 관리하여 오타 방지
const metaRef = () => doc(db, "todos_db", "team", "meta", "main");
const itemRef = (id: number | string) => doc(db, "todos_db", "team", "items", String(id));
const itemsCol = () => collection(db, "todos_db", "team", "items");
const tplRef = (id: string) => doc(db, "todos_db", "team", "templates", id);
const tplCol = () => collection(db, "todos_db", "team", "templates");

// 메타(설정류) 단일 문서 실시간 구독 — projects, members, teams 등 설정 데이터
export function subscribeMeta(cb: (data: any) => void): Unsubscribe {
  return onSnapshot(metaRef(), (s) => {
    if (s.exists()) cb(s.data());
  });
}

// todos 컬렉션 실시간 구독 — 전체 배열로 콜백
// 개별 문서가 변경될 때마다 전체 컬렉션을 재조합하여 전달
export function subscribeTodos(cb: (todos: Todo[]) => void): Unsubscribe {
  return onSnapshot(itemsCol(), (snap) => {
    cb(snap.docs.map((d) => d.data() as Todo));
  });
}

// templates 컬렉션 실시간 구독
export function subscribeTemplates(cb: (templates: TodoTemplate[]) => void): Unsubscribe {
  return onSnapshot(tplCol(), (snap) => {
    cb(snap.docs.map((d) => d.data() as TodoTemplate));
  });
}

// todo 하나 저장 (신규 또는 전체 덮어쓰기)
export async function writeTodo(todo: Todo): Promise<void> {
  await setDoc(itemRef(todo.id), todo);
}

// todo 일부 필드만 업데이트
export async function patchTodo(id: number, patch: Partial<Todo>): Promise<void> {
  await updateDoc(itemRef(id), patch as any);
}

// todo 삭제
export async function removeTodo(id: number): Promise<void> {
  await deleteDoc(itemRef(id));
}

// 여러 todo 동시 쓰기 (AI 배치, 템플릿 적용)
// Firestore writeBatch는 500건 제한 — 400건씩 나눠서 안전하게 처리
export async function writeTodosBatch(todos: Todo[]): Promise<void> {
  const BATCH = 400;
  for (let i = 0; i < todos.length; i += BATCH) {
    const chunk = todos.slice(i, i + BATCH);
    const batch = writeBatch(db);
    chunk.forEach((t) => batch.set(itemRef(t.id), t));
    await batch.commit();
  }
}

// 템플릿 CRUD — 각 템플릿을 개별 문서로 저장
export async function writeTemplate(tpl: TodoTemplate): Promise<void> {
  await setDoc(tplRef(tpl.id), tpl);
}
export async function patchTemplate(id: string, patch: Partial<TodoTemplate>): Promise<void> {
  await updateDoc(tplRef(id), patch as any);
}
export async function removeTemplate(id: string): Promise<void> {
  await deleteDoc(tplRef(id));
}

// meta 문서 전체 덮어쓰기 — 설정류는 크기가 작아 전체 쓰기로 처리
// todos/templates는 이 함수에 포함하지 않음 (개별 CRUD로 관리)
export async function writeMeta(meta: any): Promise<void> {
  await setDoc(metaRef(), { ...meta, _updatedAt: Date.now() });
}
