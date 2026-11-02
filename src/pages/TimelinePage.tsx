import { useMemo, useState } from 'react'
import type { ProjectType } from '@/types'
import { useBreadcrumbs } from '@/services/ui'
import { useAllProjects, useClients } from '@/hooks/useData'
import { PageBody, PageHeader, useDocumentTitle } from '@/components/common/page'
import { Select } from '@/components/ui/form'
import { Timeline } from '@/components/calendar/Timeline'
import { isProjectClosed, PROJECT_TYPES } from '@/lib/workflow'

export function TimelinePage() {
  useDocumentTitle('Timeline')
  useBreadcrumbs([{ label: 'Timeline / Roadmap' }])
  const projects = useAllProjects()
  const clients = useClients()
  const [clientId, setClientId] = useState('')
  const [type, setType] = useState<ProjectType | ''>('')
  const [scope, setScope] = useState<'open' | 'all'>('all')
  const filtered = useMemo(
    () => projects.filter((p) => !p.archived && (!clientId || p.clientId === clientId) && (!type || p.type === type) && (scope === 'all' || !isProjectClosed(p.status))),
    [projects, clientId, type, scope],
  )
  return (
    <div>
      <PageHeader title="Timeline / Roadmap" description="Project start → due dates with tasks nested underneath. Expand a project to see its tasks." />
      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-40">
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select aria-label="Project type" value={type} onChange={(e) => setType(e.target.value as ProjectType | '')} className="w-44">
            <option value="">All types</option>
            {PROJECT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </Select>
          <Select aria-label="Scope" value={scope} onChange={(e) => setScope(e.target.value as 'open' | 'all')} className="w-40">
            <option value="all">Include completed</option>
            <option value="open">Open projects only</option>
          </Select>
        </div>
        <Timeline projects={filtered} />
      </PageBody>
    </div>
  )
}
