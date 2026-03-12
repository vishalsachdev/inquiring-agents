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

function buildRound0Prompt(philosopher, topic) {
  return `This is ROUND 0 — your independent initial position on: "${topic}"

Articulate your ethical framework addressing: ${POLICY_DIMENSIONS}.

Structure your response:
1. **Your Foundational Approach** (2-3 core principles from your tradition)
2. **Position on Each Dimension** (1-2 sentences each)
3. **Non-Negotiables** (what you will never compromise)

Be true to your philosophical character. 300-400 words.`;
}

function buildRound1Prompt(philosopher, topic, priorRoundPositions, sameRoundSoFar, injections) {
  let prompt = `This is ROUND 1 of the Delphi process on: "${topic}"\n\nHere are the Round 0 positions from all philosophers:\n\n`;
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
    injections.forEach((inj) => { prompt += `- "${inj}"\n`; });
    prompt += `\nYou must address the student's perspective in your response.\n\n`;
  }
  prompt += `Your task:\n1. **Points of Agreement** (2-3 convergences with others)\n2. **Points of Disagreement** (2-3 tensions — name the agents)\n3. **Your Revised Position** on each dimension: ${POLICY_DIMENSIONS}\n4. **Remaining Non-Negotiables**\n\nBe true to your philosophical character. 300-400 words.`;
  return prompt;
}

function buildRound2Prompt(philosopher, topic, priorRoundPositions, sameRoundSoFar, injections) {
  let prompt = `This is ROUND 2 — your FINAL position in the Delphi process on: "${topic}"\n\nHere are the Round 1 revised positions:\n\n`;
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
  prompt += `Your task:\n1. **Convergences Achieved** (what the group now agrees on)\n2. **Persistent Tensions** (genuine remaining disagreements — name agents)\n3. **Your Final Position** on each dimension: ${POLICY_DIMENSIONS}\n4. **Message to Coordinator** (the single most important insight your tradition contributes)\n\nThis is your final word. Be definitive. 300-400 words.`;
  return prompt;
}

function buildSynthesisPrompt(topic, allPositions) {
  let prompt = `Synthesize the following Delphi debate on "${topic}" into a comprehensive AI Ethics & Governance Policy.\n\nROUND 0 — Independent Positions:\n\n`;
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
  prompt += `Produce:\n1. **Executive Summary** (150 words — why pluralistic approach is superior)\n2. **Foundational Principles** (one from each tradition)\n3. **Policy on Each Dimension** (${POLICY_DIMENSIONS}) with actionable requirements\n4. **Governance Structure** (oversight bodies and processes)\n5. **Persistent Tensions** (2-3 unresolved debates and how to navigate them)\n\n600-800 words. Be authoritative and actionable.`;
  return prompt;
}

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

