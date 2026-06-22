import type { Lesson, LessonCategory, Difficulty, UserAnswer, GradingResult, UserProfile } from '../shared/schemas.js';

export type GenerateLessonInput = {
  date: string;
  category: LessonCategory;
  difficulty: Difficulty;
  userProfile: UserProfile;
  recentTopics: string[];
  reason: string;
};

export type GradeAnswersInput = {
  lesson: Lesson;
  answer: UserAnswer;
  userProfile: UserProfile;
};

export interface AIProvider {
  generateLesson(input: GenerateLessonInput): Promise<Lesson>;
  gradeAnswers(input: GradeAnswersInput): Promise<GradingResult>;
}
