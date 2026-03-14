"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  kind: ToastKind;
}

interface ToastInput {
  title: string;
  description?: string;
  kind?: ToastKind;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, kind = "info" }: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((current) => [...current, { id, title, description, kind }]);
      setTimeout(() => {
        removeToast(id);
      }, 3200);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[340px] max-w-[95vw] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur-sm",
              item.kind === "error" && "border-danger/70 bg-danger/20 text-red-100",
              item.kind === "success" && "border-success/70 bg-success/20 text-emerald-100",
              item.kind === "info" && "border-accent/60 bg-[#0c1829]/90 text-slate-100"
            )}
          >
            <p className="font-semibold">{item.title}</p>
            {item.description ? <p className="mt-0.5 text-xs opacity-90">{item.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
