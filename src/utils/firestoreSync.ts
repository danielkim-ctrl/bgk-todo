// Phase 2-3 Firestore 서브컬렉션 I/O 레이어
//
// - `todos_db/team/meta/main` (설정류 단일 문서)
// - `todos_db/team/items/{id}` (각 todo 개별 문서)
// - `todos_db/team/templates/{id}` (각 템플릿 개별 문서)
//
// 실시간 동기화: onSnapshot(collection) → 증분 변경 수신
// 쓰기: setDoc / updateDoc / deleteDoc — 문서 단위
//
// 마이그레이션 미완료 상태 자동 처리:
//   useTodoAppSync.ensureReady() 가 meta/main 존재 여부 확인,
//   없으면 migrateFirestoreSubcollections() 자동 실행.

import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import { migrateFirestoreSubcollections } from "./migrateFirestoreSubcollections";
import type { Todo, TodoTemplate } from "../types";

const metaRef = () => doc(db, "todos_db", "team", "meta", "main");
const itemRef = (id: number | string) => doc(db, "todos_db", "team", "items", String(id));
const itemsCol = () => collection(db, "todos_db", "team", "items");
const tplRef = (id: string) => doc(db, "todos_db", "team", "templates", id);
const tplCol = () => collection(db, "todos_db", "team", "templates");

/** meta/main 존재·완료 플래그(_migratedAt) 확인 + 미완료면 마이그레이션 자동 실행 */
export async function ensureSubcollectionReady(): Promise<{ ready: boolean; migrated: boolean }> {
  try {
    const s = await getDoc(metaRef());
    // 완료 플래그 존재 시에만 ready로 판정 (부분 실패 상태 감지)
    if (s.exists() && s.data()?._migratedAt) {
      return { ready: true, migrated: false };
    }
    console.warn("[SYNC] meta/main 없음 또는 _migratedAt 플래그 누락 — 자동 마이그레이션 시도");
    const result = await migrateFirestoreSubcollections();
    return { ready: result.ok, migrated: true };
  } catch (e) {
    console.error("[SYNC] 준비 실패:", e);
    return { ready: false, migrated: false };
  }
}

/** meta 문서 실시간 구독 */
export function subscribeMeta(cb: (data: any) => void): Unsubscribe {
  return onSnapshot(metaRef(), (s) => {
    if (s.exists()) cb(s.data());
  });
}

/** todos 컬렉션 실시간 구독 — 전체 상태를 배열로 전달 */
export function subscribeTodos(cb: (todos: Todo[]) => void): Unsubscribe {
  return onSnapshot(itemsCol(), (snap) => {
    const todos = snap.docs.map((d) => d.data() as Todo);
    cb(todos);
  });
}

/** templates 컬렉션 실시간 구독 */
export function subscribeTemplates(cb: (templates: TodoTemplate[]) => void): Unsubscribe {
  return onSnapshot(tplCol(), (snap) => {
    const tpls = snap.docs.map((d) => d.data() as TodoTemplate);
    cb(tpls);
  });
}

// ── 쓰기 API ────────────────────────────────────────────────────────────────

/** todo 하나 저장 (신규/전체 덮어쓰기) */
export async function writeTodo(todo: Todo): Promise<void> {
  await setDoc(itemRef(todo.id), todo);
}

/** todo 일부 필드 업데이트 */
export async function patchTodo(id: number, patch: Partial<Todo>): Promise<void> {
  await updateDoc(itemRef(id), patch as any);
}

/** todo 삭제 */
export async function removeTodo(id: number): Promise<void> {
  await deleteDoc(itemRef(id));
}

/** 여러 todo 동시 쓰기 (AI 배치 / 템플릿 적용) */
export async function writeTodosBatch(todos: Todo[]): Promise<void> {
  const BATCH = 400;
  for (let i = 0; i < todos.length; i += BATCH) {
    const chunk = todos.slice(i, i + BATCH);
    const batch = writeBatch(db);
    chunk.forEach((t) => batch.set(itemRef(t.id), t));
    await batch.commit();
  }
}

/** 템플릿 저장/업데이트 */
export async function writeTemplate(tpl: TodoTemplate): Promise<void> {
  await setDoc(tplRef(tpl.id), tpl);
}

export async function patchTemplate(id: string, patch: Partial<TodoTemplate>): Promise<void> {
  await updateDoc(tplRef(id), patch as any);
}

export async function removeTemplate(id: string): Promise<void> {
  await deleteDoc(tplRef(id));
}

/** meta 문서 전체 덮어쓰기 — 설정류는 크기 작고 동시 편집 드물어 전체 쓰기로 충분 */
export async function writeMeta(meta: any): Promise<void> {
  await setDoc(metaRef(), { ...meta, _updatedAt: Date.now() });
}

/** meta 문서 일부 필드만 업데이트 */
export async function patchMeta(patch: Record<string, any>): Promise<void> {
  await updateDoc(metaRef(), { ...patch, _updatedAt: Date.now() });
}
