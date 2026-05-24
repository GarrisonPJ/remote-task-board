import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createProjectSchema } from "@/schemas/project.schema";
import { createProject, listProjects } from "@/services/project.service";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) return ok([]);
    const projects = await listProjects(workspaceId, user.id);
    return ok(projects);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = createProjectSchema.parse(body);
    const project = await createProject(input, user.id);
    return ok(project, 201);
  } catch (error) {
    return fail(error);
  }
}
