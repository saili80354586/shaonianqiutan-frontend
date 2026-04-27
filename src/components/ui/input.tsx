import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
  label?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    type = 'text',
    error = false,
    helperText,
    label,
    icon,
    iconPosition = 'left',
    disabled,
    ...props 
  }, ref) => {
    return (
      <div className="w-full">
        {/* 标签 */}
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        
        {/* 输入框容器 */}
        <div className="relative">
          {/* 左侧图标 */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              // 基础样式
              "w-full bg-bg-secondary text-text-primary",
              "border-2 rounded-xl",
              "placeholder:text-text-muted",
              "transition-all duration-200 ease-out",
              
              // 尺寸
              "py-3",
              icon && iconPosition === 'left' ? "pl-10 pr-4" : "px-4",
              icon && iconPosition === 'right' ? "pl-4 pr-10" : "",
              
              // 状态样式
              error 
                ? "border-error focus:border-error focus:shadow-error/20" 
                : "border-border focus:border-accent focus:shadow-accent/20",
              
              // 焦点样式
              "focus:outline-none focus:ring-4",
              error 
                ? "focus:ring-error/10" 
                : "focus:ring-accent/10",
              
              // 禁用样式
              disabled && "opacity-50 cursor-not-allowed bg-bg-tertiary",
              
              // 悬停样式
              !disabled && !error && "hover:border-border-hover",
              
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          
          {/* 右侧图标 */}
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        
        {/* 辅助文本 */}
        {helperText && (
          <p className={cn(
            "mt-2 text-sm",
            error ? "text-error" : "text-text-muted"
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
