import { describe, expect, it } from "vitest";
import { createTaskSchema, updateTaskSchema } from "@/schemas/task.schema";

describe("task dueDate schema", () => {
  it("accepts date-only values from date inputs", () => {
    const result = createTaskSchema.parse({
      projectId: "project-1",
      title: "Ship date-only task",
      dueDate: "2026-05-18",
    });

    expect(result.dueDate).toBe("2026-05-18");
  });

  it("accepts ISO datetime values from API clients", () => {
    const result = updateTaskSchema.parse({
      dueDate: "2026-05-18T00:00:00.000Z",
    });

    expect(result.dueDate).toBe("2026-05-18T00:00:00.000Z");
  });

  it("rejects invalid dueDate values", () => {
    expect(() =>
      createTaskSchema.parse({
        projectId: "project-1",
        title: "Bad date",
        dueDate: "not-a-date",
      })
    ).toThrow();

    expect(() =>
      createTaskSchema.parse({
        projectId: "project-1",
        title: "Impossible date",
        dueDate: "2026-02-31",
      })
    ).toThrow();
  });
});
