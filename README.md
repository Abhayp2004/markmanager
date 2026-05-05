# MarkManager

MarkManager is a multi-platform bookmark manager that lets you collect and organize links from X (Twitter), Reddit, Medium, YouTube, and any other site in one searchable inbox.

## 🚀 Features
- Multi-platform capture for X/Twitter, Reddit, Medium, YouTube, and any URL
- Automatic platform detection with rich previews (tweets, thumbnails, metadata)
- Organize with folders, tags, and priority pins
- Fast search and filtering across saved content
- AI-assisted summaries and auto-tagging for tweets, articles, and videos, plus YouTube highlight extraction
- Bulk import multiple URLs at once
- Secure authentication and database-backed storage with Supabase

## 🛠 Tech Stack
- React + Vite
- TypeScript
- Tailwind CSS
- Supabase (Auth + Database + Edge Functions)
- Vercel (Deployment)

## 🧑‍💻 Local Development

### Prerequisites
- Node.js 18+ or Bun
- Supabase account

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <project-name>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     - `VITE_SUPABASE_URL` - Your Supabase project URL
     - `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key
     - `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID

4. Start the development server:
```bash
npm run dev
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Deploy!

The app is configured with proper SPA routing and caching headers via `vercel.json`.
