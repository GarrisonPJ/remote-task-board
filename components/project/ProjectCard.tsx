/**
 * ProjectCard — 项目卡片
 */

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import type { ProjectDTO } from "@/types/domain";

export function ProjectCard({ project }: { project: ProjectDTO }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {project.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No description
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
