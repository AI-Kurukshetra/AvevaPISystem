import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-72" />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`metric-${index}`} className="rounded-xl border border-border bg-card/80 p-4">
            <Skeleton className="mb-3 h-4 w-28" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`chart-${index}`} className="rounded-xl border border-border bg-card/80 p-4">
            <Skeleton className="mb-4 h-4 w-36" />
            <Skeleton className="h-56 w-full" />
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-xl border border-border p-4">
        <Skeleton className="mb-2 h-4 w-40 bg-danger/30" />
        <Skeleton className="h-4 w-[85%] bg-danger/20" />
      </section>
    </div>
  );
}
