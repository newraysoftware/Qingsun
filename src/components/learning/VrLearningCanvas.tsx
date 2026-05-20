import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { FbxCameraState } from '../../utils/fbxScene'
import {
  applyCameraState,
  cameraStateFromOrbit,
  frameModelToCamera,
  loadVrModel,
} from '../../utils/vrModelLoader'

export interface VrLearningCanvasProps {
  url: string
  cameraState?: FbxCameraState | null
  className?: string
  onReady?: () => void
  onError?: () => void
  onCameraChange?: (state: FbxCameraState) => void
}

type DragMode = 'rotate' | 'pan' | 'zoom' | null

/**
 * 专用 VR 学习 Canvas：WebGL 直接渲染到 <canvas>，原生鼠标事件控制。
 * 左键拖动旋转 · 滚轮/中键拖动缩放 · 右键拖动平移
 */
export function VrLearningCanvas({
  url,
  cameraState,
  className,
  onReady,
  onError,
  onCameraChange,
}: VrLearningCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const callbacksRef = useRef({ onReady, onError, onCameraChange })
  const initialCameraRef = useRef(cameraState)

  callbacksRef.current = { onReady, onError, onCameraChange }

  useLayoutEffect(() => {
    initialCameraRef.current = cameraState
  }, [url])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !url) return

    let disposed = false
    let raf = 0
    let lastReport = 0

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf1f5f9)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000)
    const target = new THREE.Vector3()

    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const key = new THREE.DirectionalLight(0xffffff, 0.95)
    key.position.set(8, 14, 10)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.4)
    fill.position.set(-6, 4, -8)
    scene.add(fill)

    let radius = 5
    let theta = 0.8
    let phi = 1.1
    let minRadius = 0.5
    let maxRadius = 200

    const syncCameraFromOrbit = () => {
      const offset = new THREE.Vector3().setFromSphericalCoords(radius, phi, theta)
      camera.position.copy(target).add(offset)
      camera.lookAt(target)
    }

    const setRadiusFromDistance = (dist: number) => {
      radius = Math.max(minRadius, Math.min(maxRadius, dist))
      const offset = camera.position.clone().sub(target)
      const s = new THREE.Spherical().setFromVector3(offset)
      theta = s.theta
      phi = s.phi
    }

    const resize = () => {
      const parent = canvas.parentElement
      const w = Math.max(parent?.clientWidth ?? canvas.clientWidth, 200)
      const h = Math.max(parent?.clientHeight ?? canvas.clientHeight, 200)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }

    const resizeObserver = new ResizeObserver(resize)
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }
    resize()

    let dragMode: DragMode = null
    let lastX = 0
    let lastY = 0

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.button === 0) dragMode = 'rotate'
      else if (e.button === 1) dragMode = 'zoom'
      else if (e.button === 2) dragMode = 'pan'
      else return
      lastX = e.clientX
      lastY = e.clientY
      canvas.style.cursor = dragMode === 'rotate' ? 'grabbing' : 'move'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragMode) return
      e.preventDefault()
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY

      if (dragMode === 'rotate') {
        theta -= dx * 0.008
        phi -= dy * 0.008
        phi = Math.max(0.12, Math.min(Math.PI - 0.12, phi))
        syncCameraFromOrbit()
      } else if (dragMode === 'pan') {
        const dist = camera.position.distanceTo(target)
        const panX = (-dx * dist) / 500
        const panY = (dy * dist) / 500
        const right = new THREE.Vector3()
        const up = new THREE.Vector3()
        camera.matrixWorld.extractBasis(right, up, new THREE.Vector3())
        target.addScaledVector(right, panX)
        target.addScaledVector(up, panY)
        syncCameraFromOrbit()
      } else if (dragMode === 'zoom') {
        const factor = 1 + dy * 0.005
        setRadiusFromDistance(radius * factor)
        syncCameraFromOrbit()
      }
    }

    const onMouseUp = () => {
      dragMode = null
      canvas.style.cursor = 'grab'
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const factor = e.deltaY > 0 ? 1.08 : 0.92
      setRadiusFromDistance(radius * factor)
      syncCameraFromOrbit()
    }

    const onContextMenu = (e: Event) => e.preventDefault()

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    const tick = () => {
      if (disposed) return
      raf = requestAnimationFrame(tick)
      renderer.render(scene, camera)

      const now = Date.now()
      if (callbacksRef.current.onCameraChange && now - lastReport > 2000) {
        lastReport = now
        callbacksRef.current.onCameraChange(cameraStateFromOrbit(camera, target))
      }
    }
    tick()

    loadVrModel(
      url,
      (object) => {
        if (disposed) return
        scene.add(object)
        const box = new THREE.Box3().setFromObject(object)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z, 0.01)
        minRadius = maxDim * 0.15
        maxRadius = maxDim * 8

        const saved = initialCameraRef.current
        if (saved) {
          const dist = applyCameraState(camera, target, saved)
          setRadiusFromDistance(dist)
        } else {
          const r = frameModelToCamera(object, camera, target)
          setRadiusFromDistance(r)
          const offset = camera.position.clone().sub(target)
          const s = new THREE.Spherical().setFromVector3(offset)
          theta = s.theta
          phi = s.phi
        }
        resize()
        callbacksRef.current.onReady?.()
      },
      () => {
        if (!disposed) callbacksRef.current.onError?.()
      },
    )

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      resizeObserver.disconnect()
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const m of mats) m?.dispose()
        }
      })
    }
  }, [url])

  return (
    <canvas
      ref={canvasRef}
      className={`vr-learning-canvas block h-full w-full cursor-grab ${className ?? ''}`}
      style={{ touchAction: 'none' }}
      aria-label="VR 模型交互区域：左键旋转，滚轮或中键缩放，右键平移"
    />
  )
}
