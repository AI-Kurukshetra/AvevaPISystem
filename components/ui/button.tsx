import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-md bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
