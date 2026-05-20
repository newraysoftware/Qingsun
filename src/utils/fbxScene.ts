export interface FbxCameraState {
  px: number
  py: number
  pz: number
  tx: number
  ty: number
  tz: number
}

export function isFbxCameraState(v: unknown): v is FbxCameraState {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return ['px', 'py', 'pz', 'tx', 'ty', 'tz'].every((k) => typeof o[k] === 'number')
}
