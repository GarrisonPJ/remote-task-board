"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, LayoutDashboard, Menu, X } from "lucide-react";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";

type Props = {
  userName: string;
};

export function MobileNav({ userName }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      document.body.style.overscrollBehavior = "contain";
    } else {
      document.body.style.overscrollBehavior = "";
    }
    return () => {
      document.body.style.overscrollBehavior = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-3 -ml-3 rounded-lg hover:bg-muted transition-all duration-150 active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay — click to close */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in sidebar — mobile only */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r flex flex-col transition-transform duration-200 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-xs">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Remote Task Board</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-all duration-150 hover:scale-110 active:scale-95"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-95",
              pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <CreateWorkspaceDialog />
        </nav>

        <div className="border-t p-3 space-y-3">
          <div className="flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
