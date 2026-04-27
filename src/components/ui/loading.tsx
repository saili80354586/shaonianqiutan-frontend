import * as React from "react"
import { cn } from "../../lib/utils"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg' | 'xl'
  text?: string
  fullscreen?: boolean
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className = '', size = 'default', text, fullscreen = false, ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4 border-2',
      default: 'h-8 w-8 border-2',
      lg: 'h-12 w-12 border-3',
      xl: 'h-16 w-16 border-4'
    }
    
    const spinner = (
      <div
        className={cn(
          "animate-spin rounded-full border-accent border-t-transparent",
          sizes[size]
        )}
      />
    )
    
    if (fullscreen) {
      return (
        <div
          ref={ref}
          className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary/90 backdrop-blur-sm",
            className
          )}
          {...props}
        >
          {spinner}
          {text && (
            <p className="mt-4 text-text-secondary text-sm">{text}</p>
          )}
        </div>
      )
    }
    
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center", className)}
        {...props}
      >
        {spinner}
        {text && (
          <p className="mt-3 text-text-secondary text-sm">{text}</p>
        )}
      </div>
    )
  }
)
Loading.displayName = "Loading"

// Skeleton 骨架屏
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', rows = 1, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-tertiary rounded animate-pulse"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    )
  }
)
Skeleton.displayName = "Skeleton"

// Card Skeleton
const CardSkeleton = () => (
  <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-tertiary animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-tertiary rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-tertiary rounded w-1/4 animate-pulse" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-tertiary rounded animate-pulse" />
      <div className="h-3 bg-tertiary rounded w-5/6 animate-pulse" />
    </div>
  </div>
)

// Page Header Skeleton
const PageHeaderSkeleton = ({ actionCount = 1 }: { actionCount?: number }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-xl bg-tertiary animate-pulse" />
      <div className="space-y-2">
        <div className="h-8 bg-tertiary rounded w-40 animate-pulse" />
        <div className="h-4 bg-tertiary rounded w-56 animate-pulse" />
      </div>
    </div>
    <div className="flex items-center gap-3">
      {Array.from({ length: actionCount }).map((_, i) => (
        <div key={i} className="h-10 bg-tertiary rounded-xl w-28 animate-pulse" />
      ))}
    </div>
  </div>
)

// Stats Grid Skeleton
interface StatsGridSkeletonProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
}

const StatsGridSkeleton = ({ count = 4, columns = 4 }: StatsGridSkeletonProps) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }
  return (
    <div className={cn("grid gap-4 sm:gap-5 mb-6 sm:mb-8", gridClass[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-tertiary animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-tertiary rounded w-16 animate-pulse" />
              <div className="h-7 bg-tertiary rounded w-24 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 h-3 bg-tertiary rounded w-20 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// Table Skeleton
interface TableSkeletonProps {
  rows?: number
  cols?: number
}

const TableSkeleton = ({ rows = 5, cols = 6 }: TableSkeletonProps) => (
  <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-800/50">
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-6 py-4 text-left">
              <div className="h-4 bg-tertiary rounded w-20 animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-tertiary animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-tertiary rounded w-24 animate-pulse" />
                  <div className="h-3 bg-tertiary rounded w-16 animate-pulse" />
                </div>
              </div>
            </td>
            {Array.from({ length: cols - 2 }).map((_, c) => (
              <td key={c} className="px-6 py-4">
                <div className="h-4 bg-tertiary rounded w-16 animate-pulse" />
              </td>
            ))}
            <td className="px-6 py-4">
              <div className="flex items-center justify-end gap-2">
                <div className="h-8 w-8 rounded-lg bg-tertiary animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-tertiary animate-pulse" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// Card Grid Skeleton
interface CardGridSkeletonProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
}

const CardGridSkeleton = ({ count = 4, columns = 2 }: CardGridSkeletonProps) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }
  return (
    <div className={cn("grid gap-4", gridClass[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-tertiary animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 bg-tertiary rounded w-32 animate-pulse" />
                <div className="h-4 bg-tertiary rounded w-20 animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-16 rounded-lg bg-tertiary animate-pulse" />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <div className="space-y-1">
              <div className="h-3 bg-tertiary rounded w-12 animate-pulse" />
              <div className="h-5 bg-tertiary rounded w-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-tertiary rounded w-12 animate-pulse" />
              <div className="h-5 bg-tertiary rounded w-8 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Chart Skeleton
const ChartSkeleton = ({ height = 256 }: { height?: number }) => (
  <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
    <div className="h-6 bg-tertiary rounded w-24 animate-pulse mb-6" />
    <div className="bg-tertiary rounded-xl animate-pulse" style={{ height }} />
  </div>
)

// Filter Bar Skeleton
const FilterBarSkeleton = ({ filters = 3 }: { filters?: number }) => (
  <div className="flex flex-wrap items-center gap-4 mb-6">
    <div className="h-11 bg-tertiary rounded-xl flex-1 max-w-md animate-pulse" />
    {Array.from({ length: filters }).map((_, i) => (
      <div key={i} className="h-11 w-32 bg-tertiary rounded-xl animate-pulse" />
    ))}
  </div>
)

// List Item Skeleton
interface ListItemSkeletonProps {
  count?: number
}

const ListItemSkeleton = ({ count = 3 }: ListItemSkeletonProps) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-tertiary animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-tertiary rounded w-40 animate-pulse" />
              <div className="h-4 bg-tertiary rounded w-56 animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-tertiary animate-pulse" />
        </div>
        <div className="h-2 bg-tertiary rounded-full w-full animate-pulse" />
      </div>
    ))}
  </div>
)

export {
  Loading,
  Skeleton,
  CardSkeleton,
  PageHeaderSkeleton,
  StatsGridSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  ChartSkeleton,
  FilterBarSkeleton,
  ListItemSkeleton,
}