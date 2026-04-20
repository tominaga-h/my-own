export default function TasksSkeleton() {
  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 animate-pulse">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <div>
            <div className="h-9 w-32 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-28 rounded bg-slate-200/70" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-3 w-16 rounded bg-slate-200/70" />
            <div className="h-3 w-20 rounded bg-slate-200/70" />
            <div className="h-3 w-20 rounded bg-slate-200/70" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-lg bg-slate-200" />
              ))}
            </div>
            <div className="h-6 w-px bg-slate-100" />
            <div className="flex min-w-[240px] flex-1 items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
              <div className="h-4 w-4 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-200/70" />
            </div>
            <div className="h-9 w-36 rounded-xl border border-slate-100 bg-white" />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="flex items-center gap-3 bg-slate-100/60 px-5 py-2">
              <div className="h-3 w-5" />
              <div className="h-3 w-10 rounded bg-slate-200/70" />
              <div className="h-3 flex-1 rounded bg-slate-200/70" />
              <div className="h-3 w-16 rounded bg-slate-200/70" />
              <div className="h-3 w-20 rounded bg-slate-200/70" />
            </div>
            <div>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-[9px]"
                >
                  <div className="flex w-5 justify-center">
                    <div className="h-[7px] w-[7px] rounded-full bg-slate-200" />
                  </div>
                  <div className="h-3 w-8 rounded bg-slate-200/70" />
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <div
                      className="h-3 rounded bg-slate-200"
                      style={{ width: `${50 + ((i * 7) % 35)}%` }}
                    />
                  </div>
                  <div className="h-3 w-10 rounded bg-slate-200/70" />
                  <div className="h-3 w-16 rounded bg-slate-200/70" />
                </div>
              ))}
            </div>
          </div>

          <aside className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="bg-slate-100/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-200" />
                <div className="h-3 w-24 rounded bg-slate-200/70" />
                <div className="ml-auto h-4 w-12 rounded bg-slate-200" />
              </div>
              <div className="mt-2 space-y-2">
                <div className="h-4 w-4/5 rounded bg-slate-200" />
                <div className="h-4 w-3/5 rounded bg-slate-200" />
              </div>
            </div>

            <div className="space-y-2 px-3 py-3">
              <div className="grid grid-cols-2 gap-1">
                <div className="rounded-xl bg-slate-100/60 px-3 py-2 space-y-1">
                  <div className="h-3 w-10 rounded bg-slate-200/70" />
                  <div className="h-4 w-24 rounded bg-slate-200" />
                </div>
                <div className="rounded-xl bg-slate-100/60 px-3 py-2 space-y-1">
                  <div className="h-3 w-14 rounded bg-slate-200/70" />
                  <div className="h-4 w-24 rounded bg-slate-200" />
                </div>
              </div>
              <div className="rounded-xl bg-slate-100/60 px-3 py-2 space-y-1">
                <div className="h-3 w-14 rounded bg-slate-200/70" />
                <div className="h-4 w-28 rounded bg-slate-200" />
              </div>
              <div className="rounded-xl bg-slate-100/60 px-3 py-2 space-y-1">
                <div className="h-3 w-16 rounded bg-slate-200/70" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-20 rounded bg-slate-200" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                <div className="h-4 w-16 rounded bg-slate-200/70" />
                <div className="h-4 w-24 rounded bg-slate-200/70" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
