export type TrainingStageId = 'foundation' | 'advanced' | 'authorization' | 'mastery'
export type ContentCategory = 'theory' | 'dsa' | 'virtual' | 'case'
export type MediaType = 'none' | 'pdf' | 'ppt' | 'video' | 'vr'
export type VrFormat = 'glb' | 'gltf' | 'fbx'

export interface TrainingContentRecord {
  id: string
  title: string
  description: string
  stageId: TrainingStageId
  category: ContentCategory
  mediaType: MediaType
  duration: string
  tags: string[]
  previewImageUrl: string | null
  contentFileUrl: string | null
  contentFileName: string | null
  contentFileSize: number | null
  vrFormat: VrFormat | null
  status: 'draft' | 'published'
  sortOrder: number
  createdAt: string
  updatedAt: string
}
