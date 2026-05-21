const BLOCK_PATTERNS = [
  /色情|裸体|赌博|暴力袭击/,
  /\b(fuck|shit|porn)\b/i,
]

const MEDICAL_HINT =
  /dsa|介入|穿刺|造影|导管|支架|栓塞|tace|ptcd|血管|手术|培训|规培|专培|病例|辐射|防护|并发症|器械|影像|读片|肝|胆|肿瘤|急诊/i

export function isOffTopicOrBlocked(text: string): boolean {
  const t = text.trim()
  if (t.length < 2) return true
  for (const p of BLOCK_PATTERNS) {
    if (p.test(t)) return true
  }
  if (t.length > 200 && !MEDICAL_HINT.test(t)) return true
  return false
}
