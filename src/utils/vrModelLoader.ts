import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { FbxCameraState } from './fbxScene'

export function modelFormatFromUrl(url: string): 'fbx' | 'gltf' {
  return /\.fbx(\?|$)/i.test(url) ? 'fbx' : 'gltf'
}

export function loadVrModel(
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

export function frameModelToCamera(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
): number {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return 5
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.01)
  const radius = maxDim * 1.6
  target.copy(center)
  const offset = new THREE.Vector3(radius * 0.55, radius * 0.35, radius)
  camera.position.copy(center).add(offset)
  camera.lookAt(center)
  return radius
}

export function cameraStateFromOrbit(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
): FbxCameraState {
  return {
    px: camera.position.x,
    py: camera.position.y,
    pz: camera.position.z,
    tx: target.x,
    ty: target.y,
    tz: target.z,
  }
}

export function applyCameraState(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  state: FbxCameraState,
): number {
  camera.position.set(state.px, state.py, state.pz)
  target.set(state.tx, state.ty, state.tz)
  camera.lookAt(target)
  return camera.position.distanceTo(target)
}
