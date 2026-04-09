# Halo Night Stat Tracker

A lightweight, client-side web app for tracking Halo custom night/player stats across multiple events and games.

## Features

- Create, rename, switch, and delete events.
- Enter game stats for each player and submit as `Game #N`.
- Points are auto-allocated from placing:
  - 1st = 9, 2nd = 7, 3rd = 5, 4th = 3, 5th-8th = 1
- Edit old submitted games by loading them back into the entry table.
- Delete games and automatically recalculate cumulative stats.
- Results table with:
  - total kills / assists / deaths
  - K/D and KDA (assists weighted at 0.3)
  - captures
  - objective time (seconds)
  - placing summary (1st to 8th)
  - total points
- Export/import full dataset as JSON.
- Export the active event to an Excel-compatible `.xls` file with:
  - `Game Data` sheet (all submitted rows)
  - `Results` sheet (cumulative totals)
- Automatic browser persistence using `localStorage`.

## Run locally

Because this is a static app, you can:

1. Open `index.html` directly in your browser, or
2. Serve via any static file server.

## Deploy live

See `DEPLOYMENT.md` for GitHub Pages and Railway options, plus how to enable shared multi-user editing with a backend database.

## Data model

Data is stored in local storage key:

- `halo-night-stat-tracker-v1`

Top-level shape:

```json
{
  "currentEventId": "...",
  "events": [
    {
      "id": "...",
      "name": "Event Name",
      "games": [
        {
          "id": "...",
          "gameNo": 1,
          "dateISO": "2026-04-09T00:00:00.000Z",
          "rows": [
            {
              "player": "Jacob",
              "kills": 10,
              "assists": 5,
              "deaths": 4,
              "placing": "2nd",
              "points": 15,
              "timeObjSec": 93,
              "captures": 2
            }
          ]
        }
      ]
    }
  ]
}
```

## Notes

- This is intentionally backend-free for easy startup.
- If you later want cloud sync/multi-user support, we can add a backend (Supabase/Firebase/Postgres API) without changing the UI much.
