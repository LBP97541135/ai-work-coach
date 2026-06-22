import type { Lesson, LessonCategory, UserProfile, Settings } from '../shared/schemas.js';
import type { AIProvider, GenerateLessonInput } from '../ai/AIProvider.js';
import { readJsonFile, writeJsonFile, listJsonFiles, appendEventLog } from '../storage/JsonStore.js';
import { getLessonPath, getSettingsPath, getProfilePath, getLessonsDir, getEventLogPath } from '../storage/paths.js';
import { generateLessonId } from '../shared/ids.js';

/**
 * 计算主题分数
 */
function calculateTopicScores(
  category: LessonCategory,
  settings: Settings,
  profile: UserProfile,
  recentTopics: string[]
): number {
  const weights = settings.topicWeights;
  const weight = weights[category as keyof typeof weights] || 0.2;

  // weakTopicBoost: 如果该方向最近出现弱点，+0.25
  const weakTopicBoost = profile.weakTopics.some(t =>
    t.topic.toLowerCase().includes(category === "agent" ? "agent" : category === "engineering" ? "engineer" : "product")
  ) ? 0.25 : 0;

  // freshnessBoost: 如果设置允许新近内容，+0.1
  const freshnessBoost = settings.allowFreshSearch ? 0.1 : 0;

  // recentlyCoveredPenalty: 最近 2 天讲过，-0.3
  const recentlyCovered = recentTopics.slice(0, 2);
  const recentlyCoveredPenalty = recentlyCovered.includes(category) ? 0.3 : 0;

  // knownTopicPenalty: 已高置信掌握，-0.2
  const knownTopicPenalty = profile.knownTopics.some(t =>
    t.confidence > 0.7 && t.topic.toLowerCase().includes(category === "agent" ? "agent" : category === "engineering" ? "engineer" : "product")
  ) ? 0.2 : 0;

  return weight + weakTopicBoost + freshnessBoost - recentlyCoveredPenalty - knownTopicPenalty;
}

/**
 * 选择最佳主题
 */
function selectBestCategory(settings: Settings, profile: UserProfile, recentTopics: string[]): { category: LessonCategory; score: number } {
  const categories: LessonCategory[] = ["agent", "engineering", "product", "mixed"];
  let best: { category: LessonCategory; score: number } = { category: "agent", score: -Infinity };

  for (const cat of categories) {
    const score = calculateTopicScores(cat, settings, profile, recentTopics);
    if (score > best.score) {
      best = { category: cat, score };
    }
  }

  return best;
}

/**
 * 确定难度
 */
function selectDifficulty(profile: UserProfile): "basic" | "intermediate" | "advanced" {
  const scores = Object.values(profile.topicScores);
  if (scores.length === 0) return "intermediate";

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avgScore >= 85) return "advanced";
  if (avgScore >= 60) return "intermediate";
  return "basic";
}

/**
 * 获取最近训练的主题列表
 */
async function getRecentTopics(limit: number = 5): Promise<string[]> {
  const lessonsDir = getLessonsDir();
  const files = await listJsonFiles(lessonsDir);
  const recentFiles = files.slice(0, limit);

  const topics: string[] = [];
  for (const file of recentFiles) {
    const lesson = await readJsonFile<Lesson>(getLessonPath(file.replace('.json', '')));
    if (lesson) {
      topics.push(lesson.category);
    }
  }
  return topics;
}

/**
 * 生成今日训练
 */
export async function generateTodayLesson(
  provider: AIProvider,
  date: string,
  force: boolean = false
): Promise<Lesson> {
  // 检查当天是否已有 lesson
  const existingLesson = await readJsonFile<Lesson>(getLessonPath(date));
  if (existingLesson && !force) {
    return existingLesson;
  }

  // 读取设置和画像
  const settings = await readJsonFile<Settings>(getSettingsPath());
  const profile = await readJsonFile<UserProfile>(getProfilePath());

  if (!settings) throw new Error("Settings not found");
  if (!profile) throw new Error("Profile not found");

  // 选择主题
  const recentTopics = await getRecentTopics();
  const { category, score } = selectBestCategory(settings, profile, recentTopics);
  const difficulty = selectDifficulty(profile);

  // 生成原因
  const reason = `根据你的学习画像，今日重点学习 ${category} 方向的内容。主题评分: ${score.toFixed(2)}`;

  // 调用 AI Provider
  const input: GenerateLessonInput = {
    date,
    category,
    difficulty,
    userProfile: profile,
    recentTopics,
    reason,
  };

  const lesson = await provider.generateLesson(input);

  // 保存 lesson
  await writeJsonFile(getLessonPath(date), lesson);

  // 记录事件
  await appendEventLog(getEventLogPath(date), {
    time: new Date().toISOString(),
    type: "lesson.generated",
    lessonId: lesson.id,
    category: lesson.category,
  });

  return lesson;
}
