# LearnSync - Setup & Architecture Guide

## Project Overview

LearnSync is a social learning platform that enables friend groups and bootcamp cohorts to learn from YouTube playlists, Udemy courses, and custom video URLs together. It features auto-tracked progress, distraction-free video player, real-time analytics, and AI-powered learning tools.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (create at supabase.com)
- Anthropic API key (for Claude API)
- OpenAI API key (for Whisper transcription)
- Stripe account (for billing)
- Resend account (for email)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.local.example .env.local

# Fill in all required environment variables
# NEXT_PUBLIC_SUPABASE_URL - from Supabase project settings
# NEXT_PUBLIC_SUPABASE_ANON_KEY - from Supabase project settings
# SUPABASE_SERVICE_ROLE_KEY - from Supabase project settings
# ANTHROPIC_API_KEY - from Anthropic dashboard
# OPENAI_API_KEY - from OpenAI dashboard
# STRIPE_SECRET_KEY - from Stripe dashboard
# etc.
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Copy the SQL schema from `supabase/migrations/001_init.sql`
3. In Supabase SQL editor, paste and run the schema SQL
4. Set up Google OAuth in Supabase > Authentication > Providers
5. Configure email templates if needed

### 3. Install & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### 4. Create First Account

- Sign up with email/password or Google OAuth
- Complete profile setup (username, display name)
- Create or join a squad

## Project Structure

