# Deployment Guide (Live URL + Shared Editing)

You can absolutely host this as a live page. The key detail is **how data is stored**:

- Current app storage is `localStorage` in each user's browser.
- That means GitHub Pages alone gives a public URL, but **does not share edits between users**.

If you want everyone with the URL to edit the same data, add a backend database.

---

## Option A: GitHub Pages (fastest publish)

Best for:
- Live URL quickly
- Read/write per-person local data (not shared globally)

### Steps

1. Push this repo to GitHub.
2. In GitHub repo settings: **Pages**.
3. Source: **Deploy from branch**.
4. Branch: `main` (or your default branch), folder `/ (root)`.
5. Save and wait for publish.

You will get a URL like:

`https://<your-username>.github.io/<repo-name>/`

### Important limitation

Users can all edit, but each person edits their own browser's local data only.

---

## Option B: GitHub Pages + Supabase (recommended shared editing)

Best for:
- Live URL
- Shared event/game data for all users
- Very little backend code

### Architecture

- Frontend hosted on GitHub Pages
- Supabase Postgres as shared database
- Frontend reads/writes event + game rows through Supabase JS client

### Minimal schema

- `events(id uuid pk, name text, created_at timestamptz)`
- `games(id uuid pk, event_id uuid, game_no int, created_at timestamptz)`
- `game_rows(id uuid pk, game_id uuid, player text, kills int, assists int, deaths int, placing text, points int, time_obj_sec int, captures int)`

### Security

- For private access, add auth (email or magic links).
- For open editing by link, use Row Level Security carefully (or shared anon key + broad policy if you accept open edits).

---

## Option C: Railway (frontend + API/backend)

Best for:
- Full control
- Server-side validation
- Better long-term multi-user app

### Suggested stack

- Frontend: static files or React/Vite
- Backend: Node/Express (or Fastify)
- DB: Postgres (Railway managed)

### Flow

1. Deploy repo on Railway.
2. Add Postgres plugin.
3. Create API endpoints (`/events`, `/games`, `/rows`).
4. Change frontend to call API instead of `localStorage`.

---

## Recommendation

For your goal (“anyone with URL can edit same page/data”), use:

1. **GitHub Pages** for hosting the UI
2. **Supabase** for shared storage

This is usually the fastest path with good reliability.

---

## Migration notes from current app

Current app functions to migrate from local-only to shared:

- `loadState`
- `saveState`
- `createEvent`
- `submitGame`
- `editGame`
- `deleteGame`
- `deleteEvent`
- `importData` / `exportData` (optional after backend)

Replace local state reads/writes with async DB calls, then re-render UI from fetched data.
