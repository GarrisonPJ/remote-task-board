import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectById } from "@/services/project.service";
import { listTasks } from "@/services/task.service";
import { TaskList } from "@/components/task/TaskList";
import { CreateTaskDialog } from "@/components/task/CreateTaskDialog";
import { AiTaskDialog } from "@/components/task/AiTaskDialog";
import Link from "next/link";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { projectId } = await params;
  const { project, userRole } = await getProjectById(projectId, user.id);
  const tasks = await listTasks(
    { projectId, page: 1, pageSize: 50 },
    user.id
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {" / "}
          <Link href={`/workspaces/${project.workspaceId}`} className="hover:underline">
            Workspace
          </Link>
          {" / "}
          <span>{project.name}</span>
        </p>
        <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-1">{project.description}</p>
        )}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tasks</h2>
          {userRole !== "VIEWER" && (
            <div className="flex gap-2">
              <CreateTaskDialog projectId={projectId} workspaceId={project.workspaceId} />
              <AiTaskDialog projectId={projectId} />
            </div>
          )}
        </div>
        <TaskList tasks={tasks.items} />
      </section>
    </div>
  );
}
