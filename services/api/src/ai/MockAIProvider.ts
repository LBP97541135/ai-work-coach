import type { AIProvider, GenerateLessonInput, GradeAnswersInput } from './AIProvider.js';
import type { Lesson, LessonSection, Question, GradingResult, QuestionFeedback, AbilitySignal, UserProfilePatch, AnswerItem } from '../shared/schemas.js';
import { generateLessonId, generateQuestionId, generateSectionId } from '../shared/ids.js';

const MOCK_SECTIONS: LessonSection[] = [
  {
    id: generateSectionId(),
    title: "核心概念",
    kind: "core",
    markdown: `## 什么是 AI Agent\n\nAI Agent 是一种能够自主感知环境、做出决策并执行动作的智能系统。与传统的被动响应式 AI 不同，Agent 具备以下核心特征：\n\n1. **自主性**：能够独立规划和执行任务，而非仅响应指令\n2. **感知能力**：能理解环境状态和用户意图\n3. **决策能力**：在多个可选方案中选择最优路径\n4. **执行能力**：通过工具调用、API 操作等方式影响外部环境\n5. **反思能力**：能评估自身行为的效果并调整策略\n\n### Agent = LLM + 记忆 + 工具 + 规划\n\n一个典型的 Agent 架构可以拆解为：\n- **LLM**：作为推理引擎，负责理解和决策\n- **记忆系统**：短期记忆（对话上下文）+ 长期记忆（用户偏好、历史经验）\n- **工具集**：搜索、代码执行、API 调用等外部能力\n- **规划模块**：将复杂任务拆解为可执行的子任务序列`,
  },
  {
    id: generateSectionId(),
    title: "真实工作场景",
    kind: "scenario",
    markdown: `## 场景：构建一个客服 Agent\n\n假设你在实习中需要为一个 SaaS 产品构建智能客服 Agent，你需要考虑：\n\n### 架构决策\n1. **单 Agent 还是多 Agent？**\n   - 简单问答：单 Agent + RAG 足够\n   - 复杂工单：多 Agent 协作（分类 Agent → 处理 Agent → 质检 Agent）\n\n2. **记忆设计**\n   - 短期：当前对话的上下文窗口\n   - 长期：用户历史工单、偏好、常见问题\n\n3. **工具设计**\n   - 查询知识库\n   - 创建/更新工单\n   - 转人工\n   - 发送通知\n\n4. **安全边界**\n   - 退款操作需要人工确认（Human-in-the-loop）\n   - 敏感信息脱敏\n   - 单日操作次数限制`,
  },
  {
    id: generateSectionId(),
    title: "常见误区",
    kind: "pitfall",
    markdown: `## Agent 开发的常见误区\n\n### 1. 把 Agent 当作万能解决方案\n不是所有问题都需要 Agent。如果任务路径确定、无需动态决策，简单的 Pipeline 或规则系统更可靠。\n\n**判断标准**：任务是否需要根据中间结果动态调整下一步？\n\n### 2. 忽视 Prompt 工程的投入\nAgent 的行为质量高度依赖 System Prompt。很多团队花大量时间搭架构，却忽视 Prompt 的迭代优化。\n\n### 3. 过度自主化\n让 Agent 做太多决策会导致不可预测的行为。关键操作必须有 Human-in-the-loop 机制。\n\n### 4. 忽视可观测性\nAgent 的决策链路复杂，没有好的日志和追踪机制，调试会非常困难。应该在设计之初就考虑可观测性。`,
  },
];

