"""
Flask backend for World Realtime News.

Serves the static frontend (index.html, css/, js/) and one API endpoint,
/api/articles, that fetches live headlines from the Currents News API on
the server side — so the API key lives in an environment variable here,
never in browser JS or network traffic. See js/newsApi.js for the
frontend side of this.
"""

import os
import re
import time

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

load_dotenv()

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, static_folder=ROOT_DIR, static_url_path="")

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
NEWS_API_BASE_URL = os.environ.get("NEWS_API_BASE_URL", "https://api.currentsapi.services/v1")
CATEGORIES = ["world", "business", "technology", "sports", "health", "science", "entertainment"]
ARTICLES_PER_CATEGORY = 4
REQUEST_GAP_SECONDS = 0.35  # small safety margin between requests

# Currents' /search endpoint accepts a "country" filter but its docs don't
# publish an exhaustive supported-country list the way NewsData.io's did,
# so instead of a hardcoded whitelist this just checks the shape (a
# 2-letter code) and lets Currents itself be the source of truth — an
# unrecognized code just comes back with zero results rather than an error.
COUNTRY_CODE_RE = re.compile(r"^[a-z]{2}$")

# "YYYY-MM-DD HH:MM:SS +0000" -> "YYYY-MM-DDTHH:MM:SS+00:00" (falls back to
# the raw string if Currents ever changes their format, rather than raising).
PUBLISHED_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\s*([+-]\d{2}):?(\d{2}))?$")


def normalize_published(raw):
    if not raw:
        return None
    match = PUBLISHED_RE.match(raw.strip())
    if not match:
        return raw
    date_part, time_part, offset_hour, offset_min = match.groups()
    if offset_hour:
        return f"{date_part}T{time_part}{offset_hour}:{offset_min}"
    return f"{date_part}T{time_part}Z"


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
    if country and not COUNTRY_CODE_RE.match(country):
        return jsonify({"error": f"Unsupported country code: {country}"}), 400

    headers = {"Authorization": NEWS_API_KEY}
    collected = []
    for category in CATEGORIES:
        params = {"category": category, "language": "en"}
        if country:
            params["country"] = country
        try:
            resp = requests.get(
                f"{NEWS_API_BASE_URL}/search",
                params=params,
                headers=headers,
                timeout=10,
            )
        except requests.RequestException:
            return jsonify({"error": "Unable to reach the news service. Please try again."}), 502

        if not resp.ok:
            return jsonify({"error": f"News API responded with {resp.status_code}"}), 502

        for a in resp.json().get("news", [])[:ARTICLES_PER_CATEGORY]:
            image = a.get("image")
            if not image or image == "None":
                image = ""

            collected.append(
                {
                    "category": category,
                    # Currents has no dedicated publisher field — "author" is
                    # the closest equivalent, though it's sometimes empty or
                    # a byline rather than an outlet name.
                    "source": a.get("author") or "Unknown",
                    "title": a.get("title"),
                    "description": a.get("description") or "",
                    "url": a.get("url"),
                    "image": image,
                    "publishedAt": normalize_published(a.get("published")),
                }
            )

        time.sleep(REQUEST_GAP_SECONDS)

    for i, a in enumerate(collected, start=1):
        a["id"] = i

    return jsonify(collected)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=True)
