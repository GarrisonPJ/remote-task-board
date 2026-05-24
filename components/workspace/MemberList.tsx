"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";
import type { WorkspaceMemberDTO, WorkspaceRole } from "@/types/domain";

type Props = {
  workspaceId: string;
  currentUserRole: WorkspaceRole;
};

export function MemberList({ workspaceId, currentUserRole }: Props) {
  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadMembers() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to load members");
        return;
      }
      setMembers(json.data);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  async function handleAddMember(e: { preventDefault: () => void }) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to add member");
        return;
      }

      toast.success("Member added!");
      setEmail("");
      setRole("MEMBER");
      await loadMembers();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to remove member");
        return;
      }

      toast.success("Member removed");
      await loadMembers();
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  const isOwner = currentUserRole === "OWNER";

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading members...</p>;
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <form onSubmit={handleAddMember} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
              required
            />
          </div>
          <Select
            value={role}
            onValueChange={(v) => v && setRole(v as WorkspaceRole)}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="h-9" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </form>
      )}

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <ul className="divide-y">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.user.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {m.user.email}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge variant="secondary">
                  {ROLE_LABELS[m.role] ?? m.role}
                </Badge>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(m.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
