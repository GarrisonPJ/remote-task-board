"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { TaskTable } from "./TaskTable";
import { TaskList } from "./TaskList";
import { TaskFilters } from "./TaskFilters";
import { TaskTableSkeleton } from "./TaskTableSkeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { PaginatedResponse } from "@/types/api";
import type { TaskDTO } from "@/types/domain";

export function TaskListContent() {
  const searchParams = useSearchParams();

  const queryString = searchParams.toString();
  const currentPage = Number(searchParams.get("page") ?? 1);

  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<TaskDTO>>({
    queryKey: ["tasks", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?${queryString}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load tasks");
      return json.data;
    },
  });

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    return `/tasks?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {" / "}
          <span>Tasks</span>
        </p>
        <h1 className="text-2xl font-bold mt-1">Tasks</h1>
      </div>

      <TaskFilters />

      {isLoading ? (
        <TaskTableSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="h-12 w-12 text-destructive/60 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-destructive font-medium">Failed to load tasks</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred."}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="h-16 w-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-muted-foreground mt-1">
            Try adjusting your filters or{" "}
            <Link href="/tasks" className="text-primary hover:underline">
              clear all filters
            </Link>
            .
          </p>
        </div>
      ) : data ? (
        <>
          {/* Mobile: card layout */}
          <div className="md:hidden">
            <TaskList tasks={data.items} />
          </div>
          {/* Desktop: table layout */}
          <div className="hidden md:block">
            <TaskTable tasks={data.items} />
          </div>

          {data.meta.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={buildPageUrl(currentPage - 1)} />
                  </PaginationItem>
                )}
                {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === data.meta.totalPages)
                  .map((p, idx, arr) => (
                    <span key={p}>
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
                    </span>
                  ))}
                {currentPage < data.meta.totalPages && (
                  <PaginationItem>
                    <PaginationNext href={buildPageUrl(currentPage + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {data.meta.total} task{data.meta.total !== 1 ? "s" : ""} found
          </p>
        </>
      ) : null}
    </div>
  );
}
