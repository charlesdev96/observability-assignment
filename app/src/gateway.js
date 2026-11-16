// gateway: the public entry point. It forwards requests to the orders service.
const { createService, sleep, chaosConfig, start } = require('./common');
const { app, logger } = createService('gateway');

const ORDERS_URL = process.env.ORDERS_URL || 'http://orders:3002';

app.get('/', (_req, res) => res.json({ service: 'gateway', try: ['POST /api/checkout', 'GET /api/orders'] }));

app.post('/api/checkout', async (req, res) => {
  const { failureRate, latencyMs } = chaosConfig();
  if (latencyMs > 0) await sleep(latencyMs);
  if (Math.random() < failureRate) {
    logger.error('gateway failed on purpose');
    return res.status(500).json({ error: 'gateway failed' });
  }
  try {
    const r = await fetch(`${ORDERS_URL}/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(8000),
    });
    const body = await r.json();
    res.status(r.ok ? 200 : 502).json(r.ok ? body : { error: 'checkout failed', detail: body });
  } catch (err) {
    logger.error({ err: err.message }, 'checkout failed');
    res.status(502).json({ error: 'orders service unreachable' });
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    const r = await fetch(`${ORDERS_URL}/orders`, { signal: AbortSignal.timeout(5000) });
    res.status(r.status).json(await r.json());
  } catch (err) {
    logger.error({ err: err.message }, 'could not list orders');
    res.status(502).json({ error: 'orders service unreachable' });
  }
});

start(app, logger, 'gateway', 3001);
