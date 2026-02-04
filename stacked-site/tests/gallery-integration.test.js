/**
 * Gallery Integration Test - mimics exact site behavior
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
    console.log(`    Stack: ${err.stack?.split('\n')[1]}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Read actual story HTML file
const pumpkinHtml = fs.readFileSync(
  path.join(__dirname, '../stories/pumpkin.html'),
  'utf8'
);

// Read actual manifest
const manifest = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../stories/manifest.json'),
  'utf8'
));

console.log('\n📋 Testing Exact Site Flow\n');

test('pumpkin.html has journal-photo element', () => {
  const dom = new JSDOM(pumpkinHtml);
  const photo = dom.window.document.querySelector('.journal-photo');
  assert(photo !== null, 'No .journal-photo element found');
  console.log(`    Classes: ${photo.className}`);
});

test('pumpkin manifest entry has images', () => {
  const pumpkinEntry = manifest.find(e => e.slug === 'pumpkin');
  assert(pumpkinEntry, 'No pumpkin entry in manifest');
  assert(pumpkinEntry.images && pumpkinEntry.images.length > 0, 'No images for pumpkin');
  console.log(`    Image count: ${pumpkinEntry.images.length}`);
});

test('simulating loadStories gallery injection', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="wrapper"></div></body></html>');
  const { document } = dom.window;

  // Create wrapper like loadStories does
  const wrapper = document.createElement("article");
  wrapper.className = "journal-entry-shell";

  // Set innerHTML from story file (like line 643)
  wrapper.innerHTML = pumpkinHtml;

  // Get pumpkin's images from manifest
  const pumpkinEntry = manifest.find(e => e.slug === 'pumpkin');
  const images = pumpkinEntry.images;

  // This is the gallery injection logic from lines 656-692
  let photo = wrapper.querySelector(".journal-photo");
  assert(photo !== null, 'Could not find .journal-photo in wrapper');

  console.log(`    Before injection - photo classes: ${photo.className}`);

  // Clear and add gallery class
  photo.innerHTML = "";
  photo.classList.add("journal-gallery");

  // Create main image container
  const main = document.createElement("div");
  main.className = "journal-gallery__main";
  const hero = document.createElement("img");
  hero.src = images[0];
  hero.alt = "Test";
  main.appendChild(hero);

  // Create thumbs container
  const thumbs = document.createElement("div");
  thumbs.className = "journal-gallery__thumbs";
  images.forEach((imgPath, idx) => {
    const thumb = document.createElement("img");
    thumb.src = imgPath;
    thumb.alt = `Thumb ${idx + 1}`;
    thumbs.appendChild(thumb);
  });

  photo.appendChild(main);
  photo.appendChild(thumbs);

  console.log(`    After injection - photo classes: ${photo.className}`);

  // Verify structure
  const galleryMain = wrapper.querySelector('.journal-gallery__main');
  const galleryThumbs = wrapper.querySelector('.journal-gallery__thumbs');
  const heroImg = wrapper.querySelector('.journal-gallery__main img');
  const thumbImgs = wrapper.querySelectorAll('.journal-gallery__thumbs img');

  assert(galleryMain !== null, 'Gallery main not found');
  assert(galleryThumbs !== null, 'Gallery thumbs not found');
  assert(heroImg !== null, 'Hero image not found');
  assert(thumbImgs.length === images.length, `Expected ${images.length} thumbs, got ${thumbImgs.length}`);
});

test('wrapper.innerHTML preserves gallery structure', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const { document } = dom.window;

  // Recreate the full flow
  const wrapper = document.createElement("article");
  wrapper.className = "journal-entry-shell";
  wrapper.innerHTML = pumpkinHtml;

  const pumpkinEntry = manifest.find(e => e.slug === 'pumpkin');
  const images = pumpkinEntry.images;

  let photo = wrapper.querySelector(".journal-photo");
  photo.innerHTML = "";
  photo.classList.add("journal-gallery");

  const main = document.createElement("div");
  main.className = "journal-gallery__main";
  const hero = document.createElement("img");
  hero.src = images[0];
  main.appendChild(hero);

  const thumbsDiv = document.createElement("div");
  thumbsDiv.className = "journal-gallery__thumbs";
  images.forEach(imgPath => {
    const thumb = document.createElement("img");
    thumb.src = imgPath;
    thumbsDiv.appendChild(thumb);
  });

  photo.appendChild(main);
  photo.appendChild(thumbsDiv);

  // Now get innerHTML like line 705 does
  const storedHtml = wrapper.innerHTML;

  console.log(`    Stored HTML length: ${storedHtml.length}`);
  console.log(`    Contains journal-gallery: ${storedHtml.includes('journal-gallery')}`);
  console.log(`    Contains journal-gallery__main: ${storedHtml.includes('journal-gallery__main')}`);
  console.log(`    Contains journal-gallery__thumbs: ${storedHtml.includes('journal-gallery__thumbs')}`);

  assert(storedHtml.includes('journal-gallery__main'), 'Stored HTML missing gallery__main');
  assert(storedHtml.includes('journal-gallery__thumbs'), 'Stored HTML missing gallery__thumbs');
});

test('openDetail receives correct HTML and attachGalleryHandlers works', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html><body>
      <div class="animal-detail" id="herd-detail">
        <button class="detail-close">Close</button>
        <div class="detail-content"></div>
      </div>
    </body></html>
  `);
  const { document } = dom.window;

  // Build the stored HTML like loadStories does
  const wrapper = document.createElement("article");
  wrapper.className = "journal-entry-shell";
  wrapper.innerHTML = pumpkinHtml;

  const pumpkinEntry = manifest.find(e => e.slug === 'pumpkin');
  const images = pumpkinEntry.images;

  let photo = wrapper.querySelector(".journal-photo");
  photo.innerHTML = "";
  photo.classList.add("journal-gallery");

  const main = document.createElement("div");
  main.className = "journal-gallery__main";
  const hero = document.createElement("img");
  hero.src = images[0];
  main.appendChild(hero);

  const thumbsDiv = document.createElement("div");
  thumbsDiv.className = "journal-gallery__thumbs";
  images.forEach(imgPath => {
    const thumb = document.createElement("img");
    thumb.src = imgPath;
    thumbsDiv.appendChild(thumb);
  });

  photo.appendChild(main);
  photo.appendChild(thumbsDiv);

  const entryHtml = wrapper.innerHTML;

  // Now simulate openDetail
  const detailEl = document.getElementById('herd-detail');
  const content = detailEl.querySelector('.detail-content');

  // This is what openDetail does
  content.innerHTML = entryHtml;

  // Verify structure is preserved
  const gallery = content.querySelector('.journal-gallery');
  const heroInDetail = content.querySelector('.journal-gallery__main img');
  const thumbsInDetail = content.querySelectorAll('.journal-gallery__thumbs img');

  console.log(`    Gallery found: ${gallery !== null}`);
  console.log(`    Hero found: ${heroInDetail !== null}`);
  console.log(`    Thumbs found: ${thumbsInDetail.length}`);

  assert(gallery !== null, 'Gallery not found in detail-content');
  assert(heroInDetail !== null, 'Hero image not found in detail-content');
  assert(thumbsInDetail.length > 0, 'No thumbs found in detail-content');

  // Now test attachGalleryHandlers - matches actual site code
  function attachGalleryHandlers(container) {
    const gallery = container.querySelector(".journal-gallery");
    if (!gallery) {
      console.log('    attachGalleryHandlers: no gallery found');
      return false;
    }
    const hero = gallery.querySelector(".journal-gallery__main img");
    const thumbs = gallery.querySelectorAll(".journal-gallery__thumbs img");
    if (!hero || !thumbs.length) {
      console.log(`    attachGalleryHandlers: hero=${!!hero}, thumbs=${thumbs.length}`);
      return false;
    }
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
    console.log(`    attachGalleryHandlers: attached handlers to ${thumbs.length} thumbs`);
    return true;
  }

  const attached = attachGalleryHandlers(content);
  assert(attached, 'attachGalleryHandlers returned false');

  // Test clicking
  const thumbsAfter = content.querySelectorAll('.journal-gallery__thumbs img');
  const heroAfter = content.querySelector('.journal-gallery__main img');

  const initialSrc = heroAfter.src;
  console.log(`    Initial hero src: ${initialSrc}`);

  // Click second thumb using onclick
  const mockEvent = { stopPropagation: () => {}, preventDefault: () => {} };
  thumbsAfter[1].onclick(mockEvent);

  const newSrc = heroAfter.src;
  console.log(`    After click hero src: ${newSrc}`);

  assert(newSrc !== initialSrc, 'Hero src did not change after click');
  assert(newSrc === thumbsAfter[1].src, 'Hero src does not match clicked thumb');
  assert(thumbsAfter[1].classList.contains('is-active'), 'Clicked thumb should have is-active');
});

// Summary
console.log('\n' + '═'.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
