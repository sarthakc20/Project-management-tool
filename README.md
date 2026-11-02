# Ecom Workspace

Interactive UI/UX prototype of an internal project management app for a Shopify Plus agency —
clients, project cards, tasks & subtasks, QI, CRO and A/B testing — built to replace the Notion
project-card workflow. Frontend only, with realistic local mock data.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Radix primitives (shadcn-style) ·
React Router · Zustand · date-fns · Lucide · Sonner

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + production build
npm run lint
```

- Reviewer walkthrough and structure: [docs/README.md](docs/README.md)
- Data model & Notion field mapping: [docs/data-model.md](docs/data-model.md)
- Future integrations (`TODO(...)` tags): [docs/integration-roadmap.md](docs/integration-roadmap.md)

> Prototype data lives in memory and resets on reload. No Notion credentials, API keys or
> production data are required or used.
