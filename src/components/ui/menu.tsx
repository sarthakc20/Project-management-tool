import type { ComponentProps, ReactNode } from 'react'
import { DropdownMenu as M, Popover as P } from 'radix-ui'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Menu = M.Root
export const MenuTrigger = M.Trigger
export const MenuGroup = M.Group
export const MenuSub = M.Sub

const panel =
  'animate-pop-in z-[60] min-w-[180px] overflow-hidden rounded-lg border border-border bg-surface p-1 text-[13px] text-foreground shadow-md'

export function MenuContent({ className, align = 'start', sideOffset = 4, ...props }: ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content align={align} sideOffset={sideOffset} className={cn(panel, 'scrollbar-thin max-h-[70vh] overflow-y-auto', className)} {...props} />
    </M.Portal>
  )
}

const item =
  'relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground'

export function MenuItem({ className, destructive, ...props }: ComponentProps<typeof M.Item> & { destructive?: boolean }) {
  return <M.Item className={cn(item, destructive && 'text-tone-red-fg [&_svg]:text-tone-red-fg', className)} {...props} />
}

export function MenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof M.CheckboxItem>) {
  return (
    <M.CheckboxItem className={cn(item, 'pl-7', className)} {...props}>
      <M.ItemIndicator className="absolute left-2 inline-flex">
        <Check className="size-3.5" />
      </M.ItemIndicator>
      {children}
    </M.CheckboxItem>
  )
}

export function MenuRadioGroup(props: ComponentProps<typeof M.RadioGroup>) {
  return <M.RadioGroup {...props} />
}

export function MenuRadioItem({ className, children, ...props }: ComponentProps<typeof M.RadioItem>) {
  return (
    <M.RadioItem className={cn(item, 'pl-7', className)} {...props}>
      <M.ItemIndicator className="absolute left-2 inline-flex">
        <Check className="size-3.5" />
      </M.ItemIndicator>
      {children}
    </M.RadioItem>
  )
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof M.Label>) {
  return <M.Label className={cn('px-2 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase', className)} {...props} />
}

export function MenuSeparator({ className }: { className?: string }) {
  return <M.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} />
}

export function MenuSubTrigger({ className, children, ...props }: ComponentProps<typeof M.SubTrigger>) {
  return (
    <M.SubTrigger className={cn(item, 'data-[state=open]:bg-accent', className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </M.SubTrigger>
  )
}

export function MenuSubContent({ className, ...props }: ComponentProps<typeof M.SubContent>) {
  return (
    <M.Portal>
      <M.SubContent className={cn(panel, className)} {...props} />
    </M.Portal>
  )
}

export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export const PopoverClose = P.Close
export const PopoverAnchor = P.Anchor

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 4,
  children,
  ...props
}: ComponentProps<typeof P.Content> & { children: ReactNode }) {
  return (
    <P.Portal>
      <P.Content align={align} sideOffset={sideOffset} className={cn(panel, 'p-0', className)} {...props}>
        {children}
      </P.Content>
    </P.Portal>
  )
}
