import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-hooks";
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Shield,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

type Tab = { to: string; label: string; icon: LucideIcon };

export function BottomTabBar() {
  const { user, roles } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return null;

  const isCoach = roles.includes("coach");
  const isAdmin = roles.includes("admin");
  const family = roles.includes("athlete") || roles.includes("parent");

  let tabs: Tab[] = [];
  if (family) {
    tabs = [
      { to: "/dashboard", label: "Home", icon: LayoutDashboard },
      { to: "/messages", label: "Messages", icon: MessageSquare },
      { to: "/colleges", label: "Colleges", icon: GraduationCap },
      { to: "/insights", label: "Insights", icon: BarChart3 },
      { to: "/profile/edit", label: "Profile", icon: User },
    ];
  } else if (isCoach || isAdmin) {
    tabs = [
      { to: "/coaches", label: "Athletes", icon: Users },
      { to: "/coaches/games", label: "Games", icon: CalendarDays },
      { to: "/coaches/saved", label: "Pipeline", icon: Bookmark },
      { to: "/coaches/messages", label: "Inbox", icon: Inbox },
      isAdmin
        ? { to: "/admin", label: "Admin", icon: Shield }
        : { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    ];
  } else {
    tabs = [{ to: "/dashboard", label: "Home", icon: LayoutDashboard }];
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => {
          const active = pathname === t.to || pathname.startsWith(`${t.to}/`);
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
