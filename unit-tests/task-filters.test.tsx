import { describe, it, expect } from "vitest";
import { TaskFilters } from "@/components/task/TaskFilters";

describe("TaskFilters", () => {
  it("exports a valid React component", () => {
    expect(TaskFilters).toBeDefined();
    expect(typeof TaskFilters).toBe("function");
  });
});
