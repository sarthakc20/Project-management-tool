import type { Team, User } from '@/types'

/**
 * Fictional team members for the prototype.
 * TODO(AUTH): Replace with users provisioned from company SSO (e.g. Google Workspace / Okta SCIM).
 */
export const seedUsers: User[] = [
  {
    id: 'u_taylor', name: 'Taylor Reed', email: 'taylor.reed@ecomworkspace.example', role: 'admin',
    title: 'Operations Director', department: 'operations', teamId: 'team_ops', avatarHue: 200,
    weeklyCapacityHours: 20, timezone: 'America/New_York', active: true,
  },
  {
    id: 'u_rufus', name: 'Rufus', email: 'rufus@ecomworkspace.example', role: 'account_manager',
    title: 'Senior Account Manager', department: 'account_management', teamId: 'team_am', avatarHue: 28,
    weeklyCapacityHours: 40, timezone: 'Europe/London', active: true,
  },
  {
    id: 'u_sarthak', name: 'Sarthak Chatterjee', email: 'sarthak.c@ecomworkspace.example', role: 'developer',
    title: 'Shopify Developer', department: 'development', teamId: 'team_dev', avatarHue: 255,
    weeklyCapacityHours: 40, timezone: 'Asia/Kolkata', active: true,
  },
  {
    id: 'u_alex', name: 'Alex Morgan', email: 'alex.morgan@ecomworkspace.example', role: 'lead',
    title: 'Lead Developer', department: 'development', teamId: 'team_dev', avatarHue: 160,
    weeklyCapacityHours: 32, timezone: 'Europe/London', active: true,
  },
  {
    id: 'u_priya', name: 'Priya Sharma', email: 'priya.sharma@ecomworkspace.example', role: 'designer',
    title: 'Product Designer', department: 'design', teamId: 'team_design', avatarHue: 330,
    weeklyCapacityHours: 40, timezone: 'Asia/Kolkata', active: true,
  },
  {
    id: 'u_jordan', name: 'Jordan Lee', email: 'jordan.lee@ecomworkspace.example', role: 'qi',
    title: 'QI Engineer', department: 'quality_inspection', teamId: 'team_qi', avatarHue: 85,
    weeklyCapacityHours: 40, timezone: 'America/Chicago', active: true,
  },
  {
    id: 'u_maya', name: 'Maya Patel', email: 'maya.patel@ecomworkspace.example', role: 'cro',
    title: 'CRO Specialist', department: 'cro', teamId: 'team_growth', avatarHue: 300,
    weeklyCapacityHours: 40, timezone: 'America/Los_Angeles', active: true,
  },
  {
    id: 'u_chris', name: 'Chris Wilson', email: 'chris.wilson@ecomworkspace.example', role: 'ab_testing',
    title: 'A/B Testing Specialist', department: 'ab_testing', teamId: 'team_growth', avatarHue: 45,
    weeklyCapacityHours: 40, timezone: 'America/New_York', active: true,
  },
]

export const seedTeams: Team[] = [
  { id: 'team_dev', name: 'Development', department: 'development', leadId: 'u_alex', memberIds: ['u_alex', 'u_sarthak'] },
  { id: 'team_design', name: 'Design', department: 'design', leadId: 'u_priya', memberIds: ['u_priya'] },
  { id: 'team_am', name: 'Account Management', department: 'account_management', leadId: 'u_rufus', memberIds: ['u_rufus'] },
  { id: 'team_qi', name: 'Quality Inspection', department: 'quality_inspection', leadId: 'u_jordan', memberIds: ['u_jordan'] },
  { id: 'team_growth', name: 'Growth (CRO & Experiments)', department: 'cro', leadId: 'u_maya', memberIds: ['u_maya', 'u_chris'] },
  { id: 'team_ops', name: 'Operations', department: 'operations', leadId: 'u_taylor', memberIds: ['u_taylor'] },
]
