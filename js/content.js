// Contenu des rapports de stage et du CV, partagé entre la page,
// la modale de lecture, les téléchargements et le terminal.

export const EMAIL = 'romainbonvalet43@gmail.com';

export const REPORTS = [
    {
        id: 'region_2025',
        icon: '🐋',
        accent: '#22d3ee',
        title: 'Dockerisation & DevOps',
        company: 'Région Bretagne — Rennes',
        period: 'Mai – juin 2025 · 6 semaines',
        tutor: 'Mathieu Kermarrec Delerin',
        summary: "Dockerisation de phpIPAM avec une stack complète, automatisation Ansible, déploiement GitLab et méthodologie DevOps.",
        sections: [
            { h: 'Missions principales', list: [
                'Dockerisation et mise à jour de phpIPAM',
                'Automatisation avec Ansible et Docker',
                "Déploiement d'applications avec GitLab",
                'Configuration des environnements de développement',
                'Migration de projets informatiques',
                'Création et gestion de machines virtuelles',
                'Utilisation de Visual Studio Code et Git'
            ] },
            { h: 'Projet phare : dockerisation de phpIPAM', p:
                "Création de serveurs de production et de test avec une stack Docker complète incluant phpipam, cron, mariadb et powerdns. Schématisation de l'architecture système, tests et validation des environnements, migration du code via GitLab et rédaction d'une documentation technique complète." },
            { h: 'Compétences acquises', list: [
                'Conteneurisation Docker avancée',
                'Orchestration de services',
                'Méthodologie DevOps',
                'Gestion de projet Agile',
                'Administration de systèmes Linux',
                'Intégration continue GitLab'
            ] }
        ]
    },
    {
        id: 'region_2024',
        icon: '🖥️',
        accent: '#a78bfa',
        title: 'Administration système',
        company: 'Région Bretagne — Rennes',
        period: 'Mai – juin 2024 · 6 semaines',
        tutor: 'Mathieu Kermarrec Delerin',
        summary: "Administration et sécurisation du SI régional : parc informatique, migrations GitLab, supervision Centreon et automatisation.",
        sections: [
            { h: 'Missions principales', list: [
                "Administration et sécurisation du système d'information",
                'Création et gestion de machines virtuelles',
                'Migration de projets GitLab',
                "Supervision de l'infrastructure avec Centreon",
                'Automatisation de tâches avec SMA Technologies',
                'Support technique et maintenance'
            ] },
            { h: 'Environnement technique', list: [
                'Nextcloud pour la collaboration',
                'GitLab pour le versioning',
                'Centreon pour la supervision',
                'Docker pour la conteneurisation',
                "SSH pour l'administration à distance",
                'Méthodologie Agile'
            ] },
            { h: 'Compétences développées', list: [
                'Administration de systèmes Linux et Windows',
                "Supervision d'infrastructure réseau",
                'Gestion de projets informatiques',
                'Virtualisation et cloud',
                'Sécurisation des systèmes',
                'Travail collaboratif'
            ] }
        ]
    },
    {
        id: 'hopital_2023',
        icon: '🏥',
        accent: '#4ade80',
        title: 'Migration système hospitalier',
        company: 'Centre Hospitalier — Vannes',
        period: 'Janvier – février 2023 · 5 semaines',
        summary: "Migration critique du service de rééducation (7 postes), masterisation Windows, applications médicales et formation du personnel.",
        sections: [
            { h: 'Missions principales', list: [
                "Migration complète d'un service hospitalier",
                "Masterisation d'ordinateurs Windows",
                "Installation d'imprimantes et de scanners réseau",
                'Configuration de postes médicaux spécialisés',
                'Déménagement de services (neurologie, bloc opératoire)',
                'Support technique du personnel médical'
            ] },
            { h: 'Projet majeur : migration du service de rééducation', p:
                "Configuration de 7 ordinateurs Lenovo ThinkCentre, installation de l'application Mucodomeos, renommage des machines (-BIS, -OLD, -NEW), vérification des connexions réseau, formation des utilisateurs finaux et récupération / sauvegarde des données." },
            { h: 'Environnement technique', list: [
                'Masterisation via le réseau IPv4 (boot F12)',
                'SCCM pour le déploiement logiciel',
                'ClusterPrint pour les impressions',
                'Réseau hospitalier',
                'Applications médicales spécialisées'
            ] }
        ]
    },
    {
        id: 'malte_2022',
        icon: '✈️',
        accent: '#fb923c',
        title: 'Stage international',
        company: 'Centro Casa Lingua — Malte',
        period: 'Février – mars 2022 · 5 semaines',
        summary: "Maintenance d'électroménager professionnel en anglais et en espagnol, diagnostic et réparation en contexte multiculturel.",
        sections: [
            { h: 'Contexte international', list: [
                "Stage à l'étranger sur l'île de Malte",
                'Communication en anglais et en espagnol',
                'Équipe multiculturelle',
                "Réparation d'électroménager professionnel"
            ] },
            { h: 'Missions techniques', list: [
                'Réparation de réfrigérateurs (soudure de condensateurs)',
                'Maintenance de machines à laver (courroies, cuves)',
                'Diagnostic et réparation de micro-ondes',
                "Installation d'appareils chez les clients",
                'Apprentissage du vocabulaire technique en anglais'
            ] },
            { h: 'Compétences développées', list: [
                'Soudure',
                "Diagnostic de pannes d'électroménager",
                'Anglais technique',
                'Adaptation culturelle',
                'Service client international',
                'Travail en autonomie'
            ] }
        ]
    },
    {
        id: 'as_info_2021',
        icon: '💻',
        accent: '#f472b6',
        title: 'Maintenance & assemblage PC',
        company: 'AS Informatique — Vannes',
        period: 'Décembre 2021 · 2 semaines',
        summary: "Premier stage en entreprise : assemblage d'un PC gaming sur mesure, installation des systèmes et relation client.",
        sections: [
            { h: 'Missions techniques', list: [
                "Assemblage complet d'un PC gaming",
                "Installation d'applications (Firefox, LibreOffice, Java)",
                'Clonage de disques durs',
                'Installation de RAM et diagnostics',
                "Préparation d'ordinateurs pour la vente",
                'Découverte du RAID et de Ninite'
            ] },
            { h: 'Projet autonome : PC gaming pour un client', p:
                "Analyse des besoins (jeux en ligne, budget de 1 600 à 1 700 €), configuration Intel Core i7 de 11e génération, 16 Go de RAM, RTX 3060, SSD de 1 To et alimentation 600 W. Assemblage complet avec câble management, installation de Windows 10 Pro et préparation commerciale." },
            { h: 'Compétences acquises', list: [
                'Assemblage complet de PC',
                'Conseil technique au client',
                'Installation de systèmes',
                'Préparation commerciale',
                'Travail en autonomie'
            ] }
        ]
    }
];

