export function KpiCard({
  title,
  value,
  icon: Icon,
  highlight = "text-white",
}: {
  title: string;
  value: string | number;
  icon: any;
  highlight?: string;
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#8B96A8]">{title}</h3>
        <Icon className="w-4 h-4 text-[#444444]" />
      </div>
      <div className={`text-3xl font-mono tracking-tight ${highlight}`}>
        {value}
      </div>
    </div>
  );
}
