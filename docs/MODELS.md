# Angvey — Open-Source Model Stack Reference

> The complete inventory of open-source AI models and features evaluated for Angvey,
> with the role each plays in our stack. Full market context in [RESEARCH.md](RESEARCH.md).

## 1. Language Models (the reasoning core)

| Model | Params | License | Context | Angvey role |
| --- | --- | --- | --- | --- |
| **Qwen 3 / 3.5 (8B–235B)** | 0.6B–235B | Apache 2.0 | 128K–1M | **Primary production LLM.** Best multilingual coverage (~201 languages incl. strong Hindi), Apache 2.0 permits commercial use, math-strong for JEE step-by-step solutions |
| **DeepSeek R1 (distills)** | 1.5B–70B | MIT | 128K | **Reasoning mode.** Chain-of-thought for JEE-Advanced level problems; MIT license; distilled 7B/14B run on a single GPU |
| **Gemma 3 / 4 (4B–27B)** | 4B–27B | Apache 2.0 / Gemma | 128K–256K | **Edge/on-device tier.** Runs on the institute's own hardware for the B2B Paathshala offering; multimodal (photo-of-a-doubt OCR) |
| **Llama 4 Scout** | 109B (17B active) | Llama Community | up to 10M | **Long-context batch jobs.** Whole-syllabus PYQ analysis, paper generation |
| **Mistral Small** | 24B | Apache 2.0 | 128K | **Indic fine-tune base** (the base Sarvam-M used for 10 Indian languages) |
| **Sarvam-M / OpenHathi** | 1B–24B | Open weights | 32K | **Hinglish booster.** Drop-in for Hindi/Hinglish answer phrasing |

## 2. Speech Models (the voice-first moat)

| Model | Task | License | Angvey role |
| --- | --- | --- | --- |
| **Whisper large-v3 / turbo** | STT | MIT | Voice-note transcription; robust to Indian accents; 99 languages |
| **faster-whisper (CTranslate2)** | STT | MIT | 4–10× faster Whisper for production serving |
| **Qwen3-ASR 1.7B** | STT | Apache 2.0 | Streaming multilingual STT (52 langs) for live voice mode |
| **AI4Bharat IndicConformer** | STT | Open | 22 Indic languages incl. dialect variants |
| **Coqui XTTS v2 / Piper** | TTS | MPL-2.0/MIT | Reading answers aloud in natural Hindi/Hinglish voices |
| **Web Speech API** (browser) | STT+TTS | Free | Zero-marginal-cost client tier — works on cheap Android Chrome, critical for ₹49 pricing |

## 3. Retrieval & Knowledge Layer

| Component | License | Angvey role |
| --- | --- | --- |
| **LangChain / LlamaIndex** | MIT | RAG orchestration over the NCERT-grounded corpus |
| **RAGFlow** | Apache 2.0 | Layout-aware PDF parsing of NCERT chapters & PYQ papers |
| **FAISS** | MIT | Vector index for the bilingual (en/hi) doubt corpus |
| **Bhashini APIs** | Free (Govt of India) | Translation + Indic datasets; sovereign fallback |

## 4. Serving Infrastructure

| Component | License | Angvey role |
| --- | --- | --- |
| **Ollama** | MIT | Dev/single-box model serving (`ollama pull qwen3:8b`) |
| **vLLM** | Apache 2.0 | High-throughput production serving with paged attention |
| **llama.cpp / whisper.cpp** | MIT | CPU-only deployment for low-cost institute servers |
| **Docker Compose** | OSS | One-command full-stack deploy (see repo root) |

## 5. The Two-Tier Engine Design (cost secret)

```
            student doubt (text or voice)
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Tier 1: Retrieval core       │  ← ~80% of doubts, ~₹0 marginal cost
        │  bilingual TF-IDF + fuzzy     │     (NCERT-accurate KB, instant, offline)
        │  match over curated KB        │
        └───────────────┬───────────────┘
           matched?     │ no / low score
                        ▼
        ┌───────────────────────────────┐
        │  Tier 2: Open-weights LLM     │  ← ~20% of doubts, self-hosted
        │  Qwen3 via Ollama/vLLM with   │     ($0.0003–0.013/1M tokens vs
        │  RAG context + step templates │      $0.15–3+ closed APIs)
        └───────────────────────────────┘
```

This hybrid is what lets Angvey sell at **₹49/month** while API-dependent competitors
cannot. The codebase ships with Tier 1 fully working out of the box (no GPU needed) and
Tier 2 enabled by a single env var (`OLLAMA_URL`).

## 6. Model Licensing Notes

- **Apache 2.0 / MIT** (Qwen, DeepSeek, Gemma 4, Whisper, Mistral Small, most tooling):
  free commercial use, fine-tuning, redistribution — no revenue share.
- **Llama Community / Gemma Terms**: permissive above 700M MAU; fine for Angvey at any
  foreseeable scale.
- Always keep an Apache-2.0-licensed default (Qwen) so licensing can never break the business.
