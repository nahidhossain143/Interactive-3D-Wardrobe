precision mediump float;

varying vec2 vUv;
varying vec3 vNormalWorld;
varying vec3 vPositionWorld;

uniform sampler2D uTexture;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uViewPosition;
uniform float uShininess;

uniform vec3 uFillLightPosition;
uniform vec3 uFillLightColor;

void main() {
    vec4 texColor = texture2D(uTexture, vUv);

    vec3 normal   = normalize(vNormalWorld);
    vec3 toLight  = uLightPosition - vPositionWorld;
    vec3 lightDir = normalize(toLight);
    vec3 viewDir  = normalize(uViewPosition - vPositionWorld);

    float lightDist = length(toLight);
    float attenuation = 1.0 / (1.0 + 0.01 * lightDist * lightDist);

    vec3 ambient = uAmbientColor;

    float diffuseStrength = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diffuseStrength * uLightColor * 0.85 * attenuation;

    vec3 halfDir = normalize(lightDir + viewDir);
    float specularStrength = pow(max(dot(normal, halfDir), 0.0), uShininess);
    vec3 specular = specularStrength * uLightColor * 0.36 * attenuation;

    vec3 fillDir = normalize(uFillLightPosition - vPositionWorld);
    float fillStrength = max(dot(normal, fillDir), 0.0);
    vec3 fill = fillStrength * uFillLightColor * 0.32;

    vec3 lighting = ambient + diffuse + specular + fill;
    lighting = max(lighting, vec3(0.24));

    vec3 finalColor = texColor.rgb * lighting;

    gl_FragColor = vec4(finalColor, texColor.a);
}
