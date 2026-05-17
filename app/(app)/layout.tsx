import Link from "next/link";
import { Layers, LayoutDashboard } from "lucide-react";
import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen">
      <aside className="hidden md:flex w-64 border-r bg-sidebar flex flex-col">
        <div className="flex items-center gap-3 px-4 h-14 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-xs">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Remote Task Board</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <CreateWorkspaceDialog />
        </nav>
        <div className="border-t p-3 space-y-3">
          <div className="flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 md:px-6 py-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <MobileNav userName={user.name} />
            <h1 className="text-lg font-semibold">Remote Task Board</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <QueryProvider>{children}</QueryProvider>
        </main>
      </div>
    </div>
  );
}
