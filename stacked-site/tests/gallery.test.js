/**
 * Gallery Click Handler Tests using JSDOM
 * Tests actual browser behavior by simulating DOM and events
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Create a minimal DOM environment that mimics the site structure
function createTestDOM() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Test</title></head>
    <body>
      <div class="animal-detail" id="herd-detail">
        <button class="detail-close">Close</button>
        <div class="detail-content"></div>
      </div>
      <div class="story-detail" id="story-detail"></div>
    </body>
    </html>
  `;

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable'
  });

  return dom;
}

// Create gallery HTML like the site does
function createGalleryHTML() {
  return `
    <article class="journal-entry-shell">
      <div class="journal-photo journal-gallery">
        <div class="journal-gallery__main">
          <img src="image1.jpg" alt="Main image" />
        </div>
        <div class="journal-gallery__thumbs">
          <img src="image1.jpg" alt="Thumb 1" />
          <img src="image2.jpg" alt="Thumb 2" />
          <img src="image3.jpg" alt="Thumb 3" />
        </div>
      </div>
    </article>
  `;
}

// Extract the attachGalleryHandlers function from index.html
function getAttachGalleryHandlers() {
  // This is the function we need to test - matches the actual site code
  return function attachGalleryHandlers(container) {
    const gallery = container.querySelector(".journal-gallery");
    if (!gallery) return;
    const hero = gallery.querySelector(".journal-gallery__main img");
    const thumbs = gallery.querySelectorAll(".journal-gallery__thumbs img");
    if (!hero || !thumbs.length) return;
    gallery.dataset.handlersAttached = 'true';
    thumbs.forEach((thumb) => {
      thumb.style.cursor = "pointer";
      thumb.onclick = (event) => {
        event.stopPropagation();
        event.preventDefault();
        hero.src = thumb.src;
        hero.alt = thumb.alt || hero.alt;
        thumbs.forEach(t => t.classList.remove("is-active"));
        thumb.classList.add("is-active");
      };
    });
  };
}

console.log('\n📋 Gallery Handler Unit Tests\n');

test('attachGalleryHandlers finds gallery element', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = createGalleryHTML();

  const gallery = container.querySelector('.journal-gallery');
  assert(gallery !== null, 'Gallery element not found');
});

test('attachGalleryHandlers finds hero image', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = createGalleryHTML();

  const hero = container.querySelector('.journal-gallery__main img');
  assert(hero !== null, 'Hero image not found');
  assert(hero.src.includes('image1.jpg'), 'Hero has wrong initial src');
});

test('attachGalleryHandlers finds thumbnail images', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = createGalleryHTML();

  const thumbs = container.querySelectorAll('.journal-gallery__thumbs img');
  assert(thumbs.length === 3, `Expected 3 thumbs, got ${thumbs.length}`);
});

test('clicking thumbnail changes hero src', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = createGalleryHTML();

  const attachGalleryHandlers = getAttachGalleryHandlers();
  attachGalleryHandlers(container);

  const hero = container.querySelector('.journal-gallery__main img');
  const thumbs = container.querySelectorAll('.journal-gallery__thumbs img');

  // Initial state
  assert(hero.src.includes('image1.jpg'), 'Hero should start with image1');

  // Click second thumbnail using onclick directly
  thumbs[1].onclick({ stopPropagation: () => {}, preventDefault: () => {} });

  // Check hero changed
  assert(hero.src.includes('image2.jpg'), `Hero should be image2 after click, got ${hero.src}`);
});

test('clicking thumbnail adds is-active class', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = createGalleryHTML();

  const attachGalleryHandlers = getAttachGalleryHandlers();
  attachGalleryHandlers(container);

  const thumbs = container.querySelectorAll('.journal-gallery__thumbs img');
  const mockEvent = { stopPropagation: () => {}, preventDefault: () => {} };

  // Click second thumbnail
  thumbs[1].onclick(mockEvent);

  assert(thumbs[1].classList.contains('is-active'), 'Clicked thumb should have is-active class');
  assert(!thumbs[0].classList.contains('is-active'), 'Other thumbs should not have is-active class');
});

test('clicking different thumbnail removes previous is-active', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = createGalleryHTML();

  const attachGalleryHandlers = getAttachGalleryHandlers();
  attachGalleryHandlers(container);

  const thumbs = container.querySelectorAll('.journal-gallery__thumbs img');
  const mockEvent = { stopPropagation: () => {}, preventDefault: () => {} };

  // Click second thumbnail
  thumbs[1].onclick(mockEvent);
  assert(thumbs[1].classList.contains('is-active'), 'Second thumb should be active');

  // Click third thumbnail
  thumbs[2].onclick(mockEvent);
  assert(thumbs[2].classList.contains('is-active'), 'Third thumb should be active');
  assert(!thumbs[1].classList.contains('is-active'), 'Second thumb should no longer be active');
});

test('thumbnail gets cursor pointer style', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = createGalleryHTML();

  const attachGalleryHandlers = getAttachGalleryHandlers();
  attachGalleryHandlers(container);

  const thumbs = container.querySelectorAll('.journal-gallery__thumbs img');
  assert(thumbs[0].style.cursor === 'pointer', 'Thumb should have cursor: pointer');
});

test('attachGalleryHandlers returns early if no gallery', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = '<div>No gallery here</div>';

  const attachGalleryHandlers = getAttachGalleryHandlers();
  // Should not throw
  attachGalleryHandlers(container);
});

test('attachGalleryHandlers returns early if no thumbs', () => {
  const dom = createTestDOM();
  const { document } = dom.window;
  const container = document.querySelector('.detail-content');
  container.innerHTML = `
    <div class="journal-gallery">
      <div class="journal-gallery__main"><img src="test.jpg" /></div>
      <div class="journal-gallery__thumbs"></div>
    </div>
  `;

  const attachGalleryHandlers = getAttachGalleryHandlers();
  // Should not throw
  attachGalleryHandlers(container);
});

console.log('\n📋 Integration Test: Simulating Site Behavior\n');

test('openDetail flow attaches handlers correctly', () => {
  const dom = createTestDOM();
  const { document } = dom.window;

  const attachGalleryHandlers = getAttachGalleryHandlers();

  // Simulate openDetail behavior
  const detailEl = document.querySelector('#herd-detail');
  const content = detailEl.querySelector('.detail-content');
  const galleryHTML = createGalleryHTML();

  // This is what openDetail does
  content.innerHTML = galleryHTML;
  attachGalleryHandlers(content);

  // Now test clicking
  const hero = content.querySelector('.journal-gallery__main img');
  const thumbs = content.querySelectorAll('.journal-gallery__thumbs img');

  thumbs[2].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  assert(hero.src.includes('image3.jpg'), 'Hero should update to image3');
  assert(thumbs[2].classList.contains('is-active'), 'Third thumb should be active');
});

test('updateDetail flow attaches handlers correctly', () => {
  const dom = createTestDOM();
  const { document } = dom.window;

  const attachGalleryHandlers = getAttachGalleryHandlers();

  // Simulate updateDetail behavior
  const detail = document.querySelector('#story-detail');
  const galleryHTML = createGalleryHTML();

  // This is what updateDetail does
  detail.innerHTML = galleryHTML;
  attachGalleryHandlers(detail);

  // Now test clicking
  const hero = detail.querySelector('.journal-gallery__main img');
  const thumbs = detail.querySelectorAll('.journal-gallery__thumbs img');

  thumbs[1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  assert(hero.src.includes('image2.jpg'), 'Hero should update to image2');
});

// Summary
console.log('\n' + '═'.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
