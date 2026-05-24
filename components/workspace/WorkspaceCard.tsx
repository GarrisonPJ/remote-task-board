/**
 * WorkspaceCard — workspace summary card
 *
 * Renders a workspace preview using shadcn/ui Card.
 */

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import type { WorkspaceDTO } from "@/types/domain";

export function WorkspaceCard({ workspace }: { workspace: WorkspaceDTO }) {
  return (
    <Link href={`/workspaces/${workspace.id}`}>
      <Card className="shadow-sm ring-0 border-foreground/10 group hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{workspace.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {ROLE_LABELS[workspace.role] ?? workspace.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
