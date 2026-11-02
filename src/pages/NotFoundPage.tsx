import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useBreadcrumbs } from '@/services/ui'
import { useDocumentTitle } from '@/components/common/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/display'

export function NotFoundPage() {
  useDocumentTitle('Not found')
  useBreadcrumbs([{ label: 'Not found' }])
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist in this prototype."
      action={<Button asChild variant="primary"><Link to="/">Back to overview</Link></Button>}
      className="py-24"
    />
  )
}
