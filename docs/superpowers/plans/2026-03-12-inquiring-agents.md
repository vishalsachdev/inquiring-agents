# Inquiring Agents Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Churchman's Five Inquiring Systems Delphi debate app as a single Cloudflare Worker with streaming OpenAI responses.

**Architecture:** Single `src/worker.js` serves HTML on GET / and proxies streaming OpenAI calls on POST /api/debate and /api/synthesize. All state lives client-side. Philosopher system prompts are module-scope constants. No build step, no framework.

**Tech Stack:** Cloudflare Workers, OpenAI Chat Completions API (streaming), vanilla JS, SSE via fetch+ReadableStream

**Spec:** `docs/superpowers/specs/2026-03-12-inquiring-agents-design.md`

---

## Chunk 1: Project Scaffolding and Worker Skeleton

### Task 1: Initialize project and Wrangler config

**Files:**
- Create: `package.json`
- Create: `wrangler.toml`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "inquiring-agents",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "wrangler": "^3"
  }
}
```

- [ ] **Step 2: Create wrangler.toml**

```toml
name = "inquiring-agents"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[vars]
OPENAI_MODEL = "gpt-4o"
OPENAI_TEMPERATURE = "0.7"
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
.wrangler/
.dev.vars
.superpowers/
```

- [ ] **Step 4: Install dependencies**

Run: `cd /Users/vishal/code/inquiring-agents && npm install`
Expected: `node_modules/` created, lockfile generated

- [ ] **Step 5: Commit**

```bash
git add package.json wrangler.toml .gitignore package-lock.json
git commit -m "chore: scaffold project with wrangler config"
```

### Task 2: Worker skeleton with routing

**Files:**
- Create: `src/worker.js`

- [ ] **Step 1: Create worker.js with route handling skeleton**

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(HTML_TEMPLATE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/debate') {
      return handleDebate(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/synthesize') {
      return handleSynthesize(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleDebate(request, env) {
  return new Response('TODO', { status: 501 });
}

async function handleSynthesize(request, env) {
  return new Response('TODO', { status: 501 });
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html><body><h1>Inquiring Agents</h1><p>Coming soon...</p></body></html>`;
```

- [ ] **Step 2: Test the skeleton locally**

Run: `cd /Users/vishal/code/inquiring-agents && npx wrangler dev --port 8787 &`
Then: `curl http://localhost:8787/` — Expected: HTML with "Inquiring Agents"
Then: `curl -X POST http://localhost:8787/api/debate` — Expected: 501
Then: `curl http://localhost:8787/nonexistent` — Expected: 404

- [ ] **Step 3: Commit**

```bash
git add src/worker.js
git commit -m "feat: add worker skeleton with route handling"
```

---

## Chunk 2: Philosopher System Prompts and OpenAI Streaming

### Task 3: Define philosopher system prompts

**Files:**
- Modify: `src/worker.js`

- [ ] **Step 1: Add philosopher definitions as module-scope constants**

