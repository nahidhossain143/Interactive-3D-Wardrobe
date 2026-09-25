import * as THREE from '../lib/three.module.js';
import { createLitMaterial } from './shaderMaterial.js';
import { createWoodTexture, createSolidTexture } from './textures.js';

const WIDTH = 2.0;
const HEIGHT = 2.2;
const DEPTH = 0.65;
const PANEL = 0.04;
const DRAWER_ROWS = 3;
const DRAWER_SECTION_HEIGHT = 0.95;

const ANIM_SPEED = 4.0;

export function buildWardrobe(shaderSource) {
    const group = new THREE.Group();

    const bodyTexture = createWoodTexture('#6b4a30', '#432c1c', { planks: 8 });
    const doorTexture = createWoodTexture('#7a5233', '#4f3220', { planks: 5 });
    const handleTexture = createSolidTexture('#d9c9a1');

    const bodyMaterial = createLitMaterial(shaderSource, bodyTexture, { shininess: 12 });
    const doorMaterial = createLitMaterial(shaderSource, doorTexture, { shininess: 18 });
    const handleMaterial = createLitMaterial(shaderSource, handleTexture, { shininess: 70 });

    const panelGrooveMaterial = createLitMaterial(shaderSource, createSolidTexture('#2e1d10'), { shininess: 6 });
    const panelRaisedMaterial = createLitMaterial(shaderSource, createWoodTexture('#8a5c38', '#5c3a20', { planks: 2 }), { shininess: 20 });
    const mirrorMaterial = createLitMaterial(shaderSource, createSolidTexture('#b9c6d4'), { shininess: 110 });

    const clothPalette = {
        navy: makeColorMaterial(shaderSource, '#3b5d8a'),
        maroon: makeColorMaterial(shaderSource, '#8a3b3b'),
        olive: makeColorMaterial(shaderSource, '#5d7a55'),
        mustard: makeColorMaterial(shaderSource, '#c9a227'),
        tan: makeColorMaterial(shaderSource, '#b9906a'),
        cream: makeColorMaterial(shaderSource, '#d8d3c4'),
        charcoal: makeColorMaterial(shaderSource, '#4a4a52'),
    };
    const shoeMaterial = makeColorMaterial(shaderSource, '#2e2a28', 6);
    const rodMaterial = makeColorMaterial(shaderSource, '#8f8d94', 55);

    const back = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, HEIGHT, PANEL), bodyMaterial);
    back.position.set(0, HEIGHT / 2, -DEPTH / 2 + PANEL / 2);
    group.add(back);

    const left = new THREE.Mesh(new THREE.BoxGeometry(PANEL, HEIGHT, DEPTH), bodyMaterial);
    left.position.set(-WIDTH / 2 + PANEL / 2, HEIGHT / 2, 0);
    group.add(left);

    const right = new THREE.Mesh(new THREE.BoxGeometry(PANEL, HEIGHT, DEPTH), bodyMaterial);
    right.position.set(WIDTH / 2 - PANEL / 2, HEIGHT / 2, 0);
    group.add(right);

    const top = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, PANEL, DEPTH), bodyMaterial);
    top.position.set(0, HEIGHT - PANEL / 2, 0);
    group.add(top);

    const bottom = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, PANEL, DEPTH), bodyMaterial);
    bottom.position.set(0, PANEL / 2, 0);
    group.add(bottom);

    const divider = new THREE.Mesh(
        new THREE.BoxGeometry(WIDTH - PANEL * 2, PANEL, DEPTH),
        bodyMaterial
    );
    divider.position.set(0, DRAWER_SECTION_HEIGHT, 0);
    group.add(divider);

    // Unit cube (1x1x1), reused with the Scaling transformation below
    // instead of a differently-sized BoxGeometry per mesh - the same
    // Model-matrix Scale that door/handle rotation and drawer translation
    // demonstrate for Rotation and Translation.
    const unitBoxGeometry = new THREE.BoxGeometry(1, 1, 1);

    const base = new THREE.Mesh(unitBoxGeometry, bodyMaterial);
    base.scale.set(WIDTH + 0.04, 0.06, DEPTH + 0.04);
    base.position.set(0, -0.03, 0);
    group.add(base);

    const trimMaterial = createLitMaterial(shaderSource, createSolidTexture('#241811'), { shininess: 22 });

    const cornice = new THREE.Mesh(unitBoxGeometry, bodyMaterial);
    cornice.scale.set(WIDTH + 0.1, 0.05, DEPTH + 0.06);
    cornice.position.set(0, HEIGHT + 0.025, 0);
    group.add(cornice);

    const corniceTrim = new THREE.Mesh(unitBoxGeometry, trimMaterial);
    corniceTrim.scale.set(WIDTH + 0.1, 0.018, DEPTH + 0.06);
    corniceTrim.position.set(0, HEIGHT - 0.006, 0);
    group.add(corniceTrim);

    const toeKick = new THREE.Mesh(unitBoxGeometry, trimMaterial);
    toeKick.scale.set(WIDTH - 0.1, 0.05, 0.02);
    toeKick.position.set(0, -0.03, DEPTH / 2 + 0.021);
    group.add(toeKick);

    const footGeometry = new THREE.CylinderGeometry(0.032, 0.024, 0.07, 12);
    const footInset = 0.09;
    [
        [-WIDTH / 2 + footInset, -DEPTH / 2 + footInset],
        [WIDTH / 2 - footInset, -DEPTH / 2 + footInset],
        [-WIDTH / 2 + footInset, DEPTH / 2 - footInset],
        [WIDTH / 2 - footInset, DEPTH / 2 - footInset],
    ].forEach(([fx, fz]) => {
        const foot = new THREE.Mesh(footGeometry, trimMaterial);
        foot.position.set(fx, -0.055, fz);
        group.add(foot);
    });

    const doorHeight = HEIGHT - DRAWER_SECTION_HEIGHT - PANEL * 1.5;
    const doorWidth = WIDTH / 2 - PANEL - 0.01;
    const doorY = DRAWER_SECTION_HEIGHT + doorHeight / 2 + PANEL / 2;

    const doorLeft = createDoor({
        width: doorWidth,
        height: doorHeight,
        thickness: PANEL,
        hingeX: -WIDTH / 2 + PANEL,
        y: doorY,
        material: doorMaterial,
        handleMaterial,
        panelGrooveMaterial,
        panelRaisedMaterial,
        side: 'left',
    });
    group.add(doorLeft.pivot);

    const doorRight = createDoor({
        width: doorWidth,
        height: doorHeight,
        thickness: PANEL,
        hingeX: WIDTH / 2 - PANEL,
        y: doorY,
        material: doorMaterial,
        handleMaterial,
        panelGrooveMaterial,
        panelRaisedMaterial,
        mirrorMaterial,
        side: 'right',
    });
    group.add(doorRight.pivot);

    const doors = [doorLeft, doorRight];

    const cavityFloorY = DRAWER_SECTION_HEIGHT + PANEL / 2;
    const rodY = HEIGHT - PANEL - 0.16;

    const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, WIDTH - PANEL * 2 - 0.3, 12),
        rodMaterial
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, rodY, 0.02);
    group.add(rod);

    const garmentSpecs = [
        { x: -0.55, material: clothPalette.navy },
        { x: -0.05, material: clothPalette.maroon },
        { x: 0.45, material: clothPalette.olive },
    ];
    garmentSpecs.forEach((spec) => {
        group.add(
            createHangingGarment({ x: spec.x, z: 0.02, rodY, material: spec.material, rodMaterial })
        );
    });

    group.add(
        createFoldedStack({
            x: 0.72,
            z: 0.08,
            yBase: cavityFloorY,
            width: 0.26,
            depth: 0.2,
            layerHeight: 0.05,
            materials: [clothPalette.mustard, clothPalette.tan, clothPalette.charcoal],
        })
    );

    const shoeGeometry = new THREE.BoxGeometry(0.22, 0.08, 0.09);
    const shoeLeft = new THREE.Mesh(shoeGeometry, shoeMaterial);
    shoeLeft.position.set(-0.83, cavityFloorY + 0.04, 0.1);
    group.add(shoeLeft);
    const shoeRight = new THREE.Mesh(shoeGeometry, shoeMaterial);
    shoeRight.position.set(-0.6, cavityFloorY + 0.04, 0.1);
    group.add(shoeRight);

    const drawers = [];
    const drawerHitboxes = [];
    const drawerAreaHeight = DRAWER_SECTION_HEIGHT - PANEL;
    const rowHeight = drawerAreaHeight / DRAWER_ROWS;
    const drawerHeight = rowHeight - 0.03;
    const drawerWidth = WIDTH - PANEL * 2 - 0.03;
    const drawerDepth = DEPTH - PANEL - 0.05;

    const drawerContents = [
        [clothPalette.navy, clothPalette.cream],
        [clothPalette.maroon, clothPalette.tan],
        [clothPalette.olive, clothPalette.mustard],
    ];

    const drawerMaterials = [
        createLitMaterial(shaderSource, createWoodTexture('#8a5a34', '#5c3a20', { planks: 4 }), { shininess: 18 }),
        createLitMaterial(shaderSource, createWoodTexture('#7f5230', '#52341c', { planks: 4 }), { shininess: 18 }),
        createLitMaterial(shaderSource, createWoodTexture('#956338', '#603f22', { planks: 4 }), { shininess: 18 }),
    ];

    for (let i = 0; i < DRAWER_ROWS; i++) {
        const y = PANEL + drawerHeight / 2 + i * rowHeight + 0.015;
        const drawer = createDrawer({
            width: drawerWidth,
            height: drawerHeight,
            depth: drawerDepth,
            y,
            frontZ: DEPTH / 2 - PANEL / 2,
            material: drawerMaterials[i],
            handleMaterial,
            index: i,
            stackMaterials: drawerContents[i],
        });
        group.add(drawer.pivot);
        drawers.push(drawer);
        drawerHitboxes.push(drawer.hitbox);
    }

    function toggleDrawer(index) {
        const drawer = drawers[index];
        if (!drawer) return;
        drawer.targetOpen = !drawer.targetOpen;
    }

    function openAllDrawers() {
        drawers.forEach((d) => (d.targetOpen = true));
    }

    function closeAllDrawers() {
        drawers.forEach((d) => (d.targetOpen = false));
    }

    function toggleDoors() {
        const opening = !doorLeft.targetOpen;
        doors.forEach((d) => (d.targetOpen = opening));
    }

    function update(deltaTime) {
        const t = Math.min(1, ANIM_SPEED * deltaTime);

        drawers.forEach((d) => {
            const targetZ = d.targetOpen ? d.openZ : d.closedZ;
            d.currentZ += (targetZ - d.currentZ) * t;
            d.pivot.position.z = d.currentZ;
        });

        doors.forEach((d) => {
            const targetAngle = d.targetOpen ? d.openAngle : 0;
            d.currentAngle += (targetAngle - d.currentAngle) * t;
            d.pivot.rotation.y = d.currentAngle;
        });
    }

    return {
        group,
        toggleDrawer,
        openAllDrawers,
        closeAllDrawers,
        toggleDoors,
        update,
        drawerHitboxes,
        doorHitboxes: doors.map((d) => d.hitbox),
        drawerCount: DRAWER_ROWS,
    };
}

