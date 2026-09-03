// shaderMaterial.js
// Loads the external GLSL source files and builds THREE.ShaderMaterial
// instances that use them. Every lit object in the scene (wardrobe body,
// drawers, doors, floor, walls) shares the SAME uniform objects for the
// light position, light color, ambient color and camera position, so
// updating them once per frame (see animation.js / lighting.js) updates
// the lighting on the entire scene at once.

import * as THREE from '../lib/three.module.js';

// Shared uniforms: the ".value" of each of these is mutated in place
// every frame instead of being replaced, which is why every material
// that references the same object automatically stays in sync.
export const sharedUniforms = {
    uLightPosition: { value: new THREE.Vector3(3, 3, 3) },
    uLightColor: { value: new THREE.Color(0xfff4d6) },
    uAmbientColor: { value: new THREE.Color(0x726c80) },
    uViewPosition: { value: new THREE.Vector3() },
};

// Fetches the vertex/fragment GLSL text. Requires the project to be
// served over http(s) (a local dev server) since fetch() of local
// files is blocked by the browser under the file:// protocol.
export async function loadShaderSource() {
    const [vertexShader, fragmentShader] = await Promise.all([
        fetch('./shaders/vertex.glsl').then((res) => res.text()),
        fetch('./shaders/fragment.glsl').then((res) => res.text()),
    ]);
    return { vertexShader, fragmentShader };
}

// Builds a ShaderMaterial that uses our custom vertex/fragment shaders
// with a given texture (texture mapping) and an optional shininess
// value for the specular highlight.
export function createLitMaterial(shaderSource, texture, options = {}) {
    return new THREE.ShaderMaterial({
        vertexShader: shaderSource.vertexShader,
        fragmentShader: shaderSource.fragmentShader,
        uniforms: {
            uTexture: { value: texture },
            uLightPosition: sharedUniforms.uLightPosition,
            uLightColor: sharedUniforms.uLightColor,
            uAmbientColor: sharedUniforms.uAmbientColor,
            uViewPosition: sharedUniforms.uViewPosition,
            uShininess: { value: options.shininess ?? 24 },
        },
    });
}
