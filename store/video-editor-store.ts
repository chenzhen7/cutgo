import { create } from "zustand"
import type { ScriptShotPlan, Episode } from "@/lib/types"

export interface TimelineClip {
  id: string
  shotId: string
  trackId: string
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  videoUrl: string
  thumbnailUrl: string | null
  label: string
  volume: number
  speed: number
  transition: TransitionType
  transitionDuration: number
}

export interface AudioClip {
  id: string
  trackId: string
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  audioUrl: string
  label: string
  volume: number
  fadeIn: number
  fadeOut: number
  loop: boolean
}

export interface Track {
  id: string
  type: "video" | "audio" | "subtitle"
  label: string
  muted: boolean
  locked: boolean
  visible: boolean
  height: number
}

export type TransitionType = "none" | "fade" | "dissolve" | "slide_left" | "slide_right" | "zoom_in" | "zoom_out"

export const TRANSITION_OPTIONS: { value: TransitionType; label: string }[] = [
  { value: "none", label: "无" },
  { value: "fade", label: "淡入淡出" },
  { value: "dissolve", label: "溶解" },
  { value: "slide_left", label: "左滑" },
  { value: "slide_right", label: "右滑" },
  { value: "zoom_in", label: "放大" },
  { value: "zoom_out", label: "缩小" },
]

export interface SubtitleClip {
  id: string
  trackId: string
  startTime: number
  duration: number
  text: string
  style: {
    fontSize: number
    fontColor: string
    backgroundColor: string
    position: "top" | "center" | "bottom"
  }
}

export type ExportStatus = "idle" | "preparing" | "compositing" | "completed" | "error"

interface VideoEditorState {
  scriptShotPlans: ScriptShotPlan[]
  episodes: Episode[]
  activeEpisodeId: string | null

  tracks: Track[]
  videoClips: TimelineClip[]
  audioClips: AudioClip[]
  subtitleClips: SubtitleClip[]

  selectedClipId: string | null
  selectedClipType: "video" | "audio" | "subtitle" | null

  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  zoom: number
  scrollLeft: number

  pixelsPerSecond: number

  exportStatus: ExportStatus
  exportProgress: number
  exportError: string | null

  bgmTrack: AudioClip | null

  isLoading: boolean

  initFromScriptShotPlans: (scriptShotPlans: ScriptShotPlan[], episodes: Episode[], episodeId?: string) => void
  setActiveEpisodeId: (id: string | null) => void

  addVideoClip: (clip: Omit<TimelineClip, "id">) => void
  updateVideoClip: (id: string, data: Partial<TimelineClip>) => void
  removeVideoClip: (id: string) => void
  reorderVideoClips: (clipIds: string[]) => void
  splitVideoClip: (id: string, time: number) => void

  addAudioClip: (clip: Omit<AudioClip, "id">) => void
  updateAudioClip: (id: string, data: Partial<AudioClip>) => void
  removeAudioClip: (id: string) => void

  addSubtitleClip: (clip: Omit<SubtitleClip, "id">) => void
  updateSubtitleClip: (id: string, data: Partial<SubtitleClip>) => void
  removeSubtitleClip: (id: string) => void

  setBgm: (bgm: AudioClip | null) => void
  updateBgm: (data: Partial<AudioClip>) => void

  selectClip: (id: string | null, type: "video" | "audio" | "subtitle" | null) => void
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setZoom: (zoom: number) => void
  setScrollLeft: (scrollLeft: number) => void

  toggleTrackMute: (trackId: string) => void
  toggleTrackLock: (trackId: string) => void
  toggleTrackVisible: (trackId: string) => void

  startExport: () => void
  cancelExport: () => void

  getSelectedClip: () => TimelineClip | AudioClip | SubtitleClip | null
  getTotalDuration: () => number

  reset: () => void
}

let clipIdCounter = 0
const genId = () => `clip_${++clipIdCounter}_${Date.now()}`

const DEFAULT_TRACKS: Track[] = [
  { id: "video-main", type: "video", label: "视频轨道", muted: false, locked: false, visible: true, height: 64 },
  { id: "audio-bgm", type: "audio", label: "BGM", muted: false, locked: false, visible: true, height: 48 },
  { id: "audio-voice", type: "audio", label: "配音", muted: false, locked: false, visible: true, height: 48 },
  { id: "subtitle-main", type: "subtitle", label: "字幕", muted: false, locked: false, visible: true, height: 40 },
]

