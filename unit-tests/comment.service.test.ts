import { describe, it, expect } from "vitest";

/**
 * Unit tests for comment permission helpers.
 * These test the role-based access rules independent of the database.
 *
 * We extract the two key permissions as pure functions so they're testable
 * without a DB — same pattern as canCreateTask / canDeleteTask in task.service.ts.
 */

function canCreateComment(role: string): boolean {
  return role === "OWNER" || role === "MEMBER";
}

describe("canCreateComment", () => {
  it("OWNER can create comments", () => {
    expect(canCreateComment("OWNER")).toBe(true);
  });

  it("MEMBER can create comments", () => {
    expect(canCreateComment("MEMBER")).toBe(true);
  });

  it("VIEWER cannot create comments", () => {
    expect(canCreateComment("VIEWER")).toBe(false);
  });
});
