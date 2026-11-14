// W35 Project 04 — API Showcase Portfolio (capstone)
// Two data sources side by side, with paging, cache, search, filters and favorites.
// 6 TODOs: pair config, fetch + paging, filter + sort, search, cache + favourites, list view.
// Verify: the page loads with sample cards in both panels and no error banner. The preview allows 20 API calls per run: press Refresh to start a new run.

// ===================================
// Helpers for the data sources (PRE-BUILT)
// ===================================

// A picture drawn in code, so no outside placeholder site is needed.
function placeholderImage(label) {
    const safe = String(label).toLowerCase().replace(/[<>&"]/g, '');
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="300" height="180" fill="#fef4f5"/>'
        + '<text x="150" y="98" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#625b5b">' + safe + '</text></svg>'
    );
}

async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
    return response.json();
}

// ===================================
// Loaders: one per data source (PRE-BUILT)
// Each loader takes a page number and answers { items, totalPages }, where every item has
// { id, title, description, image, category, date, timestamp, author, url }.
// The preview allows 20 API calls per run, so every loader fetches only a few items per page.
// ===================================

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';
const NEWS_PER_PAGE = 3;

async function loadHackerNews(page) {
    const ids = await getJson(`${HN_BASE}/topstories.json`);
    const start = (page - 1) * NEWS_PER_PAGE;
    const stories = await Promise.all(ids.slice(start, start + NEWS_PER_PAGE).map(id => getJson(`${HN_BASE}/item/${id}.json`)));
    return {
        items: stories.map(story => ({
            id: `hn-${story.id}`,
            title: story.title,
            description: `${story.score} points · ${story.descendants ?? 0} comments`,
            image: placeholderImage(`${story.score} pts`),
            category: story.type || 'story',
            date: new Date(story.time * 1000).toLocaleDateString(),
            timestamp: story.time * 1000,
            author: story.by,
            url: story.url || '#'
        })),
        totalPages: Math.min(5, Math.ceil(ids.length / NEWS_PER_PAGE))
    };
}

const WEATHER_CITIES = ['Kuala Lumpur', 'Penang', 'Kuching', 'Kota Kinabalu', 'Johor Bahru', 'Ipoh'];
const CITIES_PER_PAGE = 3;

async function loadWeather(page) {
    const start = (page - 1) * CITIES_PER_PAGE;
    const cities = WEATHER_CITIES.slice(start, start + CITIES_PER_PAGE);
    const readings = await Promise.all(cities.map(city => getJson(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)));
    return {
        items: readings.map((raw, i) => {
            const now = raw.current_condition[0];
            const description = now.weatherDesc[0].value.trim();
            return {
                id: `weather-${cities[i]}`,
                title: cities[i],
                description: `${now.temp_C}°C, ${description}, humidity ${now.humidity}%`,
                image: placeholderImage(`${now.temp_C}°C`),
                category: description,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                author: 'wttr.in',
                url: '#'
            };
        }),
        totalPages: Math.ceil(WEATHER_CITIES.length / CITIES_PER_PAGE)
    };
}

const ITEMS_PER_PAGE = 6;

async function loadProducts(category, page) {
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const data = await getJson(`https://dummyjson.com/products/category/${category}?limit=${ITEMS_PER_PAGE}&skip=${skip}&select=title,description,thumbnail,rating,price,brand,category`);
    return {
        items: data.products.map(p => ({
            id: `product-${p.id}`,
            title: p.title,
            description: `$${p.price} · rated ${p.rating} / 5`,
            image: p.thumbnail || placeholderImage('No image'),
            category: p.brand || p.category,
            date: 'Recent',
            timestamp: 0,
            author: p.brand || '',
            url: '#'
        })),
        totalPages: Math.min(5, Math.max(1, Math.ceil(data.total / ITEMS_PER_PAGE)))
    };
}

async function loadRecipes(path, page) {
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const data = await getJson(`https://dummyjson.com/recipes${path}?limit=${ITEMS_PER_PAGE}&skip=${skip}&select=name,image,cuisine,rating,caloriesPerServing,difficulty`);
    return {
        items: data.recipes.map(r => ({
            id: `recipe-${r.id}`,
            title: r.name,
            description: `${r.cuisine} · ${r.caloriesPerServing} kcal per serving · ${r.difficulty}`,
            image: r.image || placeholderImage('No image'),
            category: r.cuisine,
            date: 'Recent',
            timestamp: 0,
            author: '',
            url: '#'
        })),
        totalPages: Math.min(5, Math.max(1, Math.ceil(data.total / ITEMS_PER_PAGE)))
    };
}

