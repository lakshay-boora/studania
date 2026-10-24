# Angvey — Market Gap Research Report

> Research date: October 2026 · Prepared as the founding research for **Angvey Technologies**
> Tagline: **"हर doubt का जवाब, अपनी भाषा में"** — Every doubt answered, in your own language.

---

## 1. Executive Summary

India has ~2.5 crore (25M) students preparing for competitive exams (JEE, NEET, UPSC and
others) at any given time. The overwhelming majority of them live in **tier-2, tier-3 and
rural India**, study in Hindi-medium or vernacular schools, think in **Hinglish**, and cannot
afford coaching that costs ₹50,000–₹2,00,000 a year.

Meanwhile, every AI doubt-solving product on the market is **English-first, text-first and
cloud-API-first** — which means it is expensive to run, weak on Indian accents and
code-mixed speech, and culturally alien to exactly the students who need it most.

**The gap:** a *vernacular-first, voice-first, radically affordable* AI doubt-solver for
Bharat's exam aspirants — built on **open-source models** so the cost structure allows
₹49–₹99/month pricing that no coaching institute or closed-API competitor can match.

**Angvey fills this gap** with an application: an AI "study saathi" that answers doubts in
Hindi/Hinglish/English, accepts **voice notes** (the natural interface for Bharat), solves
step-by-step like a JEE topper would, drills students with PYQ-pattern practice, and plans
revision with spaced repetition.

---

## 2. The Open-Source AI Landscape (What We Build On)

### 2.1 Open-weight LLMs — the engine layer

| Model | Maker | License | Why it matters to Angvey |
| --- | --- | --- | --- |
| **Qwen 3 / 3.5 family** | Alibaba | Apache 2.0 | Best clean commercial license; ~201 languages; excellent multilingual + math; 0.6B–235B variants fit every budget |
| **DeepSeek R1 / V3** | DeepSeek | MIT | Chain-of-thought reasoning at ~1/10th frontier cost; MIT license is maximally permissive |
| **Llama 4 Scout / Maverick** | Meta | Llama Community | 1M–10M token context windows; strong general capability; 17B active MoE is cheap to serve |
| **Gemma 3 / 4** | Google | Apache 2.0 (v4) | Best capability-per-hardware ratio; runs on laptops/phones; 128K context |
| **Mistral Large 2 / Small** | Mistral | Apache 2.0 (Small) | 80+ languages; EU-grade efficiency; the base of Sarvam-M (fine-tuned for 10 Indian languages) |
| **Sarvam-M / OpenHathi / Krutrim** | Sarvam AI et al. | Open weights | Purpose-built Indic models; proof that Indic fine-tunes of open models work commercially |

**Sources:** open-source LLM comparisons and rankings, 2025–2026 —
till-freitag.com/en/blog/open-source-llm-comparison; huggingface.co/blog/daya-shankar/open-source-llms;
respan.ai/blog/best-open-source-llms; featherless.ai/blog/best-open-source-llms-2026;
developersdigest.tech/best/open-source-models; technologyreview.com (Sarvam-M on Mistral Small base).

### 2.2 Speech layer (the voice-first moat)

| Capability | Best open-source option | License | Notes |
| --- | --- | --- | --- |
| Speech-to-text | **Whisper large-v3 / faster-whisper** | MIT | 99 languages, robust to accents & noise — the gold standard for offline STT |
| STT (multilingual streaming) | **Qwen3-ASR (1.7B)** | Apache 2.0 | 52 languages, streaming-capable, competitive with commercial APIs |
| STT (Indic) | **AI4Bharat IndicConformer**, Bhashini APIs | Open | 22 Indian languages, production-ready |
| Text-to-speech | **Coqui XTTS / Piper / IndicTTS** | MPL-2.0 / MIT | Natural vernacular voices for reading answers aloud |

**Sources:** assemblyai.com/blog/top-open-source-stt-options-for-voice-applications;
gladia.io/blog/best-open-source-speech-to-text-models; olud.ai/blog/top-10-open-source-ai-tools-2026;
community.nasscom.in (AI4Bharat / Bhashini coverage of 22 languages).

