import type { UserProfile, UserProfilePatch, TopicMemory } from '../shared/schemas.js';

/**
 * 合并画像更新
 */
export function applyProfilePatch(profile: UserProfile, patch: UserProfilePatch): UserProfile {
  const updated = { ...profile };

  // 合并 knownTopics（按 topic 去重，confidence 加权平均）
  if (patch.addKnownTopics && patch.addKnownTopics.length > 0) {
    updated.knownTopics = mergeTopicMemories(profile.knownTopics, patch.addKnownTopics);
  }

  // 合并 weakTopics（按 topic 去重，confidence 加权平均）
  if (patch.addWeakTopics && patch.addWeakTopics.length > 0) {
    updated.weakTopics = mergeTopicMemories(profile.weakTopics, patch.addWeakTopics);
  }

  // 合并 avoidedTopics（保留最近 20 条）
  if (patch.avoidRepeating && patch.avoidRepeating.length > 0) {
    const combined = [...patch.avoidRepeating, ...profile.avoidedTopics];
    updated.avoidedTopics = [...new Set(combined)].slice(0, 20);
  }

  // 合并 topicScores（限制在 0-100）
  if (patch.topicScoreDeltas) {
    const newScores = { ...profile.topicScores };
    for (const [topic, delta] of Object.entries(patch.topicScoreDeltas)) {
      const current = newScores[topic] ?? 50;
      newScores[topic] = Math.max(0, Math.min(100, current + delta));
    }
    updated.topicScores = newScores;
  }

  // 更新推荐主题
  if (patch.nextRecommendedTopic) {
    updated.nextRecommendedTopic = patch.nextRecommendedTopic;
  }

  updated.updatedAt = new Date().toISOString();
  return updated;
}

/**
 * 合并 TopicMemory 数组
 * 按 topic 去重，confidence 取加权平均（新证据权重 0.7，旧证据权重 0.3）
 */
function mergeTopicMemories(existing: TopicMemory[], incoming: TopicMemory[]): TopicMemory[] {
  const map = new Map<string, TopicMemory>();

  // 先放入已有项
  for (const item of existing) {
    map.set(item.topic, item);
  }

  // 合并新项
  for (const item of incoming) {
    const existingItem = map.get(item.topic);
    if (existingItem) {
      // 加权平均：新证据权重 0.7
      const newConfidence = existingItem.confidence * 0.3 + item.confidence * 0.7;
      map.set(item.topic, {
        ...item,
        confidence: Math.round(newConfidence * 100) / 100,
        evidence: item.evidence, // 使用最新证据
        updatedAt: item.updatedAt,
      });
    } else {
      map.set(item.topic, item);
    }
  }

  return Array.from(map.values());
}