// ===================================
// API Configuration
// ===================================

const API_CONFIGS = {
    'news-weather': {
        primary: { name: 'Hacker News', load: loadHackerNews },
        secondary: { name: 'Weather (wttr.in)', load: loadWeather }
    },
    'phones-laptops': {
        primary: { name: 'Phones', load: page => loadProducts('smartphones', page) },
        secondary: { name: 'Laptops', load: page => loadProducts('laptops', page) }
    },
    'recipe-snacks': {
        primary: { name: 'All recipes', load: page => loadRecipes('', page) },
        secondary: { name: 'Snack recipes', load: page => loadRecipes('/meal-type/Snack', page) }
    },
    'people-quotes': {
        primary: {
            name: 'People',
            load: async function loadPeople(page) {
                const skip = (page - 1) * ITEMS_PER_PAGE;
                const data = await getJson(`https://dummyjson.com/users?limit=${ITEMS_PER_PAGE}&skip=${skip}&select=id,firstName,lastName,image,email,gender`);
                return {
                    items: data.users.map(user => ({
                        id: `person-${user.id}`,
                        title: `${user.firstName} ${user.lastName}`,
                        description: `${user.gender || 'Person'} · ${user.email || 'No email listed'}`,
                        image: user.image || placeholderImage(`${user.firstName} ${user.lastName}`),
                        category: user.gender || 'People',
                        date: 'Recent',
                        timestamp: Date.now() - user.id * 60000,
                        author: user.email || 'User profile',
                        url: '#'
                    })),
                    totalPages: Math.min(5, Math.max(1, Math.ceil(data.total / ITEMS_PER_PAGE)))
                };
            }
        },
        secondary: {
            name: 'Quotes',
            load: async function loadQuotes(page) {
                const skip = (page - 1) * ITEMS_PER_PAGE;
                const data = await getJson(`https://dummyjson.com/quotes?limit=${ITEMS_PER_PAGE}&skip=${skip}&select=id,quote,author`);
                return {
                    items: data.quotes.map((quote, idx) => ({
                        id: `quote-${quote.id}`,
                        title: quote.author || 'Anonymous',
                        description: `“${quote.quote}”`,
                        image: placeholderImage(quote.author || 'Quote'),
                        category: 'Motivation',
                        date: 'Recent',
                        timestamp: Date.now() - (idx + 1) * 3600000,
                        author: quote.author || 'Unknown',
                        url: '#'
                    })),
                    totalPages: Math.min(5, Math.max(1, Math.ceil(data.total / ITEMS_PER_PAGE)))
                };
            }
        }
    }
};

// ===================================
// State Management (PRE-BUILT)
// ===================================

const state = {
    currentCombo: 'news-weather',
    theme: 'light',
    view: 'grid',

    // Primary API state
    primaryData: [],
    primaryPage: 1,
    primaryTotalPages: 1,
    primaryFiltered: [],

    // Secondary API state
    secondaryData: [],
    secondaryPage: 1,
    secondaryTotalPages: 1,
    secondaryFiltered: [],

    // Search & Filter state
    searchQuery: '',
    filterCategory: 'all',
    sortBy: 'date-desc',

    // User data
    favorites: [],

    // Statistics
    stats: {
        itemsViewed: 0,
        searches: 0,
        cacheHits: 0,
        totalFavorites: 0
    }
};

// ===================================
// Cache Management
// ===================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class CacheManager {
    static get(key) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const parsed = JSON.parse(stored);
            if (!parsed || typeof parsed.timestamp !== 'number') {
                localStorage.removeItem(key);
                return null;
            }

            if (Date.now() - parsed.timestamp > CACHE_DURATION) {
                localStorage.removeItem(key);
                return null;
            }

            return parsed.data;
        } catch (error) {
            console.warn('Cache read failed:', error);
            localStorage.removeItem(key);
            return null;
        }
    }

    static set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Cache write failed:', error);
        }
    }

    static clear(key) {
        localStorage.removeItem(key);
    }

    static clearAll() {
        Object.keys(localStorage)
            .filter(key => key.startsWith('cache_'))
            .forEach(key => localStorage.removeItem(key));
    }
}

