export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
    outline:
      "border border-border text-text-primary bg-surface hover:bg-background",
    ghost: "text-text-muted hover:text-text-primary hover:bg-background",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
