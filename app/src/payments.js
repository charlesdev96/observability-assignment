// payments: pretends to charge a card. This is where we inject failures and slowness.
const { createService, sleep, chaosConfig, start } = require('./common');
const { app, logger } = createService('payments');

app.post('/charge', async (req, res) => {
  const { failureRate, latencyMs } = chaosConfig();
  if (latencyMs > 0) await sleep(latencyMs);
  if (Math.random() < failureRate) {
    logger.error({ orderId: req.body.orderId }, 'payment failed');
    return res.status(500).json({ error: 'payment failed' });
  }
  await sleep(10 + Math.random() * 40); // normal processing time
  logger.info({ orderId: req.body.orderId, amount: req.body.amount }, 'payment accepted');
  res.json({ status: 'paid', orderId: req.body.orderId });
});

start(app, logger, 'payments', 3003);
