import * as THREE from 'three';
import { createGlowMaterial, createGlowPoints, visibilityLoop } from './glow.js';

// Scène d'accueil : une infrastructure réseau en 3D.
// Les nœuds sont des équipements, quelques-uns sont des serveurs (boîtes),
// et des paquets de données circulent de nœud en nœud le long des liaisons.

const CYAN = new THREE.Color('#22d3ee');
const VIOLET = new THREE.Color('#a78bfa');
const GREEN = new THREE.Color('#4ade80');
const WHITE = new THREE.Color('#e0fbff');

const NODE_COUNT = 90;
const NEIGHBOURS = 3;
const RADIUS = 4.2;
const SERVER_COUNT = 10;

export function initNetworkScene(canvas, { reducedMotion = false } = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(0, 0, 14);

    const glowMaterials = [];
    const glow = (opts) => {
        const m = createGlowMaterial(opts);
        glowMaterials.push(m);
        return m;
    };

    const world = new THREE.Group();
    const network = new THREE.Group();
    world.add(network);
    scene.add(world);

    // --- Nœuds répartis sur une sphère de Fibonacci ---
    const nodes = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < NODE_COUNT; i++) {
        const y = 1 - (i / (NODE_COUNT - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        const radius = RADIUS * (0.9 + Math.random() * 0.2);
        nodes.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
    }

    // --- Liaisons : chaque nœud est relié à ses plus proches voisins ---
    const adjacency = nodes.map(() => []);
    const edgeSet = new Set();
    const edges = [];
    nodes.forEach((a, i) => {
        nodes
            .map((b, j) => ({ j, d: a.distanceToSquared(b) }))
            .filter((o) => o.j !== i)
            .sort((p, q) => p.d - q.d)
            .slice(0, NEIGHBOURS)
            .forEach(({ j }) => {
                const key = i < j ? `${i}-${j}` : `${j}-${i}`;
                if (edgeSet.has(key)) return;
                edgeSet.add(key);
                edges.push([i, j]);
                adjacency[i].push(j);
                adjacency[j].push(i);
            });
    });

    const linePositions = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], k) => {
        nodes[a].toArray(linePositions, k * 6);
        nodes[b].toArray(linePositions, k * 6 + 3);
    });
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
        color: CYAN, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    network.add(lines);

    // --- Points lumineux des nœuds ---
    const nodePoints = createGlowPoints(NODE_COUNT, glow());
    const nodePos = nodePoints.geometry.attributes.position;
    const nodeCol = nodePoints.geometry.attributes.color;
    const nodeSize = nodePoints.geometry.attributes.size;
    const baseSize = new Float32Array(NODE_COUNT);
    const baseColor = [];
    const flash = new Float32Array(NODE_COUNT);
    nodes.forEach((p, i) => {
        p.toArray(nodePos.array, i * 3);
        const c = Math.random() < 0.25 ? VIOLET : CYAN;
        baseColor.push(c);
        c.toArray(nodeCol.array, i * 3);
        baseSize[i] = 0.18 + Math.random() * 0.14;
        nodeSize.array[i] = baseSize[i];
    });
    network.add(nodePoints);

    // --- Serveurs : petites baies orientées vers le cœur ---
    const serverGroup = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.3, 0.46, 0.3);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const serverFill = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.12, depthWrite: false });
    const serverLine = new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.9 });
    const ledMaterial = new THREE.MeshBasicMaterial({ color: GREEN });
    const ledGeo = new THREE.BoxGeometry(0.06, 0.03, 0.01);
    const servers = [];
    const step = Math.floor(NODE_COUNT / SERVER_COUNT);
    for (let s = 0; s < SERVER_COUNT; s++) {
        const idx = s * step + 3;
        const holder = new THREE.Group();
        holder.position.copy(nodes[idx]).multiplyScalar(1.06);
        holder.lookAt(0, 0, 0);
        const body = new THREE.Group();
        body.add(new THREE.Mesh(boxGeo, serverFill));
        body.add(new THREE.LineSegments(boxEdges, serverLine));
        for (let l = 0; l < 3; l++) {
            const led = new THREE.Mesh(ledGeo, ledMaterial.clone());
            led.position.set(-0.07, 0.14 - l * 0.12, -0.156);
            body.add(led);
        }
        holder.add(body);
        serverGroup.add(holder);
        servers.push({ body, leds: body.children.slice(2), phase: Math.random() * 10 });
        baseSize[idx] = 0.1;
    }
    network.add(serverGroup);

    // --- Cœur : icosaèdre filaire + anneaux d'orbite ---
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.35, 1),
        new THREE.MeshBasicMaterial({ color: VIOLET, wireframe: true, transparent: true, opacity: 0.32 })
    );
    world.add(core);
    const coreInner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.7, 0),
        new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.55 })
    );
    world.add(coreInner);

    const rings = [];
    [[5.4, 0.35, 0.2], [6.1, -0.5, 0.12]].forEach(([r, tilt, opacity], i) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.008, 6, 160),
            new THREE.MeshBasicMaterial({ color: i ? VIOLET : CYAN, transparent: true, opacity })
        );
        ring.rotation.x = Math.PI / 2 + tilt;
        ring.rotation.y = tilt * 0.6;
        world.add(ring);
        rings.push(ring);
    });

    // Satellites qui orbitent sur les anneaux
    const satellites = createGlowPoints(2, glow());
    [CYAN, VIOLET].forEach((c, i) => {
        c.toArray(satellites.geometry.attributes.color.array, i * 3);
        satellites.geometry.attributes.size.array[i] = 0.45;
    });
    world.add(satellites);

    // --- Paquets de données qui transitent de nœud en nœud ---
    const PACKETS = 70;
    const packetPoints = createGlowPoints(PACKETS, glow());
    const packets = [];
    for (let p = 0; p < PACKETS; p++) {
        const from = Math.floor(Math.random() * NODE_COUNT);
        packets.push(newHop(from, Math.random()));
        const c = p % 7 === 0 ? GREEN : WHITE;
        c.toArray(packetPoints.geometry.attributes.color.array, p * 3);
        packetPoints.geometry.attributes.size.array[p] = 0.12 + Math.random() * 0.06;
    }
    network.add(packetPoints);

    function newHop(from, t = 0) {
        const options = adjacency[from];
        const to = options[Math.floor(Math.random() * options.length)];
        return { from, to, t, speed: 0.35 + Math.random() * 0.5 };
    }

    // --- Champ d'étoiles en arrière-plan ---
    const STARS = 700;
    const stars = createGlowPoints(STARS, glow({ opacity: 0.55 }));
    const sp = stars.geometry.attributes.position.array;
    for (let i = 0; i < STARS; i++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(25 + Math.random() * 45);
        v.toArray(sp, i * 3);
        (Math.random() < 0.2 ? VIOLET : WHITE).toArray(stars.geometry.attributes.color.array, i * 3);
        stars.geometry.attributes.size.array[i] = 0.08 + Math.random() * 0.22;
    }
    scene.add(stars);

    // --- Interaction : parallaxe à la souris et recul au défilement ---
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', (e) => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    let layoutX = 0;
    function resize() {
        const { clientWidth: w, clientHeight: h } = canvas;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // Sur grand écran, le réseau se place à droite du texte
        layoutX = camera.aspect > 1.15 ? Math.min(4.2, 1.8 * camera.aspect) : 0;
        world.position.y = camera.aspect > 1.15 ? 0 : 1.6;
        const viewportH = renderer.domElement.height;
        glowMaterials.forEach((m) => { m.uniforms.uViewportH.value = viewportH; });
        if (reducedMotion) render(0, 0);
    }
    new ResizeObserver(resize).observe(canvas);

    const tmp = new THREE.Vector3();
    let elapsed = 0;

    function render(dt, time) {
        elapsed += dt;

        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;

        const scroll = Math.min(window.scrollY / window.innerHeight, 1.2);
        world.position.x = layoutX;
        network.rotation.y += dt * 0.08;
        world.rotation.y = pointer.x * 0.45;
        world.rotation.x = pointer.y * 0.3 + scroll * 0.4;
        camera.position.z = 14 + scroll * 7;
        camera.position.x = -pointer.x * 0.6;
        camera.position.y = pointer.y * 0.4;
        camera.lookAt(layoutX * 0.6, world.position.y * 0.5, 0);

        core.rotation.x += dt * 0.15;
        core.rotation.y += dt * 0.22;
        coreInner.rotation.x -= dt * 0.3;
        coreInner.rotation.z += dt * 0.25;
        const pulse = 1 + Math.sin(elapsed * 2) * 0.05;
        coreInner.scale.setScalar(pulse);
        rings[0].rotation.z += dt * 0.05;
        rings[1].rotation.z -= dt * 0.04;

        // Satellites sur les anneaux
        const sat = satellites.geometry.attributes.position;
        rings.forEach((ring, i) => {
            const a = elapsed * (i ? -0.35 : 0.5);
            const r = ring.geometry.parameters.radius;
            tmp.set(Math.cos(a) * r, Math.sin(a) * r, 0).applyEuler(ring.rotation);
            tmp.toArray(sat.array, i * 3);
        });
        sat.needsUpdate = true;

        // Paquets : avancent sur leur liaison puis choisissent le saut suivant
        const pp = packetPoints.geometry.attributes.position;
        packets.forEach((pk, i) => {
            pk.t += dt * pk.speed;
            if (pk.t >= 1) {
                flash[pk.to] = 1;
                Object.assign(pk, newHop(pk.to));
            }
            tmp.lerpVectors(nodes[pk.from], nodes[pk.to], pk.t);
            tmp.toArray(pp.array, i * 3);
        });
        pp.needsUpdate = true;

        // Les nœuds s'illuminent à l'arrivée d'un paquet
        for (let i = 0; i < NODE_COUNT; i++) {
            flash[i] = Math.max(0, flash[i] - dt * 2.5);
            nodeSize.array[i] = baseSize[i] * (1 + flash[i] * 1.6);
            const c = baseColor[i];
            nodeCol.array[i * 3] = c.r + (1 - c.r) * flash[i];
            nodeCol.array[i * 3 + 1] = c.g + (1 - c.g) * flash[i];
            nodeCol.array[i * 3 + 2] = c.b + (1 - c.b) * flash[i];
        }
        nodeSize.needsUpdate = true;
        nodeCol.needsUpdate = true;

        // LED des serveurs qui clignotent
        servers.forEach((s) => {
            s.leds.forEach((led, l) => {
                const on = Math.sin(time * (3 + l * 1.7) + s.phase * (l + 1)) > -0.2;
                led.material.color.copy(on ? GREEN : CYAN).multiplyScalar(on ? 1 : 0.25);
            });
        });

        stars.rotation.y += dt * 0.004;
        renderer.render(scene, camera);
    }

    resize();
    if (reducedMotion) {
        render(0, 0);
    } else {
        visibilityLoop(canvas, render);
    }
}
