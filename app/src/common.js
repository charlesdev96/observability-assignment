
// Load OpenTelemetry before Express and other instrumented libraries.
const { shutdownTelemetry } = require('./tracing');

const express = require('express');
const pino = require('pino');
const client = require('prom-client');

function createService(name) {
  // ---- Logging: JSON logs collected by Alloy and sent to Loki ----
  const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: name },
    formatters: { level: (label) => ({ level: label }) },
  });

  // ---- Metrics: the RED method (Rate, Errors, Duration) ----
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  const httpRequests = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
  });

  const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  // Health + metrics endpoints are registered BEFORE the metrics middleware.
  app.get('/healthz', (_req, res) => res.json({ status: 'ok', service: name }));

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use((req, res, next) => {
    const end = httpDuration.startTimer();

    res.on('finish', () => {
      const route = req.route ? req.baseUrl + req.route.path : 'unmatched';

      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      };

      httpRequests.inc(labels);
      end(labels);

      const lvl = res.statusCode >= 500 ? 'error' : 'info';

      logger[lvl](
        { method: req.method, route, status: res.statusCode },
        'request completed',
      );
    });

    next();
  });

  return { app, logger };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function chaosConfig() {
  return {
    failureRate: Number(process.env.FAILURE_RATE || 0),
    latencyMs: Number(process.env.LATENCY_MS || 0),
  };
}

function start(app, logger, name, defaultPort) {
  if (process.env.CRASH_ON_START === 'true') {
    logger.error('CRASH_ON_START is true - exiting on purpose');
    setTimeout(() => process.exit(1), 200);
    return;
  }

  const port = Number(process.env.PORT || defaultPort);

  const server = app.listen(port, () => {
    logger.info({ port }, `${name} listening`);
  });

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, 'shutting down');

    // Stop accepting new requests.
    server.close();

    // Flush pending traces before exiting.
    const forceExit = setTimeout(() => process.exit(0), 5000);
    forceExit.unref();

    try {
      await shutdownTelemetry();
    } catch (err) {
      logger.error({ err: err.message }, 'OpenTelemetry shutdown failed');
    } finally {
      clearTimeout(forceExit);
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { createService, sleep, chaosConfig, start };
