export default function Loading() {
  return (
    <main className="min-h-screen px-3 py-2 text-slate-800 sm:px-4 lg:px-5">
      <div className="mx-auto max-w-[1600px] animate-pulse">
        <div className="mb-4 flex items-center justify-between px-1 py-2">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-7 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="mb-3 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-slate-100" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg border border-slate-100 bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}
