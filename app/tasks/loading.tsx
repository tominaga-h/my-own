export default function Loading() {
  return (
    <main className="min-h-screen px-3 py-3 text-slate-800 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 animate-pulse">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1 py-2">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-7 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="space-y-2 rounded-xl border border-slate-100 bg-white/80 p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg border border-slate-100 bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}
