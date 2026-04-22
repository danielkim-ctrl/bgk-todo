// Phase 1 — Firestore 서브컬렉션 마이그레이션
//
// 목적: 기존 단일 문서 `todos_db/team` 구조를
//   → `todos_db/team/meta/main` (설정류)
//   + `todos_db/team/items/{id}` (각 todo 문서)
//   + `todos_db/team/templates/{id}` (각 템플릿 문서)
// 로 분리.
//
// 특성:
//  - 원본 문서 삭제하지 않음 (롤백 가능)
//  - 실행 전 원본을 `todos_db/team_backup_{ts}`로 백업 복사
//  - idempotent: 여러 번 실행해도 결과 동일 (setDoc은 overwrite 동작)
//  - 실행 방법: 앱 로드 후 F12 콘솔에서 `await window.migrateFirestoreSubcollections()`
//
// 주의: 아직 읽기·쓰기 경로는 기존 단일 문서 그대로 사용 중. 이 스크립트는
// 단지 "서브컬렉션 구조를 서버에 만드는 것"까지만 수행. Phase 2-3에서
// 훅이 서브컬렉션을 구독·쓰도록 전환 예정.

import { doc, collection, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

type MigrationResult = {
  ok: boolean;
  todosMigrated: number;
  templatesMigrated: number;
  metaWritten: boolean;
  backupPath: string;
  errors: string[];
};

export async function migrateFirestoreSubcollections(): Promise<MigrationResult> {
  const errors: string[] = [];
  let todosMigrated = 0;
  let templatesMigrated = 0;
  let metaWritten = false;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `todos_db_backup/team_${ts}`;

  console.log("[MIGRATE] 시작 — 원본 문서 읽기");
  const srcRef = doc(db, "todos_db", "team");
  const snap = await getDoc(srcRef);
  if (!snap.exists()) {
    console.error("[MIGRATE] 원본 문서 없음 — 중단");
    return { ok: false, todosMigrated: 0, templatesMigrated: 0, metaWritten: false, backupPath: "", errors: ["원본 문서 없음"] };
  }
  const data = snap.data() as any;
  console.log("[MIGRATE] 원본 크기:", {
    todos: (data.todos || []).length,
    templates: (data.templates || []).length,
    projects: (data.projects || []).length,
    members: (data.members || []).length,
  });

  // 1. 원본 백업
  try {
    await setDoc(doc(db, "todos_db_backup", `team_${ts}`), data);
    console.log(`[MIGRATE] 백업 완료 → ${backupPath}`);
  } catch (e: any) {
    errors.push(`백업 실패: ${e.message}`);
    console.error("[MIGRATE] 백업 실패:", e);
    return { ok: false, todosMigrated: 0, templatesMigrated: 0, metaWritten: false, backupPath, errors };
  }

  // 2. meta 문서 생성 — todos와 templates를 제외한 모든 필드
  try {
    const meta = { ...data };
    delete meta.todos;
    delete meta.templates;
    delete meta._clientId; // 메타에는 동기화 메타데이터 불필요 (개별 문서가 각자 가짐)
    await setDoc(doc(db, "todos_db", "team", "meta", "main"), meta);
    metaWritten = true;
    console.log("[MIGRATE] meta/main 생성 완료");
  } catch (e: any) {
    errors.push(`meta 생성 실패: ${e.message}`);
    console.error("[MIGRATE] meta 생성 실패:", e);
  }

  // 3. todos 개별 문서 생성 — Firestore 배치는 500개 제한, 나눠서 처리
  const todos = Array.isArray(data.todos) ? data.todos : [];
  const BATCH = 400;
  for (let i = 0; i < todos.length; i += BATCH) {
    const chunk = todos.slice(i, i + BATCH);
    const batch = writeBatch(db);
    chunk.forEach((t: any) => {
      if (t?.id === undefined || t?.id === null) {
        errors.push(`todo ID 없음, 건너뜀: ${JSON.stringify(t).slice(0, 100)}`);
        return;
      }
      const ref = doc(db, "todos_db", "team", "items", String(t.id));
      batch.set(ref, t);
    });
    try {
      await batch.commit();
      todosMigrated += chunk.length;
      console.log(`[MIGRATE] todos 진행: ${todosMigrated}/${todos.length}`);
    } catch (e: any) {
      errors.push(`todos 배치 실패 (${i}~${i + chunk.length}): ${e.message}`);
      console.error(`[MIGRATE] todos 배치 실패:`, e);
    }
  }

  // 4. templates 개별 문서 생성
  const templates = Array.isArray(data.templates) ? data.templates : [];
  for (let i = 0; i < templates.length; i += BATCH) {
    const chunk = templates.slice(i, i + BATCH);
    const batch = writeBatch(db);
    chunk.forEach((tpl: any) => {
      if (!tpl?.id) {
        errors.push(`template ID 없음, 건너뜀: ${JSON.stringify(tpl).slice(0, 100)}`);
        return;
      }
      const ref = doc(db, "todos_db", "team", "templates", String(tpl.id));
      batch.set(ref, tpl);
    });
    try {
      await batch.commit();
      templatesMigrated += chunk.length;
      console.log(`[MIGRATE] templates 진행: ${templatesMigrated}/${templates.length}`);
    } catch (e: any) {
      errors.push(`templates 배치 실패 (${i}~${i + chunk.length}): ${e.message}`);
      console.error(`[MIGRATE] templates 배치 실패:`, e);
    }
  }

  // 5. 검증 — 서브컬렉션의 문서 수가 원본과 일치하는지 확인
  try {
    const itemsSnap = await getDocs(collection(db, "todos_db", "team", "items"));
    const tplSnap = await getDocs(collection(db, "todos_db", "team", "templates"));
    console.log(`[MIGRATE] 검증 결과 — items: ${itemsSnap.size}/${todos.length}, templates: ${tplSnap.size}/${templates.length}`);
    if (itemsSnap.size < todos.length) {
      errors.push(`items 누락: 원본 ${todos.length}건, 마이그레이션 후 ${itemsSnap.size}건`);
    }
    if (tplSnap.size < templates.length) {
      errors.push(`templates 누락: 원본 ${templates.length}건, 마이그레이션 후 ${tplSnap.size}건`);
    }
  } catch (e: any) {
    errors.push(`검증 실패: ${e.message}`);
  }

  const ok = errors.length === 0 && metaWritten && todosMigrated === todos.length && templatesMigrated === templates.length;
  const result: MigrationResult = { ok, todosMigrated, templatesMigrated, metaWritten, backupPath, errors };
  console.log(ok ? "[MIGRATE] ✅ 성공" : "[MIGRATE] ⚠️ 일부 오류 있음", result);
  return result;
}

// window 노출 — 개발자 콘솔에서 직접 실행 가능
if (typeof window !== "undefined") {
  (window as any).migrateFirestoreSubcollections = migrateFirestoreSubcollections;
}
