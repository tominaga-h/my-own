export default function NotesSkeleton() {
  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 animate-pulse">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <div>
            <div className="h-9 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-56 rounded bg-slate-200/70" />
          </div>
          <div className="h-7 w-24 rounded-full bg-slate-200" />
        </div>

        <section className="grid gap-3 lg:grid-cols-[220px_minmax(320px,460px)_minmax(0,1fr)]">
          <aside className="rounded-xl border border-slate-100 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-slate-200/70" />
                <div className="h-4 w-24 rounded bg-slate-200" />
              </div>
              <div className="h-6 w-14 rounded-full bg-slate-200" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-3"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                    <div className="h-3 w-16 rounded bg-slate-200/70" />
                  </div>
                  <div className="h-5 w-8 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 rounded-md border border-slate-100 p-3">
              <div className="h-3 w-12 rounded bg-slate-200/70" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-200/70" />
            </div>
          </aside>

          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="h-20 w-full rounded bg-slate-200/70" />
              <div className="mt-2 flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-slate-200/70" />
                <div className="h-7 w-16 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-slate-200/70" />
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
              <div className="h-6 w-12 rounded-full bg-slate-200" />
            </div>
            <ul className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="px-4 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex w-16 shrink-0 flex-col gap-2 pt-0.5">
                      <div className="h-3 w-10 rounded bg-slate-200/70" />
                      <div className="h-3 w-12 rounded bg-slate-200/70" />
                      <div className="h-3 w-14 rounded bg-slate-200/70" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-4/5 rounded bg-slate-200" />
                          <div className="h-3 w-full rounded bg-slate-200/70" />
                          <div className="h-3 w-3/4 rounded bg-slate-200/70" />
                        </div>
                        <div className="h-6 w-12 rounded-full bg-slate-200" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <div className="h-5 w-20 rounded-full bg-slate-200/70" />
                        <div className="h-5 w-16 rounded-full bg-slate-200/70" />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="overflow-hidden rounded-xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-5 py-4 space-y-3">
              <div className="h-3 w-16 rounded bg-slate-200/70" />
              <div className="h-6 w-3/4 rounded bg-slate-200" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-14 rounded-full bg-slate-200/70" />
                <div className="h-5 w-16 rounded-full bg-slate-200/70" />
                <div className="h-5 w-20 rounded-full bg-slate-200/70" />
              </div>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div className="rounded-md border border-slate-100 p-4 space-y-2">
                <div className="h-3 w-12 rounded bg-slate-200/70" />
                <div className="h-4 w-full rounded bg-slate-200/70" />
                <div className="h-4 w-11/12 rounded bg-slate-200/70" />
                <div className="h-4 w-5/6 rounded bg-slate-200/70" />
                <div className="h-4 w-2/3 rounded bg-slate-200/70" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-100 p-4 space-y-2">
                  <div className="h-3 w-14 rounded bg-slate-200/70" />
                  <div className="h-4 w-28 rounded bg-slate-200" />
                </div>
                <div className="rounded-md border border-slate-100 p-4 space-y-2">
                  <div className="h-3 w-14 rounded bg-slate-200/70" />
                  <div className="h-4 w-28 rounded bg-slate-200" />
                </div>
              </div>
              <div className="rounded-md border border-slate-100 p-4 space-y-3">
                <div className="h-3 w-16 rounded bg-slate-200/70" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-5 w-24 rounded-full bg-slate-200/70" />
                  <div className="h-5 w-28 rounded-full bg-slate-200/70" />
                  <div className="h-5 w-20 rounded-full bg-slate-200/70" />
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
