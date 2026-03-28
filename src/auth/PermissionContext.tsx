import { createContext, useContext, ReactNode } from "react";
import { Role, Permission, ROLE_PERMISSIONS, UserRole } from "../types";

// ─── 컨텍스트 타입 ────────────────────────────────────────────────────────────

interface PermissionContextValue {
  /** 현재 사용자의 역할 */
  role: Role;
  /** 특정 권한 보유 여부 확인 */
  can: (permission: Permission) => boolean;
  /** 현재 사용자가 특정 할일의 소유자인지 확인 */
  isOwner: (todoWho: string) => boolean;
  /** 전체 사용자 역할 목록 (설정 화면에서 관리용) */
  userRoles: UserRole[];
}

// ─── 기본값: 지금은 모든 권한 허용 (Phase 1 - 뼈대만) ─────────────────────

const defaultValue: PermissionContextValue = {
  role: "admin",
  can: () => true,
  isOwner: () => true,
  userRoles: [],
};

const PermissionContext = createContext<PermissionContextValue>(defaultValue);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface PermissionProviderProps {
  children: ReactNode;
  currentUser: string | null;
  /** 나중에 Firestore에서 불러온 사용자별 역할 목록을 주입 */
  userRoles?: UserRole[];
}

export function PermissionProvider({
  children,
  currentUser,
  userRoles = [],
}: PermissionProviderProps) {
  // 현재 사용자의 역할 결정
  // TODO: Phase 4 이후 Firestore의 userRoles에서 실제 역할을 읽어옴
  // 지금은 모든 사용자를 admin으로 처리 (기존 동작 유지)
  const role: Role = (() => {
    if (!currentUser) return "viewer";
    const found = userRoles.find(u => u.name === currentUser);
    return found?.role ?? "admin"; // 역할 미지정 시 admin (기존 동작 유지)
  })();

  const can = (permission: Permission): boolean => {
    return ROLE_PERMISSIONS[role].includes(permission);
  };

  const isOwner = (todoWho: string): boolean => {
    return todoWho === currentUser;
  };

  return (
    <PermissionContext.Provider value={{ role, can, isOwner, userRoles }}>
      {children}
    </PermissionContext.Provider>
  );
}

// ─── 훅 ──────────────────────────────────────────────────────────────────────

export function usePermission() {
  return useContext(PermissionContext);
}
