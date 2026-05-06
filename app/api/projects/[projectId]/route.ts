/**
 * /api/projects/[projectId] — 单个项目操作
 *
 * service 层已完成（getProjectById / updateProject / deleteProject），
 * 你的任务是把它们连到 HTTP 层。
 *
 * 参考文件：app/api/workspaces/[workspaceId]/route.ts
 * 那个文件的 GET / PATCH / DELETE 跟你要写的结构完全一样，
 * 只是把 workspace 换成 project，schema 换成 updateProjectSchema。
 *
 * 三个 Route Handler 的共同模式：
 *   try { requireUser → 取 params → 调 service → ok(结果) } catch { fail }
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { updateProjectSchema } from "@/schemas/project.schema";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/services/project.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    throw new Error("Not implemented");
  } catch (error) {
    return fail(error as Error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    throw new Error("Not implemented");
  } catch (error) {
    return fail(error as Error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    throw new Error("Not implemented");
  } catch (error) {
    return fail(error as Error);
  }
}
