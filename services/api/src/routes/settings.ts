import { Router } from 'express';
import { readJsonFile, writeJsonFile, appendEventLog } from '../storage/JsonStore.js';
import { getSettingsPath, getEventLogPath } from '../storage/paths.js';
import type { Settings } from '../shared/schemas.js';

const router = Router();

// GET /api/settings
router.get('/', async (_req, res) => {
  try {
    const settings = await readJsonFile<Settings>(getSettingsPath());
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const settings = await readJsonFile<Settings>(getSettingsPath());
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    const updated = { ...settings, ...req.body, updatedAt: new Date().toISOString() };
    await writeJsonFile(getSettingsPath(), updated);
    await appendEventLog(getEventLogPath(new Date().toISOString()), {
      time: new Date().toISOString(),
      type: 'settings.updated',
    });

    // 如果 dailyTime 或 aiProvider 变了，重启调度器
    if (req.body.dailyTime || req.body.aiProvider) {
      try {
        const { restartScheduler } = await import('../core/scheduler.js');
        const { MockAIProvider } = await import('../ai/MockAIProvider.js');
        const { OpenAIProvider } = await import('../ai/OpenAIProvider.js');

        const provider = updated.aiProvider === 'openai' && process.env.OPENAI_API_KEY
          ? new OpenAIProvider(process.env.OPENAI_API_KEY, updated.model || 'gpt-4.1')
          : new MockAIProvider();

        await restartScheduler(provider);
      } catch (err) {
        console.error('Failed to restart scheduler:', err);
      }
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
