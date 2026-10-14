#!/usr/bin/env python3
"""graphify — index structurel local d'un dépôt pour économiser des tokens.

Construit un graphe (fichiers, sections HTML, règles CSS, fonctions JS/Python,
titres Markdown, liens entre eux) avec numéros de lignes, SANS stocker le
contenu des fichiers. Claude interroge le graphe puis lit uniquement la plage
de lignes utile.

Garanties :
  - 100 % local, bibliothèque standard Python uniquement, réseau désactivé.
  - Fichiers sensibles (.env, clés, secrets…) jamais ouverts.
  - Aucun contenu stocké : seulement noms de symboles, lignes, relations.
    Emails, téléphones et jetons sont masqués ; liens externes réduits au domaine.

Usage :
  graphify.py build              (re)construit .graphify/
  graphify.py status             indique si le graphe est périmé
  graphify.py map                vue d'ensemble compacte
  graphify.py find TERME         symboles correspondants (une ligne chacun)
  graphify.py show TERME [--code] [--max N]
                                 détail + voisins (+ extrait borné des lignes)
  graphify.py impact TERME       tout ce qui dépend de / touche TERME
"""
import socket

def _no_network(*_a, **_k):
    raise RuntimeError("graphify: accès réseau interdit")

socket.socket = _no_network  # type: ignore[assignment]
socket.create_connection = _no_network  # type: ignore[assignment]
socket.getaddrinfo = _no_network  # type: ignore[assignment]

import ast
import fnmatch
import hashlib
import json
import os
import re
import subprocess
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

OUT_DIR = ".graphify"
MAX_FILE_BYTES = 2_000_000
CODE_EXT = {".html", ".htm", ".css", ".js", ".mjs", ".cjs", ".ts", ".tsx",
            ".jsx", ".py", ".md", ".json"}
SKIP_DIRS = {".git", ".claude", "node_modules", OUT_DIR, "dist", "build", ".next",
             "__pycache__", ".venv", "venv", "vendor", ".cache"}
SENSITIVE = ["*.env", ".env*", "*.pem", "*.key", "*.p12", "*.pfx", "id_rsa*",
             "id_ed25519*", "*secret*", "*credential*", "*password*",
             "*.sqlite", "*.db", ".npmrc", ".pypirc", ".netrc"]

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE = re.compile(r"\+?\d[\d .-]{7,}\d")
TOKEN = re.compile(r"\b(?:sk|pk|ghp|gho|xox[bap]|AKIA)[-_A-Za-z0-9]{10,}\b|\b[A-Za-z0-9_-]{32,}\b")


def redact(text, limit=60):
    text = re.sub(r"\s+", " ", text or "").strip()
    text = EMAIL.sub("[email]", text)
    text = PHONE.sub("[tel]", text)
    text = TOKEN.sub("[secret]", text)
    return text[:limit] + ("…" if len(text) > limit else "")


def is_sensitive(path):
    name = os.path.basename(path).lower()
    return any(fnmatch.fnmatch(name, p) for p in SENSITIVE)


# ---------------------------------------------------------------- graphe ---

class Graph:
    def __init__(self):
        self.nodes = {}
        self.edges = set()

    def node(self, nid, kind, name, file, start, end=None, **extra):
        n = self.nodes.get(nid)
        if n is None:
            n = {"kind": kind, "name": name, "file": file,
                 "start": start, "end": end or start}
            n.update({k: v for k, v in extra.items() if v})
            self.nodes[nid] = n
        return nid

    def edge(self, src, dst, rel):
        if src != dst:
            self.edges.add((src, dst, rel))


def line_of(text, offset, base=1):
    return base + text.count("\n", 0, offset)


def match_brace(text, i):
    """Index de l'accolade fermante correspondant à text[i] == '{'.
    Ignore chaînes, template literals et commentaires (heuristique)."""
    depth, n = 0, len(text)
    while i < n:
        c = text[i]
        if c in "\"'`":
            q, i = c, i + 1
            while i < n and text[i] != q:
                i += 2 if text[i] == "\\" else 1
        elif text.startswith("//", i):
            i = text.find("\n", i)
            if i < 0:
                return n - 1
        elif text.startswith("/*", i):
            i = text.find("*/", i)
            if i < 0:
                return n - 1
            i += 1
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return n - 1


