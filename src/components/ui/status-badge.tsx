type StatusBadgeProps = {
  available: boolean;
};

export function StatusBadge({ available }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
        available
          ? "bg-emerald-100 text-emerald-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {available ? "API healthy" : "API unavailable"}
    </span>
  );
}
