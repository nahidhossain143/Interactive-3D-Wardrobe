import * as THREE from '../lib/three.module.js';
import { createLitMaterial } from './shaderMaterial.js';
import { createFloorTexture, createWallTexture, createSolidTexture } from './textures.js';

export const ROOM_SIZE = 14;
export const ROOM_HEIGHT = 7.4;

export function createScene(shaderSource) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0c10);

    const floorTexture = createFloorTexture();
    floorTexture.repeat.set(5, 5);
    const wallTexture = createWallTexture();
    wallTexture.repeat.set(4, 3);
    const ceilingTexture = createWallTexture();
    ceilingTexture.repeat.set(4, 4);

    const floorMaterial = createLitMaterial(shaderSource, floorTexture, { shininess: 6 });
    const wallMaterial = createLitMaterial(shaderSource, wallTexture, { shininess: 4 });
    const ceilingMaterial = createLitMaterial(shaderSource, ceilingTexture, { shininess: 3 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE), ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, ROOM_HEIGHT, 0);
    scene.add(ceiling);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_HEIGHT), wallMaterial);
    backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_SIZE / 2);
    scene.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_HEIGHT), wallMaterial);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, ROOM_HEIGHT / 2, ROOM_SIZE / 2);
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_HEIGHT), wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-ROOM_SIZE / 2, ROOM_HEIGHT / 2, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_SIZE, ROOM_HEIGHT), wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(ROOM_SIZE / 2, ROOM_HEIGHT / 2, 0);
    scene.add(rightWall);

    const trimMaterial = createLitMaterial(shaderSource, createSolidTexture('#1d140c'), { shininess: 10 });
    const BASEBOARD_H = 0.18;
    const CROWN_H = 0.16;
    const TRIM_DEPTH = 0.06;
    const inset = TRIM_DEPTH / 2 + 0.005;

    [
        { y: BASEBOARD_H / 2, h: BASEBOARD_H },
        { y: ROOM_HEIGHT - CROWN_H / 2, h: CROWN_H },
    ].forEach(({ y, h }) => {
        scene.add(createTrimStrip({ x: 0, y, z: -ROOM_SIZE / 2 + inset, width: ROOM_SIZE, height: h, depth: TRIM_DEPTH, material: trimMaterial }));
        scene.add(createTrimStrip({ x: 0, y, z: ROOM_SIZE / 2 - inset, width: ROOM_SIZE, height: h, depth: TRIM_DEPTH, material: trimMaterial }));
        scene.add(createTrimStrip({ x: -ROOM_SIZE / 2 + inset, y, z: 0, width: TRIM_DEPTH, height: h, depth: ROOM_SIZE, material: trimMaterial }));
        scene.add(createTrimStrip({ x: ROOM_SIZE / 2 - inset, y, z: 0, width: TRIM_DEPTH, height: h, depth: ROOM_SIZE, material: trimMaterial }));
    });

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
    scene.add(
        createPictureFrame({
            x: ROOM_SIZE / 2 - 0.05, y: 2.5, z: 1.8, rotationY: -Math.PI / 2,
            width: 1.15, height: 0.85, frameMaterial, artMaterial: artMaterials[1],
        })
    );

    return scene;
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

function createTrimStrip({ x, y, z, width, height, depth, material }) {
    const strip = new THREE.Mesh(UNIT_BOX, material);
    strip.scale.set(width, height, depth);
    strip.position.set(x, y, z);
    return strip;
}

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