# ------------------------------------------------------------------- CSS ---

SEL_ID = re.compile(r"#([A-Za-z_][\w-]*)")
SEL_CLASS = re.compile(r"\.([A-Za-z_][\w-]*)")
CSS_VAR_DEF = re.compile(r"(--[\w-]+)\s*:")
CSS_VAR_USE = re.compile(r"var\(\s*(--[\w-]+)")


def parse_css(g, file, text, base=1, parent=None):
    clean = re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group()),
                   text, flags=re.S)
    i, n, sel_start = 0, len(clean), 0
    while i < n:
        c = clean[i]
        if c == "{":
            selector = clean[sel_start:i].strip()
            close = match_brace(clean, i)
            body = clean[i + 1:close]
            start = line_of(clean, sel_start + len(clean[sel_start:i]) - len(clean[sel_start:i].lstrip()), base)
            end = line_of(clean, close, base)
            if selector.startswith("@"):
                at = re.sub(r"\s+", " ", selector)[:50]
                nid = g.node(f"{file}::at::{at}@{start}", "css-at", at, file, start, end)
                if parent:
                    g.edge(parent, nid, "contains")
                if "{" in body:
                    parse_css(g, file, body, line_of(clean, i + 1, base), nid)
            else:
                short = re.sub(r"\s+", " ", selector)[:70]
                nid = g.node(f"{file}::css::{short}@{start}", "css", short, file, start, end)
                if parent:
                    g.edge(parent, nid, "contains")
                for idn in set(SEL_ID.findall(selector)):
                    g.edge(nid, f"id:{idn}", "styles")
                for cls in set(SEL_CLASS.findall(selector)):
                    g.edge(nid, f"class:{cls}", "styles")
                for var in set(CSS_VAR_DEF.findall(body)):
                    g.node(f"var:{var}", "css-var", var, file, start, end)
                    g.edge(nid, f"var:{var}", "defines")
                for var in set(CSS_VAR_USE.findall(body)):
                    g.edge(nid, f"var:{var}", "uses")
            i, sel_start = close + 1, close + 1
            continue
        if c in ";}":
            sel_start = i + 1
        i += 1


# -------------------------------------------------------------------- JS ---

JS_FUNCS = [
    re.compile(r"(?:^|[^\w$.])(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\("),
    re.compile(r"(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^()]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)"),
    re.compile(r"^\s*(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][\w$]*)", re.M),
    re.compile(r"^\s{2,}(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^()]*\)\s*\{", re.M),
]
JS_KEYWORDS = {"if", "for", "while", "switch", "catch", "function", "return", "with"}
JS_DOM = [
    (re.compile(r"getElementById\(\s*['\"]([\w-]+)"), "id"),
    (re.compile(r"classList\.(?:add|remove|toggle|contains)\(\s*['\"]([\w-]+)"), "class"),
    (re.compile(r"getElementsByClassName\(\s*['\"]([\w-]+)"), "class"),
]
JS_QUERY = re.compile(r"querySelector(?:All)?\(\s*(['\"`])(.+?)\1")
JS_EVENT = re.compile(r"addEventListener\(\s*['\"](\w+)")
JS_IMPORT = re.compile(r"(?:import\s[^'\"]*?from\s*|import\s*\(|require\s*\()\s*['\"]([^'\"]+)")
JS_CALL = re.compile(r"(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(")


