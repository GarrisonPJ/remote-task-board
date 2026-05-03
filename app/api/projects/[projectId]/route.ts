/**
 * /api/projects/[projectId] — 单个项目操作
 *
 * GET    /api/projects/:id — 获取详情
 * PATCH  /api/projects/:id — 更新项目（OWNER 或 MEMBER）
 * DELETE /api/projects/:id — 删除项目（仅 OWNER）
 *
 * TODO: 等你实现 project.service.ts 的 getProjectById/updateProject/deleteProject 后即可工作。
 *
 * 设计文档参考：Section 14.3
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
    const user = await requireUser();
    const { projectId } = await params;
    const project = await getProjectById(projectId, user.id);
    return ok(project);
  } catch (error) {
    return fail(error as Error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireUser();
    const { projectId } = await params;
    const body = await req.json();
    const input = updateProjectSchema.parse(body);
    const project = await updateProject(projectId, input, user.id);
    return ok(project);
  } catch (error) {
    return fail(error as Error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireUser();
    const { projectId } = await params;
    await deleteProject(projectId, user.id);
    return ok(null);
  } catch (error) {
    return fail(error as Error);
  }
}
