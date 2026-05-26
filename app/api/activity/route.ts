/**
 * GET /api/activity
 *
 * Returns recent activity logs across all workspaces the caller belongs to.
 * Each entry includes the actor, action type, and task title for rendering
 * an admin-visible activity feed.
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();

    const logs = await prisma.activityLog.findMany({
      where: {
        task: {
          project: {
            workspace: {
              members: {
                some: { userId: user.id, role: "OWNER" },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
      },
    });

    const items = logs.map((log: typeof logs[number]) => ({
      id: log.id,
      taskId: log.taskId,
      taskTitle: log.task?.title ?? "Unknown task",
      actor: log.actor,
      action: log.action,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
    }));

    return ok(items);
  } catch (error) {
    return fail(error);
  }
}
