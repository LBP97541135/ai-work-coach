import type { AIProvider, GenerateLessonInput, GradeAnswersInput } from './AIProvider.js';
import type { Lesson, LessonSection, Question, GradingResult, QuestionFeedback, AbilitySignal, UserProfilePatch, AnswerItem } from '../shared/schemas.js';
import { generateLessonId, generateQuestionId, generateSectionId } from '../shared/ids.js';

// ==================== Agent 类别内容 ====================
const AGENT_SECTIONS: LessonSection[] = [
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

const AGENT_QUESTIONS: Question[] = [
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

// ==================== Engineering 类别内容 ====================
const ENGINEERING_SECTIONS: LessonSection[] = [
  {
    id: generateSectionId(),
    title: "Web 应用架构基础",
    kind: "core",
    markdown: `## Web 应用架构基础\n\n现代 Web 应用的架构设计是后端工程师的核心能力。理解前后端分层、API 设计和数据库选型是构建可靠系统的基础。\n\n### 前后端分层\n1. **表现层（前端）**：负责 UI 渲染和用户交互\n2. **业务逻辑层（后端）**：处理核心业务规则和流程\n3. **数据访问层**：封装数据存储和查询逻辑\n4. **基础设施层**：数据库、缓存、消息队列等\n\n### API 设计原则\n- **RESTful**：资源导向，使用 HTTP 动词表达语义\n- **GraphQL**：按需查询，减少过度获取\n- **一致性**：统一的错误处理、分页、版本策略\n\n### 数据库选型\n- **关系型（MySQL/PostgreSQL）**：结构化数据、事务需求\n- **文档型（MongoDB）**：灵活 schema、快速迭代\n- **缓存（Redis）**：高频读取、会话管理\n- **搜索引擎（ES）**：全文检索、复杂查询`,
  },
  {
    id: generateSectionId(),
    title: "场景：设计一个任务管理系统",
    kind: "scenario",
    markdown: `## 场景：设计一个任务管理系统\n\n假设你需要设计一个支持多人协作的任务管理系统，考虑以下方面：\n\n### 数据模型\n1. **任务（Task）**：标题、描述、状态、优先级、负责人、截止日期\n2. **项目（Project）**：名称、成员列表、看板配置\n3. **评论（Comment）**：内容、作者、时间戳\n4. **活动日志（Activity）**：操作类型、变更内容、时间\n\n### API 设计\n- \`GET /projects/:id/tasks\` - 获取项目任务列表（支持筛选和分页）\n- \`POST /tasks\` - 创建任务\n- \`PATCH /tasks/:id\` - 更新任务状态\n- \`GET /tasks/:id/activities\` - 获取任务活动记录\n\n### 缓存策略\n- 项目列表：CDN 缓存 + 短 TTL\n- 任务详情：Redis 缓存，变更时主动失效\n- 用户通知：WebSocket 实时推送`,
  },
  {
    id: generateSectionId(),
    title: "架构设计常见误区",
    kind: "pitfall",
    markdown: `## 架构设计常见误区\n\n### 1. 过度设计\n在项目初期就引入微服务、消息队列等复杂架构，导致开发效率低下。应该从简单架构开始，随业务增长逐步演进。\n\n### 2. 忽视缓存\n不合理的缓存策略会导致数据库压力过大。需要区分热点数据和冷数据，设计合适的缓存失效策略。\n\n### 3. 忽略错误处理\n很多开发者只考虑 happy path，忽视网络超时、数据不一致等异常场景。健壮的系统必须考虑降级、重试和熔断。`,
  },
];

const ENGINEERING_QUESTIONS: Question[] = [
  {
    id: generateQuestionId(),
    type: "single_choice",
    prompt: "以下哪个不是 REST API 的核心约束？",
    options: [
      { id: "a", text: "无状态" },
      { id: "b", text: "统一接口" },
      { id: "c", text: "强类型" },
      { id: "d", text: "资源标识" },
    ],
    testsAbility: ["rest_api_design"],
    difficulty: "basic",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "multiple_choice",
    prompt: "以下哪些是常见的缓存策略？",
    options: [
      { id: "a", text: "CDN 缓存" },
      { id: "b", text: "数据库索引" },
      { id: "c", text: "浏览器缓存" },
      { id: "d", text: "内存缓存" },
    ],
    testsAbility: ["caching_strategies"],
    difficulty: "intermediate",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "judge",
    prompt: "微服务架构总是比单体架构更好。",
    testsAbility: ["architecture_judgment"],
    difficulty: "basic",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "scenario",
    prompt: "你正在设计一个高并发的秒杀系统，请描述你会如何设计缓存和数据库层。",
    expectedAnswerShape: "应包含：多级缓存（本地+分布式）、缓存预热、库存扣减的原子操作、数据库读写分离、限流降级策略",
    testsAbility: ["high_concurrency_design", "caching_design"],
    difficulty: "advanced",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "architecture",
    prompt: "请对比单体架构和微服务架构的适用场景，并给出各自的取舍条件。",
    expectedAnswerShape: "单体：团队小、业务初期、快速迭代；微服务：团队大、业务复杂、独立部署需求。取舍：复杂度 vs 灵活性",
    testsAbility: ["monolith_vs_microservice"],
    difficulty: "advanced",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "product",
    prompt: "如果你的团队要从单体迁移到微服务，你会如何规划迁移步骤？",
    expectedAnswerShape: "应包含：先拆分数据库、再拆分服务、灰度发布、监控先行、回滚方案",
    testsAbility: ["migration_planning", "engineering_product"],
    difficulty: "advanced",
    explanationHidden: true,
  },
];

// ==================== Product 类别内容 ====================
const PRODUCT_SECTIONS: LessonSection[] = [
  {
    id: generateSectionId(),
    title: "产品经理核心能力",
    kind: "core",
    markdown: `## 产品经理核心能力\n\n产品经理是将用户需求转化为产品方案的关键角色。核心能力包括需求分析、用户画像和场景拆解。\n\n### 需求分析\n1. **辨别真伪需求**：用户说的不一定是真正需要的\n2. **优先级排序**：用 RICE 等框架量化需求价值\n3. **需求文档**：清晰定义用户故事、验收标准、边界条件\n\n### 用户画像\n- **人口统计**：年龄、职业、技术背景\n- **行为特征**：使用频率、核心场景、痛点\n- **心理模型**：期望、恐惧、动机\n\n### 场景拆解\n1. 识别核心场景（占 80% 使用时间的 20% 功能）\n2. 定义用户旅程（从触达到完成的关键步骤）\n3. 设计 MVP（最小可行产品验证核心假设）`,
  },
  {
    id: generateSectionId(),
    title: "场景：设计一个 AI 学习助手",
    kind: "scenario",
    markdown: `## 场景：设计一个 AI 学习助手\n\n假设你负责设计一款面向职场新人的 AI 学习助手产品：\n\n### 用户画像\n- **主要用户**：0-3 年工作经验的技术新人\n- **核心痛点**：不知道学什么、学了不会用、缺乏反馈\n- **使用场景**：通勤时快速学习、工作中即学即用\n\n### MVP 范围\n1. **每日一课**：根据用户画像推送个性化学习内容\n2. **场景练习**：结合工作场景的实操练习\n3. **智能反馈**：AI 批改答案并给出改进建议\n\n### 指标设计\n- **核心指标**：7 日留存率、完课率\n- **辅助指标**：答题正确率、学习时长\n- **北极星指标**：用户能力提升速度`,
  },
  {
    id: generateSectionId(),
    title: "产品经理常见误区",
    kind: "pitfall",
    markdown: `## 产品经理常见误区\n\n### 1. 需求堆砌\n把所有用户反馈都当作需求，导致产品臃肿。应该区分"必须有"和"有了更好"，用数据驱动决策。\n\n### 2. 忽视指标\n不定义成功指标就上线功能，无法衡量效果。每个功能都应该有明确的衡量标准和预期目标。\n\n### 3. 过度设计\n在 MVP 阶段就追求完美体验，导致上线周期过长。应该先验证核心假设，再逐步优化体验。`,
  },
];

const PRODUCT_QUESTIONS: Question[] = [
  {
    id: generateQuestionId(),
    type: "single_choice",
    prompt: "以下哪个不是 MVP 的核心原则？",
    options: [
      { id: "a", text: "最小可行" },
      { id: "b", text: "用户验证" },
      { id: "c", text: "功能完整" },
      { id: "d", text: "快速迭代" },
    ],
    testsAbility: ["mvp_principles"],
    difficulty: "basic",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "multiple_choice",
    prompt: "以下哪些是有效的产品指标？",
    options: [
      { id: "a", text: "DAU" },
      { id: "b", text: "代码行数" },
      { id: "c", text: "用户留存率" },
      { id: "d", text: "功能数量" },
    ],
    testsAbility: ["product_metrics"],
    difficulty: "intermediate",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "judge",
    prompt: "产品经理应该直接告诉设计师如何设计界面。",
    testsAbility: ["pm_role_boundaries"],
    difficulty: "basic",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "scenario",
    prompt: "你正在为一个 AI 学习产品定义 MVP，请描述你会如何确定核心功能和范围。",
    expectedAnswerShape: "应包含：用户调研验证核心假设、定义最小功能集、设定成功指标、快速上线验证",
    testsAbility: ["mvp_definition", "product_scenario"],
    difficulty: "advanced",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "architecture",
    prompt: "请对比 B 端和 C 端产品的核心差异，并给出各自的设计原则。",
    expectedAnswerShape: "B端：效率优先、角色权限、流程驱动；C端：体验优先、情感连接、增长驱动",
    testsAbility: ["b2b_vs_b2c", "product_architecture"],
    difficulty: "advanced",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "product",
    prompt: "如果你的 AI 产品用户留存率持续下降，你会如何分析和解决这个问题？",
    expectedAnswerShape: "应包含：漏斗分析定位流失环节、用户访谈了解原因、A/B测试验证假设、优化核心体验",
    testsAbility: ["retention_analysis", "product_problem_solving"],
    difficulty: "advanced",
    explanationHidden: true,
  },
];

// ==================== Mixed 类别内容 ====================
const MIXED_SECTIONS: LessonSection[] = [
  {
    id: generateSectionId(),
    title: "Agent 核心概念速览",
    kind: "core",
    markdown: `## Agent 核心概念速览\n\nAI Agent = LLM + 记忆 + 工具 + 规划。Agent 的核心在于自主性——能够根据环境动态调整行为，而非仅被动响应指令。\n\n关键要点：\n- **自主性 vs 可控性**：关键操作需要 Human-in-the-loop\n- **ReAct vs Reflection**：不同模式适合不同场景\n- **记忆设计**：短期上下文 + 长期经验缺一不可`,
  },
  {
    id: generateSectionId(),
    title: "架构设计要点",
    kind: "scenario",
    markdown: `## 架构设计要点\n\n构建可靠的 Web 应用需要关注：\n\n1. **前后端分层**：清晰的职责边界是可维护性的基础\n2. **API 设计**：RESTful 或 GraphQL，保持一致性\n3. **缓存策略**：多级缓存减轻数据库压力\n4. **错误处理**：降级、重试、熔断三件套`,
  },
  {
    id: generateSectionId(),
    title: "产品思维与误区",
    kind: "pitfall",
    markdown: `## 产品思维与误区\n\n### 常见误区\n1. **需求堆砌**：不是所有反馈都是需求，用数据驱动决策\n2. **忽视指标**：没有衡量标准就无法判断效果\n3. **过度设计**：MVP 阶段先验证假设，再优化体验\n4. **忽视用户**：技术决策不能脱离用户场景`,
  },
];

const MIXED_QUESTIONS: Question[] = [
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
    type: "single_choice",
    prompt: "以下哪个不是 REST API 的核心约束？",
    options: [
      { id: "a", text: "无状态" },
      { id: "b", text: "统一接口" },
      { id: "c", text: "强类型" },
      { id: "d", text: "资源标识" },
    ],
    testsAbility: ["rest_api_design"],
    difficulty: "basic",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "multiple_choice",
    prompt: "以下哪些是有效的产品指标？",
    options: [
      { id: "a", text: "DAU" },
      { id: "b", text: "代码行数" },
      { id: "c", text: "用户留存率" },
      { id: "d", text: "功能数量" },
    ],
    testsAbility: ["product_metrics"],
    difficulty: "intermediate",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "judge",
    prompt: "微服务架构总是比单体架构更好。",
    testsAbility: ["architecture_judgment"],
    difficulty: "basic",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "judge",
    prompt: "产品经理应该直接告诉设计师如何设计界面。",
    testsAbility: ["pm_role_boundaries"],
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
    prompt: "请对比单体架构和微服务架构的适用场景，并给出各自的取舍条件。",
    expectedAnswerShape: "单体：团队小、业务初期、快速迭代；微服务：团队大、业务复杂、独立部署需求。取舍：复杂度 vs 灵活性",
    testsAbility: ["monolith_vs_microservice"],
    difficulty: "advanced",
    explanationHidden: true,
  },
  {
    id: generateQuestionId(),
    type: "product",
    prompt: "如果你的 AI 产品用户留存率持续下降，你会如何分析和解决这个问题？",
    expectedAnswerShape: "应包含：漏斗分析定位流失环节、用户访谈了解原因、A/B测试验证假设、优化核心体验",
    testsAbility: ["retention_analysis", "product_problem_solving"],
    difficulty: "advanced",
    explanationHidden: true,
  },
];

// ==================== 类别内容映射 ====================
type CategoryContent = {
  sections: LessonSection[];
  questions: Question[];
  title: string;
  reason: string;
  objectives: string[];
  correctAnswers: Record<string, { single?: string; multiple?: string[]; judge?: boolean }>;
};

const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  agent: {
    sections: AGENT_SECTIONS,
    questions: AGENT_QUESTIONS,
    title: "AI Agent 核心架构与设计模式",
    reason: "根据你的学习画像，今日重点学习 AI Agent 的核心概念和设计模式",
    objectives: [
      "理解 AI Agent 的核心特征与架构组成",
      "掌握 Agent 记忆系统的设计方法",
      "理解 ReAct 和 Reflection 模式的适用场景",
      "学会在自主性和可控性之间做取舍",
    ],
    correctAnswers: {
      [AGENT_QUESTIONS[0].id]: { single: "b" },
      [AGENT_QUESTIONS[1].id]: { multiple: ["b", "c"] },
      [AGENT_QUESTIONS[2].id]: { judge: false },
    },
  },
  engineering: {
    sections: ENGINEERING_SECTIONS,
    questions: ENGINEERING_QUESTIONS,
    title: "Web 应用架构基础与设计",
    reason: "根据你的学习画像，今日重点学习 Web 应用架构设计和缓存策略",
    objectives: [
      "理解前后端分层架构和 API 设计原则",
      "掌握常见缓存策略及其适用场景",
      "学会根据业务规模选择合适的架构模式",
      "理解高并发系统的设计要点",
    ],
    correctAnswers: {
      [ENGINEERING_QUESTIONS[0].id]: { single: "c" },
      [ENGINEERING_QUESTIONS[1].id]: { multiple: ["a", "c", "d"] },
      [ENGINEERING_QUESTIONS[2].id]: { judge: false },
    },
  },
  product: {
    sections: PRODUCT_SECTIONS,
    questions: PRODUCT_QUESTIONS,
    title: "产品经理核心能力与实战",
    reason: "根据你的学习画像，今日重点学习产品经理的核心能力和方法论",
    objectives: [
      "理解 MVP 的核心原则和定义方法",
      "掌握有效的产品指标体系",
      "学会区分 B 端和 C 端产品的设计差异",
      "理解用户留存分析的基本方法",
    ],
    correctAnswers: {
      [PRODUCT_QUESTIONS[0].id]: { single: "c" },
      [PRODUCT_QUESTIONS[1].id]: { multiple: ["a", "c"] },
      [PRODUCT_QUESTIONS[2].id]: { judge: false },
    },
  },
  mixed: {
    sections: MIXED_SECTIONS,
    questions: MIXED_QUESTIONS,
    title: "综合训练：Agent × 架构 × 产品",
    reason: "根据你的学习画像，今日进行综合训练，覆盖 Agent、架构和产品三个方向",
    objectives: [
      "巩固 AI Agent 的核心概念和设计模式",
      "理解 Web 应用架构的基本原则",
      "掌握产品思维和 MVP 方法论",
      "学会跨领域综合分析和决策",
    ],
    correctAnswers: {
      [MIXED_QUESTIONS[0].id]: { single: "b" },
      [MIXED_QUESTIONS[1].id]: { single: "c" },
      [MIXED_QUESTIONS[2].id]: { multiple: ["a", "c"] },
      [MIXED_QUESTIONS[3].id]: { judge: false },
      [MIXED_QUESTIONS[4].id]: { judge: false },
    },
  },
};

