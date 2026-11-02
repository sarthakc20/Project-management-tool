import type { Database } from '@/types'
import { DEFAULT_PROJECT_STATUSES, DEFAULT_TASK_STATUSES } from '@/lib/workflow'
import { seedClients } from './clients'
import { seedActivity, seedAttachments, seedComments, seedNotifications } from './collaboration'
import { seedABTests, seedCRO } from './growth'
import { seedTeams, seedUsers } from './people'
import { seedProjects } from './projects'
import { seedBoardProjects } from './boardProjects'
import { seedBugs, seedQIRecords, seedQITimeEntries } from './quality'
import { seedTasks } from './tasks'
import { seedCustomFields, seedTemplates } from './templates'

/**
 * Builds a fresh copy of the mock database. Called once at startup and again by
 * "Reset demo data" in Settings.
 * TODO(BACKEND): Replace mock data with the production API and persistent database.
 */
export function createSeedDatabase(): Database {
  return structuredClone({
    users: seedUsers,
    teams: seedTeams,
    clients: seedClients,
    projects: [...seedProjects, ...seedBoardProjects],
    tasks: seedTasks,
    comments: seedComments,
    activity: seedActivity,
    notifications: seedNotifications,
    attachments: seedAttachments,
    templates: seedTemplates,
    customFields: seedCustomFields,
    qiRecords: seedQIRecords,
    qiTimeEntries: seedQITimeEntries,
    bugs: seedBugs,
    croExperiments: seedCRO,
    abTests: seedABTests,
    projectStatuses: DEFAULT_PROJECT_STATUSES.map(({ id, label, category, tone, description }) => ({ id, label, category, tone, description })),
    taskStatuses: DEFAULT_TASK_STATUSES.map(({ id, label, category, tone, description }) => ({ id, label, category, tone, description })),
  })
}
