"""
Flask backend for World Realtime News.

Serves the static frontend (index.html, css/, js/) and one API endpoint,
/api/articles, that fetches live headlines from GNews on the server side —
so the API key lives in an environment variable here, never in browser JS
or network traffic. See js/newsApi.js for the frontend side of this.
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
NEWS_API_BASE_URL = os.environ.get("NEWS_API_BASE_URL", "https://gnews.io/api/v4")
CATEGORIES = ["world", "business", "technology", "sports", "health", "science", "entertainment"]
REQUEST_GAP_SECONDS = 0.35  # GNews free tier 429s on bursts of simultaneous requests

# Every country code GNews's top-headlines endpoint accepts (see
# https://docs.gnews.io/endpoints/top-headlines-endpoint). Validated
# server-side so a bad code fails fast with a clear error instead of
# silently returning empty results from GNews.
COUNTRIES = {
    "ar", "au", "at", "bd", "be", "bw", "br", "bg", "ca", "cl", "cn", "co", "cu", "cz",
    "eg", "ee", "et", "fi", "fr", "de", "gh", "gr", "hk", "hu", "in", "id", "ie", "il",
    "it", "jp", "ke", "lv", "lb", "lt", "my", "mx", "ma", "na", "nl", "nz", "ng", "no",
    "pk", "pe", "ph", "pl", "pt", "ro", "ru", "sa", "sn", "sg", "sk", "si", "za", "kr",
    "es", "se", "ch", "tw", "tz", "th", "tr", "ug", "ua", "ae", "gb", "us", "ve", "vn", "zw",
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
        params = {"category": category, "lang": "en", "max": 4, "apikey": NEWS_API_KEY}
        if country:
            params["country"] = country
        try:
            resp = requests.get(
                f"{NEWS_API_BASE_URL}/top-headlines",
                params=params,
                timeout=10,
            )
        except requests.RequestException:
            return jsonify({"error": "Unable to reach the news service. Please try again."}), 502

        if not resp.ok:
            return jsonify({"error": f"News API responded with {resp.status_code}"}), 502

        for a in resp.json().get("articles", []):
            collected.append(
                {
                    "category": category,
                    "source": (a.get("source") or {}).get("name", "Unknown"),
                    "title": a.get("title"),
                    "description": a.get("description") or "",
                    "url": a.get("url"),
                    "image": a.get("image") or "",
                    "publishedAt": a.get("publishedAt"),
                }
            )

        time.sleep(REQUEST_GAP_SECONDS)

    for i, a in enumerate(collected, start=1):
        a["id"] = i

    return jsonify(collected)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=True)
