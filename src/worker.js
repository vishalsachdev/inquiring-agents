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
