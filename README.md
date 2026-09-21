# AutoLyrics 🎵

Video lirik lagu otomatis. Upload audio + lirik, dapatkan video MP4 siap share.

## Tech Stack

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Database:** SQLite (development) → Neon PostgreSQL (production)
- **Auth:** Better Auth (credentials only)
- **Storage:** Cloudflare R2 (audio + video)
- **Render:** Modal (FFmpeg, Python)
- **State:** Zustand

## Features (MVP)

- ✅ Landing page (premium dark theme + glow gradient)
- ✅ Auth (register/login)
- ✅ Dashboard (points + render history)
- ✅ Create page (upload audio + lyrics + template)
- ✅ Result page (progress + download)
- ✅ Points system (10/week, reset Monday)

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation 

```bash
# Clone repository
git clone https://github.com/wirtok-id/autolyrics.git
cd autolyrics

# Install dependencies
npm install --legacy-peer-deps

# Initialize database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
autolyrics/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register
│   │   ├── (dashboard)/     # Dashboard, Create, Result
│   │   ├── (marketing)/     # Landing page
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── landing/         # Hero, Features, HowItWorks
│   │   ├── shared/          # Navbar, Footer
│   │   └── ui/              # shadcn components
│   └── lib/
│       ├── auth/            # Better Auth config
│       ├── db/              # Drizzle schema + client
│       ├── points/          # Points logic
│       ├── store/           # Zustand store
│       └── utils/           # Helpers
├── modal/
│   └── render.py            # Modal FFmpeg render function
├── drizzle/                 # Generated migrations
└── public/                  # Static assets
```

## Points System

- **Free tier:** 10 points/week
- **Friend tier:** 15 points/week
- **Family tier:** 30 points/week
- **Admin:** Unlimited points

Points reset every Monday at 00:00 WIB.

### Render Cost

- Audio < 3 minutes: 1 point
- Audio 3-5 minutes: 2 points

## Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL=file:./autolyrics.db

# Auth
AUTH_SECRET=your-secret-here

# Cloudflare R2 (production)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# Modal (production)
MODAL_ENDPOINT=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

### Frontend (Cloudflare Pages)

```bash
npm run build
# Deploy to Cloudflare Pages
```

### Modal Function

```bash
modal deploy modal/render.py
```

## Roadmap

### Phase 1 (MVP) ✅
- [x] Auth (register/login)
- [x] Landing page
- [x] Dashboard
- [x] Create page
- [x] Result page
- [x] Points system
- [ ] Modal integration
- [ ] R2 storage

### Phase 2
- [ ] Admin panel
- [ ] Render history
- [ ] Additional templates (Neon, Minimalist)

### Phase 3
- [ ] Waveform visualizer
- [ ] Animations polish
- [ ] Performance optimization

## License

MIT
