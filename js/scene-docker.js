import * as THREE from 'three';
import { createGlowMaterial, createGlowPoints, visibilityLoop } from './glow.js';

// Projet phare : la stack Docker phpIPAM en 3D.
// Quatre conteneurs « tombent » sur l'hôte Linux (docker compose up),
// puis les liaisons réseau s'établissent et des requêtes circulent vers mariadb.

const CONTAINERS = [
    { name: 'phpipam', color: '#22d3ee', pos: [-1.45, 0.95], desc: "Interface web de gestion des adresses IP (IPAM)." },
    { name: 'powerdns', color: '#fb923c', pos: [1.45, 0.95], desc: 'Serveur DNS alimenté par les données de phpIPAM.' },
    { name: 'cron', color: '#a78bfa', pos: [-1.45, -0.95], desc: 'Tâches planifiées : scans réseau et découverte des hôtes.' },
    { name: 'mariadb', color: '#4ade80', pos: [1.45, -0.95], desc: 'Base de données de la stack, stockée sur un volume persistant.' }
];
const LINKS = [['phpipam', 'mariadb'], ['cron', 'mariadb'], ['powerdns', 'mariadb'], ['cron', 'phpipam']];

const BOX = { w: 1.55, h: 0.95, d: 1.05 };
const HOST_TOP = 0.15;
const REST_Y = HOST_TOP + BOX.h / 2;

function containerTexture(name, color) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 320;
    const g = c.getContext('2d');
    g.fillStyle = '#0d1424';
    g.fillRect(0, 0, c.width, c.height);
    // Nervures de conteneur maritime
    for (let x = 16; x < c.width; x += 32) {
        g.fillStyle = 'rgba(255,255,255,0.045)';
        g.fillRect(x, 0, 12, c.height);
    }
    g.strokeStyle = color;
    g.lineWidth = 10;
    g.strokeRect(5, 5, c.width - 10, c.height - 10);
    g.fillStyle = color;
    g.font = '600 64px "JetBrains Mono", Consolas, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, c.width / 2, c.height / 2 - 16);
    g.font = '400 30px "JetBrains Mono", Consolas, monospace';
    g.fillStyle = '#4ade80';
    g.fillText('● running', c.width / 2, c.height / 2 + 52);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

function labelSprite(text, color) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 96;
    const g = c.getContext('2d');
    g.font = '500 30px "JetBrains Mono", Consolas, monospace';
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, c.width / 2, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sprite.scale.set(3.2, 0.6, 1);
    return sprite;
}

const easeOutBounce = (x) => {
    const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
};

