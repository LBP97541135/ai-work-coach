import OpenAI from 'openai';
import type { AIProvider, GenerateLessonInput, GradeAnswersInput } from './AIProvider.js';
import type { Lesson, GradingResult } from '../shared/schemas.js';
import { buildGenerateLessonPrompt, buildGradeAnswersPrompt } from './prompts.js';

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
