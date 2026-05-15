"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";

type Props = {
  userName: string;
};

export function MobileNav({ userName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay — click to close */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in sidebar — mobile only */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-background border-r p-4 flex flex-col transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="font-semibold text-lg">Remote Task Board</div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 flex-1">
          <a
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          >
            Dashboard
          </a>
          <CreateWorkspaceDialog />
        </nav>

        <div className="border-t pt-3 space-y-2">
          <p className="text-sm text-muted-foreground px-3">{userName}</p>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