Add above the `export default` block. Each philosopher object has `name`, `tradition`, `color`, `emoji`, `systemPrompt`. Port the role + backstory from the original CrewAI definitions in the notebook (cell 6 at https://github.com/snerur/Inquiring-Agents). Keep the original personality and epistemological stance intact.

```js
const PHILOSOPHERS = {
  leibnitz: {
    name: 'Leibnitz',
    tradition: 'Rationalist',
    emoji: '🔷',
    systemPrompt: `You are the Leibnitzian AI Ethics Philosopher. You embody the rationalist tradition of Gottfried Wilhelm Leibnitz as interpreted by C. West Churchman in 'Design of Inquiring Systems'. You believe that genuine knowledge — and therefore genuine ethics — must be derived through pure reason from axiomatic first principles. You are deeply skeptical of empirical data alone and insist that ethical rules must be logically derivable and internally non-contradictory. You prize coherence, precision, and formal structure. You will accommodate other views ONLY if they can be integrated without logical contradiction. You are the most resistant to change among the five, but you are not dogmatic — you will accept refinements that strengthen logical consistency.`,
  },
  locke: {
    name: 'Locke',
    tradition: 'Empiricist',
    emoji: '🟢',
    systemPrompt: `You are the Lockean AI Ethics Philosopher. You embody the empiricist tradition of John Locke as interpreted by Churchman. For you, there are no innate ethical principles — all ethics must be grounded in observation of real consequences in the world. What harms have AI systems caused? What does the evidence show about bias, discrimination, and failure modes? You insist on audit trails, empirical testing, and measurable accountability standards. You are moderately open to other perspectives — you will accommodate views that can be supported with evidence or that improve measurability. You push back on purely abstract principles that cannot be operationalized or tested.`,
  },
  kant: {
    name: 'Kant',
    tradition: 'Synthetic / Duty',
    emoji: '🟡',
    systemPrompt: `You are the Kantian AI Ethics Philosopher. You embody the synthetic critical philosophy of Immanuel Kant as interpreted by Churchman. You believe that both pure rationalism and pure empiricism are insufficient — ethical knowledge requires both a priori principles AND experience working together. Your central framework is the categorical imperative: act only according to that maxim by which you can at the same time will that it should become a universal law. Applied to AI: would we be comfortable if EVERY firm built AI this way? You champion human dignity and autonomy as inviolable constraints. You are moderately willing to accommodate other views but will not compromise on universal human dignity.`,
  },
  hegel: {
    name: 'Hegel',
    tradition: 'Dialectical',
    emoji: '🔴',
    systemPrompt: `You are the Hegelian AI Ethics Philosopher. You embody the dialectical tradition of G.W.F. Hegel as interpreted by Churchman. For you, any single-sided view of AI ethics is necessarily incomplete. Truth emerges through the conflict and reconciliation of opposing perspectives. You deliberately challenge other philosophers — not to defeat them, but because you believe productive contradiction is the engine of genuine understanding. You see Leibnitz's rationalism as thesis, Locke's empiricism as antithesis, and you push toward synthesis. You are highly willing to accommodate and integrate other views — indeed, you actively seek out tensions to resolve.`,
  },
  singer: {
    name: 'Singer',
    tradition: 'Pragmatist',
    emoji: '🟣',
    systemPrompt: `You are the Singerian AI Ethics Philosopher. You embody the pragmatist inquiring system of E.A. Singer Jr. (and C.S. Peirce) as interpreted by Churchman — the most ambitious of the five systems. For you, every answer generates new and more important questions. AI ethics is not just about preventing harm — it's about asking what kind of society we're building, whose values are encoded, and whether the entire enterprise of AI serves human flourishing. You 'sweep in' considerations of power, justice, ecology, culture, and future generations that others ignore. You are highly accommodating of other views because you see them as partial perspectives that your sweeping-in approach can incorporate. You never treat any framework as final.`,
  },
};

const COORDINATOR_SYSTEM_PROMPT = `You are a wise policy architect who deeply understands all five of Churchman's inquiring systems (Leibnitz/Rationalist, Locke/Empiricist, Kant/Synthetic, Hegel/Dialectical, Singer/Pragmatist). Your job is not to take sides but to identify convergences, note persistent disagreements, and synthesize their perspectives into a coherent, practical AI governance policy that a firm can actually implement. You produce structured policy documents.`;

const PHILOSOPHER_ORDER = ['leibnitz', 'locke', 'kant', 'hegel', 'singer'];

const POLICY_DIMENSIONS = 'Accountability, Trustworthiness, Fairness, Transparency, and Regulatory Compliance';
```

- [ ] **Step 2: Add round-specific prompt builders**

```js
function buildRound0Prompt(philosopher, topic) {
  const p = PHILOSOPHERS[philosopher];
  return `This is ROUND 0 — your independent initial position on: "${topic}"

Articulate your ethical framework addressing: ${POLICY_DIMENSIONS}.

Structure your response:
1. **Your Foundational Approach** (2-3 core principles from your tradition)
2. **Position on Each Dimension** (1-2 sentences each)
3. **Non-Negotiables** (what you will never compromise)

Be true to your philosophical character. 300-400 words.`;
}

function buildRound1Prompt(philosopher, topic, priorRoundPositions, sameRoundSoFar, injections) {
  const p = PHILOSOPHERS[philosopher];
  let prompt = `This is ROUND 1 of the Delphi process on: "${topic}"

Here are the Round 0 positions from all philosophers:\n\n`;

  for (const [key, text] of Object.entries(priorRoundPositions)) {
    prompt += `**${PHILOSOPHERS[key].name} (${PHILOSOPHERS[key].tradition}):**\n${text}\n\n`;
  }

  if (Object.keys(sameRoundSoFar).length > 0) {
    prompt += `Round 1 positions already stated:\n\n`;
    for (const [key, text] of Object.entries(sameRoundSoFar)) {
      prompt += `**${PHILOSOPHERS[key].name}:**\n${text}\n\n`;
    }
  }

  if (injections.length > 0) {
    prompt += `A student has injected these perspectives:\n`;
    injections.forEach((inj, i) => { prompt += `- "${inj}"\n`; });
    prompt += `\nYou must address the student's perspective in your response.\n\n`;
  }

  prompt += `Your task:
1. **Points of Agreement** (2-3 convergences with others)
2. **Points of Disagreement** (2-3 tensions — name the agents)
3. **Your Revised Position** on each dimension: ${POLICY_DIMENSIONS}
4. **Remaining Non-Negotiables**

Be true to your philosophical character. 300-400 words.`;

  return prompt;
}

function buildRound2Prompt(philosopher, topic, priorRoundPositions, sameRoundSoFar, injections) {
  const p = PHILOSOPHERS[philosopher];
  let prompt = `This is ROUND 2 — your FINAL position in the Delphi process on: "${topic}"

Here are the Round 1 revised positions:\n\n`;

  for (const [key, text] of Object.entries(priorRoundPositions)) {
    prompt += `**${PHILOSOPHERS[key].name} (${PHILOSOPHERS[key].tradition}):**\n${text}\n\n`;
  }

  if (Object.keys(sameRoundSoFar).length > 0) {
    prompt += `Round 2 final positions already stated:\n\n`;
    for (const [key, text] of Object.entries(sameRoundSoFar)) {
      prompt += `**${PHILOSOPHERS[key].name}:**\n${text}\n\n`;
    }
  }

  if (injections.length > 0) {
    prompt += `Student perspectives raised during this debate:\n`;
    injections.forEach((inj) => { prompt += `- "${inj}"\n`; });
    prompt += `\n`;
  }

  prompt += `Your task:
1. **Convergences Achieved** (what the group now agrees on)
2. **Persistent Tensions** (genuine remaining disagreements — name agents)
3. **Your Final Position** on each dimension: ${POLICY_DIMENSIONS}
4. **Message to Coordinator** (the single most important insight your tradition contributes)

This is your final word. Be definitive. 300-400 words.`;

  return prompt;
}

function buildSynthesisPrompt(topic, allPositions) {
  let prompt = `Synthesize the following Delphi debate on "${topic}" into a comprehensive AI Ethics & Governance Policy.

ROUND 0 — Independent Positions:\n\n`;
  for (const [key, text] of Object.entries(allPositions.round0)) {
    prompt += `**${PHILOSOPHERS[key].name}:** ${text}\n\n`;
  }
  prompt += `ROUND 1 — After First Iteration:\n\n`;
  for (const [key, text] of Object.entries(allPositions.round1)) {
    prompt += `**${PHILOSOPHERS[key].name}:** ${text}\n\n`;
  }
  prompt += `ROUND 2 — Final Positions:\n\n`;
  for (const [key, text] of Object.entries(allPositions.round2)) {
    prompt += `**${PHILOSOPHERS[key].name}:** ${text}\n\n`;
  }

  prompt += `Produce:
1. **Executive Summary** (150 words — why pluralistic approach is superior)
2. **Foundational Principles** (one from each tradition)
3. **Policy on Each Dimension** (${POLICY_DIMENSIONS}) with actionable requirements
4. **Governance Structure** (oversight bodies and processes)
5. **Persistent Tensions** (2-3 unresolved debates and how to navigate them)

600-800 words. Be authoritative and actionable.`;

  return prompt;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/worker.js
git commit -m "feat: add philosopher definitions and prompt builders"
```

### Task 4: Implement OpenAI streaming proxy

**Files:**
- Modify: `src/worker.js`

- [ ] **Step 1: Implement the streamFromOpenAI helper**

Replace the `handleDebate` and `handleSynthesize` stubs. Add this helper function:

```js
async function streamFromOpenAI(systemPrompt, userPrompt, env) {
  const model = env.OPENAI_MODEL || 'gpt-4o';
  const temperature = parseFloat(env.OPENAI_TEMPERATURE || '0.7');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      const errStream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: response.status === 429 ? 'rate_limit_exceeded' : 'openai_error', detail: errText })}\n\n`));
          ctrl.close();
        },
      });
      return new Response(errStream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') {
              await writer.write(encoder.encode('data: [DONE]\n\n'));
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
              }
            } catch {}
          }
        }
      } catch (err) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'timeout' })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const errStream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'timeout' })}\n\n`));
        ctrl.close();
      },
    });
    return new Response(errStream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }
}
```

- [ ] **Step 2: Wire up handleDebate**

```js
async function handleDebate(request, env) {
  const { philosopher, round, topic, priorRoundPositions, sameRoundPositionsSoFar, injections } = await request.json();

  if (!PHILOSOPHERS[philosopher]) {
    return new Response(JSON.stringify({ error: 'unknown philosopher' }), { status: 400 });
  }

  const systemPrompt = PHILOSOPHERS[philosopher].systemPrompt;
  let userPrompt;

  if (round === 0) {
    userPrompt = buildRound0Prompt(philosopher, topic);
  } else if (round === 1) {
    userPrompt = buildRound1Prompt(philosopher, topic, priorRoundPositions || {}, sameRoundPositionsSoFar || {}, injections || []);
  } else {
    userPrompt = buildRound2Prompt(philosopher, topic, priorRoundPositions || {}, sameRoundPositionsSoFar || {}, injections || []);
  }

  return streamFromOpenAI(systemPrompt, userPrompt, env);
}
```

- [ ] **Step 3: Wire up handleSynthesize**

```js
async function handleSynthesize(request, env) {
  const { positions, topic } = await request.json();
  const userPrompt = buildSynthesisPrompt(topic, positions);
  return streamFromOpenAI(COORDINATOR_SYSTEM_PROMPT, userPrompt, env);
}
```

- [ ] **Step 4: Test streaming locally**

Create `.dev.vars`:
```
OPENAI_API_KEY=sk-your-key-here
```

Run: `npx wrangler dev --port 8787 &`
Then test with curl:
```bash
curl -N -X POST http://localhost:8787/api/debate \
  -H 'Content-Type: application/json' \
  -d '{"philosopher":"leibnitz","round":0,"topic":"Autonomous hiring algorithms","priorRoundPositions":{},"sameRoundPositionsSoFar":{},"injections":[]}'
