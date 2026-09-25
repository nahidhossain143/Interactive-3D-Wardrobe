import * as THREE from '../lib/three.module.js';

export const sharedUniforms = {
    uLightPosition: { value: new THREE.Vector3(3, 3, 3) },
    uLightColor: { value: new THREE.Color(0xfff4d6) },
    uAmbientColor: { value: new THREE.Color(0x726c80) },
    uViewPosition: { value: new THREE.Vector3() },
    uFillLightPosition: { value: new THREE.Vector3(-3.6, 3.2, -2.6) },
    uFillLightColor: { value: new THREE.Color(0x54628a) },
};

export async function loadShaderSource() {
    const [vertexShader, fragmentShader] = await Promise.all([
        fetch('./shaders/vertex.glsl').then((res) => res.text()),
        fetch('./shaders/fragment.glsl').then((res) => res.text()),
    ]);
    return { vertexShader, fragmentShader };
}

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
            uFillLightPosition: sharedUniforms.uFillLightPosition,
            uFillLightColor: sharedUniforms.uFillLightColor,
            uShininess: { value: options.shininess ?? 24 },
        },
    });
}
