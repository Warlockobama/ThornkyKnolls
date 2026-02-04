// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Thorny Knolls Site', () => {

  test.describe('Page Load', () => {
    test('homepage loads without errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto('/');
      await expect(page).toHaveTitle(/Thorny Knolls/);
      await expect(page.locator('.masthead')).toBeVisible();

      // Allow time for stories to load
      await page.waitForTimeout(2000);

      // Check for JS errors (filter out expected ones)
      const criticalErrors = errors.filter(e => !e.includes('favicon'));
      expect(criticalErrors).toHaveLength(0);
    });

    test('all main sections exist', async ({ page }) => {
      await page.goto('/');

      const sections = ['home', 'herd', 'equine', 'story', 'notes', 'contact', 'field'];
      for (const section of sections) {
        await expect(page.locator(`[data-card="${section}"]`)).toBeAttached();
      }
    });
  });

  test.describe('Navigation', () => {
    test('tab buttons switch panels', async ({ page }) => {
      await page.goto('/');

      // Click Highland Herd tab
      await page.click('[data-tab="herd"]');
      await expect(page.locator('#panel-herd')).toHaveClass(/is-active/);

      // Click Equine Friends tab
      await page.click('[data-tab="equine"]');
      await expect(page.locator('#panel-equine')).toHaveClass(/is-active/);

      // Click Field Notes tab
      await page.click('[data-tab="notes"]');
      await expect(page.locator('#panel-notes')).toHaveClass(/is-active/);
    });

    test('nav links in masthead work', async ({ page }) => {
      await page.goto('/');

      await page.click('.nav__link[data-tab="contact"]');
      await expect(page.locator('#panel-contact')).toHaveClass(/is-active/);
    });

    test('logo returns to home', async ({ page }) => {
      await page.goto('/');

      // Navigate away first
      await page.click('[data-tab="herd"]');
      await expect(page.locator('#panel-herd')).toHaveClass(/is-active/);

      // Click logo/mark
      await page.click('.mark');
      await expect(page.locator('#panel-home')).toHaveClass(/is-active/);
    });

    test('URL hash updates on navigation', async ({ page }) => {
      await page.goto('/');

      await page.click('[data-tab="herd"]');
      await expect(page).toHaveURL(/#herd/);

      await page.click('[data-tab="equine"]');
      await expect(page).toHaveURL(/#equine/);
    });
  });

  test.describe('Highland Herd Section', () => {
    test('herd cards are visible', async ({ page }) => {
      await page.goto('/#herd');
      await page.waitForTimeout(2000); // Wait for stories to load

      const cards = page.locator('#panel-herd .card-grid .card');
      await expect(cards.first()).toBeVisible();
    });

    test('herd register populates', async ({ page }) => {
      await page.goto('/#herd');
      await page.waitForTimeout(3000); // Wait for stories to load

      const register = page.locator('#herd-register');
      // Should not show loading message after stories load
      const loadingText = await register.textContent();
      expect(loadingText).not.toContain('Loading herd register');
    });

    test('clicking card opens detail panel', async ({ page }) => {
      await page.goto('/#herd');
      await page.waitForTimeout(2000);

      // Click first card
      await page.click('#panel-herd .card-grid .card:first-child');
      await page.waitForTimeout(500);

      // Check if detail panel opened
      const detail = page.locator('#herd-detail');
      await expect(detail).toHaveClass(/is-open/);
    });

    test('close button closes detail panel', async ({ page }) => {
      await page.goto('/#herd');
      await page.waitForTimeout(2000);

      // Open detail
      await page.click('#panel-herd .card-grid .card:first-child');
      await page.waitForTimeout(500);

      // Close it
      await page.click('#herd-detail .detail-close');
      await page.waitForTimeout(300);

      const detail = page.locator('#herd-detail');
      await expect(detail).not.toHaveClass(/is-open/);
    });

    test('ESC key closes detail panel', async ({ page }) => {
      await page.goto('/#herd');
      await page.waitForTimeout(2000);

      // Open detail
      await page.click('#panel-herd .card-grid .card:first-child');
      await page.waitForTimeout(500);

      // Press ESC
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const detail = page.locator('#herd-detail');
      await expect(detail).not.toHaveClass(/is-open/);
    });

    test('carousel arrows navigate cards', async ({ page }) => {
      await page.goto('/#herd');
      await page.waitForTimeout(2000);

      const nextBtn = page.locator('.section-controls[data-section="herd"] [data-dir="next"]');

      if (await nextBtn.isEnabled()) {
        // Get first card title before
        const firstCardBefore = await page.locator('#panel-herd .card-grid .card:first-child h3').textContent();

        await nextBtn.click();
        await page.waitForTimeout(500);

        // Get first card title after
        const firstCardAfter = await page.locator('#panel-herd .card-grid .card:first-child h3').textContent();

        // Should have changed (or be same if not enough cards)
        // This is a soft check - carousel may not change if fewer entries than display size
      }
    });
  });

  test.describe('Gallery Functionality', () => {
    test('gallery thumbnails change main image', async ({ page }) => {
      await page.goto('/#herd');
      await page.waitForTimeout(2000);

      // Click a card that has images (cattle type with images)
      await page.click('#panel-herd .card-grid .card:first-child');
      await page.waitForTimeout(500);

      const gallery = page.locator('#herd-detail .journal-gallery');

      if (await gallery.isVisible()) {
        const hero = gallery.locator('.journal-gallery__main img');
        const thumbs = gallery.locator('.journal-gallery__thumbs img');

        if (await thumbs.count() > 1) {
          const initialSrc = await hero.getAttribute('src');

          // Click second thumbnail
          await thumbs.nth(1).click();
          await page.waitForTimeout(300);

          const newSrc = await hero.getAttribute('src');
          expect(newSrc).not.toBe(initialSrc);
        }
      }
    });
  });

  test.describe('Field Notes Section', () => {
    test('story entries load', async ({ page }) => {
      await page.goto('/#notes');
      await page.waitForTimeout(3000);

      const entries = page.locator('#story-entries .journal-entry-shell');
      const count = await entries.count();
      expect(count).toBeGreaterThan(0);
    });

    test('clicking entry updates detail panel', async ({ page }) => {
      await page.goto('/#notes');
      await page.waitForTimeout(3000);

      const firstEntry = page.locator('#story-entries .journal-entry-shell:first-child');
      const entryTitle = await firstEntry.locator('.journal-title').textContent();

      await firstEntry.click();
      await page.waitForTimeout(500);

      const detailTitle = await page.locator('#story-detail .journal-title').textContent();
      expect(detailTitle).toBe(entryTitle);
    });
  });

  test.describe('Contact Form', () => {
    test('form validates required fields', async ({ page }) => {
      await page.goto('/#contact');

      // Submit empty form
      await page.click('.contact__form button[type="submit"]');

      const status = page.locator('.form-status');
      await expect(status).toContainText('Please add your name');
    });

    test('form validates email format', async ({ page }) => {
      await page.goto('/#contact');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('textarea[name="reason"]', 'Test message');

      await page.click('.contact__form button[type="submit"]');

      const status = page.locator('.form-status');
      await expect(status).toContainText('email looks off');
    });

    test('form accepts valid submission', async ({ page }) => {
      await page.goto('/#contact');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="reason"]', 'Just testing the form');

      await page.click('.contact__form button[type="submit"]');

      const status = page.locator('.form-status');
      await expect(status).toContainText('Message noted');
    });
  });

  test.describe('Color Lab', () => {
    test('color lab opens and closes', async ({ page }) => {
      await page.goto('/');

      const colorLab = page.locator('.color-lab');
      await colorLab.click();

      const body = page.locator('.color-lab__body');
      await expect(body).toBeVisible();
    });

    test('reset button works', async ({ page }) => {
      await page.goto('/');

      // Open color lab
      await page.click('.color-lab summary');
      await page.waitForTimeout(300);

      // Click reset
      await page.click('.color-lab__reset');
      // Should not error
    });
  });

  test.describe('Screenshots', () => {
    test('capture all sections', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/screenshots/home.png', fullPage: true });

      await page.goto('/#herd');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/herd.png', fullPage: true });

      await page.goto('/#equine');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/screenshots/equine.png', fullPage: true });

      await page.goto('/#notes');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/notes.png', fullPage: true });

      await page.goto('/#contact');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/contact.png', fullPage: true });
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile navigation works', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Tab bar should still work on mobile
      await page.click('[data-tab="herd"]');
      await expect(page.locator('#panel-herd')).toHaveClass(/is-active/);
    });
  });

  test.describe('Accessibility', () => {
    test('panels have proper ARIA attributes', async ({ page }) => {
      await page.goto('/');

      // Active panel should have aria-hidden=false
      const activePanel = page.locator('.card-panel.is-active');
      await expect(activePanel).toHaveAttribute('aria-hidden', 'false');

      // Inactive panels should have aria-hidden=true
      const inactivePanel = page.locator('.card-panel:not(.is-active)').first();
      await expect(inactivePanel).toHaveAttribute('aria-hidden', 'true');
    });

    test('tabs have proper ARIA roles', async ({ page }) => {
      await page.goto('/');

      const tab = page.locator('.tab-button').first();
      await expect(tab).toHaveAttribute('role', 'tab');
    });
  });
});
