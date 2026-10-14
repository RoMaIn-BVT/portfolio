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
START_ALL = dt.date(2024, 1, 1)
PERIODS = {"7": 7, "30": 30, "90": 90, "all": None}
TOPS = {"referrers": "toprefs", "countries": "locations", "sizes": "sizes",
        "browsers": "browsers", "systems": "systems"}


def api(path, **params):
    url = f"https://{SITE}.goatcounter.com/api/v0/{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}",
                                               "Content-Type": "application/json"})
    time.sleep(0.3)  # l'API limite le nombre de requêtes par seconde
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def hits(start, end):
    return api("stats/hits", start=start.isoformat(), end=end.isoformat(), limit=100).get("hits", [])


def top(page, start, end):
    rows = api(f"stats/{page}", start=start.isoformat(), end=end.isoformat(), limit=10).get("stats", [])
    return [{"name": r.get("name") or "", "count": r.get("count", 0)} for r in rows]


def events(all_hits, prefix):
    rows = [{"name": h["path"][len(prefix):], "count": h.get("count", 0)}
            for h in all_hits if h.get("event") and h.get("path", "").startswith(prefix)]
    return sorted(rows, key=lambda r: -r["count"])


def pageviews(all_hits):
    return [h for h in all_hits if not h.get("event")]


def per_day(all_hits):
    days = {}
    for h in pageviews(all_hits):
        for s in h.get("stats", []):
            days[s["day"]] = days.get(s["day"], 0) + s.get("daily", 0)
    return days


def period(start, end, prev_start=None):
    h = hits(start, end)
    hours, weekdays = [0] * 24, [0] * 7
    for p in pageviews(h):
        for s in p.get("stats", []):
            for i, n in enumerate((s.get("hourly") or [])[:24]):
                hours[i] += n
            weekdays[dt.date.fromisoformat(s["day"]).weekday()] += s.get("daily", 0)
    data = {
        "visitors": sum(p.get("count", 0) for p in pageviews(h)),
        "previous": None,
        "hours": hours,
        "weekdays": weekdays,  # lundi = 0
        "duration": events(h, "duree/"),
        "sections": events(h, "section/"),
        "clicks": events(h, "clic/"),
    }
    if prev_start:
        prev = hits(prev_start, start - dt.timedelta(days=1))
        data["previous"] = sum(p.get("count", 0) for p in pageviews(prev))
    for key, page in TOPS.items():
        data[key] = top(page, start, end)
    return data


def main():
    if not SITE or not TOKEN:
        print("GOATCOUNTER_SITE ou GOATCOUNTER_TOKEN absent : rien à mettre à jour.")
        return 0

    today = dt.datetime.now(dt.timezone.utc).date()
    periods = {}
    for key, days in PERIODS.items():
        if days is None:
            periods[key] = period(START_ALL, today)
        else:
            start = today - dt.timedelta(days=days - 1)
            periods[key] = period(start, today, start - dt.timedelta(days=days))

    days90 = per_day(hits(today - dt.timedelta(days=89), today))
    daily = [{"day": d.isoformat(), "count": days90.get(d.isoformat(), 0)}
             for d in (today - dt.timedelta(days=i) for i in range(89, -1, -1))]

    data = {
        "updated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "today": daily[-1]["count"],
        "daily": daily,
        "periods": periods,
    }
    with open("stats.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print("stats.json mis à jour : " + ", ".join(f"{k}={v['visitors']}" for k, v in periods.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
