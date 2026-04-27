import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    fullWidth = false,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    
    // 基础样式
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2 font-semibold",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
      "disabled:pointer-events-none disabled:opacity-50",
      "cursor-pointer select-none",
      "active:scale-[0.98]",
      fullWidth && "w-full"
    )
    
    // 变体样式
    const variants = {
      primary: cn(
        "bg-accent text-bg-primary",
        "rounded-full px-5 py-2.5",
        "border border-accent",
        "hover:bg-accent-hover hover:shadow-glow hover:-translate-y-0.5",
        "shadow-lg shadow-accent/20"
      ),
      secondary: cn(
        "bg-transparent text-text-primary",
        "rounded-full px-5 py-2.5",
        "border border-border",
        "hover:bg-accent-subtle hover:border-accent/50 hover:-translate-y-0.5"
      ),
      outline: cn(
        "bg-transparent text-text-secondary",
        "rounded-full px-4 py-2",
        "border border-border",
        "hover:border-accent hover:text-accent hover:bg-accent-subtle"
      ),
      ghost: cn(
        "bg-transparent text-text-secondary",
        "rounded-lg px-4 py-2",
        "hover:bg-bg-tertiary hover:text-text-primary"
      ),
      danger: cn(
        "bg-error text-white",
        "rounded-full px-5 py-2.5",
        "border border-error",
        "hover:bg-red-600 hover:shadow-lg hover:shadow-error/20 hover:-translate-y-0.5"
      ),
      link: cn(
        "bg-transparent text-accent",
        "underline-offset-4 hover:underline",
        "hover:text-accent-light"
      ),
    }
    
    // 尺寸样式
    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4",
      lg: "h-12 px-6 text-lg",
      icon: "h-10 w-10 p-0",
    }
    
    // 非 primary/danger 的默认高度
    const sizeHeights = {
      sm: "py-1.5",
      md: "py-2",
      lg: "py-3",
      icon: "",
    }
    
    const variantStyles = variants[variant]
    const needsCustomHeight = variant === 'ghost' || variant === 'link'
    const sizeStyles = needsCustomHeight 
      ? cn("text-sm", size !== 'icon' && sizeHeights[size])
      : sizes[size]
    
    return (
      <button
        className={cn(baseStyles, variantStyles, sizeStyles, className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin -ml-1 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