```
Expected: SSE stream of `data: {"token":"..."}` events ending with `data: [DONE]`

- [ ] **Step 5: Commit**

```bash
git add src/worker.js .gitignore
git commit -m "feat: implement OpenAI streaming proxy with debate and synthesize routes"
```

---

## Chunk 3: Frontend HTML/CSS/JS

### Task 5: Build the full HTML template

**Files:**
- Modify: `src/worker.js` (replace `HTML_TEMPLATE`)

- [ ] **Step 1: Replace HTML_TEMPLATE with the full app**

Replace the placeholder `HTML_TEMPLATE` constant with the complete HTML document. Key sections:

**CSS:** Port from the approved UI mockup (`docs/brainstorm/ui-mockup.html`) — light background, white cards, philosopher color coding, 15-16px body text, Georgia font, streaming cursor animation.

**HTML skeleton** (all IDs/classes that the JS depends on):

```html
<div class="header">
  <h1>Inquiring <span>Agents</span></h1>
  <p>Churchman's Five Inquiring Systems — A Multi-Agent Delphi Debate on AI Ethics</p>
</div>

<div class="topic-bar">
  <select id="topic-select">
    <option value="">Choose a dilemma...</option>
    <option value="Autonomous hiring algorithms">Autonomous hiring algorithms</option>
    <option value="Deepfake regulation">Deepfake regulation</option>
    <option value="AI in criminal sentencing">AI in criminal sentencing</option>
    <option value="Autonomous weapons">Autonomous weapons</option>
    <option value="AI-generated art & copyright">AI-generated art & copyright</option>
    <option value="Predictive policing">Predictive policing</option>
    <option value="AI in healthcare diagnosis">AI in healthcare diagnosis</option>
    <option value="Surveillance capitalism">Surveillance capitalism</option>
  </select>
  <input id="topic-custom" type="text" placeholder="...or type your own ethical dilemma">
  <button id="start-btn">▶ Start Debate</button>
