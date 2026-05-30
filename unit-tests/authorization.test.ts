import { describe, it, expect } from "vitest";
import {
  canCreateTask,
  canUpdateTask,
  canUpdateTaskPriority,
  canDeleteTask,
  canCreateComment,
  canUpdateTaskStatus,
} from "@/lib/constants";

describe("Authorization Functions (lib/constants)", () => {
  const actor = "actor-123";
  const creator = "creator-123";
  const assignee = "assignee-123";

  describe("OWNER", () => {
    it("can create tasks", () => expect(canCreateTask("OWNER")).toBe(true));
    it("can update tasks", () => expect(canUpdateTask("OWNER")).toBe(true));
    it("can update task priority", () => expect(canUpdateTaskPriority("OWNER")).toBe(true));
    it("can create comments", () => expect(canCreateComment("OWNER")).toBe(true));

    it("can delete any task", () => {
      expect(canDeleteTask("OWNER", creator, actor)).toBe(true);
      expect(canDeleteTask("OWNER", actor, actor)).toBe(true);
    });

    it("can update any task status", () => {
      expect(canUpdateTaskStatus("OWNER", assignee, actor)).toBe(true);
      expect(canUpdateTaskStatus("OWNER", actor, actor)).toBe(true);
      expect(canUpdateTaskStatus("OWNER", null, actor)).toBe(true);
    });
  });

  describe("MEMBER", () => {
    it("can create tasks", () => expect(canCreateTask("MEMBER")).toBe(true));
    it("can update tasks", () => expect(canUpdateTask("MEMBER")).toBe(true));
    it("cannot update task priority", () => expect(canUpdateTaskPriority("MEMBER")).toBe(false));
    it("can create comments", () => expect(canCreateComment("MEMBER")).toBe(true));

    it("can delete own tasks", () => {
      expect(canDeleteTask("MEMBER", actor, actor)).toBe(true);
    });

    it("cannot delete others' tasks", () => {
      expect(canDeleteTask("MEMBER", creator, actor)).toBe(false);
    });

    it("can update status if assigned", () => {
      expect(canUpdateTaskStatus("MEMBER", actor, actor)).toBe(true);
    });

    it("cannot update status if not assigned", () => {
      expect(canUpdateTaskStatus("MEMBER", assignee, actor)).toBe(false);
      expect(canUpdateTaskStatus("MEMBER", null, actor)).toBe(false);
    });
  });

  describe("VIEWER", () => {
    it("cannot create tasks", () => expect(canCreateTask("VIEWER")).toBe(false));
    it("cannot update tasks", () => expect(canUpdateTask("VIEWER")).toBe(false));
    it("cannot update task priority", () => expect(canUpdateTaskPriority("VIEWER")).toBe(false));
    it("cannot create comments", () => expect(canCreateComment("VIEWER")).toBe(false));

    it("cannot delete tasks", () => {
      expect(canDeleteTask("VIEWER", actor, actor)).toBe(false);
      expect(canDeleteTask("VIEWER", creator, actor)).toBe(false);
    });

    it("cannot update task status", () => {
      expect(canUpdateTaskStatus("VIEWER", actor, actor)).toBe(false);
      expect(canUpdateTaskStatus("VIEWER", assignee, actor)).toBe(false);
      expect(canUpdateTaskStatus("VIEWER", null, actor)).toBe(false);
    });
  });
});
