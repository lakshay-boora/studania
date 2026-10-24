'use strict';
/**
 * Angvey > server > config
 * Environment-driven configuration. Everything has a sane default so the
 * platform runs with ZERO external dependencies (no GPU, no API keys).
 */

const fs = require('fs');
const path = require('path');

// --- tiny .env loader (no dependency needed) -----------------------------
(function loadDotEnv() {
  for (const candidate of [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ]) {
    try {
      if (!fs.existsSync(candidate)) continue;
      for (const line of fs.readFileSync(candidate, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const key = m[1];
        let val = m[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = val;
      }
    } catch { /* ignore unreadable env files */ }
  }
})();

function env(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

module.exports = {
  port: Number(env('ANGVEY_PORT', 8787)),
  host: env('ANGVEY_HOST', '0.0.0.0'),

  // Optional Tier-2 LLM (Ollama / vLLM / any OpenAI-compatible server).
  // Leave unset to run pure Tier-1 retrieval (zero marginal cost).
  ollamaUrl: env('OLLAMA_URL', ''),          // e.g. http://localhost:11434
  ollamaModel: env('OLLAMA_MODEL', 'qwen3:8b'),

  // Data
  dataDir: path.join(__dirname, '..', 'data'),
  runtimeDir: path.join(__dirname, '..', 'data', 'runtime'),

  // Rate limiting (protects the free tier)
  chatRateLimit: Number(env('ANGVEY_CHAT_RATE_LIMIT', 40)), // requests / minute / IP
  freeDailyDoubts: Number(env('ANGVEY_FREE_DAILY_DOUBTS', 10)),

  // Retrieval tuning
  matchThreshold: Number(env('ANGVEY_MATCH_THRESHOLD', 0.34)),
};
