import type { TrainingContent, ContentType } from '../types'

function item(
  partial: Omit<TrainingContent, 'category' | 'mediaType' | 'previewImageUrl' | 'contentFileUrl' | 'contentFileName' | 'contentFileSize' | 'vrFormat' | 'status' | 'sortOrder'> & {
    type: ContentType
  },
): TrainingContent {
  return {
    ...partial,
    category: partial.type,
    mediaType: 'none',
    previewImageUrl: null,
    contentFileUrl: null,
    contentFileName: null,
    contentFileSize: null,
    vrFormat: null,
    status: 'published',
    sortOrder: 0,
  }
}

export const TRAINING_CONTENTS: TrainingContent[] = [
  item({ id: 'c1', stageId: 'foundation', type: 'theory', title: '下肢动脉解剖3D动画', description: '股浅动脉、股深动脉及膝下分支三维走行与变异', duration: '45分钟', tags: ['解剖', '3D'] }),
  item({ id: 'c2', stageId: 'foundation', type: 'theory', title: 'DSA影像读片基础', description: '动脉期、静脉期、延迟期识别与常见伪影', duration: '60分钟', tags: ['读片', '影像'] }),
  item({ id: 'c3', stageId: 'foundation', type: 'dsa', title: '国产DSA开机与基础参数', description: '联影/东软等主流型号认知、开机关机流程、kV/mA基础调节', duration: '40分钟', tags: ['国产DSA', '操作'] }),
  item({ id: 'c4', stageId: 'foundation', type: 'virtual', title: '股动脉穿刺虚拟实操', description: '超声定位、18G穿刺针进针角度与止血压迫要点', duration: '30分钟', tags: ['穿刺', '虚拟实操'] }),
  item({ id: 'c5', stageId: 'foundation', type: 'case', title: '基础造影案例：下肢动脉硬化', description: '术前评估、造影体位选择、术后并发症观察', duration: '25分钟', tags: ['案例', '造影'] }),
  item({ id: 'c6', stageId: 'foundation', type: 'theory', title: '无菌操作与辐射防护', description: '导管室无菌原则、铅衣穿戴、剂量监测规范', duration: '35分钟', tags: ['规范', '防护'] }),
  item({ id: 'c7', stageId: 'advanced', type: 'theory', title: '肝癌TACE技术要点', description: '微导管超选、栓塞剂选择、栓塞终点判断', duration: '55分钟', tags: ['TACE', '肝胆'] }),
  item({ id: 'c8', stageId: 'advanced', type: 'dsa', title: '国产DSA复杂参数调节', description: '帧率、脉冲透视、剂量优化与不同体位适配', duration: '50分钟', tags: ['国产DSA', '进阶'] }),
  item({ id: 'c9', stageId: 'advanced', type: 'virtual', title: 'PTCD引流术模拟', description: '肝内胆管穿刺、导丝交换、内外引流管放置', duration: '45分钟', tags: ['PTCD', '虚拟实操'] }),
  item({ id: 'c10', stageId: 'advanced', type: 'case', title: '并发症案例：对比剂过敏处理', description: '术中识别、急救流程、后续预防策略', duration: '30分钟', tags: ['并发症', '急诊'] }),
  item({ id: 'c11', stageId: 'authorization', type: 'theory', title: 'TIPS术适应证与禁忌', description: '门脉高压分流指征、肝性脑病风险评估', duration: '50分钟', tags: ['TIPS', '高级'] }),
  item({ id: 'c12', stageId: 'authorization', type: 'dsa', title: '国产DSA精准调试与设备协同', description: '三维重建参数、C臂联动、多设备协同操作', duration: '55分钟', tags: ['国产DSA', '高级'] }),
  item({ id: 'c13', stageId: 'authorization', type: 'virtual', title: '复杂TIPS虚拟手术', description: '门静脉穿刺、支架释放、压力梯度测量', duration: '60分钟', tags: ['TIPS', '虚拟实操'] }),
  item({ id: 'c14', stageId: 'mastery', type: 'theory', title: '2025介入指南更新解读', description: '外周血管、神经介入最新证据与推荐等级', duration: '40分钟', tags: ['指南', '前沿'] }),
  item({ id: 'c15', stageId: 'mastery', type: 'dsa', title: '国产DSA AI辅助与远程操作', description: 'AI血管分割、智能剂量、5G远程会诊操作', duration: '45分钟', tags: ['AI', '远程'] }),
]

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  theory: '理论课程',
  dsa: '国产DSA',
  virtual: '虚拟实操',
  case: '典型案例',
}
