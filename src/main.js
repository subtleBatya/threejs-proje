import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import textureImage from './assets/Asphalt031.jpg';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enable Shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Post-Processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new ShaderPass(new THREE.ShaderMaterial(FXAAShader)));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85));

// Camera Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
light.castShadow = true;
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Physics World
const physicsWorld = new CANNON.World();
physicsWorld.gravity.set(0, -9.82, 0);
const defaultMaterial = new CANNON.Material('defaultMaterial');
physicsWorld.defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
  friction: 0.1,
  restitution: 0.7,
});
const cannonDebugger = CannonDebugger(scene, physicsWorld);

// Floor (Physics + Graphics)
const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physicsWorld.addBody(floorBody);
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x808080 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Utility to create Physics-Linked Objects
function createPhysicsObject(shape, mass, position, material) {
  const body = new CANNON.Body({ mass, material });
  body.addShape(shape);
  body.position.copy(position);
  physicsWorld.addBody(body);

  const geometry =
    shape instanceof CANNON.Sphere ? new THREE.SphereGeometry(shape.radius, 32, 32) : new THREE.BoxGeometry(...shape.halfExtents.toArray().map((v) => v * 2));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  scene.add(mesh);

  return { body, mesh };
}

// Create Multiple Physics Objects
const textureLoader = new THREE.TextureLoader();
const sphereMaterial = new THREE.MeshStandardMaterial({ map: textureLoader.load(textureImage) });
const objects = [];
for (let i = 0; i < 10; i++) {
  const isSphere = Math.random() > 0.5;
  const shape = isSphere
    ? new CANNON.Sphere(Math.random() * 0.5 + 0.3)
    : new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  const position = new CANNON.Vec3(Math.random() * 5 - 2.5, Math.random() * 5 + 1, Math.random() * 5 - 2.5);
  const obj = createPhysicsObject(shape, 1, position, sphereMaterial);
  objects.push(obj);
}

// Interactivity: Apply Force to Clicked Object
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects.map((obj) => obj.mesh));
  if (intersects.length > 0) {
    const obj = objects.find((o) => o.mesh === intersects[0].object);
    if (obj) {
      const force = new CANNON.Vec3(0, 5, 0);
      obj.body.applyImpulse(force, obj.body.position);
    }
  }
});

// Wind Force
window.addEventListener('keydown', (event) => {
  if (event.key === 'w') {
    const wind = new CANNON.Vec3(2, 0, 0);
    objects.forEach((obj) => obj.body.applyForce(wind, obj.body.position));
  }
});

// Responsive Canvas
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Animation Loop
function animate() {
  physicsWorld.step(1 / 60);
  objects.forEach(({ body, mesh }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });
  cannonDebugger.update();
  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}
animate();



// THE FOLLOWING ARE BEGINNER TESTS


// import * as THREE from 'three';
// import { LOD } from 'three';
// import textureImage from './assets/Asphalt031.jpg';
// // Scene, Camera, Renderer
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);


// // Keyboard Navigation
// document.addEventListener('keydown', (event) => {
//   switch (event.key) {
//     case 'ArrowUp':
//       camera.position.z -= 0.5;
//       break;
//     case 'ArrowDown':
//       camera.position.z += 0.5;
//       break;
//     case 'ArrowLeft':
//       camera.position.x -= 0.5;
//       break;
//     case 'ArrowRight':
//       camera.position.x += 0.5;
//       break;
//   }
// })



// // Raycaster and Mouse For User Interaction

// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();
// let selectedObject = null;

// const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
// const planeIntersect = new THREE.Vector3();

// document.addEventListener('mousedown', (event) => {
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(scene.children);

//   if (intersects.length > 0) {
//     selectedObject = intersects[0].object;

//     dragPlane.setFromNormalAndCoplanarPoint(
//       camera.getWorldDirection(dragPlane, normal),
//       selectedObject.position);
//   }
// });

// document.addEventListener('mousemove', (event) => {
//   if (!selectedObject) return;

//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);

//   if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
//     selectedObject.position.copy(planeIntersect);
//   }
// });

