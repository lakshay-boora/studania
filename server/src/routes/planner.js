'use strict';
/**
 * Angvey > routes > planner
 * Spaced-repetition revision plan generated from the student's real
 * performance (weak topics first, then exam-weighted syllabus topics).
 */

const express = require('express');
const { buildStats } = require('./progress');

// 1-3-7-15 spaced repetition ladder (days after first study)
const LADDER = [1, 3, 7, 15];

function planFor(stats, exam) {
  const today = new Date();
  const tasks = [];
  const weak = stats.weakTopics;

  // 1. Weak topics get the earliest slots
  weak.forEach((t, i) => {
    const due = new Date(today.getTime() + LADDER[i % LADDER.length] * 86400000);
    tasks.push({
      id: `weak-${i}`,
      title: `${t.subject}: ${t.topic}`,
      reason: `Accuracy ${t.accuracy}% — target 70%+`,
      kind: 'practice',
      repetitions: i + 1,
      due: due.toISOString().slice(0, 10),
      minutes: 20,
      priority: 'high',
    });
  });

  // 2. Fill remaining days with exam-weighted core topics
  const CORE = {
    JEE: [
      ['Physics', "Newton's Second Law of Motion", 'Concept + 10 numericals'],
      ['Mathematics', 'Quadratic Equations', 'Roots, nature, sum-product'],
      ['Chemistry', 'Mole Concept', 'Stoichiometry drill'],
      ['Physics', 'Projectile Motion', 'Range/height formula sheet'],
      ['Mathematics', 'Integration Techniques', '20 mixed integrals'],
      ['Chemistry', 'Electrochemistry & Nernst Equation', 'Cell EMF numericals'],
    ],
    NEET: [
      ['Biology', 'Photosynthesis', 'Light reaction vs Calvin cycle'],
      ['Biology', 'Human Heart & Cardiac Cycle', 'Diagram + 15 MCQs'],
      ['Biology', 'Mendelian Genetics', 'Punnett square practice'],
      ['Chemistry', 'Chemical Bonding (Hybridisation & VSEPR)', 'Shape prediction drill'],
      ['Physics', 'Ray Optics', 'Lens/mirror numericals'],
      ['Biology', 'Immunity & Vaccines', 'Active vs passive immunity'],
    ],
    UPSC: [
      ['UPSC Polity', 'Fundamental Rights (Part III)', 'Articles 14–32 map'],
      ['UPSC Polity', 'Directive Principles of State Policy (Part IV)', 'FR vs DPSP comparison'],
      ['UPSC Geography', 'Indian Monsoon Mechanism', 'Diagram + El Niño link'],
      ['UPSC Environment', 'Climate Change Conventions', 'UNFCCC → Paris timeline'],
      ['UPSC Economy', 'Planning in India & NITI Aayog', 'Plan-wise one-liners'],
      ['UPSC Polity', 'Indian Parliament & Legislative Process', 'Bill passage flow'],
    ],
  };
  const core = CORE[exam] || CORE.JEE;
  core.forEach(([subject, topic, note], i) => {
    if (tasks.some((t) => t.title === `${subject}: ${topic}`)) return;
    const due = new Date(today.getTime() + ((i % 7) + 1) * 86400000);
    tasks.push({
      id: `core-${i}`,
      title: `${subject}: ${topic}`,
      reason: note,
      kind: 'revision',
      repetitions: 1,
      due: due.toISOString().slice(0, 10),
      minutes: 25,
      priority: 'normal',
    });
  });

  // sort by due date, then priority
  tasks.sort((a, b) => (a.due === b.due ? (a.priority === 'high' ? -1 : 1) : a.due < b.due ? -1 : 1));
  return tasks;
}

module.exports = function plannerRoutes({ store, requireUser }) {
  const router = express.Router();

  router.get('/', requireUser, (req, res) => {
    const user = store.getOrCreateUser(req.userId);
    const stats = buildStats(store, req.userId);
    const tasks = planFor(stats, user.exam);
    const today = new Date().toISOString().slice(0, 10);
    res.json({
      exam: user.exam,
      generatedAt: new Date().toISOString(),
      today,
      dueToday: tasks.filter((t) => t.due <= today).length,
      tasks,
      ladder: LADDER,
      note: 'Spaced repetition 1-3-7-15 — weak topics first, then exam-weighted core.',
    });
  });

  // POST /api/planner/complete { taskId, done }
  router.post('/complete', requireUser, (req, res) => {
    const { taskId, done = true } = req.body || {};
    if (!taskId) return res.status(400).json({ error: 'taskId required' });
    const existing = store.findOne('revisions', (r) => r.userId === req.userId && r.taskId === taskId);
    if (existing) {
      store.update('revisions', (r) => r.id === existing.id, { done: Boolean(done), at: new Date().toISOString() });
    } else {
      store.insert('revisions', {
        id: `${req.userId}-${taskId}-${Date.now()}`,
        userId: req.userId,
        taskId,
        done: Boolean(done),
        at: new Date().toISOString(),
      });
    }
    res.json({ ok: true, taskId, done: Boolean(done) });
  });

  return router;
};

module.exports.planFor = planFor;