export const useVideoEditorStore = create<VideoEditorState>((set, get) => ({
  scriptShotPlans: [],
  episodes: [],
  activeEpisodeId: null,

  tracks: DEFAULT_TRACKS,
  videoClips: [],
  audioClips: [],
  subtitleClips: [],

  selectedClipId: null,
  selectedClipType: null,

  currentTime: 0,
  duration: 0,
  isPlaying: false,
  volume: 80,
  zoom: 1,
  scrollLeft: 0,

  pixelsPerSecond: 80,

  exportStatus: "idle",
  exportProgress: 0,
  exportError: null,

  bgmTrack: null,

  isLoading: false,

  initFromScriptShotPlans: (scriptShotPlans, episodes, episodeId) => {
    const filteredPlans = episodeId
      ? scriptShotPlans.filter((sb) => sb.episodeId === episodeId)
      : scriptShotPlans

    const shotsWithVideo = filteredPlans
      .flatMap((sb) => sb.shots)
      .filter((s) => s.videoUrl)
      .sort((a, b) => a.index - b.index)

    let currentTime = 0
    const videoClips: TimelineClip[] = shotsWithVideo.map((shot) => {
      const dur = typeof shot.videoDuration === 'number' ? shot.videoDuration : (typeof shot.duration === 'number' ? shot.duration : 5)
      const clip: TimelineClip = {
        id: genId(),
        shotId: shot.id,
        trackId: "video-main",
        startTime: currentTime,
        duration: dur,
        trimStart: 0,
        trimEnd: 0,
        videoUrl: shot.videoUrl!,
        thumbnailUrl: shot.imageUrl,
        label: shot.prompt?.slice(0, 20) || `镜头 ${shot.index + 1}`,
        volume: 100,
        speed: 1,
        transition: "none",
        transitionDuration: 0.5,
      }
      currentTime += dur
      return clip
    })

    const subtitleClips: SubtitleClip[] = shotsWithVideo
      .filter((s) => s.dialogueText)
      .map((shot) => {
        const matchingClip = videoClips.find((c) => c.shotId === shot.id)
        return {
          id: genId(),
          trackId: "subtitle-main",
          startTime: matchingClip?.startTime || 0,
          duration: matchingClip?.duration || 3,
          text: shot.dialogueText || "",
          style: {
            fontSize: 36,
            fontColor: "#FFFFFF",
            backgroundColor: "rgba(0,0,0,0.5)",
            position: "bottom" as const,
          },
        }
      })

    set({
      scriptShotPlans,
      episodes,
      activeEpisodeId: episodeId || null,
      videoClips,
      subtitleClips,
      audioClips: [],
      bgmTrack: null,
      duration: currentTime,
      currentTime: 0,
      isPlaying: false,
      selectedClipId: null,
      selectedClipType: null,
      tracks: DEFAULT_TRACKS,
      isLoading: false,
    })
  },

  setActiveEpisodeId: (id) => {
    const { scriptShotPlans, episodes } = get()
    set({ activeEpisodeId: id })
    get().initFromScriptShotPlans(scriptShotPlans, episodes, id || undefined)
  },

  addVideoClip: (clip) => {
    const newClip = { ...clip, id: genId() }
    set((state) => {
      const clips = [...state.videoClips, newClip]
      return { videoClips: clips, duration: get().getTotalDuration() }
    })
  },

  updateVideoClip: (id, data) => {
    set((state) => ({
      videoClips: state.videoClips.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
    set({ duration: get().getTotalDuration() })
  },

  removeVideoClip: (id) => {
    set((state) => ({
      videoClips: state.videoClips.filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
      selectedClipType: state.selectedClipId === id ? null : state.selectedClipType,
    }))
    set({ duration: get().getTotalDuration() })
  },

  reorderVideoClips: (clipIds) => {
    const { videoClips } = get()
    const reordered = clipIds
      .map((id) => videoClips.find((c) => c.id === id))
      .filter(Boolean) as TimelineClip[]

    let currentTime = 0
    const updated = reordered.map((clip) => {
      const newClip = { ...clip, startTime: currentTime }
      currentTime += clip.duration
      return newClip
    })

    set({ videoClips: updated, duration: currentTime })
  },

  splitVideoClip: (id, time) => {
    const { videoClips } = get()
    const clip = videoClips.find((c) => c.id === id)
    if (!clip) return

    const relativeTime = time - clip.startTime
    if (relativeTime <= 0.1 || relativeTime >= clip.duration - 0.1) return

    const firstHalf: TimelineClip = {
      ...clip,
      duration: relativeTime,
    }

    const secondHalf: TimelineClip = {
      ...clip,
      id: genId(),
      startTime: clip.startTime + relativeTime,
      duration: clip.duration - relativeTime,
      trimStart: clip.trimStart + relativeTime,
    }

    set((state) => ({
      videoClips: state.videoClips.flatMap((c) =>
        c.id === id ? [firstHalf, secondHalf] : [c]
      ),
    }))
  },

  addAudioClip: (clip) => {
    set((state) => ({
      audioClips: [...state.audioClips, { ...clip, id: genId() }],
    }))
  },

  updateAudioClip: (id, data) => {
    set((state) => ({
      audioClips: state.audioClips.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
  },

  removeAudioClip: (id) => {
    set((state) => ({
      audioClips: state.audioClips.filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    }))
  },

  addSubtitleClip: (clip) => {
    set((state) => ({
      subtitleClips: [...state.subtitleClips, { ...clip, id: genId() }],
    }))
  },

  updateSubtitleClip: (id, data) => {
    set((state) => ({
      subtitleClips: state.subtitleClips.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
  },

  removeSubtitleClip: (id) => {
    set((state) => ({
      subtitleClips: state.subtitleClips.filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    }))
  },

  setBgm: (bgm) => set({ bgmTrack: bgm }),

  updateBgm: (data) => {
    set((state) => ({
      bgmTrack: state.bgmTrack ? { ...state.bgmTrack, ...data } : null,
    }))
  },

  selectClip: (id, type) => set({ selectedClipId: id, selectedClipType: type }),

  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setScrollLeft: (scrollLeft) => set({ scrollLeft: Math.max(0, scrollLeft) }),

  toggleTrackMute: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
    }))
  },

  toggleTrackLock: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t)),
    }))
  },

  toggleTrackVisible: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t)),
    }))
  },

  startExport: () => {
    set({ exportStatus: "preparing", exportProgress: 0, exportError: null })

    const steps = [
      { status: "preparing" as const, progress: 10, delay: 500 },
      { status: "compositing" as const, progress: 30, delay: 1000 },
      { status: "compositing" as const, progress: 60, delay: 2000 },
      { status: "compositing" as const, progress: 90, delay: 3000 },
      { status: "completed" as const, progress: 100, delay: 4000 },
    ]

    steps.forEach(({ status, progress, delay }) => {
      setTimeout(() => {
        if (get().exportStatus === "idle") return
        set({ exportStatus: status, exportProgress: progress })
      }, delay)
    })
  },

  cancelExport: () => {
    set({ exportStatus: "idle", exportProgress: 0, exportError: null })
  },

  getSelectedClip: () => {
    const { selectedClipId, selectedClipType, videoClips, audioClips, subtitleClips } = get()
    if (!selectedClipId || !selectedClipType) return null
    if (selectedClipType === "video") return videoClips.find((c) => c.id === selectedClipId) || null
    if (selectedClipType === "audio") return audioClips.find((c) => c.id === selectedClipId) || null
    if (selectedClipType === "subtitle") return subtitleClips.find((c) => c.id === selectedClipId) || null
    return null
  },

  getTotalDuration: () => {
    const { videoClips, audioClips, bgmTrack } = get()
    let maxEnd = 0
    for (const clip of videoClips) {
      maxEnd = Math.max(maxEnd, clip.startTime + clip.duration)
    }
    for (const clip of audioClips) {
      maxEnd = Math.max(maxEnd, clip.startTime + clip.duration)
    }
    if (bgmTrack) {
      maxEnd = Math.max(maxEnd, bgmTrack.startTime + bgmTrack.duration)
    }
    return maxEnd
  },

  reset: () => {
    clipIdCounter = 0
    set({
      scriptShotPlans: [],
      episodes: [],
      activeEpisodeId: null,
      tracks: DEFAULT_TRACKS,
      videoClips: [],
      audioClips: [],
      subtitleClips: [],
      selectedClipId: null,
      selectedClipType: null,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      volume: 80,
      zoom: 1,
      scrollLeft: 0,
      exportStatus: "idle",
      exportProgress: 0,
      exportError: null,
      bgmTrack: null,
      isLoading: false,
    })
  },
}))
