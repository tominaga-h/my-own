export default function Loading() {
  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 animate-pulse">
        <div className="px-1 py-2">
          <div className="h-9 w-40 rounded bg-slate-200" />
        </div>
        <section className="grid gap-3 lg:grid-cols-[220px_minmax(320px,460px)_minmax(0,1fr)]">
          <div className="h-[420px] rounded-xl bg-slate-200" />
          <div className="h-[420px] rounded-xl bg-slate-200" />
          <div className="h-[420px] rounded-xl bg-slate-200" />
        </section>
      </div>
    </main>
  );
}
