# Thorny Knolls Hybrid - Architecture

## Design Philosophy

Combining the best of both implementations:
- **stacked-site**: Professional appearance, vanilla JS, no dependencies, theme customization
- **test.html**: Animal profiles, blog posts, scalable content structure, whimsical charm

## Key Features

### From stacked-site
- ✅ Vanilla JavaScript (no HTMX dependency)
- ✅ CSS custom properties for theming
- ✅ Professional, clean design language
- ✅ Theme customization controls
- ✅ Efficient manifest-based data loading
- ✅ Responsive without media query overload

### From test.html
- ✅ Individual animal profile pages
- ✅ Blog post architecture with animal tagging
- ✅ Scalable content organization
- ✅ Whimsical notebook/journal aesthetic touches
- ✅ Card-based layout
- ✅ Real photos for animal portraits

### New Enhancements
- ✅ Photo support with emoji fallback
- ✅ Cleaner separation of concerns (external CSS/JS)
- ✅ Better performance (smaller initial payload)
- ✅ Accessible navigation
- ✅ Progressive enhancement

## File Structure

```
hybrid-site/
├── index.html                 # Main SPA shell
├── css/
│   └── styles.css            # All styling with CSS custom properties
├── js/
│   ├── app.js                # Main application logic
│   └── data.js               # Data fetching and management
├── data/
│   ├── animals.json          # Animal metadata with photo paths
│   └── posts.json            # Blog post metadata
├── animals/
│   └── {name}.html           # Animal profile fragments
├── posts/
│   └── {name}.html           # Blog post fragments
└── gallery/
    ├── *.webp                # Optimized photos
    └── thumbs/*.webp         # Thumbnails
```

## Data Flow

1. **Initial Load**:
   - Load index.html with inline critical CSS
   - Load external styles.css and app.js
   - Fetch data/animals.json and data/posts.json

2. **Navigation**:
   - User clicks animal/post card
   - Vanilla JS handles routing (no page reload)
   - Fetch corresponding HTML fragment
   - Render in detail panel with smooth transition

3. **Photo Loading**:
   - Check if animal has photo in animals.json
   - If yes: Load from gallery/thumbs/ for cards, gallery/ for profiles
   - If no: Use emoji fallback

## Technical Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox, no framework
- **Vanilla JavaScript**: ES6+, no libraries
- **WebP images**: Optimized photos with fallback
- **JSON**: Data management

## Design System

### Color Palette
```css
--bg-primary: #fdfbf7;        /* Warm paper white */
--bg-secondary: #f5f1e8;      /* Aged paper */
--text-primary: #2d2d2d;      /* Soft black */
--text-secondary: #6b6b6b;    /* Gray */
--accent-primary: #8b5cf6;    /* Purple */
--accent-secondary: #c7df6a;  /* Sage green */
--border: #d4d4d4;            /* Light gray */
```

### Typography
- **Headings**: Abril Fatface (serif, playful)
- **Body**: Georgia (serif, readable)
- **Handwritten**: Patrick Hand (cursive, whimsy)
- **UI Elements**: System fonts (performance)

### Spacing Scale
- xs: 0.25rem
- sm: 0.5rem
- md: 1rem
- lg: 1.5rem
- xl: 2rem
- 2xl: 3rem

## Performance Targets

- Initial load: < 100KB (HTML + CSS + JS)
- Time to interactive: < 2s on 3G
- Photos: WebP with lazy loading
- Code splitting: Load fragments on demand
