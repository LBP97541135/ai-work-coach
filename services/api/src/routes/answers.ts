import { Router } from 'express';
import { readJsonFile, writeJsonFile, appendEventLog, listJsonFiles } from '../storage/JsonStore.js';
import { getLessonPath, getAnswerPath, getGradingPath, getEventLogPath, getLessonsDir, getSettingsPath, getProfilePath } from '../storage/paths.js';
import type { Lesson, UserAnswer, GradingResult, Settings, UserProfile } from '../shared/schemas.js';
import { getLocalDate } from '../shared/date.js';

const router = Router();

// 辅助函数：通过 lessonId 查找 lesson
async function findLessonById(lessonId: string): Promise<Lesson | null> {
  const files = await listJsonFiles(getLessonsDir());

  for (const file of files) {
    const lesson = await readJsonFile<Lesson>(getLessonPath(file.replace('.json', '')));
    if (lesson && lesson.id === lessonId) {
      return lesson;
    }
  }
  return null;
}

// PUT /api/lessons/:lessonId/answers - 保存草稿
router.put('/:lessonId/answers', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { status, answers } = req.body;

    // 查找对应的 lesson
    const lesson = await findLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const now = new Date().toISOString();
    const existing = await readJsonFile<UserAnswer>(getAnswerPath(lesson.date));

    const answer: UserAnswer = {
      lessonId,
      status: status || 'draft',
      answers: answers || (existing?.answers || []),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      submittedAt: existing?.submittedAt,
    };

    await writeJsonFile(getAnswerPath(lesson.date), answer);

    // 更新 lesson 状态
    if (status === 'draft') {
      lesson.status = 'draft';
      lesson.updatedAt = now;
      await writeJsonFile(getLessonPath(lesson.date), lesson);
    }

    await appendEventLog(getEventLogPath(lesson.date), {
      time: now,
      type: 'answer.draft_saved',
      lessonId,
    });

    // 更新行为画像
    const profile = await readJsonFile<UserProfile>(getProfilePath());
    if (profile) {
      profile.behavior.lastDraftUpdatedAt = now;
      profile.behavior.lastLessonStatus = 'draft';
      await writeJsonFile(getProfilePath(), profile);
    }

    res.json(answer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lessons/:lessonId/submit - 提交批改
router.post('/:lessonId/submit', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answers } = req.body;

    // 查找对应的 lesson
    const lesson = await findLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const now = new Date().toISOString();

    // 保存提交的答案
    const answer: UserAnswer = {
      lessonId,
      status: 'submitted',
      answers: answers || [],
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
    };
    await writeJsonFile(getAnswerPath(lesson.date), answer);

    // 更新 lesson 状态
    lesson.status = 'submitted';
    lesson.updatedAt = now;
    await writeJsonFile(getLessonPath(lesson.date), lesson);

    // 触发批改 - 使用配置的 Provider
    const settings = await readJsonFile<Settings>(getSettingsPath());
    if (!settings) throw new Error("Settings not found");

    let provider;
    if (settings.aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
      const { OpenAIProvider } = await import('../ai/OpenAIProvider.js');
      provider = new OpenAIProvider(process.env.OPENAI_API_KEY, settings.model || 'gpt-4.1');
    } else {
      const { MockAIProvider } = await import('../ai/MockAIProvider.js');
      provider = new MockAIProvider();
    }

    const { gradeAndProfileUpdate } = await import('../core/grading.js');
    const grading = await gradeAndProfileUpdate(provider, lesson, answer);

    // 更新 lesson 状态为 graded
    lesson.status = 'graded';
    lesson.updatedAt = new Date().toISOString();
    await writeJsonFile(getLessonPath(lesson.date), lesson);

    await appendEventLog(getEventLogPath(lesson.date), {
      time: new Date().toISOString(),
      type: 'answer.submitted',
      lessonId,
      score: grading.score,
    });

    // 更新行为画像
    const profile = await readJsonFile<UserProfile>(getProfilePath());
    if (profile) {
      const today = getLocalDate();
      const recentSubmitDates = profile.behavior.recentSubmitDates || [];
      recentSubmitDates.push(today);
      profile.behavior.recentSubmitDates = [...new Set(recentSubmitDates)].slice(-14);
      profile.behavior.lastSubmittedAt = new Date().toISOString();
      profile.behavior.lastAnsweredAt = new Date().toISOString();
      profile.behavior.lastLessonStatus = 'graded';

      // 计算连续学习天数
      const sortedDates = [...profile.behavior.recentSubmitDates].sort().reverse();
      let streak = 0;
      const checkDate = new Date(today);
      for (const d of sortedDates) {
        const expected = checkDate.toISOString().split('T')[0];
        if (d === expected) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      profile.behavior.streakDays = streak;

      await writeJsonFile(getProfilePath(), profile);
    }

    res.json({ answer, grading });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
