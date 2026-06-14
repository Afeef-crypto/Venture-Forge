import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { FileStack, Home, LayoutTemplate, ListTodo, Map, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Brand } from "./brand";
import { Button } from "./ui/button";

const links = [
  { to: "/dashboard", label: "Overview", icon: Home },
  { to: "/reports", label: "Reports", icon: FileStack },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/tasks", label: "Implementation Plan", icon: ListTodo },
  { to: "/roadmap", label: "Roadmap", icon: Map },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X /> : <Menu />}
      </Button>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-background p-5 transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Brand />
        <nav className="mt-10 flex-1 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded px-3 py-2.5 text-xs transition-colors ${
                path.startsWith(l.to)
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
        <Button variant="hero" size="sm" className="w-full" onClick={() => navigate({ to: "/new-evaluation" })}>
          New Evaluation
        </Button>
      </aside>
      <div className="md:pl-56">
        <div className="min-h-screen p-5 pt-20 sm:p-8 md:p-10">{children}</div>
      </div>
    </div>
  );
}
