/*
 * Since articles are placeholder mock data (no real photos exist for them),
 * each category gets a small abstract illustration instead of a stock photo
 * or an emoji "sticker" — a flat, editorial-style graphic that visually
 * signals the topic without pretending to depict the specific event.
 * Swap this for real article thumbnails (a.urlToImage) once a live API
 * is wired in — see js/newsApi.js.
 */

const TOPIC_ART = {
  world: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="34" stroke="#2f5bea" stroke-width="2.5"/>
      <ellipse cx="50" cy="50" rx="34" ry="14" stroke="#2f5bea" stroke-width="2"/>
      <ellipse cx="50" cy="50" rx="14" ry="34" stroke="#2f5bea" stroke-width="2"/>
      <line x1="16" y1="50" x2="84" y2="50" stroke="#2f5bea" stroke-width="2"/>
    </svg>`,
  business: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="58" width="12" height="26" fill="#7c3aed"/>
      <rect x="40" y="42" width="12" height="42" fill="#7c3aed"/>
      <rect x="60" y="26" width="12" height="58" fill="#7c3aed"/>
      <polyline points="18,54 46,36 68,20 82,20" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  technology: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="30" r="6" fill="#0f766e"/>
      <circle cx="76" cy="24" r="6" fill="#0f766e"/>
      <circle cx="70" cy="70" r="6" fill="#0f766e"/>
      <circle cx="26" cy="72" r="6" fill="#0f766e"/>
      <circle cx="50" cy="50" r="7" fill="#0f766e"/>
      <line x1="29" y1="34" x2="45" y2="46" stroke="#0f766e" stroke-width="2"/>
      <line x1="71" y1="29" x2="55" y2="45" stroke="#0f766e" stroke-width="2"/>
      <line x1="65" y1="66" x2="55" y2="55" stroke="#0f766e" stroke-width="2"/>
      <line x1="31" y1="68" x2="44" y2="55" stroke="#0f766e" stroke-width="2"/>
    </svg>`,
  sports: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="30" x2="90" y2="10" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>
      <line x1="10" y1="55" x2="90" y2="35" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>
      <line x1="10" y1="80" x2="90" y2="60" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>
      <circle cx="72" cy="78" r="10" stroke="#15803d" stroke-width="3"/>
    </svg>`,
  health: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="12,55 32,55 40,35 50,70 60,45 68,55 88,55" stroke="#b91c1c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  science: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="5" fill="#4338ca"/>
      <ellipse cx="50" cy="50" rx="38" ry="15" stroke="#4338ca" stroke-width="2"/>
      <ellipse cx="50" cy="50" rx="38" ry="15" stroke="#4338ca" stroke-width="2" transform="rotate(60 50 50)"/>
      <ellipse cx="50" cy="50" rx="38" ry="15" stroke="#4338ca" stroke-width="2" transform="rotate(120 50 50)"/>
    </svg>`,
  entertainment: `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="24" width="72" height="52" rx="4" stroke="#c2410c" stroke-width="2.5"/>
      <line x1="14" y1="24" x2="30" y2="40" stroke="#c2410c" stroke-width="2.5"/>
      <line x1="34" y1="24" x2="50" y2="40" stroke="#c2410c" stroke-width="2.5"/>
      <line x1="54" y1="24" x2="70" y2="40" stroke="#c2410c" stroke-width="2.5"/>
      <line x1="74" y1="24" x2="86" y2="34" stroke="#c2410c" stroke-width="2.5"/>
    </svg>`,
};

function topicArtFor(category) {
  return TOPIC_ART[category] || TOPIC_ART.world;
}
