// Role-based access. Keep in sync with prisma Role enum.
// ADMIN > LAWYER > PARALEGAL > CLIENT in privilege order.
export type AppRole = "ADMIN" | "LAWYER" | "PARALEGAL" | "CLIENT";

const ALL_INTERNAL: AppRole[] = ["ADMIN", "LAWYER", "PARALEGAL"];
const ALL_ROLES: AppRole[] = ["ADMIN", "LAWYER", "PARALEGAL", "CLIENT"];

// nav href -> allowed roles. No entry = open to any authenticated user.
export const NAV_ROLES: Record<string, AppRole[]> = {
  "/": ALL_ROLES, // dashboard varies by role but visible to all
  "/cases": ALL_INTERNAL,
  "/clients": ALL_INTERNAL,
  "/onboarding": ALL_INTERNAL,
  "/calendar": ALL_INTERNAL,
  "/court-sync": ALL_INTERNAL,
  "/voice-intake": ALL_INTERNAL,
  "/research": ALL_INTERNAL,
  "/billing": ALL_INTERNAL, // billing & time tracking
  "/assistant": ALL_INTERNAL,
  "/portal": ALL_ROLES, // client portal visible to all (CLIENT primary)
  "/activity": ["ADMIN"], // audit logs — ADMIN only for compliance
  "/settings": ALL_INTERNAL, // settings page itself is shared; subsections gated inside
  "/settings/users": ["ADMIN"],
  "/documents": ALL_INTERNAL,
  "/templates": ALL_INTERNAL,
  "/trust": ["ADMIN", "LAWYER"],
  "/messages": ALL_INTERNAL,
  "/reports": ALL_INTERNAL,
};

export function can(role: AppRole | string | undefined, action: string): boolean {
  if (!role) return false;
  const r = role as AppRole;
  switch (action) {
    case "user:manage": return r === "ADMIN";
    case "settings:ai": return r === "ADMIN";
    case "settings:users": return r === "ADMIN";
    case "audit:view": return r === "ADMIN";
    case "audit:export": return r === "ADMIN";
    case "billing:view": return ALL_INTERNAL.includes(r);
    case "billing:invoice": return r === "ADMIN" || r === "LAWYER";
    case "trust:view": return r === "ADMIN" || r === "LAWYER";
    case "trust:manage": return r === "ADMIN";
    case "case:write": return ALL_INTERNAL.includes(r);
    case "client:write": return ALL_INTERNAL.includes(r);
    default: return ALL_INTERNAL.includes(r);
  }
}

export function allowedNav(role: AppRole | string | undefined, href: string): boolean {
  const allowed = NAV_ROLES[href];
  if (!allowed) return true;
  if (!role) return false;
  return (allowed as string[]).includes(role);
}
