export default function ClientProjectWorkspaceLoading() {
  return <ProjectWorkspaceSkeleton />;
}

function ProjectWorkspaceSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading project workspace">
      <div className="talent-skeleton h-5 w-28 rounded-full" />
      <div className="talent-skeleton h-72 rounded-[2rem]" />
      <div className="talent-skeleton h-14 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-12"><div className="talent-skeleton h-72 rounded-[1.75rem] lg:col-span-8" /><div className="talent-skeleton h-72 rounded-[1.75rem] lg:col-span-4" /></div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
