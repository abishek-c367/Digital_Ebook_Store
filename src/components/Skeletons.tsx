export function BookCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[2/3] w-full rounded-lg skeleton" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-20 rounded skeleton" />
        <div className="h-5 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-4 w-1/4 rounded skeleton" />
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="aspect-[2/3] w-full max-w-sm rounded-lg skeleton" />
        <div className="space-y-4">
          <div className="h-3 w-24 rounded skeleton" />
          <div className="h-8 w-3/4 rounded skeleton" />
          <div className="h-5 w-1/2 rounded skeleton" />
          <div className="h-4 w-1/4 rounded skeleton" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-4 w-2/3 rounded skeleton" />
          </div>
          <div className="flex gap-4 pt-4">
            <div className="h-12 w-32 rounded-lg skeleton" />
            <div className="h-12 w-32 rounded-lg skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}
