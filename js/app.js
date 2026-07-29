const BOOKMARKS_KEY = "gnh_bookmarks";

function getBookmarks() {
  try {
    return new Set(JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || []);
  } catch {
    return new Set();
  }
}

function toggleBookmark(id) {
  const bookmarks = getBookmarks();
  if (bookmarks.has(id)) {
    bookmarks.delete(id);
  } else {
    bookmarks.add(id);
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]));
  return bookmarks;
}

const LATEST_CARDS_COUNT = 4;
const HERO_CAROUSEL_COUNT = 3;
const INITIAL_VISIBLE = 6;
const LOAD_MORE_STEP = 6;

// --- State ---
let allArticles = [];
let heroArticleIds = [];
let latestCardIds = [];
let activeCategory = "all";
let activeView = "all";
let activeCountry = "";
let sortMode = "newest";
let searchTerm = "";
let visibleCount = INITIAL_VISIBLE;

function resetVisibleCount() {
  visibleCount = INITIAL_VISIBLE;
}

// --- DOM refs ---
const grid = document.getElementById("article-grid");
const loadingGrid = document.getElementById("loading-grid");
const emptyState = document.getElementById("empty-state");
const resultsCount = document.getElementById("results-count");
const errorBanner = document.getElementById("error-banner");
const errorMessage = document.getElementById("error-message");
const heroSection = document.getElementById("hero-section");
const heroSkeleton = document.getElementById("hero-skeleton");
const heroCarouselTrack = document.getElementById("hero-carousel-track");
const latestCardsGrid = document.getElementById("latest-cards-grid");
const latestCardsSkeleton = document.getElementById("latest-cards-skeleton");
const loadMoreBtn = document.getElementById("load-more-btn");

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatTimeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 8));
}

function mediaContentFor(article) {
  if (article.image) {
    return `<img src="${article.image}" alt="" loading="lazy" data-category="${article.category}" onerror="handleImageError(this)" />`;
  }
  return topicArtFor(article.category);
}

function mediaClassFor(baseClass, article) {
  return article.image ? `${baseClass} media-photo` : `${baseClass} thumb-${article.category}`;
}

function handleImageError(img) {
  const wrapper = img.closest(".media-photo");
  if (!wrapper) return;
  wrapper.classList.remove("media-photo");
  wrapper.classList.add(`thumb-${img.dataset.category}`);
  wrapper.innerHTML = topicArtFor(img.dataset.category);
}

function buildHeroSlideHtml(a, bookmarks) {
  const isSaved = bookmarks.has(a.id);
  return `
    <div class="hero">
      <div class="${mediaClassFor("hero-media", a)}">${mediaContentFor(a)}</div>
      <div class="hero-content">
        <div class="hero-source-row">
          <span class="hero-source">${a.source}</span>
          <span class="hero-dot">&middot;</span>
          <span class="hero-time">${formatTimeAgo(a.publishedAt)}</span>
        </div>
        <h2 class="hero-title">${escapeHtml(a.title)}</h2>
        <p class="hero-desc">${escapeHtml(a.description)}</p>
        <div class="hero-footer">
          <a class="read-link" href="${a.url}" target="_blank" rel="noopener">Read more</a>
          <span class="hero-category">${CATEGORY_LABELS[a.category] || a.category}</span>
          <span class="hero-dot">&middot;</span>
          <span class="hero-readtime">${estimateReadTime(a.description)} min read</span>
          <button class="bookmark-btn ${isSaved ? "active" : ""}" data-id="${a.id}" style="margin-left: auto;">
            ${isSaved ? "Unsave" : "Save"}
          </button>
        </div>
      </div>
    </div>`;
}

function renderHeroCarousel(articles) {
  const bookmarks = getBookmarks();

  heroCarouselTrack.innerHTML = articles.map((a) => buildHeroSlideHtml(a, bookmarks)).join("");
  heroCarouselTrack.querySelectorAll(".bookmark-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleBookmark(Number(btn.dataset.id));
      renderHeroCarousel(articles);
      applyFiltersAndRender();
    });
  });

  heroSkeleton.classList.add("hidden");
  heroSection.classList.remove("hidden");
}

