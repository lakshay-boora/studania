# Angvey — Technical Architecture

## System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                         CLIENT (web/)                           │
│   React 19 + Vite + TypeScript SPA                             │
│   • Landing (marketing site)      • Doubt Saathi (chat + voice)│
│   • Practice Arena (MCQs)         • Revision Planner           │
│   • Dash (analytics)                                            │
│   Voice: Web Speech API (STT hi-IN/en-IN + TTS) — zero cost    │
└──────────────────────────┬─────────────────────────────────────┘
                           │ REST /api/* (JSON)
┌──────────────────────────▼─────────────────────────────────────┐
│                    API SERVER (server/)                         │
│   Node.js + Express                                             │
│   ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌─────────────┐  │
│   │ /chat      │ │ /practice  │ │ /progress │ │ /planner    │  │
│   └─────┬──────┘ └────────────┘ └─────┬─────┘ └─────────────┘  │
│         ▼                             ▼                        │
│   ┌──────────────────┐        ┌──────────────┐                  │
│   │  DOUBT ENGINE    │        │  JSON STORE  │                  │
│   │  ┌────────────┐  │        │  (users,     │                  │
│   │ │ Hinglish    │  │        │  chats,      │                  │
│   │ │ normalizer  │  │        │  attempts,   │                  │
│   │ └─────┬──────┘  │        │  revisions)  │                  │
│   │       ▼         │        └──────────────┘                  │
│   │ ┌────────────┐  │                                          │
│   │ │ Retriever  │  │  Tier 1: TF-IDF + fuzzy over             │
│   │ │ (Tier 1)   │  │  bilingual knowledge.json  → ~₹0/doubt   │
│   │ └─────┬──────┘  │                                          │
│   │    low score?   │                                          │
│   │       ▼         │                                          │
│   │ ┌────────────┐  │  Tier 2 (optional): Ollama / any         │
│   │ │ LLM adapter│  │  OpenAI-compatible endpoint (Qwen3)      │
│   │ └────────────┘  │  enabled via OLLAMA_URL env              │
│   └──────────────────┘                                         │
└────────────────────────────────────────────────────────────────┘
                           │ (optional, production)
                    ┌──────▼───────┐
                    │   Ollama     │  qwen3:8b / gemma3 / deepseek-r1
                    │  (docker)    │  self-hosted open-weights
                    └──────────────┘
```

## Monorepo Layout

```
├── brand/                  Logo & brand assets
├── docs/                   Research, models, branding, business, architecture
├── server/                 Node.js API + Doubt Engine (plain JS, no build step)
│   ├── src/
│   │   ├── index.js        Express bootstrap, static serving of web/dist
│   │   ├── config.js       Env handling
│   │   ├── engine/
│   │   │   ├── hinglish.js Hinglish/Hindi normalization & token maps
│   │   │   ├── retriever.js TF-IDF + fuzzy retrieval over the KB
│   │   │   ├── doubtEngine.js Orchestrates Tier-1/Tier-2, composes answers
│   │   │   └── llmAdapter.js OpenAI-compatible client (Ollama, vLLM, ...)
│   │   ├── routes/         chat, practice, progress, planner
│   │   ├── store/store.js  Atomic JSON persistence (data/)
│   │   └── data/
│   │       ├── knowledge/       Curated bilingual KB, one JSON per subject
│   │       └── questions.json   PYQ-pattern MCQ bank with explanations
│   └── package.json
└── web/                    React + Vite + TS frontend
    └── src/
        ├── lib/            api.ts, speech.ts (Web Speech wrappers)
        ├── components/     Logo, Navbar, cards, chips...
        └── pages/          Landing, Chat, Practice, Planner, Dash
```

## Key Design Decisions

1. **Retrieval-first (Tier 1 default).** The curated bilingual KB answers the majority of
   high-frequency doubts instantly, offline, at zero marginal cost — this is the pricing
   moat. The engine is fully functional with **no LLM and no GPU**.
2. **LLM adapter is pluggable, never required.** Set `OLLAMA_URL` (or any
   OpenAI-compatible URL) to enable Tier-2 open-ended solving with Qwen/Gemma/DeepSeek.
   The app degrades gracefully without it.
3. **Voice on the client.** Web Speech API gives STT+TTS with hi-IN support on Chrome
   Android — the phone students already own. Server-side Whisper/IndicConformer is the
   roadmap upgrade for accented/dialect speech.
4. **Plain-JS server, zero build.** `node src/index.js` and it runs — easy for institute
   IT staff (Paathshala B2B tier) to self-host on a ₹30K mini-PC.
5. **JSON store first.** No DB dependency at MVP; swap to SQLite/Postgres via the same
   `store.js` interface when scale demands.
6. **Bilingual everything.** Every KB entry, question, and explanation carries both
   English and Hinglish variants — the product's core promise is structural, not
   a translation afterthought.

## Production Deployment

```bash
# Full stack incl. self-hosted open-weights LLM:
docker compose up          # web (built static) + api + ollama (qwen3:8b)

# Or the lean path (works on any Node 18+ box, no GPU):
cd server && npm install && ANGVEY_PORT=8787 node src/index.js
```

Environment variables (see `.env.example`): `ANGVEY_PORT`, `OLLAMA_URL`, `OLLAMA_MODEL`.

## Security & Privacy

- No third-party APIs called by default; student data (doubts, voice transcripts) stays on
  Angvey servers — a parent/school selling point.
- Store files are atomic-write JSON under `server/data/runtime/` (gitignored).
- Rate limiting on /chat to protect the free tier.
