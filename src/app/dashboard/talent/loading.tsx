export default function TalentDashboardLoading() {
  return (
    <div className="space-y-6" aria-label="Loading talent dashboard" role="status">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="talent-skeleton h-3 w-28 rounded-full" />
          <div className="talent-skeleton h-10 w-64 max-w-[75vw] rounded-2xl" />
          <div className="talent-skeleton h-4 w-80 max-w-[85vw] rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="talent-skeleton h-16 w-24 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="talent-skeleton h-72 rounded-[1.75rem] lg:col-span-7" />
        <div className="talent-skeleton h-72 rounded-[1.75rem] lg:col-span-5" />
        <div className="talent-skeleton h-56 rounded-[1.75rem] lg:col-span-4" />
        <div className="talent-skeleton h-56 rounded-[1.75rem] lg:col-span-5" />
        <div className="talent-skeleton h-56 rounded-[1.75rem] lg:col-span-3" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
