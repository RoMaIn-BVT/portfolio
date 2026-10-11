import * as THREE from 'three';

// Matériau de points lumineux : taille en unités « monde » et couleur par sommet.
// Partagé par la scène réseau (nœuds, paquets, étoiles) et la scène Docker (paquets).
export function createGlowMaterial({ opacity = 1 } = {}) {
    return new THREE.ShaderMaterial({
        uniforms: {
            uViewportH: { value: 800 },
            uOpacity: { value: opacity }
        },
        vertexShader: /* glsl */`
            uniform float uViewportH;
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * projectionMatrix[1][1] * uViewportH * 0.5 / -mv.z;
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: /* glsl */`
            uniform float uOpacity;
            varying vec3 vColor;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float halo = pow(1.0 - d * 2.0, 2.2);
                float core = smoothstep(0.16, 0.0, d);
                gl_FragColor = vec4(vColor * (halo + core), (halo * 0.85 + core) * uOpacity);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
}

/** Crée un objet Points avec les attributs position / color / size attendus par le matériau. */
export function createGlowPoints(count, material) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return points;
}

/** Démarre/arrête une boucle de rendu selon la visibilité de l'élément et de l'onglet. */
export function visibilityLoop(element, frame) {
    let visible = false;
    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        frame(dt, now / 1000);
        raf = requestAnimationFrame(tick);
    };
    const update = () => {
        const run = visible && !document.hidden;
        if (run && !raf) {
            last = performance.now();
            raf = requestAnimationFrame(tick);
        } else if (!run && raf) {
            cancelAnimationFrame(raf);
            raf = 0;
        }
    };

    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        update();
    }, { rootMargin: '100px' }).observe(element);
    document.addEventListener('visibilitychange', update);
}
