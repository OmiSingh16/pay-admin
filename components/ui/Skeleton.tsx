export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 grid gap-4 md:gap-6 animate-pulse">
      <div className="flex justify-between items-center gap-3">
        <div className="grid gap-2">
          <div className="h-8 w-64 bg-[var(--panel-2)] rounded-lg" />
          <div className="h-4 w-48 bg-[var(--panel-2)] rounded-md" />
        </div>
        <div className="h-9 w-24 bg-[var(--panel-2)] rounded-full" />
      </div>

      <section className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-5 bg-[var(--navy)] rounded-[var(--r)] p-6 min-h-[280px] flex flex-col justify-between">
          <div className="h-4 w-32 bg-[var(--navy-2)] rounded" />
          <div className="h-14 w-48 bg-[var(--navy-2)] rounded-lg mt-4" />
          <div className="grid grid-cols-3 gap-2.5 mt-auto">
            <div className="h-16 bg-[var(--navy-2)] rounded-[14px]" />
            <div className="h-16 bg-[var(--navy-2)] rounded-[14px]" />
            <div className="h-16 bg-[var(--navy-2)] rounded-[14px]" />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 bg-[var(--panel)] rounded-[var(--r)] p-6">
          <div className="h-6 w-40 bg-[var(--panel-2)] rounded mb-4" />
          <div className="h-[230px] w-full bg-[var(--panel-2)] rounded-xl" />
        </div>
      </section>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="p-4 md:p-6 grid gap-4 animate-pulse">
      {/* Header */}
      <div className="bg-[var(--navy)] rounded-[var(--r)] p-5 flex justify-between items-center">
        <div className="grid gap-2">
          <div className="h-4 w-32 bg-[var(--navy-2)] rounded" />
          <div className="h-8 w-40 bg-[var(--navy-2)] rounded" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-16 bg-[var(--navy-2)] rounded" />
          <div className="h-10 w-16 bg-[var(--navy-2)] rounded" />
          <div className="h-10 w-16 bg-[var(--navy-2)] rounded" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] p-4 flex gap-3">
        <div className="h-10 w-48 bg-[var(--panel-2)] rounded-xl" />
        <div className="h-10 flex-1 bg-[var(--panel-2)] rounded-xl" />
        <div className="h-10 w-24 bg-[var(--panel-2)] rounded-full" />
      </div>

      {/* Table */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] overflow-hidden">
        <div className="bg-[var(--panel-2)] h-12 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-[var(--line)] last:border-0">
            <div className="h-4 w-20 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-32 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-24 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-40 bg-[var(--panel-2)] rounded flex-1" />
            <div className="h-4 w-20 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-16 bg-[var(--panel-2)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsersSkeleton() {
  return (
    <div className="p-4 md:p-6 grid gap-4 md:gap-6 animate-pulse">
      {/* Pulse */}
      <div className="bg-[var(--navy)] rounded-[var(--r)] p-5 flex justify-between flex-wrap gap-4">
        <div className="grid gap-2">
          <div className="h-4 w-32 bg-[var(--navy-2)] rounded" />
          <div className="h-10 w-40 bg-[var(--navy-2)] rounded" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-28 bg-[var(--navy-2)] rounded-[14px]" />)}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] p-4 flex gap-3">
        <div className="h-10 flex-1 bg-[var(--panel-2)] rounded-xl" />
        <div className="h-10 w-24 bg-[var(--panel-2)] rounded-full" />
        <div className="h-10 w-24 bg-[var(--panel-2)] rounded-full" />
        <div className="h-10 w-32 bg-[var(--panel-2)] rounded-xl" />
      </div>

      {/* Table */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] overflow-hidden">
        <div className="bg-[var(--panel-2)] h-12 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-[var(--line)] last:border-0">
            <div className="h-8 w-8 bg-[var(--panel-2)] rounded-full" />
            <div className="h-4 w-24 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-20 bg-[var(--panel-2)] rounded flex-1" />
            <div className="h-4 w-16 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-20 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-16 bg-[var(--panel-2)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UpiSkeleton() {
  return (
    <div className="p-4 md:p-6 grid gap-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-[var(--panel-2)] rounded" />
        <div className="h-10 w-24 bg-[var(--panel-2)] rounded-xl" />
      </div>
      <div className="bg-[var(--panel)] rounded-[var(--r)] p-4 grid gap-3">
        <div className="h-10 w-full bg-[var(--panel-2)] rounded-full" />
        <div className="h-10 w-full bg-[var(--panel-2)] rounded-full" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-[var(--panel)] rounded-[var(--r)] p-5 flex gap-4">
          <div className="w-16 h-16 bg-[var(--panel-2)] rounded-2xl shrink-0" />
          <div className="flex-1 grid gap-2">
            <div className="h-5 w-48 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-64 bg-[var(--panel-2)] rounded" />
            <div className="h-4 w-32 bg-[var(--panel-2)] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}