"""
Flask backend for World Realtime News.

Serves the static frontend (index.html, css/, js/) and one API endpoint,
/api/articles, that fetches live headlines from NewsData.io on the server
side — so the API key lives in an environment variable here, never in
browser JS or network traffic. See js/newsApi.js for the frontend side of
this.
"""

import os
import time

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

load_dotenv()

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, static_folder=ROOT_DIR, static_url_path="")

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
NEWS_API_BASE_URL = os.environ.get("NEWS_API_BASE_URL", "https://newsdata.io/api/1")
CATEGORIES = ["world", "business", "technology", "sports", "health", "science", "entertainment"]
REQUEST_GAP_SECONDS = 0.35  # small safety margin between requests

# Every country code NewsData.io's /latest endpoint accepts (ISO 3166-1
# alpha-2, scraped from https://newsdata.io/documentation's "Supported
# Countries" table). Validated server-side so a bad code fails fast with a
# clear error instead of silently returning empty results from the API.
COUNTRIES = {
    "ad", "ae", "af", "ag", "ai", "al", "am", "an", "ao", "aq",
    "ar", "as", "at", "au", "aw", "az", "ba", "bb", "bd", "be",
    "bf", "bg", "bh", "bi", "bj", "bm", "bn", "bo", "br", "bs",
    "bt", "bv", "bw", "by", "bz", "ca", "cd", "cf", "cg", "ch",
    "ci", "ck", "cl", "cm", "cn", "co", "cr", "cu", "cv", "cw",
    "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec",
    "ee", "eg", "eh", "er", "es", "et", "fi", "fj", "fk", "fm",
    "fo", "fr", "ga", "gb", "gd", "ge", "gf", "gh", "gi", "gl",
    "gm", "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy",
    "hk", "hm", "hn", "hr", "ht", "hu", "id", "ie", "il", "in",
    "io", "iq", "ir", "is", "it", "je", "jm", "jo", "jp", "ke",
    "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz",
    "la", "lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv",
    "ly", "ma", "mc", "md", "me", "mg", "mh", "mk", "ml", "mm",
    "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw",
    "mx", "my", "mz", "na", "nc", "ne", "nf", "ng", "ni", "nl",
    "no", "np", "nr", "nu", "nz", "om", "pa", "pe", "pf", "pg",
    "ph", "pk", "pl", "pm", "pn", "pr", "ps", "pt", "pw", "py",
    "qa", "re", "ro", "ru", "rw", "sa", "sb", "sc", "sd", "se",
    "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr",
    "st", "sv", "sy", "sz", "tc", "td", "tf", "tg", "th", "tj",
    "tk", "tl", "tm", "tn", "to", "tp", "tr", "tt", "tv", "tw",
    "tz", "ua", "ug", "us", "uy", "uz", "va", "vc", "ve", "vg",
    "vi", "vu", "wf", "ws", "xk", "ye", "yt", "yu", "za", "zm",
    "zw",
}


@app.route("/")
def index():
    return send_from_directory(ROOT_DIR, "index.html")


@app.route("/health")
def health():
    return "ok", 200, {"Content-Type": "text/plain"}


@app.route("/api/articles")
def articles():
    if not NEWS_API_KEY:
        return jsonify({"error": "NEWS_API_KEY is not configured on the server."}), 500

    country = request.args.get("country", "").lower()
    if country and country not in COUNTRIES:
        return jsonify({"error": f"Unsupported country code: {country}"}), 400

    collected = []
    for category in CATEGORIES:
        params = {"category": category, "language": "en", "size": 4, "apikey": NEWS_API_KEY}
        if country:
            params["country"] = country
        try:
            resp = requests.get(
                f"{NEWS_API_BASE_URL}/latest",
                params=params,
                timeout=10,
            )
        except requests.RequestException:
            return jsonify({"error": "Unable to reach the news service. Please try again."}), 502

        if not resp.ok:
            return jsonify({"error": f"News API responded with {resp.status_code}"}), 502

        for a in resp.json().get("results", []):
            # NewsData.io gives pubDate as "YYYY-MM-DD HH:MM:SS" in UTC —
            # normalize to ISO 8601 so the frontend's `new Date(...)` parses
            # it consistently across browsers.
            pub_date = a.get("pubDate")
            published_at = f"{pub_date.replace(' ', 'T')}Z" if pub_date else None

            collected.append(
                {
                    "category": category,
                    "source": a.get("source_name") or "Unknown",
                    "title": a.get("title"),
                    "description": a.get("description") or "",
                    "url": a.get("link"),
                    "image": a.get("image_url") or "",
                    "publishedAt": published_at,
                }
            )

        time.sleep(REQUEST_GAP_SECONDS)

    for i, a in enumerate(collected, start=1):
        a["id"] = i

    return jsonify(collected)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=True)
