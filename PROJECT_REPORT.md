# AI Work Coach 项目结果汇报

## 一、项目定位

AI Work Coach 是一个面向个人使用的**自适应职业学习 Agent**，核心闭环为：

```
每日训练生成 → 用户作答 → AI 批改 → 画像更新 → 自适应内容推荐
```

聚焦三大方向：**AI Agent 技术**、**软件架构与工程知识**、**产品经理能力**。内容以工作手册式呈现，题目考理解和迁移而非死记硬背。

## 二、技术架构

### 2.1 整体架构

```
ai-work-coach/                    # Monorepo (npm workspaces)
  apps/web/                       # 前端 React + Vite + Tailwind
  services/api/                   # 后端 Express + TypeScript
  data/                           # 本地 JSON 文件存储
```

前后端分离，REST API 通信，本地文件持久化，零云依赖。

### 2.2 后端核心模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 数据模型 | `services/api/src/shared/schemas.ts` | 全量 TypeScript 类型定义（Lesson, Question, UserAnswer, GradingResult, UserProfile, Settings 等） |
| 存储层 | `services/api/src/storage/JsonStore.ts` | 安全 JSON 读写（临时文件 + rename 原子操作）、事件日志追加 |
| AI 接口 | `services/api/src/ai/AIProvider.ts` | `AIProvider` 接口定义 `generateLesson` + `gradeAnswers` |
| Mock 实现 | `services/api/src/ai/MockAIProvider.ts` | 无 API Key 时的完整模拟，含丰富 Agent 知识内容和批改逻辑 |
| OpenAI 实现 | `services/api/src/ai/OpenAIProvider.ts` | 对接 OpenAI API，带重试机制和 JSON 校验补齐 |
| Prompt 工程 | `services/api/src/ai/prompts.ts` | 生成课程和批改答案的完整 Prompt，约束输出格式 |
| 自适应选题 | `services/api/src/core/lessonPlanner.ts` | 主题评分算法 + 难度选择 |
| 批改引擎 | `services/api/src/core/grading.ts` | 批改 + 画像更新一体化流程 |
| 画像更新 | `services/api/src/core/profileUpdater.ts` | 加权合并 knownTopics/weakTopics，topicScores 限幅 0-100 |
| 定时调度 | `services/api/src/core/scheduler.ts` | node-cron 定时生成，支持动态重启 |
| API 路由 | `services/api/src/routes/` | RESTful 端点（lessons, answers, profile, settings） |

### 2.3 前端核心模块

| 页面/组件 | 文件 | 职责 |
|-----------|------|------|
| 今日训练 | `apps/web/src/routes/TodayPage.tsx` | 7 种状态机（loading → empty → generating → ready → submitting → graded → error） |
| 作答编辑器 | `apps/web/src/components/AnswerEditor.tsx` | 支持单选/多选/判断/文本题，草稿保存 + 提交确认弹窗 |
| 批改面板 | `apps/web/src/components/GradingPanel.tsx` | 分数、强项/薄弱点、面试话术、改进建议、延伸思考 |
| 学习画像 | `apps/web/src/routes/ProfilePage.tsx` | 掌握度、薄弱点、推荐方向可视化 |
| 历史记录 | `apps/web/src/routes/HistoryPage.tsx` | 按类别筛选历史课程 |
| 设置页 | `apps/web/src/routes/SettingsPage.tsx` | AI Provider 切换、主题权重、定时时间配置 |
| API 客户端 | `apps/web/src/lib/api.ts` | 统一封装所有后端 API 调用 |

## 三、核心算法

### 3.1 自适应选题算法

**主题分数计算公式**：
```
主题分数 = 权重(weight) + 弱点加成(+0.25) + 新近加成(+0.1) - 重复惩罚(-0.3) - 掌握惩罚(-0.2)
```

| 因子 | 规则 |
|------|------|
| 弱点加成 | 用户画像中该方向存在薄弱点时 +0.25 |
| 新近加成 | 允许新鲜搜索时 +0.1 |
| 重复惩罚 | 最近 2 天已学过该方向 -0.3 |
| 掌握惩罚 | 用户已高置信(>0.7)掌握该方向 -0.2 |

**难度选择**：基于 topicScores 均值
- ≥85 → advanced
- ≥60 → intermediate  
- <60 → basic

### 3.2 画像更新算法

- **TopicMemory 合并**：按 topic 去重，confidence 加权平均（新证据 0.7 / 旧证据 0.3）
- **topicScores**：累加 delta，限幅 [0, 100]
- **avoidedTopics**：去重保留最近 20 条

### 3.3 文件安全写入

```
写入临时文件(.tmp_uuid_xxx) → rename 原子替换
```

避免写入中断导致文件损坏。

## 四、数据模型

### 核心类型

| 类型 | 说明 |
|------|------|
| `Lesson` | 课程（含 sections + questions + sourceNotes） |
| `Question` | 联合类型：single_choice / multiple_choice / judge / text(short_answer, scenario, architecture, product, open) |
| `UserAnswer` | 用户答案（draft / submitted 状态） |
| `GradingResult` | 批改结果（分数 + 逐题反馈 + 能力信号 + 画像补丁） |
| `UserProfile` | 用户画像（knownTopics / weakTopics / topicScores / behavior） |
| `Settings` | 系统配置（定时时间 / 主题权重 / AI Provider） |

