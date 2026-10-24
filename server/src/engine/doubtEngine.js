'use strict';
/**
 * Angvey > engine > doubtEngine
 *
 * The two-tier orchestrator:
 *   Tier 1 — instant bilingual retrieval over the curated KB (default, ₹0)
 *   Tier 2 — self-hosted open-weights LLM (optional, via OLLAMA_URL)
 *
 * Every response carries: the answer (in the student's language mix),
 * step-by-step working, NCERT source citation, related follow-ups and a
 * confidence signal — exactly what the research says exam students need.
 */

const { detectLanguage, normalizeTokens } = require('./hinglish');
const { Retriever } = require('./retriever');
const { LLMAdapter } = require('./llmAdapter');

// Warm, senior-mentor style intros — Hinglish by design (brand voice).
const INTROS = {
  hinglish: [
    'Arre, classic doubt! Dekh, ise aise samajh —',
    'Bahut poocha jaane wala question hai. Chal step-by-step —',
    'Solid question! Ye concept clear kar le, exam mein pakka aata hai —',
    'Ye toh NCERT ka core concept hai. Sun —',
  ],
  en: [
    'Great question — here is the clean way to think about it:',
    'This one shows up in exams all the time. Step by step:',
    'Core concept. Let me break it down —',
  ],
  hi: [
    'बहुत अच्छा प्रश्न! चलिए कदम-दर-कदम समझते हैं —',
    'यह परीक्षा में बार-बार पूछा जाने वाला सिद्धांत है। ध्यान से देखिए —',
    'NCERT का मूल सिद्धांत। आइए समझें —',
  ],
};

