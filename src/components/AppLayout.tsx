import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanSquare, Briefcase, Users, LogOut, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const links = [
  { to: "/board", label: "Kanban", icon: KanbanSquare },
  { to: "/jobs", label: "Jobb", icon: Briefcase },
  { to: "/candidates", label: "Kandidater", icon: Users },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function signOut() {
    setLogoutOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
        <Link to="/board" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
            A
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">DemoATS</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                pathname === to && "bg-sidebar-accent",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                pathname === "/admin" && "bg-sidebar-accent",
              )}
            >
              <ShieldCheck className="size-4" />
              Konton
            </Link>
          )}
        </nav>
        <div className="mt-6 border-t border-sidebar-border pt-4">
          <p className="px-3 text-sm font-medium">{user?.fullName ?? user?.email}</p>
          <p className="px-3 text-xs opacity-70">{user?.isAdmin ? "Admin" : "Kund"}</p>
          <Button
            variant="ghost"
            onClick={() => setLogoutOpen(true)}
            className="mt-2 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" /> Logga ut
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <span className="font-display font-semibold">DemoATS</span>
          <div className="flex items-center gap-1">
            {links.map(({ to, icon: Icon }) => (
              <Link key={to} to={to} className="rounded-md p-2 hover:bg-muted">
                <Icon className="size-4" />
              </Link>
            ))}
            {user?.isAdmin && (
              <Link to="/admin" className="rounded-md p-2 hover:bg-muted">
                <ShieldCheck className="size-4" />
              </Link>
            )}
            <button
              onClick={() => setLogoutOpen(true)}
              className="rounded-md p-2 hover:bg-muted"
              aria-label="Logga ut"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Logga ut?</DialogTitle>
            <DialogDescription>
              Du kommer att loggas ut från DemoATS och behöver logga in igen för att fortsätta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setLogoutOpen(false)}
              className="w-full sm:w-auto"
            >
              Avbryt
            </Button>
            <Button variant="destructive" onClick={signOut} className="w-full sm:w-auto">
              Logga ut
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
