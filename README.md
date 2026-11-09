# OffChest — Anonymous Confessions Platform

A safe, modern, and anonymous confession sharing web platform.

---

## 📁 Repository Structure

```text
├── web/              # Primary Next.js 16 full-stack web application
│   ├── src/          # Frontend & Backend API Routes (App Router)
│   ├── supabase/     # PostgreSQL database schemas & RLS policies
│   └── .env.example  # Web application environment variables template
├── .env.example      # Root environment template
└── .gitignore        # Root gitignore protecting secret files & artifacts
```

---

## 🚀 Quick Start

The main application resides in the `web/` directory.

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

See [web/README.md](file:///c:/Users/Dell/Documents/dev/web%20dev/confession%20site/web/README.md) for full configuration, database schema setup, and deployment documentation.

