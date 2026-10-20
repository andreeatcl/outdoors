export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-xl border bg-surface text-text-primary placeholder-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150
          ${error ? "border-red-400" : "border-border"} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