// ===================================
// API Fetch Functions
// ===================================

// TODO 2: fetchPrimaryAPI — use API_CONFIGS[state.currentCombo].primary.load(page), which answers
// { items, totalPages }. Check the cache first (key like `cache_${state.currentCombo}_primary_${page}`,
// count a hit in state.stats.cacheHits), otherwise load and cache the answer. Update
// state.primaryData / primaryPage / primaryTotalPages and call displayPrimaryData.
// Verify: paging shows different items; fetching the same page again within 5 minutes counts a cache hit.
async function fetchPrimaryAPI(page = 1) {
    const panelId = 'primary';
    showLoading(panelId);
    hideError(panelId);

    try {
        const cacheKey = `cache_${state.currentCombo}_${panelId}_${page}`;
        const cached = CacheManager.get(cacheKey);

        if (cached) {
            state.primaryData = cached.items;
            state.primaryPage = page;
            state.primaryTotalPages = cached.totalPages;
            state.stats.cacheHits += 1;
            updateStats();
            displayPrimaryData();
            hideLoading(panelId);
            return;
        }

        const result = await API_CONFIGS[state.currentCombo].primary.load(page);
        CacheManager.set(cacheKey, result);

        state.primaryData = result.items;
        state.primaryPage = page;
        state.primaryTotalPages = result.totalPages;

        displayPrimaryData();
        hideLoading(panelId);
    } catch (error) {
        console.error('Primary API Error:', error);
        showError(panelId, error.message);
        hideLoading(panelId);
    }
}

async function fetchSecondaryAPI(page = 1) {
    const panelId = 'secondary';
    showLoading(panelId);
    hideError(panelId);

    try {
        const cacheKey = `cache_${state.currentCombo}_${panelId}_${page}`;
        const cached = CacheManager.get(cacheKey);

        if (cached) {
            state.secondaryData = cached.items;
            state.secondaryPage = page;
            state.secondaryTotalPages = cached.totalPages;
            state.stats.cacheHits += 1;
            updateStats();
            displaySecondaryData();
            hideLoading(panelId);
            return;
        }

        const result = await API_CONFIGS[state.currentCombo].secondary.load(page);
        CacheManager.set(cacheKey, result);

        state.secondaryData = result.items;
        state.secondaryPage = page;
        state.secondaryTotalPages = result.totalPages;

        displaySecondaryData();
        hideLoading(panelId);
    } catch (error) {
        console.error('Secondary API Error:', error);
        showError(panelId, error.message);
        hideLoading(panelId);
    }
}

// ===================================
// Display Functions (PRE-BUILT)
// ===================================

// The category dropdown lists the categories of the items loaded in either panel.
function refreshCategoryOptions() {
    const select = document.getElementById('filterCategory');
    const categories = [...new Set([...state.primaryData, ...state.secondaryData].map(item => item.category).filter(Boolean))].sort();
    select.textContent = '';
    select.appendChild(new Option('All Categories', 'all'));
    categories.forEach(category => select.appendChild(new Option(category, category)));
    select.value = categories.includes(state.filterCategory) ? state.filterCategory : 'all';
    state.filterCategory = select.value;
}

function displayPrimaryData() {
    refreshCategoryOptions();
    const grid = document.getElementById('primaryGrid');
    const countEl = document.getElementById('primaryCount');

    // Apply filters and search
    const filteredData = applyFiltersAndSearch(state.primaryData);
    state.primaryFiltered = filteredData;

    // Update count
    countEl.textContent = `${filteredData.length} items`;

    // Clear grid
    grid.textContent = '';

    // Display items
    if (filteredData.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No items found';
        grid.appendChild(emptyMsg);
        return;
    }

    filteredData.forEach(item => {
        const card = createDataCard(item, 'primary');
        grid.appendChild(card);
    });

    updatePagination('primary');
}

function displaySecondaryData() {
    refreshCategoryOptions();
    const grid = document.getElementById('secondaryGrid');
    const countEl = document.getElementById('secondaryCount');

    // Apply filters and search
    const filteredData = applyFiltersAndSearch(state.secondaryData);
    state.secondaryFiltered = filteredData;

    // Update count
    countEl.textContent = `${filteredData.length} items`;

    // Clear grid
    grid.textContent = '';

    // Display items
    if (filteredData.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No items found';
        grid.appendChild(emptyMsg);
        return;
    }

    filteredData.forEach(item => {
        const card = createDataCard(item, 'secondary');
        grid.appendChild(card);
    });

    updatePagination('secondary');
}

