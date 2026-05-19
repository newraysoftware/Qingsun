import type { Expert, CommunityGroup } from '../types'

export const EXPERTS: Expert[] = [
  { id: 'e1', name: '张明华', title: '主任医师', hospital: '北京协和医院', stages: ['foundation', 'advanced'], specialties: ['国产DSA操作', '外周介入'], bio: '从事介入20年，擅长DSA设备教学与规培带教' },
  { id: 'e2', name: '李雪琴', title: '副主任医师', hospital: '上海中山医院', stages: ['advanced', 'authorization'], specialties: ['TACE', '并发症处理'], bio: '肝胆介入专家，主讲复杂病例与并发症应对' },
  { id: 'e3', name: '王建国', title: '主任医师', hospital: '广州南方医院', stages: ['authorization', 'mastery'], specialties: ['TIPS', '门脉高压'], bio: '门脉高压介入权威，授权考核命题专家' },
  { id: 'e4', name: '陈晓峰', title: '教授', hospital: '四川大学华西医院', stages: ['mastery'], specialties: ['前沿技术', '指南解读'], bio: '介入学会委员，专注指南更新与罕见病例' },
]

export const COMMUNITY_GROUPS: CommunityGroup[] = [
  { id: 'g1', name: '规培基础期交流组', stageId: 'foundation', category: '阶段交流', members: 1280, posts: 3560 },
  { id: 'g2', name: '国产DSA操作交流组', category: '内容交流', members: 890, posts: 2100 },
  { id: 'g3', name: '专培进阶期病例研讨', stageId: 'advanced', category: '病例研讨', members: 650, posts: 1890 },
  { id: 'g4', name: 'TACE技术讨论组', category: '技术专题', members: 420, posts: 980 },
  { id: 'g5', name: '授权提升期考核互助', stageId: 'authorization', category: '阶段交流', members: 310, posts: 720 },
]

export const NEWS_ITEMS = [
  { id: 'n1', stageId: 'foundation' as const, title: '2025介入规培基地评估标准更新', date: '2025-05-10', category: '政策' },
  { id: 'n2', stageId: 'advanced' as const, title: '国产DSA新一代平板探测器临床应用', date: '2025-05-08', category: '技术' },
  { id: 'n3', stageId: 'mastery' as const, title: '中国介入放射学指南（2025版）要点', date: '2025-05-01', category: '指南' },
]

export const TOOLS = [
  { id: 't1', name: '血管解剖查询', desc: '按部位快速查询动脉走行与变异', stages: ['foundation', 'advanced'] },
  { id: 't2', name: '手术量统计', desc: '记录个人介入手术量与分型', stages: ['advanced', 'authorization'] },
  { id: 't3', name: '介入器械库', desc: '导管、导丝、支架规格与适应症', stages: ['foundation', 'advanced', 'authorization'] },
  { id: 't4', name: '剂量计算器', desc: '透视剂量估算与防护参考', stages: ['foundation'] },
]
