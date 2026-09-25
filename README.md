# Interactive 3D Wardrobe

A real-time interactive 3D scene built for the **CSE 4204 — Computer
Graphics Lab** course. The project renders a wooden wardrobe — with hinged
doors, three sliding drawers, and clothes/shoes stored inside — inside a
fully enclosed room lit by a rotating LED strip fixture, using
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

No physics engine, post-processing library, shadow mapping, or PBR
material system is used — everything on screen is built from primitive
geometry and the custom shader described below, matching the scope of
the course.

## 3. Features Implemented

- Wardrobe body built from primitive `BoxGeometry` panels (back, sides,
  top, bottom, divider, plinth)
- Two hinged doors that swing open/closed by rotating around a pivot;
  the right-hand door has a mirror set into a raised-panel molding, the
  left door a matching plain raised panel
- Three sliding drawers, each with its own distinct wood-tone texture,
  that translate outward/inward smoothly
- Wardrobe interior stocked with hanging garments, folded clothes, a
  clothes rod, and shoes — all built from primitives
- Custom vertex and fragment shaders applied to every lit surface in the
  scene (wardrobe, drawers, doors, clothes, floor, walls, ceiling)
- Procedurally generated textures (wood grain, floor tile, wall plaster,
  solid fabric colors) — no external image files required
- Ambient + diffuse + specular (Phong-style) key lighting plus a static
  fill light, computed per fragment, with distance attenuation
- A fully enclosed room: floor, ceiling, all four walls, baseboard and
  crown molding trim, and four wall-mounted picture frames
- A physical light fixture — an LED strip mounted around all four
  walls — whose bright segment continuously travels the full loop and
  *is* the scene's key light position (not a separate hidden light)
- Perspective camera with mouse-drag orbit, scroll-to-zoom, and
  keyboard orbit/zoom/reset
- Click-to-toggle drawers and doors via raycasting (mouse picking)
- Full keyboard control surface (see §7)
- A clean floating UI: title, status indicator, first-run controls hint,
  and a collapsible controls panel

## 4. System / Scene Design

**Wardrobe** (unit dimensions, roughly life-proportioned):
- Overall size: 2.0 × 2.2 × 0.65 (width × height × depth)
- Upper section: two hinged doors covering a hanging-clothes cavity
  (rod + 3 garments, a folded-clothes stack, and shoes)
- Lower section: three stacked drawers, each with its own wood tone and
  holding a small folded-cloth stack (one also holds a rolled item),
  separated from the upper section by a horizontal divider panel
- Furniture detailing: a crown cornice above the top panel, a dark
  toe-kick trim strip and turned bun feet along the base, raised-panel
  door molding with a mirror on the right door, and door/drawer handles
  finished with small sphere end-caps

**Room**: a fully enclosed 14×14 unit space — floor, ceiling, and all
four walls — with baseboard and crown molding trim running around the
whole perimeter, and four wall-mounted picture frames, so the space
feels furnished and architecturally complete while staying plain enough
that the wardrobe remains the visual focus.

**Light**: a single physical fixture — an LED strip mounted around all
four walls near the ceiling — with a bright segment that continuously
travels the full rectangular loop. That segment's position is the
scene's actual key light; a second, static fill light on the opposite
side keeps the far side of the wardrobe from going flat while the key
light is elsewhere in its loop.

## 5. Implementation Details

### 5.1 Graphics pipeline (Three.js → WebGL → GLSL)

Three.js builds the scene graph (geometries, materials, camera) and issues
WebGL draw calls. Every lit mesh in this project uses a custom
`THREE.ShaderMaterial` instead of a built-in material, so each draw call
runs our own [`vertex.glsl`](shaders/vertex.glsl) and then
[`fragment.glsl`](shaders/fragment.glsl) on the GPU. (The light fixture's
self-illuminated LED/glow surfaces use a plain unlit `MeshBasicMaterial`
instead, since they represent the light source itself rather than a
surface being lit.)

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
Ambient + Diffuse + Specular (Phong) lighting model in world space for
the key light, plus a diffuse-only fill light:

```
attenuation = 1 / (1 + 0.01 * distance(light, fragment)^2)

ambient  = uAmbientColor
diffuse  = max(dot(N, L), 0) * uLightColor * 0.85 * attenuation
specular = pow(max(dot(N, H), 0), uShininess) * uLightColor * 0.36 * attenuation
fill     = max(dot(N, Lfill), 0) * uFillLightColor * 0.32

finalColor = texColor.rgb * max(ambient + diffuse + specular + fill, 0.24)
```

where `N` is the surface normal, `L` is the normalized direction toward
the key light, `H` is the Blinn-Phong half-vector between `L` and the
view direction, and `Lfill` is the direction toward the static fill
light. The key light now lives on a strip mounted around the room's
walls, much farther from the wardrobe than a light hovering next to it,
so the distance-based `attenuation` term keeps a grazing angle from
blowing the diffuse/specular terms out to full strength. `uLightPosition`
— and therefore the lighting result — is updated every frame from
[`js/lighting.js`](js/lighting.js), so the light's movement around the
room visibly changes the shading in real time.

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

