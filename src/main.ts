import * as THREE from "three";
import { createRenderer, createCamera, createLights } from "./baseComponents";
import { OrbitControls } from "three/examples/jsm/Addons.js";

const container = document.querySelector("#app") as HTMLDivElement;

// -------------------------------------------------------------
// Utility function to create a texture with text for the button
// -------------------------------------------------------------
function createTextTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// -------------------------------------------------------------
// helper function to Create controller rays with dynamic length
// -------------------------------------------------------------
const createControllerRay = () => {
  const rayGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array([0, 0, 0, 0, 0, -5]);
  rayGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  rayGeometry.setDrawRange(0, 2);

  const rayMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.7,
    transparent: true,
  });
  const rayLine = new THREE.Line(rayGeometry, rayMaterial);
  rayLine.userData.maxDistance = 5;
  return rayLine;
};

//-------------------------------------------------------------
// Basic Three.js setup with WebXR support
//-------------------------------------------------------------

// Create a scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Create a camera
const camera = createCamera();
const renderer = createRenderer(container);

scene.add(createLights());

//-------------------------------------------------------------
// Add some basic objects to interact with
//-------------------------------------------------------------

// Floor (important for spatial reference)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 10, 10),
  new THREE.MeshStandardMaterial({ color: 0x444444 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
const targetCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
targetCube.position.set(0, 1.6, -2);
scene.add(targetCube);

const buttonMaterial = new THREE.MeshBasicMaterial({
  map: createTextTexture("Show Cube"),
});

const button = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.3, 0.1),
  buttonMaterial,
);
button.position.set(1, 1.4, -2);
scene.add(button);

const originIndicator = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 0.1, 0.1),
  new THREE.MeshStandardMaterial({ color: 0xff5555 }),
);
originIndicator.position.set(0, 0, 0);
scene.add(originIndicator);

// -----------------------------------------------------------
// Add desktop interaction - toggle cube visibility when button is clicked
// -------------------------------------------------------------

// Add raycasting for button interaction - for desktop mode (VR controllers will be handled separately)
const desktopRaycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  desktopRaycaster.setFromCamera(mouse, camera);

  const hits = desktopRaycaster.intersectObject(button);

  if (hits.length > 0) {
    targetCube.visible = !targetCube.visible;
  }
});

// Add orbit controls for non-VR mode
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, -2);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

// -----------------------------------------------------------
// Add VR controller support for interaction
// -----------------------------------------------------------

const controllerLeft = renderer.xr.getController(0);
const controllerRight = renderer.xr.getController(1);

const rayLeft = createControllerRay();
const rayRight = createControllerRay();
controllerLeft.add(rayLeft);
controllerRight.add(rayRight);

scene.add(controllerLeft);
scene.add(controllerRight);

// Controller grips (visual representation)
const controllerGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 16);
const controllerMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

const controllerGripLeft = renderer.xr.getControllerGrip(0);
const controllerMeshLeft = new THREE.Mesh(
  controllerGeometry,
  controllerMaterial.clone(), // clone to allow separate color changes if needed
);
controllerGripLeft.add(controllerMeshLeft);
scene.add(controllerGripLeft);

const controllerGripRight = renderer.xr.getControllerGrip(1);
const controllerMeshRight = new THREE.Mesh(
  controllerGeometry,
  controllerMaterial.clone(),
);
controllerGripRight.add(controllerMeshRight);
scene.add(controllerGripRight);

// Raycaster for controller interaction
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();

// Interaction state
let cubeGrabbedBySelect = false;
let cubeGrabbedByGrip = false;
let initialControllerPosition = new THREE.Vector3();
let initialControllerQuaternion = new THREE.Quaternion();
let initialCubePosition = new THREE.Vector3();
let initialCubeRotation = new THREE.Euler();
let initialControllerDistance = 0;
let initialCubeScale = 1;
let grabbingController = null;
let activeControllerIndex = null;

// Objects that can be intersected by rays
const interactableObjects = [button, targetCube];

// Visual feedback
const highlightCube = (isHighlighted: boolean) => {
  cubeMaterial.emissive.setHex(isHighlighted ? 0x004400 : 0x000000);
};

const updateRayVisuals = (ray: THREE.Mesh, intersections: THREE.Intersection[]) => {
  const positions = ray.geometry.attributes.position.array;
  const maxDistance = ray.userData.maxDistance;
  const material = ray.material as THREE.LineBasicMaterial;

  if (intersections.length > 0) {
    // Clip ray at intersection point
    const intersection = intersections[0];
    const distance = intersection.distance;

    // Update endpoint to intersection distance
    positions[3] = 0;
    positions[4] = 0;
    positions[5] = -distance;

    // Change color based on what's intersected
    material.color.setHex(0x00ff00);
  } else {
    // Full length ray, no intersection
    positions[3] = 0;
    positions[4] = 0;
    positions[5] = -maxDistance;

    material.color.setHex(0xffffff);
  }

  ray.geometry.attributes.position.needsUpdate = true;
};

// -----------------------------------------------------------
// Animation loop and VR support
// -----------------------------------------------------------

// Check VR support
if ("xr" in navigator) {
  navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
    console.log("WebXR supported:", supported);
  });
} else {
  console.warn("WebXR not supported by this browser");
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update(); // required if damping enabled later
  renderer.render(scene, camera);
});
