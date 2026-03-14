import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "SMARTFACTORY AI",
  description: "Industrial IoT Analytics Hub"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen grid-bg" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
