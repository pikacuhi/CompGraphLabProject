import * as THREE from './threejs/build/three.module.js';
import { OrbitControls } from './threejs/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './threejs/examples/jsm/loaders/GLTFLoader.js';

let scene, renderer, freeCamera, thirdPersonCamera, controls, sun, planets = [];
let spaceship, spotlight, raycaster, mouse, selectedObject, hoveredObject, textLabel, onFreeCamera;

// Data planet
const planetData = [
    { name: "Mercury", radius: 3.2, texture: 'assets/textures/mercury.jpg', spinRadius : 320, rotateSpeed: 0.2 },
    { name: "Venus", radius: 4.8, texture: 'assets/textures/venus.jpg', spinRadius : 360, rotateSpeed: 0.15  },
    { name: "Earth", radius: 4.8, texture: 'assets/textures/earth.jpg', spinRadius : 400, rotateSpeed: 0.10 },
    { name: "Mars", radius: 4, texture: 'assets/textures/mars.jpg', spinRadius : 465, rotateSpeed: 0.05 },
    { name: "Jupiter", radius: 13, texture: 'assets/textures/jupiter.jpg', spinRadius : 510, rotateSpeed: 0.025  },
    { name: "Saturn", radius: 10,  texture: 'assets/textures/saturn.jpg', spinRadius : 560, rotateSpeed: 0.015  },
    { name: "Uranus", radius: 8,  texture: 'assets/textures/uranus.jpg', spinRadius : 615, rotateSpeed: 0.005  },
    { name: "Neptune", radius: 6,  texture: 'assets/textures/neptune.jpg', spinRadius : 655, rotateSpeed: 0.001  },
];

let pivots = [];

function init() {
    // Scene setup
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Camera setup
    freeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    freeCamera.position.set(640, 480, 240);
    freeCamera.lookAt(640, 320, 0);
    controls = new OrbitControls(freeCamera, renderer.domElement);

    thirdPersonCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000);

    // Lighting setup
    const pointLight = new THREE.PointLight(0xFFFFFF, 1, 1500);
    pointLight.position.set(640, 320, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    spotlight = new THREE.SpotLight(0xFFFFFF, 1, 500);
    spotlight.position.set(400, (320 + 6), 0);//hjrsny ambil value dari space ship(x, y+6, 0)
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
    sun.name = 'Sun'
    sun.position.set(640, 320, 0);
    scene.add(sun);

    for (let i = 0; i < 8; i++){
        const obj = new THREE.Object3D();
        obj.position.set(640,320,0);
        scene.add(obj);
        pivots.push(obj);
    }

    let index = 0;

    // Planets
    planetData.forEach(data => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: textureLoader.load(data.texture),
        });
        const planet = new THREE.Mesh(geometry, material);
        planet.position.x = -data.spinRadius;
        planet.castShadow = true;
        planet.receiveShadow = true;
        planet.name = data.name;
        planets.push(planet);
        pivots[index].add(planet);
        index++;

        // Rings
        if (data.name == "Saturn") {
            const ringGeometry = new THREE.RingGeometry(
                16,
                32,
                64
            );
            const ringMaterial = new THREE.MeshStandardMaterial({
                map: textureLoader.load(
                    'assets/textures/saturn_ring.png'
                ),
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }else if (data.name == "Uranus"){
            const ringGeometry = new THREE.RingGeometry(
                16,
                20,
                64
            );
            const ringMaterial = new THREE.MeshStandardMaterial({
                map: textureLoader.load(
                    'assets/textures/uranus_ring.png'
                ),
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            
            planet.add(ring);
        }
    });

    const gltfLoader = new GLTFLoader();
    gltfLoader.load("./assets/model/spaceship/scene.gltf", function(gltf) {
        spaceship = gltf.scene;
        spaceship.position.set(100, 320, 50);
        spaceship.scale.set(10, 10, 10);
        spaceship.castShadow = true;
        spaceship.receiveShadow = true;
        scene.add(spaceship);

        spotlight.target = spaceship;
    });

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);

    textLabel = document.createElement('div');
    textLabel.style.position = 'absolute';
    textLabel.style.color = 'yellow';
    textLabel.style.fontSize = '20px';
    textLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    textLabel.style.padding = '5px';
    textLabel.style.display = 'none';
    document.body.appendChild(textLabel);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

let revolveMultiplier = 1;

function onMouseClick() {

    
    if (hoveredObject) {
        let idx = planets.findIndex(obj => obj.name == hoveredObject.name.trim());
        let orgRotate = planetData[idx].rotateSpeed;
        planetData[idx].rotateSpeed += 0.15;
        setTimeout(() => {
            planetData[idx].rotateSpeed = orgRotate; 
        }, 2000);
    }
}

const speed = 2; 
const smoothness = 0.1; 
let velocity = new THREE.Vector3(0, 0, 0); 
const targetVelocity = new THREE.Vector3(0, 0, 0); 

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (e) => {
    if (e.key == 'w') keys.w = true;
    if (e.key == 'a') keys.a = true;
    if (e.key == 's') keys.s = true;
    if (e.key == 'd') keys.d = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key == 'w') keys.w = false;
    if (e.key == 'a') keys.a = false;
    if (e.key == 's') keys.s = false;
    if (e.key == 'd') keys.d = false;
});