### 2.3 Application layer

- **Ollama / llama.cpp / vLLM** — serve open models locally or on cheap GPU boxes (MIT/Apache).
- **LangChain / LlamaIndex / RAGFlow** — retrieval-augmented generation over NCERT-accurate
  knowledge (MIT/Apache).
- **FAISS / Qdrant / Chroma** — vector search (MIT/Apache).
- **Web Speech API** — zero-cost browser-native STT/TTS for the client, ideal for
  low-bandwidth India (works in Chrome on ₹8,000 Android phones).

**Sources:** localai.io; olud.ai; awesomeosai.com; github.com/JeevaVenkidu/awesome-open-ai-alternatives.

### 2.4 Why open source is the *commercial* strategy (not just ideology)

1. **Cost.** Self-hosted open models cost roughly **$0.0003–$0.013 per 1M tokens vs
   $0.15–$3+ for closed APIs** — a 50–500× advantage. A fintech cut spend from $47,000 to
   $8,000/month (−83%) by moving to hybrid self-hosting. At Angvey's target price of
   ₹49/month, closed-API inference would consume the entire margin; open-source makes the
   unit economics work. *(premai.io self-hosted LLM guide 2026; aiordienow.com; stealthcloud.ai)*
2. **Quality parity.** Open-weight models now deliver **85–95% of frontier quality**, and
   independent evaluations show top models scoring **345–351/360 on JEE Advanced 2026** —
   the raw capability is no longer the bottleneck; *packaging for Bharat* is.
   *(stealthcloud.ai; timesofindia.indiatimes.com)*
3. **Sovereignty & trust.** IndiaAI Mission (₹10,372 crore) is actively subsidising compute
   for startups building on open Indic models. *(startupchronicle.in; technologyreview.com)*
4. **Privacy.** Student voice notes and doubts never need to leave Indian servers. Data
   locality is a selling point to parents and institutions.

---

## 3. Market Gap Analysis

### 3.1 Gap #1 — The language gap ("the Indian language tax")

