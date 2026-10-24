'use strict';
/**
 * Angvey > engine > hinglish
 *
 * The heart of the vernacular moat: normalizes Hinglish (romanized Hindi),
 * Devanagari Hindi and English student queries into one comparable token
 * space so retrieval works identically across:
 *
 *   "Newton ka doosra niyam kya hai"
 *   "न्यूटन का दूसरा नियम क्या है"
 *   "what is newton's second law"
 *
 * This is deliberately rule-based + dictionary-driven (fast, offline, ₹0)
 * — the same normalization feeds the Tier-2 LLM prompt in production.
 */

// ---------------------------------------------------------------------------
// Romanized Hinglish → English intent/function words
// ---------------------------------------------------------------------------
const HINGLISH_MAP = {
  // interrogatives
  kya: 'what', kyu: 'why', kyun: 'why', kyu: 'why', kyunki: 'because',
  kaise: 'how', kese: 'how', kaisay: 'how', kab: 'when', kaha: 'where',
  kahan: 'where', kahaan: 'where', kaun: 'which', kaunsa: 'which',
  kaunsi: 'which', kitna: 'howmuch', kitne: 'howmuch', kitni: 'howmuch',
  kisko: 'whom', kiske: 'whose',

  // verbs / requests
  batao: 'explain', bata: 'explain', bataa: 'explain', bataao: 'explain',
  batana: 'explain', samjhao: 'explain', samjha: 'explain', samjhaao: 'explain',
  samajhao: 'explain', samjhaa: 'explain', bataie: 'explain', batiye: 'explain',
  likho: 'write', do: 'give', dedo: 'give', karke: 'solve', karo: 'solve',
  solve: 'solve', derive: 'derive', nikalo: 'solve', nikaalo: 'solve',
  sikhaao: 'teach', sikhao: 'teach',

  // copulas / glue (dropped or mapped)
  hai: 'is', hain: 'is', haii: 'is', hota: 'is', hoti: 'is', hote: 'are',
  tha: 'was', thi: 'was', ho: 'is', hoga: 'willbe', hogi: 'willbe',
  ka: '', ke: '', ki: '', ko: '', mein: '', me: '', se: '', par: '',
  pe: '', aur: 'and', or: 'and', ekk: 'one', ek: 'one', dono: 'both',
  isko: 'this', iske: 'this', uska: 'that', ye: 'this',
  yeh: 'this', woh: 'that', vo: 'that', mujhe: '', mera: '', apna: '',
  nahin: 'not', nahi: 'not', matlab: 'meaning', jaise: 'like',
  waise: 'like', sab: 'all', saara: 'all', koi: 'any', kuch: 'some',

  // common noun glosses students use
  niyam: 'law', niyaam: 'law', formula: 'formula', sutra: 'formula',
  paribhasha: 'definition', definition: 'definition', kaam: 'work',
  bal: 'force', taqat: 'force', gati: 'motion', veg: 'velocity',
  tooran: 'acceleration', tvaran: 'acceleration', dravyaman: 'mass',
  urja: 'energy', roshni: 'light', tarang: 'wave', dhvani: 'sound',
  valay: 'coil', tarangdairghya: 'wavelength', kan: 'particle',
  parmaanu: 'atom', atom: 'atom', anu: 'atom', guna: 'multiplication',
  jod: 'addition', ghata: 'subtraction', bhaag: 'division',
  samikaran: 'equation', barabar: 'equals', padhao: 'teach',
  prashn: 'question', sawaal: 'question', javab: 'answer', jawab: 'answer',
};

// ---------------------------------------------------------------------------
// Devanagari → romanized gloss (common words only; rest is transliterated)
// ---------------------------------------------------------------------------
const DEVANAGARI_MAP = {
  'क्या': 'what', 'कैसे': 'how', 'क्यों': 'why', 'कब': 'when',
  'कहाँ': 'where', 'कहां': 'where', 'कौन': 'which', 'कौनसा': 'which',
  'कितना': 'howmuch', 'कितने': 'howmuch',
  'है': 'is', 'हैं': 'is', 'होता': 'is', 'होती': 'is', 'होते': 'are',
  'था': 'was', 'थी': 'was', 'होगा': 'willbe',
  'का': '', 'के': '', 'की': '', 'को': '', 'में': '', 'से': '', 'पर': '',
  'और': 'and', 'एक': 'one', 'यह': 'this', 'ये': 'this', 'वह': 'that',
  'वो': 'that', 'मुझे': '', 'नहीं': 'not', 'मतलब': 'meaning',
  'बताओ': 'explain', 'बताइए': 'explain', 'बताओ।': 'explain',
  'समझाओ': 'explain', 'समझाइए': 'explain', 'समझाएं': 'explain',
  'लिखो': 'write', 'निकालो': 'solve', 'सीखाओ': 'teach',
  'नियम': 'law', 'सूत्र': 'formula', 'परिभाषा': 'definition',
  'कानून': 'law', 'काम': 'work', 'बल': 'force', 'गति': 'motion',
  'वेग': 'velocity', 'त्वरण': 'acceleration', 'द्रव्यमान': 'mass',
  'ऊर्जा': 'energy', 'प्रकाश': 'light', 'रोशनी': 'light', 'तरंग': 'wave',
  'ध्वनि': 'sound', 'परमाणु': 'atom', 'अणु': 'molecule',
  'समीकरण': 'equation', 'प्रश्न': 'question', 'सवाल': 'question',
  'जवाब': 'answer', 'उत्तर': 'answer', 'क्या?': 'what',
};

