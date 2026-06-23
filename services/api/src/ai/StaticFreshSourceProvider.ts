import type { FreshSourceProvider, FetchSourcesInput } from './FreshSourceProvider.js';
import type { SourceNote } from '../shared/schemas.js';
import { readJsonFile } from '../storage/JsonStore.js';
import path from 'path';
import { getDataRoot } from '../storage/paths.js';

/**
 * 从 data/sources/*.json 读取人工维护的资料源
 * 如果对应 category 的资料不存在，返回空数组
 */
export class StaticFreshSourceProvider implements FreshSourceProvider {
  async fetchSources(input: FetchSourcesInput): Promise<SourceNote[]> {
    const sourcesDir = path.join(getDataRoot(), 'sources');
    const filePath = path.join(sourcesDir, `${input.category}.json`);

    const data = await readJsonFile<{ sources: SourceNote[] }>(filePath);
    if (!data || !data.sources) {
      return [];
    }

    return data.sources.slice(0, input.limit);
  }
}
