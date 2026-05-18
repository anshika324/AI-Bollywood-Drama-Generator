# Submission guide (DeepShorts assignment)

Follow these steps to complete your hiring submission.

## 1. Get an OpenRouter API key (free)

1. Sign up at https://openrouter.ai/
2. Create an API key at https://openrouter.ai/keys
3. Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

4. Paste your key:

```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
```

Optional — try assignment-recommended free models:

```
OPENROUTER_MODEL=openai/gpt-oss-120b:free
# or: nvidia/nemotron-3-super-120b-a12b:free
# or: google/gemma-3-27b-it:free
```

## 2. Run locally and test

```bash
npm run install:all   # if not done already
npm run dev
```

Open http://localhost:5173 and verify:

- [ ] Enter a situation → script generates with title, tagline, 5 scenes
- [ ] Each scene shows **scene index**, **description**, **dialogue**
- [ ] Change **mood** dropdown and regenerate
- [ ] **History** panel saves past dramas (localStorage)
- [ ] **Regenerate** title / tagline / cast / scene
- [ ] **Share drama card** copies a link; open in incognito to view shared script
- [ ] Error banner appears if API key is missing

## 3. Record demo video (< 3 minutes)

Suggested script (keep under 3 min):

1. **(15s)** Intro: "Bollywood Drama Generator — turns boring situations into masala cinema"
2. **(45s)** Paste example: founders fighting over sugar in coffee → pick mood → Generate
3. **(60s)** Scroll: movie title, tagline, character cards, 2–3 scenes with dialogue
4. **(30s)** Regenerate one scene + open History
5. **(20s)** Copy share link, paste in new tab to show shared view
6. **(10s)** Mention: React frontend, Express backend, OpenRouter, structured JSON + Zod

Upload to **YouTube** (Unlisted or Public) or **Loom** — link must be publicly accessible.

## 4. Push to public GitHub

```bash
cd "/Users/anshikagupta/Desktop/AI Bollywood Script Generator"
git init
git add .
git commit -m "feat: AI Bollywood Script Generator assignment submission"
```

Create a **new public repo** on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/bollywood-drama-generator.git
git branch -M main
git push -u origin main
```

**Do not commit `.env`** — only `.env.example` is in the repo.

## 5. Email submission

**To:** sumeet@deepshorts.ai  
**Subject:** `Assignment submission`

**Body template:**

```
Hi,

Please find my assignment submission for the AI Bollywood Script Generator role.

GitHub (public): https://github.com/YOUR_USERNAME/bollywood-drama-generator
Demo video: https://youtube.com/watch?v=YOUR_VIDEO_ID

Setup: See README.md — requires OPENROUTER_API_KEY in .env (free tier supported).

AI tooling: Built with Cursor AI; OpenRouter for LLM; prompts and structured output documented in server/src/prompts/ and server/src/schemas/.

Thanks,
[Your Name]
```

## 6. Optional: deploy for a live demo link

**Render / Railway / Fly.io:** Deploy the server; set `OPENROUTER_API_KEY` and run `npm run build && npm start`. The server serves the built client from `client/dist`.

---

Good luck with the next round! 🎬
