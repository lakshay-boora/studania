import { useEffect, useRef, useState } from 'react';
import { api, type ChatMessage, type Lang } from '../lib/api';
import { speak, speechSupported, startListening, stopSpeaking, ttsSupported } from '../lib/speech';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'en', label: 'English' },
];

const STARTERS = [
  'Newton ka doosra niyam simple words mein samjhao',
  'Mole concept kya hai? Example ke saath',
  'Nernst equation kaise apply karte hain?',
  'Photosynthesis ka light reaction samjhao',
  'Quadratic roots kaise nikaalte hain?',
  'DPSP aur Fundamental Rights mein difference',
];

/** Minimal, safe markdown: **bold** + line breaks. */
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
  );
}

interface UiMessage extends ChatMessage {
  related?: { id: string; topic: string }[];
  confident?: boolean;
  engine?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState<Lang>('auto');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [usage, setUsage] = useState({ today: 0, limit: 10, plan: 'sahaj', streak: 0 });
  const logRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api
      .history()
      .then((h) => {
        const msgs: UiMessage[] = h.messages.map((m) => ({
          ...m,
          engine: m.meta?.engine,
        }));
        if (msgs.length) setMessages(msgs);
      })
      .catch(() => {});
    api
      .stats()
      .then((s) =>
        setUsage((u) => ({
          today: s.user.doubtsToday,
          limit: u.limit,
          plan: s.user.plan,
          streak: s.user.streak,
        }))
      )
      .catch(() => {});
    api
      .brand()
      .then((b) => {
        if (b.limits?.freeDailyDoubts) setUsage((u) => ({ ...u, limit: b.limits.freeDailyDoubts }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);
    setInput('');
    stopSpeaking();

    const userMsg: UiMessage = {
      id: 'u' + Date.now(),
      role: 'user',
      text,
    };
    setMessages((m) => [...m, userMsg]);

    try {
      const reply = await api.chat(text, lang);
      const botMsg: UiMessage = {
        id: 'a' + Date.now(),
        role: 'assistant',
        text: reply.text,
        source: reply.source,
        meta: { subject: reply.subject, topic: reply.topic ?? undefined, engine: reply.engine },
        related: reply.related,
        confident: reply.confidence !== 'low',
        engine: reply.engine,
      };
      setMessages((m) => [...m, botMsg]);
      setUsage((u) => ({ ...u, today: u.today + 1 }));
      if (autoSpeak && reply.text) speak(reply.text, lang === 'en' ? 'en-IN' : 'hi-IN');
    } catch (e: any) {
      if (e?.status === 402) {
        setError(e.payload?.message ?? 'Daily free limit reached. Sahaj+ (₹49/month) mein unlimited doubts.');
      } else {
        setError(e?.message ?? 'Kuch galat ho gaya. Dobara try karo.');
      }
    } finally {
      setBusy(false);
      textareaRef.current?.focus();
    }
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop?.();
      setListening(false);
      return;
    }
    setError(null);
    setListening(true);
    recRef.current = startListening(
      {
        onResult: (text, isFinal) => {
          setInput(text);
          if (isFinal) {
            setListening(false);
            setTimeout(() => send(text), 150);
          }
        },
        onError: (msg) => {
          setError(msg);
          setListening(false);
        },
        onEnd: () => setListening(false),
      },
      lang === 'en' ? 'en-IN' : 'hi-IN'
    );
  }

  const usagePct = Math.min(100, (usage.today / usage.limit) * 100);
  const empty = messages.length === 0;

  return (
    <div className="chat-page">
      {/* ------------------------------------------------------------- side */}
      <aside className="chat-side">
        <div className="side-card">
          <h4>Bhasha / Language</h4>
          <div className="lang-toggle">
            {LANGS.map((l) => (
              <button
                key={l.id}
                className={lang === l.id ? 'active' : ''}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          {ttsSupported && (
            <label className="small" style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} />
              Jawab suno (voice)
            </label>
          )}
        </div>

        <div className="side-card">
          <h4>Aaj ka usage</h4>
          <div className="usage-bar">
            <i style={{ width: `${usagePct}%` }} />
          </div>
          <div className="small muted">
            {usage.today} / {usage.limit} free doubts
            {usage.streak > 0 && <> · 🔥 {usage.streak} din streak</>}
          </div>
          {usage.plan === 'sahaj' && (
            <p className="small muted" style={{ margin: '10px 0 0' }}>
              Unlimited chahiye? <strong>Sahaj+ ₹49/month</strong>
            </p>
          )}
        </div>

        <div className="side-card">
          <h4>Try karo</h4>
          {STARTERS.map((s) => (
            <button key={s} className="side-item" onClick={() => send(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>

        <div className="side-card">
          <h4>Engine</h4>
          <p className="small muted" style={{ margin: 0 }}>
            Tier-1 retrieval (NCERT KB) + optional open-weights LLM. Aapka data Indian server par
            rehta hai.
          </p>
          {messages.length > 0 && (
            <button
              className="mini-btn"
              style={{ marginTop: 10 }}
              onClick={async () => {
                await api.clearHistory().catch(() => {});
                setMessages([]);
                stopSpeaking();
              }}
            >
              🗑 Chat clear karo
            </button>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- main */}
      <section className="chat-main">
        <div className="chat-head">
          <div className="vey-avatar">🔥</div>
          <div>
            <b>Vey</b>
            <div className="status">Doubt Saathi · online</div>
          </div>
          <div style={{ marginLeft: 'auto' }} className="pill">
            {lang === 'auto' ? 'auto-detect' : lang}
          </div>
        </div>

        <div className="chat-log" ref={logRef}>
          {empty && (
            <div className="empty">
              <div className="big">🙏</div>
              <h3>Namaste! Main Vey hoon.</h3>
              <p className="muted">
                Koi bhi doubt poocho — Physics, Chemistry, Maths, Biology ya UPSC.
                <br />
                Hindi, Hinglish ya English — jis bhasha mein sochte ho, usi mein.
              </p>
              <div className="quick-row" style={{ justifyContent: 'center', padding: 0, marginTop: 14 }}>
                {STARTERS.slice(0, 3).map((s) => (
                  <button key={s} className="quick-chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>
              <div className="msg-avatar">{m.role === 'user' ? 'You' : '🔥'}</div>
              <div className="msg-body">
                <div style={{ whiteSpace: 'pre-wrap' }}>{renderText(m.text)}</div>
                {m.role === 'assistant' && (
                  <div className="msg-meta">
                    {m.meta?.subject && <span className="pill">{m.meta.subject}</span>}
                    {m.meta?.topic && <span>{m.meta.topic}</span>}
                    {m.engine === 'tier1-retrieval' && <span className="pill" style={{ background: 'var(--mint-soft)', color: '#0f6b58' }}>✓ verified KB</span>}
                    {m.engine === 'tier2-openweights-llm' && <span className="pill">open-weights LLM</span>}
                    <div className="msg-tools">
                      {ttsSupported && (
                        <button
                          className="mini-btn"
                          onClick={() => speak(m.text, lang === 'en' ? 'en-IN' : 'hi-IN')}
                        >
                          🔊 Suno
                        </button>
                      )}
                      <button
                        className="mini-btn"
                        onClick={() => navigator.clipboard?.writeText(m.text)}
                      >
                        ⧉ Copy
                      </button>
                    </div>
                  </div>
                )}
                {m.related && m.related.length > 0 && (
                  <div className="quick-row" style={{ padding: '10px 0 0' }}>
                    {m.related.slice(0, 3).map((r) => (
                      <button
                        key={r.id}
                        className="quick-chip"
                        onClick={() => send(`${r.topic} samjhao`)}
                      >
                        {r.topic} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="msg bot">
              <div className="msg-avatar">🔥</div>
              <div className="msg-body">
                <span className="typing">
                  <i /> <i /> <i />
                </span>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-strip">{error}</div>}

        <div className="composer">
          <div className="composer-row">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              placeholder={listening ? 'Sun raha hoon… bolo 🎙️' : 'Apna doubt likho ya mic dabao…'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              style={{ height: 'auto', minHeight: 46 }}
            />
            {speechSupported && (
              <button
                className={`mic-btn ${listening ? 'rec' : ''}`}
                onClick={toggleMic}
                title={listening ? 'Stop' : 'Bol kar poocho'}
                aria-label="Voice input"
              >
                {listening ? '■' : '🎙️'}
              </button>
            )}
            <button className="send-btn" onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send">
              {busy ? <span className="spinner" /> : '➤'}
            </button>
          </div>
          <div className="composer-hint">
            <span>Enter = bhejo · Shift+Enter = nayi line</span>
            <span>{speechSupported ? '🎙️ Voice available' : 'Voice: Chrome/Android par available'}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
