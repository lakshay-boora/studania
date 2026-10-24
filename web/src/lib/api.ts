/** Typed API client for the Angvey server. */

const USER_KEY = 'angvey.user';

/** Anonymous, device-scoped user id — no login wall for the free tier. */
export function getUserId(): string {
  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(USER_KEY, id);
  }
  return id;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-angvey-user': getUserId(),
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as any)?.message || (data as any)?.error || `Request failed (${res.status})`);
    (err as any).status = res.status;
    (err as any).payload = data;
    throw err;
  }
  return data as T;
}

export type Lang = 'auto' | 'hinglish' | 'hi' | 'en';

export interface RelatedTopic {
  id: string;
  topic: string;
}

export interface ChatReply {
  text: string;
  answer: { plain: string; steps: { n: number; text: string }[]; tip: string | null };
  subject: string;
  topic: string | null;
  exams: string[];
  source: string | null;
  related: RelatedTopic[];
  engine: string;
  confidence: string;
  score?: number;
  tookMs: number;
  suggestions?: { id: string; topic: string; subject: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  meta?: { subject?: string; topic?: string; engine?: string } | null;
  source?: string | null;
  at?: string;
}

export interface Question {
  id: string;
  subject: string;
  topic: string;
  exam: string;
  difficulty: string;
  question: { en: string; hi: string };
  options: string[];
}

export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: { en: string; hi: string };
  topic: string;
  subject: string;
}

export interface Stats {
  user: { id: string; name: string; exam: string; plan: string; streak: number; doubtsToday: number };
  totals: { attempts: number; correct: number; accuracy: number; doubtsAsked: number };
  subjects: {
    subject: string;
    attempted: number;
    correct: number;
    accuracy: number;
    topics: { topic: string; attempted: number; correct: number; accuracy: number }[];
  }[];
  weakTopics: { topic: string; subject: string; attempted: number; correct: number; accuracy: number }[];
  last7Days: { date: string; attempted: number; correct: number }[];
  doubtsBySubject: Record<string, number>;
}

export interface PlanTask {
  id: string;
  title: string;
  reason: string;
  kind: 'practice' | 'revision';
  due: string;
  minutes: number;
  priority: 'high' | 'normal';
  repetitions: number;
}

export const api = {
  health: () => request<{ ok: boolean; engine: any }>('/health'),

  brand: () =>
    request<{
      name: string;
      tagline: string;
      subline: string;
      limits: { freeDailyDoubts: number };
      plans: { id: string; name: string; price: string; period: string; features: string[]; highlight?: boolean }[];
    }>('/brand'),

  chat: (message: string, lang: Lang) =>
    request<ChatReply>('/chat', { method: 'POST', body: JSON.stringify({ message, lang }) }),

  history: () => request<{ messages: ChatMessage[] }>('/chat/history?limit=60'),

  clearHistory: () => request<{ removed: number }>('/chat/history', { method: 'DELETE' }),

  suggestions: () => request<{ suggestions: string[] }>('/chat/suggestions'),

  subjects: () =>
    request<{ subjects: { subject: string; total: number; topics: string[] }[]; total: number }>(
      '/practice/subjects'
    ),

  questions: (subject: string, difficulty: string, limit = 10) =>
    request<{ count: number; questions: Question[] }>(
      `/practice/questions?subject=${encodeURIComponent(subject)}&difficulty=${encodeURIComponent(
        difficulty
      )}&limit=${limit}`
    ),

  answer: (questionId: string, answerIndex: number) =>
    request<AnswerResult>('/practice/answer', {
      method: 'POST',
      body: JSON.stringify({ questionId, answerIndex }),
    }),

  stats: () => request<Stats>('/progress'),

  updateProfile: (patch: { name?: string; exam?: string }) =>
    request<{ user: any }>('/progress/profile', { method: 'PATCH', body: JSON.stringify(patch) }),

  planner: () =>
    request<{
      exam: string;
      today: string;
      dueToday: number;
      tasks: PlanTask[];
      ladder: number[];
      note: string;
    }>('/planner'),

  completeTask: (taskId: string, done: boolean) =>
    request<{ ok: boolean }>('/planner/complete', {
      method: 'POST',
      body: JSON.stringify({ taskId, done }),
    }),
};
