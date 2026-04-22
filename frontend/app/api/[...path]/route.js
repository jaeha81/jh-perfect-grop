const BACKEND =
  process.env.INTERNAL_BACKEND_URL ||
  'http://127.0.0.1:8000';

async function proxy(request, { params }) {
  const path = (await params).path.join('/');
  const url = `${BACKEND}/api/${path}`;

  const init = {
    method: request.method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const upstream = await fetch(url, init);

  const contentType = upstream.headers.get('Content-Type') || 'application/json';

  // SSE streaming passthrough
  if (contentType.includes('text/event-stream')) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const data = await upstream.text();
  return new Response(data, {
    status: upstream.status,
    headers: { 'Content-Type': contentType },
  });
}

export const GET = proxy;
export const POST = proxy;