let x = false;

const colorsList = ['#00FFFF', '#00FF00', '#FFCC00', '#E6E6FA', '#FF69B4', '#EE82EE',
            '#FF8C00', '#FFB6C1', '#00FFFF', '#87CEEB', '#A8FFB2', '#ADD8E6'
];

function worldToScreen(worldPosition) {
    const vector = worldPosition.clone();
    vector.project(freeCamera);

    // Convert from normalized device coordinates (NDC) to screen space (pixels)
    const x = (vector.x + 1) / 2 * window.innerWidth;
    const y = ( -vector.y + 1) / 2 * window.innerHeight;

    return { x, y };
}


let time = 0.01;
function animate() {
    requestAnimationFrame(animate);

    // Update Raycaster
    raycaster.setFromCamera(mouse, freeCamera);
    const intersects = raycaster.intersectObjects(planets);
    if (intersects.length > 0 && x == false) {
        x = true;
        let isPlanet = planets.findIndex(obj => obj.name == intersects[0].object.name.trim());

        if (isPlanet != null){
            hoveredObject = intersects[0].object;
            hoveredObject.material.color.set(colorsList[Math.floor(Math.random() * colorsList.length)]); // Ubah warna
            textLabel.innerText = hoveredObject.name;
            let pos = worldToScreen(hoveredObject.position);
            textLabel.style.color = hoveredObject.material.color;
            textLabel.style.backgroundColor = 'transparent';
            textLabel.style.left = `${pos.x}px`;
            textLabel.style.top = `${pos.y}px`;
            textLabel.style.display = 'block';
        }

    } else if (intersects.length <= 0 && x){
        x = false;
        hoveredObject.material.color.set(0xFFFFFF);
        hoveredObject = null;
        textLabel.style.display = 'none';
    }

    controls.zoomSpeed = 0.5;
    controls.speed = 0.1;
    controls.update();


    for (let i = 0; i < planets.length; i++){
        
        if (i % 2 == 0){
            pivots[i].rotation.y += time * planetData[i].rotateSpeed * revolveMultiplier;
        }else{
            pivots[i].rotation.y -= time * planetData[i].rotateSpeed * revolveMultiplier;
        }
        
    }

    //Mungkin kodingan ini bisa dipake buat spaceship

    // const up = new THREE.Vector3();
    // freeCamera.getWorldDirection(up);
    // up.normalize();


    // const right = new THREE.Vector3(1, 0, 0).normalize();
    // //right.crossVectors(up, new THREE.Vector3(0, 1, 0)).normalize(); // Perpendicular to forward

    // // Update target velocity based on keys
    // targetVelocity.set(0, 0, 0);
    // if (keys.w) targetVelocity.add(up.clone().multiplyScalar(speed)); // Move forward
    // if (keys.s) targetVelocity.add(up.clone().multiplyScalar(-speed)); // Move backward
    // if (keys.a) targetVelocity.add(right.clone().multiplyScalar(-speed)); // Move left
    // if (keys.d) targetVelocity.add(right.clone().multiplyScalar(speed)); // Move right

    // // Smooth interpolation for velocity to avoid "snappy" movement
    // velocity.lerp(targetVelocity, smoothness);

    // // Update camera position
    // freeCamera.position.add(velocity);



    renderer.render(scene, freeCamera);
}

window.onload = function () {
    init();
    animate();
};
