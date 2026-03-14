import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-border bg-[#0f1624] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40",
        props.className
      )}
    />
  );
}
