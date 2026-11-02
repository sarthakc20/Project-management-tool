import { useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/common/confirm'

/**
 * Dialog shell for create/edit forms: submit on Enter, and an unsaved-changes confirmation
 * when the user tries to dismiss a dirty form.
 */
export function FormDialog({
  open,
  onClose,
  title,
  description,
  dirty,
  onSubmit,
  submitLabel,
  size = 'lg',
  children,
  footerStart,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  dirty: boolean
  onSubmit: () => void
  submitLabel: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  footerStart?: ReactNode
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const requestClose = () => (dirty ? setConfirmDiscard(true) : onClose())
  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && requestClose()}>
        <DialogContent title={title} description={description} size={size}>
          <form
            noValidate
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              onSubmit()
            }}
          >
            <DialogBody>{children}</DialogBody>
            <DialogFooter>
              <div className="mr-auto text-xs text-muted-foreground">{footerStart}</div>
              <Button variant="ghost" onClick={requestClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard unsaved changes?"
        description="You have changes in this form that haven't been saved."
        confirmLabel="Discard"
        destructive
        onConfirm={onClose}
      />
    </>
  )
}

export function FormSection({ title, children, description }: { title: string; children: ReactNode; description?: string }) {
  return (
    <fieldset className="border-t border-border pt-4 first:border-t-0 first:pt-0 [&+&]:mt-5">
      <legend className="float-left mb-3 w-full">
        <span className="text-xs font-semibold tracking-wide text-foreground uppercase">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </legend>
      <div className="clear-both grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}
