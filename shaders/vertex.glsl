// ============================================================
// CUSTOM VERTEX SHADER
// CSE 4204 - Computer Graphics Lab | Interactive 3D Wardrobe
//
// Demonstrates: attributes, uniforms, varyings and the
// Model -> View -> Projection transformation pipeline.
// ============================================================

// Attributes: per-vertex data supplied automatically by Three.js
// from the BufferGeometry of whichever mesh is being drawn.
//   attribute vec3 position;  (object-space vertex position)
//   attribute vec3 normal;    (object-space vertex normal)
//   attribute vec2 uv;        (texture coordinate)
// These do not need to be re-declared; Three.js injects them
// automatically when compiling a ShaderMaterial.

// Uniforms: values that stay constant for every vertex in a
// single draw call. Three.js automatically supplies the standard
// transformation matrices below for every ShaderMaterial:
//   uniform mat4 modelMatrix;       -> Model transform  (local  -> world)
//   uniform mat4 viewMatrix;        -> View transform    (world  -> camera)
//   uniform mat4 modelViewMatrix;   -> viewMatrix * modelMatrix
//   uniform mat4 projectionMatrix;  -> Projection transform (camera -> clip / perspective)
//   uniform mat3 normalMatrix;      -> inverse-transpose of modelViewMatrix, for correct normals

// Varyings: interpolated per-fragment values handed from the
// vertex stage to the fragment stage across the triangle.
varying vec2 vUv;
varying vec3 vNormalWorld;
varying vec3 vPositionWorld;

void main() {
    // Forward the texture coordinate so the fragment shader can
    // sample the wardrobe / drawer texture.
    vUv = uv;

    // Transform the normal into world space (using the model matrix
    // only, since lighting is computed in world space in this project).
    vNormalWorld = normalize(mat3(modelMatrix) * normal);

    // Transform the vertex position into world space so the fragment
    // shader can compute the direction toward the rotating light.
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionWorld = worldPosition.xyz;

    // Standard Model -> View -> Projection pipeline:
    //   1. modelMatrix places the vertex in the 3D world (translation /
    //      rotation / scaling of the wardrobe, drawers, doors, room...)
    //   2. viewMatrix moves the world into camera space (handled inside
    //      modelViewMatrix, which Three.js precomputes as viewMatrix * modelMatrix)
    //   3. projectionMatrix applies the perspective projection so that
    //      distant objects appear smaller (depth perception).
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
