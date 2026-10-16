import { Card, CardBody, Skeleton } from '@/components/ui';

export default function CoursesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10" aria-busy="true">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none" />
            <CardBody className="space-y-3 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </CardBody>
          </Card>
        ))}
      </div>
    </main>
  );
}
