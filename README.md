# Welcome to World Realtime News

### A note on screenshots

The 📸 markers throughout this README are placeholders — replace each one with an actual screenshot before submitting.

## Project Overview

**Welcome**, and thank you for taking the time to explore my project.
World Realtime News is a web application that helps users stay informed by providing live news from around the world in one place. Rather than simply displaying headlines, the application allows users to search, filter, sort, and bookmark articles, making it easier to find news that matches their interests and return to it later.
I built this project because I wanted to create something more practical than a typical API demonstration. Many API projects simply fetch and display data, but I wanted to show how an API can be used to build an application that solves a real problem and offers a better user experience. This project challenged me to work with a live REST API, design a responsive user interface, build a secure backend, and deploy the application in a production-like environment using multiple servers and a load balancer.
**World Realtime News** fetches live headlines from the [Currents API](https://currentsapi.services/en/docs/) across seven news categories and any country you filter by. Users can search, filter, sort, and bookmark articles, creating a more personalized reading experience. To keep the application secure, I built a small Python backend that sits between the browser and Currents, ensuring the API key is never exposed in the frontend. I explain this design in more detail in the **Keeping the API Key Safe section** later in this README.
Throughout this README, I'll explain how the application works, the technologies I used, the deployment process, the challenges I encountered, and the decisions I made while building the project.


## Key Features

**Live news, no login wall.** The news feed is the landing page. There's
no account system and no sign-up flow, you land on the page and you're
already looking at real headlines.

**Search.** Typing in the search box filters articles by matching your
text against the title, the description, and the source name, all
case-insensitively. It updates as you type, no submit button needed.

**Category filters.** Seven categories; World, Business, Technology,
Sports, Health, Science, Entertainment. Shown as clickable chips along
the top of the article list. Clicking one narrows the list down to just
that category; clicking "All" clears the filter.

**Country filter.** A dropdown of ISO 3166-1 two-letter country codes.
Unlike the category chips, this one isn't free — the Currents API only
returns headlines for the country you ask for, so there's no way to
filter client-side across countries you haven't fetched yet. Changing it
triggers a fresh fetch instead of an instant re-render.

**Sorting.** Four sort modes: newest first, oldest first, source
alphabetically, and title alphabetically. This applies to the main list
further down the page — the hero carousel and the "Latest Articles" row
at the top always show the newest articles regardless of sort mode,
since their whole purpose is to surface what's freshest.

**Load more instead of dumping everything at once.** The article list
below the hero and Latest Articles sections starts with just 6 articles
and a **Load more** button showing how many more match your current
filters. Clicking it reveals 6 more at a time. Changing any filter
(search, category, sort, saved view) resets it back to 6.

**A helpful empty state.** If nothing matches your filters, instead of
just an empty page it shows "No news found. Try another keyword." and a
**Clear Filters** button that resets search, category, and the saved-view
toggle back to their defaults in one click.

<img width="1505" height="907" alt="Screenshot 2026-07-31 at 4 28 03 AM" src="https://github.com/user-attachments/assets/54e9ac1d-d4e5-4e7b-a9d3-11d239021f4d" />

**Bookmarks.** Every article has a Save/Unsave button. Saved articles are
remembered in the browser, and there's a "Saved" tab that filters the
whole page down to just your bookmarked articles.

**Loading states and error handling.** While articles are being fetched,
the page shows skeleton placeholders instead of a blank screen. If the
fetch fails, a red banner explains what went wrong and offers a Retry
button — the page never just breaks or shows nothing.

**Responsive, text-first design.** No decorative icons or emoji, no
build step, no external JS framework — just HTML, CSS, and vanilla
JavaScript, laid out to work on both desktop and mobile.

## How Articles Get Fetched

The frontend never talks to Currents directly. Instead, `js/newsApi.js`
exposes one function, `fetchArticles()`, that the rest of the app calls
without needing to know where the data actually comes from — it calls
the app's own backend at `/api/articles`, which is where the real
Currents API request happens.

On the backend side, `server/app.py` loops through all seven categories
one at a time, asking Currents' `/search` endpoint for headlines in that
category and keeping the first 4 — that's up to 28 articles per page
load, and one request per category (7 total). Currents' free tier gives
1,000 requests a day, so a small delay between requests is kept mainly as
a safety margin rather than a hard requirement.

If a country was selected in the dropdown, that gets added to every one
of those seven requests as Currents' own `country` parameter — so
"up to 28 articles" becomes "up to 28 articles from that country"
instead. The backend checks that the country code is a plausible 2-letter
code before making any request; an obviously malformed code gets rejected
immediately with a `400` rather than sending a request that would just
come back empty.

Once all seven categories have responded, the backend merges everything
into a single list, gives each article a sequential id, and sends it
back to the browser as JSON. Every article has the same shape:

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

## Search, Filter, and Sort 

Category, search, and sort stack on top of each other rather than
replacing one another. If you're on the World category, sorted
oldest-first, and you type "election" into the search box, the app
applies all three at once: only World articles, containing "election"
somewhere in the title, description, or source, sorted oldest to newest.
Switching categories or sort mode doesn't clear your search term, and
vice versa.

<img width="1510" height="912" alt="Screenshot 2026-07-31 at 4 26 36 AM" src="https://github.com/user-attachments/assets/5e8ca746-2b22-4171-ad00-f351ff55e3e0" /><img width="1498" height="906" alt="Screenshot 2026-07-31 at 4 27 35 AM" src="https://github.com/user-attachments/assets/50cab680-9e27-4230-9ad7-0916d52c8d6a" />


The country dropdown is the odd one out. Category/search/sort all work
by filtering the articles already sitting in the browser, so they update
instantly. Country can't work that way — the Currents API only gives you
headlines for the country you ask for, so there's nothing to filter
locally until you've actually asked for that country's data. Changing
the dropdown re-runs the whole fetch (through the same loading-skeleton flow as the
initial page load) for the new country, and your category/search/sort
choices stay applied to whatever comes back.

## Bookmarks 

Bookmarks are stored in the browser's `localStorage` under one key,
`gnh_bookmarks`, as a list of article ids. There's no backend database
involved — saving an article is instant and doesn't need a network
request, but it also means bookmarks are local to whichever browser you
saved them in. Clearing your browser data or opening the site in a
different browser will start you with an empty bookmark list.

<img width="1470" height="907" alt="Screenshot 2026-07-31 at 4 26 03 AM" src="https://github.com/user-attachments/assets/4a720c89-7159-4410-9330-f9354dbf5929" />


One honest limitation worth knowing about: article ids are assigned
fresh by the backend every time `/api/articles` is called (id `1` is
just "the first article in this response," not a permanent identifier
tied to that specific news story). In practice the top headlines don't
change every few minutes, so ids tend to stay consistent between
reloads in a normal browsing session — but if the underlying headlines
shift, a bookmark could end up pointing at a different article than the
one you originally saved.

## Error Handling 

There are two separate things that can go wrong, and the app handles
them differently:

**While articles are loading**, the page shows gray skeleton boxes in
place of the hero carousel, the latest-articles cards, and the article
list — so the layout doesn't jump around once real content arrives.

**If the fetch fails** — Currents is down, the daily quota is used up, the key
is missing or invalid, or the backend can't be reached at all — the
skeletons are replaced with a red error banner showing a human-readable
message (for example, "News API responded with 403") and a **Retry**
button that re-runs the fetch without needing a full page reload.

<img width="1486" height="889" alt="Screenshot 2026-07-31 at 4 23 24 AM" src="https://github.com/user-attachments/assets/bee57841-7aa8-4e49-b095-b509ade99645" />


There's also a **Simulate error** button in the UI, which deliberately
triggers the error state on demand, so error handling can be shown in a
demo video without needing to actually take an API offline or wait for a
real rate-limit hit.

## Image Fallback (Topic Art)

Not every article Currents returns has a usable image — some are missing
one entirely, and occasionally an image URL is broken or slow to load.
Rather than showing a broken-image icon, `js/topicArt.js` provides a
small, flat SVG illustration for each of the seven categories. If an
article has no image, the illustration is shown immediately; if an
image is present but fails to load in the browser, an `onerror` handler
swaps it out for the same illustration after the fact.

## Keeping the API Key Safe

This is the reason the project has a backend at all. If this were a
purely static site — just HTML, CSS, and JavaScript with no server —
there would be nowhere to hide the Currents API key. Anything written
into a `.js` file is visible to anyone who opens their browser's dev
tools or views the page source, so the key would effectively be public
the moment the site went live.

`server/app.py` solves this by being the only thing that ever talks to
Currents directly. The key is read from a `.env` file on the server (via
`python-dotenv`) and sent to Currents as an `Authorization` header rather
than a URL query parameter, so it doesn't end up sitting in plaintext in
server access logs either. It's never sent to the browser in any form.
`.env` is listed in `.gitignore` so it can never end up committed to the
repository by accident; `.env.example` is checked in instead, as a
template showing what variables are needed without the real values.

## Project Structure

```
global-news-hub_digitalaxis/
├── index.html               
├── css/
│   └── styles.css           
├── js/
│   ├── app.js                
│   ├── newsApi.js           
│   └── topicArt.js          
├── server/
│   └── app.py                 
├── requirements.txt         
├── .env.example               
├── .gitignore
└── deploy/
    ├── nginx-global-news-hub.conf   
    └── haproxy.cfg                   
```

## Requirements

- **Python 3.9+** for the backend.
- The four packages listed in `requirements.txt` — Flask (the web
  framework), requests (for calling Currents), python-dotenv (for
  reading `.env`), and gunicorn (a production-ready server, used when
  deployed).
- A free [Currents API](https://currentsapi.services/en) key — the app
  only runs against live data, so this is required, not optional. See the
  [Currents API documentation](https://currentsapi.services/en/docs/) for
  endpoint details, authentication, and rate limits.
- Any modern browser with JavaScript enabled. No build tools, no
  Node.js, no package manager needed on the frontend side.

## Running Locally

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then paste your Currents key into NEWS_API_KEY
python server/app.py
# open http://localhost:5050
```

This runs the actual Flask app, which serves both the HTML/CSS/JS *and*
the `/api/articles` endpoint. There's no static-only or mock-data mode —
the app always fetches real, live headlines through the backend.

<img width="1128" height="463" alt="Screenshot 2026-07-31 at 3 34 08 AM" src="https://github.com/user-attachments/assets/8e236556-a56c-431c-85a4-9400cc66db2a" />


## Understanding the Interface

The page is laid out top to bottom in a few distinct sections:

1. **Header** — the site name and a search box that filters everything
   below it.
2. **Hero carousel** — the 3 newest articles overall, shown large with
   a bigger image, description, and save button. It auto-advances every
   4 seconds and pauses while your mouse is over it.
3. **Latest Articles** — the next 4 newest articles (not repeating
   anything already in the hero carousel), shown as a horizontally
   scrolling row of smaller cards.
4. **Article list / grid** — everything else, shown 6 at a time with a
   Load More button, each row with a thumbnail, category badge, title,
   short description, and estimated read time.
5. **Category chips, country dropdown, sort dropdown, and the All
   articles / Saved toggle** sit above the list and control what's shown
   in it (the hero and latest-articles sections above are unaffected by
   category/sort/saved — they always show the newest articles overall).
  
<img width="1509" height="911" alt="Screenshot 2026-07-31 at 4 18 24 AM" src="https://github.com/user-attachments/assets/377b6250-826c-469c-8680-65c9758911df" />

## Deployment

I deployed **World Realtime News** using a three-server architecture consisting of two web servers (**Web01** and **Web02**) behind an **HAProxy** load balancer (**Lb01**). Each web server runs the same version of the application, while the load balancer distributes incoming requests between them using a round-robin algorithm. To provide secure access, I also configured HTTPS using a Let's Encrypt SSL certificate and deployed the application under **news.ajangakoi.tech**.

### 1. Deploying the application on Web01 and Web02

I deployed the application to both web servers using the same setup process. First, I cloned the repository, created a Python virtual environment, installed the required dependencies, and configured the environment variables by creating a `.env` file containing my Currents API key.

```bash
git clone https://github.com/Ajang-Akoi-Arok/global-news-hub.git /var/www/global-news-hub
cd /var/www/global-news-hub
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Instead of running Flask's development server, I started the backend with **Gunicorn**, binding it to `127.0.0.1:5050` so that it could only be accessed through Nginx.

```bash
venv/bin/gunicorn -w 2 -b 127.0.0.1:5050 server.app:app --daemon
```

I then configured **Nginx** to serve the frontend files and proxy requests made to `/api/articles` to the Gunicorn backend.

```bash
sudo cp deploy/nginx-global-news-hub.conf /etc/nginx/sites-available/global-news-hub.conf
sudo ln -s /etc/nginx/sites-available/global-news-hub.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Before moving to the load balancer, I verified that each server worked correctly on its own by confirming that the homepage loaded successfully, the `/health` endpoint returned `ok`, and `/api/articles` returned live article data.

### 2. Configuring the Load Balancer

After confirming that both web servers were functioning correctly, I configured **HAProxy** on **Lb01** to distribute requests between Web01 and Web02 using the round-robin balancing algorithm.

```bash
sudo cp deploy/haproxy.cfg /etc/haproxy/haproxy.cfg
haproxy -c -f /etc/haproxy/haproxy.cfg
sudo systemctl reload haproxy
```

I configured health checks so that HAProxy could monitor both backend servers through the `/health` endpoint. I also enabled the HAProxy statistics page, making it easier to monitor traffic distribution and server status during testing.

### 3. Configuring HTTPS

To make the application accessible securely over the internet, I created the subdomain **news.ajangakoi.tech** and pointed it to the load balancer using a DNS A record. I generated a Let's Encrypt SSL certificate with **Certbot**, configured HAProxy to use the certificate, and enabled automatic redirection from HTTP to HTTPS so that all communication with the application is encrypted.

### 4. Verifying the Deployment

Finally, I verified that the deployment was working correctly by sending repeated requests through the load balancer.

```bash
for i in {1..10}; do
    curl -sI https://news.ajangakoi.tech | grep -i x-served-by
done
```

The responses alternated between `web-01` and `web-02`, confirming that HAProxy was successfully distributing requests across both servers. I also tested the application through the browser to verify that HTTPS worked correctly, the Currents API returned live headlines, and all search, filtering, sorting, and bookmarking features behaved as expected.

<img width="845" height="357" alt="Screenshot 2026-07-31 at 3 38 56 AM" src="https://github.com/user-attachments/assets/cc556295-0c9e-46fc-b730-d764114b3202" />


## Deployment Architecture

```text
                               Users
                                 │
                                 ▼
                        https://news.ajangakoi.tech
                                 │
                                 ▼
                        +-------------------+
                        |    DNS (A Record) |
                        +-------------------+
                                 │
                                 ▼
                  +-------------------------------+
                  | Let's Encrypt + Certbot (SSL) |
                  |      HTTPS Termination        |
                  +-------------------------------+
                                 │
                                 ▼
                     +------------------------+
                     |        LB-01           |
                     |        HAProxy         |
                     |  Round Robin + Health  |
                     +------------------------+
                           │            │
             ┌─────────────┘            └─────────────┐
             ▼                                        ▼
+-----------------------------+        +-----------------------------+
|            Web01            |        |            Web02            |
| Nginx                       |        | Nginx                       |
| Gunicorn                    |        | Gunicorn                    |
| Flask                       |        | Flask                       |
+-----------------------------+        +-----------------------------+
             │                                        │
             └──────────────────┬─────────────────────┘
                                ▼
                     +-----------------------+
                     |      Currents API     |
                     |    /search Endpoint   |
                     +-----------------------+
```

### Challenges Encountered

During deployment, I encountered several issues that required debugging. Initially, HAProxy was serving an older SSL certificate, causing HTTPS to fail for the new subdomain. After generating a new certificate and updating the HAProxy configuration, secure access worked correctly. I also discovered that the two web servers were running different Git commits, which resulted in inconsistent behaviour depending on which server handled the request. Synchronising both servers with the latest repository version resolved the issue. Finally, a `MOCK_ARTICLES is not defined` JavaScript error occurred because one server was still serving an outdated frontend. Updating both servers to the same commit eliminated the problem completely.



## Edge Cases Handled

| Case | What happens |
|---|---|
| Daily API quota exhausted / rate limit hit | Error banner shown with a Retry button; no crash, no blank page |
| Article has no image | Category-specific SVG illustration shown instead |
| Image URL is broken or fails to load | Same SVG illustration swapped in automatically |
| Search term matches nothing | "No news found" empty state with a Clear Filters button |
| "Saved" tab with zero bookmarks | Same empty state, so it's clear the list isn't broken, just empty |
| More than 6 articles match the current filters | Only 6 show at first, with a Load more button for the rest |
| Category filter + search combined | Both apply together — results match the category *and* the search term |
| API key missing from `.env` | Backend returns a clear 500 error instead of crashing |
| Malformed country code requested | Backend rejects it with a 400 before making any request to Currents |
| Same article appearing in hero and latest cards | Filtered out of the main list below so it's never shown twice |

## Known Limitations

- **Bookmarks use article ids, not URLs.** As explained above, ids are
  reassigned on every fetch, so a bookmark can technically drift to a
  different article if the top headlines shift between visits.
- **Bookmarks are per-browser.** There's no account system, so they
  don't sync across devices or browsers.
- **No authentication.** Not required by the assignment rubric (it's
  listed only as an optional bonus task), so it isn't implemented.
- **Depends entirely on the Currents API's free tier**, including its
  1,000 requests/day quota and 20-results-per-request cap — there's no
  mock-data mode to fall back on if the quota runs out or the key stops
  working.
- **"Source" is really the article's author field.** Currents doesn't
  return a dedicated publisher/outlet field the way some news APIs do —
  the closest equivalent is `author`, which is sometimes a byline,
  sometimes the outlet name, and sometimes empty (shown as "Unknown").

## Challenges

The app originally ran on NewsData.io, but its free tier's 200
requests-a-day quota ran out during development and testing — every page
load costs 7 requests (one per category), so that's only about 28 full
page loads a day. That pushed me to switch providers to the Currents API
partway through the project, which has a much more generous 1,000
requests/day free tier. Swapping providers meant rewriting the fetch
logic in `server/app.py`: a different base URL and endpoint (`/search`
instead of `/latest`), the API key moving from a URL query parameter to
an `Authorization` header, the response's article list living under a
different JSON key (`news` instead of `results`), and normalizing a
differently-formatted published-date string. Because the frontend only
ever talks to the backend's own `/api/articles` shape (never to the news
API directly), none of that swap touched `js/` at all.

The other challenge was that a purely static site can't keep an API key
secret — anything in the JS is visible in view-source. That's the reason
for the Flask backend: the frontend calls `/api/articles` on the same
origin, and the real Currents key only ever lives server-side in `.env`.

## Acknowledgements

I would like to thank the developers and communities behind the technologies that made this project possible:

* **Currents API** for providing the live news API used in this
  application — see their [API documentation](https://currentsapi.services/en/docs/)
  for endpoint and rate-limit details.
* **Flask** and **Gunicorn** for powering the backend.
* **Nginx** and **HAProxy** for serving and load balancing the application.
* **Certbot** and **Let's Encrypt** for enabling HTTPS with free SSL certificates.
* **python-dotenv** for securely managing environment variables and protecting the API key.

I appreciate the work of these communities in providing reliable tools that helped me build, secure, and deploy this project.

## Links

- **Repository:** https://github.com/Ajang-Akoi-Arok/global-news-hub
- **Live deployment (via load balancer):** _add Lb01 URL here once deployed_
- **Demo video:** _add video link here once recorded_
