#!/usr/bin/env python3
"""Récupère les statistiques GoatCounter et écrit stats.json (lancé chaque heure par GitHub Actions).

Variables d'environnement :
  GOATCOUNTER_SITE   code du site (la partie avant .goatcounter.com)
  GOATCOUNTER_TOKEN  clé API GoatCounter (droit « Read statistics » suffit)
"""
import datetime as dt
import json
import os
import sys
import time
import urllib.parse
import urllib.request

SITE = os.environ.get("GOATCOUNTER_SITE", "").strip()
TOKEN = os.environ.get("GOATCOUNTER_TOKEN", "").strip()
START_ALL = "2024-01-01"


def api(path, **params):
    url = f"https://{SITE}.goatcounter.com/api/v0/{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}",
                                               "Content-Type": "application/json"})
    time.sleep(0.3)  # l'API limite le nombre de requêtes par seconde
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def hits(start, end):
    return api("stats/hits", start=start, end=end, limit=100).get("hits", [])


def top(page, start, end):
    rows = api(f"stats/{page}", start=start, end=end, limit=10).get("stats", [])
    return [{"name": r.get("name") or "", "count": r.get("count", 0)} for r in rows]


def events(all_hits, prefix):
    rows = [{"name": h["path"][len(prefix):], "count": h.get("count", 0)}
            for h in all_hits if h.get("event") and h.get("path", "").startswith(prefix)]
    return sorted(rows, key=lambda r: -r["count"])


def main():
    if not SITE or not TOKEN:
        print("GOATCOUNTER_SITE ou GOATCOUNTER_TOKEN absent : rien à mettre à jour.")
        return 0

    today = dt.datetime.now(dt.timezone.utc).date()
    end = today.isoformat()
    start30 = (today - dt.timedelta(days=29)).isoformat()

    recent = hits(start30, end)
    per_day = {}
    for h in recent:
        if h.get("event"):
            continue
        for s in h.get("stats", []):
            per_day[s["day"]] = per_day.get(s["day"], 0) + s.get("daily", 0)
    daily = [{"day": (today - dt.timedelta(days=i)).isoformat(),
              "count": per_day.get((today - dt.timedelta(days=i)).isoformat(), 0)}
             for i in range(29, -1, -1)]

    everything = hits(START_ALL, end)
    data = {
        "updated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "visitors": {
            "today": daily[-1]["count"],
            "week": sum(d["count"] for d in daily[-7:]),
            "month": sum(d["count"] for d in daily),
            "total": sum(h.get("count", 0) for h in everything if not h.get("event")),
        },
        "daily": daily,
        "duration": events(everything, "duree/"),
        "sections": events(everything, "section/"),
        "clicks": events(everything, "clic/"),
        "referrers": top("toprefs", START_ALL, end),
        "countries": top("locations", START_ALL, end),
        "sizes": top("sizes", START_ALL, end),
        "browsers": top("browsers", START_ALL, end),
        "systems": top("systems", START_ALL, end),
    }
    with open("stats.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"stats.json mis à jour : {data['visitors']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