def parse_js(g, file, text, base=1, owner=None):
    owner = owner or f"file:{file}"
    funcs = []
    for rx in JS_FUNCS:
        for m in rx.finditer(text):
            name = m.group(1)
            if name in JS_KEYWORDS:
                continue
            brace = text.find("{", m.end() - 1)
            arrow_expr = brace < 0 or "\n" in text[m.end():brace] and "=>" in text[m.start():m.end()]
            end = match_brace(text, brace) if not arrow_expr else m.end()
            start_l, end_l = line_of(text, m.start(1), base), line_of(text, end, base)
            nid = g.node(f"fn:{name}", "js-fn", name, file, start_l, end_l)
            g.edge(owner, nid, "defines")
            funcs.append((m.start(), end, nid))
    funcs.sort()

    def scope(pos):
        best = owner
        for s, e, nid in funcs:
            if s <= pos <= e:
                best = nid  # le plus interne gagne (trié par début)
        return best

    for rx, kind in JS_DOM:
        for m in rx.finditer(text):
            g.edge(scope(m.start()), f"{kind}:{m.group(1)}", "touches")
    for m in JS_QUERY.finditer(text):
        sel = m.group(2)
        for idn in SEL_ID.findall(sel):
            g.edge(scope(m.start()), f"id:{idn}", "touches")
        for cls in SEL_CLASS.findall(sel):
            g.edge(scope(m.start()), f"class:{cls}", "touches")
    for m in JS_EVENT.finditer(text):
        ln = line_of(text, m.start(), base)
        ev = g.node(f"{file}::event::{m.group(1)}@{ln}", "js-event",
                    f"on {m.group(1)}", file, ln)
        g.edge(scope(m.start()), ev, "listens")
    for m in JS_IMPORT.finditer(text):
        g.edge(owner, f"module:{m.group(1)}", "imports")
    known = {nid for _, _, nid in funcs}
    for m in JS_CALL.finditer(text):
        target = f"fn:{m.group(1)}"
        if target in known or target in g.nodes:
            src = scope(m.start())
            if src != target:
                g.edge(src, target, "calls")


# ------------------------------------------------------------------ HTML ---

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
LANDMARK = {"section", "header", "footer", "nav", "main", "article", "aside", "form", "dialog"}
HEADINGS = {"h1", "h2", "h3"}
INLINE_CALL = re.compile(r"([A-Za-z_$][\w$]*)\s*\(")


class HtmlIndexer(HTMLParser):
    def __init__(self, g, file):
        super().__init__(convert_charrefs=True)
        self.g, self.file = g, file
        self.stack = []  # (tag, nid|None, start_line)
        self.heading = None
        self.class_lines = {}
        self.pending_js = []

    def _container(self):
        for _, nid, _ in reversed(self.stack):
            if nid:
                return nid
        return f"file:{self.file}"

    def handle_starttag(self, tag, attrs):
        g, line = self.g, self.getpos()[0]
        a = {k: (v or "") for k, v in attrs}
        nid = None
        if a.get("id"):
            nid = g.node(f"id:{a['id']}", "html-id", f"#{a['id']} <{tag}>", self.file, line)
            g.edge(self._container(), nid, "contains")
        elif tag in LANDMARK:
            nid = g.node(f"{self.file}::{tag}@{line}", "html-block", f"<{tag}>", self.file, line)
            g.edge(self._container(), nid, "contains")
        here = nid or self._container()
        for cls in a.get("class", "").split():
            self.class_lines.setdefault(cls, []).append(line)
            g.edge(here, f"class:{cls}", "uses")
        for k, v in a.items():
            if k.startswith("on") and v:
                for fn in INLINE_CALL.findall(v):
                    self.pending_js.append((here, fn, k))
        href = a.get("href") or a.get("src") or a.get("action") or ""
        if href.startswith("#") and len(href) > 1:
            g.edge(here, f"id:{href[1:]}", "links")
        elif href.startswith(("http://", "https://")):
            dom = urlparse(href).netloc
            g.node(f"ext:{dom}", "external", dom, self.file, line)
            g.edge(here, f"ext:{dom}", "links")
        elif href and not href.startswith(("mailto:", "tel:", "javascript:", "data:", "#")):
            g.edge(here, f"asset:{href.split('?')[0]}", "loads")
        if tag in HEADINGS:
            self.heading = [tag, line, ""]
        if tag not in VOID:
            self.stack.append((tag, nid, line))

    def handle_endtag(self, tag):
        line = self.getpos()[0]
        if self.heading and tag == self.heading[0]:
            h, hl, txt = self.heading
            if txt.strip():
                nid = self.g.node(f"{self.file}::{h}@{hl}", "heading",
                                  f"{h} {redact(txt, 50)}", self.file, hl, line)
                self.g.edge(self._container(), nid, "contains")
            self.heading = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for _, nid, _ in self.stack[i:]:
                    if nid:
                        self.g.nodes[nid]["end"] = max(self.g.nodes[nid]["end"], line)
                del self.stack[i:]
                break

    def handle_data(self, data):
        line = self.getpos()[0]
        tag = self.stack[-1][0] if self.stack else ""
        if tag == "style":
            parse_css(self.g, self.file, data, line)
        elif tag == "script":
            parse_js(self.g, self.file, data, line)
        elif self.heading:
            self.heading[2] += data


