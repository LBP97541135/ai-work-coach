import type { Lesson, UserAnswer, GradingResult, UserProfile } from '../shared/schemas.js';
import type { AIProvider, GradeAnswersInput } from '../ai/AIProvider.js';
import { readJsonFile, writeJsonFile, appendEventLog } from '../storage/JsonStore.js';
import { getGradingPath, getProfilePath, getEventLogPath } from '../storage/paths.js';
import { applyProfilePatch } from './profileUpdater.js';

/**
 * 批改答案并更新画像
 */
export async function gradeAndProfileUpdate(
  provider: AIProvider,
  lesson: Lesson,
  answer: UserAnswer,
): Promise<GradingResult> {
  // 读取画像
  const profile = await readJsonFile<UserProfile>(getProfilePath());
  if (!profile) throw new Error("Profile not found");

  // 调用 AI Provider 批改
  const input: GradeAnswersInput = { lesson, answer, userProfile: profile };
  const grading = await provider.gradeAnswers(input);

  // 保存批改结果
  await writeJsonFile(getGradingPath(lesson.date), grading);

  // 更新画像
  const updatedProfile = applyProfilePatch(profile, grading.profilePatch);
  await writeJsonFile(getProfilePath(), updatedProfile);

  // 记录事件
  await appendEventLog(getEventLogPath(lesson.date), {
    time: new Date().toISOString(),
    type: "lesson.graded",
    lessonId: lesson.id,
    score: grading.score,
  });

  return grading;
}
