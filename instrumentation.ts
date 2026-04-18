import { failRunningAiTasksOnStartup } from "@/lib/ai-task-service"

let recovered = false

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (recovered) return

  recovered = true

  try {
    const count = await failRunningAiTasksOnStartup()
    if (count > 0) {
      console.warn(`[AiTask Recovery] Marked ${count} running task(s) as failed after restart.`)
    }
  } catch (error) {
    console.error("[AiTask Recovery] Failed to recover running tasks on startup.", error)
  }
}