def parse_html(g, file, text):
    p = HtmlIndexer(g, file)
    p.feed(text)
    p.close()
    for cls, lines in p.class_lines.items():
        g.node(f"class:{cls}", "class", f".{cls}", file, lines[0], lines[-1], uses=len(lines))
    for here, fn, attr in p.pending_js:
        if f"fn:{fn}" in g.nodes:
            g.edge(here, f"fn:{fn}", attr)


# ---------------------------------------------------------- Python / MD ---

def parse_py(g, file, text):
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return
    owner = f"file:{file}"
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            kind = "py-class" if isinstance(node, ast.ClassDef) else "py-fn"
            nid = g.node(f"py:{file}:{node.name}@{node.lineno}", kind, node.name,
                         file, node.lineno, getattr(node, "end_lineno", node.lineno))
            g.edge(owner, nid, "defines")
        elif isinstance(node, ast.Import):
            for a in node.names:
                g.edge(owner, f"module:{a.name}", "imports")
        elif isinstance(node, ast.ImportFrom) and node.module:
            g.edge(owner, f"module:{node.module}", "imports")


def parse_md(g, file, text):
    lines = text.splitlines()
    heads = [(i + 1, m.group(1), m.group(2)) for i, l in enumerate(lines)
             if (m := re.match(r"(#{1,3})\s+(.*)", l))]
    for k, (ln, hashes, title) in enumerate(heads):
        end = heads[k + 1][0] - 1 if k + 1 < len(heads) else len(lines)
        nid = g.node(f"{file}::md@{ln}", "heading", f"{hashes} {redact(title, 50)}", file, ln, end)
        g.edge(f"file:{file}", nid, "contains")


def parse_json(g, file, text):
    try:
        data = json.loads(text)
    except ValueError:
        return
    if isinstance(data, dict):  # clés de 1er niveau seulement, jamais les valeurs
        g.nodes[f"file:{file}"]["keys"] = ",".join(map(str, list(data)[:15]))


# ---------------------------------------------------------------- build ---

def list_files(root):
    try:
        out = subprocess.run(["git", "ls-files", "-co", "--exclude-standard"],
                             cwd=root, capture_output=True, text=True, check=True).stdout
        files = [f for f in out.splitlines() if f]
    except (OSError, subprocess.CalledProcessError):
        files = []
        for d, dirs, names in os.walk(root):
            dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
            files += [os.path.relpath(os.path.join(d, n), root) for n in names]
    keep, skipped = [], []
    for f in sorted(files):
        if any(part in SKIP_DIRS for part in f.split(os.sep)[:-1]):
            continue
        if is_sensitive(f):
            skipped.append(f)
        elif os.path.splitext(f)[1].lower() in CODE_EXT:
            keep.append(f)
    return keep, skipped


PARSERS = {".html": parse_html, ".htm": parse_html, ".css": parse_css,
           ".py": parse_py, ".md": parse_md, ".json": parse_json}


def build(root):
    g = Graph()
    files, skipped = list_files(root)
    hashes = {}
    for f in files:
        path = os.path.join(root, f)
        if not os.path.isfile(path) or os.path.getsize(path) > MAX_FILE_BYTES:
            continue
        raw = open(path, "rb").read()
        hashes[f] = hashlib.sha1(raw).hexdigest()
        text = raw.decode("utf-8", errors="replace")
        g.node(f"file:{f}", "file", f, f, 1, text.count("\n") + 1)
        ext = os.path.splitext(f)[1].lower()
        PARSERS.get(ext, parse_js)(g, f, text)
    # nœuds implicites (cibles d'arêtes jamais définies)
    for _, dst, _ in list(g.edges):
        if dst not in g.nodes:
            kind, _, name = dst.partition(":")
            g.node(dst, kind + "?", name, "", 0)
    os.makedirs(os.path.join(root, OUT_DIR), exist_ok=True)
    with open(os.path.join(root, OUT_DIR, ".gitignore"), "w") as fh:
        fh.write("*\n")
    data = {"version": 1, "files": hashes, "skipped_sensitive": skipped,
            "nodes": g.nodes, "edges": sorted(g.edges)}
    with open(os.path.join(root, OUT_DIR, "graph.json"), "w") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(root, OUT_DIR, "MAP.md"), "w") as fh:
        fh.write(render_map(data))
    print(f"graphify: {len(files)} fichiers, {len(g.nodes)} nœuds, {len(g.edges)} arêtes"
          + (f", {len(skipped)} sensibles ignorés" if skipped else "")
          + f" -> {OUT_DIR}/")


