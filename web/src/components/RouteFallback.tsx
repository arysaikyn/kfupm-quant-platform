/** Shown while a route chunk loads. Matches the page rhythm so the swap is quiet. */
export function RouteFallback() {
  return (
    <main className="screen-pad mx-auto w-full max-w-[520px] px-4 pt-6">
      <div className="shimmer h-7 w-40 rounded-lg" />
      <div className="mt-3 shimmer h-4 w-64 rounded" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="shimmer h-24 rounded-[18px]" />
        ))}
      </div>
    </main>
  )
}
