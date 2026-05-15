export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 space-y-3">
        <div
          className="h-3 w-24 animate-pulse rounded-full"
          style={{ backgroundColor: "var(--rule)" }}
        />
        <div
          className="h-10 w-80 max-w-full animate-pulse rounded-md"
          style={{ backgroundColor: "var(--rule)" }}
        />
        <div
          className="h-3 w-40 animate-pulse rounded-full"
          style={{ backgroundColor: "var(--rule)" }}
        />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper-pure)" }}
          >
            <div
              className="aspect-video w-full animate-pulse"
              style={{ backgroundColor: "var(--paper-soft)" }}
            />
            <div className="space-y-2 p-4">
              <div
                className="h-3 w-full animate-pulse rounded-full"
                style={{ backgroundColor: "var(--rule)" }}
              />
              <div
                className="h-3 w-2/3 animate-pulse rounded-full"
                style={{ backgroundColor: "var(--rule)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
