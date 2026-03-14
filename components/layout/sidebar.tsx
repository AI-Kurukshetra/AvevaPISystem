"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";
import { Activity, AlertTriangle, Factory, FileBarChart2, Gauge, LogOut, Menu, Waves, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { supabase } from "@/lib/supabase/client";
import { UserProfileMenu } from "@/components/layout/user-profile-menu";
import { NotificationCenter } from "@/components/layout/notification-center";
import { useToast } from "@/components/ui/toaster";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/assets", label: "Assets", icon: Factory },
  { href: "/sensors", label: "Sensors", icon: Waves },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileBarChart2 }
] as const satisfies ReadonlyArray<{ href: Route; label: string; icon: React.ComponentType<{ className?: string }> }>;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toast } = useToast();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Logout issue",
        description: error.message,
        kind: "error"
      });
    }

    router.replace("/");
    router.refresh();
    window.location.assign("/");
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      <aside className="hidden h-screen w-64 self-start border-r border-border bg-card p-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md md:sticky md:top-0 md:flex md:flex-col">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-wide text-accent">
            <Activity className="h-5 w-5" /> SMARTFACTORY AI
          </h1>
          <p className="mt-1 text-xs text-muted">Industrial IoT Analytics Hub</p>
        </div>
        <nav className="space-y-1">
          {routes.map((route) => {
            const Icon = route.icon;
            const active = pathname.startsWith(route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-accent/15 text-accent" : "text-foreground/80 hover:bg-surface"
                )}
              >
                <Icon className="h-4 w-4" />
                {route.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <UserProfileMenu />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <NotificationCenter compact />
          <ThemeToggle className="hidden h-9 w-9 items-center justify-center rounded-md border border-border text-foreground/80 transition-colors hover:bg-surface" />
        </div>
      </aside>

      <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent">
            <Activity className="h-4 w-4" />
            SMARTFACTORY AI
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter compact />
            <ThemeToggle className="hidden h-8 w-8 items-center justify-center rounded-md border border-border text-foreground/80 transition-colors hover:bg-surface" />
            <button
              type="button"
              aria-label={mobileOpen ? "Close sidebar menu" : "Open sidebar menu"}
              onClick={() => setMobileOpen((current) => !current)}
              className="rounded-md border border-border p-2 text-foreground transition-colors hover:bg-surface"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close mobile sidebar overlay"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent">
                <Activity className="h-4 w-4" />
                SMARTFACTORY AI
              </h2>
              <button
                type="button"
                aria-label="Close sidebar menu"
                onClick={closeMobileMenu}
                className="rounded-md border border-border p-1.5 text-foreground/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <UserProfileMenu />
            </div>

            <nav className="space-y-1">
              {routes.map((route) => {
                const Icon = route.icon;
                const active = pathname.startsWith(route.href);

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      active ? "bg-accent/15 text-accent" : "text-foreground/80 hover:bg-surface"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </aside>
        </div>
      ) : null}
    </>
  );
}
