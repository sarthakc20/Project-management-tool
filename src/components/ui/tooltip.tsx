import type { ReactNode } from 'react'
import { Tooltip as T } from 'radix-ui'
import { cn } from '@/lib/utils'

export const TooltipProvider = T.Provider

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  if (!content) return <>{children}</>
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className={cn(
            'animate-fade-in z-[80] max-w-xs rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md',
            className,
          )}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}
