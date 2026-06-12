export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-3xl shadow-card p-5 ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform duration-150' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
