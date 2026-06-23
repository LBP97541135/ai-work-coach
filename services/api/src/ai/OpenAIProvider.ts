import OpenAI from 'openai';
import type { AIProvider, GenerateLessonInput, GradeAnswersInput } from './AIProvider.js';
import type { Lesson, GradingResult } from '../shared/schemas.js';
import { buildGenerateLessonPrompt, buildGradeAnswersPrompt } from './prompts.js';

/**
 * 校验 Lesson 结构是否合法
 */
export function validateLessonStructure(data: any): string[] {
  const errors: string[] = [];
  if (!data.title || typeof data.title !== 'string') errors.push('missing/invalid title');
  if (!data.category || !['agent', 'engineering', 'product', 'mixed'].includes(data.category)) errors.push('missing/invalid category');
  if (!data.difficulty || !['basic', 'intermediate', 'advanced'].includes(data.difficulty)) errors.push('missing/invalid difficulty');
  if (!Array.isArray(data.sections) || data.sections.length === 0) errors.push('missing/empty sections');
  if (!Array.isArray(data.questions) || data.questions.length === 0) errors.push('missing/empty questions');

  // 校验 sections
  if (Array.isArray(data.sections)) {
    for (let i = 0; i < data.sections.length; i++) {
      const s = data.sections[i];
      if (!s.title) errors.push(`sections[${i}].title missing`);
      if (!s.kind || !['core', 'scenario', 'pitfall', 'workflow', 'summary'].includes(s.kind)) errors.push(`sections[${i}].kind invalid`);
      if (!s.markdown) errors.push(`sections[${i}].markdown missing`);
    }
  }

  // 校验 questions
  if (Array.isArray(data.questions)) {
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.type) errors.push(`questions[${i}].type missing`);
      if (!q.prompt) errors.push(`questions[${i}].prompt missing`);
      if (['single_choice', 'multiple_choice'].includes(q.type) && (!Array.isArray(q.options) || q.options.length === 0)) {
        errors.push(`questions[${i}].options missing for choice type`);
      }
    }
  }

  return errors;
}

/**
 * 校验 GradingResult 结构是否合法
 */
export function validateGradingStructure(data: any): string[] {
  const errors: string[] = [];
  if (!data.overall || typeof data.overall !== 'string') errors.push('missing/invalid overall');
  if (typeof data.score !== 'number') errors.push('missing/invalid score');
  if (!Array.isArray(data.questionFeedback) || data.questionFeedback.length === 0) errors.push('missing/empty questionFeedback');
  if (!Array.isArray(data.strengths)) errors.push('missing strengths');
  if (!Array.isArray(data.weaknesses)) errors.push('missing weaknesses');

  // 校验 questionFeedback
  if (Array.isArray(data.questionFeedback)) {
    for (let i = 0; i < data.questionFeedback.length; i++) {
      const fb = data.questionFeedback[i];
      if (!fb.verdict || !['correct', 'partially_correct', 'incorrect', 'open_ended'].includes(fb.verdict)) {
        errors.push(`questionFeedback[${i}].verdict invalid`);
      }
      if (!fb.feedback) errors.push(`questionFeedback[${i}].feedback missing`);
    }
  }

  return errors;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4.1') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateLesson(input: GenerateLessonInput): Promise<Lesson> {
    const prompt = buildGenerateLessonPrompt({
      category: input.category,
      difficulty: input.difficulty,
      userProfile: input.userProfile,
      recentTopics: input.recentTopics,
      reason: input.reason,
    });

    const response = await this.callWithRetry(async () => {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: '你是一个职业学习 Agent，负责生成高质量的每日训练内容。你必须返回严格的 JSON 格式。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });
      return completion.choices[0]?.message?.content || '';
    });

    const parsed = JSON.parse(response);

    // Schema 校验
    const errors = validateLessonStructure(parsed);
    if (errors.length > 0) {
      throw new Error(`Lesson schema validation failed: ${errors.join(', ')}`);
    }

    return this.validateAndFillLesson(parsed, input.date);
  }

  async gradeAnswers(input: GradeAnswersInput): Promise<GradingResult> {
    const prompt = buildGradeAnswersPrompt({
      lesson: input.lesson,
      answer: input.answer,
      userProfile: input.userProfile,
    });

    const response = await this.callWithRetry(async () => {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: '你是一个职业学习教练，负责批改用户的答案。你必须返回严格的 JSON 格式。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });
      return completion.choices[0]?.message?.content || '';
    });

    const parsed = JSON.parse(response);

    // Schema 校验
    const errors = validateGradingStructure(parsed);
    if (errors.length > 0) {
      throw new Error(`Grading schema validation failed: ${errors.join(', ')}`);
    }

    return this.validateAndFillGrading(parsed, input.lesson.id);
  }

  /**
   * 带重试的 API 调用
   */
  private async callWithRetry(fn: () => Promise<string>, maxRetries: number = 1): Promise<string> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        // 尝试解析 JSON 验证格式
        JSON.parse(result);
        return result;
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          console.warn(`OpenAI API call attempt ${attempt + 1} failed, retrying...`, error.message);
        }
      }
    }
    throw new Error(`OpenAI API call failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * 校验并补齐 Lesson 字段
   */
  private validateAndFillLesson(data: any, date: string): Lesson {
    const now = new Date().toISOString();
    return {
      id: data.id || `lesson_${date.replace(/-/g, '_')}`,
      date: date,
      title: data.title || '未命名课程',
      category: data.category || 'agent',
      difficulty: data.difficulty || 'intermediate',
      estimatedMinutes: data.estimatedMinutes || 15,
      reason: data.reason || '',
      objectives: data.objectives || [],
      sections: (data.sections || []).map((s: any) => ({
        id: s.id || `sec_${Date.now()}`,
        title: s.title || '',
        kind: s.kind || 'core',
        markdown: s.markdown || '',
      })),
      questions: (data.questions || []).map((q: any) => ({
        ...q,
        id: q.id || `q_${Date.now()}`,
        explanationHidden: true,
      })),
      sourceNotes: data.sourceNotes || [],
      status: 'generated',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 校验并补齐 GradingResult 字段
   */
  private validateAndFillGrading(data: any, lessonId: string): GradingResult {
    const now = new Date().toISOString();
    return {
      lessonId,
      overall: data.overall || '',
      score: data.score,
      questionFeedback: (data.questionFeedback || []).map((fb: any) => ({
        questionId: fb.questionId || '',
        verdict: fb.verdict || 'open_ended',
        feedback: fb.feedback || '',
        improvedAnswer: fb.improvedAnswer,
        abilitySignals: (fb.abilitySignals || []).map((s: any) => ({
          ability: s.ability || '',
          delta: s.delta || 0,
          reason: s.reason || '',
        })),
      })),
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      improvedExpressions: data.improvedExpressions || [],
      interviewReadyNotes: data.interviewReadyNotes || [],
      followUpQuestions: data.followUpQuestions || [],
      profilePatch: data.profilePatch || {},
      nextRecommendedTopic: data.nextRecommendedTopic || '',
      createdAt: now,
    };
  }
}
