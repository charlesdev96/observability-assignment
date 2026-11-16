// orders: creates an order, then asks payments to charge for it.
const { createService, sleep, chaosConfig, start } = require('./common');
const { app, logger } = createService('orders');

const PAYMENTS_URL = process.env.PAYMENTS_URL || 'http://payments:3003';
const orders = []; // in-memory store, enough for a demo
let nextId = 1;

app.post('/orders', async (req, res) => {
  const { failureRate, latencyMs } = chaosConfig();
  if (latencyMs > 0) await sleep(latencyMs);
  if (Math.random() < failureRate) {
    logger.error('orders failed on purpose');
    return res.status(500).json({ error: 'orders failed' });
  }
  const order = { id: nextId++, item: req.body.item || 'book', amount: req.body.amount || 10 };
  try {
    const r = await fetch(`${PAYMENTS_URL}/charge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, amount: order.amount }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error(`payments returned ${r.status}`);
    order.status = 'paid';
  } catch (err) {
    logger.error({ orderId: order.id, err: err.message }, 'could not charge order');
    return res.status(502).json({ error: 'payment problem', orderId: order.id });
  }
  orders.push(order);
  if (orders.length > 100) orders.shift();
  logger.info({ orderId: order.id }, 'order created');
  res.status(201).json(order);
});

app.get('/orders', (_req, res) => res.json(orders.slice(-20)));

start(app, logger, 'orders', 3002);
