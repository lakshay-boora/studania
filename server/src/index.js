'use strict';
/**
 * Angvey API server
 * ------------------
 * Zero-dependency-beyond-Express Node server that serves:
 *   • the REST API under /api
 *   • the built React app from web/dist (single-box production deploy)
 *
 * Tier-1 retrieval works with no GPU and no API keys. Set OLLAMA_URL to
 * enable the self-hosted open-weights LLM (Qwen 3 / Gemma / DeepSeek).
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const config = require('./config');
const { loadKnowledge } = require('./data/knowledge');
const { DoubtEngine } = require('./engine/doubtEngine');
const { JsonStore } = require('./store/store');

const chatRoutes = require('./routes/chat');
const practiceRoutes = require('./routes/practice');
const progressRoutes = require('./routes/progress');
const plannerRoutes = require('./routes/planner');

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
const app = express();
const knowledge = loadKnowledge();
const engine = new DoubtEngine({ knowledge, config });
const store = new JsonStore();

app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '200kb' }));

// Anonymous, device-scoped user identity (header set by the web client).
function requireUser(req, res, next) {
  const raw = req.header('x-angvey-user') || '';
  const id = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  req.userId = id || 'anon';
  store.getOrCreateUser(req.userId);
  next();
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    brand: 'Angvey',
    tagline: 'हर doubt का जवाब, अपनी भाषा में',
    engine: engine.stats,
    uptimeSec: Math.round(process.uptime()),
  });
});

// Brand/marketing copy used by the landing page (single source of truth).
app.get('/api/brand', (_req, res) => {
  res.json({
    name: 'Angvey',
    tagline: 'हर doubt का जवाब, अपनी भाषा में',
    subline: 'Voice-first AI doubt saathi for JEE, NEET & UPSC — in Hinglish.',
    limits: { freeDailyDoubts: config.freeDailyDoubts },
    plans: [
      { id: 'sahaj', name: 'Sahaj', price: '₹0', period: 'forever', features: ['10 doubts/day', '3 voice doubts/day', 'Practice Arena (limited)'] },
      { id: 'sahaj_plus', name: 'Sahaj+', price: '₹49', period: 'month', features: ['Unlimited text doubts', '50 voice doubts/day', 'Full PYQ practice', 'Revision Planner'], highlight: true },
      { id: 'pro', name: 'Pro', price: '₹99', period: 'month', features: ['Everything in Sahaj+', 'Unlimited voice', 'JEE Advanced depth', 'Test analytics'] },
    ],
  });
});

app.use('/api/chat', chatRoutes({ engine, store, requireUser, config }));
app.use('/api/practice', practiceRoutes({ store, requireUser }));
app.use('/api/progress', progressRoutes({ store, requireUser }));
app.use('/api/planner', plannerRoutes({ store, requireUser }));

// Topics browser (used by the chat sidebar / dashboard)
app.get('/api/topics', (req, res) => {
  const { subject } = req.query;
  const list = engine.topicsBySubject(subject).map((k) => ({
    id: k.id,
    subject: k.subject,
    topic: k.topic,
    exams: k.exams,
    source: k.source,
  }));
  res.json({ count: list.length, topics: list });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route' }));

// ---------------------------------------------------------------------------
// Static frontend (production build)
// ---------------------------------------------------------------------------
const distDir = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  app.get('/', (_req, res) => {
    res.type('html').send(`
      <div style="font-family:system-ui;padding:48px;max-width:640px;margin:auto">
        <h1 style="color:#3B2A8C">Angvey API is running</h1>
        <p>The web app has not been built yet. Run <code>cd web &amp;&amp; npm install &amp;&amp; npm run build</code>,
        or use <code>npm run dev</code> in <code>web/</code> for the hot-reload dev server.</p>
        <p><a href="/api/health">/api/health</a> · <a href="/api/topics">/api/topics</a></p>
      </div>`);
  });
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const server = app.listen(config.port, config.host, () => {
  console.log('');
  console.log('  ✦ ANGVEY — vernacular AI doubt saathi');
  console.log(`  ➜ API      http://localhost:${config.port}/api/health`);
  console.log(`  ➜ KB       ${engine.stats.entries} entries across ${Object.keys(engine.stats.subjects).length} subjects`);
  console.log(`  ➜ Tier 2   ${engine.stats.tier2}${engine.stats.tier2 === 'enabled' ? ` (${config.ollamaModel})` : ' — set OLLAMA_URL to enable open-weights LLM'}`);
  console.log('');
});

function shutdown(sig) {
  console.log(`\n[angvey] ${sig} received — flushing store and exiting.`);
  store.flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = { app, server };
