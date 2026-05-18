# 🎬 AI Bollywood Script Generator

Turn ordinary real-world situations into absurd, over-the-top Bollywood/Hollywood movie scripts — complete with title, tagline, cast, and multi-scene dialogue.

> **Assignment goal:** *"Turn ordinary situations into absurd Bollywood-level drama. 😂"*

## Demo

Record a **< 3 min** walkthrough showing:
1. Entering a mundane situation (e.g. founders fighting over sugar in coffee)
2. Selecting a mood and generating a script
3. Scrolling through scenes (index, description, dialogue)
4. History, regenerate, and share link (bonus features)

## Features

### Mandatory
| Feature | Implementation |
|--------|----------------|
| Situation input → scene output | `SituationForm` + `SceneCard` per scene |
| LLM agent | OpenRouter chat API + structured JSON (`server/src/services/llm.ts`) |
| Movie title, tagline, multi-scene script | Zod-validated `DramaScript` schema |
| Per scene: index, description, dialogue | `SceneSchema` in `server/src/schemas/drama.ts` |
| Error handling | Typed `LlmError`, API validation, `ErrorBanner` UI |
| Responsive UI | Tailwind CSS, mobile history drawer |
| Local history | `localStorage` via `useHistory` hook |

### Bonus
- **Character cards** — name, role, description, catchphrase
- **Scene mood** — masala, tragic, comedy, action, romantic, horror, sci-fi
- **Regenerate sections** — title, tagline, cast, single scene, all scenes
- **Share drama card** — URL hash encodes script (`#share=...`) for public viewing

## Architecture

```
client/          React + Vite + Tailwind (UI, localStorage, share encoding)
server/          Express + TypeScript (API, prompts, LLM, Zod validation)
```

**AI flow:** User situation → prompt engineering (`prompts/dramaAgent.ts`) → OpenRouter JSON response → Zod parse → frontend render.

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **OpenRouter API key** (free): https://openrouter.ai/keys

Recommended free models (set in `OPENROUTER_MODEL`):
- `deepseek/deepseek-v4-flash:free` (default — works for most accounts)
- `openrouter/free` (auto-routes to an available free model)

If you see **404 / guardrail** errors, open [OpenRouter Privacy Settings](https://openrouter.ai/settings/privacy) and allow free model providers. The server also **auto-tries fallback models** if your first choice is blocked.

## Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd "AI Bollywood Script Generator"

# 2. Install dependencies
npm run install:all

# 3. Configure environment
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY=sk-or-v1-...

# 4. Run dev (server :3001 + client :5173)
npm run dev
```

Open **http://localhost:5173** (frontend). API runs on **http://localhost:3001**.

> Use **one** URL at a time: `5173` for development (`npm run dev`), or `3001` after `npm run build && npm start` (serves UI + API together). Do not mix an old server on `3001` with a new Vite on `5173`.

## Production build

```bash
npm run build
npm start
```

Serves API + built frontend from **http://localhost:3001**

## Environment variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Required. Your OpenRouter key |
| `OPENROUTER_MODEL` | Optional. Default: `deepseek/deepseek-v4-flash:free` (with auto-fallback) |
| `PORT` | Server port (default `3001`) |
| `VITE_API_URL` | Frontend API base (empty in dev uses Vite proxy) |

## API

| Method | Path | Body |
|--------|------|------|
| GET | `/api/health` | — |
| POST | `/api/drama/generate` | `{ situation, mood }` |
| POST | `/api/drama/regenerate` | `{ section, situation, mood, currentDrama, sceneIndex? }` |

## Project structure

```
├── client/src/
│   ├── api.ts                 # API client
│   ├── hooks/useHistory.ts    # localStorage history
│   ├── utils/share.ts         # URL share encoding
│   └── components/            # UI components
├── server/src/
│   ├── schemas/drama.ts       # Zod types (structured output)
│   ├── prompts/dramaAgent.ts  # Prompt engineering
│   ├── services/llm.ts        # OpenRouter integration
│   └── routes/drama.ts        # Express routes
```

## AI usage disclosure (for submission)

This project was built with **Cursor AI** as a coding assistant:
- Architecture and file structure were planned first, then implemented module-by-module
- Prompts in `dramaAgent.ts` were iterated for structured JSON and Bollywood tone
- UI copy and styling were refined for a cinematic “masala” feel
- **No API keys** are committed; reviewers use their own OpenRouter key via `.env`

## Submission

See **[SUBMISSION.md](./SUBMISSION.md)** for step-by-step: API key, demo video script, GitHub push, and email template.

## Submission checklist

- [ ] Push to a **public** GitHub repository
- [ ] Record demo video (< 3 min), upload to YouTube/Loom (public link)
- [ ] Email **sumeet@deepshorts.ai**
  - **Subject:** `Assignment submission`
  - **Body:** GitHub repo URL + demo video URL