- Only **~10% of India's 1.4B people speak English fluently**; the other 90% learn, think
  and query in Hindi, Tamil, Telugu, Bengali, Marathi and 18+ other official languages.
  *(dev.to — India's homegrown AI ecosystem)*
- Models that "work well in English degrade sharply in both latency and accuracy the moment
  you move to a regional language" — **Ganesh Gopalan, CEO Gnani.ai**, calling it the
  single biggest hurdle to scaling vernacular AI. *(business-standard.com)*
- Asking the same question in an Indian language can cost **3–5× more tokens than English**
  — Sarvam AI's founders report a Hindi question costs ~5× an English one. *(restofworld.org)*
- IndiaAI Mission's CEO has explicitly said India is betting on **voice-first vernacular
  LLMs** as its differentiator against Big Tech. *(livemint.com)*

### 3.2 Gap #2 — The tier-2/3 voice accuracy gap

| Metric | Metro | Tier-2 | Tier-3 |
| --- | --- | --- | --- |
| STT accuracy (Hindi) | 92–96% | 82–88% | **70–80%** |
| STT accuracy (Hinglish) | 88–93% | 75–84% | **62–74%** |
| "Didn't understand" rate | 5–8% | 12–18% | **22–35%** |

*(autointerviewai.com — vernacular voice agents guide 2026)*

Existing English-first voice products literally cannot understand the median Angvey user.
A product engineered around Hinglish code-mixing (Hindi sentence structure with English
technical terms — how every Indian science student actually talks) has a real moat.

### 3.3 Gap #3 — The affordability gap in exam prep

- Coaching for JEE/NEET costs ₹50,000–₹2,00,000+/year; AI study tools that exist are either
  generic (ChatGPT — English-first, no NCERT grounding, no practice loops) or locked inside
  ₹1,000+/month platforms (Unacademy ₹1,499/yr+, Testbook, Allen AI).
- **Arivihan** just raised $10M (Accel, Prosus) with **~80% of subscribers from tier-3 cities
  and rural India** — validating demand for teacher-free, AI-led exam prep at low price
  points. *(openthemagazine.com)*
- **PhysicsWallah's Ask AI resolved ~3M student queries** in ~6 months — volume no human
  tutor network can match. The demand for doubt-resolution at scale is proven.
  *(practicemock.com)*
- Students in tier-2/3 cite Hinglish voice tutoring as the feature that finally makes AI
  usable for them. *(prepgraph.com; yuverse.ai)*

### 3.4 Gap #4 — The "generic AI" trust gap in education

- NEET answers must match **NCERT phrasing** — generic chatbots paraphrase and cost students
  marks. *(indianaiapps.com)*
- Western-trained speech models misinterpret Indian accents and contexts. 
  *(insightsonindia.com)*
- Parents and schools want **grounded, syllabus-accurate** answers (RAG over NCERT), not
  open-ended generative chat.

### 3.5 What exists today vs. what's missing

| Player | What they do | Why the gap stays open |
| --- | --- | --- |
| ChatGPT/Gemini (free tiers) | Generic doubt solving | English-first, no NCERT grounding, no practice/revision loop, no Hinglish voice |
| PhysicsWallah Alakh AI / Ask AI | Doubt solving inside paid ecosystem | Locked to PW content & pricing; not vernacular-voice-first |
| Arivihan | AI-first courses, Tamil Nadu focus | Course-shaped, not doubt-shaped; limited language coverage (expanding) |
| Edza AI | AI voice tutors for JEE/NEET | New, pricing above mass market, English-first positioning |
| Doubtnut | Photo-based doubt solving | Human/semi-automated, English/Hindi text, no adaptive revision loop |
| Meta Business AI, Kraya AI | Vernacular AI for *businesses* | SMB-focused — nobody owns vernacular voice AI for *students* at ₹49 |

**The white space:** *vernacular-voice-first, NCERT-grounded, practice-looped, open-source-powered
doubt solving at mass-market price.* That is Angvey.

---

## 4. Why This Gap Is Fillable With an Application

The gap is not a research problem (open models already ace JEE-level questions), it is a
**product & packaging problem** — which is exactly what an application solves:

1. **Doubt engine** — RAG over a curated, NCERT-accurate bilingual knowledge base +
   open-weights LLM (Qwen/Gemma via Ollama) for open-ended questions. Offline-first
   retrieval core means the app answers common doubts with *zero inference cost*.
2. **Voice interface** — browser Web Speech API today (zero marginal cost); Whisper /
   IndicConformer self-hosted STT as the upgrade path for accented speech.
3. **Practice loop** — PYQ-pattern MCQ engine with explanations, accuracy analytics and
   spaced-repetition revision planner.
4. **Affordability by architecture** — retrieval-first design means ~80% of doubts are
   answered from the knowledge base without an LLM call; LLM calls go to self-hosted
   open models. This is what makes ₹49/month viable when competitors' API costs force
   ₹500+/month.

---

## 5. Monetization & Revenue Model

| Tier | Price | Includes | Target segment |
| --- | --- | --- | --- |
| **Sahaj (Free)** | ₹0 | 10 doubts/day (text), 3 voice doubts/day, practice capped | Acquisition, network effects |
| **Sahaj+** | **₹49/month** | Unlimited text doubts, 50 voice doubts/day, all PYQ practice, revision planner | Tier-2/3 students (core market) |
| **Pro** | ₹99/month | Everything + unlimited voice, JEE-Advanced level depth, test series analytics | Serious aspirants |
| **Paathshala (B2B)** | ₹2,000–10,000/month per institute | White-label doubt saathi for coaching institutes, Hindi-medium schools | 70K+ coaching institutes |
| **API (B2D)** | usage-based | Vernacular doubt-solving API for other edtechs | Developers |

**Revenue math (year-1, conservative):** 100K free users → 6% conversion at ₹49 avg =
6,000 paying users = **₹29.4L ARR**; + 20 B2B institutes at ₹5K avg = ₹12L → **~₹41L ARR
(~$50K)**. Year-3 target: 1M downloads, 8% conversion, 150 institutes ≈ **₹5.5–6Cr ARR**.
Open-source inference keeps gross margin >70%.

Funding tailwinds: IndiaAI Mission subsidised GPU compute (₹115–150/hr, ~42% below market),
Bhashini free Indic APIs/datasets. *(addwebsolution.com; wext.in)*

## 6. Go-To-Market

1. **Sonipat → Haryana → NCR belt first** (founder's home turf; Hindi/Haryanvi-speaking,
   dense with JEE/NEET aspirants and coaching institutes).
2. WhatsApp-first distribution: daily doubt-of-the-day broadcasts, share-a-solution cards
   (students already live on WhatsApp — 500M+ Indian users).
3. Partnerships with 10–20 local coaching institutes for the Paathshala white-label tier.
4. Content engine: YouTube Shorts / Instagram Reels solving real doubts by voice in
   Hinglish — organic acquisition channel proven by PW.

## 7. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Big Tech copies (Meta Business AI-style launches for education) | Vernacular voice + NCERT grounding + price are structural advantages of open-source cost base; move fast in tier-2/3 |
| Open-model quality on Hinglish | Hybrid engine: retrieval-first + Indic fine-tunes (Sarvam-style) + human-reviewed KB |
| Low willingness to pay | ₹49 price point < 1 week of chai; B2B institute tier de-risks consumer ARPU |
| Voice STT accuracy in Haryanvi/dialects | Self-hosted Whisper fine-tuning on Indic datasets (AI4Bharat); fallback to text |

---

## 8. Source Index

1. till-freitag.com/en/blog/open-source-llm-comparison — Open-Source LLMs Compared 2026
2. huggingface.co/blog/daya-shankar/open-source-llms — Best Open-Source LLMs 2026
3. respan.ai/blog/best-open-source-llms — 10 Best Open-Weight Models
4. featherless.ai/blog/best-open-source-llms-2026
5. assemblyai.com/blog/top-open-source-stt-options-for-voice-applications
6. gladia.io/blog/best-open-source-speech-to-text-models
7. olud.ai/blog/top-10-open-source-ai-tools-2026
8. premai.io/blog/self-hosted-llm-guide-setup-tools-cost-comparison-2026
9. stealthcloud.ai/comparisons/self-hosted-ai-vs-cloud-ai
10. aiordienow.com/run-local-llm
11. startupchronicle.in — Vernacular AI Vanguard: India's Startups 2025
12. business-standard.com — "Namaste AI: local languages hold the key to mass AI adoption" (Gnani.ai CEO: language tax)
13. community.nasscom.in — AI in Regional Languages: Unlocking Bharat's Next 500M Users
14. livemint.com — India to focus on voice-first vernacular LLMs: AI Mission CEO
15. dev.to — India's Homegrown AI Ecosystem: 110+ Apps Across 22 Languages
16. autointerviewai.com — Vernacular AI Voice Agents in India (tier-2/3 accuracy tables)
17. technologyreview.com — Inside India's scramble for AI independence
18. restofworld.org — India's frugal AI startups (Sarvam token-cost quote)
19. openthemagazine.com — Edtech's second attempt (Arivihan $10M, 80% tier-3 subscribers)
20. practicemock.com — PW Ask AI ~3M queries resolved
21. timesofindia.indiatimes.com — AI models score 345–351/360 on JEE Advanced 2026
22. indianaiapps.com — Best AI Apps for Students India 2026 (NCERT phrasing risk)
23. insightsonindia.com — AI in Indian Education: biases, accent failures
24. prepgraph.com — AI Tutor for NEET (Hinglish voice tutoring)
25. yuverse.ai — Voice AI for Competitive Exam Preparation
26. aigrants.in — AI Powered Doubt Solving App for Students
27. aninews.in — EDZA AI Launches JEE/NEET Tutors
28. fortuneindia.com — Salesforce: Indian SMBs moving fast on AI; WEF $490–685B MSME value
29. wadhwanifoundation.org — How AI is powering India's small businesses
30. addwebsolution.com — GPU compute subsidies for startups/MSMEs
