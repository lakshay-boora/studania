'use strict';
/**
 * Angvey > routes > progress
 * Analytics that power the Dashboard and the Revision Planner.
 */

const express = require('express');

function buildStats(store, userId) {
  const attempts = store.find('attempts', (a) => a.userId === userId);
  const chats = store.find('chats', (c) => c.userId === userId && c.role === 'user');
  const user = store.getOrCreateUser(userId);

  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;

  const bySubject = {};
  for (const a of attempts) {
    const s = (bySubject[a.subject] ||= { subject: a.subject, attempted: 0, correct: 0, topics: {} });
    s.attempted++;
    if (a.correct) s.correct++;
    const t = (s.topics[a.topic] ||= { topic: a.topic, attempted: 0, correct: 0 });
    t.attempted++;
    if (a.correct) t.correct++;
  }
  const subjects = Object.values(bySubject).map((s) => ({
    subject: s.subject,
    attempted: s.attempted,
    correct: s.correct,
    accuracy: s.attempted ? Math.round((s.correct / s.attempted) * 100) : 0,
    topics: Object.values(s.topics).map((t) => ({
      ...t,
      accuracy: t.attempted ? Math.round((t.correct / t.attempted) * 100) : 0,
    })),
  }));

  // Weak topics: lowest accuracy with at least 1 attempt
  const weakTopics = subjects
    .flatMap((s) => s.topics.map((t) => ({ ...t, subject: s.subject })))
    .filter((t) => t.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  // last 7 days activity
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const dayAttempts = attempts.filter((a) => (a.createdAt || '').slice(0, 10) === d);
    days.push({
      date: d,
      attempted: dayAttempts.length,
      correct: dayAttempts.filter((a) => a.correct).length,
    });
  }

  // per-topic doubt counts from chat metadata
  const doubtsBySubject = {};
  for (const c of chats) {
    const s = c.meta?.subject;
    if (s) doubtsBySubject[s] = (doubtsBySubject[s] || 0) + 1;
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      exam: user.exam,
      plan: user.plan,
      streak: user.streak || 0,
      doubtsToday: user.doubtsToday || 0,
    },
    totals: {
      attempts: total,
      correct,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      doubtsAsked: chats.length,
    },
    subjects,
    weakTopics,
    last7Days: days,
    doubtsBySubject,
  };
}

module.exports = function progressRoutes({ store, requireUser }) {
  const router = express.Router();

  router.get('/', requireUser, (req, res) => {
    res.json(buildStats(store, req.userId));
  });

  // PATCH /api/progress/profile { name, exam }
  router.patch('/profile', requireUser, (req, res) => {
    const { name, exam } = req.body || {};
    const patch = {};
    if (typeof name === 'string' && name.trim()) patch.name = name.trim().slice(0, 40);
    if (typeof exam === 'string' && ['JEE', 'NEET', 'UPSC'].includes(exam)) patch.exam = exam;
    store.update('users', (u) => u.id === req.userId, patch);
    const user = store.getOrCreateUser(req.userId);
    res.json({ user: { id: user.id, name: user.name, exam: user.exam, plan: user.plan, streak: user.streak } });
  });

  return router;
};

module.exports.buildStats = buildStats;
