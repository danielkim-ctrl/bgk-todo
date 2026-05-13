import {
  doc, collection, setDoc, updateDoc, deleteDoc, deleteField,
  onSnapshot, writeBatch, Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Todo, TodoTemplate, Project, Team } from "../types";

// 참조 헬퍼 — 서브컬렉션 경로를 한 곳에서 관리하여 오타 방지
const metaRef = () => doc(db, "todos_db", "team", "meta", "main");
// teams를 meta/main에서 분리 — 독립 문서로 저장해 다른 설정 변경과 충돌 방지
const teamsRef = () => doc(db, "todos_db", "team", "meta", "teams");
const itemRef = (id: number | string) => doc(db, "todos_db", "team", "items", String(id));
const itemsCol = () => collection(db, "todos_db", "team", "items");
const tplRef = (id: string) => doc(db, "todos_db", "team", "templates", id);
const tplCol = () => collection(db, "todos_db", "team", "templates");
const projRef = (id: number | string) => doc(db, "todos_db", "team", "projects", String(id));
const projCol = () => collection(db, "todos_db", "team", "projects");
// 숨김 상태(hiddenProjects/hiddenMembers)를 meta와 분리한 독립 문서
// — 사용자가 토글할 때마다 즉시 저장, 400ms debounce·다른 설정과의 race 제거
const hiddenRef = () => doc(db, "todos_db", "team", "meta", "hidden");

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

// Firestore는 undefined 값을 직렬화하지 못하므로 저장 전 제거
// RepeatConfig의 time/endDate/endCount 등 조건부 undefined 필드 대응
function stripUndefined(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return obj;
}

// todo 하나 저장 (신규 또는 전체 덮어쓰기)
export async function writeTodo(todo: Todo): Promise<void> {
  await setDoc(itemRef(todo.id), stripUndefined(todo));
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
    chunk.forEach((t) => batch.set(itemRef(t.id), stripUndefined(t)));
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

// meta 문서 부분 덮어쓰기 — merge:true로 기존 필드 유지 (teams 필드가 남아있어도 덮어쓰지 않음)
// todos/templates/projects/teams는 이 함수에 포함하지 않음 (개별 CRUD로 관리)
export async function writeMeta(meta: any): Promise<void> {
  await setDoc(metaRef(), { ...meta, _updatedAt: Date.now() }, { merge: true });
}

// meta/main에서 teams 필드 제거 — meta/teams로 마이그레이션 후 호출하여 혼동 방지
export async function cleanMetaTeamsField(): Promise<void> {
  try {
    await updateDoc(metaRef(), { teams: deleteField(), teamNId: deleteField() });
  } catch {
    // 문서가 없거나 필드가 없으면 무시
  }
}

// teams 독립 문서 구독 — 서버 확정 데이터만 수신 (includeMetadataChanges 제거)
export function subscribeTeams(
  cb: (data: { teams: Team[]; teamNId: number } | null) => void
): Unsubscribe {
  return onSnapshot(
    teamsRef(),
    (s) => {
      const data = s.exists() ? s.data() as { teams: Team[]; teamNId: number } : null;
      cb(data);
    },
    (err) => console.warn("[SYNC] subscribeTeams 실패:", err)
  );
}

// teams 독립 문서 저장 — meta/main의 다른 필드와 완전히 독립된 쓰기
export async function writeTeams(teams: Team[], teamNId: number): Promise<void> {
  await setDoc(teamsRef(), { teams: stripUndefined(teams), teamNId, _updatedAt: Date.now() });
}

// projects 서브컬렉션 실시간 구독 — 개별 프로젝트 문서 변경 즉시 반영
// (meta 전체 덮어쓰기 race 차단 — 다중 클라이언트가 같은 meta를 stale 데이터로 덮어써서
//  사용자 편집이 원복되던 문제 해결)
// 에러 핸들러: rules 미배포 등으로 listener가 실패하면 콘솔 경고 (cb는 호출 안 됨)
export function subscribeProjects(cb: (projects: Project[]) => void): Unsubscribe {
  return onSnapshot(projCol(),
    (snap) => cb(snap.docs.map((d) => d.data() as Project)),
    (err) => console.warn("[SYNC] subscribeProjects 실패 — Firestore rules에 /todos_db/team/projects 경로가 허용되어 있는지 확인:", err)
  );
}

// 프로젝트 하나 저장 (신규 또는 전체 덮어쓰기) — undefined 필드는 Firestore 거부 → 제거 후 저장
export async function writeProject(project: Project): Promise<void> {
  const clean: any = {};
  for (const [k, v] of Object.entries(project)) {
    if (v !== undefined) clean[k] = v;
  }
  await setDoc(projRef(project.id), clean);
}

// 프로젝트 삭제
export async function removeProject(id: number): Promise<void> {
  await deleteDoc(projRef(id));
}

// 숨김 상태 독립 문서 구독 — 사용자별 hiddenProjects/hiddenMembers 즉시 동기화
// 구조: { [userId]: { hiddenProjects: number[], hiddenMembers: string[], _clientId: string } }
export function subscribeHidden(
  cb: (data: Record<string, { hiddenProjects?: number[]; hiddenMembers?: string[]; _clientId?: string }>) => void
): Unsubscribe {
  return onSnapshot(
    hiddenRef(),
    (s) => cb(s.exists() ? (s.data() as any) : {}),
    (err) => console.warn("[SYNC] subscribeHidden 실패:", err)
  );
}

// 사용자별 숨김 상태 즉시 저장 — 토글 시점에 debounce 없이 바로 Firestore에 반영
// merge:true로 다른 사용자의 필드는 건드리지 않음
export async function writeUserHidden(
  userId: string,
  hiddenProjects: number[],
  hiddenMembers: string[],
  clientId: string
): Promise<void> {
  await setDoc(
    hiddenRef(),
    { [userId]: { hiddenProjects, hiddenMembers, _clientId: clientId, _updatedAt: Date.now() } },
    { merge: true }
  );
}

// 여러 프로젝트 동시 쓰기 (마이그레이션용)
export async function writeProjectsBatch(projects: Project[]): Promise<void> {
  const BATCH = 400;
  for (let i = 0; i < projects.length; i += BATCH) {
    const chunk = projects.slice(i, i + BATCH);
    const batch = writeBatch(db);
    chunk.forEach((p) => {
      const clean: any = {};
      for (const [k, v] of Object.entries(p)) {
        if (v !== undefined) clean[k] = v;
      }
      batch.set(projRef(p.id), clean);
    });
    await batch.commit();
  }
}