# ---------------------------------------------------------------- query ---

def load(root):
    path = os.path.join(root, OUT_DIR, "graph.json")
    if not os.path.exists(path):
        sys.exit("graphify: aucun graphe — lancez d'abord `graphify.py build`")
    return json.load(open(path))


def stale_files(root, data):
    current, _ = list_files(root)
    changed = []
    for f in current:
        p = os.path.join(root, f)
        if os.path.isfile(p) and hashlib.sha1(open(p, "rb").read()).hexdigest() != data["files"].get(f):
            changed.append(f)
    return changed + [f for f in data["files"] if f not in current]


def loc(n):
    if not n["file"]:
        return "(non défini)"
    return f"{n['file']}:{n['start']}" + (f"-{n['end']}" if n["end"] != n["start"] else "")


def fmt(nid, n):
    extra = f" ×{n['uses']}" if n.get("uses") else ""
    extra += f" keys={n['keys']}" if n.get("keys") else ""
    return f"[{n['kind']}] {n['name']}{extra}  {loc(n)}"


def search(data, term):
    t = term.lower().lstrip(".#")
    exact = [k for k, n in data["nodes"].items()
             if n["name"].lower().lstrip(".#").split(" ")[0] == t or k.lower().split(":", 1)[-1] == t]
    if exact:
        return exact
    return [k for k, n in data["nodes"].items() if t in n["name"].lower() or t in k.lower()]


def render_map(data):
    nodes, edges = data["nodes"], data["edges"]
    out = ["# Carte du dépôt (graphify)", "",
           "Lire une plage : `sed -n 'A,Bp' fichier`. Détail : `graphify.py show TERME`.", ""]
    by_file = {}
    for k, n in nodes.items():
        by_file.setdefault(n["file"], []).append((k, n))
    for f in sorted(x for x in by_file if x):
        items = by_file[f]
        fn = nodes.get(f"file:{f}", {})
        out.append(f"## {f} ({fn.get('end', '?')} lignes)")
        kinds = {}
        for _, n in items:
            kinds[n["kind"]] = kinds.get(n["kind"], 0) + 1
        out.append("- " + ", ".join(f"{v} {k}" for k, v in sorted(kinds.items())))
        blocks = sorted((n for _, n in items if n["kind"] in ("html-id", "html-block")
                         and n["end"] - n["start"] >= 5), key=lambda n: n["start"])
        if blocks:
            out.append("- Blocs : " + " · ".join(f"{n['name'].split(' ')[0]} {n['start']}-{n['end']}" for n in blocks[:40]))
        heads = sorted((n for _, n in items if n["kind"] == "heading"), key=lambda n: n["start"])
        if heads:
            out.append("- Titres : " + " · ".join(f"{n['name']} L{n['start']}" for n in heads[:30]))
        fns = sorted((n for _, n in items if n["kind"] in ("js-fn", "py-fn", "py-class")), key=lambda n: n["start"])
        if fns:
            out.append("- Fonctions : " + " · ".join(f"{n['name']} {n['start']}-{n['end']}" for n in fns[:50]))
        styles = sorted((n for _, n in items if n["kind"] == "css-at"), key=lambda n: n["start"])
        css = [n for _, n in items if n["kind"] == "css"]
        if css:
            out.append(f"- CSS : {len(css)} règles L{min(n['start'] for n in css)}-{max(n['end'] for n in css)}"
                       + ("; @-règles : " + " · ".join(f"{n['name']} {n['start']}-{n['end']}" for n in styles[:15]) if styles else ""))
        out.append("")
    js_touched = {e[1] for e in edges if e[2] == "touches"}
    orphans = [n["name"] for k, n in nodes.items() if n["kind"] == "class?" and k not in js_touched]
    unused = [n["name"] for k, n in nodes.items() if n["kind"] == "class"
              and not any(e[1] == k and e[2] == "styles" for e in edges)]
    missing_ids = [n["name"] for n in nodes.values() if n["kind"] == "id?"]
    out.append("## Signaux")
    out.append(f"- Classes stylées mais absentes du HTML : {', '.join(sorted(orphans)[:30]) or '—'}")
    out.append(f"- Classes HTML sans règle CSS : {', '.join(sorted(unused)[:30]) or '—'}")
    out.append(f"- Ancres/ids référencés mais inexistants : {', '.join(sorted(missing_ids)[:30]) or '—'}")
    if data.get("skipped_sensitive"):
        out.append(f"- Fichiers sensibles non indexés : {len(data['skipped_sensitive'])}")
    return "\n".join(out) + "\n"


