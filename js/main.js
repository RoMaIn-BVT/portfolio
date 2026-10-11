import {
    EMAIL, REPORTS, getReport, reportBodyHTML, reportDocument, allReportsDocument,
    cvDocument, openDocument, downloadDocument
} from './content.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------- Démarrage ---------------- */
function boot() {
    const el = $('#boot');
    const log = $('#boot-log');
    let seen = false;
    try { seen = sessionStorage.getItem('booted') === '1'; sessionStorage.setItem('booted', '1'); } catch { /* stockage indisponible */ }
    if (reducedMotion || seen) { el.remove(); return; }

    const lines = [
        'Initialisation du noyau portfolio v2.0',
        'Montage de /home/romain',
        'Démarrage du service réseau (eth0 : up)',
        'docker compose up -d phpipam',
        'Connexion établie — bienvenue !'
    ];
    let i = 0;
    const next = () => {
        if (i < lines.length) {
            log.insertAdjacentHTML('beforeend', `<span class="ok">[  OK  ]</span> ${lines[i++]}\n`);
            setTimeout(next, 150);
        } else {
            setTimeout(() => { el.classList.add('done'); setTimeout(() => el.remove(), 600); }, 250);
        }
    };
    next();
}

/* ---------------- Navigation ---------------- */
function navigation() {
    const nav = $('#navbar');
    const toggle = $('#menu-toggle');
    const progress = $('#scroll-progress');

    const onScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 30);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const setOpen = (open) => {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    $$('#nav-menu a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

    // Lien actif selon la section visible
    const links = new Map($$('#nav-menu a').map((a) => [a.getAttribute('href').slice(1), a]));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((a) => a.classList.remove('active'));
            links.get(entry.target.id)?.classList.add('active');
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => observer.observe(s));
}

/* ---------------- Hero : texte tapé, glitch, compteurs ---------------- */
function typewriter() {
    const el = $('#typed');
    const phrases = [
        'whoami → étudiant BTS SIO SISR',
        'docker compose up -d phpipam',
        'ansible-playbook deploy.yml',
        'ping alternance-septembre-2026',
        'systemctl status motivation → active (running)'
    ];
    if (reducedMotion) { el.textContent = phrases[0]; return; }
    let p = 0, c = 0, deleting = false;
    const tick = () => {
        const text = phrases[p];
        c += deleting ? -1 : 1;
        el.textContent = text.slice(0, c);
        let delay = deleting ? 22 : 45 + Math.random() * 40;
        if (!deleting && c === text.length) { deleting = true; delay = 1900; }
        else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 350; }
        setTimeout(tick, delay);
    };
    setTimeout(tick, 900);
}

function glitch() {
    const el = $('.glitch');
    if (!el || reducedMotion) return;
    setInterval(() => {
        el.classList.add('glitching');
        setTimeout(() => el.classList.remove('glitching'), 360);
    }, 4200);
}

function counters() {
    const els = $$('[data-count]');
    const run = (el) => {
        const target = Number(el.dataset.count);
        if (reducedMotion) { el.textContent = target; return; }
        const start = performance.now();
        const step = (now) => {
            const k = Math.min((now - start) / 1400, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
            if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    });
    els.forEach((el) => obs.observe(el));
}

/* ---------------- Apparition au défilement ---------------- */
function reveals() {
    $$('.evolution-steps li').forEach((li, i) => li.style.setProperty('--i', i + 1));
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            obs.unobserve(e.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // Décalage en cascade pour les éléments d'une même grille
    $$('.reveal, .timeline-item').forEach((el) => {
        const siblings = [...el.parentElement.children].filter((s) => s.classList.contains('reveal') || s.classList.contains('timeline-item'));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 70}ms`;
        obs.observe(el);
    });

    // Ligne de la frise qui se remplit au fil du défilement
    const timeline = $('.timeline');
    const updateLine = () => {
        const r = timeline.getBoundingClientRect();
        const k = (window.innerHeight * 0.75 - r.top) / r.height;
        timeline.style.setProperty('--progress', Math.max(0, Math.min(1, k)).toFixed(3));
    };
    window.addEventListener('scroll', updateLine, { passive: true });
    updateLine();
}

/* ---------------- Inclinaison 3D des cartes ---------------- */
function tiltCards() {
    if (!finePointer || reducedMotion) return;
    $$('.tilt').forEach((card) => {
        const max = Number(card.dataset.tiltMax || 8);
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            card.classList.add('tilting');
            card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(0)`;
            card.style.setProperty('--gx', `${x * 100}%`);
            card.style.setProperty('--gy', `${y * 100}%`);
        });
        card.addEventListener('pointerleave', () => {
            card.classList.remove('tilting');
            card.style.transform = '';
        });
    });
}

