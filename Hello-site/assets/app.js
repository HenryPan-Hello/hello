async function loadGames() {
  const response = await fetch('data/games.json');
  return response.json();
}

function getPageType() {
  const params = new URLSearchParams(location.search);
  if (params.has('play')) return 'play';
  if (params.has('game')) return 'detail';
  return 'home';
}

function findGame(games, id) {
  return games.find(game => game.id === id || game.slug === id);
}

function cardTemplate(game, featured = false) {
  const cardClass = featured ? 'featured-card' : 'game-card';
  return `
    <article class="${cardClass}">
      <div class="card-cover">${game.coverEmoji || '🎮'}</div>
      <div class="card-body">
        <h3 class="card-title">${game.title}</h3>
        <p class="card-text">${game.description}</p>
        <div class="badges">
          ${(game.categories || []).map(c => `<span class="badge">${c}</span>`).join('')}
        </div>
        <div class="card-actions">
          <a class="link-soft" href="game.html?game=${encodeURIComponent(game.slug)}">Details</a>
          <a class="link-strong" href="play.html?play=${encodeURIComponent(game.slug)}">Play</a>
        </div>
      </div>
    </article>
  `;
}

function renderHome(games) {
  const featured = games.filter(g => g.featured);
  const featuredRow = document.getElementById('featuredRow');
  const gamesGrid = document.getElementById('gamesGrid');
  const emptyState = document.getElementById('emptyState');
  const categoryFilter = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('searchInput');
  document.getElementById('gameCount').textContent = games.length;

  const categories = [...new Set(games.flatMap(game => game.categories || []))].sort();
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  featuredRow.innerHTML = featured.map(game => cardTemplate(game, true)).join('');

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const filtered = games.filter(game => {
      const matchesText = [game.title, game.description, ...(game.tags || []), ...(game.categories || [])]
        .join(' ')
        .toLowerCase()
        .includes(q);
      const matchesCategory = category === 'all' || (game.categories || []).includes(category);
      return matchesText && matchesCategory;
    });
    gamesGrid.innerHTML = filtered.map(game => cardTemplate(game)).join('');
    emptyState.classList.toggle('hidden', filtered.length !== 0);
  }

  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
  applyFilters();
}

function renderDetail(game) {
  document.body.innerHTML = `
    <main class="page-shell detail-shell">
      <a class="back-link" href="index.html">← Back to home</a>
      <div class="detail-layout">
        <section class="detail-main">
          <p class="eyebrow">Game details</p>
          <h1>${game.title}</h1>
          <div class="meta-line">${(game.categories || []).join(' • ')}</div>
          <p>${game.description}</p>
          <div class="badges">${(game.tags || []).map(tag => `<span class="badge">${tag}</span>`).join('')}</div>
          <div class="hero-actions">
            <a class="button primary" href="play.html?play=${encodeURIComponent(game.slug)}">Play now</a>
            <a class="button secondary" href="index.html">Back to library</a>
          </div>
        </section>
        <aside class="play-sidebar">
          <div class="card-cover" style="border-radius:18px;">${game.coverEmoji || '🎮'}</div>
          <div class="kv-list">
            <div class="kv-item"><strong>Folder path</strong><br>${game.gamePath}</div>
            <div class="kv-item"><strong>Entry file</strong><br>${game.entryFile || 'index.html'}</div>
            <div class="kv-item"><strong>How to replace</strong><br>Swap this folder with your own game and keep the JSON updated.</div>
          </div>
        </aside>
      </div>
    </main>
  `;
}

function renderPlay(game) {
  document.body.innerHTML = `
    <main class="page-shell play-shell">
      <a class="back-link" href="index.html">← Back to home</a>
      <div class="play-layout">
        <section class="game-frame-wrap">
          <iframe class="game-frame" src="${game.gamePath}/${game.entryFile || 'index.html'}" title="${game.title}" allowfullscreen loading="eager"></iframe>
        </section>
        <aside class="play-sidebar">
          <p class="eyebrow">Now playing</p>
          <h1>${game.title}</h1>
          <p>${game.description}</p>
          <div class="badges">${(game.categories || []).map(cat => `<span class="badge">${cat}</span>`).join('')}</div>
          <div class="kv-list">
            <div class="kv-item"><strong>Game folder</strong><br>${game.gamePath}</div>
            <div class="kv-item"><strong>Replace steps</strong><br>Put your own game files in the same folder, then update <code>data/games.json</code>.</div>
            <div class="kv-item"><strong>Best for</strong><br>HTML5 games exported from Phaser, Construct, Godot Web, Unity WebGL, GDevelop, or plain HTML/JS.</div>
          </div>
        </aside>
      </div>
    </main>
  `;
}

function showNotFound(message = 'Game not found.') {
  document.body.innerHTML = `
    <main class="page-shell">
      <section class="section-block">
        <a class="back-link" href="index.html">← Back to home</a>
        <h1>${message}</h1>
      </section>
    </main>
  `;
}

async function init() {
  const games = await loadGames();
  const params = new URLSearchParams(location.search);
  const pageType = getPageType();

  if (pageType === 'home') {
    renderHome(games);
    return;
  }

  const gameId = params.get('game') || params.get('play');
  const game = findGame(games, gameId);
  if (!game) return showNotFound();
  if (pageType === 'detail') return renderDetail(game);
  if (pageType === 'play') return renderPlay(game);
}

window.addEventListener('DOMContentLoaded', init);
