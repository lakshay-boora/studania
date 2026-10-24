'use strict';
/**
 * Angvey engine regression suite — run with `npm test` (no test framework).
 * Guards the two things that make the product work:
 *   1. Hinglish/Devanagari normalization
 *   2. Retrieval precision (real doubts match, random queries don't)
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadKnowledge } = require('../src/data/knowledge');
const { DoubtEngine } = require('../src/engine/doubtEngine');
const { detectLanguage, normalizeTokens } = require('../src/engine/hinglish');

const knowledge = loadKnowledge();
const engine = new DoubtEngine({
  knowledge,
  config: { ollamaUrl: '', ollamaModel: 'test', matchThreshold: 0.34 },
});

test('knowledge base loads and is bilingual', () => {
  assert.ok(knowledge.length >= 30, 'expected at least 30 curated entries');
  for (const entry of knowledge) {
    assert.ok(entry.id && entry.subject && entry.topic, `entry missing fields: ${entry.id}`);
    assert.ok(entry.answer?.en && entry.answer?.hi, `entry not bilingual: ${entry.id}`);
    assert.ok(entry.source, `entry missing NCERT source: ${entry.id}`);
  }
});

test('language detection', () => {
  assert.equal(detectLanguage('न्यूटन का नियम क्या है'), 'hi');
  assert.equal(detectLanguage('newton ka doosra niyam kya hai'), 'hinglish');
  assert.equal(detectLanguage('what is the second law of motion'), 'en');
});

test('hinglish normalization strips glue words', () => {
  const tokens = normalizeTokens('Newton ka doosra niyam kya hai');
  assert.ok(tokens.includes('newton'));
  assert.ok(tokens.includes('second'), 'doosra should normalize to second');
  assert.ok(tokens.includes('law'), 'niyam should normalize to law');
  assert.ok(!tokens.includes('ka'));
});

const MATCHES = [
  ['Newton ka doosra niyam kya hai', "Newton's Second Law of Motion"],
  ['न्यूटन का दूसरा नियम समझाओ', "Newton's Second Law of Motion"],
  ['mole concept', 'Mole Concept'],
  ['ph kya hai', 'Acids, Bases and pH'],
  ['hybridisation samjhao', 'Chemical Bonding (Hybridisation & VSEPR)'],
  ['gibbs free energy', 'Thermodynamics: Enthalpy, Entropy & Gibbs Energy'],
  ['integration by parts', 'Integration Techniques'],
  ['dna replication', 'DNA Replication'],
  ['fundamental rights', 'Fundamental Rights (Part III)'],
  ['niti aayog', 'Planning in India & NITI Aayog'],
];

for (const [query, expectedTopic] of MATCHES) {
  test(`retrieval: "${query}"`, async () => {
    const res = await engine.solve({ text: query });
    assert.equal(res.engine, 'tier1-retrieval');
    assert.equal(res.topic, expectedTopic);
  });
}

const NO_MATCHES = [
  'how to make friends in college',
  'best phone under 20000',
  'who won the cricket match',
  'write a poem about rain',
];

for (const query of NO_MATCHES) {
  test(`no false positive: "${query}"`, async () => {
    const res = await engine.solve({ text: query });
    assert.notEqual(res.engine, 'tier1-retrieval');
  });
}

test('tier-1 answers include steps, source and related topics', async () => {
  const res = await engine.solve({ text: 'photosynthesis light reaction', lang: 'hinglish' });
  assert.equal(res.engine, 'tier1-retrieval');
  assert.ok(res.answer.steps.length > 0);
  assert.match(res.source, /NCERT/);
  assert.ok(res.related.length > 0);
  assert.ok(res.text.includes('📖'));
});

test('English query yields English answer', async () => {
  const res = await engine.solve({ text: 'what is mole concept', lang: 'auto' });
  assert.equal(res.topic, 'Mole Concept');
  assert.match(res.answer.plain, /One mole is the amount of substance/);
});

test('unknown doubt falls back gracefully', async () => {
  const res = await engine.solve({ text: 'zzzz qqqq xxxx' });
  assert.equal(res.engine, 'fallback');
  assert.ok(res.text.length > 40);
});