async function handleSynthesize(request, env) {
  const { positions, topic } = await request.json();
  const userPrompt = buildSynthesisPrompt(topic, positions);
  return streamFromOpenAI(COORDINATOR_SYSTEM_PROMPT, userPrompt, env);
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inquiring Agents — Multi-Agent Delphi Debate</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #f8f9fa; color: #1a1a2e; font-family: 'Georgia', serif; }

  /* Header */
  .header { text-align: center; padding: 40px 20px 20px; border-bottom: 1px solid #e2e8f0; background: white; }
  .header h1 { font-size: 36px; color: #1a1a2e; letter-spacing: -0.5px; }
  .header h1 span { color: #d97706; }
  .header p { color: #6b7280; font-size: 17px; margin-top: 8px; font-family: sans-serif; }

  /* Topic bar */
  .topic-bar { max-width: 800px; margin: 28px auto; padding: 0 20px; display: flex; gap: 12px; flex-wrap: wrap; }
  .topic-bar select, .topic-bar input {
    flex: 1; background: white; border: 2px solid #e2e8f0; color: #1a1a2e;
    padding: 14px 18px; border-radius: 10px; font-size: 17px; font-family: sans-serif;
    min-width: 160px;
  }
  .topic-bar select:focus, .topic-bar input:focus { border-color: #d97706; outline: none; }
  .topic-bar button {
    background: #d97706; color: white; border: none; padding: 14px 28px;
    border-radius: 10px; font-weight: bold; font-size: 17px; cursor: pointer; font-family: sans-serif;
    white-space: nowrap;
  }
  .topic-bar button:hover { background: #b45309; }
  .topic-bar button:disabled { background: #9ca3af; cursor: not-allowed; }

  /* Round indicator */
  .round-bar { display: flex; justify-content: center; gap: 10px; padding: 24px; flex-wrap: wrap; }
  .round-pill {
    padding: 8px 22px; border-radius: 20px; font-size: 14px; font-family: sans-serif;
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .round-pill.active { background: #d97706; color: white; }
  .round-pill.done { background: #ecfdf5; color: #059669; border: 2px solid #059669; }
  .round-pill.pending { background: #f1f5f9; color: #94a3b8; border: 2px solid #e2e8f0; }

  /* Philosopher grid */
  .philosophers { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; max-width: 1300px; margin: 0 auto; padding: 0 20px; }
  @media (max-width: 1100px) { .philosophers { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 700px) { .philosophers { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .philosophers { grid-template-columns: 1fr; } }

  .phil-card {
    background: white; border-radius: 14px; overflow: hidden;
    border: 2px solid #e2e8f0; display: flex; flex-direction: column;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .phil-header {
    padding: 16px 18px; display: flex; align-items: center; gap: 12px;
    border-bottom: 2px solid #f1f5f9;
  }
  .phil-avatar {
    width: 42px; height: 42px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
  }
  .phil-name { font-weight: bold; font-size: 17px; font-family: sans-serif; }
  .phil-tradition { font-size: 13px; color: #6b7280; font-family: sans-serif; }
  .phil-body {
    padding: 16px 18px; font-size: 15px; line-height: 1.8; flex: 1;
    max-height: 320px; overflow-y: auto; color: #374151; white-space: pre-wrap; word-wrap: break-word;
  }
  .phil-body p { margin-bottom: 10px; }
  .phil-body strong { color: #1a1a2e; }
  .phil-status {
    padding: 10px 18px; font-size: 13px; color: #6b7280;
    border-top: 2px solid #f1f5f9; font-family: sans-serif; background: #fafbfc;
  }
  .phil-status button {
    margin-left: 8px; background: #d97706; color: white; border: none;
    padding: 2px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; font-family: sans-serif;
  }

  /* Streaming cursor */
  .cursor { display: inline-block; width: 2px; height: 16px; background: #d97706; animation: blink 0.8s infinite; vertical-align: text-bottom; margin-left: 2px; }
  @keyframes blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }

  /* Colors per philosopher */
  .phil-leibnitz .phil-avatar { background: #dbeafe; color: #2563eb; }
  .phil-locke .phil-avatar { background: #d1fae5; color: #059669; }
  .phil-kant .phil-avatar { background: #fef3c7; color: #d97706; }
  .phil-hegel .phil-avatar { background: #fee2e2; color: #dc2626; }
  .phil-singer .phil-avatar { background: #ede9fe; color: #7c3aed; }

  /* Colored top borders */
  .phil-leibnitz { border-top: 3px solid #3b82f6; }
  .phil-locke { border-top: 3px solid #10b981; }
  .phil-kant { border-top: 3px solid #d97706; }
  .phil-hegel { border-top: 3px solid #ef4444; }
  .phil-singer { border-top: 3px solid #7c3aed; }

  /* Injection bar */
  .inject-bar {
    max-width: 1300px; margin: 24px auto; padding: 0 20px;
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  }
  .inject-bar input {
    flex: 1; background: white; border: 2px solid #10b981; color: #1a1a2e;
    padding: 14px 18px; border-radius: 10px; font-size: 16px; font-family: sans-serif;
    min-width: 200px;
  }
  .inject-bar input::placeholder { color: #6b7280; }
  .inject-bar button {
    background: #10b981; color: white; border: none; padding: 14px 24px;
    border-radius: 10px; font-weight: bold; font-size: 16px; cursor: pointer; font-family: sans-serif;
    white-space: nowrap;
  }
  .inject-bar button:hover { background: #059669; }
  .inject-bar button#skip-btn { background: #6b7280; }
  .inject-bar button#skip-btn:hover { background: #4b5563; }
  .inject-label {
    font-size: 14px; color: #10b981; font-family: sans-serif; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;
  }

  /* Synthesis panel */
  .synthesis { max-width: 1300px; margin: 24px auto; padding: 0 20px; }
  .synthesis-card {
    background: white; border: 2px solid rgba(251,191,36,0.25); border-radius: 14px; padding: 28px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .synthesis-card h3 { color: #d97706; font-size: 22px; margin-bottom: 14px; }
  .synthesis-card .content { font-size: 16px; line-height: 1.8; color: #374151; white-space: pre-wrap; word-wrap: break-word; }

  /* Footer */
  .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 14px; font-family: sans-serif; }
</style>
</head>
<body>

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
    <option value="AI-generated art &amp; copyright">AI-generated art &amp; copyright</option>
    <option value="Predictive policing">Predictive policing</option>
    <option value="AI in healthcare diagnosis">AI in healthcare diagnosis</option>
    <option value="Surveillance capitalism">Surveillance capitalism</option>
  </select>
  <input id="topic-custom" type="text" placeholder="...or type your own ethical dilemma">
  <button id="start-btn">&#9654; Start Debate</button>
</div>

<div id="round-bar" class="round-bar">
  <div class="round-pill pending">Round 0</div>
  <div class="round-pill pending">Round 1</div>
  <div class="round-pill pending">Round 2</div>
  <div class="round-pill pending">Synthesis</div>
</div>

<div id="philosophers" class="philosophers">
  <div id="phil-leibnitz" class="phil-card phil-leibnitz">
    <div class="phil-header">
      <div class="phil-avatar">&#128311;</div>
      <div><div class="phil-name">Leibnitz</div><div class="phil-tradition">Rationalist</div></div>
    </div>
    <div class="phil-body"></div>
    <div class="phil-status">&#9675; Waiting</div>
  </div>

  <div id="phil-locke" class="phil-card phil-locke">
    <div class="phil-header">
      <div class="phil-avatar">&#128994;</div>
      <div><div class="phil-name">Locke</div><div class="phil-tradition">Empiricist</div></div>
    </div>
    <div class="phil-body"></div>
    <div class="phil-status">&#9675; Waiting</div>
  </div>

  <div id="phil-kant" class="phil-card phil-kant">
    <div class="phil-header">
      <div class="phil-avatar">&#128993;</div>
      <div><div class="phil-name">Kant</div><div class="phil-tradition">Synthetic / Duty</div></div>
    </div>
    <div class="phil-body"></div>
    <div class="phil-status">&#9675; Waiting</div>
  </div>

  <div id="phil-hegel" class="phil-card phil-hegel">
    <div class="phil-header">
      <div class="phil-avatar">&#128308;</div>
      <div><div class="phil-name">Hegel</div><div class="phil-tradition">Dialectical</div></div>
    </div>
    <div class="phil-body"></div>
    <div class="phil-status">&#9675; Waiting</div>
  </div>

  <div id="phil-singer" class="phil-card phil-singer">
    <div class="phil-header">
      <div class="phil-avatar">&#128995;</div>
      <div><div class="phil-name">Singer</div><div class="phil-tradition">Pragmatist</div></div>
    </div>
    <div class="phil-body"></div>
    <div class="phil-status">&#9675; Waiting</div>
  </div>
</div>

<div id="inject-bar" class="inject-bar" style="display:none;">
  <div class="inject-label">Your Voice &rarr;</div>
  <input id="inject-input" type="text" placeholder="">
  <button id="inject-btn">Inject</button>
  <button id="skip-btn">Continue to Round 1</button>
</div>

<div id="synthesis" class="synthesis" style="display:none;">
  <div class="synthesis-card">
    <h3>&#9878;&#65039; Final Policy &mdash; Coordinator Synthesis</h3>
    <div id="synthesis-body" class="content"></div>
  </div>
</div>

<div class="footer">
  Powered by OpenAI &middot; Churchman's Design of Inquiring Systems (1971) &middot; Delphi Method
</div>

<script>
(function() {
  var state = {
    topic: '',
    round: -1,
    positions: { round0: {}, round1: {}, round2: {} },
    injections: [],
    philosopherState: {},
  };
  var PHIL_ORDER = ['leibnitz', 'locke', 'kant', 'hegel', 'singer'];

  async function streamDebate(philosopher, round, onToken, onDone, onError) {
    var body = {
      philosopher: philosopher,
      round: round,
      topic: state.topic,
      priorRoundPositions: round === 0 ? {} : state.positions['round' + (round - 1)],
      sameRoundPositionsSoFar: {},
      injections: state.injections,
    };
    var currentRoundKey = 'round' + round;
    if (state.positions[currentRoundKey]) {
      body.sameRoundPositionsSoFar = Object.assign({}, state.positions[currentRoundKey]);
    }
    try {
      var res = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var fullText = '';
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line.startsWith('data: ')) continue;
          var data = line.slice(6);
          if (data === '[DONE]') { onDone(fullText); return; }
          try {
            var parsed = JSON.parse(data);
            if (parsed.error) { onError(parsed.error); return; }
            if (parsed.token) { fullText += parsed.token; onToken(parsed.token); }
          } catch (e) {}
        }
      }
      onDone(fullText);
    } catch (err) { onError(err.message); }
  }

  function setPhilState(phil, status) {
    state.philosopherState[phil] = status;
    var card = document.getElementById('phil-' + phil);
    var statusEl = card.querySelector('.phil-status');
    if (status === 'streaming') statusEl.textContent = '\u27F3 Streaming...';
    else if (status === 'complete') statusEl.textContent = '\u2713 Complete';
    else if (status === 'error') {
      statusEl.innerHTML = '\u2717 Error <button onclick="window._retryPhil(\'' + phil + '\')">Retry</button>';
    }
    else if (status === 'idle') statusEl.textContent = '\u25CC Waiting';
  }

  function appendToCard(phil, token) {
    var body = document.getElementById('phil-' + phil).querySelector('.phil-body');
    var cursor = body.querySelector('.cursor');
    if (!cursor) {
      cursor = document.createElement('span');
      cursor.className = 'cursor';
      body.appendChild(cursor);
    }
    cursor.insertAdjacentText('beforebegin', token);
    body.scrollTop = body.scrollHeight;
  }

  function clearCard(phil) {
    document.getElementById('phil-' + phil).querySelector('.phil-body').innerHTML = '';
  }

  function updateRoundPills() {
    var pills = document.querySelectorAll('.round-pill');
    var currentIdx = state.round === 'synthesis' ? 3 : state.round;
    pills.forEach(function(pill, i) {
      pill.className = 'round-pill ' + (i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending');
    });
  }

  function showInjectionBar(nextRound) {
    var bar = document.getElementById('inject-bar');
    bar.style.display = 'flex';
    var input = document.getElementById('inject-input');
    input.value = '';
    input.placeholder = 'Inject a perspective before Round ' + nextRound + ' (e.g., "What about environmental impact?")';
    document.getElementById('skip-btn').textContent = 'Continue to Round ' + nextRound;
    document.getElementById('inject-btn').onclick = function() {
      var text = input.value.trim();
      if (text) state.injections.push(text);
      bar.style.display = 'none';
      runRound(nextRound);
    };
    document.getElementById('skip-btn').onclick = function() {
      bar.style.display = 'none';
      runRound(nextRound);
    };
  }

  async function runSynthesis() {
    state.round = 'synthesis';
    updateRoundPills();
    var synthEl = document.getElementById('synthesis');
    synthEl.style.display = 'block';
    var synthBody = document.getElementById('synthesis-body');
    synthBody.innerHTML = '<span class="cursor"></span>';
    try {
      var res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: state.positions, topic: state.topic }),
      });
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line.startsWith('data: ')) continue;
          var data = line.slice(6);
          if (data === '[DONE]') {
            var cursor = synthBody.querySelector('.cursor');
            if (cursor) cursor.remove();
            return;
          }
          try {
            var parsed = JSON.parse(data);
            if (parsed.token) {
              var cur = synthBody.querySelector('.cursor');
              if (cur) cur.insertAdjacentText('beforebegin', parsed.token);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      synthBody.textContent = 'Error during synthesis. Please try again.';
    }
  }

  async function runRound(round) {
    state.round = round;
    updateRoundPills();
    var roundKey = 'round' + round;
    state.positions[roundKey] = {};
    if (round === 0) {
      var promises = PHIL_ORDER.map(function(phil) {
        setPhilState(phil, 'streaming');
        return streamDebate(
          phil, 0,
          function(token) { appendToCard(phil, token); },
          function(fullText) {
            state.positions[roundKey][phil] = fullText;
            setPhilState(phil, 'complete');
            var cur = document.getElementById('phil-' + phil).querySelector('.cursor');
            if (cur) cur.remove();
          },
          function() { setPhilState(phil, 'error'); }
        );
      });
      await Promise.all(promises);
    } else {
      for (var j = 0; j < PHIL_ORDER.length; j++) {
        var phil = PHIL_ORDER[j];
        setPhilState(phil, 'streaming');
        clearCard(phil);
        await (function(p) {
          return streamDebate(
            p, round,
            function(token) { appendToCard(p, token); },
            function(fullText) {
              state.positions[roundKey][p] = fullText;
              setPhilState(p, 'complete');
              var cur = document.getElementById('phil-' + p).querySelector('.cursor');
              if (cur) cur.remove();
            },
            function() { setPhilState(p, 'error'); }
          );
        })(phil);
      }
    }
    if (round < 2) {
      showInjectionBar(round + 1);
    } else {
      runSynthesis();
    }
  }

  window._retryPhil = function(phil) {
    var round = state.round;
    var roundKey = 'round' + round;
    setPhilState(phil, 'streaming');
    clearCard(phil);
    streamDebate(
      phil, round,
      function(token) { appendToCard(phil, token); },
      function(fullText) {
        state.positions[roundKey][phil] = fullText;
        setPhilState(phil, 'complete');
        var cur = document.getElementById('phil-' + phil).querySelector('.cursor');
        if (cur) cur.remove();
      },
      function() { setPhilState(phil, 'error'); }
    );
  };

  document.getElementById('start-btn').addEventListener('click', function() {
    var select = document.getElementById('topic-select');
    var custom = document.getElementById('topic-custom');
    state.topic = custom.value.trim() || select.value;
    if (!state.topic || state.topic === '') return;
    state.positions = { round0: {}, round1: {}, round2: {} };
    state.injections = [];
    state.philosopherState = {};
    PHIL_ORDER.forEach(function(p) { clearCard(p); setPhilState(p, 'idle'); });
    document.getElementById('synthesis').style.display = 'none';
    document.getElementById('inject-bar').style.display = 'none';
    var btn = document.getElementById('start-btn');
    btn.disabled = true;
    runRound(0).finally(function() { btn.disabled = false; });
  });
})();
</script>

</body>
</html>`;
