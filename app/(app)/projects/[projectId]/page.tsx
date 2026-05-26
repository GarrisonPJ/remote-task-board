import { Fragment } from "react";
import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectById } from "@/services/project.service";
import { listTasks } from "@/services/task.service";
import { TaskList } from "@/components/task/TaskList";
import { CreateTaskDialog } from "@/components/task/CreateTaskDialog";
import { AiTaskDialog } from "@/components/task/AiTaskDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ProjectDeleteButton } from "@/components/project/ProjectDeleteButton";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { projectId } = await params;
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, Number(pageStr) || 1);

  const { project, userRole } = await getProjectById(projectId, user.id);
  const aiTaskCreationEnabled = Boolean(process.env.DEEPSEEK_API_KEY);
  const tasks = await listTasks(
    { projectId, page: currentPage, pageSize: PAGE_SIZE },
    user.id
  );

  function buildPageUrl(page: number): string {
    return `/projects/${projectId}${page > 1 ? `?page=${page}` : ""}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
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
        {userRole === "OWNER" && (
          <ProjectDeleteButton projectId={projectId} workspaceId={project.workspaceId} />
        )}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tasks</h2>
          {userRole !== "VIEWER" && (
            <div className="flex gap-2">
              <CreateTaskDialog projectId={projectId} workspaceId={project.workspaceId} />
              {aiTaskCreationEnabled && <AiTaskDialog projectId={projectId} />}
            </div>
          )}
        </div>
        <TaskList tasks={tasks.items} />

        {tasks.meta.totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={buildPageUrl(currentPage - 1)} />
                </PaginationItem>
              )}
              {Array.from({ length: tasks.meta.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === tasks.meta.totalPages)
                .map((p, idx, arr) => (
                  <Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href={buildPageUrl(p)}
                        isActive={p === currentPage}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </Fragment>
                ))}
              {currentPage < tasks.meta.totalPages && (
                <PaginationItem>
                  <PaginationNext href={buildPageUrl(currentPage + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}

        <p className="text-sm text-muted-foreground text-center mt-2">
          {tasks.meta.total} task{tasks.meta.total !== 1 ? "s" : ""}
        </p>
      </section>
    </div>
  );
}