- **Scaling**: the wardrobe's base, cornice and toe-kick, and the room's
  baseboard/crown trim strips, are all built from a single reusable
  1×1×1 unit `BoxGeometry` and sized with an explicit
  `mesh.scale.set(width, height, depth)` — a direct, visible use of the
  Scaling transformation matrix ([`js/wardrobe.js`](js/wardrobe.js),
  [`js/scene.js`](js/scene.js)).
- **Translation**: opening a drawer moves its pivot group forward along
  local Z; closing reverses it. Every other component (walls, trim,
  picture frames, light fixture segments) is positioned with
  `.position.set(...)`.
- **Rotation**: opening a door rotates its pivot group around a hinge
  point on the Y axis; the floor/walls/ceiling and the light fixture's
  four wall segments are also oriented with `.rotation` so their faces
  point into the room.

### 5.6 Animation

[`js/animation.js`](js/animation.js) runs a single `requestAnimationFrame`
loop each frame that:
1. Reads accumulated mouse/keyboard input to update the camera
2. Advances the light's position around the room's perimeter loop
   (unless paused)
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
`texture2D(uTexture, vUv)`. The wardrobe body, each door, and each of the
three drawers all use a distinct wood-tone texture generated this way.

### 5.8 Interaction

[`js/interaction.js`](js/interaction.js) listens for keyboard and mouse
events: `keydown`/`keyup` for camera and drawer/door/light controls,
`mousedown`/`mousemove`/`mouseup` for drag-to-orbit, `wheel` for zoom, and
a `THREE.Raycaster` to detect clicks on drawer fronts and door panels for
click-to-toggle.

## 6. Project Structure

```
project/
├── index.html               entry HTML + on-screen controls panel
├── css/style.css              overlay UI styling
├── js/
│   ├── main.js                 bootstraps renderer + wires every module together
│   ├── scene.js                 THREE.Scene + fully enclosed room (walls/ceiling/trim/art)
│   ├── camera.js                perspective camera, manual spherical orbit + zoom
│   ├── wardrobe.js              builds body/doors/drawers/contents, exposes open/close API
│   ├── interaction.js           keyboard + mouse + click-raycast input handling
│   ├── animation.js             the requestAnimationFrame loop
│   ├── lighting.js              perimeter LED strip fixture + traveling key light position
│   ├── shaderMaterial.js        loads the GLSL files, builds ShaderMaterials, shared uniforms
│   └── textures.js              procedural canvas textures (wood, floor, wall, fabric)
├── shaders/
│   ├── vertex.glsl              custom vertex shader (Model-View-Projection)
│   └── fragment.glsl            custom fragment shader (texture + Phong + fill light)
├── lib/three.module.js        local copy of Three.js (r160)
└── textures/                   (reserved; textures are generated procedurally
                                  at runtime by js/textures.js — see §5.7)
```

## 7. Controls

| Input | Action |
|---|---|
| Mouse drag | Orbit camera around the wardrobe |
| Mouse scroll | Zoom in / out |
| Click a drawer or door | Open / close it |
| Arrow keys | Orbit / tilt camera |
| `+` / `-` | Zoom in / out |
| `R` | Reset camera |
| `1` `2` `3` | Toggle the corresponding drawer |
| `O` / `C` | Open / close all drawers |
| `D` | Toggle both wardrobe doors |
| `L` | Pause / resume the light's rotation (rotating by default) |

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
- **The key light rotates continuously by default** — press `L` only to
  pause it (e.g. to hold a flattering angle for a screenshot), so the
  required continuously-rotating behavior is always on display without
  needing a keypress first.
- **Light fixture and key light are the same object** — the bright
  segment you see traveling around the wall-mounted LED strip is
  literally `uLightPosition`, not a separate invisible light, so the
  cause of the changing shading is visually obvious during a viva.
- **A static fill light supplements the rotating key light** — since the
  key light now lives far away on the room's walls, a second, fixed
  light keeps the wardrobe's far side from reading as flat/black while
  the key light is elsewhere in its loop. This is a standard key+fill
  two-light setup, not an out-of-scope lighting technique.
- **A fully enclosed room** — floor, ceiling and all four walls (plus
  trim) give the rotating light real architecture to play across from
  every angle, rather than two open walls.

## 10. Possible Future Improvements

- Additional wardrobe variants (different wood finishes) via texture
  swapping
- Persisting drawer/door state across page reloads
- A second, independently-controllable light fixture

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
  `PerspectiveCamera` — no post-processing, physics, shadow mapping, or
  PBR materials used).
- The room (floor, ceiling, four walls, trim, and four picture frames) is
  kept simple so the light's effect stays easy to see and the wardrobe
  stays the visual focus.