function renderCardSkeletons(container, count = LATEST_CARDS_COUNT) {
  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="news-card">
        <div class="card-media skeleton-thumb"></div>
        <div class="card-body">
          <div class="skeleton-line" style="width: 35%;"></div>
          <div class="skeleton-line" style="margin-top: 10px;"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>`
    )
    .join("");
}

function renderRowSkeletons(count = 6) {
  loadingGrid.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="article-row">
        <div class="thumb skeleton-thumb"></div>
        <div class="article-content">
          <div class="skeleton-line" style="width: 25%;"></div>
          <div class="skeleton-line" style="margin-top: 10px;"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>`
    )
    .join("");
}

function buildCardHtml(a, bookmarks) {
  const isSaved = bookmarks.has(a.id);
  return `
    <article class="news-card" data-category="${a.category}">
      <div class="${mediaClassFor("card-media", a)}">${mediaContentFor(a)}</div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-source-name">${a.source}</span>
          <span class="hero-dot">&middot;</span>
          <span class="card-date">${formatTimeAgo(a.publishedAt)}</span>
        </div>
        <h3 class="card-title">${escapeHtml(a.title)}</h3>
        <p class="card-desc">${escapeHtml(a.description)}</p>
        <div class="card-footer">
          <span class="card-category">${CATEGORY_LABELS[a.category] || a.category}</span>
          <span class="hero-dot">&middot;</span>
          <span class="card-readtime">${estimateReadTime(a.description)} min read</span>
          <a class="read-link" href="${a.url}" target="_blank" rel="noopener" style="margin-left: auto;">Read</a>
          <button class="bookmark-btn ${isSaved ? "active" : ""}" data-id="${a.id}">
            ${isSaved ? "Unsave" : "Save"}
          </button>
        </div>
      </div>
    </article>`;
}

function renderLatestCards() {
  const bookmarks = getBookmarks();
  const candidates = allArticles
    .filter((a) => !heroArticleIds.includes(a.id))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, LATEST_CARDS_COUNT);

  latestCardIds = candidates.map((a) => a.id);

  latestCardsGrid.innerHTML = candidates.map((a) => buildCardHtml(a, bookmarks)).join("");
  latestCardsGrid.querySelectorAll(".bookmark-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleBookmark(Number(btn.dataset.id));
      renderLatestCards();
      applyFiltersAndRender();
    });
  });

  latestCardsSkeleton.classList.add("hidden");
  latestCardsGrid.classList.remove("hidden");
}

function applyFiltersAndRender() {
  const bookmarks = getBookmarks();
  let list = allArticles.slice();

  if (activeView === "saved") {
    list = list.filter((a) => bookmarks.has(a.id));
  } else {
    // The hero and "Latest Articles" cards already show these above —
    // avoid showing them a second time in the list below.
    list = list.filter((a) => !heroArticleIds.includes(a.id) && !latestCardIds.includes(a.id));
  }

  if (activeCategory !== "all") {
    list = list.filter((a) => a.category === activeCategory);
  }

  if (searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term) ||
        a.source.toLowerCase().includes(term)
    );
  }

  list.sort((a, b) => {
    switch (sortMode) {
      case "oldest":
        return new Date(a.publishedAt) - new Date(b.publishedAt);
      case "source":
        return a.source.localeCompare(b.source);
      case "title":
        return a.title.localeCompare(b.title);
      case "newest":
      default:
        return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
  });

  renderArticles(list, bookmarks);
}