/* ---------------- Onglets du parcours ---------------- */
function tabs() {
    const list = $('[role="tablist"]');
    const tabEls = $$('[role="tab"]', list);
    const indicator = $('.tab-indicator', list);

    const place = (tab) => {
        indicator.style.width = `${tab.offsetWidth}px`;
        indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    const select = (tab, focus = false) => {
        tabEls.forEach((t) => {
            const on = t === tab;
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
        });
        place(tab);
        if (focus) tab.focus();
        // Les cartes nouvellement affichées doivent pouvoir apparaître
        $$('.timeline-item:not(.in)').forEach((el) => {
            if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
        });
    };
    tabEls.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', (e) => {
            const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (d) { e.preventDefault(); select(tabEls[(i + d + tabEls.length) % tabEls.length], true); }
        });
    });
    new ResizeObserver(() => place(tabEls.find((t) => t.getAttribute('aria-selected') === 'true'))).observe(list);
    document.fonts?.ready.then(() => place(tabEls.find((t) => t.getAttribute('aria-selected') === 'true')));
}

/* ---------------- Sphère 3D des compétences ---------------- */
const TECHS = [
    ['Docker', '#22d3ee', 'Région Bretagne 2025 : stack phpIPAM (phpipam, cron, mariadb, powerdns) en production et en test.'],
    ['Ansible', '#f87171', 'Région Bretagne 2025 : automatisation des déploiements avec Docker.'],
    ['GitLab', '#fb923c', 'Région Bretagne 2024 et 2025 : migrations de projets, versioning et déploiement.'],
    ['Git', '#fb923c', 'Versioning du code et de la documentation (2025), avec Visual Studio Code.'],
    ['Linux', '#facc15', "Administration de serveurs, GLPI sous Linux, stacks Docker."],
    ['Windows Server', '#60a5fa', 'Installation et maintenance de serveurs.'],
    ['Windows 10/11', '#60a5fa', 'Masterisation et déploiement en masse, notamment au Centre Hospitalier de Vannes.'],
    ['Centreon', '#4ade80', "Région Bretagne 2024 : supervision de l'infrastructure."],
    ['GLPI', '#fbbf24', "Ticketing : prise en charge, suivi et clôture d'incidents."],
    ['Cisco', '#22d3ee', 'Refonte complète d\'un réseau simulée avec Cisco Packet Tracer.'],
    ['VPN', '#a78bfa', 'Réseaux : LAN, WAN, Wi-Fi et VPN.'],
    ['LAN / WAN', '#a78bfa', 'Conception et configuration réseau, protocoles IP.'],
    ['Wi-Fi', '#a78bfa', 'Réseaux sans fil en entreprise.'],
    ['SSH', '#4ade80', 'Administration à distance des serveurs (Région Bretagne 2024).'],
    ['MobaXterm', '#38bdf8', 'Gestion du parc informatique et des serveurs.'],
    ['VMware', '#94a3b8', 'vSphere : création et gestion de machines virtuelles.'],
    ['MariaDB', '#4ade80', 'Base de données de la stack phpIPAM.'],
    ['PowerDNS', '#fb923c', 'Serveur DNS de la stack phpIPAM.'],
    ['phpIPAM', '#22d3ee', "Gestion des adresses IP : projet phare de 2025."],
    ['SCCM', '#60a5fa', 'Déploiement logiciel au Centre Hospitalier de Vannes (2023).'],
    ['Nextcloud', '#38bdf8', 'Outil collaboratif utilisé à la Région Bretagne (2024).'],
    ['Agile', '#f472b6', 'Méthodologie de gestion de projet à la Région Bretagne.'],
    ['Hardware', '#e2e8f0', "Montage d'unités centrales, diagnostic, clonage de disques."],
    ['Câblage', '#e2e8f0', 'Installation de baies de brassage.']
];