</div>

<div id="round-bar" class="round-bar">
  <div class="round-pill pending">Round 0</div>
  <div class="round-pill pending">Round 1</div>
  <div class="round-pill pending">Round 2</div>
  <div class="round-pill pending">Synthesis</div>
</div>

<div id="philosophers" class="philosophers">
  <!-- Repeat for each philosopher: leibnitz, locke, kant, hegel, singer -->
  <div id="phil-leibnitz" class="phil-card phil-leibnitz">
    <div class="phil-header">
      <div class="phil-avatar">🔷</div>
      <div><div class="phil-name">Leibnitz</div><div class="phil-tradition">Rationalist</div></div>
    </div>
    <div class="phil-body"></div>
    <div class="phil-status">◌ Waiting</div>
  </div>
  <!-- Same structure for phil-locke (🟢 Empiricist), phil-kant (🟡 Synthetic/Duty),
       phil-hegel (🔴 Dialectical), phil-singer (🟣 Pragmatist) -->
</div>

<div id="inject-bar" class="inject-bar" style="display:none;">
  <div class="inject-label">Your Voice →</div>
  <input id="inject-input" type="text" placeholder="">
  <button id="inject-btn">Inject</button>
  <button id="skip-btn">Continue to Round 1</button>
</div>

<div id="synthesis" class="synthesis" style="display:none;">
  <div class="synthesis-card">
    <h3>⚖️ Final Policy — Coordinator Synthesis</h3>
    <div id="synthesis-body" class="content"></div>
  </div>
