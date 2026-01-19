# Thorny Knolls Hybrid

The best of both worlds: combining **stacked-site's** professional design and vanilla JavaScript with **test.html's** scalable animal profile and blog post architecture.

## Features

✨ **From stacked-site:**
- Professional, clean design
- Vanilla JavaScript (no dependencies like HTMX)
- CSS custom properties for easy theming
- Theme customization controls
- Efficient performance

✨ **From test.html:**
- Individual animal profile pages
- Blog post system with animal tagging
- Scalable content organization
- Whimsical touches (handwritten fonts, notebook aesthetic)

✨ **New enhancements:**
- Real photo support with emoji fallback
- Cleaner separation of concerns (external CSS/JS)
- Smaller initial payload
- Sliding detail panel UI
- Better responsive design

## Quick Start

1. **Start a local server:**
   ```bash
   cd hybrid-site
   python -m http.server 8000
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

3. **Explore:**
   - Click "Our Animals" to see all 10 animal profiles
   - Click "Farm Stories" to see blog posts
   - Click any card to view details in the sliding panel
   - Try the Theme controls (bottom-right) to customize colors

## Project Structure

```
hybrid-site/
├── index.html                 # Main SPA shell
├── css/
│   └── styles.css            # All styling with CSS custom properties
├── js/
│   └── app.js                # Vanilla JS application logic
├── data/
│   ├── animals.json          # Animal metadata with photo paths
│   └── posts.json            # Blog post metadata
├── animals/
│   ├── pumpkin.html          # Animal bio fragments
│   ├── lebella.html
│   ├── anabella.html
│   ├── dobby.html
│   ├── argus.html
│   ├── willow.html
│   ├── sega.html
│   ├── hugo.html
│   ├── smoke.html
│   └── raider.html
├── posts/
│   ├── morning-chores.html   # Blog post content fragments
│   ├── feeding-frenzy.html
│   └── sunset-trouble.html
└── gallery/
    ├── *.webp                # Optimized animal photos
    └── thumbs/*.webp         # Thumbnails for cards
```

## Animals with Photos

Currently, 3 animals have real photos (others use emoji placeholders):
- **Pumpkin** - gallery/pumpkin-red-highland.webp
- **Lebella** - gallery/labella-rustic-field.webp
- **Anabella** - gallery/anabella-calf-trail.webp

To add photos for other animals:
1. Add optimized WebP photo to `gallery/`
2. Add thumbnail to `gallery/thumbs/`
3. Update `data/animals.json` with photo paths

## Adding Content

### Add a New Animal

1. Create bio fragment in `animals/{name}.html`:
   ```html
   <div class="animal-bio">
     <p>Your animal's story...</p>
   </div>
   ```

2. Add entry to `data/animals.json`:
   ```json
   {
     "id": "name",
     "name": "Animal Name",
     "species": "Species Type",
     "emoji": "🐄",
     "photo": "gallery/photo.webp",     // or null
     "thumb": "gallery/thumbs/photo.webp", // or null
     "tagline": "Short description",
     "arrived": "Month Year",
     "personality": ["Trait1", "Trait2"],
     "favoriteFood": "Favorite food",
     "fragment": "animals/name.html"
   }
   ```

### Add a New Blog Post

1. Create content fragment in `posts/{slug}.html`:
   ```html
   <div class="post-content">
     <p>Your story content...</p>
   </div>
   ```

2. Add entry to `data/posts.json`:
   ```json
   {
     "id": "slug",
     "title": "Post Title",
     "date": "2025-01-15",
     "excerpt": "Brief description",
     "animals": ["pumpkin", "dobby"],
     "url": "posts/slug.html"
   }
   ```

## Customization

### Change Theme Colors

Use the Theme controls in the bottom-right corner, or edit CSS custom properties in `css/styles.css`:

```css
:root {
  --bg-primary: #fdfbf7;      /* Background color */
  --accent-primary: #8b5cf6;  /* Accent color (purple) */
  --accent-secondary: #c7df6a; /* Secondary accent (green) */
  /* ... more variables */
}
```

### Modify Typography

Change font families in `css/styles.css`:

```css
:root {
  --font-heading: 'Abril Fatface', serif;
  --font-body: Georgia, serif;
  --font-hand: 'Patrick Hand', cursive;
}
```

## Technical Details

- **No build system required** - Pure HTML, CSS, and JavaScript
- **No external dependencies** - All vanilla, no frameworks
- **ES6+ JavaScript** - Modern syntax with async/await
- **CSS Grid & Flexbox** - Responsive layouts
- **WebP images** - Optimized photo format
- **LocalStorage** - Theme preferences persist

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design for mobile, tablet, desktop

## Performance

- Initial load: < 100KB (HTML + CSS + JS)
- Photos: Lazy-loaded WebP format
- Fragments: Loaded on-demand
- Theme: CSS custom properties for instant updates

## Comparison to Other Versions

| Feature | hybrid-site | stacked-site | test.html |
|---------|-------------|--------------|-----------|
| Dependencies | None | None | HTMX, TailwindCSS |
| Animal Profiles | ✅ Individual pages | ❌ | ✅ Individual pages |
| Blog Posts | ✅ Tagged by animal | ❌ | ✅ Tagged by animal |
| Photos | ✅ With fallback | ✅ | ❌ Emojis only |
| Theme Controls | ✅ | ✅ | ❌ |
| File Size | Small | Small | Large |
| Scalability | High | Medium | High |
| Design | Professional + whimsy | Professional | Whimsical |

## Future Enhancements

Potential additions:
- Search functionality
- Filter animals by species/personality
- Timeline view of blog posts
- Photo gallery lightbox
- RSS feed
- Social sharing
- Print styles for animal cards

## Credits

- **Fonts:** Google Fonts (Abril Fatface, Patrick Hand, Georgia)
- **Photos:** Optimized from original farm photos
- **Architecture:** Hybrid of stacked-site and test.html implementations
- **Design:** Professional meets whimsical

---

Made with ❤️ at Thorny Knolls Farm
