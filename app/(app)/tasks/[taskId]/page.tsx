import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTaskById } from "@/services/task.service";
import { getProjectById } from "@/services/project.service";
import { TaskStatusBadge } from "@/components/task/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/task/TaskPriorityBadge";
import { TaskEditDialog } from "@/components/task/TaskEditDialog";
import { TaskDeleteButton } from "@/components/task/TaskDeleteButton";
import { TaskStatusControl } from "@/components/task/TaskStatusControl";
import { TaskActivityTimeline } from "@/components/task/TaskActivityTimeline";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import Link from "next/link";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { taskId } = await params;
  const { task, userRole } = await getTaskById(taskId, user.id);
  const { project } = await getProjectById(task.projectId, user.id);
  const workspaceId = project.workspaceId;

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up stagger-1">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/projects/${task.projectId}`} className="hover:text-foreground transition-colors">
          Project
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{task.title}</span>
      </nav>

      {/* Title + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          <div className="flex gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {(userRole === "OWNER" || (userRole === "MEMBER" && user.id === task.creatorId)) && (
            <TaskDeleteButton taskId={task.id} />
          )}
          {userRole !== "VIEWER" && <TaskEditDialog task={task} workspaceId={workspaceId} />}
        </div>
      </div>

      {/* Status control */}
      <section className="rounded-xl border bg-card p-5 space-y-3 animate-slide-up stagger-2 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status</h2>
        <TaskStatusControl
          taskId={task.id}
          currentStatus={task.status}
          userId={user.id}
          assigneeId={task.assignee?.id ?? null}
          userRole={userRole}
        />
      </section>

      {/* Description */}
      {task.description && (
        <section className="rounded-xl border bg-card p-5 space-y-3 animate-slide-up stagger-2 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</h2>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {task.description}
          </p>
        </section>
      )}

      {/* Metadata grid */}
      <section className="rounded-xl border bg-card p-5 space-y-3 animate-slide-up stagger-3 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {task.assignee && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Assignee</span>
              <p className="font-medium">{task.assignee.name}</p>
            </div>
          )}
          {task.dueDate && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Due Date</span>
              <p className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
          )}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Created</span>
            <p className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Updated</span>
            <p className="font-medium">{new Date(task.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      {/* Activity timeline */}
      {task.activityLogs && (
        <section className="rounded-xl border bg-card p-5 space-y-3 animate-slide-up stagger-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Activity</h2>
          <TaskActivityTimeline logs={task.activityLogs} />
        </section>
      )}

      {/* Comments */}
      <section className="rounded-xl border bg-card p-5 space-y-3 animate-slide-up stagger-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Comments</h2>
        <div className="space-y-4">
          {userRole !== "VIEWER" && <CommentForm taskId={task.id} />}
          <CommentList taskId={task.id} />
        </div>
      </section>
    </div>
  );
}
