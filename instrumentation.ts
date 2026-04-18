let recovered = false

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (recovered) return

  recovered = true

  try {
    const { failRunningAiTasksOnStartup } = await import("@/lib/ai-task-service")
    const recovery = await failRunningAiTasksOnStartup()
    if (recovery.failedAiTaskCount > 0 || recovery.recoveredImageRecordCount > 0) {
      console.warn(
        `[AiTask Recovery] Marked ${recovery.failedAiTaskCount} running task(s) as failed after restart. ` +
          `Recovered image records: shots=${recovery.recoveredShotImageCount}, ` +
          `characters=${recovery.recoveredAssetCharacterImageCount}, ` +
          `scenes=${recovery.recoveredAssetSceneImageCount}, props=${recovery.recoveredAssetPropImageCount}.`
      )
    }
  } catch (error) {
    console.error("[AiTask Recovery] Failed to recover running tasks on startup.", error)
  }
}
