// textures.js
// Generates all surface textures procedurally on an HTML5 canvas and
// wraps each one in a THREE.CanvasTexture. This keeps the project fully
// self-contained (no external image downloads needed for the wardrobe
// body, drawers, doors, floor and walls) while still exercising real
// texture mapping: every mesh gets UV coordinates and the fragment
// shader samples this texture with texture2D(uTexture, vUv).

import * as THREE from '../lib/three.module.js';

function makeCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

// Lightens (positive amount) or darkens (negative amount) a hex color.
function shade(hexColor, amount) {
    const color = new THREE.Color(hexColor);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    hsl.l = Math.min(1, Math.max(0, hsl.l + amount / 100));
    color.setHSL(hsl.h, hsl.s, hsl.l);
    return '#' + color.getHexString();
}

// Wood-plank texture used for the wardrobe body, doors and drawer fronts.
export function createWoodTexture(baseColor, grainColor, options = {}) {
    const width = options.width || 512;
    const height = options.height || 512;
    const plankCount = options.planks || 6;

    const canvas = makeCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    const plankWidth = width / plankCount;
    for (let p = 0; p < plankCount; p++) {
        const x0 = p * plankWidth;

        ctx.fillStyle = p % 2 === 0 ? shade(baseColor, 7) : shade(baseColor, -7);
        ctx.fillRect(x0, 0, plankWidth, height);

        // seam between planks
        ctx.strokeStyle = shade(baseColor, -38);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, height);
        ctx.stroke();

        // wavy grain lines
        ctx.strokeStyle = grainColor;
        ctx.globalAlpha = 0.38;
        const grainLines = 9;
        for (let g = 0; g < grainLines; g++) {
            const y = (g + 0.5) * (height / grainLines) + (Math.random() - 0.5) * 6;
            ctx.lineWidth = 1 + Math.random() * 1.5;
            ctx.beginPath();
            ctx.moveTo(x0, y);
            for (let x = x0; x <= x0 + plankWidth; x += 8) {
                const yy = y + Math.sin((x + p * 47) * 0.05) * 3;
                ctx.lineTo(x, yy);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Flat solid-color texture, used for small trim parts like handles so
// every mesh in the scene (even simple ones) goes through the same
// texture-mapped shader pipeline.
export function createSolidTexture(color) {
    const canvas = makeCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

// Checkerboard tile texture for the room floor.
export function createFloorTexture() {
    const size = 512;
    const canvas = makeCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const tiles = 8;
    const tileSize = size / tiles;
    for (let r = 0; r < tiles; r++) {
        for (let c = 0; c < tiles; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#32343c' : '#282a31';
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= tiles; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(size, i * tileSize);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Softly speckled plaster-like texture for the back/side walls.
export function createWallTexture() {
    const size = 512;
    const canvas = makeCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2b2d33';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 2500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.045)';
        ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}
