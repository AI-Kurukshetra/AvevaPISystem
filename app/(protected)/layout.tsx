import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { RequireAuth } from "@/components/auth/require-auth";
import { AIAssistantPanel } from "@/components/dashboard/ai-assistant-panel";
import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen md:flex">
        <Sidebar />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:p-8">{children}</main>
        <AIAssistantPanel />
        <SessionTimeoutGuard />
      </div>
    </RequireAuth>
  );
}
