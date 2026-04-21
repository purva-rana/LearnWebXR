import * as THREE from 'three';
import { createRenderer, createCamera, createLights } from "./baseComponents";

const container = document.querySelector('#app') as HTMLDivElement;

// Create a scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Create a camera
const camera = createCamera();
const renderer = createRenderer(container);

scene.add(createLights());

// Floor (important for spatial reference)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

renderer.render(scene, camera);