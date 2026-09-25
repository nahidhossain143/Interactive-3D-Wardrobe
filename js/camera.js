import * as THREE from '../lib/three.module.js';

const target = new THREE.Vector3(0, 1.0, 0);

let azimuth = Math.PI / 4;
let polar = Math.PI / 2.6;
let radius = 4.5;

const MIN_POLAR = 0.35;
const MAX_POLAR = Math.PI / 2 - 0.03;
const MIN_RADIUS = 2.2;
const MAX_RADIUS = 6.5;

const DEFAULT_STATE = { azimuth, polar, radius };

export function createCamera(aspect) {
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    applyCameraPosition(camera);
    return camera;
}

function applyCameraPosition(camera) {
    const x = target.x + radius * Math.sin(polar) * Math.sin(azimuth);
    const y = target.y + radius * Math.cos(polar);
    const z = target.z + radius * Math.sin(polar) * Math.cos(azimuth);
    camera.position.set(x, y, z);
    camera.lookAt(target);
}

function orbit(deltaAzimuth, deltaPolar) {
    azimuth += deltaAzimuth;
    polar = Math.min(MAX_POLAR, Math.max(MIN_POLAR, polar + deltaPolar));
}

function zoom(deltaRadius) {
    radius = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, radius + deltaRadius));
}

export function resetCamera() {
    azimuth = DEFAULT_STATE.azimuth;
    polar = DEFAULT_STATE.polar;
    radius = DEFAULT_STATE.radius;
}

export function updateCamera(camera, inputState, deltaTime) {
    if (inputState.mouseDeltaX !== 0 || inputState.mouseDeltaY !== 0) {
        orbit(-inputState.mouseDeltaX * 0.006, -inputState.mouseDeltaY * 0.006);
        inputState.mouseDeltaX = 0;
        inputState.mouseDeltaY = 0;
    }

    if (inputState.wheelDelta !== 0) {
        zoom(inputState.wheelDelta * 0.0018 * radius);
        inputState.wheelDelta = 0;
    }

    const rotSpeed = 1.3 * deltaTime;
    const zoomSpeed = 3.2 * deltaTime;
    const keys = inputState.keys;

    if (keys['ArrowLeft']) orbit(-rotSpeed, 0);
    if (keys['ArrowRight']) orbit(rotSpeed, 0);
    if (keys['ArrowUp']) orbit(0, -rotSpeed);
    if (keys['ArrowDown']) orbit(0, rotSpeed);
    if (keys['Equal'] || keys['NumpadAdd']) zoom(-zoomSpeed);
    if (keys['Minus'] || keys['NumpadSubtract']) zoom(zoomSpeed);
    if (keys['KeyR']) resetCamera();

    applyCameraPosition(camera);
}
