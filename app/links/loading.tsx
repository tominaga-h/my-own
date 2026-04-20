export default function Loading() {
  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 animate-pulse">
        <div className="px-1 py-2">
          <div className="h-9 w-40 rounded bg-slate-200" />
        </div>
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[440px] rounded-xl bg-slate-200" />
          ))}
        </section>
      </div>
    </main>
  );
}
