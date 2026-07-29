# Ajang News Hub

## Project Overview

Ajang News Hub is a news reader built for the "Playing Around with APIs"
assignment. The idea behind it is simple: most API demo projects (weather
apps, cat fact generators, joke generators) just show you data and stop
there — you look at it once and move on. This project is built around
actually *using* the data: narrowing down a stream of headlines to the
ones a specific person cares about, and letting them keep a personal
reading list of articles to come back to. It's closer to a small,
personal version of Feedly or Pocket than a single API call wrapped in a
web page.

The app fetches real, live headlines from [GNews](https://gnews.io/docs/v4)
across seven categories, lets you search, filter, and sort them, and lets
you bookmark the ones you want to keep. A small Python backend sits
between the browser and GNews so the API key never has to be exposed in
the frontend code — more on why that matters in
[Keeping the API key safe](#keeping-the-api-key-safe) below.

## Key Features

**Live news, no login wall.** The news feed is the landing page. There's
no account system and no sign-up flow — you land on the page and you're
already looking at real headlines.

**Search.** Typing in the search box filters articles by matching your
text against the title, the description, and the source name, all
case-insensitively. It updates as you type, no submit button needed.

**Category filters.** Seven categories — World, Business, Technology,
Sports, Health, Science, Entertainment — shown as clickable chips along
the top of the article list. Clicking one narrows the list down to just
that category; clicking "All" clears the filter.

**Sorting.** Four sort modes: newest first, oldest first, source
alphabetically, and title alphabetically. This applies to the main list
further down the page — the hero carousel and the "Latest Articles" row
at the top always show the newest articles regardless of sort mode,
since their whole purpose is to surface what's freshest.

**Bookmarks.** Every article has a Save/Unsave button. Saved articles are
remembered in the browser (see [Bookmarks — explained](#bookmarks--explained)
for exactly how), and there's a "Saved" tab that filters the whole page
down to just your bookmarked articles.

**Loading states and error handling.** While articles are being fetched,
the page shows skeleton placeholders instead of a blank screen. If the
fetch fails, a red banner explains what went wrong and offers a Retry
button — the page never just breaks or shows nothing. See
[Error handling — explained](#error-handling--explained) for the details.

**Responsive, text-first design.** No decorative icons or emoji, no
build step, no external JS framework — just HTML, CSS, and vanilla
JavaScript, laid out to work on both desktop and mobile.

## How Articles Get Fetched

The frontend never talks to GNews directly. Instead, `js/newsApi.js`
exposes one function, `fetchArticles()`, that the rest of the app calls
without needing to know where the data actually comes from. Depending on
`js/config.js`, that function either:

- returns the placeholder data in `js/mockData.js` immediately (useful
  for looking at the UI without needing an API key, or as a fallback if
  GNews' rate limit gets hit while demoing), or
- calls the app's own backend at `/api/articles`, which is where the
  real GNews request happens.

On the backend side, `server/app.py` loops through all seven categories
one at a time, asking GNews for up to 4 headlines from each — that's up
to 28 articles per page load. It waits about a third of a second between
each category request, because GNews' free tier returns a `429 Too Many
Requests` error if you send several requests back-to-back too quickly.
Spacing them out costs a couple of extra seconds of load time, but keeps
every request under the limit.

Once all seven categories have responded, the backend merges everything
into a single list, gives each article a sequential id, and sends it
back to the browser as JSON. Every article — whether it came from GNews
or from the mock data file — has the same shape:

```json
{
  "id": 1,
  "category": "world",
  "source": "Reuters",
  "title": "Example headline",
  "description": "A short summary of the article.",
  "url": "https://example.com/article",
  "image": "https://example.com/image.jpg",
  "publishedAt": "2026-07-29T09:15:00Z"
}
```

Because both data sources use the exact same shape, `js/app.js` — the
part of the app that actually renders articles onto the page — never
needs to know or care which one it's looking at.

## Search, Filter, and Sort — Explained

These three features stack on top of each other rather than replacing
one another. If you're on the World category, sorted oldest-first, and
you type "election" into the search box, the app applies all three at
once: only World articles, containing "election" somewhere in the title,
description, or source, sorted oldest to newest. Switching categories or
sort mode doesn't clear your search term, and vice versa.

The "Saved" tab works a little differently — it swaps the article list
entirely for just your bookmarked articles, but category filtering,
searching, and sorting still work normally on top of that shortened list.

## Bookmarks — Explained

Bookmarks are stored in the browser's `localStorage` under one key,
`gnh_bookmarks`, as a list of article ids. There's no backend database
involved — saving an article is instant and doesn't need a network
request, but it also means bookmarks are local to whichever browser you
saved them in. Clearing your browser data or opening the site in a
different browser will start you with an empty bookmark list.

One honest limitation worth knowing about: article ids are assigned
fresh by the backend every time `/api/articles` is called (id `1` is
just "the first article in this response," not a permanent identifier
tied to that specific news story). In practice GNews' top headlines
don't change every few minutes, so ids tend to stay consistent between
reloads in a normal browsing session — but if the underlying headlines
shift, a bookmark could end up pointing at a different article than the
one you originally saved. This is a normal trade-off for a project this
size; fixing it properly would mean bookmarking by article URL instead
of by id.

## Error Handling — Explained

There are two separate things that can go wrong, and the app handles
them differently:

**While articles are loading**, the page shows gray skeleton boxes in
place of the hero carousel, the latest-articles cards, and the article
list — so the layout doesn't jump around once real content arrives, and
it's clear to the user that something is happening rather than the page
just being broken.

**If the fetch fails** — GNews is down, the rate limit gets hit, the key
is missing or invalid, or the backend can't be reached at all — the
skeletons are replaced with a red error banner showing a human-readable
message (for example, "News API responded with 403") and a **Retry**
button that re-runs the fetch without needing a full page reload. The
backend (`server/app.py`) is what generates these messages: it catches
network exceptions and non-200 responses from GNews and turns them into
a clear JSON error instead of letting the request hang or crash.

There's also a **Simulate error** button in the UI, which deliberately
triggers the error state on demand. It exists purely so error handling
can be demonstrated (in a demo video, for example) without needing to
actually take an API offline or wait for a real rate-limit hit.

## Image Fallback (Topic Art)

Not every article GNews returns has a usable image — some are missing
one entirely, and occasionally an image URL is broken or slow to load.
Rather than showing a broken-image icon, `js/topicArt.js` provides a
small, flat SVG illustration for each of the seven categories. If an
article has no image, the illustration is shown immediately; if an
image is present but fails to load in the browser, an `onerror` handler
swaps it out for the same illustration after the fact.

## Keeping the API Key Safe

This is the reason the project has a backend at all. If this were a
purely static site — just HTML, CSS, and JavaScript with no server —
there would be nowhere to hide the GNews API key. Anything written into
a `.js` file is visible to anyone who opens their browser's dev tools or
views the page source, so the key would effectively be public the
moment the site went live.

`server/app.py` solves this by being the only thing that ever talks to
GNews directly. The key is read from a `.env` file on the server (via
`python-dotenv`) and is never sent to the browser in any form — the
frontend only ever calls `/api/articles` on its own origin, and the
backend does the real request on its behalf. `.env` is listed in
`.gitignore` specifically so it can never end up committed to the
repository by accident; `.env.example` is checked in instead, as a
template showing what variables are needed without the real values.

## Project Structure

```
global-news-hub_digitalaxis/
├── index.html               # The news dashboard — the only page in the app
├── css/
│   └── styles.css           # All styling for the dashboard
├── js/
│   ├── app.js                # Renders articles, handles search/filter/sort/bookmarks
│   ├── newsApi.js            # fetchArticles() — the only place that decides mock vs. live
│   ├── mockData.js           # Placeholder articles, shaped exactly like a real API response
│   ├── topicArt.js           # SVG fallback art per category
│   ├── config.example.js    # Template for config.js
│   └── config.js             # Gitignored — your local copy, toggles mock vs. live data
├── server/
│   └── app.py                 # Flask backend — serves the frontend and calls GNews securely
├── requirements.txt          # Python packages needed to run the backend
├── .env.example               # Template showing what goes in .env (never the real key)
├── .gitignore
└── deploy/
    ├── nginx-global-news-hub.conf   # Serves the static files, proxies /api/ to the backend
    └── haproxy.cfg                   # Load balancer config for Web01/Web02
```

## Requirements

- **Python 3.9+** for the backend.
- The four packages listed in `requirements.txt` — Flask (the web
  framework), requests (for calling GNews), python-dotenv (for reading
  `.env`), and gunicorn (a production-ready server, used when deployed).
- A free [GNews](https://gnews.io/) API key, if you want live data
  instead of the built-in mock data.
- Any modern browser with JavaScript enabled. No build tools, no
  Node.js, no package manager needed on the frontend side.

## Running Locally

### With live data (the real setup)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then paste your GNews key into NEWS_API_KEY
python server/app.py
# open http://localhost:5050
```

This runs the actual Flask app, which serves both the HTML/CSS/JS *and*
the `/api/articles` endpoint — this is the mode that shows real,
up-to-date headlines.

### Without a backend (mock data only)

If you just want to look at the interface without setting up a GNews key
or a Python environment, open `js/config.js` and set `USE_MOCK_DATA:
true`. Then either open `index.html` directly in a browser (via
`file://`), or serve the folder with:

```bash
python3 -m http.server 8000
```

In this mode every feature works exactly the same — search, filter,
sort, bookmarks, error simulation — just against the placeholder
articles in `js/mockData.js` instead of real headlines.

## Understanding the Interface

The page is laid out top to bottom in a few distinct sections:

1. **Header** — the site name, a search box that filters everything
   below it, live at all times.
2. **Hero carousel** — the 3 newest articles overall, shown large with
   a bigger image, description, and save button. It auto-advances every
   4 seconds and pauses while your mouse is over it.
3. **Latest Articles** — the next 4 newest articles (not repeating
   anything already in the hero carousel), shown as a horizontally
   scrolling row of smaller cards.
4. **Article list / grid** — everything else, shown as a simple list
   with a thumbnail, category badge, title, short description, and
   estimated read time (calculated from the description length, since
   the API only gives a short summary rather than the full article
   text — so it's an approximation, not a true reading-time estimate).
5. **Category chips and sort dropdown**, and an **All articles / Saved**
   toggle, sit above the list and control what's shown in it (the hero
   and latest-articles sections above are unaffected by these — they
   always show the newest articles).

## Deployment (Part Two)

Each web server needs to run two things: the Flask backend (so
`/api/articles` actually works) and nginx in front of it, serving the
static frontend and proxying API calls through to Flask. The load
balancer then just round-robins between the two servers.

### 1. Web01 and Web02

Copy the code over and set the backend up the same way as local:

```bash
scp -r ./* user@web01:/var/www/global-news-hub/
ssh user@web01
cd /var/www/global-news-hub
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # paste in the real NEWS_API_KEY
```

Run it with gunicorn instead of Flask's built-in dev server, bound to
localhost only — nginx is what actually faces the internet:

```bash
venv/bin/gunicorn -w 2 -b 127.0.0.1:5050 server.app:app --daemon
```

(Worth wrapping that in a systemd service so it survives a reboot, but a
plain `--daemon` is enough to get this working.)

Then install the provided nginx config, which serves the static files
and proxies `/api/` to the gunicorn process above:

```bash
sudo cp deploy/nginx-global-news-hub.conf /etc/nginx/sites-available/global-news-hub.conf
sudo ln -s /etc/nginx/sites-available/global-news-hub.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Repeat on Web02. Verify each server independently before touching the
load balancer: `curl http://<web01-ip>/` should return the dashboard's
HTML, `curl http://<web01-ip>/health` should return `ok`, and
`curl http://<web01-ip>/api/articles` should return real article JSON
(not a 404).

### 2. Lb01 (HAProxy)

Use `deploy/haproxy.cfg` as a starting point — fill in the real private
IPs for Web01/Web02, then:

```bash
sudo cp deploy/haproxy.cfg /etc/haproxy/haproxy.cfg
haproxy -c -f /etc/haproxy/haproxy.cfg   # validate syntax first
sudo systemctl reload haproxy
```

It's configured for round-robin balancing with an HTTP health check
against `/health` on each backend, plus a stats page on `:8404/stats`
for confirming traffic is actually being split between both servers.

### 3. Verifying load balancing

```bash
for i in {1..10}; do curl -s -o /dev/null -w "%{http_code}\n" http://<lb01-ip>/; done
```

To directly confirm both backends are serving traffic, temporarily add a
distinguishing HTML comment to `index.html` on each server (e.g.
`<!-- web01 -->` vs `<!-- web02 -->`) and repeatedly curl the load
balancer address, or watch the HAProxy stats page while refreshing the
app in a browser.

## Edge Cases Handled

| Case | What happens |
|---|---|
| GNews rate limit hit (429/403) | Error banner shown with a Retry button; no crash, no blank page |
| Article has no image | Category-specific SVG illustration shown instead |
| Image URL is broken or fails to load | Same SVG illustration swapped in automatically |
| Search term matches nothing | "No articles found" empty state shown instead of a blank grid |
| "Saved" tab with zero bookmarks | Same empty state, so it's clear the list isn't broken, just empty |
| Category filter + search combined | Both apply together — results match the category *and* the search term |
| GNews key missing from `.env` | Backend returns a clear 500 error instead of crashing |
| GNews unreachable / times out | Backend catches the network error and returns a clear message instead of hanging |
| Same article appearing in hero and latest cards | Filtered out of the main list below so it's never shown three times |

## Challenges

The main one was GNews's free-tier rate limit — firing off requests for
all seven categories at once got 429s back almost immediately. Fixed by
spacing the requests out server-side (`REQUEST_GAP_SECONDS` in
`server/app.py`) instead of sending them in parallel, which costs a
couple of seconds of load time but stays under the limit.

The other was that a purely static site can't keep an API key secret —
anything in the JS is visible in view-source. That's the reason for the
Flask backend: the frontend calls `/api/articles` on the same origin,
and the real GNews key only ever lives server-side in `.env`.

## API Credit

Live headlines come from [GNews](https://gnews.io/docs/v4) — a free,
well-documented REST API. All article text, images, and source names
shown in the app are theirs; this project is just a reader/filter layer
built on top of their `/top-headlines` endpoint.

## Links

- **Repository:** https://github.com/Ajang-Akoi-Arok/global-news-hub
- **Live deployment (via load balancer):** _add Lb01 URL here_
- **Demo video:** _add video link here_