const FALLBACKS = {
  hinglish:
    'Hmm, ye doubt main abhi apne notes mein dhoondh nahi paaya 🙏\n\n' +
    'Do baatein kar sakte hain:\n' +
    '1. Question ko thoda aur simple words mein likho — jaise "Newton second law batao" ya "mole concept samjhao"\n' +
    '2. Ye topic Practice Arena mein try karo — wahan se directly doubt bhi bhej sakte ho\n\n' +
    'Main in topics mein abhi bhi expert hoon: Physics, Chemistry, Maths, Biology (NCERT), aur UPSC GK. Try karo! 💪',
  en:
    "I couldn't find this one in my verified notes yet 🙏\n\n" +
    'Try rephrasing the doubt simply (e.g. "explain Newton second law" or "mole concept"), ' +
    'or try the topic in the Practice Arena.\n\n' +
    'My strong areas: Physics, Chemistry, Maths, Biology (NCERT-accurate) and UPSC GK.',
  hi:
    'यह प्रश्न मैं अभी अपने सत्यापित नोट्स में नहीं ढूंढ पाया 🙏\n\n' +
    'प्रश्न को थोड़े सरल शब्दों में लिखकर पुनः भेजें, या Practice Arena में यह टॉपिक आज़माएँ।\n\n' +
    'मेरे प्रबल विषय: भौतिकी, रसायन, गणित, जीव विज्ञान (NCERT) और UPSC GK।',
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

class DoubtEngine {
  constructor({ knowledge, config }) {
    this.retriever = new Retriever(knowledge);
    this.knowledge = knowledge;
    this.llm = new LLMAdapter({
      baseUrl: config.ollamaUrl,
      model: config.ollamaModel,
    });
    this.threshold = config.matchThreshold;
    this.byTopic = new Map(knowledge.map((k) => [k.id, k]));
  }

  get stats() {
    const subjects = {};
    for (const k of this.knowledge) subjects[k.subject] = (subjects[k.subject] || 0) + 1;
    return {
      entries: this.knowledge.length,
      subjects,
      tier2: this.llm.available ? 'enabled' : 'retrieval-only',
    };
  }

  _related(entry, n = 3) {
    const same = this.knowledge.filter(
      (k) => k.subject === entry.subject && k.id !== entry.id
    );
    const scored = same.map((k) => {
      const a = new Set(normalizeTokens((k.keywords || []).join(' ')));
      const b = new Set(normalizeTokens((entry.keywords || []).join(' ')));
      let overlap = 0;
      for (const t of a) if (b.has(t)) overlap++;
      return { k, overlap };
    });
    scored.sort((x, y) => y.overlap - x.overlap);
    return scored.slice(0, n).map(({ k }) => ({ id: k.id, topic: k.topic }));
  }

  /** Compose the Tier-1 bilingual answer object for an API response. */
  _compose(entry, lang) {
    const l = lang === 'auto' ? detectLanguageSafe(entry) : lang;
    const useHi = l === 'hi' || l === 'hinglish';
    const intro = pick(INTROS[l] || INTROS.hinglish);

    const answer = useHi ? entry.answer.hi : entry.answer.en;
    const steps = (entry.steps || []).map((s, i) => ({
      n: i + 1,
      text: useHi ? s.hi : s.en,
    }));
    const tip = useHi ? entry.tip?.hi : entry.tip?.en;

    const lines = [];
    lines.push(intro);
    lines.push('');
    lines.push(answer);
    if (steps.length) {
      lines.push('');
      lines.push(useHi ? '**कदम-दर-कदम (step-by-step):**' : '**Step-by-step:**');
      for (const s of steps) lines.push(`${s.n}. ${s.text}`);
    }
    if (tip) {
      lines.push('');
      lines.push(useHi ? `💡 **Exam Tip:** ${tip}` : `💡 **Exam Tip:** ${tip}`);
    }
    lines.push('');
    lines.push(
      useHi
        ? `📖 स्रोत: ${entry.source}`
        : `📖 Source: ${entry.source}`
    );

    return {
      text: lines.join('\n'),
      answer: { plain: answer, steps, tip: tip || null },
      subject: entry.subject,
      topic: entry.topic,
      exams: entry.exams,
      source: entry.source,
      related: this._related(entry),
      engine: 'tier1-retrieval',
      confidence: 'verified',
    };
  }

  /**
   * Main entry point.
   * @param {object} p { text, lang ('auto'|'en'|'hi'|'hinglish'), history }
   */
  async solve({ text, lang = 'auto', history = [] }) {
    const detected = detectLanguage(text);
    const effectiveLang = lang === 'auto' ? detected : lang;

    const { tokens, ranked, best } = this.retriever.retrieve(text, 5, this.threshold);

    if (best) {
      return { ...this._compose(best.entry, effectiveLang), matchedTokens: tokens, score: Number(best.score.toFixed(3)) };
    }

    // Tier 2 — self-hosted open-weights LLM with RAG context from near misses
    if (this.llm.available) {
      const context = ranked
        .filter((r) => r.score > 0.12)
        .slice(0, 3)
        .map((r) => `• ${r.entry.topic}: ${r.entry.answer.en}`)
        .join('\n');
      const llmText = await this.llm.ask({ question: text, history, context, lang: effectiveLang });
      if (llmText) {
        return {
          text: llmText,
          answer: { plain: llmText, steps: [], tip: null },
          subject: ranked[0]?.entry.subject || 'general',
          topic: ranked[0]?.entry.topic || 'Open doubt',
          exams: [],
          source: 'Angvey open-weights model (Qwen via Ollama) + KB context',
          related: (ranked[0] ? this._related(ranked[0].entry, 2) : []),
          engine: 'tier2-openweights-llm',
          confidence: 'llm',
        };
      }
    }

    // Graceful fallback — never leave a student hanging
    return {
      text: FALLBACKS[effectiveLang] || FALLBACKS.hinglish,
      answer: { plain: FALLBACKS[effectiveLang] || FALLBACKS.hinglish, steps: [], tip: null },
      subject: 'general',
      topic: null,
      exams: [],
      source: null,
      related: [],
      engine: 'fallback',
      confidence: 'low',
      suggestions: this._suggestTopics(ranked),
    };
  }

  _suggestTopics(ranked) {
    const pool = ranked.length ? ranked.map((r) => r.entry) : this.knowledge;
    const picks = pool.slice(0, 6);
    return picks.map((k) => ({ id: k.id, topic: k.topic, subject: k.subject }));
  }

  /** Topic drill-down used by the Practice Arena & Planner. */
  getEntry(id) {
    return this.byTopic.get(id) || null;
  }

  topicsBySubject(subject) {
    return this.knowledge.filter((k) => !subject || k.subject === subject);
  }
}

function detectLanguageSafe(entry) {
  return 'hinglish'; // brand default
}

module.exports = { DoubtEngine };
