# LearnSync

> Social learning platform for groups to learn from YouTube playlists, Udemy courses, and custom videos together.

## Features

✨ **Auto-Tracking** - Automatically tracks watch progress without manual marking
👥 **Squad Learning** - Learn with friends, colleagues, or entire cohorts
📊 **Analytics** - Real-time comparative analytics across squad members
🎥 **Distraction-Free Player** - Clean, focused video player interface
💬 **Social Features** - Timestamped notes, live activity feeds, assignments
🤖 **AI-Powered** - Claude-powered quiz generation and weekly digests
💰 **Flexible Pricing** - Free tier plus tiered paid plans

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime (WebSocket)
- **Auth**: Supabase Auth (email + OAuth)
- **AI**: Anthropic Claude API
- **Video**: YouTube IFrame API, HTML5 `<video>`
- **Analytics**: Recharts
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project (https://supabase.com)
- API keys for external services (Claude, OpenAI, Stripe, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/learnsync.git
   cd learnsync
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Set up Supabase**
   - Create a Supabase project
   - Run the SQL schema from `supabase/migrations/001_init.sql` in the SQL editor
   - Get your ANON_KEY and PROJECT_URL from project settings

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── app/                # Next.js App Router
│   ├── api/           # API Route Handlers
│   ├── (auth)/        # Authentication pages
│   ├── (app)/         # Protected routes
│   └── layout.tsx     # Root layout
├── components/        # React components
│   ├── ui/           # Atomic UI components
│   ├── layout/       # Layout components
│   ├── player/       # Player components
│   └── forms/        # Form components
├── lib/              # Utilities & helpers
├── types/            # TypeScript types
├── utils/            # helper functions & hooks
└── styles/           # Global styles
```

## Core Features

### 1. Auto-Tracking
Watches video events and automatically tracks progress:
- Play/pause detection
- Seek tracking
- Completion detection (80%+ watched)
- 5-second heartbeat for position sync
- Rate-limited to 1 request per 5s per user/item

### 2. Squad System
- Create squads (learning groups)
- Invite members via code or email
- Role-based permissions (learner, lead, instructor)
- Per-squad plan enforcement

### 3. Video Playback
- YouTube playlists with auto-import
- Custom URL support with HTML5 video
- Udemy course integration (Pro+ plans)
- Distraction-free interface

### 4. Real-Time Features
- Live progress updates via Supabase Realtime
- Presence indicators (who's watching what)
- Instant note syncing for squadmates
- Live activity feed

### 5. Analytics
- Member progress comparison
- Watch time statistics
- Contribution heatmaps
- Learning velocity charts
- Weekly AI-generated digests

## API Routes

### Authentication
- `POST /api/auth/callback` - Supabase OAuth callback
- `POST /api/auth/logout` - User logout

### Squads
- `POST /api/squads` - Create squad
- `POST /api/squads/[id]/invite` - Generate/refresh invite
- `POST /api/squads/[id]/join` - Join via invite code
- `GET /api/squads/[id]/analytics` - Get analytics data

### Courses & Content
- `POST /api/courses` - Add course to squad
- `POST /api/courses/[id]/import` - Import playlist
- `GET /api/courses/[id]` - Get course details

### Tracking
- `POST /api/track` - Log watch event (rate-limited)

### Notes
- `GET /api/notes/[itemId]` - Get notes for video
- `POST /api/notes` - Create note
- `PUT /api/notes/[id]` - Update note

### AI Features
- `POST /api/ai/generate-quiz` - Generate quiz from transcript
- `GET /api/ai/squad-digest/[id]` - Get weekly digest

## Database Schema

Main tables:
- `profiles` - User profiles
- `squads` - Learning groups
- `squad_members` - Squad membership & roles
- `courses` - Course/playlist metadata
- `course_items` - Individual videos/lectures
- `watch_events` - Time-series watch events
- `progress` - Materialized user progress
- `notes` - User notes with timestamps
- `assignments` - Squad assignments
- `quizzes` - AI-generated quizzes

See `supabase/migrations/001_init.sql` for full schema with RLS policies.

## Environment Variables

Required:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

See `.env.local.example` for all variables.

## Development

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Code Quality

- **TypeScript strict mode** - All files enforce strict type checking
- **Zod validation** - All API inputs validated
- **Row Level Security** - All database access controlled via RLS
- **Error boundaries** - Protected route sections
- **Loading skeletons** - No spinners, only proper skeletons
- **i18n ready** - All strings wrapped with translation function

## Deployment

### Vercel
The app is optimized for Vercel:

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Self-hosted
Works with any Node.js host (AWS, DigitalOcean, Railway, etc.).

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Pricing

| Plan | Price | Limits |
|------|-------|--------|
| Free | $0 | 1 squad, 3 members, YouTube only |
| Pro | $8/mo/user | Unlimited, all sources |
| Squad | $20/mo/squad | Squad features + AI |
| Teams | $299/mo | Everything + SSO + 50h transcription |

## Support

- 📚 Documentation: See `/SETUP_GUIDE.md`
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

## License

MIT License - see LICENSE file

## Acknowledgments

Built with:
- Next.js & React
- Supabase
- Tailwind CSS
- Recharts
- Framer Motion

---

**LearnSync** - Learn better together.
