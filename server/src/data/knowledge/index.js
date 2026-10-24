'use strict';
/**
 * Angvey > data > knowledge
 * Loads and merges the bilingual NCERT-grounded knowledge base.
 * Adding a subject = drop a JSON file in this folder with the same schema.
 */

const fs = require('fs');
const path = require('path');

function loadKnowledge() {
  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const entries = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) entries.push(...parsed);
    } catch (err) {
      console.error(`[angvey] Failed to parse knowledge file ${file}:`, err.message);
    }
  }
  return entries;
}

module.exports = { loadKnowledge };
