import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { seedIfEmpty } from './storage/seed.js';
import { startScheduler } from './core/scheduler.js';
import { MockAIProvider } from './ai/MockAIProvider.js';
import { OpenAIProvider } from './ai/OpenAIProvider.js';
import { readJsonFile } from './storage/JsonStore.js';
import { getSettingsPath } from './storage/paths.js';
import type { Settings } from './shared/schemas.js';
import type { AIProvider } from './ai/AIProvider.js';
import settingsRouter from './routes/settings.js';
import profileRouter from './routes/profile.js';
import lessonsRouter from './routes/lessons.js';
import answersRouter from './routes/answers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4317;

app.use(cors());
app.use(express.json());

// 路由注册
app.use('/api/settings', settingsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/lessons', answersRouter); // /:lessonId/answers, /:lessonId/submit

// 健康检查
app.get('/api/health', async (_req, res) => {
  const settings = await readJsonFile<Settings>(getSettingsPath());
  res.json({ ok: true, nextGeneration: settings?.dailyTime || '13:30', provider: settings?.aiProvider || 'mock' });
});

// 错误处理中间件
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 获取当前 AI Provider
function getProvider(settings: Settings): AIProvider {
  if (settings.aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider(process.env.OPENAI_API_KEY, settings.model || process.env.OPENAI_MODEL || 'gpt-4.1');
  }
  return new MockAIProvider();
}

// 启动
async function start() {
  await seedIfEmpty();

  const settings = await readJsonFile<Settings>(getSettingsPath());
  if (settings) {
    const provider = getProvider(settings);
    await startScheduler(provider);
  }

  app.listen(PORT, () => {
    console.log(`AI Work Coach API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
