import * as React from "react"
import { cn } from "../../lib/utils"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  onClose?: (id: string) => void
  duration?: number
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ id, title, description, variant = 'default', onClose, duration = 5000 }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(id), 300)
      }, duration)
      
      return () => clearTimeout(timer)
    }, [id, duration, onClose])
    
    const icons = {
      default: Info,
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info
    }
    
    const styles = {
      default: 'border-border bg-bg-card text-text-primary',
      success: 'border-success/30 bg-success/10 text-success',
      error: 'border-error/30 bg-error/10 text-error',
      warning: 'border-warning/30 bg-warning/10 text-warning',
      info: 'border-info/30 bg-info/10 text-info'
    }
    
    const Icon = icons[variant]
    
    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300",
          styles[variant],
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-sm">{title}</h4>
            {description && (
              <p className="text-sm opacity-90 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose?.(id), 300)
            }}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }
)
Toast.displayName = "Toast"

// Toast Container
interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, 'onClose'> & { id: string }>
  onClose: (id: string) => void
}

const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}

export { Toast, ToastContainer }