import * as React from "react"
import { cn } from "../../lib/utils"

// 主卡片组件
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    hover?: boolean
    glass?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }
>(({ className = '', hover = false, glass = false, padding = 'md', ...props }, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  if (glass) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl backdrop-blur-xl",
          "border border-white/10",
          "bg-gradient-to-b from-white/10 to-white/5",
          "transition-all duration-300 ease-out",
          hover && "hover:border-white/20 hover:shadow-xl hover:-translate-y-1",
          paddings[padding],
          className
        )}
        {...props}
      />
    )
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border",
        "bg-bg-tertiary text-text-primary",
        "transition-all duration-300 ease-out",
        hover && [
          "hover:border-accent/30",
          "hover:-translate-y-1",
          "hover:shadow-lg hover:shadow-accent/5"
        ],
        paddings[padding],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

// 卡片头部
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className = '', compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col",
      compact ? "space-y-1 p-4" : "space-y-1.5 p-6",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// 卡片标题
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-text-primary",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// 卡片描述
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-text-secondary leading-relaxed",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// 卡片内容
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className = '', compact = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(compact ? "p-4" : "p-6", className)} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

// 卡片页脚
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className = '', compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3",
      compact ? "p-4" : "p-6",
      "border-t border-border/50",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
