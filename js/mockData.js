/*
 * Placeholder article data shaped like a typical news API response
 * (NewsData.io style: source, title, description, url, publishedAt).
 * Swapping js/newsApi.js to call a real endpoint later requires no changes
 * to app.js, since it already consumes fetchArticles() as a promise.
 */

const CATEGORY_LABELS = {
  world: "World",
  business: "Business",
  technology: "Technology",
  sports: "Sports",
  health: "Health",
  science: "Science",
  entertainment: "Entertainment",
};

const MOCK_ARTICLES = [
  { id: 1, category: "world", country: "ke", source: "Global Wire", title: "UN Summit Reaches Draft Agreement on Cross-Border Water Rights", description: "Delegates from 40 countries agreed on a framework to mediate disputes over shared river basins.", url: "#", publishedAt: "2026-07-27T09:15:00Z" },
  { id: 2, category: "world", country: "gb", source: "Continental Press", title: "Regional Trade Bloc Expands to Include Two New Member States", description: "The move is expected to lower tariffs on agricultural exports starting next fiscal year.", url: "#", publishedAt: "2026-07-26T14:02:00Z" },
  { id: 3, category: "business", country: "us", source: "Market Daily", title: "Central Bank Holds Interest Rates Steady Amid Inflation Cooldown", description: "Policymakers cited slowing consumer prices as justification for pausing further hikes.", url: "#", publishedAt: "2026-07-27T07:40:00Z" },
  { id: 4, category: "business", country: "ng", source: "Ledger Times", title: "Startup Funding Rebounds After Two Quarters of Decline", description: "Venture capital deployment rose 18% quarter-over-quarter, led by climate and health tech.", url: "#", publishedAt: "2026-07-25T11:20:00Z" },
  { id: 5, category: "technology", country: "us", source: "ByteLine", title: "Open-Source Model Matches Proprietary Systems on Reasoning Benchmarks", description: "Researchers released weights and training details, reigniting debate over closed vs open AI.", url: "#", publishedAt: "2026-07-27T05:55:00Z" },
  { id: 6, category: "technology", country: "jp", source: "Circuit Report", title: "New Undersea Cable Promises to Cut Regional Latency in Half", description: "The 4,200km cable connects three coastal hubs and is set to go live by year-end.", url: "#", publishedAt: "2026-07-24T16:10:00Z" },
  { id: 7, category: "sports", country: "gb", source: "Pitch Report", title: "Underdog Squad Advances to Semifinal After Penalty Shootout Thriller", description: "A last-minute equalizer forced extra time before the decisive shootout.", url: "#", publishedAt: "2026-07-27T20:30:00Z" },
  { id: 8, category: "sports", country: "za", source: "Track & Field Wire", title: "National Record Broken Twice in Same Afternoon at Regional Meet", description: "Two athletes traded the 400m record within a span of 45 minutes.", url: "#", publishedAt: "2026-07-23T18:45:00Z" },
  { id: 9, category: "health", country: "in", source: "Health Beat", title: "Trial Shows Promise for Low-Cost Diagnostic Tool in Rural Clinics", description: "The portable device delivered results comparable to lab testing at a fraction of the cost.", url: "#", publishedAt: "2026-07-26T08:00:00Z" },
  { id: 10, category: "health", country: "gh", source: "Wellness Wire", title: "Health Ministry Launches Nationwide Vaccination Awareness Campaign", description: "The campaign targets underserved regions with mobile clinics and community outreach.", url: "#", publishedAt: "2026-07-22T13:25:00Z" },
  { id: 11, category: "science", country: "us", source: "Discovery Journal", title: "Astronomers Detect Signs of Water Vapor on Nearby Exoplanet", description: "The finding adds to a growing list of potentially habitable candidates within 50 light-years.", url: "#", publishedAt: "2026-07-27T02:12:00Z" },
  { id: 12, category: "science", country: "au", source: "Field Notes", title: "Coral Restoration Project Reports Record Survival Rates", description: "Marine biologists credit a new lab-grown fragment technique for the improvement.", url: "#", publishedAt: "2026-07-21T10:05:00Z" },
  { id: 13, category: "entertainment", country: "us", source: "Culture Desk", title: "Independent Film Wins Top Prize at International Festival", description: "The low-budget drama beat out several major studio productions for the grand jury award.", url: "#", publishedAt: "2026-07-26T19:50:00Z" },
  { id: 14, category: "entertainment", country: "gb", source: "Stagecraft", title: "Touring Musical Announces Extended Run After Sold-Out Opening Week", description: "Producers added twelve additional dates across three cities.", url: "#", publishedAt: "2026-07-20T15:30:00Z" },
  { id: 15, category: "business", country: "eg", source: "Market Daily", title: "Currency Volatility Prompts Exporters to Hedge Further Out", description: "Analysts say firms are locking in rates up to 18 months ahead, longer than usual.", url: "#", publishedAt: "2026-07-19T09:00:00Z" },
  { id: 16, category: "technology", country: "de", source: "ByteLine", title: "Regulator Proposes New Rules for App Store Payment Systems", description: "The draft rules would require platforms to allow third-party payment processing.", url: "#", publishedAt: "2026-07-18T12:40:00Z" },
  { id: 17, category: "world", country: "ke", source: "Global Wire", title: "Drought-Hit Region Sees First Significant Rainfall in Eight Months", description: "Farmers cautiously welcomed the rain, though officials warn recovery will take seasons.", url: "#", publishedAt: "2026-07-17T06:20:00Z" },
  { id: 18, category: "sports", country: "us", source: "Pitch Report", title: "Veteran Coach Steps Down After Two Decades Leading National Team", description: "A successor is expected to be named before the next qualifying cycle begins.", url: "#", publishedAt: "2026-07-16T17:15:00Z" },
  { id: 19, category: "health", country: "us", source: "Health Beat", title: "Study Links Urban Green Space Access to Lower Stress Markers", description: "Researchers tracked over 3,000 participants across twelve cities for the two-year study.", url: "#", publishedAt: "2026-07-15T11:55:00Z" },
  { id: 20, category: "science", country: "in", source: "Discovery Journal", title: "New Battery Chemistry Could Cut Charging Time to Under Ten Minutes", description: "The lab-scale prototype still needs to prove viable at commercial manufacturing scale.", url: "#", publishedAt: "2026-07-14T08:30:00Z" },
];
