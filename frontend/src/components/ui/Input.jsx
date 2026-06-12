export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-muted uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-card rounded-2xl px-4 py-3.5 text-soft placeholder-muted/50
          outline-none focus:ring-2 focus:ring-moss/25 transition-all duration-200 text-sm ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-peach-dark">{error}</p>}
    </div>
  )
}
