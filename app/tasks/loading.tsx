export default function Loading() {
  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 animate-pulse">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <div>
            <div className="h-9 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-48 rounded bg-slate-100" />
          </div>
          <div className="h-7 w-40 rounded-full bg-slate-100" />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/80 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-lg bg-slate-100" />
              ))}
            </div>
            <div className="h-6 w-px bg-slate-100" />
            <div className="flex min-w-[240px] flex-1 items-center gap-3 rounded-xl border border-slate-100 bg-white/80 px-3 py-2">
              <div className="h-4 w-4 rounded bg-slate-100" />
              <div className="h-5 flex-1 rounded bg-slate-100" />
            </div>
            <div className="h-8 w-32 rounded-xl border border-slate-100 bg-white/80" />
          </div>
          <div className="mt-3 flex gap-4">
            <div className="h-4 w-14 rounded bg-slate-100" />
            <div className="h-4 w-16 rounded bg-slate-100" />
            <div className="h-4 w-16 rounded bg-slate-100" />
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-100 bg-white/80 p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg border border-slate-100 bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
