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
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {" / "}
          <Link href={`/projects/${task.projectId}`} className="hover:underline">
            Project
          </Link>
          {" / "}
          <span>{task.title}</span>
        </p>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <div className="flex gap-2">
            {(userRole === "OWNER" || (userRole === "MEMBER" && user.id === task.creatorId)) && (
              <TaskDeleteButton taskId={task.id} />
            )}
            {userRole !== "VIEWER" && <TaskEditDialog task={task} workspaceId={workspaceId} />}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <TaskStatusBadge status={task.status} />
        <TaskPriorityBadge priority={task.priority} />
      </div>

      <TaskStatusControl
        taskId={task.id}
        currentStatus={task.status}
        userId={user.id}
        assigneeId={task.assignee?.id ?? null}
        userRole={userRole}
      />

      {task.description && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {task.description}
          </p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-4 text-sm">
        {task.assignee && (
          <div>
            <span className="text-muted-foreground">Assignee</span>
            <p className="font-medium">{task.assignee.name}</p>
          </div>
        )}
        {task.dueDate && (
          <div>
            <span className="text-muted-foreground">Due Date</span>
            <p className="font-medium">
              {new Date(task.dueDate).toLocaleDateString()}
            </p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Created</span>
          <p className="font-medium">
            {new Date(task.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Updated</span>
          <p className="font-medium">
            {new Date(task.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </section>

      {task.activityLogs && <TaskActivityTimeline logs={task.activityLogs} />}
    </div>
  );
}
