# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx wrangler dev          # Local dev server on localhost:8787
npx wrangler deploy       # Deploy to Cloudflare Workers

# Set production secret (extract value only, not KEY=value):
grep OPENAI_API_KEY .dev.vars | cut -d'=' -f2 | npx wrangler secret put OPENAI_API_KEY
```

Local dev requires `.dev.vars` with `OPENAI_API_KEY=sk-...`. No build step, no tests, no linter.

## Architecture

Everything is in `src/worker.js` (~730 lines). It's a single Cloudflare Worker that serves HTML and proxies to OpenAI.

**Layout of worker.js:**
- **Lines 1-38**: `PHILOSOPHERS` object (5 agents with system prompts), `COORDINATOR_SYSTEM_PROMPT`, constants
- **Lines 40-108**: Prompt builders (`buildRound0Prompt`, `buildRound1Prompt`, `buildRound2Prompt`, `buildSynthesisPrompt`)
- **Lines 110-207**: `streamFromOpenAI()` — proxies OpenAI streaming with AbortController (25s timeout for Cloudflare's 30s subrequest limit)
- **Lines 209-252**: Route handler (`GET /` serves HTML, `POST /api/debate`, `POST /api/synthesize`) and request handlers
- **Lines 254-727**: `HTML_TEMPLATE` — entire frontend as a template literal (CSS + HTML + JS IIFE)

**API endpoints:**
- `POST /api/debate` — `{philosopher, round, topic, priorRoundPositions, sameRoundPositionsSoFar, injections}` → SSE stream of `{token}` objects
- `POST /api/synthesize` — `{positions, topic}` → SSE stream of `{token}` objects

**Debate flow:** Round 0 (5 parallel) → injection → Round 1 (sequential, each sees prior + same-round context) → injection → Round 2 (sequential) → synthesis (coordinator agent)

## Template Literal Escaping

The frontend JS lives inside a backtick template literal (`HTML_TEMPLATE`). This requires special escaping:

- `\n` in JS strings must be `"\\n"` (double-escaped) — otherwise the outer template literal interprets it as a literal newline
- Single quotes in `onclick` handlers must use `&quot;` HTML entities — `\'` gets interpreted by the template literal
- `${` must be avoided in the frontend JS or escaped — it would be interpreted as template interpolation

## Deployment

- **Live URL**: `inquiring-agents.illinihunt.org` (custom domain via Workers Custom Domains API)
- **workers.dev URL exists** but gets flagged as malicious by LinkedIn and other platforms
- Config vars (`OPENAI_MODEL`, `OPENAI_TEMPERATURE`) are in `wrangler.toml`; the API key is a secret (not in toml)
