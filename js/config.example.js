/*
 * Copy this file to js/config.js (already gitignored). The real GNews key
 * lives server-side in .env (see .env.example / server/app.py) — this file
 * only controls whether the frontend uses mock or live data.
 */

const CONFIG = {
  // false once the Flask backend (server/app.py) is running with a real key.
  USE_MOCK_DATA: true,
};