function tagSphere() {
    const root = $('#tag-sphere');
    const info = $('#sphere-info');
    const n = TECHS.length;
    const golden = Math.PI * (3 - Math.sqrt(5));

    const tags = TECHS.map(([name, color, desc], i) => {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = golden * i;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sphere-tag';
        btn.setAttribute('role', 'listitem');
        btn.textContent = name;
        btn.style.setProperty('--c', color);
        btn.addEventListener('click', () => {
            $$('.sphere-tag', root).forEach((t) => t.classList.remove('selected'));
            btn.classList.add('selected');
            info.style.setProperty('--c', color);
            info.innerHTML = `<strong>${name}</strong> — ${desc}`;
        });
        btn.addEventListener('focus', () => { paused = true; });
        btn.addEventListener('blur', () => { paused = false; });
        root.appendChild(btn);
        return { el: btn, x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    });

    let ax = 0.003, ay = 0.004, tx = ax, ty = ay, paused = false, visible = false;
    root.addEventListener('pointermove', (e) => {
        const r = root.getBoundingClientRect();
        tx = ((e.clientY - r.top) / r.height - 0.5) * -0.04;
        ty = ((e.clientX - r.left) / r.width - 0.5) * 0.04;
    });
    root.addEventListener('pointerleave', () => { tx = 0.003; ty = 0.004; });

    const place = () => {
        const radius = root.clientWidth * 0.4;
        tags.forEach((t) => {
            const scale = 0.6 + 0.4 * ((t.z + 1) / 2);
            t.el.style.transform = `translate(-50%, -50%) translate3d(${t.x * radius}px, ${t.y * radius}px, 0) scale(${scale})`;
            t.el.style.opacity = (0.25 + 0.75 * ((t.z + 1) / 2)).toFixed(2);
            t.el.style.zIndex = String(Math.round((t.z + 1) * 100));
        });
    };

    const rotate = () => {
        ax += (tx - ax) * 0.05;
        ay += (ty - ay) * 0.05;
        const sx = Math.sin(ax), cx = Math.cos(ax), sy = Math.sin(ay), cy = Math.cos(ay);
        tags.forEach((t) => {
            const y1 = t.y * cx - t.z * sx;
            const z1 = t.y * sx + t.z * cx;
            const x2 = t.x * cy + z1 * sy;
            t.z = -t.x * sy + z1 * cy;
            t.x = x2;
            t.y = y1;
        });
    };

    const loop = () => {
        if (visible && !paused) { rotate(); place(); }
        requestAnimationFrame(loop);
    };

    new ResizeObserver(place).observe(root);
    if (reducedMotion) { place(); return; }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);
    requestAnimationFrame(loop);
}

/* ---------------- Rapports ---------------- */
function renderReports() {
    $('#reports-grid').innerHTML = REPORTS.map((r) => `
        <article class="report reveal" style="--accent:${r.accent}">
            <div class="report-inner">
                <span class="report-tab">${r.period.split('·')[0].trim()}</span>
                <div class="report-folder">
                    <div class="report-sheet" aria-hidden="true"></div>
                    <div class="report-cover">
                        <div class="report-icon" aria-hidden="true">${r.icon}</div>
                        <h3>${r.title}</h3>
                        <p class="report-company">${r.company}</p>
                        <p class="report-period">${r.period}</p>
                        <p class="report-desc">${r.summary}</p>
                        <div class="report-actions">
                            <button type="button" class="btn btn-ghost" data-action="report-view" data-id="${r.id}">Lire</button>
                            <button type="button" class="btn btn-primary" data-action="report-download" data-id="${r.id}">Télécharger</button>
                        </div>
                    </div>
                </div>
            </div>
        </article>`).join('');
}

