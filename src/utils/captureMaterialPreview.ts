import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { TrainingContent } from '../types'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const MAX_WIDTH = 800
const JPEG_QUALITY = 0.85

function scaleCanvas(source: HTMLCanvasElement, maxWidth = MAX_WIDTH): HTMLCanvasElement {
  if (source.width <= maxWidth) return source
  const canvas = document.createElement('canvas')
  canvas.width = maxWidth
  canvas.height = Math.round((source.height * maxWidth) / source.width)
  const ctx = canvas.getContext('2d')
  if (!ctx) return source
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

function canvasToJpegFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  const scaled = scaleCanvas(canvas)
  return new Promise((resolve, reject) => {
    scaled.toBlob(
      (blob) => {
        if (!blob) reject(new Error('无法生成预览图'))
        else resolve(new File([blob], filename, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

function captureTitleCard(title: string, subtitle: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#e0f2fe')
  gradient.addColorStop(1, '#f0f9ff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#0f766e'
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.textAlign = 'center'
  const lines = wrapText(ctx, title, canvas.width - 80)
  let y = canvas.height / 2 - lines.length * 14
  for (const line of lines) {
    ctx.fillText(line, canvas.width / 2, y)
    y += 28
  }
  ctx.fillStyle = '#64748b'
  ctx.font = '14px system-ui, sans-serif'
  ctx.fillText(subtitle, canvas.width / 2, canvas.height - 48)
  return canvas
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split('')
  const lines: string[] = []
  let line = ''
  for (const ch of words) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

async function capturePdfFirstPage(url: string): Promise<HTMLCanvasElement> {
  const pdf = await getDocument(url).promise
  const page = await pdf.getPage(1)
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = MAX_WIDTH / baseViewport.width
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas
}

async function captureVideoFrame(url: string): Promise<HTMLCanvasElement> {
  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = url

  await new Promise<void>((resolve, reject) => {
    const onErr = () => reject(new Error('视频加载失败'))
    video.addEventListener('loadeddata', () => resolve(), { once: true })
    video.addEventListener('error', onErr, { once: true })
  })

  video.currentTime = 0
  await new Promise<void>((resolve) => {
    if (video.readyState >= 2) resolve()
    else video.addEventListener('seeked', () => resolve(), { once: true })
  })

  const canvas = document.createElement('canvas')
  const w = Math.min(MAX_WIDTH, video.videoWidth || MAX_WIDTH)
  const h = Math.round(((video.videoHeight || 360) * w) / (video.videoWidth || w))
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  ctx.drawImage(video, 0, 0, w, h)
  video.remove()
  return canvas
}

/** 从课件预览初始画面生成 JPEG，供自动上传封面 */
export async function captureMaterialPreviewThumbnail(
  content: TrainingContent,
): Promise<File | null> {
  const url = content.contentFileUrl
  if (!url || content.mediaType === 'none') return null

  try {
    let canvas: HTMLCanvasElement | null = null

    switch (content.mediaType) {
      case 'pdf':
        canvas = await capturePdfFirstPage(url)
        break
      case 'video':
        canvas = await captureVideoFrame(url)
        break
      case 'vr':
        if (content.vrFormat === 'glb' || content.vrFormat === 'gltf' || content.vrFormat === 'fbx') {
          const { captureModelSceneThumbnail } = await import('../components/viewer/ModelSceneViewer')
          canvas = await captureModelSceneThumbnail(url)
        }
        if (!canvas) {
          canvas = captureTitleCard(content.title, 'VR 课件预览')
        }
        break
      case 'ppt':
        canvas = captureTitleCard(content.title, 'PPT · 首页预览')
        break
      default:
        return null
    }

    if (!canvas) return null
    return canvasToJpegFile(canvas, `preview-${content.id}.jpg`)
  } catch {
    return null
  }
}
