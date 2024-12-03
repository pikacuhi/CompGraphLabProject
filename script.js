import * as THREE from './threejs/build/three.module.js'

let cam, scene, renderer;

function init(){
    scene = new THREE.Scene();

    cam = new THREE.PerspectiveCamera(75, window.innerWidth/ window.innerHeight, 0.1, 200);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement)

    cam.position.z = 7;
}

function rendering(){
    requestAnimationFrame(rendering);
    renderer.render(scene, cam);
}

window.onload = function(){
    init();
    rendering();
}