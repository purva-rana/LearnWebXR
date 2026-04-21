import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

export function createRenderer(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.xr.enabled = true;

  container.appendChild(renderer.domElement);

  const button = VRButton.createButton(renderer);
  document.body.appendChild(button);

  return renderer;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 1.6, 3);
  return camera;
}

export function createLights() {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const directional = new THREE.DirectionalLight(0xffffff, 1);

  directional.position.set(5, 10, 5);

  group.add(ambient, directional);
  return group;
}