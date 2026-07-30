import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

export function AthleteCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40 max-w-full" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </Card>
  );
}

export function AthleteGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AthleteCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-3 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56 max-w-full" />
          <Skeleton className="h-3 w-32" />
        </Card>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Skeleton className="h-28 w-28 rounded-xl sm:h-32 sm:w-32" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-14 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <PageHeaderSkeleton />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="mt-6 space-y-4 p-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