function createDataCard(item, source) {
    const card = document.createElement('div');
    card.className = 'data-card';
    card.dataset.id = item.id;

    const isFavorite = state.favorites.some(fav => fav.id === item.id && fav.source === source);

    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `favorite-btn ${isFavorite ? 'active' : ''}`;
    favoriteBtn.textContent = isFavorite ? '۶ৎ' : '♡';
    favoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
    favoriteBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
    favoriteBtn.onclick = (e) => toggleFavorite(e, item.id, source);

    // Image
    const img = document.createElement('img');
    img.src = item.image || placeholderImage('No image');
    img.alt = item.title || 'Item image';
    img.className = 'card-image';
    img.onerror = function() { this.src = placeholderImage('No image'); };

    // Title
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;

    // Description
    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = item.description || 'No description available';

    // Meta
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const dateSpan = document.createElement('span');
    dateSpan.textContent = item.date || 'Recent';
    const categorySpan = document.createElement('span');
    categorySpan.textContent = item.category || 'General';
    meta.appendChild(dateSpan);
    meta.appendChild(categorySpan);

    // Assemble card
    card.appendChild(favoriteBtn);
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(meta);

    // Click handler for detail view
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('favorite-btn')) {
            showDetailModal(item);
            state.stats.itemsViewed++;
            updateStats();
        }
    });

    return card;
}

// ===================================
// Filter and Search Functions
// ===================================

