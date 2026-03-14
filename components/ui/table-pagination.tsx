import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPrevious,
  onNext
}: TablePaginationProps) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted">
      <span>
        Showing {startItem}-{endItem} of {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <Button type="button" className="px-2 py-1" disabled={page === 1} onClick={onPrevious}>
          Previous
        </Button>
        <span className="min-w-16 text-center text-foreground/80">
          Page {page} / {totalPages}
        </span>
        <Button type="button" className="px-2 py-1" disabled={page >= totalPages} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
