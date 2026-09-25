import * as THREE from '../lib/three.module.js';
import { sharedUniforms, createLitMaterial } from './shaderMaterial.js';
import { createSolidTexture } from './textures.js';
import { ROOM_SIZE } from './scene.js';

const STRIP_HEIGHT = 4.6;
const STRIP_INSET = 0.08;
const STRIP_HALF_SIZE = ROOM_SIZE / 2 - STRIP_INSET;
const STRIP_SIDE_LENGTH = STRIP_HALF_SIZE * 2;
const STRIP_PERIMETER = STRIP_SIDE_LENGTH * 4;
const ROTATION_SPEED = 0.5;

let angle = 0.95;
let paused = false;
let hotSegment = null;

function createHotSegmentTexture() {
    const width = 256;
    const height = 64;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.translate(width / 2, height / 2);
    ctx.scale(width / height, 1);

    const radius = height / 2;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(255, 252, 240, 1)');
    gradient.addColorStop(0.35, 'rgba(255, 240, 200, 0.95)');
    gradient.addColorStop(0.7, 'rgba(255, 218, 155, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 214, 150, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

    return new THREE.CanvasTexture(canvas);
}

function createLedStripTexture(repeatCount) {
    const width = 64;
    const height = 16;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1510';
    ctx.fillRect(0, 0, width, height);

    const ledCount = 3;
    for (let i = 0; i < ledCount; i++) {
        const cx = (i + 0.5) * (width / ledCount);
        const r = width / ledCount / 2;
        const gradient = ctx.createRadialGradient(cx, height / 2, 0, cx, height / 2, r);
        gradient.addColorStop(0, 'rgba(255, 224, 180, 0.45)');
        gradient.addColorStop(0.55, 'rgba(255, 200, 140, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 200, 140, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - r, 0, r * 2, height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatCount, 1);
    return texture;
}

export function createLighting(scene, shaderSource) {
    buildPerimeterStrip(scene, shaderSource);

    hotSegment = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 0.16),
        new THREE.MeshBasicMaterial({
            map: createHotSegmentTexture(),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
    scene.add(hotSegment);

    applyPosition();

    return {
        togglePause,
        isPaused: () => paused,
    };
}

function buildPerimeterStrip(scene, shaderSource) {
    const housingMaterial = createLitMaterial(shaderSource, createSolidTexture('#131316'), { shininess: 25 });
    const repeatCount = Math.max(1, Math.round(STRIP_SIDE_LENGTH / 0.5));
    const ledMaterial = new THREE.MeshBasicMaterial({ map: createLedStripTexture(repeatCount) });

    const sides = [
        { x: 0, z: -STRIP_HALF_SIZE, rotationY: 0 }, // back
        { x: STRIP_HALF_SIZE, z: 0, rotationY: -Math.PI / 2 }, // right
        { x: 0, z: STRIP_HALF_SIZE, rotationY: Math.PI }, // front
        { x: -STRIP_HALF_SIZE, z: 0, rotationY: Math.PI / 2 }, // left
    ];

    sides.forEach(({ x, z, rotationY }) => {
        const group = new THREE.Group();
        group.position.set(x, STRIP_HEIGHT, z);
        group.rotation.y = rotationY;

        const housing = new THREE.Mesh(new THREE.BoxGeometry(STRIP_SIDE_LENGTH, 0.05, 0.05), housingMaterial);
        group.add(housing);

        const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(STRIP_SIDE_LENGTH, 0.2),
            new THREE.MeshBasicMaterial({
                color: 0xffcf8a,
                transparent: true,
                opacity: 0.12,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        glow.position.z = 0.03;
        group.add(glow);

        const led = new THREE.Mesh(new THREE.PlaneGeometry(STRIP_SIDE_LENGTH, 0.05), ledMaterial);
        led.position.z = 0.032;
        group.add(led);

        scene.add(group);
    });
}

function perimeterPoint(t) {
    let d = t * STRIP_PERIMETER;

    if (d < STRIP_SIDE_LENGTH) {
        return { x: -STRIP_HALF_SIZE + d, z: -STRIP_HALF_SIZE, rotationY: 0 };
    }
    d -= STRIP_SIDE_LENGTH;

    if (d < STRIP_SIDE_LENGTH) {
        return { x: STRIP_HALF_SIZE, z: -STRIP_HALF_SIZE + d, rotationY: -Math.PI / 2 };
    }
    d -= STRIP_SIDE_LENGTH;

    if (d < STRIP_SIDE_LENGTH) {
        return { x: STRIP_HALF_SIZE - d, z: STRIP_HALF_SIZE, rotationY: Math.PI };
    }
    d -= STRIP_SIDE_LENGTH;

    return { x: -STRIP_HALF_SIZE, z: STRIP_HALF_SIZE - d, rotationY: Math.PI / 2 };
}

function applyPosition() {
    const t = angle / (Math.PI * 2);
    const { x, z, rotationY } = perimeterPoint(t);
    const y = STRIP_HEIGHT;

    sharedUniforms.uLightPosition.value.set(x, y, z);

    if (hotSegment) {
        const offset = 0.04;
        hotSegment.position.set(x + Math.sin(rotationY) * offset, y, z + Math.cos(rotationY) * offset);
        hotSegment.rotation.y = rotationY;
    }
}

export function updateLighting(deltaTime) {
    if (!paused) {
        angle = (angle + ROTATION_SPEED * deltaTime) % (Math.PI * 2);
    }
    applyPosition();
}

function togglePause() {
    paused = !paused;
    return paused;
}
