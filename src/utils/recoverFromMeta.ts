// meta/main 서브문서에서 설정류를 읽어서 단일 문서 todos_db/team에 복원
// — Phase 2-3 마이그레이션으로 meta에 복사된 members/teams/memberRoles/memberPins 등이
//   legacy 모드 전환 후 단일 문서에서 손실된 경우 복원용.
// 실행: F12 콘솔 → await window.recoverFromMeta()

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function recoverFromMeta(): Promise<{ ok: boolean; message: string }> {
  try {
    console.log("[RECOVER] meta/main 읽기");
    const metaSnap = await getDoc(doc(db, "todos_db", "team", "meta", "main"));
    if (!metaSnap.exists()) {
      return { ok: false, message: "meta/main 문서 없음 — 복구 불가" };
    }
    const meta = metaSnap.data();
    console.log("[RECOVER] meta 내용:", {
      members: (meta.members || []).length,
      teams: (meta.teams || []).length,
      projects: (meta.projects || []).length,
      memberPins: Object.keys(meta.memberPins || {}).length,
    });

    console.log("[RECOVER] todos_db/team 읽기");
    const singleSnap = await getDoc(doc(db, "todos_db", "team"));
    const single = singleSnap.exists() ? singleSnap.data() : {};
    console.log("[RECOVER] 현재 단일 문서 상태:", {
      todos: (single.todos || []).length,
      members: (single.members || []).length,
    });

    // 복원 — meta의 설정류 + 단일 문서의 todos (둘 중 최신 것 유지)
    // meta에도 _migratedAt 시점의 members/teams가 있음. 그 뒤 legacy 모드로 추가/변경된 경우는
    // 단일 문서의 것이 더 최신일 수 있지만, 현 상황에선 단일 문서의 members가 비어 있어 meta 우선.
    const merged: any = {
      // 먼저 단일 문서의 모든 값 (todos 포함)
      ...single,
      // meta의 설정류 덮어쓰기 (members, teams 등 손실된 것 복원)
      members: meta.members || single.members || [],
      teams: meta.teams || single.teams || [],
      memberRoles: meta.memberRoles || single.memberRoles || {},
      memberPins: meta.memberPins || single.memberPins || {},
      memberColors: meta.memberColors || single.memberColors || {},
      projects: meta.projects || single.projects || [],
      pris: meta.pris || single.pris || [],
      stats: meta.stats || single.stats || [],
      priC: meta.priC || single.priC || {},
      priBg: meta.priBg || single.priBg || {},
      stC: meta.stC || single.stC || {},
      stBg: meta.stBg || single.stBg || {},
      globalPermissions: meta.globalPermissions || single.globalPermissions || null,
      teamNId: meta.teamNId || single.teamNId || 1,
      tplNId: meta.tplNId || single.tplNId || 1,
      pNId: meta.pNId || single.pNId || 5,
      nId: meta.nId || single.nId || 21,
      sharedApiKey: meta.sharedApiKey || single.sharedApiKey || "",
      _updatedAt: Date.now(),
      _recoveredAt: Date.now(),
    };

    console.log("[RECOVER] 복원 후 값:", {
      todos: (merged.todos || []).length,
      members: (merged.members || []).length,
      teams: (merged.teams || []).length,
      projects: (merged.projects || []).length,
      memberPins: Object.keys(merged.memberPins || {}).length,
    });

    await setDoc(doc(db, "todos_db", "team"), merged);
    console.log("[RECOVER] ✅ 복원 완료 — 페이지 새로고침 해주세요");
    return { ok: true, message: `members ${(merged.members || []).length}명, teams ${(merged.teams || []).length}개, todos ${(merged.todos || []).length}건 복원됨` };
  } catch (e: any) {
    console.error("[RECOVER] 실패:", e);
    return { ok: false, message: e.message };
  }
}

if (typeof window !== "undefined") {
  (window as any).recoverFromMeta = recoverFromMeta;
}
