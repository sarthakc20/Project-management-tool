import type { Database, RecordRef } from '@/types'

export const paths = {
  dashboard: () => '/',
  client: (id: string, tab?: string) => `/clients/${id}${tab ? `?tab=${tab}` : ''}`,
  project: (id: string, tab?: string) => `/projects/${id}${tab ? `?tab=${tab}` : ''}`,
  task: (projectId: string, taskId: string) => `/projects/${projectId}?tab=tasks&task=${taskId}`,
  bug: (id: string) => `/bugs?bug=${id}`,
  experiment: (id: string) => `/experiments?exp=${id}`,
}

/** Resolves a notification / search reference to an in-app URL. */
export function refPath(ref: RecordRef, data: Pick<Database, 'tasks'>) {
  switch (ref.kind) {
    case 'project':
      return paths.project(ref.id)
    case 'client':
      return paths.client(ref.id)
    case 'task': {
      const t = data.tasks.find((x) => x.id === ref.id)
      return t ? paths.task(t.projectId, t.id) : '/tasks/mine'
    }
    case 'bug':
      return paths.bug(ref.id)
    case 'experiment':
      return paths.experiment(ref.id)
  }
}
