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
<html><body><h1>Inquiring Agents</h1><p>Coming soon...</p></body></html>`;
