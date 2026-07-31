// Data access layer: app.js just awaits fetchArticles(). Calls the Flask
// backend at /api/articles (server/app.py), which proxies Currents server-side
// so the API key never reaches the browser.

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
