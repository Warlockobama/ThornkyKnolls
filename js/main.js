(() => {
  document.documentElement.classList.remove("no-js");
  const cards = Array.from(document.querySelectorAll(".card-panel"));
  const deck = document.getElementById("deck");
  const tabs = Array.from(document.querySelectorAll(".tab-button"));
  const navLinks = Array.from(document.querySelectorAll(".nav__link"));
  const mark = document.querySelector(".mark");
  const storyContainer = document.getElementById("story-entries");
  const detail = document.getElementById("story-detail");

  let storiesLoaded = false;
  let fragmentData = [];
  let resizeObserver = null;
  let observedCard = null;
  let notesFilter = "all"; // "all" or an animal slug
  const notesFiltersEl = document.getElementById("notes-filters");
  const PLACEHOLDER_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  // Lazy-load thumbnails via IntersectionObserver
  const thumbObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        obs.unobserve(img);
      }
    });
  }, { rootMargin: "100px" });

  // Eagerly load first `eagerCount` thumbs, observe the rest
  const observeThumbs = (container, eagerCount = 3) => {
    if (!container) return;
    const thumbs = container.querySelectorAll("img[data-src]");
    thumbs.forEach((img, i) => {
      if (i < eagerCount) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      } else {
        thumbObserver.observe(img);
      }
    });
  };

  // Prefetch next `count` images after currentIndex
  const prefetchImages = (thumbElements, currentIndex, count = 2) => {
    for (let i = 1; i <= count; i++) {
      const next = thumbElements[currentIndex + i];
      if (next) {
        const src = next.dataset.src || next.src;
        if (src && src !== PLACEHOLDER_GIF) {
          const preload = new Image();
          preload.src = src;
        }
      }
    }
  };

  // Build gallery thumbs + nav arrows from images array (deferred)
  const buildGalleryThumbs = (container, images, baseStoriesUrl, heroImg, captionEl) => {
    if (!container || !images || images.length <= 1) return;
    const mainEl = container.querySelector(".journal-gallery__main");
    const thumbs = document.createElement("div");
    thumbs.className = "journal-gallery__thumbs";
    const displayTitle = heroImg ? (heroImg.alt || "") : "";
    const thumbElements = [];
    let currentIdx = 0;

    const goTo = (idx) => {
      const thumb = thumbElements[idx];
      if (!thumb) return;
      if (thumb.dataset.src) {
        thumb.src = thumb.dataset.src;
        delete thumb.dataset.src;
      }
      if (heroImg) heroImg.src = thumb.src;
      if (captionEl) {
        const also = JSON.parse(thumb.dataset.also || "[]");
        captionEl.textContent = also.length ? "Also featuring: " + also.map(getAnimalName).join(", ") : "";
      }
      thumbs.querySelectorAll("img").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      currentIdx = idx;
      prefetchImages(thumbElements, idx);
    };

    images.forEach((imgData, idx) => {
      const thumb = document.createElement("img");
      const src = new URL(imgData.path, baseStoriesUrl).toString();
      thumb.dataset.src = src;
      thumb.src = PLACEHOLDER_GIF;
      thumb.alt = idx === 0 ? `${displayTitle} photo` : `${displayTitle} photo ${idx + 1}`;
      thumb.dataset.also = JSON.stringify(imgData.also || []);
      thumbElements.push(thumb);
      thumb.addEventListener("click", () => goTo(idx));
      thumbs.appendChild(thumb);
    });

    // Add prev/next nav arrows over the main image
    if (mainEl && images.length > 1) {
      mainEl.style.position = "relative";
      const prev = document.createElement("button");
      prev.className = "gallery-nav gallery-nav--prev";
      prev.type = "button";
      prev.setAttribute("aria-label", "Previous photo");
      prev.innerHTML = "&#8249;";
      const next = document.createElement("button");
      next.className = "gallery-nav gallery-nav--next";
      next.type = "button";
      next.setAttribute("aria-label", "Next photo");
      next.innerHTML = "&#8250;";
      prev.addEventListener("click", (e) => { e.stopPropagation(); goTo((currentIdx - 1 + images.length) % images.length); });
      next.addEventListener("click", (e) => { e.stopPropagation(); goTo((currentIdx + 1) % images.length); });
      mainEl.appendChild(prev);
      mainEl.appendChild(next);
    }

    container.appendChild(thumbs);
    observeThumbs(thumbs);
    return thumbElements;
  };

  const updateDetail = (html, slug) => {
    if (!detail) return;
    detail.innerHTML = html;
    detail.scrollTop = 0;

    // Build gallery thumbs on demand from fragmentData
    const entry = slug && fragmentData.find(e => e.slug === slug);
    if (entry && entry.images && entry.images.length > 1 && entry.baseStoriesUrl) {
      const gallery = detail.querySelector('.journal-gallery');
      if (gallery) {
        // Remove any existing thumbs (we'll rebuild lazily)
        const existingThumbs = gallery.querySelector('.journal-gallery__thumbs');
        if (existingThumbs) existingThumbs.remove();
        const mainImg = gallery.querySelector('.journal-gallery__main img');
        const caption = gallery.querySelector('.journal-gallery__caption');
        buildGalleryThumbs(gallery, entry.images, entry.baseStoriesUrl, mainImg, caption);
      }
    }
  };

  const openDetail = (detailEl, html, slug) => {
    if (!detailEl) return;
    document.querySelectorAll(".animal-detail.is-open").forEach(el => {
      if (el !== detailEl) {
        el.classList.remove("is-open");
        el.setAttribute("aria-hidden", "true");
      }
    });
    const content = detailEl.querySelector(".detail-content");
    if (content && html) {
      content.innerHTML = html;

      // Build gallery thumbs on demand from fragmentData
      const entry = slug && fragmentData.find(e => e.slug === slug);
      if (entry && entry.images && entry.images.length > 1 && entry.baseStoriesUrl) {
        const gallery = content.querySelector('.journal-gallery');
        if (gallery) {
          const existingThumbs = gallery.querySelector('.journal-gallery__thumbs');
          if (existingThumbs) existingThumbs.remove();
          const mainImg = gallery.querySelector('.journal-gallery__main img');
          const caption = gallery.querySelector('.journal-gallery__caption');
          buildGalleryThumbs(gallery, entry.images, entry.baseStoriesUrl, mainImg, caption);
        }
      }
    }
    detailEl.classList.add("is-open");
    detailEl.setAttribute("aria-hidden", "false");
    detailEl.scrollTop = 0;
  };
  const closeDetail = (detailEl) => {
    if (!detailEl) return;
    detailEl.classList.remove("is-open");
    detailEl.setAttribute("aria-hidden", "true");
  };
  let herdFilter = "all"; // "all" | "sale"

  const filterHerdRegister = (filter) => {
    herdFilter = filter;
    const rows = document.querySelectorAll("#herd-register .register__row--clickable");
    rows.forEach(row => {
      if (filter === "all") {
        row.style.display = "";
      } else {
        const status = (row.dataset.status || "").toLowerCase();
        const match = status.includes("sale") || status.includes("trade");
        row.style.display = match ? "" : "none";
      }
    });
    const visible = [...rows].filter(r => r.style.display !== "none");
    let emptyRow = document.querySelector("#herd-register .register__row--empty");
    if (!visible.length && !emptyRow) {
      const tbody = document.getElementById("herd-register");
      const tr = document.createElement("tr");
      tr.className = "register__row register__row--empty register__row--no-results";
      tr.innerHTML = `<td colspan="6">No cattle matching this filter.</td>`;
      tbody.appendChild(tr);
    } else if (visible.length && emptyRow?.classList.contains("register__row--no-results")) {
      emptyRow.remove();
    }
    document.querySelectorAll("#herd-filters .chip--filter").forEach(btn => {
      btn.classList.toggle("chip--active", btn.dataset.filterStatus === filter);
    });
  };

  document.getElementById("herd-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter-status]");
    if (btn) filterHerdRegister(btn.dataset.filterStatus);
  });

  const carouselState = {
    herd: { index: 0, size: 3, type: "cattle", label: "Highland", detailId: "herd-detail" },
  };
  const normalizeTypes = (type) => {
    if (!type) return [];
    return Array.isArray(type) ? type : [type];
  };

  // Normalize image entries to { path, also } format
  const normalizeImage = (img) => {
    if (typeof img === "string") {
      return { path: img, also: [] };
    }
    return { path: img.path, also: img.also || [] };
  };

  // Get animal name from slug for display
  const getAnimalName = (slug) => {
    const names = {
      adele: "Adele",
      annabel: "Annabel",
      "bull-calf": "Ness",
      lebella: "Lebella",
      pumpkin: "Pumpkin"
    };
    return names[slug] || slug;
  };
  const baseOrder = cards.map(card => card.dataset.card);
  const sheetTints = [
    "rgba(120, 164, 214, 0.14)",
    "rgba(255, 164, 140, 0.14)",
    "rgba(194, 214, 146, 0.14)",
    "rgba(168, 196, 176, 0.14)",
  ];
  const validTab = (id) => (id && baseOrder.includes(id)) ? id : baseOrder[0];
  const initialHash = window.location.hash.replace("#", "");
  let active = validTab(initialHash);
  const observeActiveCard = (activeCard) => {
    if (!deck || !window.ResizeObserver) return;
    if (!activeCard || window.innerWidth <= 900) {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      observedCard = null;
      return;
    }
    if (activeCard === observedCard) return;
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    resizeObserver = new ResizeObserver(() => {
      if (window.innerWidth > 900) {
        deck.style.height = activeCard.offsetHeight + "px";
      }
    });
    resizeObserver.observe(activeCard);
    observedCard = activeCard;
  };

  const render = () => {
    const ordered = [active, ...baseOrder.filter(id => id !== active)];
    ordered.forEach((id, idx) => {
      const card = cards.find(c => c.dataset.card === id);
      if (!card) return;
      const isActive = idx === 0;
      const offsetLeft = isActive ? 0 : 16 + (idx - 1) * 11;
      const width = isActive ? 100 : Math.max(78 - (idx - 1) * 6, 48);
      const translateX = isActive ? 0 : 8 + (idx - 1) * 4;
      const tilt = isActive ? 0 : (idx % 2 === 0 ? -1.35 : 1.35);
      const scale = isActive ? 1 : Math.max(0.92, 0.97 - (idx - 1) * 0.012);
      card.classList.toggle("is-active", isActive);
      card.style.setProperty("--card-left", offsetLeft + "%");
      card.style.setProperty("--card-width", width + "%");
      card.style.setProperty("--stack-index", idx);
      card.style.setProperty("--stack-shift", translateX + "px");
      card.style.setProperty("--stack-tilt", tilt + "deg");
      card.style.setProperty("--stack-scale", scale);
      card.style.setProperty("--sheet-tint", isActive ? "transparent" : sheetTints[idx % sheetTints.length]);
      card.setAttribute("tabindex", isActive ? "0" : "-1");
      card.setAttribute("aria-hidden", String(!isActive));
    });

    tabs.forEach(btn => {
      const isCurrent = btn.dataset.tab === active;
      btn.classList.toggle("is-active", isCurrent);
      btn.setAttribute("aria-selected", String(isCurrent));
      btn.setAttribute("tabindex", isCurrent ? "0" : "-1");
    });

    navLinks.forEach(btn => {
      const isCurrent = btn.dataset.tab === active;
      btn.classList.toggle("is-active", isCurrent);
      btn.setAttribute("aria-pressed", String(isCurrent));
    });

    updateMark(active);

    const activeCard = cards.find(c => c.dataset.card === active);
    if (activeCard) {
      if (window.innerWidth <= 900) {
        deck.style.height = "auto";
      } else {
        deck.style.height = activeCard.offsetHeight + "px";
      }
    }
    observeActiveCard(activeCard);
  };

  const setActive = (id, options = {}) => {
    const next = validTab(id);
    if (!next || next === active) return;
    active = next;
    document.querySelectorAll(".animal-detail.is-open").forEach(detailEl => {
      closeDetail(detailEl);
    });
    render();
    if (options.updateHash !== false) {
      history.replaceState(null, "", "#" + next);
    }
    if (options.focusPanel) {
      const activeCard = cards.find(c => c.dataset.card === active);
      requestAnimationFrame(() => activeCard?.focus({ preventScroll: true }));
    }
  };

  tabs.forEach(btn => {
    btn.addEventListener("click", () => setActive(btn.dataset.tab, { focusPanel: true }));
  });
  navLinks.forEach(btn => {
    btn.addEventListener("click", () => setActive(btn.dataset.tab, { focusPanel: true }));
  });

  // Handle any button/element with data-tab (for CTA buttons, etc.)
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-tab]");
    if (!target) return;
    // Skip if already handled by tabs or navLinks
    if (target.classList.contains("tab-button") || target.classList.contains("nav__link")) return;
    e.preventDefault();
    const tabId = target.dataset.tab;
    setActive(tabId, { focusPanel: true });
    if (["notes", "herd"].includes(tabId)) {
      loadStories();
    }
    if (target.dataset.filter === "sale") {
      filterHerdRegister("sale");
    }
  });

  const markSections = {
    home: {
      pills: ["Highland cattle", "Silvopasture", "Highland genetics"],
      tagline: "Est. field stories / North pasture circuit",
      accent: "rgba(132, 193, 128, 0.55)",
    },
    herd: {
      pills: ["Docile & horned", "Cold-hardy", "Handled daily"],
      tagline: "Viewing — Highland Herd register",
      accent: "rgba(194, 157, 112, 0.6)",
    },
    story: {
      pills: ["Origin story", "Built by hand", "Stewardship"],
      tagline: "Viewing — Story & understory",
      accent: "rgba(168, 196, 146, 0.6)",
    },
    notes: {
      pills: ["Pasture log", "Herd snapshots", "Light reading"],
      tagline: "Viewing — Field notes from the journal",
      accent: "rgba(214, 178, 120, 0.6)",
    },
  };

  let currentMarkSection = null;
  const updateMark = (sectionId) => {
    if (!mark || sectionId === currentMarkSection) return;
    currentMarkSection = sectionId;
    const section = markSections[sectionId] || markSections.home;
    mark.setAttribute("data-section", sectionId);
    mark.style.setProperty("--mark-accent", section.accent);

    const linesEl = mark.querySelector(".mark__lines");
    const taglineEl = mark.querySelector(".mark__tagline");

    if (linesEl) {
      linesEl.style.opacity = "0";
      setTimeout(() => {
        linesEl.innerHTML = section.pills
          .map((text, i) => `<span style="animation-delay:${i * 60}ms">${text}</span>`)
          .join("");
        linesEl.style.opacity = "1";
      }, 160);
    }

    if (taglineEl) {
      taglineEl.style.opacity = "0";
      setTimeout(() => {
        taglineEl.textContent = section.tagline;
        taglineEl.style.opacity = "1";
      }, 200);
    }
  };

  if (mark) {
    mark.setAttribute("role", "button");
    mark.setAttribute("tabindex", "0");
    mark.addEventListener("click", () => setActive("home", { focusPanel: true }));
    mark.addEventListener("keyup", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActive("home", { focusPanel: true });
      }
    });
  }

  const loadStories = async () => {
    if (storiesLoaded || !storyContainer) return;
    const baseStoriesUrl = new URL("stories/", window.location.href);

    // Fetch image base URL from server config (S3 or local fallback)
    let imageBaseUrl = baseStoriesUrl.toString();
    try {
      const configRes = await fetch("/api/config");
      if (configRes.ok) {
        const config = await configRes.json();
        imageBaseUrl = config.imageBaseUrl || imageBaseUrl;
      }
    } catch (_) {
      // Fall back to local stories/ path
    }

    let manifest = [];
    try {
      const res = await fetch(new URL("manifest.json", baseStoriesUrl));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      manifest = await res.json();
    } catch (err) {
      manifest = [{ slug: "annabel" }, { slug: "pumpkin" }];
    }

    // Normalize manifest to objects with slug + optional images
    const normalized = manifest.map((entry) => {
      if (typeof entry === "string") {
        return { slug: entry, images: [], types: [] };
      }
      // Normalize images to { path, also } format
      const images = (entry.images || []).map(normalizeImage);
      return { slug: entry.slug, images, types: normalizeTypes(entry.type), animals: entry.animals || [] };
    }).filter(e => e.slug);

    const fragments = await Promise.all(
      normalized.map(async (entry) => {
        const { slug } = entry;
        try {
          const res = await fetch(new URL(`${slug}.html`, baseStoriesUrl));
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          return { slug, html, images: entry.images, types: entry.types, animals: entry.animals };
        } catch (err) {
          return { slug, error: String(err) };
        }
      })
    );

    storyContainer.innerHTML = "";
    fragments.forEach(({ slug, html, images, types, animals, error }) => {
      const wrapper = document.createElement("article");
      wrapper.className = "journal-entry-shell";
      wrapper.setAttribute("data-slug", slug);
      if (types && types.length) {
        const typeIcons = { cattle: "🐄 Cattle", note: "📝 Field Note", story: "📖 Story" };
        wrapper.setAttribute("data-type", types[0]);
        wrapper.setAttribute("data-type-icon", typeIcons[types[0]] || types[0]);
      }
      if (error) {
        wrapper.innerHTML = `<div class="story-error">Could not load ${slug}.html (${error}).</div>`;
      } else {
        wrapper.innerHTML = html;
        const title = wrapper.querySelector(".journal-title");
        const subtitle = wrapper.querySelector(".journal-subtitle");
        const headline = title ? title.textContent.trim() : slug;
        const subhead = subtitle ? subtitle.textContent.trim() : "";
        const displayTitle = subhead || headline;
        const displaySubtitle = subhead ? headline : "";
        wrapper.setAttribute("aria-label", `Journal entry: ${displayTitle}`);

        // Inject hero-only gallery (thumbs built on demand when detail opens)
        if (images && images.length) {
          let photo = wrapper.querySelector(".journal-photo");
          if (!photo) {
            photo = document.createElement("div");
            photo.className = "journal-photo";
            wrapper.prepend(photo);
          } else {
            photo.innerHTML = "";
          }
          photo.classList.add("journal-gallery");

          const main = document.createElement("div");
          main.className = "journal-gallery__main";
          const hero = document.createElement("img");
          hero.src = new URL(images[0].path, imageBaseUrl).toString();
          hero.alt = displayTitle;
          hero.loading = "lazy";
          main.appendChild(hero);

          // Add "Also featuring" caption
          const caption = document.createElement("div");
          caption.className = "journal-gallery__caption";
          if (images[0].also && images[0].also.length) {
            caption.textContent = "Also featuring: " + images[0].also.map(getAnimalName).join(", ");
          }
          main.appendChild(caption);

          photo.appendChild(main);
          // Thumbs are NOT built here — deferred to updateDetail/openDetail
        }

        // Collect summary data for previews/other sections
        const summaryP = wrapper.querySelector(".journal-content p");
        const imageSrc = images && images.length ? new URL(images[0].path, imageBaseUrl).toString() : null;
        fragmentData.push({
          slug,
          title: displayTitle,
          subtitle: displaySubtitle,
          summary: summaryP ? summaryP.textContent.trim() : "",
          image: imageSrc,
          images: images || [],
          baseStoriesUrl: imageBaseUrl,
          types: types || [],
          animals: animals || [],
          html: wrapper.innerHTML
        });
      }
      if (animals && animals.length) {
        wrapper.setAttribute("data-animals", JSON.stringify(animals));
      }
      storyContainer.appendChild(wrapper);
      wrapper.addEventListener("click", () => {
        storyContainer.querySelectorAll(".is-highlighted").forEach(el => el.classList.remove("is-highlighted"));
        wrapper.classList.add("is-highlighted");
        updateDetail(wrapper.innerHTML, slug);
      });
    });

    storiesLoaded = true;
    populateHerdFromFragments();
    buildNotesFilters();
    applyNotesFilter();
  };

  cards.forEach(card => {
    card.querySelectorAll("img").forEach(img => {
      img.addEventListener("load", render);
    });
    card.addEventListener("click", () => setActive(card.dataset.card));
  });

  window.addEventListener("hashchange", () => {
    const hashId = window.location.hash.replace("#", "");
    setActive(hashId, { updateHash: false, focusPanel: true });
    if (["notes", "herd"].includes(hashId)) {
      loadStories();
    }
  });

  window.addEventListener("resize", () => render());
  render();
  if (["notes", "herd"].includes(active)) {
    loadStories();
  }


  tabs.forEach(btn => {
    if (["notes", "herd"].includes(btn.dataset.tab)) {
      btn.addEventListener("click", () => loadStories());
    }
  });
  navLinks.forEach(btn => {
    if (["notes", "herd"].includes(btn.dataset.tab)) {
      btn.addEventListener("click", () => loadStories());
    }
  });

  const buildCards = (grid, entries, label, detailEl) => {
    if (!grid) return;
    grid.innerHTML = "";
    entries.forEach(entry => {
      const card = document.createElement("article");
      card.className = "card";
      if (entry.slug) {
        card.dataset.slug = entry.slug;
      }
      const figure = document.createElement("figure");
      figure.className = "card__media";
      if (entry.image) {
        const img = document.createElement("img");
        img.src = entry.image;
        img.alt = entry.title;
        img.loading = "lazy";
        figure.appendChild(img);
      } else {
        figure.innerHTML = `<div class="card__media--placeholder"></div>`;
      }
      const body = document.createElement("div");
      body.className = "card__body";
      const summary = entry.subtitle || entry.summary || "Field notes from the pasture log.";
      body.innerHTML = `
        <div class="label">${label}</div>
        <h3>${entry.title}</h3>
        <p class="muted">${summary}</p>
      `;
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `<span class="pill">Field log</span><span class="pill">Story</span>`;
      body.appendChild(meta);
      card.appendChild(figure);
      card.appendChild(body);
      card.addEventListener("click", () => {
        if (detailEl && entry.html) {
          openDetail(detailEl, entry.html, entry.slug);
          const content = detailEl.querySelector(".detail-content");
          if (content) injectNotesLink(content, entry.slug);
        } else if (detail && entry.html) {
          updateDetail(entry.html, entry.slug);
          setActive("notes", { focusPanel: true });
        }
      });
      grid.appendChild(card);
    });
  };

  const getEntriesByType = (type) => fragmentData.filter(entry => entry.types?.includes(type));
  const summarizeListItems = (items) => {
    if (!items.length) return "";
    const selected = items.slice(0, 2);
    return selected.join(" · ");
  };
  const extractRegisterInfo = (entry) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.html || "", "text/html");
    const facts = Array.from(doc.querySelectorAll(".journal-facts li")).map(li => li.textContent.trim()).filter(Boolean);
    const date = doc.querySelector(".journal-date")?.textContent.trim() || "";
    const statusFromDate = date.includes("·") ? date.split("·").pop().trim() : "";
    const status = doc.querySelector(".journal-entry")?.dataset.status || statusFromDate || "In herd";

    // Get the real animal name from the HTML (entry.title/subtitle are swapped)
    const name = doc.querySelector(".journal-title")?.textContent.trim() || entry.subtitle || entry.title;
    const subtitleText = doc.querySelector(".journal-subtitle")?.textContent.trim() || "";

    let color = "";
    let born = "";
    let sire = "";
    let dam = "";
    let lineageSummary = "";

    facts.forEach(line => {
      if (line.startsWith("Born:")) {
        const parts = line.replace("Born:", "").split("·").map(s => s.trim());
        born = parts[0] || "";
        if (!color) color = parts[1] || "";
      } else if (line.startsWith("Color:")) {
        const parts = line.replace("Color:", "").split("·").map(s => s.trim());
        color = parts[0] || "";
      } else if (line.startsWith("Sire:")) {
        sire = line.replace("Sire:", "").trim();
      } else if (line.startsWith("Dam:")) {
        dam = line.replace("Dam:", "").trim();
      }
    });

    // For calves without a Born: line, pull lineage from subtitle
    if (!born) {
      if (subtitleText.includes("×")) {
        lineageSummary = subtitleText.split("·").map(s => s.trim()).filter(s => s.includes("×"))[0] || subtitleText;
      } else {
        lineageSummary = subtitleText;
      }
    }

    return { name, color, born, sire, dam, lineageSummary, status };
  };

  const renderCarousel = (sectionId) => {
    const state = carouselState[sectionId];
    if (!state) return;
    const entries = getEntriesByType(state.type);
    const total = entries.length;
    const grid = document.querySelector(`#panel-${sectionId} .card-grid`);
    const detailEl = document.getElementById(state.detailId);
    if (!grid) return;
    if (!total) {
      grid.innerHTML = `<div class="story-error">No ${sectionId} entries in the manifest yet.</div>`;
      return;
    }
    const size = Math.min(state.size, total);
    const slice = [];
    for (let i = 0; i < size; i++) {
      slice.push(entries[(state.index + i) % total]);
    }
    buildCards(grid, slice, state.label, detailEl);

    const controls = document.querySelector(`.section-controls[data-section='${sectionId}']`);
    if (controls) {
      const prevBtn = controls.querySelector("[data-dir='prev']");
      const nextBtn = controls.querySelector("[data-dir='next']");
      const disabled = total <= size;
      if (prevBtn) prevBtn.disabled = disabled;
      if (nextBtn) nextBtn.disabled = disabled;
    }
  };

  const populateHerdFromFragments = () => {
    if (!fragmentData.length) return;
    renderCarousel("herd");
    const register = document.getElementById("herd-register");
    const detailEl = document.getElementById("herd-detail");
    const entries = getEntriesByType("cattle");
    if (register) {
      register.innerHTML = "";
      if (!entries.length) {
        register.innerHTML = `<tr class="register__row register__row--empty"><td colspan="6">No herd entries in the manifest yet.</td></tr>`;
      } else {
        entries.forEach(entry => {
          const info = extractRegisterInfo(entry);
          const row = document.createElement("tr");
          row.className = "register__row register__row--clickable";
          row.dataset.status = info.status;

          // Thumbnail cell
          const thumbCell = document.createElement("td");
          if (entry.image) {
            const img = document.createElement("img");
            img.src = entry.image;
            img.alt = info.name;
            img.className = "register__thumb";
            img.loading = "lazy";
            thumbCell.appendChild(img);
          } else {
            thumbCell.innerHTML = `<div class="register__thumb-placeholder"></div>`;
          }
          row.appendChild(thumbCell);

          // Animal name cell
          const nameCell = document.createElement("td");
          nameCell.setAttribute("data-label", "Animal:");
          nameCell.textContent = info.name;
          row.appendChild(nameCell);

          // Color cell
          const colorCell = document.createElement("td");
          colorCell.setAttribute("data-label", "Color:");
          colorCell.textContent = info.color;
          row.appendChild(colorCell);

          // Born / Lineage cell
          const bornCell = document.createElement("td");
          bornCell.setAttribute("data-label", "Born:");
          bornCell.textContent = info.born || info.lineageSummary || "";
          row.appendChild(bornCell);

          // Status cell
          const statusCell = document.createElement("td");
          statusCell.setAttribute("data-label", "Status:");
          statusCell.textContent = info.status;
          row.appendChild(statusCell);

          // Photo count cell
          const photoCell = document.createElement("td");
          photoCell.className = "register__photos";
          if (entry.images && entry.images.length) {
            photoCell.textContent = `${entry.images.length} 📷`;
          }
          row.appendChild(photoCell);

          // Click to open detail
          row.addEventListener("click", () => {
            if (detailEl && entry.html) {
              openDetail(detailEl, entry.html, entry.slug);
              const content = detailEl.querySelector(".detail-content");
              if (content) injectNotesLink(content, entry.slug);
            }
          });

          register.appendChild(row);
        });
      }
    }
  };


  // --- Field Notes filtering ---

  const buildNotesFilters = () => {
    if (!notesFiltersEl) return;
    const notes = fragmentData.filter(e => e.types.includes("note"));
    const animalSet = new Set();
    notes.forEach(n => (n.animals || []).forEach(a => animalSet.add(a)));
    if (!animalSet.size) { notesFiltersEl.innerHTML = ""; return; }

    notesFiltersEl.innerHTML = "";
    const allChip = document.createElement("button");
    allChip.className = "chip chip--filter" + (notesFilter === "all" ? " chip--active" : "");
    allChip.type = "button";
    allChip.textContent = "All";
    allChip.addEventListener("click", () => setNotesFilter("all"));
    notesFiltersEl.appendChild(allChip);

    [...animalSet].sort().forEach(slug => {
      const chip = document.createElement("button");
      chip.className = "chip chip--filter" + (notesFilter === slug ? " chip--active" : "");
      chip.type = "button";
      chip.textContent = getAnimalName(slug);
      chip.addEventListener("click", () => setNotesFilter(slug));
      notesFiltersEl.appendChild(chip);
    });
  };

  const applyNotesFilter = () => {
    if (!storyContainer) return;
    const shells = storyContainer.querySelectorAll(".journal-entry-shell");
    shells.forEach(shell => {
      const type = shell.getAttribute("data-type");
      // Hide cattle profiles — only show notes
      if (type !== "note") {
        shell.style.display = "none";
        return;
      }
      if (notesFilter === "all") {
        shell.style.display = "";
      } else {
        const animals = JSON.parse(shell.getAttribute("data-animals") || "[]");
        shell.style.display = animals.includes(notesFilter) ? "" : "none";
      }
    });
    // Update filter chip active states
    if (notesFiltersEl) {
      notesFiltersEl.querySelectorAll(".chip--filter").forEach(chip => {
        const isAll = chip.textContent === "All";
        const isActive = isAll ? notesFilter === "all" : chip.textContent === getAnimalName(notesFilter);
        chip.classList.toggle("chip--active", isActive);
      });
    }
    // Clear detail if nothing is selected
    if (detail) {
      const visible = [...storyContainer.querySelectorAll(".journal-entry-shell")].filter(s => s.style.display !== "none");
      if (!visible.length && detail) {
        detail.innerHTML = '<div class="story-skeleton">No field notes for this filter yet.</div>';
      }
    }
  };

  const setNotesFilter = (slug) => {
    notesFilter = slug;
    if (!storiesLoaded) {
      loadStories().then(() => {
        applyNotesFilter();
        buildNotesFilters();
      });
    } else {
      applyNotesFilter();
      buildNotesFilters();
    }
  };

  // Inject "Field notes featuring X" link into herd detail panels
  const injectNotesLink = (detailContent, animalSlug) => {
    if (!detailContent || !animalSlug) return;
    const notes = fragmentData.filter(e => e.types.includes("note") && (e.animals || []).includes(animalSlug));
    if (!notes.length) return;
    const existing = detailContent.querySelector(".detail-notes-link");
    if (existing) existing.remove();
    const link = document.createElement("div");
    link.className = "detail-notes-link";
    link.innerHTML = `<button class="text-link" type="button">📝 ${notes.length} field note${notes.length > 1 ? "s" : ""} featuring ${getAnimalName(animalSlug)} →</button>`;
    link.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      setNotesFilter(animalSlug);
      setActive("notes", { focusPanel: true });
      loadStories();
    });
    detailContent.appendChild(link);
  };

  const attachDetailControls = () => {
    document.querySelectorAll(".animal-detail .detail-close").forEach(btn => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        closeDetail(btn.closest(".animal-detail"));
      });
    });
  };

  const attachCarouselControls = () => {
    document.querySelectorAll(".section-controls").forEach(control => {
      const sectionId = control.dataset.section;
      control.querySelectorAll(".arrow-button").forEach(button => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          if (!storiesLoaded) {
            loadStories();
            return;
          }
          const state = carouselState[sectionId];
          if (!state) return;
          const entries = getEntriesByType(state.type);
          const total = entries.length;
          if (!total) return;
          const step = Math.min(state.size, total);
          state.index = (state.index + (button.dataset.dir === "next" ? step : -step) + total) % total;
          renderCarousel(sectionId);
        });
      });
    });
  };

  attachDetailControls();
  attachCarouselControls();

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const lb = document.getElementById("lightbox");
    if (lb && lb.classList.contains("is-open")) {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      return;
    }
    document.querySelectorAll(".animal-detail.is-open").forEach(detailEl => {
      closeDetail(detailEl);
    });
  });

  // ── Lightbox for story portraits ──
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    const lbImg = lightbox.querySelector(".lightbox__img");
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-lightbox]");
      if (trigger) {
        e.preventDefault();
        lbImg.src = trigger.dataset.lightbox;
        lbImg.alt = trigger.alt || "";
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
      }
    });
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.classList.contains("lightbox__close")) {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
      }
    });
  }
})();
