/**
 * The checkout's loading placeholders, shaped like the form and the order
 * review so the page does not jump when Bacano's options arrive.
 */

/** Two placeholder rows while the real options load; keyed by slot, not index. */
const SKELETON_SLOTS = ["first", "second"] as const;

export function CheckoutLoadingSkeleton({
  mode,
}: {
  mode: "classic" | "one-page";
}) {
  if (mode !== "one-page") {
    return (
      <main className="container-page py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <CheckoutFormSkeleton />
          <CheckoutReviewSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page-container py-5 sm:py-12">
      <div className="grid items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-12">
        <CheckoutFormSkeleton />
        <CheckoutReviewSkeleton />
      </div>
    </main>
  );
}

function CheckoutFormSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid content-start gap-6 rounded-lg border border-border bg-white p-5 sm:p-6"
    >
      <div className="grid gap-4">
        <SkeletonLine className="h-6 w-44" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
        </div>
      </div>

      <div className="grid gap-4 border-border border-t pt-5">
        <SkeletonLine className="h-6 w-28" />
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
        </div>
        <SkeletonBlock className="h-24" />
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
        </div>
      </div>

      <div className="grid gap-4">
        <SkeletonLine className="h-6 w-24" />
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
      </div>
    </div>
  );
}

function CheckoutReviewSkeleton() {
  return (
    <aside
      aria-busy="true"
      className="grid content-start gap-5 rounded-lg border border-border bg-surface-secondary p-3 shadow-[0_18px_44px_rgba(0,0,0,0.05)] sm:p-5"
    >
      <div className="flex items-end justify-between gap-4">
        <SkeletonLine className="h-6 w-44" />
        <SkeletonLine className="h-4 w-20" />
      </div>

      {SKELETON_SLOTS.map((slot) => (
        <div
          key={slot}
          className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 py-3"
        >
          <SkeletonBlock className="aspect-square" />
          <div className="grid gap-2">
            <SkeletonLine className="h-4 w-11/12" />
            <SkeletonLine className="h-4 w-7/12" />
            <SkeletonLine className="h-8 w-28" />
          </div>
          <SkeletonLine className="h-4 w-20" />
        </div>
      ))}

      <div className="grid gap-3 border-border border-t pt-5">
        <SkeletonLine className="h-6 w-36" />
        <SkeletonBlock className="h-16" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-12 rounded-full" />
      </div>
    </aside>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-secondary ${className}`}
    />
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-surface-secondary ${className}`}
    />
  );
}