### 题目类型

| 类型 | 说明 |
|------|------|
| `single_choice` | 单选题 |
| `multiple_choice` | 多选题 |
| `judge` | 判断题 |
| `short_answer` | 简答题 |
| `scenario` | 场景分析题 |
| `architecture` | 架构设计题 |
| `product` | 产品设计题 |
| `open` | 开放题 |

## 五、API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/lessons/today` | 获取今日课程 + 答案 + 批改 |
| GET | `/api/lessons` | 历史课程列表（支持 category/limit 筛选） |
| POST | `/api/lessons/generate` | 手动触发生成课程 |
| PUT | `/api/lessons/:id/answers` | 保存草稿 |
| POST | `/api/lessons/:id/submit` | 提交答案并触发批改 |
| GET/PUT | `/api/profile` | 读取/更新用户画像 |
| GET/PUT | `/api/settings` | 读取/更新系统配置 |

## 六、数据存储结构

```
data/
  lessons/2026-06-22.json      # 每日课程
  answers/2026-06-22.json      # 用户答案
  grading/2026-06-22.json      # 批改结果
  events/2026-06.jsonl         # 事件日志（追加写入）
  profile.json                 # 用户画像
  settings.json                # 系统配置
```

## 七、启动方式

```bash
cd "e:\study agent\ai-work-coach"

# 启动后端 (端口 4317)
npm run dev:api

# 启动前端 (端口 5173)
npm run dev:web
```

配置 `.env` 中的 `OPENAI_API_KEY` 可切换为真实 AI 内容生成，否则使用 Mock 模式。

## 八、关键设计决策

1. **本地优先**：所有数据存本地文件，无需数据库和云服务，适合个人工具定位
2. **AI Provider 抽象**：`AIProvider` 接口统一 Mock 和 OpenAI 实现，开发/生产无缝切换
3. **原子写入**：临时文件 + rename 确保数据安全，避免写入中断导致文件损坏
4. **事件溯源**：`.jsonl` 事件日志追加记录所有关键操作，支持后续审计和回溯
5. **自适应闭环**：选题 → 生成 → 作答 → 批改 → 画像更新 → 下次选题，形成完整反馈环
6. **Prompt 工程约束**：强制 JSON 输出格式，校验补齐缺失字段，确保 AI 输出可靠解析

## 九、功能完整度

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 0 - 项目初始化 | ✅ 完成 | Monorepo 结构、TypeScript 配置、依赖安装 |
| Phase 1 - 数据模型与存储 | ✅ 完成 | schemas.ts、JsonStore、paths |
| Phase 2 - AI Provider | ✅ 完成 | MockAIProvider、OpenAIProvider、prompts |
| Phase 3 - 核心业务逻辑 | ✅ 完成 | lessonPlanner、grading、profileUpdater |
| Phase 4 - API 服务 | ✅ 完成 | Express 路由、REST 端点 |
| Phase 5 - 定时任务 | ✅ 完成 | node-cron 定时生成、动态重启 |
| Phase 6 - Web UI | ✅ 完成 | 4 个页面、完整状态管理 |
| Phase 7 - 测试与验收 | ✅ 完成 | 功能验证、端到端测试 |

## 十、已知局限与改进方向

| 方向 | 当前状态 | 改进建议 |
|------|----------|----------|
| 内容多样性 | Mock 模式固定内容，OpenAI 模式依赖 Prompt 质量 | 增加知识库 RAG，引入外部资料源 |
| 画像精度 | 基于单次批改 delta 累加 | 引入遗忘曲线，时间衰减权重 |
| 用户体验 | 无引导流程 | 增加首次使用引导和操作提示 |
| 数据同步 | 仅本地存储 | 添加云同步或导出功能 |
| 桌面化 | 浏览器访问 | Electron/Tauri 封装为桌面应用 |

## 十一、技术亮点

### 1. 自适应学习系统
- 基于用户画像动态调整内容难度和方向
- 弱点检测驱动学习重点
- 避免重复学习已掌握内容

### 2. 双 AI 模式
- Mock 模式：无 API Key 可用，适合开发和离线使用
- OpenAI 模式：真实内容生成，提供高质量训练

### 3. 安全性设计
- 文件原子写入，防止数据损坏
- 敏感操作确认机制
- 输入验证和错误处理

### 4. 可扩展性
- 前后端分离架构
- AI Provider 接口便于扩展新的 AI 服务
- 模块化设计便于功能扩展

## 十二、项目统计

- **总文件数**：30+ 源文件
- **代码行数**：约 2500 行 TypeScript
- **后端文件**：15 个
- **前端文件**：12 个
- **API 端点**：8 个
- **页面数量**：4 个（今日训练、学习画像、历史记录、设置）

---

**项目状态**：✅ 已完成 MVP 开发，可正常运行使用  
**最后更新**：2026-06-22