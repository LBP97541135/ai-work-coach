import { describe, it, expect } from 'vitest';
import { applyProfilePatch } from '../src/core/profileUpdater.js';
import type { UserProfile, UserProfilePatch, TopicMemory } from '../src/shared/schemas.js';

function makeProfile(overrides?: Partial<UserProfile['behavior']>): UserProfile {
  return {
    id: 'test',
    role: '实习生',
    goals: ['工作可用'],
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
      ...overrides,
    },
    updatedAt: new Date().toISOString(),
  };
}

describe('applyProfilePatch', () => {
  it('should add knownTopics', () => {
    const profile = makeProfile();
    const patch: UserProfilePatch = {
      addKnownTopics: [{
        topic: 'agent_basics',
        confidence: 0.8,
        evidence: '正确回答基础题',
        updatedAt: new Date().toISOString(),
      }],
    };
    const result = applyProfilePatch(profile, patch);
    expect(result.knownTopics).toHaveLength(1);
    expect(result.knownTopics[0].topic).toBe('agent_basics');
  });

  it('should add weakTopics', () => {
    const profile = makeProfile();
    const patch: UserProfilePatch = {
      addWeakTopics: [{
        topic: 'memory_design',
        confidence: 0.3,
        evidence: '记忆设计题答错',
        updatedAt: new Date().toISOString(),
      }],
    };
    const result = applyProfilePatch(profile, patch);
    expect(result.weakTopics).toHaveLength(1);
    expect(result.weakTopics[0].topic).toBe('memory_design');
  });

  it('should merge topic memories with weighted average', () => {
    const profile = makeProfile();
    profile.knownTopics = [{
      topic: 'agent_basics',
      confidence: 0.5,
      evidence: '旧证据',
      updatedAt: new Date().toISOString(),
    }];
    const patch: UserProfilePatch = {
      addKnownTopics: [{
        topic: 'agent_basics',
        confidence: 0.9,
        evidence: '新证据',
        updatedAt: new Date().toISOString(),
      }],
    };
    const result = applyProfilePatch(profile, patch);
    expect(result.knownTopics).toHaveLength(1);
    // 加权平均: 0.5 * 0.3 + 0.9 * 0.7 = 0.78
    expect(result.knownTopics[0].confidence).toBeCloseTo(0.78, 1);
    expect(result.knownTopics[0].evidence).toBe('新证据');
  });

  it('should apply topicScoreDeltas and clamp to 0-100', () => {
    const profile = makeProfile();
    profile.topicScores = { agent_basics: 50 };
    const patch: UserProfilePatch = {
      topicScoreDeltas: {
        agent_basics: 60, // 50 + 60 = 110 → clamped to 100
        new_topic: -10,   // 50 + (-10) = 40 (default 50 for new)
      },
    };
    const result = applyProfilePatch(profile, patch);
    expect(result.topicScores.agent_basics).toBe(100);
    expect(result.topicScores.new_topic).toBe(40);
  });

  it('should not allow topicScores below 0', () => {
    const profile = makeProfile();
    profile.topicScores = { test: 5 };
    const patch: UserProfilePatch = {
      topicScoreDeltas: { test: -20 }, // 5 + (-20) = -15 → clamped to 0
    };
    const result = applyProfilePatch(profile, patch);
    expect(result.topicScores.test).toBe(0);
  });

  it('should merge avoidedTopics and keep max 20', () => {
    const profile = makeProfile();
    profile.avoidedTopics = Array.from({ length: 18 }, (_, i) => `topic_${i}`);
    const patch: UserProfilePatch = {
      avoidRepeating: ['topic_0', 'new_topic'],
    };
    const result = applyProfilePatch(profile, patch);
    expect(result.avoidedTopics.length).toBeLessThanOrEqual(20);
    expect(result.avoidedTopics).toContain('new_topic');
  });

  it('should update nextRecommendedTopic', () => {
    const profile = makeProfile();
    const patch: UserProfilePatch = {
      nextRecommendedTopic: 'agent_advanced',
    };
    const result = applyProfilePatch(profile, patch);
    expect(result.nextRecommendedTopic).toBe('agent_advanced');
  });

  it('should not modify profile when patch is empty', () => {
    const profile = makeProfile();
    const result = applyProfilePatch(profile, {});
    expect(result.knownTopics).toEqual(profile.knownTopics);
    expect(result.weakTopics).toEqual(profile.weakTopics);
    expect(result.topicScores).toEqual(profile.topicScores);
  });
});
