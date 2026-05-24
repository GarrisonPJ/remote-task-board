import { z } from "zod";

const isoDateTimeSchema = z.string().datetime();
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string) {
  if (!dateOnlyPattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

const aiDueDateSchema = z
  .string()
  .refine(
    (value) =>
      isValidDateOnly(value) || isoDateTimeSchema.safeParse(value).success,
    "Expected YYYY-MM-DD or ISO datetime."
  );

export const parseTaskSchema = z.object({
  text: z.string().min(1).max(500),
  projectId: z.string().min(1),
});

export type ParseTaskInput = z.infer<typeof parseTaskSchema>;

export const taskParseResultSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: aiDueDateSchema.optional().nullable(),
});
