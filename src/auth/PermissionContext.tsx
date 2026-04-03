import { createContext, useContext, ReactNode } from "react";
import { TeamRole, Team, TEAM_ROLE_PERMISSIONS } from "../types";

// ─── 컨텍스트 타입 ────────────────────────────────────────────────────────────

interface PermissionContextValue {
  /** 현재 사용자의 팀 내 역할 (팀 미소속 시 admin 기본값) */
  role: TeamRole;
  /** 특정 권한 보유 여부 확인 */
  can: (permission: string) => boolean;
  /** 현재 사용자가 특정 할일의 소유자인지 확인 */
  isOwner: (todoWho: string) => boolean;
  /** 현재 사용자의 소속 팀 (없으면 null) */
  myTeam: Team | null;
}

// ─── 기본값: 지금은 모든 권한 허용 (Phase 1 - 뼈대만) ─────────────────────

const defaultValue: PermissionContextValue = {
  role: "admin",
  can: () => true,
  isOwner: () => true,
  myTeam: null,
};

const PermissionContext = createContext<PermissionContextValue>(defaultValue);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface PermissionProviderProps {
  children: ReactNode;
  currentUser: string | null;
  teams?: Team[];
}

export function PermissionProvider({
  children,
  currentUser,
  teams = [],
}: PermissionProviderProps) {
  // 현재 사용자의 소속 팀 + 역할 결정
  const myTeam = teams.find(t => t.members.some(m => m.name === currentUser)) || null;
  const role: TeamRole = (() => {
    if (!currentUser) return "viewer";
    if (!myTeam) return "admin"; // 팀 미소속 시 admin (기존 동작 유지, Phase 2에서 변경 예정)
    const member = myTeam.members.find(m => m.name === currentUser);
    return member?.role ?? "editor";
  })();

  const can = (permission: string): boolean => {
    return TEAM_ROLE_PERMISSIONS[role].includes(permission);
  };

  const isOwner = (todoWho: string): boolean => {
    return todoWho === currentUser;
  };

  return (
    <PermissionContext.Provider value={{ role, can, isOwner, myTeam }}>
      {children}
    </PermissionContext.Provider>
  );
}

// ─── 훅 ──────────────────────────────────────────────────────────────────────

export function usePermission() {
  return useContext(PermissionContext);
}
