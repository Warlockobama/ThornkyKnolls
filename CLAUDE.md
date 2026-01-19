# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thorny Knolls is a hybrid animal profile + blog post website featuring farm animals. The homepage (`test.html`) displays interactive notebook-style cards. Clicking a card loads either an animal's profile page or a blog post via HTMX, which then expands in an overlay.

## Architecture & Technology Stack

- **Frontend**: HTML, CSS, JavaScript (no build system)
- **Styling**: TailwindCSS (via CDN)
- **Interactivity**: HTMX (via CDN) for AJAX content loading
- **Data**: JSON file (`data/posts.json`) for blog post metadata and animal tags
- **Fonts**: Google Fonts (Patrick Hand, Abril Fatface, Georgia)
- **Design Pattern**: Hybrid static + dynamic content with HTMX overlays

## Key Features & Components

### Visual Design
- Notebook/journal aesthetic with spiral binding and paper texture effects
- Responsive design with mobile-first approach
- Custom CSS animations for animal emojis and card interactions
- Gradient backgrounds and thistle decorative elements

### Interactive Elements
- Animal cards with expandable story views
- Card expansion animation system with overlay effects
- HTMX integration for dynamic content loading (`hx-get` attributes)
- Touch-friendly mobile interactions with swipe scrolling

### Animal Profiles
The application features 10 animals, each with their own profile page:
- **Pumpkin** (🐄) - Highland cow, gentle and curious
- **Lebella** (🐄) - Highland cow matriarch, protective
- **Anabella** (🐄) - Young Highland calf, playful
- **Dobby** (🫏) - Mini donkey, vocal and affectionate
- **Argus** (🫏) - Standard donkey, quiet observer
- **Willow** (🐴) - Mule, intelligent and stubborn
- **Sega** (🫏) - Mammoth donkey, gentle giant
- **Hugo** (🐴) - Draft horse, playful helper
- **Smoke** (🐄) - Highland cow, calm and photogenic
- **Raider** (🐄) - Highland bull, adventurous

### Blog Posts
Farm stories featuring multiple animals:
- **Morning Chores** - Daily routine with Pumpkin, Lebella, Dobby
- **Feeding Frenzy** - Dinner time chaos with Argus, Willow, Sega
- **Sunset Shenanigans** - Evening fun with Anabella, Hugo, Smoke

## File Structure

```
/
├── test.html                       # Homepage with animal/post cards
├── CLAUDE.md                       # This guidance file
│
├── animals/                        # Animal profile pages
│   ├── pumpkin/index.html
│   ├── lebella/index.html
│   ├── anabella/index.html
│   ├── dobby/index.html
│   ├── argus/index.html
│   ├── willow/index.html
│   ├── sega/index.html
│   ├── hugo/index.html
│   ├── smoke/index.html
│   └── raider/index.html
│
├── posts/                          # Blog post pages
│   ├── morning-chores/index.html
│   ├── feeding-frenzy/index.html
│   └── sunset-trouble/index.html
│
├── data/
│   └── posts.json                  # Post metadata with animal tags
│
└── js/
    └── post-loader.js              # Fetches/filters posts by animal
```

## Development Notes

### CSS Architecture
- Extensive use of CSS custom properties and animations
- Mobile-responsive breakpoints using Tailwind classes
- Custom animation keyframes for animal behaviors
- Card expansion system with 3D transforms and transitions

### JavaScript Functionality
- Card expansion/collapse system with state management
- HTMX integration for story content loading
- Mobile touch interaction handlers
- Keyboard shortcuts (ESC to close expanded cards)
- Parallax effects for decorative elements (desktop only)

### Content Structure

**Homepage Cards** (in test.html):
- Spiral binding visual element
- Doodle notes with rotation effects
- Animal emoji with custom animations
- Preview text
- HTMX button that loads animal profile or blog post

**Animal Profile Pages** (animals/*/index.html):
- Animal portrait (large emoji)
- Name and species
- Biographical content (2-3 paragraphs)
- Quick facts section (species, arrival date, personality, favorite food)
- Dynamic list of blog posts featuring this animal (loaded via JavaScript)

**Blog Post Pages** (posts/*/index.html):
- Journal-style formatting
- Date and title
- Featured animals subtitle
- Story content (4-6 paragraphs)
- Featured animals section with links back to profiles
- Farmer signature

## Common Tasks

**Local Development**:
- Open `test.html` in a web browser
- Requires local web server for HTMX to load external HTML files (security restrictions prevent file:// protocol from loading other files)
- Use Python: `python -m http.server 8000` then open `http://localhost:8000/test.html`

**Adding a New Animal**:
1. Create `animals/{name}/index.html` using existing animals as template
2. Add animal card to `test.html` in Chapter One section
3. Update `data/posts.json` if animal appears in any posts

**Adding a New Blog Post**:
1. Create `posts/{title}/index.html` using existing posts as template
2. Add post entry to `data/posts.json` with animal tags
3. Add post card to `test.html` in Chapter Two section

**Updating Styles**:
- Homepage styling: Edit `<style>` section in `test.html`
- Animal/post pages: Pages inherit Tailwind classes and use existing CSS classes from test.html

**Updating Data**:
- Post metadata: Edit `data/posts.json`
- Post content: Edit individual HTML files in `posts/*/index.html`
- Animal bios: Edit individual HTML files in `animals/*/index.html`

## Data Flow

1. **User clicks animal card** → HTMX loads `animals/{name}/index.html` into card overlay
2. **Animal page loads** → JavaScript fetches `data/posts.json` → Filters posts by animal ID → Renders list
3. **User clicks post from animal page** → Navigates to full blog post
4. **User clicks blog post card** → HTMX loads `posts/{name}/index.html` into card overlay

## HTMX Integration

- **Animal cards**: `hx-get="animals/{name}/index.html"` - Loads animal profile
- **Post cards**: `hx-get="posts/{name}/index.html"` - Loads blog post
- **Target**: All content loads into `#animalDetailPanel`
- **Swap**: Uses `hx-swap="innerHTML transition:true"` for smooth transitions
- **Animation**: `hx-on::after-request="expandCard(this)"` triggers card expansion
- **Close**: ESC key or clicking overlay closes expanded card

## JSON Data Structure

`data/posts.json` tracks all blog posts and their featured animals:

```json
{
  "posts": [
    {
      "id": "morning-chores",
      "title": "Morning Chores at Thorny Knolls",
      "date": "2025-01-15",
      "excerpt": "Brief description...",
      "animals": ["pumpkin", "lebella", "dobby"],
      "url": "posts/morning-chores/index.html"
    }
  ]
}
```

Animal profile pages use `js/post-loader.js` to fetch this file and display only posts featuring that animal.

## Browser Compatibility Notes

- Uses modern CSS features (CSS Grid, Flexbox, custom properties)
- Requires JavaScript enabled for full functionality
- Mobile-optimized with touch event handling
- Progressive enhancement approach for hover effects