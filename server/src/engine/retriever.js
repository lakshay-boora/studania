'use strict';
/**
 * Angvey > engine > retriever
 *
 * Tier-1 retrieval over the bilingual knowledge base.
 * TF-IDF scoring with prefix/Levenshtein fuzzy matching so that
 * "nuwtons law", "nyutan niyam" and "न्यूटन का नियम" all find the same entry.
 *
 * Runs in-process, offline, at zero marginal cost — the pricing moat.
 */

const { normalizeTokens } = require('./hinglish');

class Retriever {
  constructor(entries) {
    this.entries = entries;
    this.docs = [];
    this.vocab = new Map(); // token -> df (document frequency)
    this._buildIndex();
  }

  /**
   * Only curated fields are indexed. Indexing full answer text introduced
   * false positives (an English sentence inside an answer matched unrelated
   * queries), so the index stays deliberately tight: keywords + variants +
   * topic + subject.
   */
  _entryText(e) {
    return [e.topic || '', e.subject || ''].join(' ');
  }

  _buildIndex() {
    for (const e of this.entries) {
      const kw = normalizeTokens((e.keywords || []).join(' '));
      const varTokens = normalizeTokens((e.variants || []).join(' '));
      const body = normalizeTokens(this._entryText(e));
      const tf = new Map();
      for (const t of kw) tf.set(t, (tf.get(t) || 0) + 3);      // keywords weigh 3
      for (const t of varTokens) tf.set(t, (tf.get(t) || 0) + 2); // variants weigh 2
      for (const t of body) tf.set(t, (tf.get(t) || 0) + 1);
      this.docs.push({ entry: e, tf, tokens: new Set([...kw, ...varTokens, ...body]) });
      for (const t of new Set([...kw, ...varTokens, ...body])) {
        this.vocab.set(t, (this.vocab.get(t) || 0) + 1);
      }
    }
    this.N = this.docs.length || 1;
    this.vocabTokens = [...this.vocab.keys()];
  }

  _idf(token) {
    const df = this.vocab.get(token) || 0;
    return Math.log(1 + this.N / (1 + df)) + 0.25;
  }

  /** Best fuzzy correspondence of `token` against a document's token set. */
  _fuzzyScore(token, tokenSet) {
    if (tokenSet.has(token)) return 1;
    // fast prefix / suffix pass
    for (const cand of tokenSet) {
      if (token.length >= 4 && cand.length >= 4) {
        if (cand.startsWith(token) || token.startsWith(cand)) {
          return 0.85;
        }
        if (cand.endsWith(token) || token.endsWith(cand)) return 0.7;
      }
    }
    // Levenshtein pass for typos (length-guarded)
    if (token.length >= 5) {
      for (const cand of tokenSet) {
        if (Math.abs(cand.length - token.length) > 2) continue;
        if (cand.length >= 5 && this._levRatio(token, cand) >= 0.8) return 0.7;
      }
    }
    return 0;
  }

  _levRatio(a, b) {
    const la = a.length, lb = b.length;
    if (la === 0) return lb === 0 ? 1 : 0;
    let prev = new Array(lb + 1);
    let cur = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) prev[j] = j;
    for (let i = 1; i <= la; i++) {
      cur[0] = i;
      for (let j = 1; j <= lb; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      [prev, cur] = [cur, prev];
    }
    return 1 - prev[lb] / Math.max(la, lb);
  }

  /**
   * Score all entries for a normalized token list.
   * Returns [{ entry, score }] sorted desc; score is normalized 0..1-ish.
   */
  rank(tokens, limit = 5) {
    if (!tokens.length) return [];
    const results = this.docs.map((doc) => {
      let raw = 0, totalWeight = 0, matchedWeight = 0;
      for (const token of tokens) {
        const weight = this._idf(token);
        totalWeight += weight;
        const fz = this._fuzzyScore(token, doc.tokens);
        if (fz > 0) {
          matchedWeight += weight;
          const tf = doc.tf.get(token) || 1;   // fuzzy hits may have no exact key
          const kwBoost = tf >= 3 ? 1.15 : 1;  // keyword hits weigh more
          raw += weight * tf * fz * kwBoost;
        }
      }
      if (raw <= 0) return { entry: doc.entry, score: 0 };

      // Squash raw TF-IDF into 0..1, then penalise partial coverage so that a
      // random one-word overlap in a long unrelated query cannot pass.
      const squashed = raw / (raw + 2);
      const coverage = totalWeight > 0 ? matchedWeight / totalWeight : 0;
      return { entry: doc.entry, score: squashed * Math.pow(coverage, 1.5) };
    });
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /** Convenience: retrieve with raw text. */
  retrieve(text, limit = 5, threshold = 0.34) {
    const tokens = normalizeTokens(text);
    const ranked = this.rank(tokens, limit);
    return { tokens, ranked, best: ranked[0] && ranked[0].score >= threshold ? ranked[0] : null };
  }
}

module.exports = { Retriever };
