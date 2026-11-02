import type { CustomFieldDefinition, ProjectTemplate } from '@/types'

/**
 * Department-specific fields layered on top of the shared project model.
 * TODO(NOTION-MIGRATION): Generate definitions from Notion database schemas for
 * properties that do not map to a core field.
 */
export const seedCustomFields: CustomFieldDefinition[] = [
  { id: 'cf_source_theme', key: 'source_theme', label: 'Source theme', kind: 'text', appliesTo: ['theme_migration'], description: 'Theme being migrated from' },
  { id: 'cf_release_branch', key: 'release_branch', label: 'Release branch', kind: 'text', appliesTo: ['development', 'theme_migration', 'bug_fix'] },
  { id: 'cf_figma_file', key: 'figma_file', label: 'Figma file', kind: 'url', appliesTo: ['design'] },
  { id: 'cf_test_platform', key: 'test_platform', label: 'Experiment platform', kind: 'select', options: ['Shoplift', 'Intelligems', 'Convert', 'VWO', 'To be decided'], appliesTo: ['ab_testing'] },
  { id: 'cf_target_metric', key: 'target_metric', label: 'Target metric', kind: 'text', appliesTo: ['cro', 'ab_testing'] },
  { id: 'cf_bug_source', key: 'bug_source', label: 'Bug source', kind: 'select', options: ['Client report', 'QI', 'Monitoring', 'Internal'], appliesTo: ['bug_fix'] },
  { id: 'cf_audit_scope', key: 'audit_scope', label: 'Audit scope', kind: 'text', appliesTo: ['quality_inspection', 'account_management'] },
]

/** TODO(BACKEND): Templates should be versioned so edits don't silently change existing projects. */
export const seedTemplates: ProjectTemplate[] = [
  {
    id: 'tpl_development', name: 'Development project', type: 'development', defaultPriority: 'medium',
    description: 'Feature build with dev tasks, buffer and QI.', bufferRatio: 0.2, qiRatio: 0.15,
    customFieldIds: ['cf_release_branch'],
    defaultTasks: [
      { title: 'Technical scoping', type: 'development', estimatedHours: 1 },
      { title: 'Build', type: 'development' },
      { title: 'Buffer', type: 'buffer' },
      { title: 'Quality Inspection', type: 'quality_inspection' },
    ],
  },
  {
    id: 'tpl_theme_migration', name: 'Theme migration phase', type: 'theme_migration', defaultPriority: 'medium',
    description: 'One migration phase: page/section rebuilds plus buffer and QI, mirroring the existing Notion card.', bufferRatio: 0.25, qiRatio: 0.25,
    customFieldIds: ['cf_source_theme', 'cf_release_branch'],
    defaultTasks: [
      { title: 'Page / section rebuild', type: 'development' },
      { title: 'Buffer', type: 'buffer' },
      { title: 'Quality Inspection', type: 'quality_inspection' },
    ],
  },
  {
    id: 'tpl_bug_fix', name: 'Bug fix', type: 'bug_fix', defaultPriority: 'high',
    description: 'Investigate, fix and verify a reported issue.', bufferRatio: 0.25, qiRatio: 0.25,
    customFieldIds: ['cf_bug_source', 'cf_release_branch'],
    defaultTasks: [
      { title: 'Reproduce & investigate', type: 'bug', estimatedHours: 1 },
      { title: 'Fix', type: 'bug' },
      { title: 'Quality Inspection', type: 'quality_inspection', estimatedHours: 0.5 },
    ],
  },
  {
    id: 'tpl_design', name: 'Design project', type: 'design', defaultPriority: 'medium',
    description: 'Wireframes, hi-fi designs, client review and handoff.', bufferRatio: 0.15, qiRatio: 0,
    customFieldIds: ['cf_figma_file'],
    defaultTasks: [
      { title: 'Wireframes', type: 'design' },
      { title: 'High-fidelity designs', type: 'design' },
      { title: 'Client review', type: 'account_management', estimatedHours: 1 },
      { title: 'Design handoff', type: 'design', estimatedHours: 1 },
    ],
  },
  {
    id: 'tpl_account_management', name: 'Account management', type: 'account_management', defaultPriority: 'medium',
    description: 'Onboarding, audits and recurring client operations.', bufferRatio: 0, qiRatio: 0,
    customFieldIds: ['cf_audit_scope'],
    defaultTasks: [
      { title: 'Kickoff call', type: 'account_management', estimatedHours: 1 },
      { title: 'Access checklist', type: 'account_management', estimatedHours: 0.5 },
    ],
  },
  {
    id: 'tpl_quality_inspection', name: 'Quality inspection', type: 'quality_inspection', defaultPriority: 'medium',
    description: 'Standalone QA engagement with test plan and execution.', bufferRatio: 0, qiRatio: 1,
    customFieldIds: ['cf_audit_scope'],
    defaultTasks: [
      { title: 'Test plan', type: 'quality_inspection', estimatedHours: 1 },
      { title: 'Execute test plan', type: 'quality_inspection' },
      { title: 'Report & retest', type: 'quality_inspection' },
    ],
  },
  {
    id: 'tpl_cro', name: 'CRO audit', type: 'cro', defaultPriority: 'medium',
    description: 'Research, analysis and prioritised recommendations.', bufferRatio: 0, qiRatio: 0,
    customFieldIds: ['cf_target_metric'],
    defaultTasks: [
      { title: 'Heatmap & recording review', type: 'cro' },
      { title: 'Funnel analysis', type: 'cro' },
      { title: 'Recommendations deck', type: 'cro' },
    ],
  },
  {
    id: 'tpl_ab_testing', name: 'A/B test', type: 'ab_testing', defaultPriority: 'medium',
    description: 'Build a variant, configure the experiment, monitor and report.', bufferRatio: 0.15, qiRatio: 0.3,
    customFieldIds: ['cf_test_platform', 'cf_target_metric'],
    defaultTasks: [
      { title: 'Build variant', type: 'development' },
      { title: 'Configure experiment & verify tracking', type: 'ab_test' },
      { title: 'Results readout', type: 'ab_test' },
    ],
  },
  {
    id: 'tpl_general', name: 'General project', type: 'general', defaultPriority: 'medium',
    description: 'Blank project with no default tasks.', bufferRatio: 0, qiRatio: 0, customFieldIds: [], defaultTasks: [],
  },
]
