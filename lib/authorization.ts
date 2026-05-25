import { ForbiddenError } from "@/lib/errors";
import type { WorkspaceRole } from "@/types/domain";

export type AuthAction =
  | "task:create"
  | "task:update"
  | "task:delete"
  | "task:status"
  | "comment:create"
  | "workspace:manage"
  | "member:invite"
  | "member:remove"
  | "activity:view";

export type AuthContext = {
  role: WorkspaceRole;
  isCreator?: boolean;
  isAssignee?: boolean;
};

const POLICY: Record<AuthAction, (ctx: AuthContext) => boolean> = {
  "task:create": (ctx) => ctx.role === "OWNER" || ctx.role === "MEMBER",
  "task:update": (ctx) => ctx.role === "OWNER" || ctx.role === "MEMBER",
  "task:delete": (ctx) =>
    ctx.role === "OWNER" || (ctx.role === "MEMBER" && ctx.isCreator === true),
  "task:status": (ctx) =>
    ctx.role === "OWNER" || (ctx.role === "MEMBER" && ctx.isAssignee === true),
  "comment:create": (ctx) => ctx.role === "OWNER" || ctx.role === "MEMBER",
  "workspace:manage": (ctx) => ctx.role === "OWNER",
  "member:invite": (ctx) => ctx.role === "OWNER",
  "member:remove": (ctx) => ctx.role === "OWNER",
  "activity:view": (ctx) => ctx.role === "OWNER",
};

/**
 * Returns whether the given action is permitted in the given auth context.
 * Does not throw.
 */
export function can(action: AuthAction, context: AuthContext): boolean {
  return POLICY[action](context);
}

/**
 * Throws ForbiddenError if the given action is not permitted in the given auth context.
 */
export function authorize(action: AuthAction, context: AuthContext): void {
  if (!can(action, context)) {
    throw new ForbiddenError();
  }
}