/* ---------------- Modale ---------------- */
const modal = {
    el: null, lastFocus: null,
    open({ eyebrow = '', title, body, actions = [] }) {
        const m = this.el;
        this.lastFocus = document.activeElement;
        $('#modal-eyebrow').textContent = eyebrow;
        $('#modal-title').textContent = title;
        $('#modal-body').innerHTML = body;
        const foot = $('#modal-foot');
        foot.innerHTML = '';
        actions.forEach(({ label, cls = 'btn-ghost', onClick }) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `btn ${cls}`;
            b.textContent = label;
            b.addEventListener('click', onClick);
            foot.appendChild(b);
        });
        m.hidden = false;
        document.body.classList.add('no-scroll');
        $('#modal-body').scrollTop = 0;
        $('.modal-close', m).focus();
    },
    close() {
        if (this.el.hidden) return;
        this.el.hidden = true;
        document.body.classList.remove('no-scroll');
        this.lastFocus?.focus?.();
    },
    init() {
        this.el = $('#modal');
        this.el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) this.close(); });
        this.el.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
            if (e.key !== 'Tab') return;
            const focusables = $$('button, a[href], [tabindex]:not([tabindex="-1"])', this.el).filter((f) => f.offsetParent);
            const first = focusables[0], last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }
};

const fileName = (id) => `Rapport_Stage_${id}_Romain_Bonvalet.html`;

function viewReport(id) {
    const r = getReport(id);
    modal.open({
        eyebrow: `Rapport de stage · ${r.period}`,
        title: `${r.icon} ${r.title}`,
        body: reportBodyHTML(r),
        actions: [
            { label: 'Imprimer / PDF', onClick: () => openDocument(reportDocument(r), fileName(id)) },
            { label: 'Télécharger', cls: 'btn-primary', onClick: () => downloadReport(id) }
        ]
    });
}

function downloadReport(id) {
    downloadDocument(reportDocument(getReport(id)), fileName(id));
    toast('Rapport téléchargé ✓');
}

function viewAllReports() {
    modal.open({
        eyebrow: 'Collection complète · 2021 – 2025',
        title: '📚 Tous mes rapports de stage',
        body: `
            <p>Cette collection retrace mon évolution : de l'assemblage hardware au DevOps, en passant par l'administration système et un stage international.</p>
            <div class="report-index">
                ${REPORTS.map((r) => `<button type="button" class="btn btn-ghost" data-action="report-view" data-id="${r.id}">${r.icon} ${r.title} — <span class="muted">${r.period}</span></button>`).join('')}
            </div>`,
        actions: [{ label: 'Tout télécharger', cls: 'btn-primary', onClick: downloadAllReports }]
    });
}

function downloadAllReports() {
    downloadDocument(allReportsDocument(), 'Rapports_Stage_Romain_Bonvalet.html');
    toast('Collection téléchargée ✓');
}

function showCV() {
    openDocument(cvDocument(), 'CV_Romain_Bonvalet.html');
}

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

async function copyEmail() {
    try {
        await navigator.clipboard.writeText(EMAIL);
    } catch {
        const ta = Object.assign(document.createElement('textarea'), { value: EMAIL });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }
    toast('Adresse e-mail copiée ✓');
}

/* ---------------- Formulaire de contact ---------------- */
function contactForm() {
    const form = $('#contact-form');
    const error = $('#form-error');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let firstInvalid = null;
        $$('input, textarea', form).forEach((f) => {
            const ok = f.checkValidity() && (!f.required || f.value.trim() !== '');
            f.closest('.field').classList.toggle('invalid', !ok);
            if (!ok && !firstInvalid) firstInvalid = f;
        });
        if (firstInvalid) {
            error.textContent = firstInvalid.type === 'email' && firstInvalid.value
                ? "L'adresse e-mail ne semble pas valide."
                : 'Merci de remplir les champs obligatoires.';
            firstInvalid.focus();
            return;
        }
        error.textContent = '';
        const d = Object.fromEntries(new FormData(form));
        const body = `${d.message}\n\n— ${d.name}${d.company ? ` (${d.company})` : ''}\n${d.email}`;
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(body)}`;
        toast(`Merci ${d.name} ! Votre messagerie va s'ouvrir.`);
    });
    $$('input, textarea', form).forEach((f) => f.addEventListener('input', () => f.closest('.field').classList.remove('invalid')));
}

