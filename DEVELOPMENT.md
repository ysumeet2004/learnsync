# LearnSync - Complete File Structure & Setup Guide

## Project Initialization Complete ✅

This document provides a complete reference of all files created and their purposes.

## Created Files Summary

### Configuration Files (11 files)
```
learnsync/
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS config with design system
├── postcss.config.js               # PostCSS configuration
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore patterns
├── .env.local.example              # Environment variables template
├── supabase/config.toml            # Supabase CLI configuration
└── middleware.ts                   # Session middleware
```

### Documentation (3 files)
```
├── README.md                       # Project overview & installation
├── SETUP_GUIDE.md                  # Detailed setup instructions
└── PROGRESS.md                     # Implementation progress tracking
```

### Database (1 file)
```
supabase/migrations/
└── 001_init.sql                    # Complete database schema with RLS
```

### Application Code (40+ files)

#### Type Definitions
```
src/types/
└── database.ts                     # Supabase database types
```

#### Libraries & Utilities
```
src/lib/
├── auth.ts                         # Auth helpers, plan checking, roles
├── middleware.ts                   # Session refresh middleware
├── supabase-server.ts              # Server-side Supabase client
├── supabase-client.ts              # Client-side Supabase client
├── validations.ts                  # Zod validation schemas
```

#### Utilities & Hooks
```
src/utils/
├── hooks.ts                        # Custom React hooks
└── store.ts                        # Zustand state stores
```

#### Styles
```
src/styles/
└── globals.css                     # Global Tailwind styles & components
```

#### UI Components
```
src/components/ui/
├── Button.tsx                      # Button component (4 variants)
├── Input.tsx                       # Input component with icon support
└── Card.tsx                        # Card & Badge components
```

#### Layout Components
```
src/components/layout/
├── AppSidebar.tsx                  # Responsive sidebar navigation
└── Header.tsx                      # Top header with notifications
```

#### Pages

**Authentication Routes**
```
src/app/(auth)/
├── login/page.tsx                  # Login page with OAuth
├── signup/page.tsx                 # Signup with username
├── auth/callback/route.ts          # OAuth callback handler
```

**Protected Routes**
```
src/app/(app)/
├── layout.tsx                      # App layout with sidebar
└── dashboard/page.tsx              # Dashboard with squad overview
```

**Root**
```
src/app/
├── layout.tsx                      # Root layout with fonts & metadata
└── page.tsx                        # Marketing landing page
```

## How to Continue Development

### 1. Install Dependencies

The npm installation had permission issues on Windows. Here's how to complete it:

**Option A: Use PowerShell (Quick Fix)**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd C:\Users\Sumeet\Desktop\tracker_study\learnsync
npm install
```

**Option B: Use Git Bash or WSL**
```bash
cd ~/Desktop/tracker_study/learnsync
npm install
```

**Option C: Manual module installation**
```powershell
npm install --legacy-peer-deps
```

### 2. Set Up Supabase

1. Create a new project at https://supabase.com
2. Copy your Project URL and Anon Key
3. In Supabase SQL Editor, run the entire contents of `supabase/migrations/001_init.sql`
4. Go to Authentication > Providers and set up Google OAuth:
   - Set Redirect URL to: `http://localhost:3000/auth/callback`
5. Copy credentials to `.env.local`

### 3. Configure Environment Variables

Create `.env.local`:
```bash
cp .env.local.example .env.local
```

Fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`

## Component Usage Examples

### Button Component
```tsx
import Button from '@/components/ui/Button';

// Primary button
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

// Loading state
<Button isLoading={loading}>Loading...</Button>

// Secondary/Ghost/Danger variants
<Button variant="secondary" />
<Button variant="ghost" />
<Button variant="danger" />
```

### Input Component
```tsx
import Input from '@/components/ui/Input';

<Input
  type="email"
  placeholder="Email"
  icon={<Mail size={18} />}
  error={errors.email}
  helperText="We'll never share your email"
/>
```

### Card Component
```tsx
import { Card, CardLg, Badge } from '@/components/ui/Card';

<Card className="p-4">
  <h3>Title</h3>
  <p>Content</p>
  <Badge variant="success">Success</Badge>
</Card>
```

### Custom Hooks
```tsx
// Authentication
const { user, session, loading } = useAuth();
const { isAuthenticated, loading } = useIsAuthenticated();
const { user, loading } = useRequireAuth(); // Redirects if not auth

