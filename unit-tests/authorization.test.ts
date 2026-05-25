import { describe, it, expect } from "vitest";
import { can, authorize, type AuthAction } from "@/lib/authorization";
import { ForbiddenError } from "@/lib/errors";
import type { WorkspaceRole } from "@/types/domain";

const ALL_MUTATION_ACTIONS: AuthAction[] = [
  "task:create",
  "task:update",
  "task:delete",
  "task:status",
  "comment:create",
  "workspace:manage",
  "member:invite",
  "member:remove",
  "activity:view",
];

const ALL_ACTIONS: AuthAction[] = [
  ...ALL_MUTATION_ACTIONS,
];

describe("can", () => {
  describe("OWNER", () => {
    it("can perform all actions", () => {
      for (const action of ALL_ACTIONS) {
        expect(can(action, { role: "OWNER" })).toBe(true);
      }
    });
  });

  describe("MEMBER", () => {
    it("can create tasks", () => {
      expect(can("task:create", { role: "MEMBER" })).toBe(true);
    });

    it("can update tasks", () => {
      expect(can("task:update", { role: "MEMBER" })).toBe(true);
    });

    it("can create comments", () => {
      expect(can("comment:create", { role: "MEMBER" })).toBe(true);
    });

    it("can delete own tasks", () => {
      expect(can("task:delete", { role: "MEMBER", isCreator: true })).toBe(true);
    });

    it("cannot delete others' tasks", () => {
      expect(can("task:delete", { role: "MEMBER", isCreator: false })).toBe(false);
    });

    it("can change status on own assigned tasks", () => {
      expect(can("task:status", { role: "MEMBER", isAssignee: true })).toBe(true);
    });

    it("cannot change status on unassigned tasks", () => {
      expect(can("task:status", { role: "MEMBER", isAssignee: false })).toBe(false);
    });

    it("cannot change status when isAssignee is undefined", () => {
      expect(can("task:status", { role: "MEMBER" })).toBe(false);
    });

    it("cannot manage workspace", () => {
      expect(can("workspace:manage", { role: "MEMBER" })).toBe(false);
    });

    it("cannot invite members", () => {
      expect(can("member:invite", { role: "MEMBER" })).toBe(false);
    });

    it("cannot remove members", () => {
      expect(can("member:remove", { role: "MEMBER" })).toBe(false);
    });

    it("cannot view activity log", () => {
      expect(can("activity:view", { role: "MEMBER" })).toBe(false);
    });
  });

  describe("VIEWER", () => {
    it("cannot perform any mutation action", () => {
      for (const action of ALL_MUTATION_ACTIONS) {
        expect(can(action, { role: "VIEWER" })).toBe(false);
      }
    });

    it("cannot perform any action even with isCreator flag", () => {
      for (const action of ALL_MUTATION_ACTIONS) {
        expect(can(action, { role: "VIEWER", isCreator: true })).toBe(false);
      }
    });

    it("cannot perform any action even with isAssignee flag", () => {
      for (const action of ALL_MUTATION_ACTIONS) {
        expect(can(action, { role: "VIEWER", isAssignee: true })).toBe(false);
      }
    });
  });

  describe("OWNER override edge cases", () => {
    it("can delete tasks even when not the creator", () => {
      expect(can("task:delete", { role: "OWNER", isCreator: false })).toBe(true);
    });

    it("can change status even when not the assignee", () => {
      expect(can("task:status", { role: "OWNER", isAssignee: false })).toBe(true);
    });

    it("can delete tasks when isCreator is undefined", () => {
      expect(can("task:delete", { role: "OWNER" })).toBe(true);
    });

    it("can change status when isAssignee is undefined", () => {
      expect(can("task:status", { role: "OWNER" })).toBe(true);
    });
  });
});

describe("authorize", () => {
  it("throws ForbiddenError when can() returns false", () => {
    expect(() => authorize("task:create", { role: "VIEWER" })).toThrow(ForbiddenError);
  });

  it("does nothing when can() returns true", () => {
    expect(() => authorize("task:create", { role: "OWNER" })).not.toThrow();
  });

  it("throws ForbiddenError for MEMBER deleting others' tasks", () => {
    expect(() =>
      authorize("task:delete", { role: "MEMBER", isCreator: false })
    ).toThrow(ForbiddenError);
  });

  it("does not throw for MEMBER deleting own tasks", () => {
    expect(() =>
      authorize("task:delete", { role: "MEMBER", isCreator: true })
    ).not.toThrow();
  });
});
