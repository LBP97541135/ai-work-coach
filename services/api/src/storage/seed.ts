import { writeJsonFile, readJsonFile } from './JsonStore.js';
import { getSettingsPath, getProfilePath, getDataRoot, getLessonsDir, getAnswersDir, getGradingDir, getEventsDir } from './paths.js';
import fs from 'fs/promises';
import type { Settings, UserProfile } from '../shared/schemas.js';

const DEFAULT_SETTINGS: Settings = {
  timezone: "Asia/Shanghai",
  dailyTime: "13:30",
  topicWeights: {
    agent: 0.45,
    engineering: 0.35,
    product: 0.2,
  },
  allowFreshSearch: true,
  aiProvider: "mock",
  model: "gpt-4.1",
  updatedAt: "",
};

const DEFAULT_PROFILE: UserProfile = {
  id: "default",
  role: "实习生",
  goals: ["工作可用", "面试笔试", "AI Agent", "软件架构", "产品能力"],
  knownTopics: [],
  weakTopics: [],
  avoidedTopics: [],
  preferredStyle: "workbook",
  preferredDifficulty: "deep",
  topicScores: {},
  behavior: {
    streakDays: 0,
    missedAnswerDays: 0,
  },
  updatedAt: "",
};

export async function ensureDataDirs(): Promise<void> {
  const dirs = [getDataRoot(), getLessonsDir(), getAnswersDir(), getGradingDir(), getEventsDir()];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function seedIfEmpty(): Promise<void> {
  await ensureDataDirs();

  // 检查 settings.json
  const settings = await readJsonFile<Settings>(getSettingsPath());
  if (!settings) {
    await writeJsonFile(getSettingsPath(), { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() });
    console.log('Seeded default settings.json');
  }

  // 检查 profile.json
  const profile = await readJsonFile<UserProfile>(getProfilePath());
  if (!profile) {
    await writeJsonFile(getProfilePath(), { ...DEFAULT_PROFILE, updatedAt: new Date().toISOString() });
    console.log('Seeded default profile.json');
  }
}
