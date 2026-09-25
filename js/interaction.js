import * as THREE from '../lib/three.module.js';
import { resetCamera } from './camera.js';

export const inputState = {
    keys: {},
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    wheelDelta: 0,
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let isDragging = false;
let dragDistance = 0;
let lastX = 0;
let lastY = 0;

export function setupInteraction(canvas, camera, wardrobe, lighting) {
    window.addEventListener('keydown', (event) => {
        inputState.keys[event.code] = true;
        handleActionKey(event.code, wardrobe, lighting);
    });

    window.addEventListener('keyup', (event) => {
        inputState.keys[event.code] = false;
    });

    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        dragDistance = 0;
        lastX = event.clientX;
        lastY = event.clientY;
    });

    window.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        inputState.mouseDeltaX += dx;
        inputState.mouseDeltaY += dy;
        dragDistance += Math.abs(dx) + Math.abs(dy);
        lastX = event.clientX;
        lastY = event.clientY;
    });

    window.addEventListener('mouseup', (event) => {
        if (isDragging && dragDistance < 5) {
            handleWardrobeClick(event, canvas, camera, wardrobe);
        }
        isDragging = false;
    });

    canvas.addEventListener(
        'wheel',
        (event) => {
            event.preventDefault();
            inputState.wheelDelta += event.deltaY;
        },
        { passive: false }
    );
}

function handleActionKey(code, wardrobe, lighting) {
    switch (code) {
        case 'Digit1':
            wardrobe.toggleDrawer(0);
            break;
        case 'Digit2':
            wardrobe.toggleDrawer(1);
            break;
        case 'Digit3':
            wardrobe.toggleDrawer(2);
            break;
        case 'KeyO':
            wardrobe.openAllDrawers();
            break;
        case 'KeyC':
            wardrobe.closeAllDrawers();
            break;
        case 'KeyD':
            wardrobe.toggleDoors();
            break;
        case 'KeyL': {
            const nowPaused = lighting.togglePause();
            const statusEl = document.getElementById('light-status');
            const dotEl = document.getElementById('light-dot');
            if (statusEl) statusEl.textContent = nowPaused ? 'Light static' : 'Light rotating';
            if (dotEl) dotEl.classList.toggle('paused', nowPaused);
            break;
        }
        case 'KeyR':
            resetCamera();
            break;
        default:
            break;
    }
}

function handleWardrobeClick(event, canvas, camera, wardrobe) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const targets = [...wardrobe.drawerHitboxes, ...wardrobe.doorHitboxes];
    const hits = raycaster.intersectObjects(targets, false);
    if (hits.length === 0) return;

    const hit = hits[0].object;
    if (hit.userData.drawerIndex !== undefined) {
        wardrobe.toggleDrawer(hit.userData.drawerIndex);
    } else if (hit.userData.isDoor) {
        wardrobe.toggleDoors();
    }
}
