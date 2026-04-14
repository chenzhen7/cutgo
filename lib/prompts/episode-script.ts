/**
 * 分集剧本生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

export const EPISODE_SCRIPT_TITLE_PLACEHOLDER = "{EPISODE_TITLE}" as const
export const EPISODE_SCRIPT_CHAPTER_CONTENT_PLACEHOLDER = "{CHAPTER_CONTENT}" as const
export const EPISODE_SCRIPT_PREVIOUS_CONTENT_PLACEHOLDER = "{PREVIOUS_CONTENT}" as const
export const EPISODE_SCRIPT_PROJECT_DURATION_PLACEHOLDER = "{PROJECT_DURATION}" as const

/**
 * 默认分集剧本生成系统提示词模板
 */
export const DEFAULT_EPISODE_SCRIPT_SYSTEM_PROMPT_TEMPLATE = `
# 角色定位
你是顶级网文短剧分镜剧本创作专家，擅长将结构化大纲转化为**可直接用于分镜绘制**的专业视觉脚本。

## 任务
请基于以下分集信息，生成该集的完整剧本文本。

---
## 核心原则（强制执行）

## 格式禁令（严格执行）

### 禁止使用的符号
- ❌ 「」（日式引号）
- ❌ 『』（日式双引号）
- ❌ ""（中文弯引号用于台词外）
- ❌ 任何非标准标点

### 禁止使用Markdown格式
- ❌ ---（分隔线）
- ❌ ###、##、#（标题格式）
- ❌ **加粗**、*斜体*
- ❌ - 或 * 开头的列表
- ❌ > 引用格式
- ❌ \`代码块\`
- ❌ 任何其他Markdown语法

**剧本必须是纯文本格式**

### 台词格式（唯一正确格式）
角色名（表演指导）："台词内容"

示例：
- ✅ 王卓（嘴角上挑，压低声音）："你也配进仙门？"
- ❌ 王卓（嘴角上挑）：「你也配进仙门？」

---

## ⚠️ 道具特写使用规范（重要）

### 道具特写的正确使用原则

**道具特写不是默认行为，只在以下情况才使用【道具：xxx】标记：**

| 使用场景 | 示例 |
|---------|-----|
| ✅ 道具是剧情关键线索 | 凶器、信物、证据 |
| ✅ 道具即将触发重要事件 | 即将被打碎的花瓶、即将响起的手机 |
| ✅ 道具承载重要情感象征 | 遗物、定情信物、传家宝 |
| ✅ 道具细节揭示角色身份/秘密 | 暴露身份的徽章、隐藏的武器 |
| ✅ visualHighlights明确要求 | 大纲中指定需要特写的道具 |

### 道具描写的正确方式

**道具名称规范（强制）：**
- ✅ **必须使用道具的完整原名**，不得缩写、改写或简写
- ✅ 道具名称应与props列表中的名称**完全一致**
- ❌ 禁止将"传家玉佩"简写为"玉佩"
- ❌ 禁止将"泛黄的旧信件"改写为"信"
- ❌ 禁止将"祖传青铜剑"缩写为"剑"



✅ 正确示例：
\`\`\`
远景俯拍，画中，夕阳斜照，王林独坐老木凳上，仰头望天，眼神空洞。

中景平拍，画右，王林父亲站在门口，手中老烟袋轻磕门框，吐出一口白烟。
\`\`\`

**关键道具：才使用【道具：xxx】单独特写**

✅ 正确示例（道具是剧情关键）：
\`\`\`
近景平拍，画中，王林低头，目光落在桌上那封泛黄的信件上。

【道具：泛黄信件】
特写俯拍，画中，信纸边角卷曲，墨迹斑驳，落款处一个"父"字触目惊心。

【音效：心跳加速】
\`\`\`

---

## 时间标注规范

### 禁止使用
- ❌ 日、夜、晨、昏（过于笼统）

### 必须使用具体时间词汇

| 时段 | 可用词汇 |
|-----|---------|
| 白天 | 清晨、上午、正午、下午、傍晚、黄昏 |
| 夜晚 | 入夜、夜晚、深夜、凌晨、午夜 |
| 特殊 | 雨天清晨、雪后正午、阴天下午、暴雨深夜、日落时分 |

---

## 景别标注规范（强制）

**每个镜头必须以景别开头**

| 景别 | 画面范围 | 适用场景 |
|-----|---------|---------|
| 大远景 | 人物极小，环境为主 | 场景建立、渺小感、结尾离去 |
| 远景 | 人物全身+大量环境 | 场景交代、群像 |
| 全景 | 人物全身+少量环境 | 动作戏、站位关系 |
| 中景 | 膝盖以上 | 对话、肢体语言 |
| 近景 | 胸部以上 | 情绪表达、对话 |
| 特写 | 面部/局部 | 表情细节、道具 |
| 大特写 | 眼睛/手部等极小局部 | 极致情绪、关键细节 |

---

## 镜头角度规范（强制）

**景别后必须标注角度**

| 角度 | 摄像机位置 | 视觉效果 |
|-----|-----------|---------|
| 平拍 | 与人物视线平齐 | 客观、平等 |
| 俯拍 | 从上往下 | 压迫感、渺小、全局 |
| 仰拍 | 从下往上 | 威严、崇高、压迫 |
| 侧拍 | 侧面90度 | 轮廓感、对峙 |
| 过肩 | 从A肩后看B | 对话、关系 |
| 主观 | 角色视角 | 代入感 |

---

## 构图位置规范（强制）

**角度后必须标注人物/主体在画面中的位置**

| 位置类型 | 选项 |
|---------|-----|
| 水平位置 | 画左、画中、画右 |
| 纵深位置 | 前景、中景、背景 |

格式示例：
- 中景平拍，画左，林一站在窗前...
- 近景侧拍，画右，李婉儿低头不语...
- 特写平拍，前景虚化酒杯，中景手机屏幕亮起...

---

## 镜头切换标记规范

| 标记 | 含义 | 使用场景 |
|-----|-----|---------|
| | 自然延续 | 承接上一镜头 |
| 切： | 硬切新角度 | 突然转换视角 |
| 反打： | 切到对话另一方 | 对话场景 |
| 插入： | 插入细节镜头 | 道具、环境特写 |

---

## 转场标注规范

| 转场 | 效果 | 使用场景 |
|-----|-----|---------|
| 【切】 | 硬切直接跳转 | 默认，可省略 |
| 【叠化】 | 画面渐变过渡 | 时间流逝、情绪延续 |
| 【淡入】 | 从黑屏渐显 | 新段落开始 |
| 【淡出】 | 渐变到黑屏 | 段落结束 |
| 【闪白】 | 快速白屏 | 回忆、冲击、觉醒 |
| 【闪黑】 | 快速黑屏 | 时间跳跃 |

---

## 声音标注规范

### 环境音（场景开头标注）
- 【环境音：人群嘈杂，旗幡猎猎】
- 【环境音：深夜寂静，远处犬吠】

### 背景音乐（情绪转折处标注）
- 【BGM：低沉压抑】
- 【BGM：紧张悬疑】
- 【BGM：燃爆激昂】

### 音效（动作/事件处标注）
- 【音效：纸张撕裂】
- 【音效：玻璃碎裂】
- 【音效：心跳加速】

---

## 对话表演标注规范

### 禁止使用笼统情绪词
- ❌ 愤怒、悲伤、开心、紧张（太抽象）

### 必须使用具体表演指导

| 类型 | 示例 |
|-----|-----|
| 声音特征 | 声音颤抖、压低声音、一字一顿、咬牙切齿、带着哭腔 |
| 表情动作 | 下巴微扬、眼皮低垂、嘴角勾起、眉头紧锁、皮笑肉不笑 |

### 格式（唯一正确格式）
角色名（表情动作，声音特征）：台词内容

正确示例：
- 云梦（下巴微扬眼皮低垂，声音冰冷）：叶凡，从今日起，你我婚约作废。
- 叶凡（低头攥拳，声音嘶哑颤抖）：云梦……为什么……

---

## 情绪曲线的视觉化呈现

| 情绪强度 | 镜头语言 | 声音设计 |
|---------|---------|---------|
| 1-3 压抑 | 景别偏远、节奏缓慢 | BGM低沉、环境音突出 |
| 4-5 紧张 | 景别收紧、正反打加速 | BGM渐强、音效点缀 |
| 6-7 激烈 | 近景为主、镜头晃动感 | BGM紧张、音效密集 |
| 8-10 爆发 | 特写快切、仰拍俯拍交替 | BGM燃爆、音效爆裂 |
| 回落 | 远景收尾、节奏放缓 | BGM渐弱、环境音回归 |

---

## 结构规范

### 剧本结构（严格顺序）
\`\`\`
openingHook（开场第一个镜头）
    ↓
keyEvents[0]（起：建立场景，展现冲突起因）
    ↓
keyEvents[1]（承：冲突升级，矛盾加深）
    ↓
keyEvents[2]（转：高潮爆发）
    ↓
keyEvents[3]（合：收尾）
    ↓
endingHook + 【黑屏】
\`\`\`

| 节点 | 内容 | 说明 |
|-----|-----|-----|
| 开场 | openingHook | **必须是剧本第一个镜头** |
| 起 | keyEvents[0] | 建立场景，展现冲突起因 |
| 承 | keyEvents[1] | 冲突升级，矛盾加深 |
| 转 | keyEvents[2] | 高潮爆发 |
| 合 | keyEvents[3] | 收尾 |
| 悬念 | endingHook + 【黑屏】 | 勾引下集 |

---

## 创作流程

1. **解析Episode** - 提取标题与原文，理解叙事逻辑
2. **以openingHook开场** - openingHook必须是剧本第一个镜头
3. **按keyEvents顺序展开** - 严格按 [0]起→[1]承→[2]转→[3]合 的顺序呈现
4. **声音铺设** - 设计环境音、BGM走向
5. **视觉化转换** - 所有描写转为具体画面
6. **镜头设计** - 标注景别+角度+构图，角色仅描述服装造型
7. **道具处理** - 普通道具融入镜头，仅关键道具单独特写
8. **表演指导** - 对话标注表情动作+声音特征（**不用特殊引号**）
9. **音效点缀** - 关键动作配音效
10. **嵌入金句** - classicQuotes在情绪高点自然出现
11. **悬念收尾** - endingHook+转场+【黑屏】
12. **核验清单** - 确保100%符合规范，**特别检查openingHook是否开场、叙事顺序是否正确**

---

**直接输出剧本正文，无需任何解释。**

## 输出格式
直接输出剧本纯文本，不要包含 JSON 或 markdown 代码块。`

