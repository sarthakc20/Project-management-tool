import type { Client } from '@/types'
import { timestampOffset } from '@/lib/dates'

/**
 * Sample client records for the prototype — not live company data. Domains use the reserved
 * `.example` TLD so nothing resolves to a real store.
 * TODO(NOTION-MIGRATION): Import clients from the Notion "Clients" database and map the
 * account-manager person property to `accountManagerId`.
 * TODO(CLIENT-PORTAL): `clientPortalUrl` will point at the external client portal once the
 * portal's project-sharing API and access model are confirmed.
 */
export const seedClients: Client[] = [
  {
    id: 'c_shepherds', name: 'Shepherds Fashion', code: 'SF', industry: 'Fashion & Apparel', status: 'active',
    accountManagerId: 'u_rufus', teamMemberIds: ['u_rufus', 'u_alex', 'u_sarthak', 'u_jordan', 'u_priya'],
    website: 'https://shepherdsfashion.example', shopifyDomain: 'shepherds-fashion.myshopify.com',
    clientPortalUrl: 'https://portal.ecomworkspace.example/c/shepherds-fashion', slackChannel: '#client-shepherds',
    plan: 'Shopify Plus', timezone: 'Europe/London',
    primaryContact: { name: 'Hannah Clarke', email: 'hannah@shepherdsfashion.example', role: 'Head of Ecommerce' },
    notes: 'Multi-phase theme migration from the legacy theme to the new release theme. Weekly status call on Tuesdays.',
    links: [
      { id: 'cl_sf_1', label: 'Storefront', url: 'https://shepherdsfashion.example' },
      { id: 'cl_sf_2', label: 'Migration roadmap (client portal)', url: 'https://portal.ecomworkspace.example/c/shepherds-fashion/roadmap' },
    ],
    avatarHue: 215, createdAt: timestampOffset(-420),
  },
  {
    id: 'c_wolfpak', name: 'WOLFPak', code: 'WP', industry: 'Outdoor & Gear', status: 'active',
    accountManagerId: 'u_rufus', teamMemberIds: ['u_rufus', 'u_alex', 'u_sarthak', 'u_priya', 'u_jordan', 'u_chris'],
    website: 'https://wolfpak.example', shopifyDomain: 'wolfpak-gear.myshopify.com',
    clientPortalUrl: 'https://portal.ecomworkspace.example/c/wolfpak', slackChannel: '#client-wolfpak',
    plan: 'Shopify Plus', timezone: 'America/Denver',
    primaryContact: { name: 'Marcus Hale', email: 'marcus@wolfpak.example', role: 'Ecommerce Manager' },
    notes: 'BFCM is the priority this quarter. Client prefers async Loom updates over calls.',
    links: [{ id: 'cl_wp_1', label: 'Storefront', url: 'https://wolfpak.example' }],
    avatarHue: 20, createdAt: timestampOffset(-300),
  },
  {
    id: 'c_wonderfold', name: 'WonderFold', code: 'WF', industry: 'Baby & Family', status: 'active',
    accountManagerId: 'u_rufus', teamMemberIds: ['u_rufus', 'u_priya', 'u_sarthak', 'u_chris'],
    website: 'https://wonderfold.example', shopifyDomain: 'wonderfold-wagon.myshopify.com',
    clientPortalUrl: 'https://portal.ecomworkspace.example/c/wonderfold', slackChannel: '#client-wonderfold',
    plan: 'Shopify Plus', timezone: 'America/Los_Angeles',
    primaryContact: { name: 'Elena Brooks', email: 'elena@wonderfold.example', role: 'Director of Marketing' },
    notes: 'Holiday homepage refresh plus ongoing PDP experimentation programme.',
    links: [{ id: 'cl_wf_1', label: 'Storefront', url: 'https://wonderfold.example' }],
    avatarHue: 150, createdAt: timestampOffset(-210),
  },
  {
    id: 'c_madebymary', name: 'Made by Mary', code: 'MM', industry: 'Jewelry & Personalised Gifts', status: 'active',
    accountManagerId: 'u_rufus', teamMemberIds: ['u_rufus', 'u_sarthak', 'u_jordan', 'u_maya'],
    website: 'https://madebymary.example', shopifyDomain: 'made-by-mary.myshopify.com',
    clientPortalUrl: 'https://portal.ecomworkspace.example/c/made-by-mary', slackChannel: '#client-madebymary',
    plan: 'Shopify Plus', timezone: 'America/Chicago',
    primaryContact: { name: 'Mary Collins', email: 'mary@madebymary.example', role: 'Founder' },
    notes: 'Personalisation is core to the brand. Any change to the engraving flow needs founder sign-off.',
    links: [{ id: 'cl_mm_1', label: 'Storefront', url: 'https://madebymary.example' }],
    avatarHue: 340, createdAt: timestampOffset(-160),
  },
  {
    id: 'c_petplanet', name: 'Pet Planet', code: 'PP', industry: 'Pet Supplies', status: 'onboarding',
    accountManagerId: 'u_taylor', teamMemberIds: ['u_taylor', 'u_alex', 'u_jordan'],
    website: 'https://petplanet.example', shopifyDomain: 'pet-planet-store.myshopify.com',
    plan: 'Shopify Advanced', timezone: 'Australia/Sydney',
    primaryContact: { name: 'Sam Nguyen', email: 'sam@petplanet.example', role: 'COO' },
    notes: 'New client. Collaborator access requested; awaiting approval from their IT team.',
    links: [],
    avatarHue: 100, createdAt: timestampOffset(-12),
  },
  {
    id: 'c_mbg', name: 'Mind Body Green', code: 'MBG', industry: 'Wellness & Supplements', status: 'active',
    accountManagerId: 'u_rufus', teamMemberIds: ['u_rufus', 'u_alex', 'u_sarthak', 'u_priya', 'u_jordan'],
    website: 'https://mindbodygreen.example', shopifyDomain: 'mindbodygreen-shop.myshopify.com',
    clientPortalUrl: 'https://portal.ecomworkspace.example/c/mind-body-green', slackChannel: '#client-mindbodygreen',
    plan: 'Shopify Plus', timezone: 'America/New_York',
    primaryContact: { name: 'Nora Ellis', email: 'nora@mindbodygreen.example', role: 'Head of Digital Commerce' },
    notes: 'Phase 1 migration delivered. Collection filters (benefit / ingredient) on hold pending app evaluation. Supplement PDP copy changes need regulatory review before publishing.',
    links: [{ id: 'cl_mbg_1', label: 'Storefront', url: 'https://mindbodygreen.example' }],
    avatarHue: 140, createdAt: timestampOffset(-380),
  },
]
