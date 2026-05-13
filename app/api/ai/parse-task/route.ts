import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { parseTaskSchema, taskParseResultSchema } from "@/schemas/ai.schema";
import { parseTask } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const input = parseTaskSchema.parse(body);
    const result = await parseTask(input.text);
    const validated = taskParseResultSchema.parse(result);
    return ok(validated);
  } catch (error) {
    return fail(error as Error);
  }
}
