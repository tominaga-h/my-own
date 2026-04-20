export default function LinksSkeleton({ count = 6 }: { count?: number }) {
  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 animate-pulse">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <div>
            <div className="h-9 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-56 rounded bg-slate-200/70" />
          </div>
        </div>
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <article
              key={i}
              className="overflow-hidden rounded-xl border border-slate-100 bg-white"
            >
              <div className="relative aspect-[40/21] bg-slate-200">
                <div className="absolute left-4 top-4 h-6 w-20 rounded-full bg-slate-300" />
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-6 w-14 rounded-full bg-slate-200" />
                  <div className="h-4 w-24 rounded bg-slate-200" />
                </div>
                <div className="min-h-[232px] space-y-3">
                  <div className="space-y-2">
                    <div className="h-5 w-4/5 rounded bg-slate-200" />
                    <div className="h-5 w-3/5 rounded bg-slate-200" />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="h-4 w-full rounded bg-slate-200/70" />
                    <div className="h-4 w-11/12 rounded bg-slate-200/70" />
                    <div className="h-4 w-2/3 rounded bg-slate-200/70" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="h-4 w-48 rounded bg-slate-200" />
                  <div className="h-6 w-10 rounded-full bg-slate-200" />
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
