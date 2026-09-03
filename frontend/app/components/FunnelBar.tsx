export function FunnelBar({
  label,
  value,
  percentage,
  color,
  barColor = "bg-gray-200",
  isException = false,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
  barColor?: string;
  isException?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${color} border border-[#1a1a1a]`}
    >
      <div className="flex-1">
        <span
          className={`text-sm font-medium ${isException && value > 0 ? "text-[#F05252]" : "text-[#E8EDF5]"}`}
        >
          {label}
        </span>
      </div>
      <div className="flex-1 flex justify-center">
        <div className="w-full bg-[#222B3A] rounded-full h-1.5 max-w-xs overflow-hidden">
          <div
            className={`h-1.5 rounded-full ${barColor}`}
            style={{ width: `${Math.max(percentage, 1)}%` }}
          ></div>
        </div>
      </div>
      <div className="flex-1 flex justify-end">
        <span className="text-sm font-mono text-[#8B96A8]">
          {value} records
        </span>
      </div>
    </div>
  );
}