// document.addEventListener('mouseup', () => {
//   selectedObject = null;
// });
// // Create interactive cubes
// // const cubes = [];
// // for (let i = 0; i < 3; i++) {
// const geometry = new THREE.SphereGeometry();
// const textureLoader = new THREE.TextureLoader();
// const texture = textureLoader.load(textureImage);
// const material = new THREE.MeshBasicMaterial({ map: texture });
// const count = 30;
// const cube = new THREE.Mesh(geometry, material);
// // cube.position.x = i * 2 - 2; // Spread cubes
// scene.add(cube);
// // cubes.push(cube);
// // }

// const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
// scene.add(instancedMesh);

// for (let i = 0; i < count; i++) {
//   const matrix = new THREE.Matrix4();
//   matrix.setPosition(Math.random() * 10, Math.random() * 10, Math.random() * 10);
//   instancedMesh.setMatrixAt(i, matrix);
// }

// // Defining High and Low-Resolution Geometries
// const highGeometry = new THREE.SphereGeometry(1, 64, 64);
// // High detail
// const lowGeometry = new THREE.SphereGeometry(1, 16, 16); // Low detail

// // Create Meshes for Different LODs
// const highDetailMesh = new THREE.Mesh(highGeometry, material);

// const lowDetailMesh = new THREE.Mesh(lowGeometry, material);

// // Add

// // LOD Level of Detail
// const lod = new THREE.LOD();
// // const highDetail = new THREE.Mesh(highGeometry, material);
// // const lowDetail = new THREE.MeshToonMaterial(lowGeometry, material);
// lod.addLevel(highDetailMesh, 0); // Add high detail at close range

// lod.addLevel(lowDetailMesh, 50); // Add low detail at farther range
// scene.add(lod)


// // Creating a Cube
// // const geometry = new THREE.BoxGeometry();
// // const textureLoader = new THREE.TextureLoader();
// // const texture = textureLoader.load(textureImage);
// // const material = new THREE.MeshBasicMaterial({ map: texture });
// // const cube = new THREE.Mesh(geometry, material);
// // scene.add(cube);
camera.position.z = 10; // For the initial postion of camera when page first mounts
// renderer.frustumCulled = true;

// // Create GSAP Timeline

// // const tl = gsap.timeline({ repeat: -1, yoyo: true });
// // tl.to(cube.position, { x: 2, duration: 1 });
// // tl.to(cube.position, { y: 2, duration: 1 });
// // tl.to(cube.position, { z: Math.PI, duration: 1 });


// // Event Listener for Mouse Movement
// // document.addEventListener('mousemove', (event) => {
// //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
// //   mouse.y = -(event.clientY / window.innerHeight) * 2 - 1;


// //   // Cast Ray
// //   raycaster.setFromCamera(mouse, camera);
// //   const intersects = raycaster.intersectObjects(cubes);

// //   //   cubes.forEach((cube) => {
// //   //     cube.material.color.set(0x00ff00);
// //   //   });

// //   //   if (intersects.length > 0) {
// //   //     const hoveredCube = intersects[0].object;


// //   //     hoveredCube.material.color.set(0x00ff00);
// //   //   }
// // });
// // // Listen for Click Events
// // document.addEventListener('click', (event) => {
// //   // Normalize Mouse Position
// //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
// //   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;



// //   if (intersects.length > 0) {
// //     const clickedCube = intersects[0].object;
// //     gsap.to(clickedCube.scale, { x: 2, y: 2, z: 2, duration: 0.5, yoyo: true, repeat: 1 });
// //     clickedCube.material.color.set(Math.random() * 0xffffff); // Change color
// //   }
// // });


// // Render Loop
// function animate() {
//   requestAnimationFrame(animate);
//   lod.update(camera);
//   renderer.render(scene, camera);
// }
// animate();




// // GSAP Animation
// // gsap.to(cube.position, { x: 2, duration: 2, yoyo: true, repeat: -1 });

// // gsap.to(cube.rotation, { y: Math.PI * 2, duration: 4, repeat: -1 });


