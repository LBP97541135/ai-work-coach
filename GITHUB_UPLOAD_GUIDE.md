# AI Work Coach - GitHub 上传指南

## 一、环境准备

### 1. 安装 Git
前往 [Git 官网](https://git-scm.com/download/win) 下载并安装 Git for Windows。

### 2. 配置 Git
```bash
# 配置用户名
git config --global user.name "Your Name"

# 配置邮箱（GitHub 注册邮箱）
git config --global user.email "your.email@example.com"

# 配置默认分支名
git config --global init.defaultBranch main
```

## 二、在 GitHub 创建仓库

1. 打开 [GitHub](https://github.com) 并登录
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - **Repository name**: `ai-work-coach`（或其他名称）
   - **Description**: 自适应职业学习 Agent
   - **Visibility**: 选择 Public 或 Private
   - **不要勾选** "Add a README file"（我们已有项目文件）
4. 点击 "Create repository"

## 三、本地仓库初始化与上传

### 1. 打开终端（PowerShell）
```powershell
cd "e:\study agent\ai-work-coach"
```

### 2. 初始化 Git 仓库
```bash
git init
```

### 3. 添加所有文件
```bash
git add .
```

### 4. 查看状态（可选）
```bash
git status
```

### 5. 首次提交
```bash
git commit -m "Initial commit: AI Work Coach MVP"
```

### 6. 添加远程仓库
使用你的用户名 `LBP97541135`：
```bash
git remote add origin https://github.com/LBP97541135/ai-work-coach.git
```

### 7. 推送到 GitHub
```bash
git push -u origin main
```

## 四、.gitignore 配置说明

当前项目已配置 `.gitignore`，排除以下内容：

```
node_modules/          # 依赖包（无需上传）
dist/                  # 构建产物（无需上传）
.env                   # 环境变量（包含敏感信息）
*.log                  # 日志文件
data/lessons/          # 生成的课程数据
data/answers/          # 用户答案数据
data/grading/          # 批改结果数据
data/events/           # 事件日志数据
!data/.gitkeep         # 保留空目录占位符
```

## 五、项目结构（上传后）

```
ai-work-coach/
├── apps/                    # 前端应用
│   └── web/
│       ├── src/             # 源代码（上传）
│       ├── index.html       # 入口HTML（上传）
│       ├── package.json     # 依赖配置（上传）
│       ├── vite.config.ts   # Vite配置（上传）
│       ├── tailwind.config.js # Tailwind配置（上传）
│       └── tsconfig.json    # TypeScript配置（上传）
├── services/                # 后端服务
│   └── api/
│       ├── src/             # 源代码（上传）
│       ├── package.json     # 依赖配置（上传）
│       └── tsconfig.json    # TypeScript配置（上传）
├── data/                    # 数据目录
│   ├── .gitkeep            # 占位符（上传）
│   ├── profile.json        # 用户画像模板（上传）
│   └── settings.json       # 系统配置模板（上传）
├── .env.example            # 环境变量示例（上传）
├── .gitignore              # Git忽略配置（上传）
├── package.json            # 根目录配置（上传）
└── PROJECT_REPORT.md       # 项目报告（上传）
```

## 六、上传后的操作

### 1. 克隆仓库（其他机器）
```bash
git clone https://github.com/<your-username>/ai-work-coach.git
cd ai-work-coach
npm install
```

### 2. 创建 .env 文件
```bash
cp .env.example .env
```
然后编辑 `.env` 添加你的 OpenAI API Key（可选）。

### 3. 启动项目
```bash
# 启动后端
npm run dev:api

# 启动前端（新终端）
npm run dev:web
```

## 七、后续开发流程

```bash
# 修改代码后
git add .
git commit -m "描述修改内容"
git push origin main
```

## 八、常见问题

### Q: 推送时提示认证失败？
A: 使用 GitHub Personal Access Token 作为密码：
1. 前往 GitHub → Settings → Developer settings → Personal access tokens
2. 生成一个新的 token（勾选 repo 权限）
3. 推送时用户名填 GitHub 用户名，密码填生成的 token

### Q: 中文文件名显示乱码？
A: 配置 Git 编码：
```bash
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
```

### Q: 如何忽略已提交的文件？
A: 如果需要忽略已上传的文件：
```bash
git rm --cached filename
git commit -m "Remove filename from tracking"
git push origin main
```

---

**完成以上步骤后，你的 AI Work Coach 项目就成功上传到 GitHub 了！**