import * as THREE from '../lib/three.module.js';
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { buildWardrobe } from './wardrobe.js';
import { createLighting } from './lighting.js';
import { setupInteraction } from './interaction.js';
import { startAnimationLoop } from './animation.js';
import { loadShaderSource } from './shaderMaterial.js';

async function init() {
    const canvas = document.getElementById('webgl-canvas');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const shaderSource = await loadShaderSource();

    const scene = createScene(shaderSource);
    const camera = createCamera(window.innerWidth / window.innerHeight);

    const wardrobe = buildWardrobe(shaderSource);
    scene.add(wardrobe.group);

    const lighting = createLighting(scene, shaderSource);

    setupInteraction(canvas, camera, wardrobe, lighting);
    setupControlsDropdown();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.getElementById('loading-message')?.remove();

    startAnimationLoop({ renderer, scene, camera, wardrobe });
}

function setupControlsDropdown() {
    const toggle = document.getElementById('controls-toggle');
    const body = document.getElementById('controls-body');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
        const expanded = body.classList.toggle('expanded');
        toggle.setAttribute('aria-expanded', String(expanded));
    });
}

init().catch((error) => {
    console.error('Failed to start Interactive 3D Wardrobe:', error);
    const el = document.getElementById('loading-message');
    if (el) {
        el.textContent =
            'Failed to load. This project must be served over http(s) (a local dev server), ' +
            'not opened directly as a file:// URL, because it fetches the .glsl shader files.';
        el.classList.add('error');
    }
});