const MOCK_QUESTIONS: Question[] = [
  {
    id: generateQuestionId(),
    type: "single_choice",
    prompt: "以下哪个不是 AI Agent 的核心特征？",
    options: [
      { id: "a", text: "自主性" },
      { id: "b", text: "被动响应" },
      { id: "c", text: "工具使用" },
      { id: "d", text: "规划能力" },
    ],
    testsAbility: ["agent_core_concepts"],
    difficulty: "basic",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "multiple_choice",
    prompt: "在设计客服 Agent 时，以下哪些操作应该设置 Human-in-the-loop？（选择所有适用项）",
    options: [
      { id: "a", text: "查询知识库回答常见问题" },
      { id: "b", text: "执行退款操作" },
      { id: "c", text: "修改用户账户信息" },
      { id: "d", text: "发送满意度调查" },
    ],
    testsAbility: ["agent_safety", "human_in_the_loop"],
    difficulty: "intermediate",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "judge",
    prompt: "所有任务都应该使用 Agent 架构来获得最佳效果。",
    testsAbility: ["agent_judgment"],
    difficulty: "basic",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "scenario",
    prompt: "你正在设计一个代码审查 Agent，它需要自动审查 PR 并给出修改建议。请描述你会如何设计它的记忆系统和工具集，以及哪些操作需要人工确认。",
    expectedAnswerShape: "应包含：记忆设计（短期=PR diff上下文，长期=项目代码规范/历史问题）、工具集（读代码、运行测试、查规范）、人工确认点（合并操作、重大架构建议）",
    testsAbility: ["agent_design", "memory_design", "tool_design"],
    difficulty: "advanced",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "architecture",
    prompt: "请对比 ReAct 模式和 Reflection 模式在 Agent 中的应用场景，并给出各自的适用条件。",
    expectedAnswerShape: "ReAct：边推理边行动，适合需要与环境交互的任务；Reflection：先推理再行动并反思，适合需要自我纠错的复杂任务",
    testsAbility: ["agent_patterns", "react_vs_reflection"],
    difficulty: "advanced",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "product",
    prompt: "如果你的团队要做一个面向非技术用户的 AI Agent 产品，你会如何在'自主性'和'可控性'之间做取舍？请给出具体的设计原则。",
    expectedAnswerShape: "应包含：渐进式自主（先建议后执行）、操作可撤销、明确展示Agent的推理过程、关键操作需确认",
    testsAbility: ["agent_product_design", "autonomy_vs_control"],
    difficulty: "advanced",
    explanationHidden: true,
  },
];

export class MockAIProvider implements AIProvider {
  async generateLesson(input: GenerateLessonInput): Promise<Lesson> {
    const now = new Date().toISOString();
    return {
      id: generateLessonId(input.date),
      date: input.date,
      title: "AI Agent 核心架构与设计模式",
      category: input.category,
      difficulty: input.difficulty,
      estimatedMinutes: 18,
      reason: input.reason || "根据你的学习画像，今日重点学习 AI Agent 的核心概念和设计模式",
      objectives: [
        "理解 AI Agent 的核心特征与架构组成",
        "掌握 Agent 记忆系统的设计方法",
        "理解 ReAct 和 Reflection 模式的适用场景",
        "学会在自主性和可控性之间做取舍",
      ],
      sections: MOCK_SECTIONS,
      questions: MOCK_QUESTIONS,
      sourceNotes: [
        {
          title: "基于模型知识生成",
          note: "本次训练内容基于 AI 模型知识生成，未联网验证",
        },
      ],
      status: "generated",
      createdAt: now,
      updatedAt: now,
    };
  }