```
learnsync/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with fonts
│   │   ├── page.tsx            # Landing page
│   │   ├── api/                # API Route Handlers
│   │   │   ├── auth/           # Auth endpoints
│   │   │   ├── squads/         # Squad management
│   │   │   ├── courses/        # Course management
│   │   │   ├── track/          # Watch event tracking
│   │   │   ├── notes/          # Notes endpoints
│   │   │   ├── ai/             # AI features (quiz, digest)
│   │   │   ├── webhooks/       # External webhooks
│   │   │   └── analytics/      # Analytics endpoints
│   │   ├── (auth)/             # Auth pages group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── invite/[code]/
│   │   ├── (app)/              # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── squad/[id]/
│   │   │   ├── account/
│   │   │   └── admin/
│   │   └── error.tsx           # Error boundary
│   │
│   ├── components/             # Reusable components
│   │   ├── layout/            # Layout components
│   │   ├── player/            # Video player components
│   │   ├── notes/             # Notes panel components
│   │   ├── analytics/         # Chart components
│   │   ├── forms/             # Form components
│   │   └── ui/                # Atomic UI components
│   │
│   ├── lib/                    # Utilities & helpers
│   │   ├── supabase-server.ts
│   │   ├── supabase-client.ts
│   │   ├── auth.ts            # Auth helpers
│   │   ├── youtube-tracker.ts # YouTube tracking
│   │   ├── html5-tracker.ts   # HTML5 video tracking
│   │   └── transcript.ts      # Transcript fetching
│   │
│   ├── styles/                # Global styles
│   │   └── globals.css
│   │
│   ├── types/                 # TypeScript types
│   │   └── database.ts        # Supabase types
│   │
│   └── utils/                 # Utility functions
│       └── hooks.ts           # Custom React hooks
│
├── supabase/
│   ├── migrations/            # Database schema
│   │   └── 001_init.sql
│   └── config.toml           # Supabase CLI config
│
├── public/                    # Static assets
├── .env.local.example        # Environment template
├── package.json              # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind config
├── next.config.js           # Next.js config
└── README.md
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - Client state management
- **React Query** - Server state & caching
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - Serverless API
- **Supabase** - PostgreSQL database + auth
- **Supabase Realtime** - WebSocket subscriptions
- **Upstash Redis** - Rate limiting & caching
- **Inngest** - Background jobs & scheduling

### External Services
- **Anthropic Claude** - AI quiz & digest generation
- **OpenAI Whisper** - Video transcription
- **Stripe** - Payment processing
- **Resend** - Email sending
- **YouTube API** - Playlist import

## Key Features

### 1. Auto-Tracking System

The application automatically tracks video watch progress without manual marking:

- **YouTube videos**: Uses YouTube IFrame API to track play/pause/seek events
- **Custom URLs**: Uses HTML5 `<video>` element event listeners
- **Rate limiting**: Maximum 1 request per 5 seconds per user/item via Upstash Redis
- **Progress calculation**: Video marked complete when 80%+ watched or ended

### 2. Real-Time Updates

Uses Supabase Realtime for instant updates across squad members:

- **Presence**: Who's currently watching what
- **Progress**: Live completion status updates
- **Notes**: New notes appear instantly for squadmates
- **Assignments**: Status changes broadcast to squad

### 3. Squad System

Group-based learning with flexible roles:

- **Learner**: Default role, can watch and take notes
- **Lead**: Can manage squad, add courses, create assignments
- **Instructor**: Full platform privileges within squad

Users can have different roles in different squads.

### 4. Analytics Dashboard

Comprehensive progress visualization:

- **Member comparison**: Side-by-side progress bars
- **Watch time heatmap**: GitHub-style contribution graph
- **Leaderboard**: Ranked by streak, watch time, completion %
- **AI Coach**: Weekly squad digest via Claude

### 5. Plan System

Four-tier pricing model:

| Plan | Price | Limits |
|------|-------|--------|
| Free | $0 | 1 squad, 3 members, 1 course, YouTube only |
| Pro | $8/mo | Unlimited, all sources, full analytics |
| Squad | $20/mo | Pro + AI features + 5h Whisper |
| Teams | $299/mo | Everything + SSO + 50h Whisper |

## Build Sequence

This project was built following this order to avoid dependency issues:

1. ✅ Project setup & Next.js initialization
2. ⏳ Supabase setup & schema creation
3. Authentication pages (login/signup)
4. Profile creation & session middleware
5. Dashboard skeleton & navigation
6. Squad creation & invite system
7. Course import (YouTube playlists)
8. Player page & auto-tracking system
9. Progress API & realtime sync
10. Squad analytics dashboard
11. Notes system with realtime
12. Assignment board (Kanban)
13. AI quiz generation & digest
14. Stripe billing integration
15. Admin panel & super admin features

## API Endpoints

### Authentication
- `POST /api/auth/callback` - OAuth callback
- `POST /api/auth/logout` - Logout

### Squads
- `POST /api/squads` - Create squad
- `POST /api/squads/[id]/invite` - Generate invite
- `POST /api/squads/[id]/join` - Join via code
- `GET /api/squads/[id]/analytics` - Get analytics data

### Courses
- `POST /api/courses` - Add course
- `POST /api/courses/[id]/import` - Import playlist items
- `POST /api/courses/[id]/items` - Add course item

### Tracking
- `POST /api/track` - Log watch event

### Notes
- `GET /api/notes/[itemId]` - Get notes
- `POST /api/notes` - Create note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

### AI
- `POST /api/ai/generate-quiz` - Generate quiz from transcript
- `GET /api/ai/squad-digest/[id]` - Get weekly digest

### Billing
- `GET /api/stripe/checkout` - Create checkout session
- `POST /api/webhooks/stripe` - Stripe webhooks

## Development Guidelines

### TypeScript Strict Mode
- All files use `strict: true`
- No `any` types allowed
- All API routes validated with Zod

### Code Quality
- Lighthouse score > 85 on main pages
- Loading skeletons (not spinners) for data fetching
- Error boundaries on major sections
- All strings i18n-ready with `t()` wrapper

### Database Queries
- Use typed Supabase client
- Always use Row Level Security
- Never bypass RLS except in service role functions

### Realtime Subscriptions
- Unsubscribe on component unmount
- Use custom hooks to manage subscriptions
- Handle reconnection gracefully

## Common Tasks

### Add a New Course Source

1. Update database schema for new source type
2. Create import handler (e.g., `fetchUdemyCourse()`)
3. Add to courses API endpoint
4. Create refetch trigger

### Create a New Page

1. Create folder under `src/app/(app)/`
2. Add `page.tsx` and `layout.tsx`
3. Set up server session check
4. Add navigation link
5. Test with public/protected routes

### Add AI Feature

1. Create API route under `src/app/api/ai/`
2. Use Anthropic SDK with proper prompt engineering
3. Cache result in Redis
4. Add UI component to display results
5. Gate behind plan check

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys
# Set environment variables in Vercel dashboard
```

## Troubleshooting

### 401 Unauthorized on API Routes
- Check session is created with `createServerClient`
- Verify `auth.uid()` is returning correct user ID
- Check RLS policies allow the operation

### Realtime Not Updating
- Verify Supabase Realtime is enabled
- Check channel name matches exactly
- Subscribe must be in useEffect with cleanup
- Check browser console for errors

### Stripe Webhook Failing
- Verify webhook secret in `.env.local`
- Check endpoint is publicly accessible
- Review Stripe dashboard for failed events

### Rate Limiting Issues
- Check Upstash Redis credentials
- Verify rate limit window (5s default)
- Monitor Redis usage in Upstash dashboard

## Testing

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Build
npm run build

# Run tests (add when needed)
npm test
```

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs
- Zustand: https://github.com/pmndrs/zustand
- React Query: https://tanstack.com/query/latest

---

**LearnSync** - Built with care for social learning.
