/*
 * Data access layer. Everything else in the app (app.js) calls
 * fetchArticles() and awaits a promise — it does not know or care whether
 * the data came from mock data or a real HTTP request.
 *
 * Live source: the app's own Flask backend at /api/articles (see
 * server/app.py), which calls GNews (https://gnews.io/docs/v4) server-side
 * across all seven categories and returns them pre-merged in the same
 * shape mockData.js uses. The GNews API key never reaches the browser.
 */

function simulateNetworkDelay(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchArticles({ forceError = false } = {}) {
  await simulateNetworkDelay();

  if (forceError) {
    throw new Error("Unable to reach the news service. Please try again.");
  }

  if (typeof CONFIG === "undefined" || CONFIG.USE_MOCK_DATA) {
    return MOCK_ARTICLES;
  }

  const res = await fetch("/api/articles");
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `News API responded with ${res.status}`);
  }
  return data;
}
