"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";
import { Activity, AlertTriangle, Factory, FileBarChart2, Gauge, LogOut, Menu, Waves, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { supabase } from "@/lib/supabase/client";
import { UserProfileMenu } from "@/components/layout/user-profile-menu";
import { useToast } from "@/components/ui/toaster";

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
      <aside className="hidden w-64 border-r border-border bg-[#0a1220]/90 p-4 backdrop-blur-md md:block">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-wide text-accent">
            <Activity className="h-5 w-5" /> SMARTFACTORY AI
          </h1>
          <p className="mt-1 text-xs text-slate-400">Industrial IoT Analytics Hub</p>
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
                  active ? "bg-accent/15 text-accent" : "text-slate-300 hover:bg-slate-800/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {route.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6">
          <UserProfileMenu />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/60"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      <div className="sticky top-0 z-30 border-b border-border bg-[#0a1220]/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent">
            <Activity className="h-4 w-4" />
            SMARTFACTORY AI
          </div>
          <button
            type="button"
            aria-label={mobileOpen ? "Close sidebar menu" : "Open sidebar menu"}
            onClick={() => setMobileOpen((current) => !current)}
            className="rounded-md border border-border p-2 text-slate-200 transition-colors hover:bg-slate-800/60"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
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
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-[#0a1220]/95 p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent">
                <Activity className="h-4 w-4" />
                SMARTFACTORY AI
              </h2>
              <button
                type="button"
                aria-label="Close sidebar menu"
                onClick={closeMobileMenu}
                className="rounded-md border border-border p-1.5 text-slate-300"
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
                      active ? "bg-accent/15 text-accent" : "text-slate-300 hover:bg-slate-800/60"
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
              className="mt-6 flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/60"
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
