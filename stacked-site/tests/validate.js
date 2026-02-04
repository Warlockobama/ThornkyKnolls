/**
 * Simple site validation tests - no browser required
 * Run with: node tests/validate.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const STORIES_DIR = path.join(BASE_DIR, 'stories');

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

console.log('\n📋 File Structure Tests\n');

test('index.html exists', () => {
  assert(fs.existsSync(path.join(BASE_DIR, 'index.html')), 'index.html not found');
});

test('styles.css exists', () => {
  assert(fs.existsSync(path.join(BASE_DIR, 'styles.css')), 'styles.css not found');
});

test('manifest.json exists', () => {
  assert(fs.existsSync(path.join(STORIES_DIR, 'manifest.json')), 'manifest.json not found');
});

test('stories directory exists', () => {
  assert(fs.existsSync(STORIES_DIR), 'stories directory not found');
});

console.log('\n📋 Manifest Validation\n');

const manifest = JSON.parse(fs.readFileSync(path.join(STORIES_DIR, 'manifest.json'), 'utf8'));

test('manifest is valid JSON array', () => {
  assert(Array.isArray(manifest), 'manifest should be an array');
});

test('manifest has entries', () => {
  assert(manifest.length > 0, 'manifest should have entries');
});

test('all manifest entries have slug', () => {
  manifest.forEach((entry, i) => {
    assert(entry.slug, `Entry ${i} missing slug`);
  });
});

test('all manifest entries have type', () => {
  manifest.forEach((entry, i) => {
    assert(entry.type, `Entry ${i} (${entry.slug}) missing type`);
  });
});

test('cattle entries exist', () => {
  const cattle = manifest.filter(e => e.type === 'cattle');
  assert(cattle.length > 0, 'No cattle entries found');
});

test('equine entries exist', () => {
  const equine = manifest.filter(e => e.type === 'equine');
  assert(equine.length > 0, 'No equine entries found');
});

console.log('\n📋 Story File Validation\n');

manifest.forEach(entry => {
  test(`${entry.slug}.html exists`, () => {
    const storyPath = path.join(STORIES_DIR, `${entry.slug}.html`);
    assert(fs.existsSync(storyPath), `${entry.slug}.html not found`);
  });
});

console.log('\n📋 Image Validation\n');

const entriesWithImages = manifest.filter(e => e.images && e.images.length > 0);
test(`${entriesWithImages.length} entries have images`, () => {
  assert(entriesWithImages.length > 0, 'No entries have images');
});

entriesWithImages.forEach(entry => {
  entry.images.forEach(imgPath => {
    const shortName = imgPath.split('/').pop();
    test(`${entry.slug}: ${shortName}`, () => {
      const fullPath = path.join(STORIES_DIR, imgPath);
      assert(fs.existsSync(fullPath), `Image not found: ${imgPath}`);
    });
  });
});

console.log('\n📋 HTML Content Validation\n');

const indexHtml = fs.readFileSync(path.join(BASE_DIR, 'index.html'), 'utf8');

test('index.html has masthead', () => {
  assert(indexHtml.includes('class="masthead"'), 'masthead not found');
});

test('index.html has navigation tabs', () => {
  assert(indexHtml.includes('data-tab="herd"'), 'herd tab not found');
  assert(indexHtml.includes('data-tab="equine"'), 'equine tab not found');
});

test('index.html has herd panel', () => {
  assert(indexHtml.includes('id="panel-herd"'), 'herd panel not found');
});

test('index.html has herd register', () => {
  assert(indexHtml.includes('id="herd-register"'), 'herd register not found');
});

test('index.html has detail panels', () => {
  assert(indexHtml.includes('id="herd-detail"'), 'herd detail not found');
  assert(indexHtml.includes('id="equine-detail"'), 'equine detail not found');
});

test('index.html has loadStories function', () => {
  assert(indexHtml.includes('const loadStories'), 'loadStories function not found');
});

test('index.html has attachGalleryHandlers function', () => {
  assert(indexHtml.includes('const attachGalleryHandlers'), 'attachGalleryHandlers function not found');
});

test('index.html preloads stories', () => {
  assert(indexHtml.includes('loadStories();'), 'loadStories() call not found');
});

test('fallback manifest has types', () => {
  assert(indexHtml.includes('slug: "anabella", type: "cattle"'), 'fallback missing cattle type');
  assert(indexHtml.includes('slug: "argus", type: "equine"'), 'fallback missing equine type');
});

console.log('\n📋 CSS Validation\n');

const css = fs.readFileSync(path.join(BASE_DIR, 'styles.css'), 'utf8');

test('styles.css has card styles', () => {
  assert(css.includes('.card'), 'card styles not found');
});

test('styles.css has detail panel styles', () => {
  assert(css.includes('.animal-detail'), 'animal-detail styles not found');
});

test('styles.css has gallery styles', () => {
  assert(css.includes('.journal-gallery'), 'journal-gallery styles not found');
});

test('styles.css shows thumbs in detail-content', () => {
  assert(css.includes('.detail-content .journal-gallery__thumbs'), 'detail-content gallery thumbs rule not found');
});

test('styles.css has responsive breakpoints', () => {
  assert(css.includes('@media'), 'media queries not found');
});

// Summary
console.log('\n' + '═'.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
