interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-[var(--navy-2)] rounded-[14px] p-3">
      <small className="text-[#8da0c0] text-[13px]">{label}</small>
      <b className="block text-xl mt-0.5">{value}</b>
    </div>
  );
}