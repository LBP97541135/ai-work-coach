import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录（ai-work-coach/）
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

export function getDataRoot(): string {
  return path.join(PROJECT_ROOT, 'data');
}

export function getLessonPath(date: string): string {
  return path.join(getDataRoot(), 'lessons', `${date}.json`);
}

export function getAnswerPath(date: string): string {
  return path.join(getDataRoot(), 'answers', `${date}.json`);
}

export function getGradingPath(date: string): string {
  return path.join(getDataRoot(), 'grading', `${date}.json`);
}

export function getEventLogPath(date: string): string {
  // date 格式 YYYY-MM，取年月
  const month = date.slice(0, 7);
  return path.join(getDataRoot(), 'events', `${month}.jsonl`);
}

export function getSettingsPath(): string {
  return path.join(getDataRoot(), 'settings.json');
}

export function getProfilePath(): string {
  return path.join(getDataRoot(), 'profile.json');
}

export function getLessonsDir(): string {
  return path.join(getDataRoot(), 'lessons');
}

export function getAnswersDir(): string {
  return path.join(getDataRoot(), 'answers');
}

export function getGradingDir(): string {
  return path.join(getDataRoot(), 'grading');
}

export function getEventsDir(): string {
  return path.join(getDataRoot(), 'events');
}
