/**
 * WorkspaceCard — 工作区卡片
 *
 * 用 shadcn/ui 的 Card 组件展示 workspace 基本信息。
 */

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceDTO } from "@/types/domain";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function WorkspaceCard({ workspace }: { workspace: WorkspaceDTO }) {
  return (
    <Link href={`/workspaces/${workspace.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{workspace.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{ROLE_LABELS[workspace.role] ?? workspace.role}</Badge>
          {/* TODO: 显示成员数量和项目数量 */}
        </CardContent>
      </Card>
    </Link>
  );
}
