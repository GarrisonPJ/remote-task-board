import OpenAI from "openai";
import { env } from "./env";
import { AppError } from "./errors";

const SYSTEM_PROMPT = `You are a task parser. Extract structured task fields from natural language descriptions.
Return ONLY valid JSON, no other text.

{
  "title": "concise task title (required, max 200 chars)",
  "description": "longer description if the user provided details (nullable)",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "dueDate": "ISO date string (YYYY-MM-DD) if a date or deadline is mentioned (nullable)"
}

Rules:
- title is required
- Infer priority from urgency words: "urgent"/"ASAP" → URGENT, "high priority" → HIGH, "low priority" → LOW
- If no priority mentioned, default to MEDIUM
- "next Friday" → compute the actual upcoming Friday's date
- "tomorrow" → tomorrow's date
- "next week" → date 7 days from today
- "by <date>" → parse that date
- If no date mentioned, dueDate is null
- Only output the JSON object, nothing else.`;

export interface ParseTaskResult {
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: string | null;
}

export async function parseTask(text: string): Promise<ParseTaskResult> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new AppError(
      "AI_NOT_CONFIGURED",
      "AI task creation is not configured.",
      503
    );
  }

  const client = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: env.DEEPSEEK_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new AppError("AI_PARSE_FAILED", "AI returned an empty response.", 502);
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new AppError("AI_PARSE_FAILED", "AI returned invalid JSON.", 502);
  }
}
