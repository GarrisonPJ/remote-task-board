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
