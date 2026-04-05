## 项目概述

**CutGo** 是一款面向短视频/漫剧制作的 AI 辅助生产工具，支持以 Electron 桌面应用和 Web 两种形式运行。

核心流程为：**小说原文导入 → AI 分集/分幕 → 剧本生成 → 分镜生成 → 图像生成 → 视频合成**，全程由 AI 驱动，用户可在每个环节审校与编辑。

主要功能模块：
- **项目管理**：多项目并行，记录画幅比、风格预设、全局提示词
- **小说导入**：原文分章/分段，支持章节/段落粒度选取
- **分集规划**：AI 生成集大纲、黄金钩子、核心冲突、悬念
- **剧本生成**：AI 逐集生成台词/动作/旁白
- **分镜生成**：将剧本转换为镜头序列，包含提示词和时长
- **资产管理**：角色、场景、道具的提示词与参考图管理
- **图像生成**：支持多图像模型，批量为分镜生图
- **视频合成**：TTS + 图像合成分集视频
- **AI 任务中心**：统一跟踪所有异步 AI 任务状态

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 语言 | TypeScript 5（strict 模式） |
| 样式 | Tailwind CSS v4（无 `tailwind.config`，通过 `globals.css` 配置） |
| UI 组件 | shadcn/ui（radix-nova 风格）+ Radix UI + Base UI |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable |
| 状态管理 | Zustand 5 |
| 数据库 | SQLite（本地，`dev.db`），通过 Prisma 7 + better-sqlite3 适配器访问 |
| AI SDK | Vercel AI SDK（`ai` + `@ai-sdk/openai` + `@ai-sdk/google`） |
| 桌面 | Electron 40 |
| 构建工具 | PostCSS（`@tailwindcss/postcss`）|
| 代码规范 | ESLint 9（eslint-config-next） |

---

## 项目结构

```
cutgo/
├── app/                        # Next.js App Router
│   ├── (main)/                 # 主站布局（首页、设置）
│   │   ├── page.tsx            # 首页（项目列表）
│   │   ├── settings/           # 设置页（AI 配置）
│   │   └── components/         # 侧边栏等主站组件
│   ├── (project)/              # 项目工作台布局
│   │   └── project/
│   │       ├── new/            # 新建项目
│   │       └── [id]/           # 项目详情（动态路由）
│   │           ├── import/     # 小说导入
│   │           ├── script/     # 剧本生成
│   │           ├── shot/       # 分镜生成
│   │           ├── images/     # 图像生成
│   │           ├── video/      # 视频合成
│   │           ├── assets/     # 资产管理
│   │           ├── characters/ # 角色管理
│   │           ├── style/      # 风格设置
│   │           ├── tasks/      # AI 任务中心
│   │           └── export/     # 导出
│   └── api/                    # REST API 路由处理器
│       ├── projects/           # 项目 CRUD
│       ├── novels/             # 小说导入与分析
│       ├── episodes/           # 分集管理
│       ├── scripts/            # 剧本生成
│       ├── script-shots/       # 分镜生成
│       ├── assets/             # 资产管理（角色/场景/道具）
│       ├── images/             # 图像生成
│       ├── videos/             # 视频合成 + TTS
│       ├── ai-tasks/           # AI 任务管理
│       └── settings/           # 设置与 AI 配置
│
├── lib/                        # 业务逻辑与工具层
│   ├── ai/                     # AI 封装层
│   │   ├── types.ts            # AI 类型定义
│   │   ├── config.ts           # AI 配置读取
│   │   ├── providers.ts        # Provider 工厂
│   │   ├── llm/                # LLM 调用（openai/google 适配）
│   │   ├── image/              # 图像生成（doubao/stability/placeholder）
│   │   └── video/              # 视频生成
│   ├── prompts/                # AI 提示词模板
│   ├── generated/prisma/       # Prisma Client 生成物（勿手动编辑）
│   ├── api-client.ts           # 前端统一 fetch 封装（apiFetch + ApiError）
│   ├── api-error.ts            # 后端错误码 + withError + throwCutGoError
│   ├── ai-task.ts              # AI 任务工具函数
│   ├── ai-task-service.ts      # AI 任务服务层
│   ├── db.ts                   # Prisma Client 单例（better-sqlite3 适配）
│   ├── pipeline.ts             # 流水线编排
│   ├── types.ts                # 全局共享类型
│   └── utils.ts                # 通用工具函数
│
├── components/                 # 全局 UI 组件
│   ├── ui/                     # shadcn 基础组件（约 30+）
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
│
├── store/                      # Zustand 状态管理
│   └── (project/novel/script/shot/video 等 store)
│
├── hooks/                      # 自定义 React Hooks
├── prisma/                     # 数据库 schema 与迁移
│   ├── schema.prisma
│   └── migrations/
├── electron/                   # Electron 入口
│   └── main.js
├── public/                     # 静态资源
└── doc/                        # 设计文档
```