// ==================== 难度过滤 ====================
function filterQuestionsByDifficulty(questions: Question[], difficulty: string): Question[] {
  if (difficulty === "basic") {
    // basic: 更多选择题和判断题，减少开放题
    const closedQuestions = questions.filter(q =>
      q.type === "single_choice" || q.type === "multiple_choice" || q.type === "judge"
    );
    const openQuestions = questions.filter(q =>
      q.type !== "single_choice" && q.type !== "multiple_choice" && q.type !== "judge"
    );
    return [...closedQuestions, ...openQuestions.slice(0, 1)];
  }
  if (difficulty === "advanced") {
    // advanced: 更多场景题和架构题
    const advancedQuestions = questions.filter(q =>
      q.type === "scenario" || q.type === "architecture" || q.type === "product"
    );
    const otherQuestions = questions.filter(q =>
      q.type !== "scenario" && q.type !== "architecture" && q.type !== "product"
    );
    return [...otherQuestions.slice(0, 2), ...advancedQuestions];
  }
  // intermediate: 混合题型，全部返回
  return questions;
}

// ==================== 根据用户画像调整 ====================
function adjustReasonAndObjectives(
  baseReason: string,
  baseObjectives: string[],
  userProfile: { weakTopics: { topic: string; evidence: string }[]; nextRecommendedTopic?: string },
  category: string,
): { reason: string; objectives: string[] } {
  const weakTopicNames = userProfile.weakTopics.map(t => t.topic);
  const nextTopic = userProfile.nextRecommendedTopic;

  let reason = baseReason;
  const objectives = [...baseObjectives];

  // 根据弱项调整 reason
  if (weakTopicNames.length > 0) {
    const weakAreas = weakTopicNames.slice(0, 3).join("、");
    reason = `根据你的学习画像，你在${weakAreas}方面需要加强，今日重点针对性训练`;
  }

  // 根据推荐主题调整 reason
  if (nextTopic) {
    reason += `，特别关注${nextTopic}`;
  }

  // 根据弱项调整 objectives
  if (weakTopicNames.length > 0) {
    const weakObj = `重点攻克薄弱环节：${weakTopicNames.slice(0, 2).join("和")}`;
    if (!objectives.includes(weakObj)) {
      objectives[objectives.length - 1] = weakObj;
    }
  }

  return { reason, objectives };
}

