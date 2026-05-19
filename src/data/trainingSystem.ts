import type { TrainingStage } from '../types'

export const TRAINING_STAGES: TrainingStage[] = [
  {
    id: 'foundation',
    name: '规培基础期',
    period: '0-3年',
    targetAudience: '规培新人',
    coreGoal: '夯实血管解剖、影像读片、国产DSA基础操作与无菌/辐射防护',
    keyContent: [
      '血管解剖（3D动画）',
      '影像读片基础',
      '国产DSA基础操作',
      '基础穿刺虚拟实操',
      '基础案例（穿刺、造影）',
      '无菌操作与辐射防护',
      '基础介入器械认知',
    ],
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'advanced',
    name: '专培进阶期',
    period: '3-6年',
    targetAudience: '专培医师',
    coreGoal: '突破分系统介入技术与复杂造影，掌握并发症处理与急诊介入基础',
    keyContent: [
      '分系统介入技术（TACE、PTCD等）',
      '复杂造影技巧',
      '并发症处理',
      '国产DSA进阶操作',
      '分方向实操模拟',
      '复杂案例与急诊介入',
    ],
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'authorization',
    name: '授权提升期',
    period: '6-7年',
    targetAudience: '授权提升期医师',
    coreGoal: '掌握高级介入技术、复杂病例分析与危急重症应急处理',
    keyContent: [
      '高级介入技术（TIPS等）',
      '复杂病例分析',
      '危急重症应急处理',
      '国产DSA高级操作',
      '复杂手术虚拟实操',
      '授权考核模拟',
      '医疗合规规范',
    ],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'mastery',
    name: '持续精进期',
    period: '7年+',
    targetAudience: '资深介入医师',
    coreGoal: '跟踪前沿技术、罕见复杂手术与多中心协作能力',
    keyContent: [
      '罕见复杂手术',
      '介入前沿技术',
      '指南更新解读',
      '国产DSA前沿应用（AI辅助、远程）',
      '罕见案例与多中心协作',
      '新型器械应用',
    ],
    color: 'from-violet-500 to-purple-600',
  },
]

export const STAGE_LABEL: Record<string, string> = {
  foundation: '规培基础期',
  advanced: '专培进阶期',
  authorization: '授权提升期',
  mastery: '持续精进期',
}
