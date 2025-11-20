export default function KpiCard({ title, value, dark }) {
  return (
    <div
      className={`rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-md transition-colors
        ${
          dark
            ? "bg-blue-700 text-white"
            : "bg-blue-200 text-slate-900"
        }`}
    >
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
