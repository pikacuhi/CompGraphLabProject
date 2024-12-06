import * as THREE from './threejs/build/three.module.js';
import { OrbitControls } from './threejs/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './threejs/examples/jsm/loaders/GLTFLoader.js';

let scene, renderer, freeCamera, thirdPersonCamera, controls, sun, planets = [];
let spaceship, spotlight, raycaster, mouse, selectedObject, hoveredObject, textLabel;

// Data planet
const planetData = [
    { name: "Mercury", radius: 3.2, position: [58, 320, 0], texture: 'assets/textures/mercury.jpg' },
    { name: "Venus", radius: 4.8, position: [80, 320, 0], texture: 'assets/textures/venus.jpg' },
    { name: "Earth", radius: 4.8, position: [100, 320, 0], texture: 'assets/textures/earth.jpg' },
    { name: "Mars", radius: 4, position: [130, 320, 0], texture: 'assets/textures/mars.jpg' },
    { name: "Jupiter", radius: 13, position: [175, 320, 0], texture: 'assets/textures/jupiter.jpg' },
    { name: "Saturn", radius: 10, position: [240, 320, 0], texture: 'assets/textures/saturn.jpg' },
    { name: "Uranus", radius: 8, position: [280, 320, 0], texture: 'assets/textures/uranus.jpg' },
    { name: "Neptune", radius: 6, position: [320, 320, 0], texture: 'assets/textures/neptune.jpg' },
];

function init() {
    // Scene setup
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Camera setup
    freeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    freeCamera.position.set(0, 200, 800);
    controls = new OrbitControls(freeCamera, renderer.domElement);

    thirdPersonCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000);

    // Lighting setup
    const pointLight = new THREE.PointLight(0xFFFFFF, 1, 1500);
    pointLight.position.set(640, 320, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    spotlight = new THREE.SpotLight(0xFFFFFF, 1, 500);
    spotlight.castShadow = true;
    scene.add(spotlight);

    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // Skybox
    const loader = new THREE.CubeTextureLoader();
    const skybox = loader.load([
        'assets/skybox/right.png', 'assets/skybox/left.png',
        'assets/skybox/top.png', 'assets/skybox/bottom.png',
        'assets/skybox/front.png', 'assets/skybox/back.png',
    ]);
    scene.background = skybox;

    const textureLoader = new THREE.TextureLoader();

    // Sun
    const sunTexture = textureLoader.load('assets/textures/sun.jpg');
    const sunGeometry = new THREE.SphereGeometry(40, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(640, 320, 0);
    scene.add(sun);

    // Planets
    planetData.forEach(data => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: textureLoader.load(data.texture),
        });
        const planet = new THREE.Mesh(geometry, material);
        planet.position.set(...data.position);
        planet.castShadow = true;
        planet.receiveShadow = true;
        planet.name = data.name;
        planets.push(planet);
        scene.add(planet);

        // Rings
        if (data.name === "Saturn" || data.name === "Uranus") {
            const ringGeometry = new THREE.RingGeometry(
                data.name === "Saturn" ? 16 : 12,
                data.name === "Saturn" ? 32 : 20,
                64
            );
            const ringMaterial = new THREE.MeshStandardMaterial({
                map: textureLoader.load(
                    data.name === "Saturn" ? 'assets/textures/saturn_ring.png' : 'assets/textures/uranus_ring.png'
                ),
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.copy(planet.position);
            scene.add(ring);
        }
    });

    // Spaceship
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('assets/model/spaceship', (gltf) => {
        spaceship = gltf.scene;
        spaceship.position.set(100, 320, 50);
        spaceship.scale.set(10, 10, 10);
        spaceship.castShadow = true;
        spaceship.receiveShadow = true;
        scene.add(spaceship);

        spotlight.target = spaceship;
    });

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);

    // Text Label
    textLabel = document.createElement('div');
    textLabel.style.position = 'absolute';
    textLabel.style.color = 'white';
    textLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    textLabel.style.padding = '5px';
    textLabel.style.display = 'none';
    document.body.appendChild(textLabel);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick() {
    if (hoveredObject) {
        hoveredObject.rotationSpeed = 0.5; // Percepat rotasi
        setTimeout(() => {
            hoveredObject.rotationSpeed = 0.01; // Kembali ke normal
        }, 2000);
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Update Raycaster
    raycaster.setFromCamera(mouse, freeCamera);
    const intersects = raycaster.intersectObjects(planets);
    if (intersects.length > 0) {
        hoveredObject = intersects[0].object;
        hoveredObject.material.color.set(Math.random() * 0xFFFFFF); // Ubah warna
        textLabel.innerText = hoveredObject.name;
        textLabel.style.left = `${mouse.x * window.innerWidth}px`;
        textLabel.style.top = `${-mouse.y * window.innerHeight}px`;
        textLabel.style.display = 'block';
    } else {
        hoveredObject = null;
        textLabel.style.display = 'none';
    }

    controls.update();
    renderer.render(scene, freeCamera);
}

window.onload = function () {
    init();
    animate();
};
