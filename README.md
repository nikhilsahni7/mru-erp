# ERP Monorepo

A modern, scalable ERP system for schools/universities with separate dashboards for Admin, Teacher, and Student, plus a marketing/landing site.

## Tech Stack
- **Monorepo:** Turborepo
- **Package Manager:** Bun
- **Frontend:** Next.js, Tailwind CSS, shadcn/ui
- **Backend:** Express.js/tRPC/NestJS
- **Database:** PostgreSQL (Prisma)
- **Cache:** Redis
- **Real-time:** Socket.io
- **Shared:** UI components, DB, Socket, Types

## Folder Structure
```
erp-monorepo/
├── apps/
│   ├── web/         # Landing/marketing
│   ├── admin/       # Admin dashboard
│   ├── teacher/     # Teacher dashboard
│   ├── student/     # Student dashboard
│   └── backend/     # API server
├── packages/
│   ├── db/          # Prisma, Redis config
│   ├── socket/      # Socket.io shared
│   └── ui/          # Shared UI components
├── .env.example
├── package.json
├── turbo.json
├── tsconfig.json
└── README.md
```

## Getting Started
1. **Install dependencies:**
   ```bash
   bun install
   ```
2. **Run all apps in dev mode:**
   ```bash
   bunx turbo run dev
   ```
3. **Build all apps:**
   ```bash
   bunx turbo run build
   ```

## Using Shared Packages
- Import Prisma/Redis from `db` package
- Import Socket.io from `socket` package
- Import UI components from `ui` package

## Future
- Add mobile app
- Add AI features
