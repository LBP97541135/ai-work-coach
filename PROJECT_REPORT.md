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
    sources/                      # 静态资料源（agent/engineering/product/mixed.json）
```

前后端分离，REST API 通信，本地文件持久化，零云依赖。

### 2.2 后端核心模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 数据模型 | `shared/schemas.ts` | 全量 TypeScript 类型定义 |
| 统一日期 | `shared/date.ts` | Asia/Shanghai 时区日期工具，所有业务日期必须使用 |
| 存储层 | `storage/JsonStore.ts` | 安全 JSON 读写（临时文件 + rename 原子操作）、事件日志追加 |
| AI 接口 | `ai/AIProvider.ts` | `AIProvider` 接口定义 `generateLesson` + `gradeAnswers` |
| Mock 实现 | `ai/MockAIProvider.ts` | 按 category/difficulty/profile 生成不同内容 |
| OpenAI 实现 | `ai/OpenAIProvider.ts` | 对接 OpenAI API，带重试机制和运行时 schema 校验 |
| 资料源接口 | `ai/FreshSourceProvider.ts` | `FreshSourceProvider` 接口定义 |
| 静态资料源 | `ai/StaticFreshSourceProvider.ts` | 从 data/sources/ 读取人工维护资料源 |
| Prompt 工程 | `ai/prompts.ts` | 生成课程和批改答案的完整 Prompt |
| 自适应选题 | `core/lessonPlanner.ts` | 主题评分算法 + 难度选择 + 新近资料源集成 |
| 批改引擎 | `core/grading.ts` | 批改 + 画像更新一体化流程 |
| 画像更新 | `core/profileUpdater.ts` | 加权合并 knownTopics/weakTopics，topicScores 限幅 0-100 |
| 定时调度 | `core/scheduler.ts` | node-cron 定时生成，显式 timezone: Asia/Shanghai |
| API 路由 | `routes/` | RESTful 端点，含行为画像更新逻辑 |

### 2.3 前端核心模块

| 页面/组件 | 文件 | 职责 |
|-----------|------|------|
| 今日训练 | `TodayPage.tsx` | 7 种状态机 |
| 作答编辑器 | `AnswerEditor.tsx` | 支持单选/多选/判断/文本题，草稿保存 + 提交确认 |
| 批改面板 | `GradingPanel.tsx` | 分数、强项/建议补强、面试话术、改进建议 |
| 学习画像 | `ProfilePage.tsx` | 掌握度、建议补强（温和表达）、最近学习情况 |
| 历史记录 | `HistoryPage.tsx` | 按类别筛选历史课程 |
| 设置页 | `SettingsPage.tsx` | AI Provider 切换、主题权重、定时时间配置 |

## 三、核心算法

### 3.1 自适应选题算法

```
主题分数 = 权重(weight) + 弱点加成(+0.25) + 新近加成(+0.1) - 重复惩罚(-0.3) - 掌握惩罚(-0.2)
```

**难度选择**：基于 topicScores 均值（≥85→advanced, ≥60→intermediate, <60→basic）

### 3.2 画像更新算法

- **TopicMemory 合并**：按 topic 去重，confidence 加权平均（新证据 0.7 / 旧证据 0.3）
- **topicScores**：累加 delta，限幅 [0, 100]
- **avoidedTopics**：去重保留最近 20 条

### 3.3 行为画像

系统记录以下行为信号并参与内容调整：
- `lastOpenedAt` / `recentOpenDates`：打开训练时间
- `lastDraftUpdatedAt`：草稿保存时间
- `lastSubmittedAt` / `recentSubmitDates`：提交时间
- `streakDays`：连续学习天数
- `lastLessonStatus`：最近课程状态

### 3.4 文件安全写入

```
写入临时文件(.tmp_uuid_xxx) → rename 原子替换
```

## 四、Phase 8 优化内容

### P0 修复（已完成）

| 问题 | 修复方案 |
|------|---------|
| 判断题 `false` 被误判为未作答 | 区分 boolean 和 string 类型判断，`typeof value === 'boolean'` 时视为有效答案 |
| 业务日期使用 UTC | 创建 `getLocalDate()` 统一日期工具，替换所有 `toISOString().split('T')[0]` |
| node-cron 未指定 timezone | `cron.schedule()` 添加 `{ timezone: "Asia/Shanghai" }` |

### P1 增强（已完成）

| 问题 | 解决方案 |
|------|---------|
| Mock 内容固定 | 按 category（agent/engineering/product/mixed）生成不同内容，按 difficulty 调整题型比例 |
| allowFreshSearch 无实际功能 | 实现 `FreshSourceProvider` 接口 + `StaticFreshSourceProvider`，从 data/sources/ 读取资料源 |
| OpenAI 输出无 schema 校验 | 添加 `validateLessonStructure` 和 `validateGradingStructure` 运行时校验 |
| 行为画像字段不足 | 扩展 behavior 字段，在路由中记录打开/草稿/提交行为 |

### P2 优化（已完成）

| 问题 | 解决方案 |
|------|---------|
| 学习画像页表达负面 | "薄弱点"改为"建议补强"，红色改为琥珀色，新增"最近学习情况"展示 |

### 自动化测试（已完成）

4 个测试文件，36 个测试用例，全部通过：

| 测试文件 | 测试数 | 覆盖范围 |
|---------|--------|---------|
| `tests/date.test.ts` | 7 | Asia/Shanghai 时区日期、UTC 边界 |
| `tests/profileUpdater.test.ts` | 8 | profilePatch 合并、topicScores 限幅、avoidedTopics 去重 |
| `tests/mockAIProvider.test.ts` | 11 | 多类别内容生成、判断题 false 批改、分数范围 |
| `tests/openAIProvider.test.ts` | 10 | Lesson/Grading schema 校验 |

## 五、数据存储结构

```
data/
  lessons/2026-06-22.json      # 每日课程
  answers/2026-06-22.json      # 用户答案
  grading/2026-06-22.json      # 批改结果
  events/2026-06.jsonl         # 事件日志（追加写入）
  sources/                     # 静态资料源
    agent.json                 # AI Agent 方向资料
    engineering.json           # 软件架构方向资料
    product.json               # 产品能力方向资料
    mixed.json                 # 综合方向资料
  profile.json                 # 用户画像
  settings.json                # 系统配置