  async gradeAnswers(input: GradeAnswersInput): Promise<GradingResult> {
    const { lesson, answer, userProfile } = input;
    const now = new Date().toISOString();

    const questionFeedback: QuestionFeedback[] = lesson.questions.map((q: Question) => {
      const ans = answer.answers.find((a: AnswerItem) => a.questionId === q.id);
      const hasAnswer = ans && ans.value !== "" && ans.value !== false && !(Array.isArray(ans.value) && ans.value.length === 0);
      const answerLength = typeof ans?.value === 'string' ? ans.value.length : 0;

      if (!hasAnswer) {
        return {
          questionId: q.id,
          verdict: "incorrect" as const,
          feedback: "未作答",
          abilitySignals: [{ ability: q.testsAbility[0] || "general", delta: -5, reason: "未作答" }],
        };
      }

      // 简单的模拟批改逻辑
      if (q.type === "single_choice") {
        const val = ans!.value as string;
        const isCorrect = val === "b"; // Mock: 选项 b 是正确答案
        return {
          questionId: q.id,
          verdict: isCorrect ? "correct" as const : "incorrect" as const,
          feedback: isCorrect ? "正确！被动响应不是 Agent 的核心特征，Agent 的关键在于自主性。" : "再想想，Agent 与普通 AI 应用的核心区别是什么？",
          improvedAnswer: isCorrect ? undefined : "正确答案是 b - 被动响应。Agent 的核心在于自主性，而非被动等待指令。",
          abilitySignals: [{ ability: q.testsAbility[0] || "general", delta: isCorrect ? 10 : -5, reason: isCorrect ? "正确识别核心概念" : "概念理解有误" }],
        };
      }

      if (q.type === "multiple_choice") {
        const val = ans!.value as string[];
        const correctIds = ["b", "c"];
        const isCorrect = val.includes("b") && val.includes("c") && !val.includes("a");
        return {
          questionId: q.id,
          verdict: isCorrect ? "correct" as const : "partially_correct" as const,
          feedback: isCorrect ? "正确！退款和修改账户信息等敏感操作需要人工确认。" : "部分正确。退款操作和修改账户信息属于敏感操作，需要人工确认。",
          improvedAnswer: isCorrect ? undefined : "正确答案是 b, c。查询知识库和发送调查是低风险操作，可以自动化。",
          abilitySignals: [{ ability: "agent_safety", delta: isCorrect ? 10 : 3, reason: isCorrect ? "正确识别安全边界" : "对安全边界理解不够完整" }],
        };
      }

      if (q.type === "judge") {
        const val = ans!.value;
        const isFalse = val === false || val === "false";
        return {
          questionId: q.id,
          verdict: isFalse ? "correct" as const : "incorrect" as const,
          feedback: isFalse ? "正确！不是所有任务都需要 Agent，简单确定的任务用 Pipeline 更可靠。" : "Agent 不是万能的，确定性的任务用简单流程更高效。",
          abilitySignals: [{ ability: "agent_judgment", delta: isFalse ? 10 : -5, reason: isFalse ? "正确判断 Agent 适用性" : "过度依赖 Agent 思维" }],
        };
      }

      // 文本题 - 基于答案长度和关键词简单评估
      const textValue = String(ans!.value);
      const hasKeywords = ["记忆", "工具", "人工确认", "安全", "反思", "规划"].some(kw => textValue.includes(kw));
      const isDetailed = answerLength > 100;
      const verdict = isDetailed && hasKeywords ? "correct" as const : hasKeywords || isDetailed ? "partially_correct" as const : "open_ended" as const;

      return {
        questionId: q.id,
        verdict,
        feedback: verdict === "correct" ? "回答全面，涵盖了关键设计要点。" : verdict === "partially_correct" ? "回答有一定深度，但还可以更全面。建议补充具体的设计细节。" : "建议更详细地展开你的思路，包括具体的架构选择和理由。",
        abilitySignals: [{ ability: q.testsAbility[0] || "general", delta: verdict === "correct" ? 10 : verdict === "partially_correct" ? 3 : 0, reason: verdict === "correct" ? "理解深入" : verdict === "partially_correct" ? "部分理解" : "需要加强" }],
      };
    });

    // 计算分数
    const correctCount = questionFeedback.filter(f => f.verdict === "correct").length;
    const totalCount = questionFeedback.length;
    const score = Math.round((correctCount / totalCount) * 100);

    // 生成 profilePatch
    const weakAbilities: Map<string, AbilitySignal> = new Map();
    const strongAbilities: Map<string, AbilitySignal> = new Map();
    for (const fb of questionFeedback) {
      for (const signal of fb.abilitySignals) {
        if (signal.delta < 0) {
          weakAbilities.set(signal.ability, signal);
        } else if (signal.delta >= 10) {
          strongAbilities.set(signal.ability, signal);
        }
      }
    }

    const profilePatch: UserProfilePatch = {
      addKnownTopics: Array.from(strongAbilities.values()).map(s => ({
        topic: s.ability,
        confidence: 0.7,
        evidence: s.reason,
        updatedAt: now,
      })),
      addWeakTopics: Array.from(weakAbilities.values()).map(s => ({
        topic: s.ability,
        confidence: 0.4,
        evidence: s.reason,
        updatedAt: now,
      })),
      topicScoreDeltas: Object.fromEntries(
        questionFeedback.flatMap(fb => fb.abilitySignals.map(s => [s.ability, s.delta] as [string, number]))
      ),
      nextRecommendedTopic: score >= 80 ? "agent_advanced_patterns" : score >= 50 ? "agent_memory_design" : "agent_basics",
    };

    return {
      lessonId: lesson.id,
      overall: score >= 80 ? "表现优秀！你对 AI Agent 的核心概念理解扎实。" : score >= 50 ? "基础概念掌握不错，部分进阶内容需要加强。" : "建议回顾基础概念，重点关注 Agent 的核心特征和设计原则。",
      score,
      questionFeedback,
      strengths: Array.from(strongAbilities.keys()),
      weaknesses: Array.from(weakAbilities.keys()),
      improvedExpressions: score < 80 ? ["尝试用'感知-决策-执行-反思'的框架来分析 Agent 设计", "在讨论架构取舍时，先明确约束条件再给方案"] : [],
      interviewReadyNotes: score >= 60 ? ["能清晰区分 Agent 和普通 AI 应用的区别", "理解 Human-in-the-loop 的设计原则"] : ["先确保能说清 Agent 的核心特征", "准备一个 Agent 架构设计的案例"],
      followUpQuestions: [
        "如果 Agent 的工具调用失败了，你会如何设计重试和降级策略？",
        "在多 Agent 协作中，如何避免 Agent 之间的死循环？",
      ],
      profilePatch,
      nextRecommendedTopic: profilePatch.nextRecommendedTopic || "agent_basics",
      createdAt: now,
    };
  }
}