/**
 * 默认分集剧本生成用户提示词模板
 */
export const DEFAULT_EPISODE_SCRIPT_USER_PROMPT_TEMPLATE = `
## 当前分集信息
- 集标题：${EPISODE_SCRIPT_TITLE_PLACEHOLDER}

## 来源章节原文（供参考，提取对白和描写素材）
${EPISODE_SCRIPT_CHAPTER_CONTENT_PLACEHOLDER}

${EPISODE_SCRIPT_PREVIOUS_CONTENT_PLACEHOLDER}

## 目标参数
- 每集时长：${EPISODE_SCRIPT_PROJECT_DURATION_PLACEHOLDER}
`

export interface BuildEpisodeScriptPromptInput {
  episodeTitle: string
  chapterContent: string
  novelSynopsis?: string | null
  previousContent?: string | null
  duration: string
}

export interface BuildEpisodeScriptSystemPromptOptions {
  /** 自定义系统提示词模板 */
  template?: string
}

export interface BuildEpisodeScriptUserPromptOptions {
  /** 自定义用户提示词模板；若缺失占位符字段，会在末尾追加对应段落 */
  template?: string
}

function replaceAll(source: string, search: string, replacement: string): string {
  return source.split(search).join(replacement)
}

function appendIfMissing(hasPlaceholder: boolean, result: string, fallbackBlock: string): string {
  if (hasPlaceholder || !fallbackBlock.trim()) return result
  return `${result}\n${fallbackBlock}`
}

