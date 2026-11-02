import type { ReactNode } from 'react'
import { Dialog as D } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

export function DialogContent({
  children,
  className,
  title,
  description,
  size = 'md',
  onInteractOutside,
}: {
  children: ReactNode
  className?: string
  title: ReactNode
  description?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onInteractOutside?: (e: Event) => void
}) {
  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <D.Portal>
      <D.Overlay className="animate-fade-in fixed inset-0 z-50 bg-overlay" />
      <D.Content
        onInteractOutside={onInteractOutside}
        className={cn(
          'animate-pop-in fixed top-[8vh] left-1/2 z-50 flex max-h-[84vh] w-[calc(100vw-2rem)] -translate-x-1/2 flex-col rounded-xl border border-border bg-surface shadow-lg focus:outline-none',
          width,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <D.Title className="text-[15px] font-semibold">{title}</D.Title>
            {description ? (
              <D.Description className="mt-0.5 text-[13px] text-muted-foreground">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">Dialog</D.Description>
            )}
          </div>
          <D.Close className="-mt-1 -mr-2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  )
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('scrollbar-thin flex-1 overflow-y-auto px-5 py-4', className)}>{children}</div>
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3 rounded-b-xl', className)}>
      {children}
    </div>
  )
}

/** Right-hand side panel built on the dialog primitive (focus trap, Esc to close). */
export function SheetContent({
  children,
  title,
  className,
  onInteractOutside,
}: {
  children: ReactNode
  title: string
  className?: string
  onInteractOutside?: (e: Event) => void
}) {
  return (
    <D.Portal>
      <D.Overlay className="animate-fade-in fixed inset-0 z-50 bg-overlay" />
      <D.Content
        onInteractOutside={onInteractOutside}
        className={cn(
          'animate-slide-in-right fixed inset-y-0 right-0 z-50 flex w-full max-w-[680px] flex-col border-l border-border bg-surface shadow-lg focus:outline-none',
          className,
        )}
      >
        <D.Title className="sr-only">{title}</D.Title>
        <D.Description className="sr-only">Details panel</D.Description>
        {children}
      </D.Content>
    </D.Portal>
  )
}
