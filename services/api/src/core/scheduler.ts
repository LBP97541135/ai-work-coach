import cron from 'node-cron';
import { readJsonFile } from '../storage/JsonStore.js';
import { getSettingsPath } from '../storage/paths.js';
import type { Settings } from '../shared/schemas.js';
import type { AIProvider } from '../ai/AIProvider.js';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * 解析 dailyTime 为 cron 表达式
 * dailyTime 格式: "HH:MM" (如 "13:30")
 */
function timeToCronExpression(dailyTime: string): string {
  const [hour, minute] = dailyTime.split(':').map(Number);
  return `${minute} ${hour} * * *`;
}

/**
 * 启动定时任务
 */
export async function startScheduler(provider: AIProvider): Promise<void> {
  // 停止已有的定时任务
  stopScheduler();

  const settings = await readJsonFile<Settings>(getSettingsPath());
  if (!settings) {
    console.warn('Settings not found, scheduler not started');
    return;
  }

  const cronExpression = timeToCronExpression(settings.dailyTime);
  console.log(`Scheduler: daily lesson generation at ${settings.dailyTime} (${cronExpression})`);

  scheduledTask = cron.schedule(cronExpression, async () => {
    try {
      const { generateTodayLesson } = await import('./lessonPlanner.js');
      const date = new Date().toISOString().split('T')[0];
      console.log(`Scheduler: generating lesson for ${date}...`);
      await generateTodayLesson(provider, date, false);
      console.log(`Scheduler: lesson generated for ${date}`);
    } catch (error: any) {
      console.error('Scheduler: failed to generate lesson:', error.message);
    }
  });

  scheduledTask.start();
}

/**
 * 停止定时任务
 */
export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
}

/**
 * 重启定时任务（设置变更后调用）
 */
export async function restartScheduler(provider: AIProvider): Promise<void> {
  await startScheduler(provider);
}

/**
 * 获取下一次生成时间
 */
export function getNextRunTime(): Date | null {
  // 简单实现：返回今天的 dailyTime，如果已过则返回明天的
  // node-cron 不直接提供下次运行时间，这里做简单计算
  return null;
}
