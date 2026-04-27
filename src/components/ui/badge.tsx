import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'accent' | 'info' | 'success' | 'warning' | 'error' | 'purple' | 'default'
  size?: 'sm' | 'md'
  interactive?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className = '', 
    variant = 'default',
    size = 'md',
    interactive = false,
    children,
    ...props 
  }, ref) => {
    
    const variants = {
      accent: cn(
        "bg-accent/15 border-accent/30 text-accent",
        interactive && "hover:bg-accent/25 hover:border-accent/50"
      ),
      info: cn(
        "bg-info/15 border-info/30 text-info",
        interactive && "hover:bg-info/25 hover:border-info/50"
      ),
      success: cn(
        "bg-success/15 border-success/30 text-success",
        interactive && "hover:bg-success/25 hover:border-success/50"
      ),
      warning: cn(
        "bg-warning/15 border-warning/30 text-warning",
        interactive && "hover:bg-warning/25 hover:border-warning/50"
      ),
      error: cn(
        "bg-error/15 border-error/30 text-error",
        interactive && "hover:bg-error/25 hover:border-error/50"
      ),
      purple: cn(
        "bg-purple-500/15 border-purple-500/30 text-purple-400",
        interactive && "hover:bg-purple-500/25 hover:border-purple-500/50"
      ),
      default: cn(
        "bg-bg-elevated border-border text-text-secondary",
        interactive && "hover:border-accent/50 hover:text-text-primary"
      ),
    }
    
    const sizes = {
      sm: "px-2.5 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
    }
    
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium border",
          "transition-all duration-200 ease-out",
          interactive && "cursor-pointer hover:-translate-y-0.5",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = "Badge"

export { Badge }
