import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border/70 bg-muted/70",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent dark:before:via-slate-100/25",
        className
      )}
      aria-hidden="true"
    />
  );
}
