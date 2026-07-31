/*
 * Data access layer. Everything else in the app (app.js) calls
 * fetchArticles() and awaits a promise — it does not know or care about
 * the HTTP details underneath.
 *
 * Calls the app's own Flask backend at /api/articles (see server/app.py),
 * which calls the Currents API (https://currentsapi.services/en/docs/)
 * server-side across all seven categories and returns them pre-merged.
 * The API key never reaches the browser.
 */

async function fetchArticles({ forceError = false, country = "" } = {}) {
  if (forceError) {
    throw new Error("Unable to reach the news service. Please try again.");
  }

  const url = country ? `/api/articles?country=${encodeURIComponent(country)}` : "/api/articles";
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `News API responded with ${res.status}`);
  }
  return data;
}
