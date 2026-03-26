# Flashcard app (assignment 1 - 32516)

MD Saadman Kabir, ID: 25502701, FEIT

## What is used
- Frontend: React + Vite, normal JavaScript, CSS in `index.css`.
- Backend: Python with FastAPI. Runs with Uvicorn.
- Database: SQLite, file is `database/flashcards.db`. It gets created when the backend is started first.

The React app talks to FastAPI using `fetch`. In dev, Vite proxies `/api` to port 8000.

## Features
- Works like an SPA: one `index.html`, and I just swap screens with React state (decks list → one deck → study).
- Decks: create, rename, delete, list.
- Cards: create, edit, delete, list (per deck).
- Difficulty (1–5): optional when you add/edit a card. It’s stored in the DB and shows on the card list and while studying (tag of “Difficulty x/5”).
- Study mode: shuffles the deck for that session, question first, click to flip, then next. Cards leave the session when you move on but stay in the database.

## Folder layout (rough)

```
IP_As1_flashcard/
├── backend/
│   ├── main.py    # routes / API
│   └── db.py      # sqlite connection + tables
├── database/      # flashcards.db lives here (+ csv/sql samples if I handed those in)
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api.js
        ├── DecksPage.jsx
        ├── DeckDetailPage.jsx
        ├── StudyPage.jsx
        ├── main.jsx
        └── index.css
```

## What the tester needs installed

- **Node.js** (includes `npm`) — for the frontend. [https://nodejs.org](https://nodejs.org) LTS is fine.
- **Python 3** — for the backend (3.10+ is ok; I used 3.12).

Installing the SQLite separately is not needed; Python uses the built-in `sqlite3` module and the app creates `database/flashcards.db` on first backend start.

## How to run it (first time)

**Terminal 1 — backend** (from `backend/`):

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

(`requirements.txt` has FastAPI, Uvicorn, Pydantic — that’s all the backend packages.)

Opens on `http://localhost:8000` (health check: `/health`).

**Terminal 2 — frontend** (from `frontend/`):

```bash
npm install
npm run dev
```

Usually `http://localhost:4533`. API calls go through the proxy in `vite.config.js`.

## API (quick reference)
- `GET /health`
- Decks: `GET/POST /api/decks`, `PUT/DELETE /api/decks/{id}`
- Cards: `GET /api/decks/{deck_id}/cards`, `POST /api/cards`, `PUT/DELETE /api/cards/{id}`

## Stuff that was annoying

I picked SQLite because it’s just a file and I didn’t want to install a whole database server on every machine. FastAPI + Pydantic made the API pretty quick to write. Hooking React to the API was mostly fine once I put all the `fetch` stuff in `api.js` so the pages weren’t a mess. The SPA part is literally “change a string in state and render a different component” in `App.jsx` — no React Router, but it still counts as single page for me.

If something breaks, check the backend is running first, then look at the error text on the page (I tried to show API errors instead of a blank screen).

## Deploy for free (live demo)

Two services: **API on Render**, **frontend on Vercel**. Same GitHub repo.

### 1) API — [Render](https://render.com)

1. Sign in → **New** → **Blueprint** (or **Web Service**).
2. **Blueprint:** connect this repo; Render reads `render.yaml` at the root.  
   **Or Web Service:** connect repo → **Root Directory** = `backend` → **Build** = `pip install -r requirements.txt` → **Start** = `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Wait until it is **Live**. Copy the URL (e.g. `https://flashcards-api-xxxx.onrender.com`).
4. Open `https://YOUR-URL/health` — you should see `{"status":"ok"}`.

Free tier **sleeps** when idle; first request after sleep can take ~30–60s. SQLite on Render may **reset** after redeploys (demo only).

### 2) Frontend — [Vercel](https://vercel.com)

1. **Add New** → **Project** → import this GitHub repo.
2. **Root Directory:** `frontend`
3. **Environment Variables:** add **`VITE_API_BASE`** = your Render URL **with no trailing slash** (same as in `frontend/.env.example`).
4. Deploy, then open the **Vercel** URL and use the app.

If the UI cannot load decks, check `VITE_API_BASE` matches the Render URL exactly and the API is awake (hit `/health` once).

## EXTRA

- Just pull and drop the start-frontend.ps1 and start-backend.ps1 in terminals to quickly start the app

