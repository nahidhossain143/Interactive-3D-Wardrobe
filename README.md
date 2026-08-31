# Interactive 3D Wardrobe

A real-time interactive 3D scene built for the **CSE 4204 — Computer
Graphics Lab** course. The project renders a wooden wardrobe — with hinged
doors, three sliding drawers, and clothes/shoes stored inside — using
**Three.js**, **WebGL**, and a hand-written **GLSL vertex/fragment shader
pair**, driven entirely by mouse and keyboard input.

## 1. Objective

To design and implement an interactive 3D graphics application that
demonstrates the core concepts covered in the Computer Graphics Lab
syllabus — the WebGL/GLSL pipeline, custom shaders, 3D transformations,
camera and perspective projection, texture mapping, lighting, and
animation — using a single cohesive, explainable scene rather than a set
of disconnected demos.

## 2. Tools & Technologies

| Tool | Purpose |
|---|---|
| **HTML5 / CSS3** | Page structure and the on-screen UI overlay |
| **JavaScript (ES Modules)** | Application logic, no build step or bundler |
| **Three.js** (r160, local copy) | Scene graph, geometry, camera, renderer |
| **WebGL** | GPU rendering, accessed through Three.js's `WebGLRenderer` |
| **GLSL** | Custom vertex and fragment shaders |
| **HTML5 Canvas 2D API** | Procedurally generating all textures at runtime |

No physics engine, post-processing library, or PBR material system is
used — everything on screen is built from primitive geometry and the
custom shader described below, matching the scope of the course.

## 3. Features Implemented

- Wardrobe body built from primitive `BoxGeometry` panels (back, sides,
  top, bottom, divider, plinth)
- Two hinged doors that swing open/closed by rotating around a pivot
- Three sliding drawers that translate outward/inward smoothly
- Wardrobe interior stocked with hanging garments, folded clothes, a
  clothes rod, and shoes — all built from primitives
- Custom vertex and fragment shaders applied to every surface in the
  scene (wardrobe, drawers, doors, clothes, floor, walls)
- Procedurally generated textures (wood grain, floor tile, wall plaster,
  solid fabric colors) — no external image files required
- Ambient + diffuse + specular (Phong-style) lighting computed per
  fragment, with a light source that can be set rotating on demand
- Perspective camera with mouse-drag orbit, scroll-to-zoom, and
  keyboard orbit/zoom/reset
- Click-to-toggle drawers via raycasting (mouse picking)
- Full keyboard control surface (see §7)
- Minimal dark-themed room (floor + two walls) and a clean floating UI

## 4. System / Scene Design

**Wardrobe** (unit dimensions, roughly life-proportioned):
- Overall size: 2.0 × 2.2 × 0.65 (width × height × depth)
- Upper section: two hinged doors covering a hanging-clothes cavity
  (rod + 3 garments, a folded-clothes stack, and shoes)
- Lower section: three stacked drawers, each holding a small folded-cloth
  stack (and one holds a rolled item), separated from the upper section
  by a horizontal divider panel

**Room**: a dark floor and two back/side walls, kept deliberately plain so
the wardrobe stays the visual focus and the light's movement (when
rotating) reads clearly against the surfaces.

**Light**: a single point-like light source, represented visually by a
small glowing marker, orbiting the wardrobe on a horizontal circular path
at a fixed height when enabled.

## 5. Implementation Details

### 5.1 Graphics pipeline (Three.js → WebGL → GLSL)

Three.js builds the scene graph (geometries, materials, camera) and issues
WebGL draw calls. Every mesh in this project uses a custom
`THREE.ShaderMaterial` instead of a built-in material, so each draw call
runs our own [`vertex.glsl`](shaders/vertex.glsl) and then
[`fragment.glsl`](shaders/fragment.glsl) on the GPU.

### 5.2 Vertex shader — attributes, uniforms, varyings, MVP

`vertex.glsl` receives per-vertex **attributes** (`position`, `normal`,
`uv`) that Three.js supplies automatically from each mesh's
`BufferGeometry`. It also receives the standard transformation
**uniforms** Three.js injects for every `ShaderMaterial`:
`modelMatrix`, `viewMatrix`, `modelViewMatrix`, `projectionMatrix`, and
`normalMatrix`.

