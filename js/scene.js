// scene.js
// Builds the THREE.Scene and a minimal room (floor + back wall + side
// wall) around the wardrobe so the rotating light's effect is easy to
// see on more than one surface. Kept deliberately simple so the
// wardrobe stays the visual focus.

import * as THREE from '../lib/three.module.js';
import { createLitMaterial } from './shaderMaterial.js';
import { createFloorTexture, createWallTexture, createSolidTexture } from './textures.js';

const ROOM_SIZE = 14;
const ROOM_HEIGHT = 5;

export function createScene(shaderSource) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0c10);

    const floorTexture = createFloorTexture();
    floorTexture.repeat.set(5, 5);
    const wallTexture = createWallTexture();
    wallTexture.repeat.set(4, 2);

    const floorMaterial = createLitMaterial(shaderSource, floorTexture, { shininess: 6 });
    const wallMaterial = createLitMaterial(shaderSource, wallTexture, { shininess: 4 });

    // Floor: a plane rotated flat (Rotation transformation) to lie on the XZ plane
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_HEIGHT), wallMaterial);
    backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_SIZE / 2);
    scene.add(backWall);

    // Side wall, also placed using a Rotation transformation
    const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_HEIGHT), wallMaterial);
    sideWall.rotation.y = Math.PI / 2;
    sideWall.position.set(-ROOM_SIZE / 2, ROOM_HEIGHT / 2, 0);
    scene.add(sideWall);

    // ---------------- Wall art: simple framed pictures ----------------
    // Each frame is a thin wooden border box with a smaller, brightly
    // colored "canvas" box set slightly in front of it - built from the
    // same primitive + custom-shader pipeline as everything else, giving
    // the room a furnished, gallery-like feel around the wardrobe.
    const frameMaterial = createLitMaterial(shaderSource, createSolidTexture('#3c2a1b'), { shininess: 8 });
    const artMaterials = [
        createLitMaterial(shaderSource, createSolidTexture('#2f5d62'), { shininess: 4 }),
        createLitMaterial(shaderSource, createSolidTexture('#8a4a32'), { shininess: 4 }),
        createLitMaterial(shaderSource, createSolidTexture('#5c6b4a'), { shininess: 4 }),
    ];

    scene.add(
        createPictureFrame({
            x: -3.1, y: 2.7, z: -ROOM_SIZE / 2 + 0.05,
            width: 1.05, height: 1.4, frameMaterial, artMaterial: artMaterials[0],
        })
    );
    scene.add(
        createPictureFrame({
            x: 3.1, y: 2.7, z: -ROOM_SIZE / 2 + 0.05,
            width: 1.05, height: 1.4, frameMaterial, artMaterial: artMaterials[1],
        })
    );
    scene.add(
        createPictureFrame({
            x: -ROOM_SIZE / 2 + 0.05, y: 2.5, z: 1.8, rotationY: Math.PI / 2,
            width: 1.15, height: 0.85, frameMaterial, artMaterial: artMaterials[2],
        })
    );

    return scene;
}

// A wall-mounted picture frame: a wooden border box with a smaller,
// colored "canvas" box set slightly in front of it (Translation +
// Scaling of primitives, same construction style as the wardrobe).
function createPictureFrame({ x, y, z, rotationY = 0, width, height, frameMaterial, artMaterial }) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    const border = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.05), frameMaterial);
    group.add(border);

    const art = new THREE.Mesh(new THREE.BoxGeometry(width - 0.16, height - 0.16, 0.02), artMaterial);
    art.position.z = 0.035;
    group.add(art);

    return group;
}
