# Inquiring Agents — Design Spec

## Summary

Interactive teaching tool that runs Churchman's Five Inquiring Systems as a multi-agent Delphi debate on AI ethics. Five philosopher-agents (Leibnitz, Locke, Kant, Hegel, Singer) argue through 3 rounds, students can inject perspectives between rounds, and a coordinator synthesizes a final policy. Built as a single Cloudflare Worker with streaming OpenAI responses.

Based on: https://github.com/snerur/Inquiring-Agents

## Architecture

**Single Cloudflare Worker** — serves HTML on `GET /`, proxies OpenAI streaming on API routes. No static assets, no build step, one `wrangler deploy`.

### Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Serves the full HTML/CSS/JS app as inline response |
| `/api/debate` | POST | Runs one philosopher's turn, streams SSE back |
| `/api/synthesize` | POST | Coordinator synthesizes final policy, streams SSE |

### Request/Response

**POST /api/debate**
```json
{
  "philosopher": "leibnitz",
  "round": 0,
  "topic": "Autonomous hiring algorithms",
  "priorPositions": { "leibnitz": "...", "locke": "...", ... },
  "injection": "What about candidates with disabilities?"
}
```
Response: SSE stream of `data: {"token": "..."}` events, ending with `data: [DONE]`.

**POST /api/synthesize**
```json
{
  "positions": {
    "round0": { "leibnitz": "...", ... },
    "round1": { "leibnitz": "...", ... },
    "round2": { "leibnitz": "...", ... }
  },
  "topic": "Autonomous hiring algorithms"
}
```
Response: Same SSE stream format.

### OpenAI Integration

- Model: `gpt-4o` (configurable via env var)
- Temperature: 0.7
- Streaming: `stream: true` on all calls
- Worker reads `OPENAI_API_KEY` from Wrangler secret
- Each philosopher has a system prompt encoding their role, backstory, and epistemological stance (ported from the original CrewAI agent definitions)

### Data Flow

```
User picks topic
    → Round 0: 5 parallel POST /api/debate calls (each philosopher independently)
    → [Optional] Student injects a perspective
    → Round 1: 5 sequential POST /api/debate calls (each sees all R0 + injection)
    → [Optional] Student injects another perspective
    → Round 2: 5 sequential POST /api/debate calls (each sees all R1 + injection)
    → POST /api/synthesize (coordinator produces final policy)
```

Round 0 calls run in parallel (philosophers don't see each other). Rounds 1 and 2 run sequentially so each philosopher can reference prior outputs in the same round.

## Frontend

### Layout (top to bottom)

1. **Header** — "Inquiring Agents" title + subtitle
2. **Topic bar** — Dropdown with preset dilemmas + "or type your own" input + Start button
3. **Round progress pills** — Round 0 / Round 1 / Round 2 / Synthesis with done/active/pending states
4. **Philosopher cards** — 5-column grid, each card has:
   - Colored top border + avatar + name + tradition label
   - Scrollable body showing the philosopher's current position (streams in token-by-token)
   - Status footer (streaming/complete/queued)
5. **Injection bar** — Green-bordered text input + "Inject" button. Appears between rounds.
6. **Synthesis panel** — Gold-bordered card for the coordinator's final policy output

### Visual Design

- Light background (`#f8f9fa`), white cards
- Philosopher color coding: Leibnitz=blue, Locke=green, Kant=amber, Hegel=red, Singer=purple
- Body text: 15-16px Georgia. UI chrome: sans-serif.
- Streaming cursor: amber blinking bar at end of text

### Interactions

1. **Select or type topic** → click "Start Debate"
2. **Round 0 runs** — 5 cards stream simultaneously. Progress pill updates.
3. **Injection opportunity** — Injection bar activates. Student can type and submit, or skip (click "Continue to Round 1").
4. **Round 1 runs** — Cards update sequentially, each streaming in turn.
5. **Injection opportunity** again before Round 2.
6. **Round 2 runs** — Final positions stream in.
7. **Synthesis** — Coordinator card appears/expands with streaming final policy.

### Preset Topics

- Autonomous hiring algorithms
- Deepfake regulation
- AI in criminal sentencing
- Autonomous weapons
- AI-generated art & copyright
- Predictive policing
- AI in healthcare diagnosis
- Surveillance capitalism

### State Management

All state lives in the browser (vanilla JS, no framework):
- `topic`: string
- `round`: 0 | 1 | 2 | "synthesis"
- `positions`: `{ round0: {}, round1: {}, round2: {} }`
- `injections`: `string[]` (max 2, one between each round)
- `isStreaming`: boolean
- `activePhilosopher`: string | null

## Philosopher System Prompts

Ported from the original CrewAI agent definitions. Each philosopher gets:
- **Role**: Their philosophical identity
- **Backstory**: Epistemological stance and accommodation tendencies
- **Round-specific instructions**: What to produce (initial position / revised position / final position)
- **Topic**: The ethical dilemma under debate
- **Context**: Prior positions from other philosophers (Rounds 1-2) + any student injection
- **Format**: Structured output with headers (Axioms, Evidence, Imperatives, etc.)
- **Length**: 300-400 words per response

The coordinator gets all final positions and produces a structured policy document (~600-800 words).

## File Structure

```
inquiring-agents/
├── src/
│   └── worker.js          # Cloudflare Worker (routes + HTML template + prompts)
├── wrangler.toml           # Cloudflare config
├── package.json            # Minimal (just wrangler dev dependency)
└── docs/
```

Single source file. The HTML is a template literal inside `worker.js`. Philosopher system prompts are constants in the same file.

## Deployment

```bash
cd inquiring-agents
npx wrangler secret put OPENAI_API_KEY
npx wrangler deploy
```

Optional env vars in `wrangler.toml`:
- `OPENAI_MODEL` (default: `gpt-4o`)
- `OPENAI_TEMPERATURE` (default: `0.7`)

## Non-Goals

- No database or persistence
- No user accounts or authentication
- No rate limiting (relies on Cloudflare's built-in)
- No mobile-optimized layout (desktop teaching tool)
- No CrewAI or agent framework — direct API calls only
