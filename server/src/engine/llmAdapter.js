'use strict';
/**
 * Angvey > engine > llmAdapter
 *
 * Optional Tier-2: talks to any OpenAI-compatible endpoint — by design this
 * is a SELF-HOSTED OPEN-WEIGHTS model (Ollama / vLLM / llama.cpp server)
 * running Qwen / Gemma / DeepSeek. No closed APIs, no keys, no data leaving
 * Indian servers. Degrades gracefully to Tier-1 when unavailable.
 */

const https = require('https');
const http = require('http');

const SYSTEM_PROMPT = `You are Vey, the bilingual (Hinglish/Hindi/English) AI study saathi inside the Angvey app for Indian JEE, NEET and UPSC aspirants.
Rules:
- Reply in the SAME language mix the student used (Hinglish stays Hinglish).
- Explain step-by-step like a friendly senior who cracked the exam.
- Stay strictly within NCERT/JEE/NEET/UPSC syllabus. Use exact NCERT phrasing for biology/chemistry facts.
- Show formulas clearly. End with one short revision tip.
- Never mock a wrong premise; gently correct it.
- Keep answers under 250 words unless asked for detail.`;

function postJson(urlStr, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(urlStr); } catch (e) { return reject(new Error('bad URL')); }
    const mod = url.protocol === 'https:' ? https : http;
    const data = JSON.stringify(body);
    const req = mod.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          try { resolve(JSON.parse(buf)); } catch { resolve({ raw: buf }); }
        });
      }
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

class LLMAdapter {
  constructor({ baseUrl, model = 'qwen3:8b', timeoutMs = 30000 } = {}) {
    this.baseUrl = (baseUrl || '').replace(/\/+$/, '');
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  get available() {
    return Boolean(this.baseUrl);
  }

  /**
   * Ask the open-weights model. `context` carries retrieved NCERT-grounded
   * passages so answers stay syllabus-accurate (RAG).
   */
  async ask({ question, history = [], context = '', lang = 'hinglish' }) {
    if (!this.available) return null;
    const userContent = context
      ? `Reference (verified NCERT-grounded notes):\n${context}\n\nStudent's doubt: ${question}`
      : question;

    const body = {
      model: this.model,
      stream: false,
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\nPreferred reply language: ${lang}.` },
        ...history.slice(-6).map((m) => ({ role: m.role, content: m.text })),
        { role: 'user', content: userContent },
      ],
      options: { temperature: 0.4, num_predict: 700 },
    };

    try {
      const res = await postJson(`${this.baseUrl}/api/chat`, body, this.timeoutMs);
      const text = res?.message?.content || res?.choices?.[0]?.message?.content || '';
      return text ? text.trim() : null;
    } catch {
      return null; // graceful degradation to Tier-1
    }
  }
}

module.exports = { LLMAdapter, SYSTEM_PROMPT };
