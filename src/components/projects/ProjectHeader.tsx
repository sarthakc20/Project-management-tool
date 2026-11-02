import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, ArrowRightLeft, Copy, Ellipsis, ExternalLink, Link2, Pencil, Trash2 } from 'lucide-react'
import type { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge, ProgressBar, ProgressRing } from '@/components/ui/display'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger } from '@/components/ui/menu'
import { Tooltip } from '@/components/ui/tooltip'
import { ProjectStatusPicker, PriorityPicker, DatePicker } from '@/components/common/pickers'
import { AvatarStack, ClientChip } from '@/components/common/people'
import { ProjectTypeLabel, ScheduleBadge, StatusIcon } from '@/components/common/badges'
import { ConfirmDialog } from '@/components/common/confirm'
import { archiveProject, deleteProject, duplicateProject, updateProject } from '@/services/api'
import { useUI } from '@/services/ui'
import { useCan } from '@/hooks/useData'
import { projectDueDate, type ProjectStats } from '@/lib/calculations'
import { DEFAULT_PROJECT_STATUSES, isProjectClosed, projectStatusDef } from '@/lib/workflow'
import { paths } from '@/lib/routes'
import { formatPercent, pluralize } from '@/lib/utils'

export function ProjectHeader({ project, stats }: { project: Project; stats: ProjectStats }) {
  const navigate = useNavigate()
  const openEdit = useUI((s) => s.openCreateProject)
  const canEdit = useCan('project.edit')
  const canStatus = useCan('project.changeStatus')
  const canCreate = useCan('project.create')
  const canArchive = useCan('project.archive')
  const canDelete = useCan('project.delete')
  const canDates = useCan('project.editDates')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const due = projectDueDate(project)
  const team = [project.ownerId, project.accountManagerId, project.leadId, ...project.developerIds, ...project.designerIds, project.qiOwnerId, project.croOwnerId, project.abOwnerId].filter(Boolean) as string[]

  const setStatus = (status: Project['status']) => {
    void updateProject(project.id, { status })
    toast.success(`Status → ${projectStatusDef(status).label}`)
  }

  const copyLink = async () => {
    const url = `${window.location.origin}${paths.project(project.id)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Project link copied')
    } catch {
      toast.error('Clipboard unavailable', { description: url })
    }
  }

  return (
    <div className="border-b border-border px-4 pt-4 sm:px-6">
      {project.archived && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-tone-amber-dot/40 bg-tone-amber-bg px-3 py-1.5 text-[13px] text-tone-amber-fg">
          <Archive className="size-3.5" /> This project is archived and hidden from active lists.
          {canArchive.allowed && (
            <Button size="xs" variant="ghost" className="ml-auto" onClick={() => { void archiveProject(project.id, false); toast.success('Project restored') }}>
              <ArchiveRestore /> Restore
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">{project.key}</span>
            <ProjectTypeLabel type={project.type} className="text-xs" />
            {project.notionSourceId && (
              <Tooltip content="Record mirrors a Notion page (sample migration link)">
                <Badge tone="gray">Migrated from Notion</Badge>
              </Tooltip>
            )}
          </div>
          <h1 className="text-xl leading-tight font-semibold tracking-tight text-balance">{project.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canEdit.allowed && (
            <Button onClick={() => openEdit({ editId: project.id })}>
              <Pencil /> Edit
            </Button>
          )}
          <Menu>
            <MenuTrigger asChild>
              <Button size="icon" aria-label="More project actions">
                <Ellipsis />
              </Button>
            </MenuTrigger>
            <MenuContent align="end" className="w-56">
              <MenuItem disabled={!canEdit.allowed} onSelect={() => openEdit({ editId: project.id })}>
                <Pencil /> Edit project
              </MenuItem>
              <MenuSub>
                <MenuSubTrigger disabled={!canStatus.allowed}>
                  <ArrowRightLeft /> Change status
                </MenuSubTrigger>
                <MenuSubContent>
                  {DEFAULT_PROJECT_STATUSES.map((s) => (
                    <MenuItem key={s.id} onSelect={() => setStatus(s.id)}>
                      <StatusIcon status={s.id} kind="project" /> {s.label}
                    </MenuItem>
                  ))}
                </MenuSubContent>
              </MenuSub>
              <MenuItem
                disabled={!canCreate.allowed}
                onSelect={async () => {
                  const copy = await duplicateProject(project.id)
                  toast.success(`Duplicated as ${copy.key}`, { description: 'Tasks were copied and reset to Backlog.' })
                  navigate(paths.project(copy.id))
                }}
              >
                <Copy /> Duplicate project
              </MenuItem>
              <MenuItem onSelect={() => void copyLink()}>
                <Link2 /> Copy project link
              </MenuItem>
              {project.clientPortalUrl && (
                <MenuItem onSelect={() => window.open(project.clientPortalUrl, '_blank', 'noopener')}>
                  <ExternalLink /> Open client portal
                </MenuItem>
              )}
              <MenuSeparator />
              <MenuItem disabled={!canArchive.allowed} onSelect={() => (project.archived ? (void archiveProject(project.id, false), toast.success('Project restored')) : setConfirmArchive(true))}>
                {project.archived ? <ArchiveRestore /> : <Archive />} {project.archived ? 'Restore project' : 'Archive project'}
              </MenuItem>
              <MenuItem destructive disabled={!canDelete.allowed} onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Delete project
                {!canDelete.allowed && <span className="ml-auto text-[11px] text-muted-foreground">Admin only</span>}
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>

      <dl className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-3 pb-4 text-[13px]">
        <HeaderProp label="Status">
          <ProjectStatusPicker value={project.status} onChange={setStatus} disabled={!canStatus.allowed} disabledReason={canStatus.reason} />
        </HeaderProp>
        <HeaderProp label="Client">
          <ClientChip clientId={project.clientId} />
        </HeaderProp>
        <HeaderProp label="Late?">
          <ScheduleBadge health={stats.schedule} />
        </HeaderProp>
        <HeaderProp label="% Pushed to QI">
          <span className="flex items-center gap-2">
            <span className="tabular">{formatPercent(project.percentPushedToQi ?? stats.derivedPushedToQi, '0%')}</span>
            <ProgressBar value={project.percentPushedToQi ?? stats.derivedPushedToQi ?? 0} className="w-20" />
          </span>
        </HeaderProp>
        <HeaderProp label="Client portal project">
          {project.clientPortalUrl ? (
            <a href={project.clientPortalUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-[200px] items-center gap-1 text-primary hover:underline">
              <ExternalLink className="size-3.5 shrink-0" />
              <span className="truncate">{project.clientPortalUrl.replace(/^https?:\/\//, '')}</span>
            </a>
          ) : (
            <span className="text-subtle-foreground">Empty</span>
          )}
        </HeaderProp>
        <HeaderProp label="Due">
          <DatePicker
            value={due}
            closed={isProjectClosed(project.status)}
            showRelative
            onChange={(d) => {
              // Changing the due date after creation records it as the revised date, preserving the original.
              void updateProject(project.id, project.originalDueDate ? { revisedDueDate: d } : { originalDueDate: d })
              toast.success(project.originalDueDate ? 'Revised due date updated' : 'Due date set')
            }}
            disabled={!canDates.allowed}
            disabledReason={canDates.reason}
          />
        </HeaderProp>
        <HeaderProp label="Priority">
          <PriorityPicker value={project.priority} onChange={(p) => void updateProject(project.id, { priority: p })} disabled={!canEdit.allowed} disabledReason={canEdit.reason} />
        </HeaderProp>
        <HeaderProp label="Team">
          <AvatarStack userIds={team} max={5} />
        </HeaderProp>
        <div className="ml-auto flex items-center gap-2 self-center">
          <dt className="sr-only">Progress</dt>
          <dd className="flex items-center gap-2">
            <ProgressRing value={stats.percentComplete} size={34} />
            <span className="text-xs leading-tight text-muted-foreground">
              {stats.doneCount}/{pluralize(stats.taskCount, 'task')}
              <br />
              complete
            </span>
          </dd>
        </div>
      </dl>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Archive ${project.key}?`}
        description="Archived projects are hidden from lists, dashboards and calendars but keep all tasks and history. You can restore it at any time."
        confirmLabel="Archive"
        onConfirm={() => {
          void archiveProject(project.id, true)
          toast.success('Project archived')
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${project.key}?`}
        destructive
        confirmLabel="Delete permanently"
        description={
          <>
            This removes the project together with its {pluralize(stats.taskCount + stats.subtaskCount, 'task')}, comments, links, QI records and bugs from this prototype session. Linked experiments are kept but unlinked. Consider archiving instead.
          </>
        }
        onConfirm={() => {
          void deleteProject(project.id)
          toast.success(`${project.key} deleted`)
          navigate(paths.client(project.clientId))
        }}
      />
    </div>
  )
}

function HeaderProp({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="flex min-h-7 items-center">{children}</dd>
    </div>
  )
}