function createDoor({
    width,
    height,
    thickness,
    hingeX,
    y,
    material,
    handleMaterial,
    panelGrooveMaterial,
    panelRaisedMaterial,
    mirrorMaterial,
    side,
}) {
    const pivot = new THREE.Group();
    pivot.position.set(hingeX, y, DEPTH / 2 - thickness / 2);

    const sign = side === 'left' ? 1 : -1;
    const panelX = (sign * width) / 2;

    const panel = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), material);
    panel.position.set(panelX, 0, 0);
    panel.userData.isDoor = true;
    pivot.add(panel);

    if (panelGrooveMaterial && panelRaisedMaterial) {
        const groove = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.82, height * 0.86, 0.012),
            panelGrooveMaterial
        );
        groove.position.set(panelX, 0, thickness / 2 + 0.007);
        pivot.add(groove);

        const raised = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.7, height * 0.75, 0.012),
            panelRaisedMaterial
        );
        raised.position.set(panelX, 0, thickness / 2 + 0.015);
        pivot.add(raised);

        if (mirrorMaterial) {
            const mirror = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.58, height * 0.64, 0.01),
                mirrorMaterial
            );
            mirror.position.set(panelX, 0, thickness / 2 + 0.022);
            pivot.add(mirror);
        }
    }

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 10), handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(sign * (width - 0.09), 0, thickness / 2 + 0.03);
    addHandleCaps(handle, 0.08, 0.02, handleMaterial);
    pivot.add(handle);

    return {
        pivot,
        targetOpen: false,
        currentAngle: 0,
        openAngle: side === 'left' ? -Math.PI * 0.42 : Math.PI * 0.42,
        hitbox: panel,
    };
}

