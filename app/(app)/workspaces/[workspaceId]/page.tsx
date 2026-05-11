import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkspaceById } from "@/services/workspace.service";
import { listProjects } from "@/services/project.service";
import { listTasks } from "@/services/task.service";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CreateProjectDialog } from "@/components/project/CreateProjectDialog";
import { TaskList } from "@/components/task/TaskList";
import { MemberList } from "@/components/workspace/MemberList";
import Link from "next/link";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { workspaceId } = await params;
  const workspace = await getWorkspaceById(workspaceId, user.id);
  const projects = await listProjects(workspaceId, user.id);
  const recentTasks = await listTasks(
    { workspaceId, page: 1, pageSize: 10 },
    user.id
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {" / "}
          <span>{workspace.name}</span>
        </p>
        <h1 className="text-2xl font-bold mt-1">{workspace.name}</h1>
        <p className="text-muted-foreground mt-1">
          Role: {workspace.role}
        </p>
      </div>

      <section>
        <MemberList workspaceId={workspaceId} currentUserRole={workspace.role} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Projects</h2>
          {workspace.role !== "VIEWER" && <CreateProjectDialog workspaceId={workspaceId} />}
        </div>
        {projects.length === 0 ? (
          <p className="text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Tasks</h2>
          <Link
            href={`/tasks?workspaceId=${workspaceId}`}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <TaskList tasks={recentTasks.items} />
      </section>
    </div>
  );
}
