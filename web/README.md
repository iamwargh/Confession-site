# OffChest — Anonymous Confessions Web App

A safe, anonymous confession web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL & Auth)**.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security, SSR Cookie Authentication, Google OAuth)
- **Icons**: Lucide React
- **Validation**: Zod & custom sanitizers

---

## ⚙️ Setup & Environment Configuration

### 1. Prerequisites
- Node.js 20+ installed
- A [Supabase](https://supabase.com) project
- (Optional) Google Cloud Console OAuth 2.0 Credentials (for Google login)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and set your credentials:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google OAuth (Optional / For Google Sign-In)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> **Security Note:** NEVER commit `.env.local` or any production secrets to version control. The repository's `.gitignore` automatically blocks `.env*` files.

### 4. Database Setup
1. Open your Supabase Dashboard SQL Editor.
2. Run the SQL migrations found in the `supabase/` folder:
   - `schema.sql` (Tables, profiles trigger, RLS policies)
   - `comments-schema.sql` (Comments table & counters)
   - `add_is_adult.sql` (18+ content tagging)
   - `fix-rls-policies.sql` (RLS policies check)

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Architecture Highlights

- **Server-Side Credentials**: Secret keys like `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_CLIENT_SECRET` are strictly kept server-side in Server Actions and Route Handlers.
- **Row Level Security (RLS)**: Enforced on all Supabase tables so users can only read/write authorized rows.
- **Direct Server-Side OAuth**: Token exchange is performed server-side with CSRF state and PKCE nonce validation.
- **Rate Limiting**: Built-in sliding-window rate limiting on sensitive routes (`/api/auth/login`, `/api/auth/signup`, `/api/username-check`).
- **Health Check**: Endpoint at `/api/health` reports uptime and database status without exposing internal keys or stack traces.

---

## 🚀 Deployment (Vercel)

1. Import the repository into Vercel.
2. Set the **Root Directory** to `web`.
3. Add the environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://yourdomain.com`)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Deploy!
