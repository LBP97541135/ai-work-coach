import type { TodayResponse, UserAnswer, GradingResult, UserProfile, Settings, HistoryItem, AnswerItem } from './types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request<{ ok: boolean; nextGeneration: string; provider: string }>('/health'),

  getToday: () => request<TodayResponse>('/lessons/today'),

  generateLesson: (date?: string, force?: boolean) =>
    request<TodayResponse>('/lessons/generate', {
      method: 'POST',
      body: JSON.stringify({ date, force }),
    }),

  saveDraft: (lessonId: string, answers: AnswerItem[], status: string = 'draft') =>
    request<UserAnswer>(`/lessons/${lessonId}/answers`, {
      method: 'PUT',
      body: JSON.stringify({ status, answers }),
    }),

  submitAnswers: (lessonId: string, answers: AnswerItem[]) =>
    request<{ answer: UserAnswer; grading: GradingResult }>(`/lessons/${lessonId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  getHistory: (category?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return request<HistoryItem>(`/lessons${qs ? `?${qs}` : ''}`);
  },

  getProfile: () => request<UserProfile>('/profile'),
  updateProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getSettings: () => request<Settings>('/settings'),
  updateSettings: (data: Partial<Settings>) =>
    request<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
