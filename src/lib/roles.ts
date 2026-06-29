export const ROLES = {
  "S-T": { name: "Support Test", level: 1 },
  "S": { name: "Support", level: 2 },
  "M-T": { name: "Modérateur Test", level: 3 },
  "M": { name: "Modérateur", level: 4 },
  "A-T": { name: "Administrateur Test", level: 5 },
  "A": { name: "Administrateur", level: 6 },
  "R-S": { name: "Responsable Staff", level: 7 },
  "D": { name: "Pôle Développement", level: 8 },
  "C-F": { name: "Co-Fondateur", level: 9 },
  "F": { name: "Fondateur", level: 10 },
} as const;

export type RoleKey = keyof typeof ROLES;

export const PERMISSIONS: Record<string, string[]> = {
  "S-T": ["planning:read", "organigramme:read", "sanctions:read"],
  "S": ["planning:read", "organigramme:read", "sanctions:read", "reports:create"],
  "M-T": ["planning:read", "organigramme:read", "sanctions:read", "reports:create", "sanctions:manage-light"],
  "M": ["planning:read", "organigramme:read", "sanctions:read", "reports:create", "sanctions:manage"],
  "A-T": ["planning:read", "organigramme:read", "sanctions:read", "reports:create", "sanctions:manage", "users:create", "users:delete"],
  "A": ["planning:read", "organigramme:read", "sanctions:read", "reports:manage", "sanctions:manage", "users:create", "users:delete", "reports:read-all"],
  "R-S": ["planning:read", "organigramme:read", "sanctions:read", "reports:manage", "sanctions:manage", "users:create", "staff:manage"],
  "D": ["planning:read", "organigramme:read", "sanctions:read", "reports:manage", "sanctions:manage", "users:create", "staff:manage", "technical:access"],
  "C-F": ["*"],
  "F": ["*"],
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function hasMinRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLES[userRole as RoleKey]?.level ?? 0;
  const requiredLevel = ROLES[requiredRole as RoleKey]?.level ?? 0;
  return userLevel >= requiredLevel;
}

export function getRoleName(role: string): string {
  return ROLES[role as RoleKey]?.name ?? role;
}
