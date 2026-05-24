import { describe, it, expect } from "vitest";
import { canCreateComment } from "@/lib/constants";

/**
 * Unit tests for comment permission helpers.
 * These test the role-based access rules independent of the database.
 */

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
