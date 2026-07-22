export function ClientPageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-label="Loading page" aria-busy="true">
      <div className="space-y-2">
        <div className="talent-skeleton h-3 w-32 rounded-full" />
        <div className="talent-skeleton h-10 w-64 max-w-[80%] rounded-2xl" />
        <div className="talent-skeleton h-4 w-[34rem] max-w-full rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: Math.min(cards, 4) }).map((_, index) => <div key={index} className="talent-skeleton h-28 rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => <div key={index} className="talent-skeleton h-64 rounded-[1.75rem]" />)}
      </div>
    </div>
  );
}
