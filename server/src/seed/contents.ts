import type { CreateContentInput } from '../schemas/content.js'

/** 初始培训内容（与前端 mock 对齐） */
export const SEED_CONTENTS = [
  { title: '下肢动脉解剖3D动画', description: '股浅动脉、股深动脉及膝下分支三维走行与变异', stageId: 'foundation', category: 'theory', mediaType: 'none', duration: '45分钟', tags: ['解剖', '3D'] },
  { title: 'DSA影像读片基础', description: '动脉期、静脉期、延迟期识别与常见伪影', stageId: 'foundation', category: 'theory', mediaType: 'none', duration: '60分钟', tags: ['读片', '影像'] },
  { title: '国产DSA开机与基础参数', description: '联影/东软等主流型号认知、开机关机流程、kV/mA基础调节', stageId: 'foundation', category: 'dsa', mediaType: 'none', duration: '40分钟', tags: ['国产DSA', '操作'] },
  { title: '股动脉穿刺虚拟实操', description: '超声定位、18G穿刺针进针角度与止血压迫要点', stageId: 'foundation', category: 'virtual', mediaType: 'none', duration: '30分钟', tags: ['穿刺', '虚拟实操'] },
  { title: '基础造影案例：下肢动脉硬化', description: '术前评估、造影体位选择、术后并发症观察', stageId: 'foundation', category: 'case', mediaType: 'none', duration: '25分钟', tags: ['案例', '造影'] },
  { title: '无菌操作与辐射防护', description: '导管室无菌原则、铅衣穿戴、剂量监测规范', stageId: 'foundation', category: 'theory', mediaType: 'none', duration: '35分钟', tags: ['规范', '防护'] },
  { title: '肝癌TACE技术要点', description: '微导管超选、栓塞剂选择、栓塞终点判断', stageId: 'advanced', category: 'theory', mediaType: 'none', duration: '55分钟', tags: ['TACE', '肝胆'] },
  { title: '国产DSA复杂参数调节', description: '帧率、脉冲透视、剂量优化与不同体位适配', stageId: 'advanced', category: 'dsa', mediaType: 'none', duration: '50分钟', tags: ['国产DSA', '进阶'] },
  { title: 'PTCD引流术模拟', description: '肝内胆管穿刺、导丝交换、内外引流管放置', stageId: 'advanced', category: 'virtual', mediaType: 'none', duration: '45分钟', tags: ['PTCD', '虚拟实操'] },
  { title: '并发症案例：对比剂过敏处理', description: '术中识别、急救流程、后续预防策略', stageId: 'advanced', category: 'case', mediaType: 'none', duration: '30分钟', tags: ['并发症', '急诊'] },
  { title: 'TIPS术适应证与禁忌', description: '门脉高压分流指征、肝性脑病风险评估', stageId: 'authorization', category: 'theory', mediaType: 'none', duration: '50分钟', tags: ['TIPS', '高级'] },
  { title: '国产DSA精准调试与设备协同', description: '三维重建参数、C臂联动、多设备协同操作', stageId: 'authorization', category: 'dsa', mediaType: 'none', duration: '55分钟', tags: ['国产DSA', '高级'] },
  { title: '复杂TIPS虚拟手术', description: '门静脉穿刺、支架释放、压力梯度测量', stageId: 'authorization', category: 'virtual', mediaType: 'none', duration: '60分钟', tags: ['TIPS', '虚拟实操'] },
  { title: '2025介入指南更新解读', description: '外周血管、神经介入最新证据与推荐等级', stageId: 'mastery', category: 'theory', mediaType: 'none', duration: '40分钟', tags: ['指南', '前沿'] },
  { title: '国产DSA AI辅助与远程操作', description: 'AI血管分割、智能剂量、5G远程会诊操作', stageId: 'mastery', category: 'dsa', mediaType: 'none', duration: '45分钟', tags: ['AI', '远程'] },
] satisfies CreateContentInput[]
