import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * 安全读取 JSON 文件
 * 文件不存在返回 null，JSON 解析失败抛出明确错误
 */
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw new Error(`Failed to parse JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * 安全写入 JSON 文件
 * 先写临时文件，再 rename，避免中断导致损坏
 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tmpName = `.tmp_${crypto.randomUUID()}_${path.basename(filePath)}`;
  const tmpPath = path.join(dir, tmpName);

  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(tmpPath, content, 'utf-8');
  await fs.rename(tmpPath, filePath);
}

/**
 * 追加事件日志
 */
export async function appendEventLog(logPath: string, event: Record<string, any>): Promise<void> {
  const dir = path.dirname(logPath);
  await fs.mkdir(dir, { recursive: true });

  const line = JSON.stringify(event) + '\n';
  await fs.appendFile(logPath, line, 'utf-8');
}

/**
 * 列出目录中的 JSON 文件
 */
export async function listJsonFiles(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter(f => f.endsWith('.json')).sort().reverse();
  } catch {
    return [];
  }
}
