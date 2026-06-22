import { Router } from 'express';
import { readJsonFile, listJsonFiles } from '../storage/JsonStore.js';
import { getLessonPath, getAnswerPath, getGradingPath, getLessonsDir, getSettingsPath } from '../storage/paths.js';
import type { Lesson, UserAnswer, GradingResult, Settings } from '../shared/schemas.js';

const router = Router();

// GET /api/lessons/today
router.get('/today', async (_req, res) => {
  try {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lesson = await readJsonFile<Lesson>(getLessonPath(date));
    const answer = await readJsonFile<UserAnswer>(getAnswerPath(date));
    const grading = await readJsonFile<GradingResult>(getGradingPath(date));
    res.json({ lesson, answer, grading });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lessons - 历史记录
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = parseInt(req.query.limit as string) || 30;

    const lessonsDir = getLessonsDir();
    const files = await listJsonFiles(lessonsDir);
    const limitedFiles = files.slice(0, limit);

    const lessons: Lesson[] = [];
    for (const file of limitedFiles) {
      const lesson = await readJsonFile<Lesson>(getLessonPath(file.replace('.json', '')));
      if (lesson) {
        if (!category || lesson.category === category) {
          lessons.push(lesson);
        }
      }
    }

    res.json({ items: lessons });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lessons/generate
router.post('/generate', async (req, res) => {
  try {
    const { date: reqDate, force } = req.body;
    const date = reqDate || new Date().toISOString().split('T')[0];

    // 动态导入以避免循环依赖
    const { generateTodayLesson } = await import('../core/lessonPlanner.js');

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

    const lesson = await generateTodayLesson(provider, date, force);

    // 同时返回 answer 和 grading（如果存在）
    const answer = await readJsonFile<UserAnswer>(getAnswerPath(date));
    const grading = await readJsonFile<GradingResult>(getGradingPath(date));

    res.json({ lesson, answer, grading });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
