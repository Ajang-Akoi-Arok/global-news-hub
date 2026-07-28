# Ajang News Hub

A news reader: browse headlines across seven categories, search/filter/sort
them, and bookmark the ones you want to come back to — no account required.
Signing in is optional and only used to keep your bookmarks tied to an
account instead of just the browser. Built for the "Playing Around with
APIs" assignment.

> **Status:** the app currently runs on realistic **mock data** (shaped
> exactly like a real news API response) so the full UI — auth, search,
> filtering, sorting, bookmarking, loading and error states — can be built
> and demoed before any API key exists. Wiring in a real, live news API is
> the next step; see [Enabling a real API](#enabling-a-real-news-api) below.

## Why this app

Generic API demos (weather, cat facts, jokes) don't require the user to do
anything with the data. This app is built around *interacting* with a real
information stream: narrowing thousands of potential headlines down to what
one person cares about, and letting them keep a personal reading list —
closer to a lightweight Feedly/Pocket than a single API call wrapped in a
page.

## Features

- **Open by default** — the news feed is the landing page, no login wall.
  **Sign in is optional** (see [Auth caveat](#auth-caveat)) and only scopes
  bookmarks to an account instead of the current browser.
- **Search** across title, description, and source.
- **Category filters**: World, Business, Technology, Sports, Health,
  Science, Entertainment.
- **Sort**: newest, oldest, source A–Z, title A–Z.
- **Bookmarks** ("Saved" view) — work as a guest, or sign in to keep them
  tied to an account.
- **Loading skeletons** and a **simulated error + retry** flow, so error
  handling can be demoed without needing to actually take an API offline.
- Clean, light, text-first UI — no decorative icons/emoji, fully responsive,
  no build step, no dependencies.

## Tech stack

Plain HTML, CSS, and JavaScript (no framework, no bundler) — deliberately
simple so it can be copied straight onto a plain web server for Part Two
with no build pipeline required.

## Project structure

```
global-news-hub_digitalaxis/
├── index.html          # News dashboard (entry point, no login required)
├── signin.html           # Optional sign in / sign up page
├── css/styles.css
├── js/
│   ├── auth.js          # Client-side demo auth
│   ├── mockData.js       # Placeholder articles, shaped like a real API response
│   ├── newsApi.js        # Data access layer — fetchArticles(); swap in a real fetch() here later
│   ├── app.js             # Dashboard rendering, search/filter/sort/bookmarks
│   ├── config.example.js # Template — copy to config.js
│   └── config.js          # Gitignored; not committed
└── deploy/
    ├── nginx-global-news-hub.conf
    └── haproxy.cfg
```

## Running locally

No build step or dependencies. From the project root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly via `file://` also works, since everything
is client-side.)

1. Browse, search, filter by category, sort, and bookmark an article — no
   sign-in needed.
2. Optionally click **Sign in** in the header to create an account or use
   **"Continue with demo account"**; this only moves your bookmarks from
   the guest bucket to that account.
3. Try **Simulate error** to see the error/retry state.

### Auth caveat

There is no backend or database yet — accounts are stored in the browser's
`localStorage`, and "passwords" are only base64-obfuscated, not hashed. This
is enough to demonstrate a real, optional sign-up → sign-in flow end to end,
but it is **not** secure authentication and shouldn't be treated as a
security feature. A real deployment would move this to a backend with
proper password hashing (e.g. bcrypt) and server-side sessions.

## Enabling a real news API

The data layer is already isolated in `js/newsApi.js` so this is a small,
contained change once an API is chosen (e.g.
[NewsAPI.org](https://newsapi.org/docs) or
[GNews](https://gnews.io/docs/v4)):

1. `cp js/config.example.js js/config.js` (already gitignored).
2. Set `USE_MOCK_DATA: false` and paste the API key into `NEWS_API_KEY`.
3. In `js/newsApi.js`, replace the commented-out example in the `else`
   branch with a real `fetch()` call, mapping the response into the same
   `{ id, category, source, title, description, url, publishedAt }` shape
   `mockData.js` already uses — nothing in `app.js` needs to change.
4. Credit the API provider here in the README once chosen.

**Never commit `js/config.js`** — it's excluded via `.gitignore` specifically
to keep the real key out of the repo.

## Deployment (Part Two)

This is a static site, so deployment is just: copy the files to each web
server's document root and point nginx (or Apache) at it, then have the
load balancer round-robin between the two.

### 1. Web01 and Web02

```bash
# from your machine
scp -r ./* user@web01:/var/www/global-news-hub/
scp -r ./* user@web02:/var/www/global-news-hub/
```

On each server, install the provided nginx config
(`deploy/nginx-global-news-hub.conf`):

```bash
sudo cp deploy/nginx-global-news-hub.conf /etc/nginx/sites-available/global-news-hub.conf
sudo ln -s /etc/nginx/sites-available/global-news-hub.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Verify each server independently first: `curl http://<web01-ip>/` and
`curl http://<web02-ip>/` should both return the dashboard's HTML, and
`curl http://<web01-ip>/health` should return `ok`.

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

*To be filled in once a live news API is integrated.* Planned candidates:
[NewsAPI.org](https://newsapi.org/) or [GNews](https://gnews.io/) — both
documented, free-tier options suitable for this assignment.

## Challenges

*To be filled in as development continues past the mock-data stage
(e.g. any rate-limit or CORS issues hit once a real API is wired in).*

## Links

- **Repository:** _add GitHub URL here_
- **Live deployment (via load balancer):** _add Lb01 URL here_
- **Demo video:** _add video link here_
- **Demo credentials:** demo account — `demo@globalnewshub.app` /
  `demo1234` (or use "Continue with demo account" / sign up your own)
