// interaction.js
// Captures raw keyboard and mouse input. Camera orbit/zoom input is
// accumulated into `inputState` and consumed each frame by camera.js.
// Discrete actions (drawer/door toggling, light pause) are dispatched
// immediately on keydown / click.

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
    // ---------------- Keyboard ----------------
    window.addEventListener('keydown', (event) => {
        inputState.keys[event.code] = true;
        handleActionKey(event.code, wardrobe, lighting);
    });

    window.addEventListener('keyup', (event) => {
        inputState.keys[event.code] = false;
    });

    // ---------------- Mouse: drag to orbit ----------------
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
        // A click (as opposed to a drag) tries to toggle a drawer under the cursor.
        if (isDragging && dragDistance < 5) {
            handleDrawerClick(event, canvas, camera, wardrobe);
        }
        isDragging = false;
    });

    // ---------------- Mouse: wheel to zoom ----------------
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

function handleDrawerClick(event, canvas, camera, wardrobe) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(wardrobe.drawerHitboxes, false);
    if (hits.length > 0) {
        const index = hits[0].object.userData.drawerIndex;
        wardrobe.toggleDrawer(index);
    }
}
