/**
 * Voice layer — Web Speech API wrappers.
 *
 * Rationale (see docs/MODELS.md): browser-native STT/TTS has ZERO marginal
 * cost and works on the cheap Android phones our students actually own.
 * Server-side Whisper / IndicConformer is the roadmap upgrade for dialects.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const SR: any =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;

export const speechSupported = Boolean(SR);
export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export interface ListenHandlers {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

/** Starts Hindi-first recognition (falls back to en-IN on unsupported devices). */
export function startListening(handlers: ListenHandlers, lang = 'hi-IN') {
  if (!SR) {
    handlers.onError?.('Is phone/browser par voice support nahi hai. Text mein likh do 🙏');
    return null;
  }
  const recognition = new SR();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let finalText = '';
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) finalText += res[0].transcript;
      else interim += res[0].transcript;
    }
    if (finalText) handlers.onResult(finalText.trim(), true);
    else if (interim) handlers.onResult(interim.trim(), false);
  };

  recognition.onerror = (event: any) => {
    const map: Record<string, string> = {
      'not-allowed': 'Mic ki permission chahiye — browser settings se allow karo.',
      'no-speech': 'Kuch sunaayi nahi diya. Dobara bolo?',
      network: 'Network issue — voice ke liye internet chahiye.',
      aborted: '',
    };
    const msg = map[event.error] ?? `Voice error: ${event.error}`;
    if (msg) handlers.onError?.(msg);
  };

  recognition.onend = () => handlers.onEnd?.();

  try {
    recognition.start();
  } catch {
    handlers.onError?.('Voice start nahi ho paaya. Dobara try karo.');
    return null;
  }
  return recognition;
}

/** Speak an answer aloud, stripping markdown so it reads naturally. */
export function speak(text: string, lang = 'hi-IN') {
  if (!ttsSupported) return;
  window.speechSynthesis.cancel();
  const clean = text
    .replace(/\*\*/g, '')
    .replace(/[#`>]/g, '')
    .replace(/📖|💡/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = lang;
  utter.rate = 0.95;
  utter.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith('hi')) ||
    voices.find((v) => v.lang.startsWith('en-IN'));
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (ttsSupported) window.speechSynthesis.cancel();
}
