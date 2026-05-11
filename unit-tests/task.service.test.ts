import { describe, it, expect } from "vitest";
import {
  VALID_TRANSITIONS,
  canCreateTask,
  canDeleteTask,
  canUpdateTaskStatus,
} from "@/services/task.service";

describe("VALID_TRANSITIONS", () => {
  it("allows TODO → IN_PROGRESS", () => {
    expect(VALID_TRANSITIONS.TODO).toContain("IN_PROGRESS");
  });

  it("allows TODO → CANCELED", () => {
    expect(VALID_TRANSITIONS.TODO).toContain("CANCELED");
  });

  it("prevents TODO → DONE", () => {
    expect(VALID_TRANSITIONS.TODO).not.toContain("DONE");
  });

  it("prevents DONE → TODO", () => {
    expect(VALID_TRANSITIONS.DONE).not.toContain("TODO");
  });

  it("allows CANCELED → TODO (reopen)", () => {
    expect(VALID_TRANSITIONS.CANCELED).toContain("TODO");
  });

  it("DONE is a terminal state (only IN_REVIEW)", () => {
    expect(VALID_TRANSITIONS.DONE).toEqual(["IN_REVIEW"]);
  });
});

describe("canDeleteTask", () => {
  it("OWNER can delete any task", () => {
    expect(canDeleteTask("OWNER", "other-user-id", "actor-id")).toBe(true);
  });

  it("MEMBER can delete their own task", () => {
    expect(canDeleteTask("MEMBER", "actor-id", "actor-id")).toBe(true);
  });

  it("MEMBER cannot delete another user's task", () => {
    expect(canDeleteTask("MEMBER", "other-user-id", "actor-id")).toBe(false);
  });

  it("VIEWER cannot delete any task", () => {
    expect(canDeleteTask("VIEWER", "actor-id", "actor-id")).toBe(false);
  });
});

describe("canCreateTask", () => {
  it("OWNER can create", () => expect(canCreateTask("OWNER")).toBe(true));
  it("MEMBER can create", () => expect(canCreateTask("MEMBER")).toBe(true));
  it("VIEWER cannot create", () => expect(canCreateTask("VIEWER")).toBe(false));
});

describe("canUpdateTaskStatus", () => {
  it("OWNER can change status regardless of assignment", () => {
    expect(canUpdateTaskStatus("OWNER", null, "actor-id")).toBe(true);
    expect(canUpdateTaskStatus("OWNER", "other-id", "actor-id")).toBe(true);
  });

  it("MEMBER can change status when they are the assignee", () => {
    expect(canUpdateTaskStatus("MEMBER", "actor-id", "actor-id")).toBe(true);
  });

  it("MEMBER cannot change status when they are NOT the assignee", () => {
    expect(canUpdateTaskStatus("MEMBER", "other-id", "actor-id")).toBe(false);
  });

  it("MEMBER cannot change status when task is unassigned", () => {
    expect(canUpdateTaskStatus("MEMBER", null, "actor-id")).toBe(false);
  });

  it("VIEWER cannot change status", () => {
    expect(canUpdateTaskStatus("VIEWER", "actor-id", "actor-id")).toBe(false);
  });
});
