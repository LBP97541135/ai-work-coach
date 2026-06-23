import { describe, it, expect } from 'vitest';
import { validateLessonStructure, validateGradingStructure } from '../src/ai/OpenAIProvider.js';

describe('validateLessonStructure', () => {
  it('should pass for valid lesson structure', () => {
    const data = {
      title: 'Test Lesson',
      category: 'agent',
      difficulty: 'intermediate',
      sections: [
        { title: 'Core', kind: 'core', markdown: 'content' },
      ],
      questions: [
        { type: 'single_choice', prompt: 'Question?', options: [{ id: 'a', text: 'A' }] },
      ],
    };
    const errors = validateLessonStructure(data);
    expect(errors).toHaveLength(0);
  });

  it('should report missing title', () => {
    const data = {
      category: 'agent',
      difficulty: 'intermediate',
      sections: [{ title: 'Core', kind: 'core', markdown: 'content' }],
      questions: [{ type: 'single_choice', prompt: 'Q?' }],
    };
    const errors = validateLessonStructure(data);
    expect(errors).toContain('missing/invalid title');
  });

  it('should report invalid category', () => {
    const data = {
      title: 'Test',
      category: 'invalid',
      difficulty: 'intermediate',
      sections: [{ title: 'Core', kind: 'core', markdown: 'content' }],
      questions: [{ type: 'single_choice', prompt: 'Q?' }],
    };
    const errors = validateLessonStructure(data);
    expect(errors).toContain('missing/invalid category');
  });

  it('should report invalid difficulty', () => {
    const data = {
      title: 'Test',
      category: 'agent',
      difficulty: 'expert',
      sections: [{ title: 'Core', kind: 'core', markdown: 'content' }],
      questions: [{ type: 'single_choice', prompt: 'Q?' }],
    };
    const errors = validateLessonStructure(data);
    expect(errors).toContain('missing/invalid difficulty');
  });

  it('should report empty sections', () => {
    const data = {
      title: 'Test',
      category: 'agent',
      difficulty: 'intermediate',
      sections: [],
      questions: [{ type: 'single_choice', prompt: 'Q?' }],
    };
    const errors = validateLessonStructure(data);
    expect(errors).toContain('missing/empty sections');
  });

  it('should report empty questions', () => {
    const data = {
      title: 'Test',
      category: 'agent',
      difficulty: 'intermediate',
      sections: [{ title: 'Core', kind: 'core', markdown: 'content' }],
      questions: [],
    };
    const errors = validateLessonStructure(data);
    expect(errors).toContain('missing/empty questions');
  });

  it('should report missing options for choice questions', () => {
    const data = {
      title: 'Test',
      category: 'agent',
      difficulty: 'intermediate',
      sections: [{ title: 'Core', kind: 'core', markdown: 'content' }],
      questions: [{ type: 'single_choice', prompt: 'Q?' }],
    };
    const errors = validateLessonStructure(data);
    expect(errors.some(e => e.includes('options missing'))).toBe(true);
  });
});

describe('validateGradingStructure', () => {
  it('should pass for valid grading structure', () => {
    const data = {
      overall: 'Good job',
      score: 80,
      questionFeedback: [
        { verdict: 'correct', feedback: 'Well done' },
      ],
      strengths: ['understanding'],
      weaknesses: [],
    };
    const errors = validateGradingStructure(data);
    expect(errors).toHaveLength(0);
  });

  it('should report missing overall', () => {
    const data = {
      score: 80,
      questionFeedback: [{ verdict: 'correct', feedback: 'ok' }],
      strengths: [],
      weaknesses: [],
    };
    const errors = validateGradingStructure(data);
    expect(errors).toContain('missing/invalid overall');
  });

  it('should report missing score', () => {
    const data = {
      overall: 'Good',
      questionFeedback: [{ verdict: 'correct', feedback: 'ok' }],
      strengths: [],
      weaknesses: [],
    };
    const errors = validateGradingStructure(data);
    expect(errors).toContain('missing/invalid score');
  });

  it('should report invalid verdict', () => {
    const data = {
      overall: 'Good',
      score: 80,
      questionFeedback: [{ verdict: 'invalid', feedback: 'ok' }],
      strengths: [],
      weaknesses: [],
    };
    const errors = validateGradingStructure(data);
    expect(errors.some(e => e.includes('verdict invalid'))).toBe(true);
  });
});
