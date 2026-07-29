# Ajang News Hub

A news reader: browse headlines across seven categories, search/filter/sort
them, and bookmark the ones you want to come back to. Built for the
"Playing Around with APIs" assignment.

> **Status:** wired up to live headlines from [GNews](https://gnews.io/docs/v4)
> through a small Flask backend, so the API key never has to sit in browser
> JS. Mock data is still in the repo and can be flipped on in `js/config.js`
> if you want to poke at the UI without depending on GNews' free-tier rate
> limit — see [How the live API works](#how-the-live-api-works) below.

## Why this app

Generic API demos (weather, cat facts, jokes) don't require the user to do
anything with the data. This app is built around *interacting* with a real
information stream: narrowing thousands of potential headlines down to what
one person cares about, and letting them keep a personal reading list —
closer to a lightweight Feedly/Pocket than a single API call wrapped in a
page.

## Features

- **Open by default** — the news feed is the landing page, no login wall.
- **Search** across title, description, and source.
- **Category filters**: World, Business, Technology, Sports, Health,
  Science, Entertainment.
- **Sort**: newest, oldest, source A–Z, title A–Z.
- **Bookmarks** ("Saved" view), stored in the browser.
- **Loading skeletons** and a **simulated error + retry** flow, so error
  handling can be demoed without needing to actually take an API offline.
- Clean, light, text-first UI — no decorative icons/emoji, fully responsive,
  no build step, no dependencies.

## Tech stack

Frontend is plain HTML, CSS, and JavaScript — no framework, no bundler.
The backend is a small Flask app that exists for one reason: keep the
GNews API key server-side instead of shipping it to the browser.

## Project structure

```
global-news-hub_digitalaxis/
├── index.html             # News dashboard (entry point, no login required)
├── css/styles.css
├── js/
│   ├── mockData.js        # Placeholder articles, shaped like a real API response
│   ├── newsApi.js         # Data access layer — fetchArticles()
│   ├── app.js              # Dashboard rendering, search/filter/sort/bookmarks
│   ├── topicArt.js         # Fallback illustration when an article has no image
│   ├── config.example.js  # Template — copy to config.js
│   └── config.js           # Gitignored; toggles mock vs. live data
├── server/
│   └── app.py               # Flask backend — serves the frontend + /api/articles
├── requirements.txt        # flask, requests, gunicorn, python-dotenv
├── .env.example             # Template for NEWS_API_KEY — copy to .env
└── deploy/
    ├── nginx-global-news-hub.conf   # Serves static files, proxies /api/ to gunicorn
    └── haproxy.cfg
```

## Running locally

### With live data (the real setup)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then paste your GNews key into NEWS_API_KEY
python server/app.py
# open http://localhost:5050
```

Flask serves both the frontend and `/api/articles`, so this is the way to
run the actual app rather than a plain static server.

### Without a backend (mock data only)

If you just want to look at the UI without a GNews key, set
`USE_MOCK_DATA: true` in `js/config.js` and either open `index.html`
directly via `file://`, or serve it with `python3 -m http.server 8000` —
no Flask needed for this mode.

1. Browse, search, filter by category, sort, and bookmark an article.
2. Try **Simulate error** to see the error/retry state.

## How the live API works

`server/app.py` calls GNews's `/top-headlines` endpoint once per category
(world, business, technology, sports, health, science, entertainment),
with a short delay between each call — GNews's free tier throws 429s on
bursts of simultaneous requests, so firing all seven at once doesn't work.
The results get merged into one array, given sequential ids, and sent back
as JSON.

The frontend (`js/newsApi.js`) just calls `fetchArticles()` and doesn't
know or care whether the data came from that endpoint or from
`mockData.js` — same shape either way, so `app.js` never has to change.

**Never commit `.env`** — it holds the real GNews key and is gitignored
specifically to keep it out of the repo.

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

Run it with gunicorn instead of Flask's dev server, bound to localhost
only — nginx is what actually faces the internet:

```bash
venv/bin/gunicorn -w 2 -b 127.0.0.1:5050 server.app:app --daemon
```

(Worth wrapping that in a systemd service so it survives a reboot, but a
plain `--daemon` is enough to get this working.)

Then install the provided nginx config, which serves the static files and
proxies `/api/` to the gunicorn process above:

```bash
sudo cp deploy/nginx-global-news-hub.conf /etc/nginx/sites-available/global-news-hub.conf
sudo ln -s /etc/nginx/sites-available/global-news-hub.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Repeat on Web02. Verify each server independently before touching the load
balancer: `curl http://<web01-ip>/` should return the dashboard's HTML,
`curl http://<web01-ip>/health` should return `ok`, and
`curl http://<web01-ip>/api/articles` should return real article JSON
(not a 404).

### 2. Lb01 (HAProxy)

Use `deploy/haproxy.cfg` as a starting point — fill in the real private IPs
for Web01/Web02, then:

```bash
sudo cp deploy/haproxy.cfg /etc/haproxy/haproxy.cfg
haproxy -c -f /etc/haproxy/haproxy.cfg   # validate syntax first
sudo systemctl reload haproxy
```

It's configured for round-robin balancing with an HTTP health check against
`/health` on each backend, plus a stats page on `:8404/stats` for confirming
traffic is actually being split between both servers.

### 3. Verifying load balancing

```bash
for i in {1..10}; do curl -s -o /dev/null -w "%{http_code}\n" http://<lb01-ip>/; done
```

To directly confirm both backends are serving traffic, temporarily add a
distinguishing HTML comment to `index.html` on each server (e.g. `<!-- web01
-->` vs `<!-- web02 -->`) and repeatedly curl the load balancer address,
or watch the HAProxy stats page while refreshing the app in a browser.

## API credit

Live headlines come from [GNews](https://gnews.io/docs/v4) — free tier,
no cost, well-documented REST API. All article text, images, and source
names shown above are theirs; this app is just a reader/filter layer on
top of their `/top-headlines` endpoint.

## Challenges

The main one was GNews's free-tier rate limit — firing off requests for
all seven categories at once got 429s back almost immediately. Fixed by
spacing the requests out server-side (`REQUEST_GAP_SECONDS` in
`server/app.py`) instead of sending them in parallel, which costs a couple
of seconds of load time but stays under the limit.

The other was that a purely static site can't keep an API key secret —
anything in the JS is visible in view-source. That's the reason for the
Flask backend: the frontend calls `/api/articles` on the same origin, and
the real GNews key only ever lives server-side in `.env`.

## Links

- **Repository:** https://github.com/Ajang-Akoi-Arok/global-news-hub
- **Live deployment (via load balancer):** _add Lb01 URL here_
- **Demo video:** _add video link here_