// UI
const { width, height } = useWindowSize();
const isMobile = useIsMobile();
const debouncedValue = useDebounce(value, 300);
const { execute, status, value, error } = useAsync(asyncFn);
```

### Zustand Stores
```tsx
import { useAppStore, useUISelection } from '@/utils/store';

// Global app state
const user = useAppStore((s) => s.currentUser);
const setSquad = useAppStore((s) => s.setCurrentSquad);

// Notifications
const addNotification = useAppStore((s) => s.addNotification);
addNotification('Success!', 'success', 3000);

// UI State
const selectedSquadId = useUISelection((s) => s.selectedSquadId);
```

## Next Phase: Squad System

The squad system is next. Here's what needs to be built:

### 1. Squad Creation
```
POST /api/squads
- Input: { name: string, description?: string }
- Output: Squad with invite code
- Auth: Login required
```

### 2. Squad Page
```
GET /squad/[id]
- Shows squad details
- Lists members
- Shows courses
- Team activity feed
```

### 3. Invite System
```
GET /invite/[code]
- Landing page for invite link
- Shows squad preview
- Join button
- Sign up redirect if not authenticated
```

### 4. Settings Page
```
GET /squad/[id]/settings
- Squad name & description edit
- Member management
- Role assignment
- Remove member
- Leave squad
```

## Code Quality Checklist

Before committing code:
- [ ] TypeScript strict mode (no `any` types)
- [ ] Zod validation for all API inputs
- [ ] Error boundaries on new pages
- [ ] Loading skeletons (not spinners)
- [ ] Responsive design tested
- [ ] Accessibility checked
- [ ] i18n strings ready
- [ ] Comments for complex logic

## Key Implementation Details

### Database Access Pattern
```typescript
// Server components
const supabase = await createClient();
const { data, error } = await supabase.from('table').select();

// Client components
const supabase = createClient();
useEffect(() => {
  const channel = supabase.channel(`squad:${id}:progress`);
  channel.on('postgres_changes', ...).subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```

### API Route Pattern
```typescript
// /app/api/endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { endpointSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validated = endpointSchema.parse(body);
    
    const { data, error } = await supabase.from('table').insert(...);
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Message' },
      { status: 400 }
    );
  }
}
```

## File Organization Tips

- **Keep components small**: Max 200-300 lines
- **Use composition**: Build complex UIs from simple components
- **One component per file**: Easier to find and refactor
- **Shared components**: In `/components/ui` or `/components/common`
- **Page-specific components**: In the page folder
- **Types in separate files**: Import from `/types`
- **Utilities in `/lib`**: Business logic
- **Constants in `.ts` files**: Don't import from config files

## Performance Optimization

- Image optimization: Next.js `<Image>` component
- Code splitting: Automatic with App Router
- CSS: Tailwind purges unused styles in production
- Database: Indexes created on all foreign keys
- RLS: Prevents N+1 queries
- Caching: React Query for server state
- Rate limiting: Upstash Redis for API routes

## Deployment Checklist

- [ ] Update `.env.local` with production secrets
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure Supabase production project
- [ ] Add redirect URIs to Supabase Auth
- [ ] Set up Stripe production keys
- [ ] Configure email verification (Resend)
- [ ] Enable HTTPS in production
- [ ] Set up log monitoring
- [ ] Test OAuth flow in production
- [ ] Verify database backups are enabled

## Troubleshooting

### npm install fails on Windows
- Use Git Bash or WSL instead of PowerShell
- Or run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Supabase connection issues
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check ANON_KEY is valid
- Confirm RLS policies aren't blocking operations
- Check service role key for admin operations

### Tailwind styles not applying
- Make sure `globals.css` is imported in root layout
- Restart dev server after config changes
- Check content paths in `tailwind.config.ts`

### Authentication not working
- Confirm OAuth callback URL in Supabase matches
- Check that `middleware.ts` is in src root
- Verify session is being created on signup
- Check profile creation trigger in database

## Resources

- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind: https://tailwindcss.com
- Zustand: https://github.com/pmndrs/zustand
- React Query: https://tanstack.com/query
- Zod: https://zod.dev

---

**This is the foundation. Build on it carefully and test thoroughly!**