The final clip-space position is computed as:

```glsl
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
```

which is the standard **Model → View → Projection** pipeline:
`modelMatrix` places each vertex in world space (translation / rotation /
scaling of the wardrobe, drawers, doors, clothes, room), the view
transform (folded into `modelViewMatrix`) moves the world into camera
space, and `projectionMatrix` applies the perspective projection so
farther objects appear smaller.

The vertex shader also forwards the UV coordinate, the world-space
normal, and the world-space position to the fragment shader as
**varyings** (`vUv`, `vNormalWorld`, `vPositionWorld`), interpolated
per-fragment across each triangle.

### 5.3 Fragment shader — texture mapping and lighting

`fragment.glsl` samples the surface texture at the interpolated UV
coordinate (`texture2D(uTexture, vUv)`), then computes a classic
Ambient + Diffuse + Specular (Phong) lighting model in world space:

```
ambient  = uAmbientColor
diffuse  = max(dot(N, L), 0) * uLightColor * 0.55
specular = pow(max(dot(N, H), 0), uShininess) * uLightColor * 0.22
finalColor = texColor.rgb * max(ambient + diffuse + specular, 0.22)
```

where `N` is the surface normal, `L` is the normalized direction toward
the light, and `H` is the Blinn-Phong half-vector between `L` and the
view direction. The diffuse/specular terms are intentionally scaled down
and combined with a brightness floor so the wardrobe reads clearly from
any camera or light angle rather than swinging between very bright and
near-black. `uLightPosition` — and therefore the lighting result — is
updated every frame from [`js/lighting.js`](js/lighting.js), so moving
the light visibly changes the shading in real time.

### 5.4 Camera — perspective projection and view transform

[`js/camera.js`](js/camera.js) creates a `THREE.PerspectiveCamera` (field
of view, aspect ratio, near/far clipping planes) and positions it with a
hand-written spherical-orbit calculation rather than a third-party
controls library, so the math stays explicit:

```
x = targetX + radius * sin(polar) * sin(azimuth)
y = targetY + radius * cos(polar)
z = targetZ + radius * sin(polar) * cos(azimuth)
```

