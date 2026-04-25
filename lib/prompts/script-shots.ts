/**
 * 分镜生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

// ── 分镜列表生成 ──────────────────────────────────────────

export interface ShotListItem {
  content: string
  characters: string[]
  scene: string
  props: string[]
  duration?: number
}

export interface BuildShotListPromptInput {
  episodeTitle: string
  episodeScenes: string
  episodeCharacters: string
  episodeProps: string
  scriptContent: string
  previousShotContent: string | null
}

// ── 分镜列表提取 ─────────────────────────────────────────────────────────────

const SHOT_LIST_SYSTEM_PROMPT = `你是一位电影剧和漫剧分镜设计师，擅长将剧本拆解为结构化的分镜列表。

## 任务
根据提供的剧本内容，将剧本拆解为一系列关键镜头，每个镜头必须包含：：
1. 分镜内容（content）
2. 该镜头出场的角色（characters）
3. 该镜头所在的场景（scene）
4. 该镜头涉及的道具（props）
5. 镜头时长预估（duration，秒数）


## 分镜内容模板
\`\`\`
[景别（远景/中景/近景/特写等）] , [画面内容（人物动作+环境）]
[镜头运动（推拉摇移）]
[角色表情]
[台词/旁白]
\`\`\`

例如：
\`\`\`
1. 远景,林远对着空无一人的街道喊话，神情紧绷，雨水打湿了衣领,镜头固定,角色嘴部有明显的说话动作。林远： “出来！别躲在水里装神弄鬼！”
2. 正反打,越过神秘人的肩膀看向林远，林远瞳孔收缩，甚至往后退了一步。镜头缓慢推进（Zoom in），增强压迫感。林远： “（内心独白）这家伙...没有心跳声？”
...
\`\`\`

## 要求
- 镜头之间应有叙事连贯性，覆盖剧本的关键情节
- 遵循叙事节奏：建立镜头（远景交代环境）→ 发展镜头（中景动作互动）→ 情绪镜头（近景情感高点）→ 过渡/收尾
- 角色名/场景名/道具名需使用用户提供的资产名称，不要随意改写

## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "content": "分镜内容",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 5
  }
]

字段约束：
1. content: 必填，分镜内容
2. characters: 该镜头实际出场角色名数组；没有则输出 []
3. scene: 该镜头对应场景名；不确定时优先使用当前分集主场景
4. props: 该镜头实际出现或重点关联道具名数组；没有则输出 []
5. duration: 必填，视频时长（数字类型，根据镜头内容合理预估秒数，通常 2-15 秒）`

export function buildShotListSystemPrompt(): string {
  return SHOT_LIST_SYSTEM_PROMPT
}

export function buildShotListUserPrompt(input: BuildShotListPromptInput): string {
  const previousShotBlock = input.previousShotContent?.trim()
    ? `## 前一个分集最后一个镜头内容\n${input.previousShotContent.trim()}（请确保本集首个镜头与之自然衔接）\n\n`
    : ""

  return `${previousShotBlock}## 剧本信息
- 标题：${input.episodeTitle}
- 关联场景：${input.episodeScenes || "未指定"}
- 出场角色：${input.episodeCharacters || "无"}
- 涉及道具：${input.episodeProps || "无"}

## 剧本内容
${input.scriptContent}`.trim()
}