function renderArticles(list, bookmarks) {
  resultsCount.textContent = `${list.length} article${list.length === 1 ? "" : "s"}`;

  if (list.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    loadMoreBtn.classList.add("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  const visible = list.slice(0, visibleCount);

  grid.innerHTML = visible
    .map((a) => {
      const isSaved = bookmarks.has(a.id);
      return `
        <article class="article-row">
          <div class="${mediaClassFor("thumb", a)}">${mediaContentFor(a)}</div>
          <div class="article-content">
            <div class="article-meta">
              <span class="badge">${CATEGORY_LABELS[a.category] || a.category}</span>
              <span class="article-date">${formatDate(a.publishedAt)}</span>
            </div>
            <h3 class="article-title">${escapeHtml(a.title)}</h3>
            <p class="article-desc">${escapeHtml(a.description)}</p>
            <div class="article-footer">
              <a class="read-link" href="${a.url}" target="_blank" rel="noopener">Read more</a>
              <span class="article-source">${a.source}</span>
              <button class="bookmark-btn ${isSaved ? "active" : ""}" data-id="${a.id}">
                ${isSaved ? "Unsave" : "Save"}
              </button>
            </div>
          </div>
        </article>`;
    })
    .join("");

  grid.querySelectorAll(".bookmark-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      toggleBookmark(id);
      applyFiltersAndRender();
    });
  });

  const remaining = list.length - visible.length;
  if (remaining > 0) {
    loadMoreBtn.textContent = `Load more (${remaining} remaining)`;
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadArticles(forceError = false) {
  resetVisibleCount();
  errorBanner.classList.add("hidden");
  grid.classList.add("hidden");
  loadingGrid.classList.remove("hidden");
  heroSection.classList.add("hidden");
  heroSkeleton.classList.remove("hidden");
  latestCardsGrid.classList.add("hidden");
  latestCardsSkeleton.classList.remove("hidden");
  renderRowSkeletons();
  renderCardSkeletons(latestCardsSkeleton);

  try {
    const articles = await fetchArticles({ forceError, country: activeCountry });
    allArticles = articles;

    const heroArticles = articles
      .slice()
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, HERO_CAROUSEL_COUNT);
    heroArticleIds = heroArticles.map((a) => a.id);
    renderHeroCarousel(heroArticles);
    renderLatestCards();

    loadingGrid.classList.add("hidden");
    grid.classList.remove("hidden");
    applyFiltersAndRender();
  } catch (err) {
    loadingGrid.classList.add("hidden");
    grid.classList.remove("hidden");
    heroSkeleton.classList.add("hidden");
    latestCardsSkeleton.classList.add("hidden");
    errorMessage.textContent = err.message || "Something went wrong.";
    errorBanner.classList.remove("hidden");
    grid.innerHTML = "";
    resultsCount.textContent = "";
  }
}

// --- Event wiring ---

// Auto-advance a carousel track every `intervalMs`, looping back to the
// start once it reaches the end. Pauses while the pointer is over it.
function setupCarouselAutoplay(track, getStep, intervalMs = 4000) {
  let timerId = null;

  function advance() {
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (track.scrollLeft >= maxScroll - 2) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      track.scrollBy({ left: getStep(), behavior: "smooth" });
    }
  }

  function start() {
    stop();
    timerId = setInterval(advance, intervalMs);
  }

  function stop() {
    clearInterval(timerId);
  }

  track.addEventListener("mouseenter", stop);
  track.addEventListener("mouseleave", start);
  start();
}

setupCarouselAutoplay(latestCardsGrid, () => {
  const firstCard = latestCardsGrid.querySelector(".news-card");
  return firstCard ? firstCard.getBoundingClientRect().width + 20 : 300;
});

setupCarouselAutoplay(heroCarouselTrack, () => heroCarouselTrack.clientWidth);

document.getElementById("see-all-link").addEventListener("click", (e) => {
  e.preventDefault();
  document.querySelector('.chip[data-category="all"]').click();
  document.getElementById("results-count").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("search-input").addEventListener("input", (e) => {
  searchTerm = e.target.value;
  resetVisibleCount();
  applyFiltersAndRender();
});

document.getElementById("sort-select").addEventListener("change", (e) => {
  sortMode = e.target.value;
  resetVisibleCount();
  applyFiltersAndRender();
});

// Country isn't something we can filter client-side — GNews only returns
// headlines for one country per request — so changing it re-fetches
// instead of just re-rendering like the other filters do.
document.getElementById("country-select").addEventListener("change", (e) => {
  activeCountry = e.target.value;
  loadArticles();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeCategory = chip.dataset.category;
    resetVisibleCount();
    applyFiltersAndRender();
  });
});

document.querySelectorAll(".view-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".view-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    activeView = tab.dataset.view;
    resetVisibleCount();
    applyFiltersAndRender();
  });
});

loadMoreBtn.addEventListener("click", () => {
  visibleCount += LOAD_MORE_STEP;
  applyFiltersAndRender();
});

document.getElementById("clear-filters-btn").addEventListener("click", () => {
  searchTerm = "";
  document.getElementById("search-input").value = "";
  activeCategory = "all";
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  document.querySelector('.chip[data-category="all"]').classList.add("active");
  activeView = "all";
  document.querySelectorAll(".view-tab").forEach((t) => t.classList.remove("active"));
  document.querySelector('.view-tab[data-view="all"]').classList.add("active");
  resetVisibleCount();
  applyFiltersAndRender();
});

document.getElementById("retry-btn").addEventListener("click", () => loadArticles(false));
document.getElementById("simulate-error-btn").addEventListener("click", () => loadArticles(true));

loadArticles();
