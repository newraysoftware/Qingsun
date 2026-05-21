export interface AssistantPanelRect {
  left: number
  top: number
  width: number
  height: number
}

export const PANEL_MIN_WIDTH = 280
export const PANEL_MIN_HEIGHT = 360
export const PANEL_MAX_WIDTH = 560
export const PANEL_MAX_HEIGHT = 900

export function defaultPanelRect(mobile: boolean): AssistantPanelRect {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  if (mobile) {
    const width = Math.min(vw - 16, 420)
    const height = Math.min(vh - 80, 560)
    return {
      left: Math.max(8, (vw - width) / 2),
      top: 56,
      width,
      height,
    }
  }
  const width = 340
  const height = Math.min(620, vh - 72)
  return {
    left: Math.max(8, vw - width - 24),
    top: 56,
    width,
    height,
  }
}

export function clampPanelRect(rect: AssistantPanelRect, mobile: boolean): AssistantPanelRect {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const maxW = mobile ? vw - 8 : Math.min(PANEL_MAX_WIDTH, vw - 16)
  const maxH = mobile ? vh - 48 : Math.min(PANEL_MAX_HEIGHT, vh - 16)
  const width = Math.min(maxW, Math.max(PANEL_MIN_WIDTH, rect.width))
  const height = Math.min(maxH, Math.max(PANEL_MIN_HEIGHT, rect.height))
  const left = Math.min(Math.max(8, rect.left), vw - width - 8)
  const top = Math.min(Math.max(48, rect.top), vh - height - 8)
  return { left, top, width, height }
}