function applyFiltersAndSearch(data) {
    let filtered = [...data];

    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(item => {
            const haystack = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.author || ''}`.toLowerCase();
            return haystack.includes(query);
        });
    }

    if (state.filterCategory !== 'all') {
        filtered = filtered.filter(item => (item.category || 'General') === state.filterCategory);
    }

    const getTimestamp = item => Number.isFinite(item.timestamp) ? Number(item.timestamp) : Date.parse(item.date || '') || 0;
    const getRelevanceScore = item => {
        if (!state.searchQuery) return 0;
        const query = state.searchQuery.toLowerCase();
        const title = (item.title || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return (title.includes(query) ? 3 : 0) + (description.includes(query) ? 2 : 0);
    };

    switch (state.sortBy) {
        case 'date-asc':
            filtered.sort((a, b) => getTimestamp(a) - getTimestamp(b));
            break;
        case 'name-asc':
            filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'name-desc':
            filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            break;
        case 'relevance':
            filtered.sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));
            break;
        case 'date-desc':
        default:
            filtered.sort((a, b) => getTimestamp(b) - getTimestamp(a));
            break;
    }

    return filtered;
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    state.searchQuery = searchInput.value.trim();
    state.stats.searches++;

    // Re-display both panels with new search
    displayPrimaryData();
    displaySecondaryData();
    updateStats();
}

function handleFilterChange() {
    const categorySelect = document.getElementById('filterCategory');
    const sortSelect = document.getElementById('sortBy');

    state.filterCategory = categorySelect.value;
    state.sortBy = sortSelect.value;

    // Re-display both panels with new filters
    displayPrimaryData();
    displaySecondaryData();
}

// ===================================
// Pagination Functions
// ===================================

function updatePagination(panelId) {
    const paginationEl = document.getElementById(`${panelId}Pagination`);
    const prevBtn = document.getElementById(`${panelId}PrevBtn`);
    const nextBtn = document.getElementById(`${panelId}NextBtn`);
    const pageInfo = document.getElementById(`${panelId}PageInfo`);

    const currentPage = state[`${panelId}Page`];
    const totalPages = state[`${panelId}TotalPages`];

    // Show/hide pagination
    if (totalPages <= 1) {
        paginationEl.classList.add('hidden');
        return;
    }

    paginationEl.classList.remove('hidden');

    // Update page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    // Update button states
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function changePage(panelId, direction) {
    const currentPage = state[`${panelId}Page`];
    const totalPages = state[`${panelId}TotalPages`];
    const nextPage = Math.min(totalPages, Math.max(1, currentPage + direction));

    if (nextPage === currentPage) return;

    if (panelId === 'primary') {
        fetchPrimaryAPI(nextPage);
    } else {
        fetchSecondaryAPI(nextPage);
    }
}

// ===================================
// Favorites System
// ===================================

function toggleFavorite(event, itemId, source) {
    event.stopPropagation();

    const item = [...state.primaryData, ...state.secondaryData].find(entry => entry.id === itemId);
    if (!item) return;

    const existingIndex = state.favorites.findIndex(fav => fav.id === itemId && fav.source === source);

    if (existingIndex >= 0) {
        state.favorites.splice(existingIndex, 1);
    } else {
        state.favorites.push({ ...item, source });
    }

    saveFavorites();
    displayFavorites();
    displayPrimaryData();
    displaySecondaryData();
}

function displayFavorites() {
    const favoritesList = document.getElementById('favoritesList');

    if (state.favorites.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = '(˶ᵔ ᵕ ᵔ˶) No favorites yet. Tap ۶ৎ on an item to save it!';
        favoritesList.textContent = '';
        favoritesList.appendChild(emptyMsg);
        state.stats.totalFavorites = 0;
        updateStats();
        return;
    }

    favoritesList.textContent = '';
    state.favorites.forEach(item => {
        const favItem = document.createElement('div');
        favItem.className = 'favorite-item';
        favItem.onclick = () => showDetailModal(item);

        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = item.title;
        const br = document.createElement('br');
        const meta = document.createElement('small');
        meta.textContent = `${item.source} - ${item.category || 'General'}`;

        info.appendChild(title);
        info.appendChild(br);
        info.appendChild(meta);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-icon';
        removeBtn.textContent = '✕';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFavorite(item.id, item.source);
        };

        favItem.appendChild(info);
        favItem.appendChild(removeBtn);
        favoritesList.appendChild(favItem);
    });

    state.stats.totalFavorites = state.favorites.length;
    updateStats();
}

function removeFavorite(itemId, source) {
    const index = state.favorites.findIndex(fav => fav.id === itemId && fav.source === source);
    if (index > -1) {
        state.favorites.splice(index, 1);
        saveFavorites();
        displayFavorites();
        displayPrimaryData();
        displaySecondaryData();
    }
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
}

function loadFavorites() {
    try {
        const saved = JSON.parse(localStorage.getItem('favorites') || '[]');
        state.favorites = Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn('Failed to parse saved favorites:', error);
        state.favorites = [];
    }
    displayFavorites();
}

// The preview cannot show confirm pop-ups, so Clear All asks with a second click.
let clearFavoritesPending = false;

function clearFavorites() {
    const btn = document.getElementById('clearFavoritesBtn');
    if (!clearFavoritesPending) {
        clearFavoritesPending = true;
        btn.textContent = 'Click again to confirm';
        setTimeout(() => { clearFavoritesPending = false; btn.textContent = 'Clear All'; }, 3000);
        return;
    }
    clearFavoritesPending = false;
    btn.textContent = 'Clear All';
    state.favorites = [];
    saveFavorites();
    displayFavorites();
    displayPrimaryData();
    displaySecondaryData();
}

// ===================================
// Modal Functions (PRE-BUILT)
// ===================================

function showDetailModal(item) {
    const modal = document.getElementById('detailModal');
    const detailContent = document.getElementById('detailContent');

    // Clear content
    detailContent.textContent = '';

    // Title
    const title = document.createElement('h2');
    title.textContent = item.title;
    detailContent.appendChild(title);

    // Image
    if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        img.style.cssText = 'width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin: 1rem 0;';
        detailContent.appendChild(img);
    }

    // Category
    const categoryP = document.createElement('p');
    const categoryStrong = document.createElement('strong');
    categoryStrong.textContent = 'Category: ';
    categoryP.appendChild(categoryStrong);
    categoryP.appendChild(document.createTextNode(item.category || 'General'));
    detailContent.appendChild(categoryP);

    // Date
    const dateP = document.createElement('p');
    const dateStrong = document.createElement('strong');
    dateStrong.textContent = 'Date: ';
    dateP.appendChild(dateStrong);
    dateP.appendChild(document.createTextNode(item.date || 'Recent'));
    detailContent.appendChild(dateP);

    // Description
    const descP = document.createElement('p');
    descP.textContent = item.description || 'No description available';
    detailContent.appendChild(descP);

    // Author (if exists)
    if (item.author) {
        const authorP = document.createElement('p');
        const authorStrong = document.createElement('strong');
        authorStrong.textContent = 'Author: ';
        authorP.appendChild(authorStrong);
        authorP.appendChild(document.createTextNode(item.author));
        detailContent.appendChild(authorP);
    }

    // Source address (shown as text: the preview cannot open new tabs)
    if (item.url && item.url !== '#') {
        const linkP = document.createElement('p');
        const linkStrong = document.createElement('strong');
        linkStrong.textContent = 'Source: ';
        linkP.appendChild(linkStrong);
        linkP.appendChild(document.createTextNode(item.url));
        detailContent.appendChild(linkP);
    }

    modal.classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// ===================================
// UI Helper Functions (PRE-BUILT)
// ===================================

function showLoading(panelId) {
    document.getElementById(`${panelId}Loading`).classList.remove('hidden');
    document.getElementById(`${panelId}Grid`).style.opacity = '0.3';
}

function hideLoading(panelId) {
    document.getElementById(`${panelId}Loading`).classList.add('hidden');
    document.getElementById(`${panelId}Grid`).style.opacity = '1';
}

function showToast(message) {
    // Small, self-removing message at the bottom of the page (textContent only)
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function showError(panelId, message) {
    const errorEl = document.getElementById(`${panelId}Error`);
    errorEl.querySelector('.error-message').textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError(panelId) {
    document.getElementById(`${panelId}Error`).classList.add('hidden');
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('themeToggle').textContent = '۶ৎ';
    localStorage.setItem('theme', state.theme);
}

function updateStats() {
    document.getElementById('totalItemsViewed').textContent = state.stats.itemsViewed;
    document.getElementById('totalSearches').textContent = state.stats.searches;
    document.getElementById('totalFavorites').textContent = state.stats.totalFavorites;
    document.getElementById('cacheHits').textContent = state.stats.cacheHits;
}

// ===================================
// Sample Data Generator (FOR TESTING)
// The starter shows this until your TODO 2 loads real data. Remove it once that works.
// ===================================

function generateSampleData(source, count) {
    const titles = [
        'Breaking News: Technology Advances',
        'Weather Update: Sunny Skies Ahead',
        'Latest Trends in Web Development',
        'Health Tips for Modern Living',
        'Entertainment News: New Releases',
        'Sports Highlights: Championship Games',
        'Science Discovery: Amazing Findings',
        'Travel Destinations: Top Picks'
    ];

    const categories = ['Technology', 'Weather', 'Health', 'Entertainment', 'Sports', 'Science', 'Travel'];

    return Array.from({ length: count }, (_, i) => ({
        id: `${source}-${i}`,
        title: titles[i % titles.length],
        description: 'This is sample data for UI testing. Replace with real API data in TODO 2.',
        image: placeholderImage(`Sample ${i + 1}`),
        category: categories[i % categories.length],
        date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
        timestamp: Date.now() - i * 86400000,
        author: `Author ${i + 1}`,
        url: '#'
    }));
}

// ===================================
// Event Listeners (PRE-BUILT)
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const petalSpots = Array.from(document.querySelectorAll('.petal-spot'));
    const petalScore = document.getElementById('petalScore');
    const petalTime = document.getElementById('petalTime');
    const petalHighScoreDisplay = document.getElementById('petalHighScore');
    const petalGameStatus = document.getElementById('petalGameStatus');
    const startPetalGame = document.getElementById('startPetalGame');
    const savedPetalHighScore = Number(localStorage.getItem('petalCatchHighScore'));
    let petalHighScore = Number.isSafeInteger(savedPetalHighScore) && savedPetalHighScore > 0
        ? savedPetalHighScore
        : 0;
    let petalGameRunning = false;
    let petalGameScore = 0;
    let petalGameTime = 15;
    let activePetalSpot = -1;
    let petalMoveTimer;
    let petalCountdownTimer;
    petalHighScoreDisplay.textContent = petalHighScore;

    function movePetalTarget() {
        let nextSpot = Math.floor(Math.random() * petalSpots.length);
        while (petalSpots.length > 1 && nextSpot === activePetalSpot) {
            nextSpot = Math.floor(Math.random() * petalSpots.length);
        }
        activePetalSpot = nextSpot;
        petalSpots.forEach((spot, index) => {
            const isTarget = index === activePetalSpot;
            spot.disabled = !petalGameRunning || !isTarget;
            spot.classList.toggle('is-target', petalGameRunning && isTarget);
            spot.textContent = petalGameRunning && isTarget ? '✿' : '·';
        });
    }

    function finishPetalGame() {
        petalGameRunning = false;
        activePetalSpot = -1;
        clearInterval(petalMoveTimer);
        clearInterval(petalCountdownTimer);
        movePetalTarget();
        startPetalGame.disabled = false;
        startPetalGame.textContent = 'play again';
        const newHighScore = petalGameScore > petalHighScore;
        if (newHighScore) {
            petalHighScore = petalGameScore;
            petalHighScoreDisplay.textContent = petalHighScore;
            localStorage.setItem('petalCatchHighScore', String(petalHighScore));
        }
        petalGameStatus.textContent = newHighScore
            ? `new high score! you caught ${petalGameScore} petals (˶ᵔ ᵕ ᵔ˶)`
            : `time! you caught ${petalGameScore} petals (˶ᵔ ᵕ ᵔ˶)`;
    }

    petalSpots.forEach((spot, index) => {
        spot.addEventListener('click', () => {
            if (!petalGameRunning || index !== activePetalSpot) return;
            petalGameScore++;
            petalScore.textContent = petalGameScore;
            movePetalTarget();
        });
    });

    startPetalGame.addEventListener('click', () => {
        if (petalGameRunning) return;
        petalGameRunning = true;
        petalGameScore = 0;
        petalGameTime = 15;
        petalScore.textContent = petalGameScore;
        petalTime.textContent = petalGameTime;
        petalGameStatus.textContent = 'quick! catch the petal (๑˃ᴗ˂)ﻭ';
        startPetalGame.disabled = true;
        startPetalGame.textContent = 'game on...';

        movePetalTarget();
        petalMoveTimer = setInterval(movePetalTarget, 850);
        petalCountdownTimer = setInterval(() => {
            petalGameTime--;
            petalTime.textContent = petalGameTime;
            if (petalGameTime <= 0) finishPetalGame();
        }, 1000);
    });

    // API selection buttons
    document.querySelectorAll('.api-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const config = API_CONFIGS[btn.dataset.combo];
            if (!config) { showToast('Add this pair to API_CONFIGS (TODO 1)'); return; }

            document.querySelectorAll('.api-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentCombo = btn.dataset.combo;

            // Update panel titles
            document.getElementById('primaryApiTitle').textContent = config.primary.name;
            document.getElementById('secondaryApiTitle').textContent = config.secondary.name;

            // Fetch new data
            fetchPrimaryAPI(1);
            fetchSecondaryAPI(1);
        });
    });

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        state.searchQuery = '';
        displayPrimaryData();
        displaySecondaryData();
    });

    // Filters
    document.getElementById('filterCategory').addEventListener('change', handleFilterChange);
    document.getElementById('sortBy').addEventListener('change', handleFilterChange);

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.view = btn.id === 'gridViewBtn' ? 'grid' : 'list';

            const isListView = state.view === 'list';
            document.getElementById('primaryGrid').classList.toggle('list-view', isListView);
            document.getElementById('secondaryGrid').classList.toggle('list-view', isListView);
        });
    });

    // Pagination
    document.getElementById('primaryPrevBtn').addEventListener('click', () => changePage('primary', -1));
    document.getElementById('primaryNextBtn').addEventListener('click', () => changePage('primary', 1));
    document.getElementById('secondaryPrevBtn').addEventListener('click', () => changePage('secondary', -1));
    document.getElementById('secondaryNextBtn').addEventListener('click', () => changePage('secondary', 1));

    // Favorites
    document.getElementById('clearFavoritesBtn').addEventListener('click', clearFavorites);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        CacheManager.clearAll();
        fetchPrimaryAPI(state.primaryPage);
        fetchSecondaryAPI(state.secondaryPage);
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeDetailModal);
    document.querySelector('.modal-overlay').addEventListener('click', closeDetailModal);

    // Error retry buttons
    document.querySelectorAll('.btn-retry').forEach(btn => {
        btn.addEventListener('click', () => {
            fetchPrimaryAPI(state.primaryPage);
            fetchSecondaryAPI(state.secondaryPage);
        });
    });

    // Initialize
    loadFavorites();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        state.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeToggle').textContent = '۶ৎ';
    }

    // Load initial data
    fetchPrimaryAPI(1);
    fetchSecondaryAPI(1);
});
