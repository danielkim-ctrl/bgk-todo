import { createContext, useContext, ReactNode } from "react";
import { TeamRole, Team, TEAM_ROLE_PERMISSIONS } from "../types";

interface PermissionContextValue {
  role: TeamRole;
  can: (permission: string) => boolean;
  isOwner: (todoWho: string) => boolean;
  /** 수정 가능 여부 — 본인 업무이면 edit.own, 타인이면 edit.all 체크 */
  canEdit: (todoWho: string) => boolean;
  /** 삭제 가능 여부 — 본인 업무이면 delete.own, 타인이면 delete.all 체크 */
  canDelete: (todoWho: string) => boolean;
}

const defaultValue: PermissionContextValue = {
  role: "admin",
  can: () => true,
  isOwner: () => true,
  canEdit: () => true,
  canDelete: () => true,
};

const PermissionContext = createContext<PermissionContextValue>(defaultValue);

interface PermissionProviderProps {
  children: ReactNode;
  currentUser: string | null;
  teams?: Team[];
  memberRoles?: Record<string, TeamRole>;
  globalPermissions?: Record<TeamRole, string[]> | null;
}

export function PermissionProvider({
  children, currentUser, teams = [],
  memberRoles = {}, globalPermissions,
}: PermissionProviderProps) {
  // memberRoles 기반 역할 결정 (팀 소속 여부와 무관)
  const role: TeamRole = (currentUser && memberRoles[currentUser]) || "admin";
  const perms = globalPermissions?.[role] ?? TEAM_ROLE_PERMISSIONS[role];

  const can = (permission: string) => perms.includes(permission);
  const isOwner = (todoWho: string) => todoWho === currentUser;

  // 수정 권한: edit.all 있으면 전체, 아니면 본인 업무만 (edit.own)
  const canEdit = (todoWho: string) =>
    perms.includes("todo.edit.all") || (isOwner(todoWho) && perms.includes("todo.edit.own"));

  // 삭제 권한: delete.all 있으면 전체, 아니면 본인 업무만 (delete.own)
  const canDelete = (todoWho: string) =>
    perms.includes("todo.delete.all") || (isOwner(todoWho) && perms.includes("todo.delete.own"));

  return (
    <PermissionContext.Provider value={{ role, can, isOwner, canEdit, canDelete }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}
