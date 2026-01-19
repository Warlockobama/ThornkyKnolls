// Thorny Knolls Hybrid - Application Logic
// Vanilla JavaScript, no dependencies

(function() {
  'use strict';

  // ==================== State ====================
  const state = {
    animals: [],
    posts: [],
    currentView: 'animals',
    currentDetail: null
  };

  // ==================== DOM Elements ====================
  const elements = {
    animalsGrid: document.getElementById('animals-grid'),
    storiesGrid: document.getElementById('stories-grid'),
    animalsSection: document.getElementById('animals-section'),
    storiesSection: document.getElementById('stories-section'),
    aboutSection: document.getElementById('about-section'),
    detailPanel: document.getElementById('detailPanel'),
    detailOverlay: document.getElementById('detailOverlay'),
    detailTitle: document.getElementById('detailTitle'),
    detailContent: document.getElementById('detailContent'),
    closeBtn: document.getElementById('closeBtn'),
    themeToggle: document.getElementById('themeToggle'),
    themePanel: document.getElementById('themePanel'),
    accentColor: document.getElementById('accentColor'),
    bgColor: document.getElementById('bgColor'),
    navLinks: document.querySelectorAll('[data-nav]')
  };

  // ==================== Data Loading ====================
  async function loadAnimals() {
    try {
      const response = await fetch('data/animals.json');
      const data = await response.json();
      state.animals = data.animals;
      renderAnimalCards();
    } catch (error) {
      console.error('Error loading animals:', error);
      elements.animalsGrid.innerHTML = '<p>Unable to load animals. Please try again later.</p>';
    }
  }

  async function loadPosts() {
    try {
      const response = await fetch('data/posts.json');
      const data = await response.json();
      state.posts = data.posts;
      renderStoryCards();
    } catch (error) {
      console.error('Error loading posts:', error);
      elements.storiesGrid.innerHTML = '<p>Unable to load stories. Please try again later.</p>';
    }
  }

  // ==================== Rendering ====================
  function renderAnimalCards() {
    const cardsHTML = state.animals.map(animal => {
      const imageContent = animal.thumb
        ? `<img src="${animal.thumb}" alt="${animal.name}" class="card-photo">`
        : `<div class="card-emoji">${animal.emoji}</div>`;

      const personalityTags = animal.personality
        .map(trait => `<span class="tag">${trait}</span>`)
        .join('');

      return `
        <article class="card" data-animal="${animal.id}">
          ${imageContent}
          <div class="card-content">
            <h3 class="card-title">${animal.name}</h3>
            <div class="card-subtitle">${animal.species}</div>
            <p class="card-tagline">${animal.tagline}</p>
            <div class="card-meta">
              ${personalityTags}
            </div>
          </div>
        </article>
      `;
    }).join('');

    elements.animalsGrid.innerHTML = cardsHTML;

    // Add click listeners
    elements.animalsGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const animalId = card.dataset.animal;
        showAnimalDetail(animalId);
      });
    });
  }

  function renderStoryCards() {
    const cardsHTML = state.posts.map(post => {
      const animalNames = post.animals
        .map(id => {
          const animal = state.animals.find(a => a.id === id);
          return animal ? animal.name : id;
        })
        .join(', ');

      return `
        <article class="card" data-post="${post.id}">
          <div class="card-emoji">📖</div>
          <div class="card-content">
            <h3 class="card-title">${post.title}</h3>
            <div class="card-subtitle">${formatDate(post.date)}</div>
            <p class="card-tagline">${post.excerpt}</p>
            <div class="card-meta">
              <span class="tag">Featuring: ${animalNames}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    elements.storiesGrid.innerHTML = cardsHTML;

    // Add click listeners
    elements.storiesGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const postId = card.dataset.post;
        showPostDetail(postId);
      });
    });
  }

  // ==================== Detail Views ====================
  async function showAnimalDetail(animalId) {
    const animal = state.animals.find(a => a.id === animalId);
    if (!animal) return;

    state.currentDetail = { type: 'animal', id: animalId };
    elements.detailTitle.textContent = animal.name;

    // Show portrait
    const portraitHTML = animal.photo
      ? `<img src="${animal.photo}" alt="${animal.name}" class="animal-portrait">`
      : `<div class="animal-emoji-portrait">${animal.emoji}</div>`;

    // Load animal bio fragment
    try {
      const response = await fetch(animal.fragment);
      const bioHTML = await response.text();

      // Get posts featuring this animal
      const animalPosts = state.posts.filter(post =>
        post.animals.includes(animalId)
      );

      const postsHTML = animalPosts.length > 0
        ? `
          <div class="post-list">
            <h3 class="post-list-title">Stories Featuring ${animal.name}</h3>
            ${animalPosts.map(post => `
              <div class="post-item" data-post="${post.id}">
                <h4 class="post-title">${post.title}</h4>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-date">${formatDate(post.date)}</div>
              </div>
            `).join('')}
          </div>
        `
        : '<p class="text-muted">No stories yet featuring this animal.</p>';

      elements.detailContent.innerHTML = `
        ${portraitHTML}
        <h2 class="animal-name">${animal.name}</h2>
        <div class="animal-species">${animal.species}</div>
        ${bioHTML}
        <div class="facts-grid">
          <div class="fact">
            <div class="fact-label">Arrived</div>
            <div class="fact-value">${animal.arrived}</div>
          </div>
          <div class="fact">
            <div class="fact-label">Personality</div>
            <div class="fact-value">${animal.personality.join(', ')}</div>
          </div>
          <div class="fact">
            <div class="fact-label">Favorite Food</div>
            <div class="fact-value">${animal.favoriteFood}</div>
          </div>
        </div>
        ${postsHTML}
      `;

      // Add click listeners to post items
      elements.detailContent.querySelectorAll('.post-item').forEach(item => {
        item.addEventListener('click', () => {
          const postId = item.dataset.post;
          showPostDetail(postId);
        });
      });

      openDetailPanel();
    } catch (error) {
      console.error('Error loading animal details:', error);
      elements.detailContent.innerHTML = '<p>Unable to load animal details.</p>';
      openDetailPanel();
    }
  }

  async function showPostDetail(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    state.currentDetail = { type: 'post', id: postId };
    elements.detailTitle.textContent = post.title;

    try {
      const response = await fetch(post.url);
      const contentHTML = await response.text();

      // Get featured animals
      const featuredAnimals = post.animals
        .map(id => state.animals.find(a => a.id === id))
        .filter(Boolean);

      const featuredHTML = `
        <div class="featured-animals">
          <h3>Featured Animals</h3>
          <ul>
            ${featuredAnimals.map(animal => `
              <li>
                <a href="#" data-animal="${animal.id}">
                  ${animal.emoji} ${animal.name}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `;

      elements.detailContent.innerHTML = `
        <div class="post-header">
          <div class="post-date-large">${formatDate(post.date)}</div>
          <h2 class="post-title-large">${post.title}</h2>
          <div class="post-featured">
            Featuring: ${featuredAnimals.map(a => a.name).join(', ')}
          </div>
        </div>
        ${contentHTML}
        ${featuredHTML}
      `;

      // Add click listeners to featured animal links
      elements.detailContent.querySelectorAll('[data-animal]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const animalId = link.dataset.animal;
          showAnimalDetail(animalId);
        });
      });

      openDetailPanel();
    } catch (error) {
      console.error('Error loading post details:', error);
      elements.detailContent.innerHTML = '<p>Unable to load story details.</p>';
      openDetailPanel();
    }
  }

  function openDetailPanel() {
    elements.detailPanel.classList.add('active');
    elements.detailOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailPanel() {
    elements.detailPanel.classList.remove('active');
    elements.detailOverlay.classList.remove('active');
    document.body.style.overflow = '';
    state.currentDetail = null;
  }

  // ==================== Navigation ====================
  function switchView(view) {
    state.currentView = view;

    // Update nav links
    elements.navLinks.forEach(link => {
      if (link.dataset.nav === view) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Show/hide sections
    elements.animalsSection.classList.toggle('hidden', view !== 'animals');
    elements.storiesSection.classList.toggle('hidden', view !== 'stories');
    elements.aboutSection.classList.toggle('hidden', view !== 'about');
  }

  // ==================== Theme Controls ====================
  function toggleThemePanel() {
    elements.themePanel.classList.toggle('active');
  }

  function updateAccentColor(color) {
    document.documentElement.style.setProperty('--accent-primary', color);
    localStorage.setItem('accent-color', color);
  }

  function updateBgColor(color) {
    document.documentElement.style.setProperty('--bg-primary', color);
    localStorage.setItem('bg-color', color);
  }

  function loadTheme() {
    const accentColor = localStorage.getItem('accent-color');
    const bgColor = localStorage.getItem('bg-color');

    if (accentColor) {
      updateAccentColor(accentColor);
      elements.accentColor.value = accentColor;
    }

    if (bgColor) {
      updateBgColor(bgColor);
      elements.bgColor.value = bgColor;
    }
  }

  // ==================== Utilities ====================
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // ==================== Event Listeners ====================
  function attachEventListeners() {
    // Close detail panel
    elements.closeBtn.addEventListener('click', closeDetailPanel);
    elements.detailOverlay.addEventListener('click', closeDetailPanel);

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.currentDetail) {
        closeDetailPanel();
      }
    });

    // Navigation
    elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.nav;
        switchView(view);
      });
    });

    // Theme controls
    elements.themeToggle.addEventListener('click', toggleThemePanel);
    elements.accentColor.addEventListener('input', (e) => {
      updateAccentColor(e.target.value);
    });
    elements.bgColor.addEventListener('input', (e) => {
      updateBgColor(e.target.value);
    });
  }

  // ==================== Initialization ====================
  async function init() {
    attachEventListeners();
    loadTheme();
    await loadAnimals();
    await loadPosts();
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
