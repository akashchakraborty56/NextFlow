# NextFlow — AI Workflow Builder

A pixel-perfect clone of Krea.ai's workflow builder, focused on LLM-powered visual workflows. Build, execute, and manage LLM-based workflows with a visual node editor.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Graph | React Flow |
| Styling | Tailwind CSS |
| State | Zustand |
| Validation | Zod |
| Auth | Clerk |
| DB | PostgreSQL (Neon) |
| ORM | Prisma |
| Tasks | Trigger.dev |
| Uploads | Transloadit |
| Media | FFmpeg |
| LLM | Google Gemini |
| Icons | Lucide React |

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
DIRECT_URL=postgresql://user:password@host/db?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Trigger.dev
TRIGGER_PROJECT_REF=proj_...
TRIGGER_SECRET_KEY=tr_dev_...

# Google Gemini
GEMINI_API_KEY=AIza...

# Transloadit
TRANSLOADIT_AUTH_KEY=...
TRANSLOADIT_AUTH_SECRET=...
TRANSLOADIT_TEMPLATE_IMAGE=...
TRANSLOADIT_TEMPLATE_VIDEO=...
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Seed the sample workflow template**
   ```bash
   npm run db:seed
   ```

4. **Run Trigger.dev dev server** (in a separate terminal)
   ```bash
   npx trigger.dev@latest dev
   ```

5. **Run the Next.js dev server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Node Types

| Node | Function |
|------|----------|
| Text | Static text input |
| Upload Image | Upload via Transloadit |
| Upload Video | Upload via Transloadit |
| LLM Node | Run Google Gemini |
| Crop Image | FFmpeg crop (percentage-based) |
| Extract Frame | FFmpeg frame extraction |

## Execution Model

- Each node execution runs as a **Trigger.dev task**
- Independent branches execute in **parallel**
- Nodes wait only for their **dependencies**
- Workflows must be a **Directed Acyclic Graph (DAG)**
- Supports full, partial, and single-node execution modes

## Sample Workflow: Product Marketing Kit Generator

A pre-built template demonstrating:
- **Branch A**: Upload Image → Crop Image + Text Nodes → LLM #1 (product description)
- **Branch B**: Upload Video → Extract Frame (50%)
- **Convergence**: LLM #2 combines Branch A output + Branch B frame → marketing post

## Features

- Drag & drop node editor (React Flow)
- Dot-grid canvas with zoom, pan, MiniMap
- Animated edges with flowing indicators
- Type-safe connections with validation
- Undo/Redo with keyboard shortcuts
- Execution history with node-level details
- Export/Import workflow JSON
- Pulsating execution UI feedback
- Responsive layout (collapsible sidebars)

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/workflows` | GET/POST | List / Create workflows |
| `/api/workflows?template=true` | GET | List templates |
| `/api/workflows/[id]` | GET/PUT/DELETE | Workflow CRUD |
| `/api/workflows/[id]/execute` | POST | Trigger execution |
| `/api/workflows/[id]/executions` | GET | List execution history |
| `/api/executions/[id]` | GET | Execution details |
| `/api/transloadit/params` | POST | Get upload signature |

## Deployment

1. Deploy to Vercel
2. Add all environment variables in Vercel dashboard
3. Set up Trigger.dev production environment
4. Run `npx prisma migrate deploy` for production database
5. Seed templates with `npm run db:seed`

## License

Private — assignment submission.

