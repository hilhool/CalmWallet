export default function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-2xl px-6 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]'
  const variants = {
    primary:   'bg-moss text-white hover:bg-moss-dark shadow-sm',
    secondary: 'bg-card text-soft hover:bg-card-warm',
    ghost:     'text-moss hover:bg-moss/10',
  }
  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2 flex-shrink-0" />
      )}
      {children}
    </button>
  )
}
