# NextFlow 🌌

**NextFlow** is a production-grade, pixel-perfect clone of Krea.ai’s workflow builder. It allows users to design and execute complex, LLM-powered visual workflows through a sophisticated Directed Acyclic Graph (DAG) interface.

Built for performance and scalability, NextFlow handles everything from simple text processing to complex media transformations (image cropping, video frame extraction) in parallel using background task orchestration.

## ✨ Key Features

*   **Pixel-Perfect Canvas**: High-fidelity UI matching Krea.ai with smooth pan/zoom, dot-grid background, and a dynamic MiniMap.
*   **Advanced DAG Orchestration**: Workflows execute in parallel branches using Trigger.dev, ensuring maximum efficiency and zero blocking.
*   **Media Processing Suite**: Native FFmpeg integration for precise image cropping and frame extraction.
*   **LLM Intelligence**: Powered by Google Gemini 2.0/2.5 for state-of-the-art content generation.
*   **Real-time Execution UI**: Pulsating node glows, animated flowing edges, and a detailed live execution history panel.
*   **Enterprise Auth**: Secure authentication and user isolation powered by Clerk.

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16/19 (App Router) |
| **Canvas Engine** | React Flow |
| **Background Tasks** | Trigger.dev v3 |
| **AI Engine** | Google Gemini (GenAI SDK) |
| **Media Engine** | Native FFmpeg |
| **Database** | PostgreSQL (Neon Serverless) |
| **ORM** | Prisma |
| **Storage/Uploads** | Transloadit |
| **State Management** | Zustand |

## 📐 Node System (6 Core Nodes)

1.  **Text**: Static data entry for system prompts and user messages.
2.  **Upload Image**: Secure image ingestion via Transloadit.
3.  **Upload Video**: High-capacity video ingestion for media workflows.
4.  **Crop Image**: Percentage-based visual cropping powered by FFmpeg.
5.  **Extract Frame**: Precise frame extraction from videos at specific timestamps.
6.  **LLM Node**: Sophisticated prompt engineering and content generation.

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js 20+
*   A Neon PostgreSQL database
*   API Keys for Clerk, Trigger.dev, Gemini, and Transloadit.

### 2. Installation
```bash
npm install
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Seed workflow templates
npm run db:seed
```

### 4. Local Development
Start the background worker and the dev server in separate terminals:

**Terminal 1 (Background Tasks):**
```bash
npx trigger.dev@latest dev
```

**Terminal 2 (Web App):**
```bash
npm run dev
```

Visit `http://localhost:3000` to start building.

## 📡 Deployment

NextFlow is optimized for deployment on Vercel and Trigger.dev Cloud.

1.  **Frontend**: Deploy to Vercel and ensure all environment variables from `.env.example` are configured.
2.  **Background Tasks**: Run `npx trigger.dev@latest deploy` to sync the worker logic.
3.  **Database**: Use the pooled connection URL (`-pooler`) in production for stable serverless execution.

## 📄 License
Private — Assignment Submission for NextFlow.