/* ---------------- Terminal interactif ---------------- */
function terminal() {
    const term = $('#term');
    const body = $('#term-body');
    const input = $('#term-in');
    const fab = $('#term-fab');
    const history = [];
    let hIndex = 0;
    let greeted = false;

    const print = (html) => { body.insertAdjacentHTML('beforeend', `${html}\n`); body.scrollTop = body.scrollHeight; };
    const escapeHTML = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const go = (id) => { close(); document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }); };

    const commands = {
        help: () => print(`<span class="c-cyan">Commandes disponibles :</span>
  whoami      qui suis-je ?
  skills      mes compétences techniques
  stages      mes stages en informatique
  projets     aller aux projets
  rapports    lire tous les rapports de stage
  docker ps   état de la stack phpIPAM
  ping &lt;hôte&gt;  tester une connexion
  neofetch    infos système
  cv          ouvrir mon CV
  contact     me contacter
  clear       effacer l'écran
  exit        fermer le terminal`),
        whoami: () => print(`<span class="c-green">romain</span> — Romain Bonvalet, 21 ans
Étudiant BTS SIO option SISR · recherche une alternance d'un an dès <span class="c-cyan">septembre 2026</span>.`),
        skills: () => print(`<span class="c-violet">systèmes</span>  Windows 10/11, Windows Server, Linux, VMware
<span class="c-violet">réseaux</span>   LAN/WAN, Wi-Fi, VPN, Cisco Packet Tracer
<span class="c-violet">devops</span>    Docker, Ansible, GitLab, Git
<span class="c-violet">outils</span>    Centreon, GLPI, MobaXterm, SSH, SCCM, Nextcloud`),
        stages: () => print(`2025  Région Bretagne        6 sem.  DevOps / Docker
2024  Région Bretagne        6 sem.  Administration SI
2023  CH Vannes              5 sem.  Migration système
2022  ADM Saint-Nolff        3 sem.  Support
2022  Centro Casa Lingua     5 sem.  International (Malte)
2021  AS Informatique        2 sem.  Assemblage PC
2021  Delta Informatique     4 sem.  Installation
2020  Ordinov                2 sem.  Assemblage
2020  SAUR                   1 sem.  Découverte
<span class="c-cyan">total : 9 stages, 34 semaines</span>`),
        projets: () => go('projects'),
        rapports: () => { close(); viewAllReports(); },
        cv: () => { print('Ouverture du CV…'); showCV(); },
        contact: () => print(`✉ <a href="mailto:${EMAIL}">${EMAIL}</a>  (tapez <span class="c-cyan">goto contact</span> pour le formulaire)`),
        goto: (arg) => (document.getElementById(arg) ? go(arg) : print(`<span class="c-err">section introuvable : ${escapeHTML(arg || '')}</span>`)),
        'docker': (arg) => {
            if (arg !== 'ps') return print('usage : docker ps');
            print(`<span class="c-muted">CONTAINER ID   IMAGE                 STATUS         NAMES</span>
3f2a9c1d8e01   phpipam/phpipam-www   Up 2 hours     <span class="c-cyan">phpipam</span>
7b4e2f0a6c13   phpipam/phpipam-cron  Up 2 hours     <span class="c-violet">cron</span>
a91c3d5e7f24   mariadb:10            Up 2 hours     <span class="c-green">mariadb</span>
c05d8b2e9a37   powerdns/pdns         Up 2 hours     <span style="color:#fb923c">powerdns</span>`);
        },
        ping: (arg) => {
            const host = escapeHTML(arg || 'recruteur.fr');
            let n = 0;
            print(`PING ${host} : 56 octets de données`);
            const iv = setInterval(() => {
                const ms = (8 + Math.random() * 12).toFixed(1);
                print(`64 octets de ${host} : icmp_seq=${++n} ttl=64 temps=${ms} ms`);
                if (n === 3) {
                    clearInterval(iv);
                    print(`<span class="c-green">--- ${host} : 3 paquets transmis, 3 reçus, 0 % de perte ---</span>`);
                }
            }, 380);
        },
        neofetch: () => print(`<span class="c-cyan"> ┌────────┐</span>   <span class="c-green">romain</span>@<span class="c-green">sisr</span>
<span class="c-cyan"> │  R  B  │</span>   ----------
<span class="c-cyan"> │ ▪▪▪▪▪▪ │</span>   OS : BTS SIO — option SISR
<span class="c-cyan"> └────────┘</span>   Host : Bretagne (Rennes / Vannes)
               Uptime : 21 ans
               Stages : 9 (34 semaines)
               Shell : bash, Ansible, Docker
               Langues : français, anglais
               Statut : <span class="c-green">disponible septembre 2026</span>`),
        sudo: (arg) => (arg && arg.startsWith('hire')
            ? print(`<span class="c-green">[sudo] mot de passe : ********</span>
Excellente décision ! Envoyez-moi un message : <a href="mailto:${EMAIL}">${EMAIL}</a>`)
            : print('<span class="c-err">romain n\'est pas dans le fichier sudoers. Cet incident sera signalé. 😉</span>')),
        ls: () => print('profil/  projets/  parcours/  competences/  rapports/  contact/'),
        clear: () => { body.innerHTML = ''; },
        exit: () => close()
    };

    const run = (raw) => {
        const line = raw.trim();
        print(`<span class="c-green">romain@sisr:~$</span> ${escapeHTML(line)}`);
        if (!line) return;
        history.push(line);
        hIndex = history.length;
        const [cmd, ...rest] = line.split(/\s+/);
        const fn = commands[cmd.toLowerCase()];
        if (fn) fn(rest.join(' '));
        else print(`<span class="c-err">${escapeHTML(cmd)} : commande introuvable.</span> Tapez <span class="c-cyan">help</span>.`);
    };

    function open() {
        term.hidden = false;
        if (!greeted) {
            greeted = true;
            print(`<span class="c-cyan">Bienvenue sur le terminal de Romain.</span> Tapez <span class="c-green">help</span> pour la liste des commandes.`);
        }
        input.focus();
    }
    function close() {
        term.hidden = true;
        fab.focus({ preventScroll: true });
    }

    fab.addEventListener('click', () => (term.hidden ? open() : close()));
    $('#term-close').addEventListener('click', close);
    $('#term-form').addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' && hIndex > 0) { e.preventDefault(); input.value = history[--hIndex]; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); hIndex = Math.min(history.length, hIndex + 1); input.value = history[hIndex] || ''; }
        else if (e.key === 'Escape') close();
        else if (e.key === 'Tab') {
            e.preventDefault();
            const match = Object.keys(commands).find((c) => c.startsWith(input.value.trim()));
            if (match && input.value.trim()) input.value = match + ' ';
        }
    });
    document.addEventListener('keydown', (e) => {
        const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
        if ((e.key === '`' || e.key === '²') && !typing) { e.preventDefault(); term.hidden ? open() : close(); }
    });
}

