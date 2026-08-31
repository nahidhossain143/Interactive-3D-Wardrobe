// animation.js
// The single requestAnimationFrame loop that ties everything together
// each frame: reads input to move the camera, advances the rotating
// light, smoothly animates drawers/doors toward their targets, and
// renders the scene.

import * as THREE from '../lib/three.module.js';
import { updateCamera } from './camera.js';
import { updateLighting } from './lighting.js';
import { sharedUniforms } from './shaderMaterial.js';
import { inputState } from './interaction.js';

const clock = new THREE.Clock();

export function startAnimationLoop({ renderer, scene, camera, wardrobe }) {
    function frame() {
        // Clamp deltaTime so a dropped/backgrounded frame can't cause a huge jump.
        const deltaTime = Math.min(clock.getDelta(), 0.05);

        updateCamera(camera, inputState, deltaTime);
        sharedUniforms.uViewPosition.value.copy(camera.position);

        updateLighting(deltaTime);
        wardrobe.update(deltaTime);

        renderer.render(scene, camera);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}