// ==================== MockAIProvider ====================
export class MockAIProvider implements AIProvider {
  async generateLesson(input: GenerateLessonInput): Promise<Lesson> {
    const now = new Date().toISOString();
    const category = input.category || "agent";
    const content = CATEGORY_CONTENT[category] || CATEGORY_CONTENT["agent"];

    // 根据难度过滤题目
    const filteredQuestions = filterQuestionsByDifficulty(content.questions, input.difficulty);

    // 根据用户画像调整 reason 和 objectives
    const { reason, objectives } = adjustReasonAndObjectives(
      content.reason,
      content.objectives,
      input.userProfile,
      category,
    );

    return {
      id: generateLessonId(input.date),
      date: input.date,
      title: content.title,
      category: input.category,
      difficulty: input.difficulty,
      estimatedMinutes: 18,
      reason: input.reason || reason,
      objectives,
      sections: content.sections,
      questions: filteredQuestions,
      sourceNotes: input.sourceNotes && input.sourceNotes.length > 0
        ? input.sourceNotes
        : [
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

    // 获取当前类别的正确答案映射
    const category = lesson.category || "agent";
    const content = CATEGORY_CONTENT[category] || CATEGORY_CONTENT["agent"];
    const correctAnswers = content.correctAnswers;

    const questionFeedback: QuestionFeedback[] = lesson.questions.map((q: Question) => {
      const ans = answer.answers.find((a: AnswerItem) => a.questionId === q.id);

      // 判断是否有有效答案
      // 注意：boolean false 是判断题的有效答案，不应视为未作答
      let hasAnswer = false;
      if (!ans) {
        hasAnswer = false;
      } else if (typeof ans.value === 'boolean') {
        // 判断题：true 和 false 都是有效答案
        hasAnswer = true;
      } else if (typeof ans.value === 'string') {
        hasAnswer = ans.value !== '';
      } else if (Array.isArray(ans.value)) {
        hasAnswer = ans.value.length > 0;
      }

      const answerLength = typeof ans?.value === 'string' ? ans.value.length : 0;

      if (!hasAnswer) {
        return {
          questionId: q.id,
          verdict: "incorrect" as const,
          feedback: "未作答",
          abilitySignals: [{ ability: q.testsAbility[0] || "general", delta: -5, reason: "未作答" }],
        };
      }

      // 获取该题的正确答案
      const correct = correctAnswers[q.id];

      // 根据题型批改
      if (q.type === "single_choice") {
        const val = ans!.value as string;
        const correctOption = correct?.single || "b";
        const isCorrect = val === correctOption;
        return {
          questionId: q.id,
          verdict: isCorrect ? "correct" as const : "incorrect" as const,
          feedback: isCorrect ? "正确！你准确理解了这个概念。" : "再想想，仔细回顾相关知识点。",
          improvedAnswer: isCorrect ? undefined : `正确答案是 ${correctOption}。建议回顾相关章节加深理解。`,
          abilitySignals: [{ ability: q.testsAbility[0] || "general", delta: isCorrect ? 10 : -5, reason: isCorrect ? "正确识别核心概念" : "概念理解有误" }],
        };
      }

      if (q.type === "multiple_choice") {
        const val = ans!.value as string[];
        const correctOptions = correct?.multiple || ["b", "c"];
        const sortedVal = [...val].sort();
        const sortedCorrect = [...correctOptions].sort();
        const isCorrect = sortedVal.length === sortedCorrect.length && sortedVal.every((v, i) => v === sortedCorrect[i]);
        const hasPartial = val.some(v => correctOptions.includes(v)) && val.length < correctOptions.length;
        const hasWrong = val.some(v => !correctOptions.includes(v));
        const verdict: "correct" | "partially_correct" | "incorrect" = isCorrect ? "correct" : (hasPartial && !hasWrong) ? "partially_correct" : "incorrect";
        return {
          questionId: q.id,
          verdict,
          feedback: isCorrect ? "正确！你完整识别了所有正确选项。" : hasPartial ? "部分正确，还有遗漏的选项。" : "答案有误，建议重新理解相关概念。",
          improvedAnswer: isCorrect ? undefined : `正确答案是 ${correctOptions.join(", ")}。`,
          abilitySignals: [{ ability: q.testsAbility[0] || "general", delta: isCorrect ? 10 : verdict === "partially_correct" ? 3 : -5, reason: isCorrect ? "全面理解" : verdict === "partially_correct" ? "部分理解" : "理解有误" }],
        };
      }

      if (q.type === "judge") {
        const val = ans!.value;
        const correctValue = correct?.judge ?? false;
        const isCorrect = (val === correctValue) || (val === String(correctValue));
        return {
          questionId: q.id,
          verdict: isCorrect ? "correct" as const : "incorrect" as const,
          feedback: isCorrect ? "正确！你的判断很准确。" : "判断有误，建议回顾相关概念。",
          improvedAnswer: isCorrect ? undefined : `正确答案是 ${correctValue ? '正确' : '错误'}。`,
          abilitySignals: [{ ability: q.testsAbility[0] || "general", delta: isCorrect ? 10 : -5, reason: isCorrect ? "判断准确" : "判断有误" }],
        };
      }

      // 文本题 - 基于答案长度和关键词简单评估
      const textValue = String(ans!.value);
      const hasKeywords = ["记忆", "工具", "人工确认", "安全", "反思", "规划", "缓存", "架构", "需求", "指标", "MVP", "用户", "降级", "重试", "熔断"].some(kw => textValue.includes(kw));
      const isDetailed = answerLength > 100;
      const verdict = isDetailed && hasKeywords ? "correct" as const : hasKeywords || isDetailed ? "partially_correct" as const : "open_ended" as const;

      return {
        questionId: q.id,
        verdict,
        feedback: verdict === "correct" ? "回答全面，涵盖了关键设计要点。" : verdict === "partially_correct" ? "回答有一定深度，但还可以更全面。建议补充具体的设计细节。" : "建议更详细地展开你的思路，包括具体的方案和理由。",
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

    // 根据类别和分数推荐下一个主题
    const nextTopicMap: Record<string, Record<string, string>> = {
      agent: { high: "agent_advanced_patterns", mid: "agent_memory_design", low: "agent_basics" },
      engineering: { high: "distributed_systems", mid: "caching_strategies", low: "rest_api_basics" },
      product: { high: "product_strategy", mid: "user_research", low: "mvp_basics" },
      mixed: { high: "cross_domain_advanced", mid: "integrated_practice", low: "fundamentals_review" },
    };
    const level = score >= 80 ? "high" : score >= 50 ? "mid" : "low";
    const categoryNextTopics = nextTopicMap[category] || nextTopicMap["agent"];
    const nextRecommendedTopic = categoryNextTopics[level];

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
      nextRecommendedTopic,
    };

    return {
      lessonId: lesson.id,
      overall: score >= 80 ? "表现优秀！你对本节内容理解扎实。" : score >= 50 ? "基础概念掌握不错，部分进阶内容需要加强。" : "建议回顾基础概念，重点关注核心知识点。",
      score,
      questionFeedback,
      strengths: Array.from(strongAbilities.keys()),
      weaknesses: Array.from(weakAbilities.keys()),
      improvedExpressions: score < 80 ? ["尝试用结构化的框架来分析问题", "在讨论取舍时，先明确约束条件再给方案"] : [],
      interviewReadyNotes: score >= 60 ? ["能清晰表达核心概念", "理解关键设计原则"] : ["先确保能说清基础概念", "准备一个具体的设计案例"],
      followUpQuestions: [
        "如果遇到性能瓶颈，你会如何定位和优化？",
        "在实际项目中，如何平衡技术方案和业务需求？",
      ],
      profilePatch,
      nextRecommendedTopic: profilePatch.nextRecommendedTopic || nextRecommendedTopic,
      createdAt: now,
    };
  }
}
