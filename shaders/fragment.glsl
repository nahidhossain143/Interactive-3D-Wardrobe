// ============================================================
// CUSTOM FRAGMENT SHADER
// CSE 4204 - Computer Graphics Lab | Interactive 3D Wardrobe
//
// Demonstrates: texture mapping (sampler2D + UV sampling) and a
// classic Ambient + Diffuse + Specular (Phong) lighting model
// driven by a light position uniform that changes every frame.
// ============================================================

precision mediump float;

// Varyings received from the vertex shader (interpolated per fragment)
varying vec2 vUv;
varying vec3 vNormalWorld;
varying vec3 vPositionWorld;

// Texture sampler used for texture mapping on every wardrobe surface
uniform sampler2D uTexture;

// Lighting uniforms. uLightPosition is updated once per frame in
// animation.js / lighting.js so the light continuously orbits the
// wardrobe, which visibly moves the highlight and shading.
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uViewPosition;   // camera position, needed for the specular term
uniform float uShininess;

void main() {
    // ---- Texture mapping: sample the surface color at this fragment's UV ----
    vec4 texColor = texture2D(uTexture, vUv);

    vec3 normal   = normalize(vNormalWorld);
    vec3 lightDir = normalize(uLightPosition - vPositionWorld);
    vec3 viewDir  = normalize(uViewPosition - vPositionWorld);

    // ---- Ambient term: constant base illumination ----
    vec3 ambient = uAmbientColor;

    // ---- Diffuse term (Lambertian reflectance) ----
    // Scaled down so the orbiting light shifts shading gently rather than
    // swinging the whole wardrobe between very bright and very dark -
    // a calmer, more stable look for a dark-themed presentation.
    float diffuseStrength = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diffuseStrength * uLightColor * 0.55;

    // ---- Specular term (Blinn-Phong highlight) ----
    vec3 halfDir = normalize(lightDir + viewDir);
    float specularStrength = pow(max(dot(normal, halfDir), 0.0), uShininess);
    vec3 specular = specularStrength * uLightColor * 0.22;

    // Combine lighting with the sampled texture color
    vec3 lighting = ambient + diffuse + specular;

    // Guarantee a minimum brightness floor so a surface angled away from
    // the orbiting light (e.g. the inside of an open door) never renders
    // as pure black - the wardrobe should stay clearly visible from any
    // camera/light angle.
    lighting = max(lighting, vec3(0.3));

    vec3 finalColor = texColor.rgb * lighting;

    gl_FragColor = vec4(finalColor, texColor.a);
}
