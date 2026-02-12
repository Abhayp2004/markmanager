# X Bookmark Organizer

A web application to organize X (Twitter) bookmarks using folders and tags — features not available on X natively.

## 🚀 Features
- Save X bookmarks
- Organize with folders and tags
- Fast search and filtering
- Secure authentication
- Database-backed storage
- Built-in tweet preview

## 🛠 Tech Stack
- React + Vite
- TypeScript
- Tailwind CSS
- Supabase (Auth + Database)
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