def cmd_show(root, data, term, code, maxl):
    hits = search(data, term)
    if not hits:
        sys.exit(f"aucun nœud pour « {term} »")
    nodes, edges = data["nodes"], data["edges"]
    for nid in hits[:8]:
        n = nodes[nid]
        print(fmt(nid, n))
        outs = [(r, d) for s, d, r in edges if s == nid]
        ins = [(r, s) for s, d, r in edges if d == nid]
        for label, lst in (("→", outs), ("←", ins)):
            for rel, other in sorted(lst)[:25]:
                print(f"   {label} {rel:8} {fmt(other, nodes[other])}")
            if len(lst) > 25:
                print(f"   {label} … +{len(lst) - 25}")
        if code and n["file"] and n["start"]:
            path = os.path.join(root, n["file"])
            if is_sensitive(path):
                print("   (fichier sensible : extrait refusé)")
                continue
            end = min(n["end"], n["start"] + maxl - 1)
            with open(path, encoding="utf-8", errors="replace") as fh:
                for i, line in enumerate(fh, 1):
                    if i > end:
                        break
                    if i >= n["start"]:
                        print(f"{i:>5}| {line.rstrip()}")
            if n["end"] > end:
                print(f"   … tronqué ({n['end'] - end} lignes de plus, --max pour étendre)")
        print()
    if len(hits) > 8:
        print(f"… {len(hits) - 8} autres résultats, affinez le terme")


def cmd_impact(data, term):
    nodes, edges = data["nodes"], data["edges"]
    seeds = search(data, term)[:5]
    if not seeds:
        sys.exit(f"aucun nœud pour « {term} »")
    # saut 1 : voisins directs ; saut 2 : seulement à travers des fonctions
    # (chaîne d'appels), pour ne pas exploser via les conteneurs HTML.
    seen, frontier = set(seeds), list(seeds)
    for hop in range(2):
        nxt = []
        for s, d, r in edges:
            if r == "contains":
                continue
            for a, b in ((s, d), (d, s)):
                if a in frontier and b not in seen and (hop == 0 or nodes[a]["kind"].endswith("-fn")):
                    seen.add(b)
                    nxt.append(b)
        frontier = nxt
    by_file = {}
    for k in seen:
        by_file.setdefault(nodes[k]["file"] or "(non défini)", []).append(nodes[k])
    for f, lst in sorted(by_file.items()):
        print(f"{f}:")
        for n in sorted(lst, key=lambda n: n["start"]):
            print(f"  {n['kind']:10} {n['name'][:60]:60} L{n['start']}-{n['end']}")


def main(argv):
    root = os.getcwd()
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return
    cmd, rest = argv[0], argv[1:]
    if cmd == "build":
        build(root)
        return
    data = load(root)
    if cmd == "status":
        ch = stale_files(root, data)
        print("à jour" if not ch else "PÉRIMÉ — relancez build. Modifiés : " + ", ".join(ch[:20]))
    elif cmd == "map":
        print(render_map(data), end="")
    elif cmd == "find" and rest:
        hits = search(data, " ".join(rest))
        for k in hits[:40]:
            print(fmt(k, data["nodes"][k]))
        if len(hits) > 40:
            print(f"… {len(hits) - 40} de plus")
    elif cmd == "show" and rest:
        code = "--code" in rest
        maxl = 60
        if "--max" in rest:
            maxl = int(rest[rest.index("--max") + 1])
            rest = rest[:rest.index("--max")] + rest[rest.index("--max") + 2:]
        term = " ".join(x for x in rest if x != "--code")
        cmd_show(root, data, term, code, maxl)
    elif cmd == "impact" and rest:
        cmd_impact(data, " ".join(rest))
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main(sys.argv[1:])
