export function generateLessonId(date: string): string {
  return `lesson_${date.replace(/-/g, '_')}`;
}

export function generateQuestionId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateSectionId(): string {
  return `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