</div>
```

**JS — State:**
```js
const state = {
  topic: '',
  round: -1, // -1 = not started
  positions: { round0: {}, round1: {}, round2: {} },
  injections: [],
  philosopherState: {},
};
const PHIL_ORDER = ['leibnitz', 'locke', 'kant', 'hegel', 'singer'];
```

**JS — SSE reader helper:**
```js
async function streamDebate(philosopher, round, onToken, onDone, onError) {
  const body = {
    philosopher,
    round,
    topic: state.topic,
    priorRoundPositions: round === 0 ? {} : state.positions[`round${round - 1}`],
    sameRoundPositionsSoFar: {},
    injections: state.injections,
  };

  // Build sameRoundPositionsSoFar from current round's completed positions
  const currentRoundKey = `round${round}`;
  if (state.positions[currentRoundKey]) {
    body.sameRoundPositionsSoFar = { ...state.positions[currentRoundKey] };
  }

  try {
    const res = await fetch('/api/debate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') { onDone(fullText); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.token) {
            fullText += parsed.token;
            onToken(parsed.token);
          }
        } catch {}
      }
    }
    onDone(fullText);
  } catch (err) {
    onError(err.message);
  }
}
```

**JS — Round orchestration:**
```js
async function runRound(round) {
  state.round = round;
  updateRoundPills();
  const roundKey = `round${round}`;
  state.positions[roundKey] = {};

  if (round === 0) {
    // Parallel: all 5 at once
    const promises = PHIL_ORDER.map(phil => {
      setPhilState(phil, 'streaming');
      return streamDebate(phil, 0,
        (token) => appendToCard(phil, token),
        (fullText) => { state.positions[roundKey][phil] = fullText; setPhilState(phil, 'complete'); },
        (err) => setPhilState(phil, 'error'),
      );
    });
    await Promise.all(promises);
  } else {
    // Sequential: one at a time
    for (const phil of PHIL_ORDER) {
      setPhilState(phil, 'streaming');
      clearCard(phil);
      await streamDebate(phil, round,
        (token) => appendToCard(phil, token),
        (fullText) => { state.positions[roundKey][phil] = fullText; setPhilState(phil, 'complete'); },
        (err) => setPhilState(phil, 'error'),
      );
    }
  }

  // Show injection opportunity (except after round 2)
  if (round < 2) {
    showInjectionBar(round + 1);
  } else {
    runSynthesis();
  }
}
```

**JS — Injection handling:**
```js
function showInjectionBar(nextRound) {
  document.getElementById('inject-bar').style.display = 'flex';
  document.getElementById('inject-input').value = '';
  document.getElementById('inject-input').placeholder =
    `Inject a perspective before Round ${nextRound} (e.g., "What about environmental impact?")`;
  document.getElementById('skip-btn').textContent = `Continue to Round ${nextRound}`;

  document.getElementById('inject-btn').onclick = () => {
    const text = document.getElementById('inject-input').value.trim();
    if (text) state.injections.push(text);
    document.getElementById('inject-bar').style.display = 'none';
    runRound(nextRound);
  };

  document.getElementById('skip-btn').onclick = () => {
    document.getElementById('inject-bar').style.display = 'none';
    runRound(nextRound);
  };
}
```

**JS — Synthesis:**
```js
async function runSynthesis() {
  state.round = 'synthesis';
  updateRoundPills();
  document.getElementById('synthesis').style.display = 'block';
  const synthBody = document.getElementById('synthesis-body');
  synthBody.innerHTML = '<span class="cursor"></span>';

  try {
    const res = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: state.positions, topic: state.topic }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') {
          synthBody.querySelector('.cursor')?.remove();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) {
            const cursor = synthBody.querySelector('.cursor');
            if (cursor) cursor.insertAdjacentText('beforebegin', parsed.token);
          }
        } catch {}
      }
    }
  } catch (err) {
    synthBody.textContent = 'Error during synthesis. Please try again.';
  }
}
```

**JS — DOM helpers:**
```js
function setPhilState(phil, status) {
  state.philosopherState[phil] = status;
  const card = document.getElementById(`phil-${phil}`);
  const statusEl = card.querySelector('.phil-status');
  if (status === 'streaming') statusEl.textContent = '⟳ Streaming...';
  else if (status === 'complete') statusEl.textContent = '✓ Complete';
  else if (status === 'error') statusEl.innerHTML = '✗ Error <button onclick="retryPhil(\'' + phil + '\')">Retry</button>';
  else if (status === 'idle') statusEl.textContent = '◌ Waiting';
}