// Devanagari char → latin (for remaining words, rough but effective)
const TRANSLIT = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'क': 'k', 'ख': 'kh',
  'ग': 'g', 'घ': 'gh', 'ङ': 'n', 'च': 'ch', 'छ': 'chh', 'ज': 'j',
  'झ': 'jh', 'ञ': 'n', 'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh',
  'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y',
  'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's',
  'ह': 'h', 'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n',
  '्': '', '़': '',
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'was',
  'what', 'why', 'how', 'when', 'where', 'which', 'who', 'whom', 'do',
  'does', 'did', 'can', 'you', 'me', 'my', 'i', 'we', 'it', 'its',
  'please', 'tell', 'about', 'explain', 'and', 'or', 'this', 'that',
  'give', 'one', 'sir', 'maam', 'bhai', 'hey', 'hi', 'hello', 'yaar',
  'jaldi', 'quickly', 'short', 'brief', 'detail', 'detail mein',
]);

const NUM_WORDS = {
  'doosra': 'second', 'doosari': 'second', 'dusra': 'second',
  'dusri': 'second', 'pehla': 'first', 'pehli': 'first', 'pahla': 'first',
  'tisra': 'third', 'tisri': 'third', 'teesra': 'third', 'chautha': 'fourth',
  'आदि': 'etc', 'पहला': 'first', 'दूसरा': 'second', 'तीसरा': 'third',
  'चौथा': 'fourth',
};

/** Rough language detection so we can respond in the student's language. */
function detectLanguage(text) {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagari > text.replace(/\s/g, '').length * 0.25) return 'hi';
  const romanHindiHits = Object.keys(HINGLISH_MAP).filter((w) =>
    new RegExp(`(^|\\s)${w}(\\s|$|\\?|।)`, 'i').test(text)
  ).length;
  if (romanHindiHits >= 2) return 'hinglish';
  return 'en';
}

function transliterateDevanagari(word) {
  let out = '';
  for (const ch of word) out += TRANSLIT[ch] ?? '';
  return out;
}

/**
 * Normalize a doubt into comparable English-ish tokens.
 * Handles: casing, punctuation, Hinglish romanization, Devanagari,
 * ordinal words (doosra → second), and stopword removal.
 */
function normalizeTokens(text) {
  if (!text) return [];
  const raw = String(text)
    .toLowerCase()
    .replace(/[?!.,;:"'`()\[\]{}|\/\\]+/g, ' ')
    .replace(/\u0964|\u0965/g, ' ') // danda
    .split(/\s+/)
    .filter(Boolean);

  const tokens = [];
  for (let w of raw) {
    if (/[\u0900-\u097F]/.test(w)) {
      // Devanagari word: gloss if known, else transliterate
      const bare = w.replace(/[।?!,]/g, '');
      const gloss = DEVANAGARI_MAP[bare] ?? DEVANAGARI_MAP[w];
      if (gloss !== undefined) {
        if (gloss) tokens.push(gloss);
        continue;
      }
      w = transliterateDevanagari(w);
    }
    // strip trailing 's / possessives
    w = w.replace(/'s$/, '');
    const gloss = HINGLISH_MAP[w];
    if (gloss !== undefined) {
      if (gloss) tokens.push(gloss);
      continue;
    }
    const ordinal = NUM_WORDS[w];
    if (ordinal) { tokens.push(ordinal); continue; }
    if (w.length < 2) continue;
    tokens.push(w);
  }

  // Remove stopwords but KEEP domain-meaningful ones that slipped in
  return tokens.filter((t) => !STOPWORDS.has(t));
}

/** Strip stopwords for display-friendly echo. */
function normalizeQuery(text) {
  return normalizeTokens(text).join(' ');
}

module.exports = { detectLanguage, normalizeTokens, normalizeQuery, HINGLISH_MAP };
