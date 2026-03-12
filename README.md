# Inquiring Agents

Interactive multi-agent Delphi debate on AI ethics, built on Churchman's Five Inquiring Systems (1971).

**Live:** [inquiring-agents.illinihunt.org](https://inquiring-agents.illinihunt.org)

## What It Does

Five philosopher-agents debate AI ethics dilemmas across three rounds with streaming responses. Students pick a topic (or write their own), watch the philosophers argue from their distinct epistemological traditions, inject their own perspectives between rounds, and read a final policy synthesis.

### The Five Philosophers

| Agent | Tradition | Approach |
|-------|-----------|----------|
| **Leibnitz** | Rationalist | First principles, logical axioms, internal consistency |
| **Locke** | Empiricist | Observable evidence, measurable outcomes, audit trails |
| **Kant** | Synthetic / Duty | Categorical imperative, universal human dignity |
| **Hegel** | Dialectical | Thesis-antithesis-synthesis, resolving contradictions |
| **Singer** | Pragmatist | Sweeping inquiry, power structures, human flourishing |

### Debate Flow

1. **Round 0** — All 5 philosophers respond in parallel with initial positions
2. **Student injection** — Optionally challenge assumptions or raise new dimensions
3. **Round 1** — Sequential responses, each philosopher sees prior positions + student input
4. **Student injection** — Second opportunity to shape the debate
5. **Round 2** — Final round with sharpened, converging arguments
6. **Synthesis** — Coordinator produces policy recommendations with convergences and persistent tensions

## Architecture

Single Cloudflare Worker (~700 lines) that serves HTML and proxies to OpenAI:

```
Browser ←→ Cloudflare Worker ←→ OpenAI Chat Completions API
              (serves HTML)        (stream: true)
              (proxies SSE)
```

- **Zero dependencies** — no npm packages, no build step
- **Server-Sent Events** — real-time streaming via `ReadableStream`
- **Single file** — HTML, CSS, JS, and API proxy all in `src/worker.js`

## Setup

```bash
# Clone
git clone https://github.com/vishalsachdev/inquiring-agents.git
cd inquiring-agents

# Add your OpenAI API key
echo "OPENAI_API_KEY=sk-your-key" > .dev.vars

# Run locally
npx wrangler dev

# Deploy
npx wrangler deploy
# Then set the production secret:
grep OPENAI_API_KEY .dev.vars | cut -d'=' -f2 | npx wrangler secret put OPENAI_API_KEY
```

## Configuration

Edit `wrangler.toml`:

```toml
[vars]
OPENAI_MODEL = "gpt-4o"          # Any OpenAI chat model
OPENAI_TEMPERATURE = "0.7"       # 0.0 - 2.0
```

## Built-in Dilemmas

- Autonomous hiring algorithms
- Deepfake regulation
- AI in criminal sentencing
- Autonomous weapons
- AI-generated art & copyright
- Predictive policing
- AI in healthcare diagnosis
- Surveillance capitalism

Students can also type any custom ethical dilemma.

## Attribution

Based on [Inquiring-Agents](https://github.com/snerur/Inquiring-Agents) by [Sridhar Nerur](https://www.linkedin.com/posts/sridharnerur_github-snerurinquiring-agents-activity-7437895999257284608-Dcv9) — a CrewAI + Jupyter notebook implementing Churchman's framework. This project rebuilds it as an interactive web app with real-time streaming, student participation, and single-command deployment.

## License

MIT
