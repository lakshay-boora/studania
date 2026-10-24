'use strict';
/**
 * Angvey > routes > chat
 * The Doubt Saathi endpoint. Wraps the two-tier doubt engine and persists
 * conversation history per (anonymous, device-scoped) user.
 */

const express = require('express');

module.exports = function chatRoutes({ engine, store, requireUser, config }) {
  const router = express.Router();

  // Simple in-memory sliding-window rate limit (per IP).
  const hits = new Map();
  function rateLimited(ip) {
    const now = Date.now();
    const windowMs = 60_000;
    const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    list.push(now);
    hits.set(ip, list);
    return list.length > config.chatRateLimit;
  }

  // POST /api/chat { message, lang }
  router.post('/', requireUser, async (req, res) => {
    const { message, lang = 'auto' } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (message.length > 1200) {
      return res.status(400).json({ error: 'Doubt too long — keep it under 1200 characters' });
    }
    if (rateLimited(req.ip)) {
      return res.status(429).json({
        error: 'Thoda ruk jao! 😅 Ek minute mein bahut saare doubts aa gaye — thodi der baad try karo.',
      });
    }

    const user = store.touchUser(req.userId, {});
    const isFree = user.plan === 'sahaj';
    if (isFree && (user.doubtsToday || 0) >= config.freeDailyDoubts) {
      return res.status(402).json({
        error: 'daily_limit_reached',
        message: `Aaj ke ${config.freeDailyDoubts} free doubts poore ho gaye. Sahaj+ (₹49/month) mein unlimited doubts milte hain.`,
        upgrade: { plan: 'sahaj_plus', price: '₹49/month' },
      });
    }

    const history = store
      .find('chats', (c) => c.userId === req.userId && c.role)
      .slice(-8)
      .map((c) => ({ role: c.role, text: c.text }));

    const started = Date.now();
    const result = await engine.solve({ text: message.trim(), lang, history });
    const tookMs = Date.now() - started;

    store.insert('chats', { userId: req.userId, role: 'user', text: message.trim() });
    store.insert('chats', {
      userId: req.userId,
      role: 'assistant',
      text: result.text,
      meta: {
        subject: result.subject,
        topic: result.topic,
        engine: result.engine,
        confidence: result.confidence,
        score: result.score ?? null,
      },
    });
    store.bumpDoubts(req.userId);

    res.json({ ...result, tookMs });
  });

  // GET /api/chat/history?limit=40
  router.get('/history', requireUser, (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const list = store
      .find('chats', (c) => c.userId === req.userId)
      .slice(-limit)
      .map((c) => ({
        id: c.createdAt + Math.random().toString(36).slice(2, 6),
        role: c.role,
        text: c.text,
        meta: c.meta || null,
        at: c.createdAt,
      }));
    res.json({ messages: list });
  });

  // DELETE /api/chat/history
  router.delete('/history', requireUser, (req, res) => {
    const removed = store.remove('chats', (c) => c.userId === req.userId);
    res.json({ removed });
  });

  // GET /api/chat/suggestions — starter doubts for the empty state
  router.get('/suggestions', (_req, res) => {
    res.json({
      suggestions: [
        'Newton ka doosra niyam simple words mein samjhao',
        'Mole concept kya hai? Example ke saath',
        'Nernst equation kaise apply karte hain?',
        'Photosynthesis ka light reaction aur Calvin cycle',
        'Quadratic equation ke roots kaise nikaalte hain?',
        'DPSP aur Fundamental Rights mein difference',
      ],
    });
  });

  return router;
};
