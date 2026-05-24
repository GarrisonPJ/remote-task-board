/**
 * Workspace API routes
 *
 * GET  /api/workspaces — lists workspaces for the current user
 * POST /api/workspaces — creates a new workspace
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createWorkspaceSchema } from "@/schemas/workspace.schema";
import {
  listMyWorkspaces,
  createWorkspace,
} from "@/services/workspace.service";

export async function GET() {
  try {
    const user = await requireUser();
    const workspaces = await listMyWorkspaces(user.id);
    return ok(workspaces);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = createWorkspaceSchema.parse(body);
    const workspace = await createWorkspace(input, user.id);
    return ok(workspace, 201);
  } catch (error) {
    return fail(error);
  }
}
