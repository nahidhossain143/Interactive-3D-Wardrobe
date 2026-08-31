// scene.js
// Builds the THREE.Scene and a minimal room (floor + back wall + side
// wall) around the wardrobe so the rotating light's effect is easy to
// see on more than one surface. Kept deliberately simple so the
// wardrobe stays the visual focus.

import * as THREE from '../lib/three.module.js';
import { createLitMaterial } from './shaderMaterial.js';
import { createFloorTexture, createWallTexture } from './textures.js';

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

    return scene;
}