function appendToCard(phil, token) {
  const body = document.getElementById(`phil-${phil}`).querySelector('.phil-body');
  let cursor = body.querySelector('.cursor');
  if (!cursor) {
    cursor = document.createElement('span');
    cursor.className = 'cursor';
    body.appendChild(cursor);
  }
  cursor.insertAdjacentText('beforebegin', token);
  body.scrollTop = body.scrollHeight;
}

function clearCard(phil) {
  const body = document.getElementById(`phil-${phil}`).querySelector('.phil-body');
  body.innerHTML = '';
}

function retryPhil(phil) {
  const round = state.round;
  const roundKey = `round${round}`;
  setPhilState(phil, 'streaming');
  clearCard(phil);
  streamDebate(phil, round,
    (token) => appendToCard(phil, token),
    (fullText) => { state.positions[roundKey][phil] = fullText; setPhilState(phil, 'complete'); },
    (err) => setPhilState(phil, 'error'),
  );
}

function updateRoundPills() {
  const rounds = ['round0', 'round1', 'round2', 'synthesis'];
  const pills = document.querySelectorAll('.round-pill');
  const currentIdx = state.round === 'synthesis' ? 3 : state.round;
  pills.forEach((pill, i) => {
    pill.className = 'round-pill ' + (i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending');
  });
}
```

**JS — Start button:**
```js
document.getElementById('start-btn').addEventListener('click', () => {
  const select = document.getElementById('topic-select');
  const custom = document.getElementById('topic-custom');
  state.topic = custom.value.trim() || select.value;
  if (!state.topic || state.topic === '') return;

  // Reset state
  state.positions = { round0: {}, round1: {}, round2: {} };
  state.injections = [];
  state.philosopherState = {};
  PHIL_ORDER.forEach(p => { clearCard(p); setPhilState(p, 'idle'); });
  document.getElementById('synthesis').style.display = 'none';
  document.getElementById('inject-bar').style.display = 'none';

  // Disable start button during debate
  document.getElementById('start-btn').disabled = true;
  runRound(0).finally(() => { document.getElementById('start-btn').disabled = false; });
});
```

This is a large step. The full HTML template string should be ~400-500 lines including CSS, HTML structure, and JS. All inline in the template literal.

- [ ] **Step 2: Test the full app locally**

Run: `npx wrangler dev --port 8787`
Open `http://localhost:8787` in browser. Select "Autonomous hiring algorithms", click Start Debate.
Expected: 5 philosopher cards stream Round 0 positions simultaneously, then injection bar appears.

- [ ] **Step 3: Commit**

```bash
git add src/worker.js
git commit -m "feat: add full interactive frontend with streaming debate UI"
```

---

## Chunk 4: Polish and Deploy

### Task 6: End-to-end test and fix

**Files:**
- Modify: `src/worker.js` (as needed)

- [ ] **Step 1: Run full debate flow locally**

With `npx wrangler dev` running, open the app and:
1. Pick a topic, click Start → watch Round 0 stream
2. Type an injection, click Inject → watch Round 1 stream sequentially
3. Skip injection → watch Round 2 stream
4. Watch synthesis appear

Note any issues: streaming glitches, layout overflow, card scroll behavior, error states.

- [ ] **Step 2: Fix any issues found**

Common fixes likely needed:
- Markdown rendering in cards (philosopher responses use `**bold**` etc.) — add a minimal markdown-to-HTML converter or use `white-space: pre-wrap` and let raw markdown show
- Card overflow / scroll behavior
- Topic select vs custom input toggle
- Button state management

- [ ] **Step 3: Commit fixes**

```bash
git add src/worker.js
git commit -m "fix: polish UI and streaming behavior from end-to-end testing"
```

### Task 7: Deploy to Cloudflare

**Files:**
- No new files

- [ ] **Step 1: Set the OpenAI API key secret**

Run: `cd /Users/vishal/code/inquiring-agents && npx wrangler secret put OPENAI_API_KEY`
Enter the key when prompted.

- [ ] **Step 2: Deploy**

Run: `npx wrangler deploy`
Expected: Deployed to `inquiring-agents.<account>.workers.dev`

- [ ] **Step 3: Test the deployed version**

Open the Workers URL in browser. Run a full debate. Verify streaming works over HTTPS.

- [ ] **Step 4: Commit any deployment fixes**

```bash
git add -A
git commit -m "chore: deployment verified"
```

### Task 8: Push to GitHub

**Files:**
- No new files

- [ ] **Step 1: Create GitHub repo and push**

```bash
cd /Users/vishal/code/inquiring-agents
gh repo create vishalsachdev/inquiring-agents --public --source=. --push
```

- [ ] **Step 2: Verify**

Run: `gh repo view vishalsachdev/inquiring-agents --web`
