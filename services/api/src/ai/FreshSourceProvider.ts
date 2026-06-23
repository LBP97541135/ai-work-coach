import type { LessonCategory, ISODate, SourceNote } from '../shared/schemas.js';

export type FetchSourcesInput = {
  category: LessonCategory;
  date: ISODate;
  limit: number;
};

export interface FreshSourceProvider {
  fetchSources(input: FetchSourcesInput): Promise<SourceNote[]>;
}