function createDrawer({ width, height, depth, y, frontZ, material, handleMaterial, index, stackMaterials }) {
    const pivot = new THREE.Group();
    const closedZ = 0;
    const openZ = depth * 0.75;
    pivot.position.set(0, y, closedZ);

    const boxHeight = height * 0.88;
    const boxY = -height * 0.06;
    const box = new THREE.Mesh(new THREE.BoxGeometry(width, boxHeight, depth), material);
    box.position.set(0, boxY, frontZ - depth / 2);
    pivot.add(box);

    const front = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, height, 0.03), material);
    front.position.set(0, 0, frontZ);
    front.userData.drawerIndex = index;
    pivot.add(front);

    const handleLength = width * 0.3;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, handleLength, 8), handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0, frontZ + 0.035);
    addHandleCaps(handle, handleLength / 2, 0.017, handleMaterial);
    pivot.add(handle);

    const boxTopY = boxY + boxHeight / 2;
    if (stackMaterials && stackMaterials.length) {
        pivot.add(
            createFoldedStack({
                x: -width * 0.15,
                z: frontZ - depth / 2,
                yBase: boxTopY + 0.004,
                width: width * 0.45,
                depth: depth * 0.55,
                layerHeight: 0.035,
                materials: stackMaterials,
            })
        );

        const roll = new THREE.Mesh(
            new THREE.CylinderGeometry(0.026, 0.026, 0.085, 12),
            stackMaterials[stackMaterials.length - 1]
        );
        roll.rotation.x = Math.PI / 2;
        roll.position.set(width * 0.22, boxTopY + 0.026, frontZ - depth * 0.3);
        pivot.add(roll);
    }

    return {
        pivot,
        targetOpen: false,
        currentZ: closedZ,
        closedZ,
        openZ,
        hitbox: front,
    };
}