/* ---------------- Actions globales ---------------- */
function actions() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'cv') showCV();
        else if (action === 'report-view') viewReport(id);
        else if (action === 'report-download') downloadReport(id);
        else if (action === 'report-all-view') viewAllReports();
        else if (action === 'report-all-download') downloadAllReports();
    });
    $('#copy-email').addEventListener('click', copyEmail);
    $('#year').textContent = new Date().getFullYear();
}

/* ---------------- Scènes 3D ---------------- */
function webglAvailable() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
        return false;
    }
}

async function scenes() {
    if (!webglAvailable()) {
        document.documentElement.classList.add('no-webgl');
        return;
    }
    try {
        const { initNetworkScene } = await import('./scene-network.js');
        initNetworkScene($('#hero-canvas'), { reducedMotion });
    } catch (err) {
        console.warn('Scène réseau indisponible :', err);
    }
    try {
        const { initDockerScene } = await import('./scene-docker.js');
        initDockerScene($('#docker-canvas'), {
            tooltip: $('#docker-tooltip'),
            legend: $('#docker-legend'),
            replayButton: $('#docker-replay'),
            reducedMotion
        });
    } catch (err) {
        console.warn('Scène Docker indisponible :', err);
    }
}

/* ---------------- Initialisation ---------------- */
boot();
renderReports();
navigation();
typewriter();
glitch();
counters();
reveals();
tiltCards();
tabs();
tagSphere();
modal.init();
contactForm();
terminal();
actions();
scenes();
