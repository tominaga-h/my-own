export default function TasksSkeleton() {
  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 animate-pulse">
        <header className="flex items-end justify-between px-1 pt-1">
          <div>
            <div className="h-3 w-20 rounded bg-slate-200/70" />
            <div className="mt-2 h-8 w-28 rounded bg-slate-200" />
          </div>
          <div className="h-8 w-28 rounded-full bg-slate-200" />
        </header>

        <div className="rounded-2xl bg-white/70 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-lg bg-slate-200" />
              ))}
            </div>
            <div className="h-6 w-px bg-slate-200/70" />
            <div className="h-8 w-28 rounded-lg bg-slate-200" />
            <div className="h-6 w-px bg-slate-200/70" />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2">
              <div className="h-3 w-3 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200/70" />
            </div>
            <div className="flex min-w-[240px] flex-1 items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2">
              <div className="h-4 w-4 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-200/70" />
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl bg-white/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <GroupBlock rows={4} />
          <GroupBlock rows={3} />
          <GroupBlock rows={5} />
        </section>
      </div>
    </main>
  );
}

function GroupBlock({ rows }: { rows: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-6 pb-1.5 pt-3">
        <div className="h-3 w-16 rounded bg-slate-200/70" />
        <div className="h-px flex-1 bg-slate-200/50" />
        <div className="h-3 w-6 rounded bg-slate-200/70" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3.5 px-6 py-[14px]"
        >
          <div className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full bg-slate-200" />
          <div className="mt-[6px] h-3 w-10 shrink-0 rounded bg-slate-200/70" />
          <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <div
              className="h-4 rounded bg-slate-200"
              style={{ width: `${50 + ((i * 17) % 38)}%` }}
            />
            {i % 3 !== 2 && (
              <div className="flex flex-wrap items-center gap-3">
                {i % 2 === 0 && (
                  <div className="h-3 w-24 rounded bg-slate-200/70" />
                )}
                <div className="h-3 w-16 rounded bg-slate-200/70" />
                {i % 3 === 0 && (
                  <div className="h-3 w-20 rounded bg-slate-200/70" />
                )}
              </div>
            )}
          </div>
          <div className="mt-0.5 h-5 w-5 shrink-0 rounded bg-slate-200/70" />
        </div>
      ))}
    </div>
  );
}