**数据模型（Prisma）**：`Project` → `Novel` → `Chapter` → `Paragraph`；`Project` → `Episode` → `Shot`；`Project` → `AssetCharacter / AssetScene / AssetProp`；`AiTask`（跨模型 AI 任务追踪）；`AIModelConfig` + `Settings`（AI 配置）。

---

## 编码规范

### 通用规则
- 在已有功能基础上添加新功能时，必须确保，不影响原有功能
- 遵循架构设计，保持代码风格一致
- 代码修改遵循单一职责原则，不混合多个变更
- 尽量复用已有代码，避免重复代码
- 确保代码可读性与可维护性，必要时加简要注释
- 代码变更范围最小化，避免大范围修改
- 如果有疑问，先询问再修改，不要擅自做决定
- 通用能力放工具层（`lib/`）
- 路由层（`app/api/**/route.ts`）尽量只编排业务，不承载底层细节

### API 错误处理

所有 `route.ts` 必须使用 `throwCutGoError` + `withError`：

```ts
import { throwCutGoError, withError } from "@/lib/api-error"

export const POST = withError(async (request: NextRequest) => {
  const { projectId } = await request.json()
  if (!projectId) throwCutGoError("MISSING_PARAMS", "缺少 projectId 参数")
  // ...
})
```

禁止手写 `NextResponse.json({ error: "..." }, { status: xxx })`。

| 场景 | 写法 | HTTP 状态 |
|------|------|-----------|
| 缺少必要参数 | `throwCutGoError("MISSING_PARAMS", msg?)` | 400 |
| 业务校验不通过 | `throwCutGoError("VALIDATION", msg?)` | 400 |
| 资源不存在 | `throwCutGoError("NOT_FOUND", msg?)` | 404 |
| 名称/唯一键冲突 | `throwCutGoError("CONFLICT", msg?)` | 409 |
| LLM 未配置 | `throwCutGoError("LLM_NOT_CONFIGURED")` | 422 |
| 图像模型未配置 | `throwCutGoError("IMAGE_NOT_CONFIGURED")` | 422 |
| LLM 响应无效 | `throwCutGoError("LLM_INVALID_RESPONSE", msg?)` | 500 |
| 服务端内部错误 | `throwCutGoError("INTERNAL", msg?)` | 500 |

### AI 模型调用规范

**1. LLM 调用**
业务路由中必须使用项目封装的统一入口 `callLLM()`，禁止直接读取环境变量裸调 `fetch`；`getLLMProvider()` / `llmProvider.chat()` 仅允许在 `lib/ai/llm` 封装层内部使用：

```ts
import { callLLM } from "@/lib/ai/llm"
import { CutGoError, throwCutGoError } from "@/lib/api-error"

try {
  const result = await callLLM({ messages: [{ role: "user", content: prompt }] })
  const text = result.content
} catch (err) {
  if (err instanceof CutGoError) throw err  // 透传，不要二次包装
  throwCutGoError("LLM_INVALID_RESPONSE", (err as Error).message)
}
```

LLM 返回 JSON 时需去除 markdown 代码块包裹再解析：

```ts
let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
const data = JSON.parse(text)
```

**2. 图像生成调用**
业务路由中必须使用项目封装的统一入口 `callImage()`，禁止直接调用 `getImageProvider()` 之后裸调 `provider.generate()`：

```ts
import { callImage } from "@/lib/ai/image"

const result = await callImage({
  prompt,
  projectId,
  scope: "shot",
  aspectRatio,
  resolution
})
```

### 前端 API 调用规范

前端（页面、组件、store）使用 `apiFetch`，禁止裸调 `fetch`：

```ts
import { apiFetch, ApiError } from "@/lib/api-client"
import { API_ERRORS } from "@/lib/api-error"

try {
  const data = await apiFetch<Project[]>("/api/projects")
} catch (err) {
  if (err instanceof ApiError) {
    toast.error(err.message)
    if (err.code === API_ERRORS.NOT_FOUND.code) { /* ... */ }
  }
}
```

---

### 路径别名

项目统一使用 `@/` 指向项目根目录：

```ts
import { apiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/store/project-store"
```
