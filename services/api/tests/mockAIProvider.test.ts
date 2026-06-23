import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '../src/ai/MockAIProvider.js';
import type { GenerateLessonInput, GradeAnswersInput } from '../src/ai/AIProvider.js';
import type { Lesson, UserAnswer, UserProfile } from '../src/shared/schemas.js';

function makeProfile(): UserProfile {
  return {
    id: 'test',
    role: '实习生',
    goals: ['工作可用', '面试笔试'],
    knownTopics: [],
    weakTopics: [],
    avoidedTopics: [],
    preferredStyle: 'workbook',
    preferredDifficulty: 'deep',
    topicScores: {},
    behavior: {
      streakDays: 0,
      missedAnswerDays: 0,
      recentOpenDates: [],
      recentSubmitDates: [],
    },
    updatedAt: new Date().toISOString(),
  };
}

function makeLessonInput(category: string = 'agent'): GenerateLessonInput {
  return {
    date: '2026-06-22',
    category: category as any,
    difficulty: 'intermediate',
    userProfile: makeProfile(),
    recentTopics: [],
    reason: '测试生成',
  };
}

describe('MockAIProvider - generateLesson', () => {
  const provider = new MockAIProvider();

  it('should generate lesson for agent category', async () => {
    const input = makeLessonInput('agent');
    const lesson = await provider.generateLesson(input);
    expect(lesson.category).toBe('agent');
    expect(lesson.title).toBeTruthy();
    expect(lesson.sections.length).toBeGreaterThan(0);
    expect(lesson.questions.length).toBeGreaterThan(0);
    expect(lesson.date).toBe('2026-06-22');
    expect(lesson.status).toBe('generated');
  });

  it('should generate lesson for engineering category', async () => {
    const input = makeLessonInput('engineering');
    const lesson = await provider.generateLesson(input);
    expect(lesson.category).toBe('engineering');
    expect(lesson.title).toBeTruthy();
    expect(lesson.sections.length).toBeGreaterThan(0);
    expect(lesson.questions.length).toBeGreaterThan(0);
  });

  it('should generate lesson for product category', async () => {
    const input = makeLessonInput('product');
    const lesson = await provider.generateLesson(input);
    expect(lesson.category).toBe('product');
    expect(lesson.title).toBeTruthy();
    expect(lesson.sections.length).toBeGreaterThan(0);
    expect(lesson.questions.length).toBeGreaterThan(0);
  });

  it('should generate different content for different categories', async () => {
    const agentLesson = await provider.generateLesson(makeLessonInput('agent'));
    const engLesson = await provider.generateLesson(makeLessonInput('engineering'));
    const prodLesson = await provider.generateLesson(makeLessonInput('product'));
    
    expect(agentLesson.title).not.toBe(engLesson.title);
    expect(agentLesson.title).not.toBe(prodLesson.title);
    expect(engLesson.title).not.toBe(prodLesson.title);
  });

  it('should include sourceNotes', async () => {
    const lesson = await provider.generateLesson(makeLessonInput());
    expect(lesson.sourceNotes.length).toBeGreaterThan(0);
  });

  it('should include objectives', async () => {
    const lesson = await provider.generateLesson(makeLessonInput());
    expect(lesson.objectives.length).toBeGreaterThan(0);
  });
});

describe('MockAIProvider - gradeAnswers', () => {
  const provider = new MockAIProvider();

  it('should grade judge question with false as valid answer', async () => {
    const lesson = await provider.generateLesson(makeLessonInput('agent'));
    
    // 找到判断题
    const judgeQ = lesson.questions.find(q => q.type === 'judge');
    if (!judgeQ) {
      // 如果没有判断题，跳过
      return;
    }

    const answer: UserAnswer = {
      lessonId: lesson.id,
      status: 'submitted',
      answers: [{
        questionId: judgeQ.id,
        value: false, // 判断题选择 false
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    const grading = await provider.gradeAnswers({
      lesson,
      answer,
      userProfile: makeProfile(),
    });

    const feedback = grading.questionFeedback.find(f => f.questionId === judgeQ.id);
    expect(feedback).toBeDefined();
    // false 不应被判定为"未作答"
    expect(feedback!.feedback).not.toBe('未作答');
  });

  it('should return a score between 0 and 100', async () => {
    const lesson = await provider.generateLesson(makeLessonInput());
    const answer: UserAnswer = {
      lessonId: lesson.id,
      status: 'submitted',
      answers: lesson.questions.map(q => ({
        questionId: q.id,
        value: q.type === 'judge' ? false : q.type === 'single_choice' ? 'a' : q.type === 'multiple_choice' ? ['a'] : 'test answer',
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    const grading = await provider.gradeAnswers({
      lesson,
      answer,
      userProfile: makeProfile(),
    });

    expect(grading.score).toBeGreaterThanOrEqual(0);
    expect(grading.score).toBeLessThanOrEqual(100);
  });

  it('should include profilePatch in grading result', async () => {
    const lesson = await provider.generateLesson(makeLessonInput());
    const answer: UserAnswer = {
      lessonId: lesson.id,
      status: 'submitted',
      answers: lesson.questions.map(q => ({
        questionId: q.id,
        value: q.type === 'judge' ? true : q.type === 'single_choice' ? 'a' : q.type === 'multiple_choice' ? ['a'] : 'test',
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    const grading = await provider.gradeAnswers({
      lesson,
      answer,
      userProfile: makeProfile(),
    });

    expect(grading.profilePatch).toBeDefined();
    expect(grading.nextRecommendedTopic).toBeTruthy();
  });

  it('should mark unanswered questions as incorrect', async () => {
    const lesson = await provider.generateLesson(makeLessonInput());
    const answer: UserAnswer = {
      lessonId: lesson.id,
      status: 'submitted',
      answers: [], // 没有答案
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    const grading = await provider.gradeAnswers({
      lesson,
      answer,
      userProfile: makeProfile(),
    });

    expect(grading.score).toBe(0);
    grading.questionFeedback.forEach(fb => {
      expect(fb.verdict).toBe('incorrect');
    });
  });
});
