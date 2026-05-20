export interface HighlightNote {
  id: string
  page: number
  text: string
  createdAt: string
}

export interface VrActionLogEntry {
  step: string
  action: string
  at: string
}

import type { FbxCameraState } from './fbxScene'

export interface LearningMeta {
  highlights?: HighlightNote[]
  fontScale?: number
  playbackRate?: number
  muted?: boolean
  quality?: 'sd' | 'hd'
  /** 3D 模型 / VR 场景相机角度 */
  cameraOrbit?: string
  /** FBX 场景相机（Three.js OrbitControls） */
  fbxCamera?: FbxCameraState
  /** VR 当前环节 */
  vrStep?: string
  vrActionLog?: VrActionLogEntry[]
  dsaKv?: number
  dsaMa?: number
  /** 3D 动画视频已播放秒数 */
  animationElapsed?: number
}

export function parseLearningMeta(meta?: string | null): LearningMeta {
  if (!meta) return {}
  try {
    const parsed = JSON.parse(meta) as LearningMeta
    if (typeof parsed === 'object' && parsed !== null) return parsed
  } catch {
    /* 兼容旧数据：meta 直接存 camera-orbit 字符串 */
    if (meta.includes('deg') || meta.includes('m')) {
      return { cameraOrbit: meta }
    }
  }
  return {}
}

export function stringifyLearningMeta(meta: LearningMeta): string {
  return JSON.stringify(meta)
}