function createHangingGarment({ x, z, rodY, material, rodMaterial }) {
    const group = new THREE.Group();

    const hookHeight = 0.05;
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, hookHeight, 8), rodMaterial);
    hook.position.set(x, rodY - hookHeight / 2, z);
    group.add(hook);

    const shoulderHeight = 0.04;
    const shoulderY = rodY - hookHeight - shoulderHeight / 2;
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.24, shoulderHeight, 0.05), material);
    shoulders.position.set(x, shoulderY, z);
    group.add(shoulders);

    const bodyHeight = 0.62;
    const bodyY = shoulderY - shoulderHeight / 2 - bodyHeight / 2;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.17, bodyHeight, 0.035), material);
    body.position.set(x, bodyY, z);
    group.add(body);

    return group;
}

function createFoldedStack({ x, z, yBase, width, depth, layerHeight, materials }) {
    const group = new THREE.Group();
    let y = yBase;
    materials.forEach((material) => {
        const layer = new THREE.Mesh(new THREE.BoxGeometry(width, layerHeight, depth), material);
        layer.position.set(x, y + layerHeight / 2, z);
        group.add(layer);
        y += layerHeight + 0.006;
    });
    return group;
}

function makeColorMaterial(shaderSource, hex, shininess = 8) {
    return createLitMaterial(shaderSource, createSolidTexture(hex), { shininess });
}

function addHandleCaps(handleMesh, halfLength, radius, material) {
    const capGeometry = new THREE.SphereGeometry(radius, 8, 8);
    const capA = new THREE.Mesh(capGeometry, material);
    capA.position.set(0, halfLength, 0);
    handleMesh.add(capA);

    const capB = new THREE.Mesh(capGeometry, material);
    capB.position.set(0, -halfLength, 0);
    handleMesh.add(capB);
}