export const getReport = (id) => REPORTS.find((r) => r.id === id);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Corps HTML d'un rapport (utilisé dans la modale et dans les documents exportés). */
export function reportBodyHTML(r) {
    const meta = `
        <div class="meta">
            <div><strong>Stagiaire :</strong> Romain Bonvalet</div>
            <div><strong>Formation :</strong> BTS SIO — option SISR</div>
            <div><strong>Entreprise :</strong> ${esc(r.company)}</div>
            <div><strong>Période :</strong> ${esc(r.period)}</div>
            ${r.tutor ? `<div><strong>Tuteur :</strong> ${esc(r.tutor)}</div>` : ''}
        </div>`;
    const sections = r.sections.map((s) => `
        <h3>${esc(s.h)}</h3>
        ${s.p ? `<p>${esc(s.p)}</p>` : ''}
        ${s.list ? `<ul>${s.list.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}`).join('');
    return meta + sections;
}

const DOC_STYLE = `
    :root { --accent: #0e7490; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.65; color: #1e293b; max-width: 860px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; }
    header.doc { padding: 32px; border-radius: 16px; color: #fff; background: linear-gradient(120deg, #0e7490, #6d28d9); margin-bottom: 28px; }
    header.doc h1 { margin: 0 0 6px; font-size: 2rem; line-height: 1.2; }
    header.doc p { margin: 0; opacity: 0.9; }
    section.block { background: #fff; padding: 24px 28px; border-radius: 14px; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06); margin-bottom: 22px; }
    h2 { color: #0f172a; border-bottom: 2px solid var(--accent); padding-bottom: 6px; margin: 0 0 14px; font-size: 1.3rem; }
    h3 { color: #0f172a; margin: 22px 0 8px; font-size: 1.1rem; }
    .meta { background: #f1f5f9; border-left: 4px solid var(--accent); padding: 12px 16px; border-radius: 8px; display: grid; gap: 2px; }
    ul { padding-left: 20px; } li { margin: 4px 0; }
    .item { border-left: 3px solid var(--accent); padding: 8px 14px; margin: 10px 0; background: #f8fafc; border-radius: 6px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px 18px; }
    .actions { text-align: center; margin: 28px 0 8px; }
    .actions button { background: #0e7490; color: #fff; border: 0; padding: 10px 22px; border-radius: 999px; font-size: 1rem; cursor: pointer; }
    footer.doc { text-align: center; color: #64748b; font-size: 0.9rem; margin-top: 30px; }
    @media print { body { background: #fff; padding: 0; } .actions { display: none; } section.block { box-shadow: none; border: 1px solid #e2e8f0; break-inside: avoid; } }
`;

function wrapDocument(title, subtitle, inner) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>${DOC_STYLE}</style>
</head>
<body>
<header class="doc"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></header>
${inner}
<div class="actions"><button onclick="window.print()">Imprimer / enregistrer en PDF</button></div>
<footer class="doc">Romain Bonvalet · ${EMAIL}</footer>
</body>
</html>`;
}

/** Document HTML autonome et imprimable pour un rapport. */
export function reportDocument(r) {
    return wrapDocument(`Rapport de stage — ${r.title}`, `${r.company} · ${r.period}`,
        `<section class="block">${reportBodyHTML(r)}</section>`);
}

/** Document regroupant tous les rapports. */
export function allReportsDocument() {
    const intro = `
        <section class="block">
            <h2>Évolution de mes compétences sur 5 ans</h2>
            <p>Cette collection regroupe mes rapports de stage, de l'assemblage hardware au DevOps.</p>
            <ul>
                <li><strong>2021 :</strong> découverte du hardware et assemblage PC</li>
                <li><strong>2022 :</strong> stage international et adaptation multiculturelle</li>
                <li><strong>2023 :</strong> gestion de systèmes critiques en milieu hospitalier</li>
                <li><strong>2024 :</strong> administration système et sécurisation du SI</li>
                <li><strong>2025 :</strong> DevOps, Docker et automatisation</li>
            </ul>
        </section>`;
    const all = REPORTS.map((r) => `<section class="block"><h2>${esc(r.icon)} ${esc(r.title)}</h2>${reportBodyHTML(r)}</section>`).join('');
    return wrapDocument('Rapports de stage — Romain Bonvalet', 'Collection complète · 2021 – 2025', intro + all);
}

/** CV imprimable. */
export function cvDocument() {
    const inner = `
        <section class="block">
            <div class="grid">
                <div>✉ ${EMAIL}</div>
                <div>🚗 Permis B, véhiculé</div>
                <div>🌍 Anglais : intermédiaire</div>
                <div>🎂 21 ans</div>
            </div>
        </section>
        <section class="block">
            <h2>Compétences techniques</h2>
            <ul>
                <li><strong>Systèmes :</strong> Windows 10/11, Linux, Windows Server, masterisation</li>
                <li><strong>Réseaux :</strong> LAN, WAN, Wi-Fi, VPN, Cisco Packet Tracer</li>
                <li><strong>DevOps :</strong> Docker, Ansible, GitLab CI/CD, Git</li>
                <li><strong>Virtualisation :</strong> VMware vSphere, Docker</li>
                <li><strong>Outils :</strong> MobaXterm, GLPI, Centreon, Nextcloud, SCCM</li>
                <li><strong>Hardware :</strong> montage PC, diagnostic, maintenance</li>
            </ul>
        </section>
        <section class="block">
            <h2>Formation</h2>
            <div class="item"><strong>Depuis 2025 — BTS SIO SISR</strong><br>École AFTEC — Rennes</div>
            <div class="item"><strong>À partir de 2023 — BTS SIO SISR</strong><br>Lycée Pôle Sup de La Salle — Rennes</div>
            <div class="item"><strong>2020 – 2023 — Bac pro Systèmes Numériques (option ARED)</strong><br>Lycée St Joseph — Vannes</div>
            <div class="item"><strong>2020 — Brevet des collèges, mention Très Bien</strong><br>Collège Jules Simon — Vannes</div>
        </section>
        <section class="block">
            <h2>Stages en informatique</h2>
            <div class="item"><strong>Mai – juin 2025 · Région Bretagne (6 sem.)</strong><br>Dockerisation de phpIPAM, automatisation Ansible, méthodologie DevOps</div>
            <div class="item"><strong>Mai – juin 2024 · Région Bretagne (6 sem.)</strong><br>Administration système, supervision Centreon, migrations GitLab</div>
            <div class="item"><strong>Janv. – févr. 2023 · Centre Hospitalier de Vannes (5 sem.)</strong><br>Migration d'un service, masterisation Windows, formation du personnel</div>
            <div class="item"><strong>Nov. – déc. 2022 · ADM Saint-Nolff (3 sem.)</strong><br>Support informatique et maintenance du parc</div>
            <div class="item"><strong>Févr. – mars 2022 · Centro Casa Lingua, Malte (5 sem.)</strong><br>Support technique, communication en anglais et en espagnol</div>
            <div class="item"><strong>Déc. 2021 · AS Informatique Vannes (2 sem.)</strong><br>Assemblage PC gaming, diagnostic, relation client</div>
            <div class="item"><strong>Juin 2021 · Delta Informatique Vannes (4 sem.)</strong> · <strong>Déc. 2020 · Ordinov Vannes (2 sem.)</strong> · <strong>Févr. 2020 · SAUR Vannes (1 sem.)</strong></div>
        </section>
        <section class="block">
            <h2>Projets réalisés</h2>
            <ul>
                <li>Dockerisation complète de phpIPAM (phpipam, cron, mariadb, powerdns)</li>
                <li>Refonte réseau complète avec Cisco Packet Tracer</li>
                <li>Gestion du parc informatique via MobaXterm</li>
                <li>Ticketing GLPI sous Linux</li>
                <li>Masterisation Windows 10/11 pour déploiement en masse</li>
                <li>Montage d'unités centrales et installation de baies de brassage</li>
            </ul>
        </section>
        <section class="block">
            <h2>Savoir-être &amp; centres d'intérêt</h2>
            <ul>
                <li>Bon relationnel, esprit d'équipe · rigueur, sens de l'organisation</li>
                <li>Curiosité pour les innovations technologiques · autonomie</li>
                <li>Football en club (4 ans), basket, athlétisme · jeux vidéo · voyages</li>
            </ul>
        </section>`;
    return wrapDocument('Romain Bonvalet', "BTS SIO option SISR · Recherche d'un contrat d'apprentissage d'un an — septembre 2026", inner);
}

/** Ouvre un document HTML dans un nouvel onglet, ou le télécharge si les pop-ups sont bloqués. */
export function openDocument(html, filename) {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const win = window.open(url, '_blank');
    if (!win) downloadDocument(html, filename);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadDocument(html, filename) {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
