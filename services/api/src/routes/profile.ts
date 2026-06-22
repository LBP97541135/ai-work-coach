import { Router } from 'express';
import { readJsonFile, writeJsonFile, appendEventLog } from '../storage/JsonStore.js';
import { getProfilePath, getEventLogPath } from '../storage/paths.js';
import type { UserProfile } from '../shared/schemas.js';

const router = Router();

// GET /api/profile
router.get('/', async (_req, res) => {
  try {
    const profile = await readJsonFile<UserProfile>(getProfilePath());
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/profile
router.put('/', async (req, res) => {
  try {
    const profile = await readJsonFile<UserProfile>(getProfilePath());
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const updated = { ...profile, ...req.body, updatedAt: new Date().toISOString() };
    await writeJsonFile(getProfilePath(), updated);
    await appendEventLog(getEventLogPath(new Date().toISOString()), {
      time: new Date().toISOString(),
      type: 'profile.updated',
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
