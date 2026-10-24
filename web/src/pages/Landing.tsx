import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const FEATURES = [
  {
    icon: '🗣️',
    title: 'Bolo, likho nahi',
    body: 'Voice-first doubts in Hindi, Hinglish or English. Bola hua doubt samajh kar NCERT-accurate jawab milta hai — typing ki zaroorat nahi.',
  },
  {
    icon: '📚',
    title: 'NCERT-grounded answers',
    body: 'Har jawab curated, syllabus-verified knowledge base se aata hai — chapter aur page reference ke saath. Galat facts ka risk nahi.',
  },
  {
    icon: '🪜',
    title: 'Step-by-step, topper style',
    body: 'Sirf final answer nahi — poora method, jaise ek senior jo pichhle saal exam crack kiya ho. Formulas aur exam tips included.',
  },
  {
    icon: '🎯',
    title: 'PYQ practice arena',
    body: 'JEE, NEET aur UPSC ke previous-year patterns par MCQs, instant explanations ke saath. Jo galat hua, wo Planner mein chala jaata hai.',
  },
  {
    icon: '🗓️',
    title: 'Revision planner',
    body: '1-3-7-15 spaced repetition. Kamzor topics pehle, phir exam-weighted syllabus — roz ka clear plan, guesswork nahi.',
  },
  {
    icon: '💸',
    title: 'Chai se sasta',
    body: 'Open-source models self-hosted hain, isliye ₹49/month possible hai. Coaching ki ek din ki fees se poora mahina.',
  },
];

const PLANS_FALLBACK = [
  {
    id: 'sahaj',
    name: 'Sahaj',
    price: '₹0',
    period: 'forever',
    features: ['10 doubts/day (text)', '3 voice doubts/day', 'Practice Arena (limited)'],
  },
  {
    id: 'sahaj_plus',
    name: 'Sahaj+',
    price: '₹49',
    period: 'per month',
    features: [
      'Unlimited text doubts',
      '50 voice doubts/day',
      'Full PYQ practice arena',
      'Revision planner + analytics',
    ],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹99',
    period: 'per month',
    features: [
      'Everything in Sahaj+',
      'Unlimited voice doubts',
      'JEE Advanced level depth',
      'Test series analytics',
    ],
  },
];

const SUBJECTS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'UPSC Polity',
  'UPSC Geography',
  'UPSC Economy',
  'UPSC Environment',
];

