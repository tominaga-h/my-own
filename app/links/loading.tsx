export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 animate-pulse">
        <div className="px-1 py-2">
          <div className="h-9 w-40 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-48 rounded bg-slate-100" />
        </div>
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="aspect-[40/21] bg-slate-100" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-20 rounded bg-slate-100" />
                <div className="h-5 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
