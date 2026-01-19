# Thorny Knolls

A farm story collection website featuring Highland cows, donkeys, mules, and horses. This repository contains three different implementations, each exploring different approaches to the same content.

## 🌿 The Farm

Thorny Knolls is home to 10 wonderful animals:
- **Highland Cows:** Pumpkin, Lebella, Anabella, Smoke, Raider
- **Donkeys:** Dobby (mini), Argus (standard), Sega (mammoth)
- **Equines:** Willow (mule), Hugo (draft horse)

## 📚 Three Implementations

This repository contains three branches, each with a different implementation approach:

### 1. `stacked-site` - The Professional SPA
**Philosophy:** Novel interaction design with minimalist aesthetics

**Features:**
- Unique stacked card interface with 3D transforms
- Brutalist professional design
- Vanilla JavaScript, zero dependencies
- Built-in theme customization (Color Lab)
- Manifest-based data loading
- Single-page application architecture

**Best for:** Showcasing unique UI patterns, professional portfolios

**Tech Stack:** HTML, CSS (custom properties), Vanilla JS
**File Size:** ~2,242 lines total

---

### 2. `test-html` - The Whimsical Notebook
**Philosophy:** Delightful storytelling with playful interactions

**Features:**
- Notebook/journal aesthetic with spiral binding
- HTMX-powered card expansion overlays
- Individual animal profile pages
- Blog post system with animal tagging
- Charming animations and doodles
- TailwindCSS utility styling

**Best for:** Content-focused storytelling, blogs, personal sites

**Tech Stack:** HTML, TailwindCSS (CDN), HTMX (CDN)
**File Size:** ~2,206 lines (single HTML file)

---

### 3. `hybrid-site` - The Best of Both Worlds ⭐
**Philosophy:** Professional + scalable + whimsical

**Features:**
- Professional design with whimsical touches
- Vanilla JavaScript (no dependencies)
- Individual animal profiles with REAL PHOTOS
- Blog post architecture
- Theme customization controls
- Sliding detail panel UI
- Clean separation of concerns

**Best for:** Production sites needing scalability + charm

**Tech Stack:** HTML, CSS (custom properties), Vanilla JS
**File Size:** ~1,105 lines total (modular)

---

## 🚀 Getting Started

Each implementation requires a local web server:

```bash
# Navigate to the project
cd ThornkyKnolls

# Switch to desired branch
git checkout stacked-site    # or test-html, or hybrid-site

# Start local server
python -m http.server 8000

# Open in browser
# http://localhost:8000
```

### Specific Entry Points:
- **stacked-site:** `http://localhost:8000/stacked-site/index.html`
- **test-html:** `http://localhost:8000/test.html`
- **hybrid-site:** `http://localhost:8000/hybrid-site/index.html`

## 📊 Feature Comparison

| Feature | stacked-site | test-html | hybrid-site |
|---------|--------------|-----------|-------------|
| **Dependencies** | None | HTMX, Tailwind | None |
| **Animal Profiles** | ❌ | ✅ | ✅ |
| **Blog Posts** | ❌ | ✅ | ✅ |
| **Real Photos** | Partial | ❌ | ✅ |
| **Theme Controls** | ✅ | ❌ | ✅ |
| **Card UI** | Stacked 3D | Grid Expansion | Grid Panel |
| **File Structure** | Monolithic | Monolithic | Modular |
| **Scalability** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Uniqueness** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🎨 Design Philosophy

### stacked-site
Clean, professional interface inspired by modern portfolio sites. The stacked card metaphor provides a unique browsing experience that stands out from typical grid layouts.

### test-html
Warm, inviting notebook aesthetic that feels personal and handcrafted. Perfect for storytelling with charming animations and playful interactions.

### hybrid-site
Combines professional polish with whimsical charm. Modular architecture makes it easy to scale while maintaining personality through thoughtful design touches.

## 📸 Photos

Currently available optimized photos:
- **Pumpkin** (Highland cow) - Orange-brown coat
- **Lebella** (Highland cow) - Russet matriarch
- **Anabella** (Highland calf) - Young and playful

Additional photos available in `gallery/raw/` for processing.

## 🛠️ Project Structure

```
ThornkyKnolls/
├── stacked-site/          # Professional SPA implementation
│   ├── index.html
│   ├── styles.css
│   └── stories/           # Story fragments
├── test.html              # Whimsical notebook implementation (all-in-one)
├── animals/               # Animal profile pages for test.html
├── posts/                 # Blog posts for test.html
├── hybrid-site/           # Best-of-both implementation
│   ├── index.html
│   ├── css/styles.css
│   ├── js/app.js
│   ├── animals/           # Animal bio fragments
│   ├── posts/             # Blog post fragments
│   └── data/              # JSON metadata
├── gallery/
│   ├── optimized/         # WebP photos for web
│   ├── thumbs/            # Thumbnails
│   └── raw/               # Original photos
└── data/                  # Shared data files
```

## 📝 Documentation

Each implementation has its own detailed documentation:
- **stacked-site:** See `stacked-site/README.md`
- **test-html:** See `CLAUDE.md` for architecture details
- **hybrid-site:** See `hybrid-site/README.md` + `hybrid-site/ARCHITECTURE.md`

## 🌱 Adding Content

### Add a New Animal

Different steps for each version - see individual README files

### Add a New Blog Post

**test-html & hybrid-site:** Create post HTML file + update `data/posts.json`

## 🎯 Recommendations

**Choose stacked-site if:**
- You want a unique, memorable UI
- Professional portfolio or showcase
- You prefer zero dependencies

**Choose test-html if:**
- You want charm and whimsy
- Content is king
- You're comfortable with CDN dependencies

**Choose hybrid-site if:** ⭐ **RECOMMENDED**
- You need production-ready code
- Scalability matters
- You want photos + profiles + posts
- You prefer modular architecture

## 📄 License

Content and code © 2025 Thorny Knolls Farm

---

*Made with ❤️ at Thorny Knolls Farm*