`camera.lookAt(target)` then orients the camera, which Three.js uses to
build the view matrix (the inverse of the camera's world matrix). Mouse
drag and the arrow keys adjust `azimuth`/`polar`; the scroll wheel and
`+`/`-` adjust `radius` (zoom), each clamped to sensible ranges.

### 5.5 Transformations — translation, rotation, scaling

- **Scaling + Translation**: the wardrobe body, drawers, doors and every
  clothing item are `BoxGeometry`/`CylinderGeometry` primitives sized and
  positioned to form a compound object ([`js/wardrobe.js`](js/wardrobe.js)).
- **Translation**: opening a drawer moves its pivot group forward along
  local Z; closing reverses it.
- **Rotation**: opening a door rotates its pivot group around a hinge
  point on the Y axis; the floor/side wall are also placed with rotation
  ([`js/scene.js`](js/scene.js)).

### 5.6 Animation

[`js/animation.js`](js/animation.js) runs a single `requestAnimationFrame`
loop each frame that:
1. Reads accumulated mouse/keyboard input to update the camera
2. Advances the light's orbit angle (if rotation is enabled)
3. Smoothly interpolates every drawer/door toward its open/closed target
   (exponential easing: `current += (target - current) * speed * dt`,
   never an instant jump)
4. Renders the scene

### 5.7 Texture mapping

[`js/textures.js`](js/textures.js) draws wood-grain, floor-tile,
wall-plaster and solid fabric-color patterns onto an HTML5 `<canvas>` and
wraps each one in a `THREE.CanvasTexture`. This keeps the project fully
self-contained for offline demonstration (no missing-image risk during a
viva) while still exercising real texture mapping — every mesh carries UV
coordinates, and the fragment shader samples them with
`texture2D(uTexture, vUv)`.

### 5.8 Interaction

[`js/interaction.js`](js/interaction.js) listens for keyboard and mouse
events: `keydown`/`keyup` for camera and drawer/door/light controls,
`mousedown`/`mousemove`/`mouseup` for drag-to-orbit, `wheel` for zoom, and
a `THREE.Raycaster` to detect clicks on drawer fronts for click-to-toggle.

## 6. Project Structure

```
project/
├── index.html               entry HTML + on-screen controls panel
├── css/style.css              overlay UI styling
├── js/
│   ├── main.js                 bootstraps renderer + wires every module together
│   ├── scene.js                 THREE.Scene + minimal room (floor/walls)
│   ├── camera.js                perspective camera, manual spherical orbit + zoom
│   ├── wardrobe.js              builds body/doors/drawers/contents, exposes open/close API
│   ├── interaction.js           keyboard + mouse + click-raycast input handling
│   ├── animation.js             the requestAnimationFrame loop
│   ├── lighting.js              light orbit position + glowing marker sprite
│   ├── shaderMaterial.js        loads the GLSL files, builds ShaderMaterials, shared uniforms
│   └── textures.js              procedural canvas textures (wood, floor, wall, fabric)
├── shaders/
│   ├── vertex.glsl              custom vertex shader (Model-View-Projection)
│   └── fragment.glsl            custom fragment shader (texture + Phong lighting)
├── lib/three.module.js        local copy of Three.js (r160)
└── textures/                   (reserved; textures are generated procedurally
                                  at runtime by js/textures.js — see §5.7)
```

## 7. Controls

| Input | Action |
|---|---|
| Mouse drag | Orbit camera around the wardrobe |
| Mouse scroll | Zoom in / out |
| Click a drawer | Open / close that drawer |
| Arrow keys | Orbit / tilt camera |
| `+` / `-` | Zoom in / out |
| `R` | Reset camera |
| `1` `2` `3` | Toggle the corresponding drawer |
| `O` / `C` | Open / close all drawers |
| `D` | Toggle both wardrobe doors |
| `L` | Start / stop the light's rotation (static by default) |

The same list is shown in-app via the collapsible **Controls** dropdown
in the top-right corner.

## 8. How to Run

Because the project fetches `shaders/vertex.glsl` and `shaders/fragment.glsl`
with `fetch()`, it must be served over `http://`, not opened directly as a
`file://` path (browsers block local file fetches for security). Any static
file server works. From the project folder:

```bash
# Option A - Python (usually already installed)
python -m http.server 8000

# Option B - Node.js
npx http-server -p 8000
```

Then open **http://localhost:8000** in a browser (Chrome/Edge/Firefox with
WebGL support). VS Code's "Live Server" extension also works — just right
click `index.html` → "Open with Live Server".

Three.js itself is bundled locally in [lib/three.module.js](lib/three.module.js),
so no internet connection or `npm install` is required at demo time.

## 9. Design Decisions

- **Procedural textures instead of image files** — avoids missing-asset
  risk during an offline lab demo and keeps the project self-contained
  (§5.7).
- **Manual spherical camera math instead of `OrbitControls`** — keeps the
  View/Projection transformation explicit and easy to explain in a viva,
  rather than relying on a black-box addon (§5.4).
- **Light starts static, rotates on demand (`L` key)** — gives a calm,
  presentable default view while still fully implementing and letting the
  evaluator demonstrate the required continuously-rotating light behavior.
- **Dark, minimal room** — keeps the wardrobe as the visual focus and
  makes the lighting/shading changes easy to see against a neutral
  backdrop.

## 10. Possible Future Improvements

- Additional wardrobe variants (different wood finishes) via texture
  swapping
- A second light source for more complex multi-light shading
- Persisting drawer/door state across page reloads

## 11. Conclusion

This project demonstrates, within a single cohesive 3D scene, the full
chain of concepts covered in the Computer Graphics Lab course: the
WebGL/GLSL graphics pipeline, custom vertex/fragment shaders with
attributes/uniforms/varyings, the Model-View-Projection transformation,
translation/rotation/scaling, texture mapping, per-fragment lighting, and
real-time animation — all driven by direct mouse and keyboard
interaction, without relying on any technique outside the course's scope.

## Notes

- Built with Three.js r160 (`ShaderMaterial`, `CanvasTexture`, `Raycaster`,
  `PerspectiveCamera` — no post-processing, physics, or PBR materials used).
- The room (floor + two walls) is intentionally minimal so the light's
  effect stays easy to see and the wardrobe stays the visual focus.