export function initDockerScene(canvas, { tooltip, legend, replayButton, reducedMotion = false }) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x060a12, 14, 26);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const target = new THREE.Vector3(0, 0.75, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 8, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x22d3ee, 18, 14);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0xa78bfa, 14, 14);
    rim2.position.set(4, 2, -4);
    scene.add(rim2);

    const stack = new THREE.Group();
    scene.add(stack);

    // --- Hôte Linux ---
    const hostGeo = new THREE.BoxGeometry(5.4, 0.3, 3.9);
    const host = new THREE.Mesh(hostGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.4, roughness: 0.55 }));
    stack.add(host);
    const hostEdges = new THREE.LineSegments(new THREE.EdgesGeometry(hostGeo), new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.6 }));
    stack.add(hostEdges);
    const grid = new THREE.GridHelper(5.2, 13, 0x22d3ee, 0x1e293b);
    grid.position.y = HOST_TOP + 0.002;
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    stack.add(grid);
    // Étiquette posée à plat sur l'avant de l'hôte
    const hostLabel = labelSprite('linux host · docker engine', '#8b9ab4');
    const labelPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 0.49),
        new THREE.MeshBasicMaterial({ map: hostLabel.material.map, transparent: true, depthWrite: false })
    );
    labelPlane.rotation.x = -Math.PI / 2;
    labelPlane.position.set(0, HOST_TOP + 0.01, 1.71);
    stack.add(labelPlane);

    // Ombre portée douce sous l'hôte
    const shadowTex = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(34,211,238,0.35)');
        grad.addColorStop(1, 'rgba(34,211,238,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    })();
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.35;
    stack.add(shadow);

    // --- Conteneurs ---
    const boxGeo = new THREE.BoxGeometry(BOX.w, BOX.h, BOX.d);
    const boxEdgeGeo = new THREE.EdgesGeometry(boxGeo);
    const containers = CONTAINERS.map((cfg, i) => {
        const color = new THREE.Color(cfg.color);
        const tex = containerTexture(cfg.name, cfg.color);
        const material = new THREE.MeshStandardMaterial({
            map: tex, metalness: 0.3, roughness: 0.5,
            emissive: color, emissiveIntensity: 0.06, transparent: true
        });
        const mesh = new THREE.Mesh(boxGeo, material);
        const edges = new THREE.LineSegments(boxEdgeGeo, new THREE.LineBasicMaterial({ color, transparent: true }));
        const group = new THREE.Group();
        group.add(mesh, edges);
        group.position.set(cfg.pos[0], REST_Y, cfg.pos[1]);
        mesh.userData.index = i;
        stack.add(group);
        return { ...cfg, colorObj: color, group, mesh, edges, material, hover: 0, delay: i * 0.28 };
    });
    const byName = Object.fromEntries(containers.map((c) => [c.name, c]));

    // --- Liaisons réseau (arcs) et paquets ---
    const links = LINKS.map(([a, b]) => {
        const A = byName[a], B = byName[b];
        const start = new THREE.Vector3(A.pos[0], REST_Y + BOX.h / 2, A.pos[1]);
        const end = new THREE.Vector3(B.pos[0], REST_Y + BOX.h / 2, B.pos[1]);
        const mid = start.clone().lerp(end, 0.5);
        mid.y += 0.9 + start.distanceTo(end) * 0.15;
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: A.colorObj, transparent: true, opacity: 0 }));
        stack.add(line);
        return { curve, line, from: A, to: B };
    });

    const glowMat = createGlowMaterial();
    const PER_LINK = 3;
    const packetPoints = createGlowPoints(links.length * PER_LINK, glowMat);
    const packets = [];
    links.forEach((link, li) => {
        for (let k = 0; k < PER_LINK; k++) {
            const idx = li * PER_LINK + k;
            packets.push({ link, t: k / PER_LINK, speed: 0.35 + Math.random() * 0.2, back: k % 2 === 1 });
            link.from.colorObj.toArray(packetPoints.geometry.attributes.color.array, idx * 3);
            packetPoints.geometry.attributes.size.array[idx] = 0.22;
        }
    });
    packetPoints.geometry.attributes.color.needsUpdate = true;
    stack.add(packetPoints);

    // --- Animation de déploiement ---
    let deployTime = reducedMotion ? 99 : -1; // -1 : pas encore lancé
    const DROP = 0.9;
    const linksStart = (containers.length - 1) * 0.28 + DROP;

    function replay() {
        deployTime = reducedMotion ? 99 : 0;
        if (reducedMotion) render(0);
    }
    replayButton?.addEventListener('click', replay);

    // Lancement automatique quand la scène entre dans l'écran
    new IntersectionObserver(([e], obs) => {
        if (e.isIntersecting) {
            if (deployTime < 0) deployTime = 0;
            obs.disconnect();
        }
    }, { threshold: 0.35 }).observe(canvas);

    // --- Orbite au glisser ---
    const orbit = { theta: 0.65, phi: 1.02, vTheta: 0, dist: 10.5, dragging: false, lastX: 0, lastY: 0, idle: 0 };
    canvas.addEventListener('pointerdown', (e) => {
        orbit.dragging = true;
        orbit.lastX = e.clientX;
        orbit.lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
        canvas.classList.add('dragging');
    });
    canvas.addEventListener('pointerup', (e) => {
        orbit.dragging = false;
        canvas.releasePointerCapture?.(e.pointerId);
        canvas.classList.remove('dragging');
    });
    canvas.addEventListener('pointercancel', () => { orbit.dragging = false; canvas.classList.remove('dragging'); });

    // --- Survol : raycasting sur les conteneurs ---
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(9, 9);
    let hovered = null;
    let legendHover = null;

    canvas.addEventListener('pointermove', (e) => {
        const rect = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        if (orbit.dragging) {
            const dx = e.clientX - orbit.lastX;
            const dy = e.clientY - orbit.lastY;
            orbit.theta -= dx * 0.008;
            orbit.vTheta = -dx * 0.008;
            orbit.phi = THREE.MathUtils.clamp(orbit.phi - dy * 0.006, 0.45, 1.35);
            orbit.lastX = e.clientX;
            orbit.lastY = e.clientY;
            orbit.idle = 0;
        }
        if (reducedMotion) render(0);
    });
    canvas.addEventListener('pointerleave', () => { ndc.set(9, 9); if (reducedMotion) render(0); });

    legend?.querySelectorAll('[data-container]').forEach((li) => {
        li.addEventListener('mouseenter', () => { legendHover = byName[li.dataset.container]; if (reducedMotion) render(0); });
        li.addEventListener('mouseleave', () => { legendHover = null; if (reducedMotion) render(0); });
    });

    function setHovered(c) {
        if (c === hovered) return;
        hovered = c;
        legend?.querySelectorAll('[data-container]').forEach((li) => li.classList.toggle('hl', !!c && li.dataset.container === c.name));
        if (!c) tooltip.hidden = true;
    }

    function resize() {
        const { clientWidth: w, clientHeight: h } = canvas;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        orbit.dist = camera.aspect < 1 ? 13.5 : 10.5;
        glowMat.uniforms.uViewportH.value = renderer.domElement.height;
        if (reducedMotion) render(0);
    }
    new ResizeObserver(resize).observe(canvas);

    const proj = new THREE.Vector3();

    function render(dt, time = performance.now() / 1000) {
        if (deployTime >= 0) deployTime += dt;
        const t = deployTime < 0 ? 0 : deployTime;

        // Orbite : inertie après glisser, sinon rotation lente au repos
        if (!orbit.dragging && !reducedMotion) {
            orbit.idle += dt;
            orbit.vTheta *= 0.94;
            orbit.theta += orbit.vTheta + (orbit.idle > 2 ? dt * 0.12 : 0);
        }
        camera.position.set(
            target.x + orbit.dist * Math.sin(orbit.phi) * Math.sin(orbit.theta),
            target.y + orbit.dist * Math.cos(orbit.phi),
            target.z + orbit.dist * Math.sin(orbit.phi) * Math.cos(orbit.theta)
        );
        camera.lookAt(target);

        // Chute des conteneurs
        containers.forEach((c) => {
            const local = THREE.MathUtils.clamp((t - c.delay) / DROP, 0, 1);
            c.group.visible = deployTime >= 0 && t >= c.delay;
            const y = REST_Y + (1 - easeOutBounce(local)) * 5;
            const bob = local >= 1 && !reducedMotion ? Math.sin(time * 1.6 + c.delay * 6) * 0.04 : 0;
            c.group.position.y = y + bob + c.hover * 0.18;
            c.material.opacity = Math.min(1, local * 3);
            c.edges.material.opacity = Math.min(1, local * 3);
        });

        // Liaisons et paquets une fois la stack démarrée
        const linkAlpha = THREE.MathUtils.clamp((t - linksStart) / 0.6, 0, 1);
        links.forEach((l) => { l.line.material.opacity = linkAlpha * 0.55; });
        const pp = packetPoints.geometry.attributes.position;
        packets.forEach((p, i) => {
            if (!reducedMotion) p.t = (p.t + dt * p.speed) % 1;
            p.link.curve.getPoint(p.back ? 1 - p.t : p.t, proj);
            proj.toArray(pp.array, i * 3);
        });
        pp.needsUpdate = true;
        glowMat.uniforms.uOpacity.value = linkAlpha;

        // Survol
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(containers.filter((c) => c.group.visible).map((c) => c.mesh), false)[0];
        setHovered(hit ? containers[hit.object.userData.index] : null);
        const active = hovered || legendHover;
        containers.forEach((c) => {
            const goal = c === active ? 1 : 0;
            c.hover += (goal - c.hover) * (reducedMotion ? 1 : Math.min(1, dt * 10));
            c.material.emissiveIntensity = 0.06 + c.hover * 0.35;
        });

        if (hovered) {
            proj.copy(hovered.group.position).add(new THREE.Vector3(0, BOX.h / 2 + 0.1, 0));
            stack.localToWorld(proj).project(camera);
            const rect = canvas.getBoundingClientRect();
            tooltip.style.left = `${((proj.x + 1) / 2) * rect.width}px`;
            tooltip.style.top = `${((1 - proj.y) / 2) * rect.height}px`;
            tooltip.style.setProperty('--tc', hovered.color);
            tooltip.innerHTML = `<code>${hovered.name}</code>${hovered.desc}`;
            tooltip.hidden = false;
        }
        canvas.style.cursor = orbit.dragging ? 'grabbing' : hovered ? 'pointer' : 'grab';

        renderer.render(scene, camera);
    }

    resize();
    if (reducedMotion) {
        render(0);
    } else {
        visibilityLoop(canvas, render);
    }

    return { replay };
}
