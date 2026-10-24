'use strict';
/**
 * Angvey > routes > practice
 * PYQ-pattern MCQ practice. Answers are never sent with the question —
 * correctness is graded server-side and every attempt feeds the analytics
 * that drive the Revision Planner.
 */

const express = require('express');
const questions = require('../data/questions.json');

module.exports = function practiceRoutes({ store, requireUser }) {
  const router = express.Router();
  const byId = new Map(questions.map((q) => [q.id, q]));

  // GET /api/practice/subjects — subject cards with counts
  router.get('/subjects', (_req, res) => {
    const map = new Map();
    for (const q of questions) {
      const s = map.get(q.subject) || { subject: q.subject, total: 0, topics: new Set() };
      s.total++;
      s.topics.add(q.topic);
      map.set(q.subject, s);
    }
    res.json({
      subjects: [...map.values()].map((s) => ({
        subject: s.subject,
        total: s.total,
        topics: [...s.topics],
      })),
      total: questions.length,
    });
  });

  // GET /api/practice/questions?subject=Physics&difficulty=medium&limit=10
  router.get('/questions', (req, res) => {
    const { subject, difficulty, exam } = req.query;
    const limit = Math.min(Number(req.query.limit) || 10, 30);
    let pool = questions;
    if (subject && subject !== 'All') pool = pool.filter((q) => q.subject === subject);
    if (difficulty && difficulty !== 'All') pool = pool.filter((q) => q.difficulty === difficulty);
    if (exam && exam !== 'All') pool = pool.filter((q) => q.exam === exam);

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
    res.json({
      count: shuffled.length,
      questions: shuffled.map((q) => ({
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        exam: q.exam,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
      })),
    });
  });

  // POST /api/practice/answer { questionId, answerIndex }
  router.post('/answer', requireUser, (req, res) => {
    const { questionId, answerIndex } = req.body || {};
    const q = byId.get(questionId);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    const idx = Number(answerIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) {
      return res.status(400).json({ error: 'Invalid answerIndex' });
    }

    const correct = idx === q.answerIndex;
    store.insert('attempts', {
      userId: req.userId,
      questionId,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      chosen: idx,
      correct,
    });

    res.json({
      correct,
      correctIndex: q.answerIndex,
      explanation: q.explanation,
      topic: q.topic,
      subject: q.subject,
    });
  });

  return router;
};