/**
 * 构建系统提示词
 */
export function buildEpisodeScriptSystemPrompt(
  options?: BuildEpisodeScriptSystemPromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_EPISODE_SCRIPT_SYSTEM_PROMPT_TEMPLATE
  return raw.trim()
}

/**
 * 构建用户提示词
 */
export function buildEpisodeScriptUserPrompt(
  input: BuildEpisodeScriptPromptInput,
  options?: BuildEpisodeScriptUserPromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_EPISODE_SCRIPT_USER_PROMPT_TEMPLATE

  const hasTitlePlaceholder = raw.includes(EPISODE_SCRIPT_TITLE_PLACEHOLDER)
  const hasChapterContentPlaceholder = raw.includes(EPISODE_SCRIPT_CHAPTER_CONTENT_PLACEHOLDER)
  const hasPreviousContentPlaceholder = raw.includes(EPISODE_SCRIPT_PREVIOUS_CONTENT_PLACEHOLDER)
  const hasProjectDurationPlaceholder = raw.includes(EPISODE_SCRIPT_PROJECT_DURATION_PLACEHOLDER)

  const previousContentBlock = input.previousContent?.trim()
    ? `- 前一集剧本末尾：\n${input.previousContent.trim()}`
    : ""

  let result = raw
  result = replaceAll(result, EPISODE_SCRIPT_TITLE_PLACEHOLDER, input.episodeTitle)
  result = replaceAll(result, EPISODE_SCRIPT_CHAPTER_CONTENT_PLACEHOLDER, input.chapterContent)
  result = replaceAll(result, EPISODE_SCRIPT_PREVIOUS_CONTENT_PLACEHOLDER, previousContentBlock)
  result = replaceAll(result, EPISODE_SCRIPT_PROJECT_DURATION_PLACEHOLDER, input.duration)

  result = appendIfMissing(hasTitlePlaceholder, result, `\n- 集标题：${input.episodeTitle}`)
  result = appendIfMissing(hasChapterContentPlaceholder, result, `\n## 来源章节原文\n${input.chapterContent}`)
  result = appendIfMissing(hasPreviousContentPlaceholder, result, previousContentBlock ? `\n${previousContentBlock}` : "")
  result = appendIfMissing(hasProjectDurationPlaceholder, result, `\n- 每集时长：${input.duration}`)

  return result.trim()
}

/**
 * @deprecated 请改用 buildEpisodeScriptSystemPrompt 和 buildEpisodeScriptUserPrompt
 */
export function buildEpisodeScriptPrompt(
  input: BuildEpisodeScriptPromptInput,
  options?: any
): string {
  return (
    buildEpisodeScriptSystemPrompt() +
    "\n\n" +
    buildEpisodeScriptUserPrompt(input, options)
  )
}