```

## 六、启动方式

```bash
cd "e:\study agent\ai-work-coach"

# 启动后端 (端口 4317)
npm run dev:api

# 启动前端 (端口 5173)
npm run dev:web

# 运行测试
cd services/api && npm test
```

## 七、关键设计决策

1. **本地优先**：所有数据存本地文件，无需数据库和云服务
2. **AI Provider 抽象**：`AIProvider` 接口统一 Mock 和 OpenAI 实现
3. **原子写入**：临时文件 + rename 确保数据安全
4. **统一时区**：所有业务日期通过 `getLocalDate("Asia/Shanghai")` 获取
5. **FreshSourceProvider 抽象**：先实现静态资料源，后续可扩展为搜索 API
6. **运行时 schema 校验**：OpenAI 输出不仅做 JSON.parse，还校验结构合法性
7. **行为画像**：记录打开、草稿、提交等行为信号，支持"打开但不作答"等策略

## 八、功能完整度

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 0 - 项目初始化 | ✅ | Monorepo 结构、TypeScript 配置、依赖安装 |
| Phase 1 - 数据模型与存储 | ✅ | schemas.ts、JsonStore、paths |
| Phase 2 - AI Provider | ✅ | MockAIProvider（多类别）、OpenAIProvider（schema 校验） |
| Phase 3 - 核心业务逻辑 | ✅ | lessonPlanner、grading、profileUpdater |
| Phase 4 - API 服务 | ✅ | Express 路由、REST 端点、行为画像更新 |
| Phase 5 - 定时任务 | ✅ | node-cron 定时生成、Asia/Shanghai timezone |
| Phase 6 - Web UI | ✅ | 4 个页面、完整状态管理 |
| Phase 7 - 测试与验收 | ✅ | 36 个自动化测试用例 |
| Phase 8 - 稳定化 | ✅ | 判断题修复、时区统一、Mock 自适应、资料源、schema 校验 |

## 九、待改进方向

| 方向 | 说明 |
|------|------|
| 联网搜索 | 接入搜索 API 或 RSS，实现 `WebSearchFreshSourceProvider` |
| 遗忘曲线 | topicScores 引入时间衰减权重 |
| 桌面化 | Electron/Tauri 封装为桌面应用 |
| 首次引导 | 增加首次使用引导和操作提示 |
| 云同步 | 添加云同步或导出功能 |

## 十、项目统计

- **源文件数**：35+ 源文件
- **代码行数**：约 3500 行 TypeScript
- **测试用例**：36 个（4 个测试文件）
- **API 端点**：8 个
- **页面数量**：4 个
- **资料源**：4 个类别（agent/engineering/product/mixed）

---

**项目状态**：✅ Phase 8 稳定化完成，可长期稳定使用  
**最后更新**：2026-06-23
