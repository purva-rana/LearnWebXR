import * as THREE from 'three';
import { createRenderer, createCamera, createLights } from "./baseComponents";
import { OrbitControls } from 'three/examples/jsm/Addons.js';


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
        new THREE.PlaneGeometry(10, 10, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
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
        buttonMaterial
);
button.position.set(1, 1.4, -2);
scene.add(button);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObject(button);

  if (hits.length > 0) {
    targetCube.visible = !targetCube.visible;
  }
});

const originIndicator = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xff5555 })
);
originIndicator.position.set(0, 0, 0);
scene.add(originIndicator);

// Add orbit controls for non-VR mode
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, -2);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

renderer.setAnimationLoop(() => {
        controls.update(); // required if damping enabled later
        renderer.render(scene, camera);
});

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