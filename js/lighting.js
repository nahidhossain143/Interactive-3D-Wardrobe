// lighting.js
// Owns the single rotating light source. Its position is written into
// the sharedUniforms.uLightPosition uniform every frame (see
// shaderMaterial.js), which every custom-shader material reads, so the
// illumination on the wardrobe, doors, drawers, floor and walls all
// change together as the light orbits. A small glowing marker sits at
// the light's position so the rotation is easy to see directly.

import * as THREE from '../lib/three.module.js';
import { sharedUniforms } from './shaderMaterial.js';

const ORBIT_RADIUS = 3.2;
const ORBIT_HEIGHT = 2.6;
const ROTATION_SPEED = 0.5; // radians per second

// Starts paused at a flattering fixed angle (front-right key light) so the
// scene reads as calm and stable by default. Press 'L' to set it rotating
// on demand - e.g. to demonstrate the continuously-orbiting light behavior
// during a lab evaluation - then 'L' again to freeze it in place.
let angle = 0.95;
let paused = true;
let indicatorSprite = null;

// A soft radial glow, used as the light marker's sprite texture.
function createGlowTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 226, 173, 1)');
    gradient.addColorStop(0.35, 'rgba(232, 189, 118, 0.85)');
    gradient.addColorStop(1, 'rgba(232, 189, 118, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
}

export function createLighting(scene) {
    // A Sprite with sizeAttenuation disabled keeps a constant on-screen
    // size no matter how close the orbiting light happens to pass to the
    // camera, avoiding the "giant glowing blob" a regular 3D sphere would
    // produce at close range - a small, stable marker at every distance.
    const material = new THREE.SpriteMaterial({
        map: createGlowTexture(),
        transparent: true,
        depthWrite: false,
        sizeAttenuation: false,
    });
    indicatorSprite = new THREE.Sprite(material);
    indicatorSprite.scale.set(0.045, 0.045, 1);
    scene.add(indicatorSprite);

    applyPosition();

    return {
        togglePause,
        isPaused: () => paused,
    };
}

function applyPosition() {
    // Simple circular orbit around the wardrobe:
    //   lightX = centerX + radius * cos(angle)
    //   lightZ = centerZ + radius * sin(angle)
    const x = ORBIT_RADIUS * Math.cos(angle);
    const z = ORBIT_RADIUS * Math.sin(angle);
    const y = ORBIT_HEIGHT;

    sharedUniforms.uLightPosition.value.set(x, y, z);
    if (indicatorSprite) indicatorSprite.position.set(x, y, z);
}

export function updateLighting(deltaTime) {
    if (!paused) {
        angle += ROTATION_SPEED * deltaTime;
    }
    applyPosition();
}

function togglePause() {
    paused = !paused;
    return paused;
}