export default function Landing() {
  const [plans, setPlans] = useState(PLANS_FALLBACK);
  const [entries, setEntries] = useState<number | null>(null);

  useEffect(() => {
    api
      .brand()
      .then((b) => {
        if (b.plans?.length) setPlans(b.plans);
      })
      .catch(() => {});
    api
      .health()
      .then((h) => setEntries(h.engine?.entries ?? null))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="hero-badge">
              <span className="dot" /> Made for Bharat · powered by open-source AI
            </span>
            <h1>
              Har doubt ka jawaab,
              <br />
              <span className="accent">apni bhasha mein.</span>
            </h1>
            <p className="hero-sub">
              Angvey is a voice-first AI study saathi for JEE, NEET aur UPSC aspirants.
              Doubt Hindi, Hinglish ya English mein poocho — step-by-step, NCERT-accurate jawab
              milega. Coaching wali clarity, chai wali keemat.
            </p>
            <div className="hero-cta">
              <Link to="/doubt" className="btn btn-primary btn-lg">
                💬 Doubt poocho — free
              </Link>
              <Link to="/practice" className="btn btn-ghost btn-lg">
                🎯 Practice shuru karo
              </Link>
            </div>
            <div className="hero-note">
              <span>✓ No sign-up needed</span>
              <span>✓ Hindi · Hinglish · English</span>
              <span>✓ Works on ₹8,000 phones</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="float-card one">🎙️ “Newton ka doosra niyam samjhao”</div>
            <div className="chat-mock">
              <div className="chat-mock-top">
                <img src="/favicon.png" alt="" />
                Vey — Doubt Saathi
                <span className="live">● live</span>
              </div>
              <div className="chat-mock-body">
                <div className="bubble user">Bhai, Newton ka doosra niyam simple words mein?</div>
                <div className="bubble bot">
                  Arre, classic doubt! Dekh, ise aise samajh —{' '}
                  <strong>F = ma</strong>. Kisi vastu ke momentum ke badalne ki dar lagne wale net
                  force ke barabar hoti hai.
                  <span className="src">📖 NCERT Class 11 Physics, Ch. 5</span>
                </div>
                <div className="bubble bot">
                  <span className="typing">
                    <i /> <i /> <i />
                  </span>
                  &nbsp; aage samjha raha hoon…
                </div>
              </div>
            </div>
            <div className="float-card two">🔥 12-day streak</div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- stat strip */}
      <div className="stat-strip">
        <div className="stat-card">
          <b>~90%</b>
          <span>Bharat ke students English-medium nahi hain</span>
        </div>
        <div className="stat-card">
          <b>2.5 Cr+</b>
          <span>JEE / NEET / UPSC aspirants har saal</span>
        </div>
        <div className="stat-card">
          <b>₹49</b>
          <span>Per month — coaching ki ek din ki fees se kam</span>
        </div>
        <div className="stat-card">
          <b>{entries ?? '39'}+</b>
          <span>NCERT-grounded topics, har jawab source ke saath</span>
        </div>
      </div>

      {/* ---------------------------------------------------------- problem */}
      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <span className="tag">The gap</span>
            <h2>AI sabke liye hai — par sirf English walon ke liye</h2>
            <p>
              Tier-2/3 India ke students physics Hindi mein samajhte hain, par har AI tool unse
              English mein baat karta hai. Hinglish voice par accuracy 62–74% tak gir jaati hai.
              Angvey isi khaayi ko bharne ke liye bana hai.
            </p>
          </div>
          <div className="compare">
            <div className="bad">
              <h3>❌ Aaj ke generic AI tools</h3>
              <ul>
                <li>English-first prompts, English-first answers</li>
                <li>Hinglish/accents par 22–35% “samajh nahi aaya”</li>
                <li>NCERT phrasing nahi — NEET mein marks kat sakte hain</li>
                <li>₹500–₹1,500/month API-based pricing</li>
                <li>Practice ya revision loop nahi</li>
              </ul>
            </div>
            <div className="good">
              <h3>✅ Angvey</h3>
              <ul>
                <li>Hindi/Hinglish default, English optional</li>
                <li>Voice-first UX — bolne par turant jawab</li>
                <li>NCERT-grounded KB + source citation</li>
                <li>₹49/month, open-source models self-hosted</li>
                <li>Practice + spaced-repetition planner included</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- features */}
      <section className="section alt">
        <div className="section-inner">
          <div className="section-head">
            <span className="tag">Product</span>
            <h2>Sab kuch ek jagah — doubt se rank tak</h2>
            <p>Poocho, practice karo, revise karo — sab Hinglish mein, sab ek app mein.</p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <div className="card feature" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- how */}
      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <span className="tag">How it works</span>
            <h2>Teen step. Bas.</h2>
          </div>
          <div className="grid-3 steps">
            <div className="step">
              <h3>Doubt bolo ya likho</h3>
              <p>
                “Photosynthesis ka light reaction samjhao” — mic dabao ya type karo. Vey language
                khud pehchaan leta hai.
              </p>
            </div>
            <div className="step">
              <h3>Step-by-step jawab</h3>
              <p>
                Retrieval engine pehle curated NCERT notes se exact jawab deta hai (instant, ₹0),
                phir open-weights LLM detail add karta hai.
              </p>
            </div>
            <div className="step">
              <h3>Practice + revise</h3>
              <p>
                Har doubt se related PYQ practice milti hai. Jo galat ho, planner us topic ko
                kal-3 din-7 din baad repeat karta hai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- subjects */}
      <section className="section alt">
        <div className="section-inner">
          <div className="section-head">
            <span className="tag">Syllabus</span>
            <h2>JEE · NEET · UPSC — Hinglish mein</h2>
            <p>
              Knowledge base content-team + AI review se banaya gaya hai, NCERT chapter references
              ke saath. Naye topics har hafte add hote hain.
            </p>
          </div>
          <div className="subject-chips">
            {SUBJECTS.map((s) => (
              <Link key={s} to="/practice" className="chip">
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- plans */}
      <section className="section" id="plans">
        <div className="section-inner">
          <div className="section-head">
            <span className="tag">Pricing</span>
            <h2>Ek chai se sasta, poore mahine ka saathi</h2>
            <p>Free se shuru karo. Jab lage ki saath nibha raha hai, tab upgrade karo.</p>
          </div>
          <div className="plans">
            {plans.map((p) => (
              <div className={`plan ${p.highlight ? 'highlight' : ''}`} key={p.id}>
                {p.highlight && <span className="badge-hot">Most popular</span>}
                <h3>{p.name}</h3>
                <div className="price">{p.price}</div>
                <div className="period">{p.period}</div>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link to="/doubt" className={`btn btn-block ${p.highlight ? 'btn-primary' : 'btn-ghost'}`}>
                  {p.id === 'sahaj' ? 'Free shuru karo' : `${p.name} chuno`}
                </Link>
              </div>
            ))}
          </div>
          <p className="center muted small" style={{ marginTop: 26 }}>
            Coaching institutes ke liye <strong>Paathshala</strong> — white-label doubt saathi,
            ₹2,000–10,000/month per institute.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-inner">
          <div className="cta-band">
            <div className="grow">
              <h2>Aaj hi apni bhasha mein padhna shuru karo</h2>
              <p>No sign-up. No credit card. Bas pehla doubt poocho.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/doubt" className="btn btn-primary btn-lg">
                Doubt poocho →
              </Link>
              <Link to="/practice" className="btn btn-light btn-lg">
                Practice karo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
