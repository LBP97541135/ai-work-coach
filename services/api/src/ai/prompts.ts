import type { UserProfile, LessonCategory, Difficulty } from '../shared/schemas.js';

/**
 * 生成课程 Prompt
 */
export function buildGenerateLessonPrompt(input: {
  category: LessonCategory;
  difficulty: Difficulty;
  userProfile: UserProfile;
  recentTopics: string[];
  reason: string;
}): string {
  const { category, difficulty, userProfile, recentTopics, reason } = input;

  const categoryLabels: Record<string, string> = {
    agent: 'AI Agent 技术',
    engineering: '软件架构与工程知识',
    product: '产品经理能力',
    mixed: '综合',
  };

  return `你是用户的个人职业学习 Agent。请根据用户画像、最近答题表现、最近学习历史，生成今天的深度学习训练。

## 用户信息
- 角色：${userProfile.role}
- 目标：${userProfile.goals.join('、')}
- 偏好风格：${userProfile.preferredStyle === 'workbook' ? '工作手册式' : userProfile.preferredStyle}
- 偏好难度：${difficulty === 'advanced' ? '深度' : difficulty === 'intermediate' ? '标准' : '轻量'}
- 已掌握主题：${userProfile.knownTopics.map(t => t.topic).join('、') || '无'}
- 薄弱主题：${userProfile.weakTopics.map(t => t.topic).join('、') || '无'}
- 最近学过的方向：${recentTopics.join('、') || '无'}

## 今日方向
- 主题类别：${categoryLabels[category] || category}
- 选择原因：${reason}

## 生成要求
1. 内容尽量新，结合近期技术、产品或行业实践
2. 避免重复用户已经熟悉的内容
3. 如果不确定用户水平，增加诊断题
4. 强度支持 15 分钟以上学习
5. 风格偏工作手册，结构清晰，段落短，可快速扫描
6. 题目考理解、迁移、判断和发散，不考死记硬背
7. 不直接给答案，提示用户先作答
8. 少讲抽象口号，多讲判断标准、操作路径、架构取舍

## 输出结构
必须返回严格 JSON 格式，不要返回 Markdown。Markdown 只能放在 sections 的 markdown 字段中。

\`\`\`json
{
  "title": "课程标题",
  "category": "${category}",
  "difficulty": "${difficulty}",
  "estimatedMinutes": 18,
  "reason": "为什么今天学这个",
  "objectives": ["目标1", "目标2"],
  "sections": [
    {
      "id": "sec_xxx",
      "title": "章节标题",
      "kind": "core|scenario|pitfall|workflow|summary",
      "markdown": "章节内容（支持 Markdown 格式）"
    }
  ],
  "questions": [
    {
      "id": "q_xxx",
      "type": "single_choice|multiple_choice|judge|short_answer|scenario|architecture|product|open",
      "prompt": "题目描述",
      "options": [{"id": "a", "text": "选项文本"}],
      "testsAbility": ["能力标签"],
      "difficulty": "basic|intermediate|advanced",
      "explanationHidden": true
    }
  ],
  "sourceNotes": [
    {
      "title": "来源标题",
      "note": "来源说明"
    }
  ]
}
\`\`\`

注意：
- 单选题(single_choice)和多选题(multiple_choice)必须有 options 字段
- 判断题(judge)不需要 options 字段
- 文本题(short_answer/scenario/architecture/product/open)不需要 options 字段，可以有 expectedAnswerShape 字段
- 每次推荐 6-10 道题
- sections 至少包含 2 个章节
- 所有 id 字段使用 "sec_" 或 "q_" 前缀加随机字符串`;
}

/**
 * 批改答案 Prompt
 */
export function buildGradeAnswersPrompt(input: {
  lesson: any;
  answer: any;
  userProfile: UserProfile;
}): string {
  const { lesson, answer, userProfile } = input;

  const questionsText = lesson.questions.map((q: any, i: number) => {
    let text = `题目 ${i + 1} (ID: ${q.id}, 类型: ${q.type}, 难度: ${q.difficulty}):\n${q.prompt}`;
    if (q.options) {
      text += '\n选项: ' + q.options.map((o: any) => `${o.id}. ${o.text}`).join(' | ');
    }
    return text;
  }).join('\n\n');

  const answersText = answer.answers.map((a: any, i: number) => {
    return `题目 ${a.questionId} 的答案: ${JSON.stringify(a.value)}`;
  }).join('\n');

  return `你是用户的个人职业学习教练。请根据今日题目、用户答案和用户画像进行批改。

## 用户信息
- 角色：${userProfile.role}
- 已掌握：${userProfile.knownTopics.map(t => t.topic).join('、') || '无'}
- 薄弱点：${userProfile.weakTopics.map(t => t.topic).join('、') || '无'}

## 今日课程
- 标题：${lesson.title}
- 类别：${lesson.category}

## 题目
${questionsText}

## 用户答案
${answersText}

## 批改要求
1. 判断每题是否正确或部分正确
2. 对开放题重点看推理过程和取舍理由
3. 指出用户答得好的地方
4. 指出需要修正的地方
5. 给出更好的表达方式，必要时提供面试可用话术
6. 更新用户掌握点、薄弱点和下一次学习建议
7. 对架构题重点看模块边界、数据流、状态、失败处理和扩展性
8. 对产品题重点看用户目标、场景、约束、指标和优先级

## 输出结构
必须返回严格 JSON 格式：

\`\`\`json
{
  "overall": "总体评价",
  "score": 80,
  "questionFeedback": [
    {
      "questionId": "q_xxx",
      "verdict": "correct|partially_correct|incorrect|open_ended",
      "feedback": "反馈内容",
      "improvedAnswer": "更好的答案（可选）",
      "abilitySignals": [
        {
          "ability": "能力标签",
          "delta": 10,
          "reason": "原因"
        }
      ]
    }
  ],
  "strengths": ["强项1"],
  "weaknesses": ["弱点1"],
  "improvedExpressions": ["更好的表达方式"],
  "interviewReadyNotes": ["面试可用话术"],
  "followUpQuestions": ["延伸思考问题"],
  "profilePatch": {
    "addKnownTopics": [{"topic": "主题", "confidence": 0.8, "evidence": "证据", "updatedAt": "${new Date().toISOString()}"}],
    "addWeakTopics": [{"topic": "主题", "confidence": 0.4, "evidence": "证据", "updatedAt": "${new Date().toISOString()}"}],
    "avoidRepeating": ["避免重复的主题"],
    "topicScoreDeltas": {"能力标签": 10},
    "nextRecommendedTopic": "推荐主题"
  },
  "nextRecommendedTopic": "明日推荐主题"
}
\`\`\`

注意：
- score 范围 0-100
- delta 范围建议 -10 到 +10
- confidence 范围 0-1
- verdict 只能是 correct / partially_correct / incorrect / open_ended 之一`;
}
