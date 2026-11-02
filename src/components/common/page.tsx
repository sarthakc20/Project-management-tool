import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Ecom Workspace` : 'Ecom Workspace'
  }, [title])
}

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('border-b border-border px-4 pt-5 pb-0 sm:px-6', !children && 'pb-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-4 py-5 sm:px-6', className)}>{children}</div>
}

/** Horizontal filter row placed beneath a page header. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6 border-b border-border bg-surface-2/50', className)}>{children}</div>
}
