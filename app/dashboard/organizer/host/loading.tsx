export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="h-40 w-full rounded-3xl bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

