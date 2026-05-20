import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { FbxCameraState } from '../../utils/fbxScene'

export interface ModelSceneViewerProps {
  url: string
  paused?: boolean
  autoRotate?: boolean
  cameraState?: FbxCameraState | null
  className?: string
  style?: React.CSSProperties
  onReady?: () => void
  onError?: () => void
  onCameraChange?: (state: FbxCameraState) => void
  onUserInteract?: () => void
}

function modelFormatFromUrl(url: string): 'fbx' | 'gltf' {
  return /\.fbx(\?|$)/i.test(url) ? 'fbx' : 'gltf'
}

function configureOrbitControls(controls: OrbitControls) {
  controls.enabled = true
  controls.enableRotate = true
  controls.enableZoom = true
  controls.enablePan = true
  controls.screenSpacePanning = true
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  }
}

function frameModel(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.01)
  const dist = maxDim * 1.6
  camera.position.copy(center).add(new THREE.Vector3(dist * 0.55, dist * 0.35, dist))
  controls.target.copy(center)
  controls.update()
}

function loadModel(
  url: string,
  onLoad: (root: THREE.Object3D) => void,
  onFail: () => void,
) {
  if (modelFormatFromUrl(url) === 'fbx') {
    new FBXLoader().load(url, onLoad, undefined, onFail)
    return
  }
  new GLTFLoader().load(url, (gltf) => onLoad(gltf.scene), undefined, onFail)
}

async function waitForContainerSize(container: HTMLElement): Promise<void> {
  for (let i = 0; i < 120; i += 1) {
    if (container.clientWidth >= 64 && container.clientHeight >= 64) return
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
  }
}

export function ModelSceneViewer({
  url,
  paused = false,
  autoRotate = false,
  cameraState,
  className,
  style,
  onReady,
  onError,
  onCameraChange,
  onUserInteract,
}: ModelSceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  const onErrorRef = useRef(onError)
  const onCameraChangeRef = useRef(onCameraChange)
  const onUserInteractRef = useRef(onUserInteract)
  const pausedRef = useRef(paused)
  const autoRotateRef = useRef(autoRotate)
  const initialCameraRef = useRef(cameraState)

  onReadyRef.current = onReady
  onErrorRef.current = onError
  onCameraChangeRef.current = onCameraChange
  onUserInteractRef.current = onUserInteract
  pausedRef.current = paused
  autoRotateRef.current = autoRotate

  useLayoutEffect(() => {
    initialCameraRef.current = cameraState
  }, [url])

  useLayoutEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useLayoutEffect(() => {
    autoRotateRef.current = autoRotate
  }, [autoRotate])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !url) return

    let disposed = false
    let raf = 0
    let lastCameraReport = 0
    let controls: OrbitControls | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let resizeObserver: ResizeObserver | null = null

    const stopAutoRotate = () => {
      autoRotateRef.current = false
      if (controls) controls.autoRotate = false
      onUserInteractRef.current?.()
    }

    const init = async () => {
      await waitForContainerSize(container)
      if (disposed) return

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf8fafc)

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000)
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const canvas = renderer.domElement
      canvas.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;display:block;outline:none;touch-action:none;cursor:grab;pointer-events:auto'
      container.appendChild(canvas)

      controls = new OrbitControls(camera, container)
      configureOrbitControls(controls)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.addEventListener('start', stopAutoRotate)

      scene.add(new THREE.AmbientLight(0xffffff, 0.7))
      const dir = new THREE.DirectionalLight(0xffffff, 0.9)
      dir.position.set(6, 12, 8)
      scene.add(dir)

      const resize = () => {
        const w = Math.max(container.clientWidth, 64)
        const h = Math.max(container.clientHeight, 64)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer?.setSize(w, h, false)
      }
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)
      resize()

      const tick = () => {
        if (disposed || !controls || !renderer) return
        raf = requestAnimationFrame(tick)
        controls.autoRotate = autoRotateRef.current && !pausedRef.current
        controls.update()
        renderer.render(scene, camera)

        const now = Date.now()
        if (onCameraChangeRef.current && now - lastCameraReport > 2000) {
          lastCameraReport = now
          onCameraChangeRef.current({
            px: camera.position.x,
            py: camera.position.y,
            pz: camera.position.z,
            tx: controls.target.x,
            ty: controls.target.y,
            tz: controls.target.z,
          })
        }
      }
      tick()

      loadModel(
        url,
        (object) => {
          if (disposed || !controls) return
          scene.add(object)
          const cam = initialCameraRef.current
          if (cam) {
            camera.position.set(cam.px, cam.py, cam.pz)
            controls.target.set(cam.tx, cam.ty, cam.tz)
            controls.update()
          } else {
            frameModel(object, camera, controls)
          }
          resize()
          onReadyRef.current?.()
        },
        () => {
          if (!disposed) onErrorRef.current?.()
        },
      )
    }

    void init()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      controls?.removeEventListener('start', stopAutoRotate)
      controls?.dispose()
      resizeObserver?.disconnect()
      renderer?.dispose()
      const canvas = renderer?.domElement
      if (canvas?.parentNode === container) {
        container.removeChild(canvas)
      }
    }
  }, [url])

  return (
    <div
      ref={containerRef}
      className={`model-scene-root relative isolate min-h-[320px] w-full flex-1 touch-none ${className ?? ''}`}
      style={{ pointerEvents: 'auto', ...style }}
      title="左键旋转 · 中键或滚轮缩放 · 右键平移"
    />
  )
}

/** 离屏截取 3D 模型首帧，用于自动生成封面 */
export async function captureModelSceneThumbnail(url: string): Promise<HTMLCanvasElement | null> {
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-9999px;width:640px;height:360px;pointer-events:none'
  document.body.appendChild(host)

  return new Promise((resolve) => {
    let settled = false
    const finish = (canvas: HTMLCanvasElement | null) => {
      if (settled) return
      settled = true
      host.remove()
      resolve(canvas)
    }

    const timeout = window.setTimeout(() => finish(null), 25000)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf8fafc)
    const camera = new THREE.PerspectiveCamera(45, 640 / 360, 0.1, 5000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(640, 360, false)
    host.appendChild(renderer.domElement)
    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 10, 7)
    scene.add(dir)

    const done = (object: THREE.Object3D) => {
      scene.add(object)
      const box = new THREE.Box3().setFromObject(object)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z, 0.01)
      const dist = maxDim * 1.6
      camera.position.copy(center).add(new THREE.Vector3(dist * 0.55, dist * 0.35, dist))
      camera.lookAt(center)
      renderer.render(scene, camera)
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.drawImage(renderer.domElement, 0, 0)
      renderer.dispose()
      clearTimeout(timeout)
      finish(canvas)
    }

    loadModel(
      url,
      done,
      () => {
        renderer.dispose()
        clearTimeout(timeout)
        finish(null)
      },
    )
  })
}

export const FbxSceneViewer = ModelSceneViewer
export type FbxSceneViewerProps = ModelSceneViewerProps
export const captureFbxThumbnail = captureModelSceneThumbnail
