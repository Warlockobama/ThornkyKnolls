(() => {
  // DOM Elements
  const form = document.getElementById("entryForm");
  const typeSelect = document.getElementById("entryType");
  const slugInput = document.getElementById("entrySlug");
  const titleInput = document.getElementById("entryTitle");
  const subtitleInput = document.getElementById("entrySubtitle");
  const dateInput = document.getElementById("entryDate");
  const emojiInput = document.getElementById("entryEmoji");
  const captionInput = document.getElementById("entryCaption");
  const contentInput = document.getElementById("entryContent");
  const factsInput = document.getElementById("entryFacts");
  const signatureInput = document.getElementById("entrySignature");
  const doodle1Input = document.getElementById("entryDoodle1");
  const doodle2Input = document.getElementById("entryDoodle2");
  const imageInput = document.getElementById("imageInput");
  const imageUploadArea = document.getElementById("imageUploadArea");
  const imagePreviews = document.getElementById("imagePreviews");
  const imageUploadGroup = document.getElementById("imageUploadGroup");
  const previewContent = document.getElementById("previewContent");
  const manifestOutput = document.getElementById("manifestOutput");
  const htmlOutput = document.getElementById("htmlOutput");
  const generateBtn = document.getElementById("generateBtn");
  const downloadHtmlBtn = document.getElementById("downloadHtmlBtn");
  const downloadImagesBtn = document.getElementById("downloadImagesBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusMessage = document.getElementById("statusMessage");
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const entryListItems = document.getElementById("entryListItems");
  const editModeBanner = document.getElementById("editModeBanner");
  const editingSlugLabel = document.getElementById("editingSlugLabel");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const formHeading = document.getElementById("formHeading");
  const serverImagesSection = document.getElementById("serverImagesSection");
  const serverImagesEl = document.getElementById("serverImages");

  // State
  let uploadedImages = []; // Array of { file, dataUrl, processed }
  let editingSlug = null; // null = create mode, string = edit mode
  let serverImages = []; // Images already on server (during edit)
  const MAX_IMAGES = 3;
  const TARGET_WIDTH = 1600;

  // Type-specific defaults
  const animalTagGroup = document.getElementById("animalTagGroup");

  const typeDefaults = {
    cattle: {
      emoji: "",
      doodle1: "",
      doodle2: "",
      factsHeader: "Registry",
      datePrefix: "Early Spring",
      dateSuffix: "Field Log"
    },
    note: {
      emoji: "",
      doodle1: "",
      doodle2: "",
      factsHeader: "Checklist",
      datePrefix: "Morning Ledger",
      dateSuffix: ""
    }
  };

  // Utility functions
  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const showStatus = (message, type = "success") => {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove("hidden");
    setTimeout(() => statusMessage.classList.add("hidden"), 5000);
  };

  // --- Edit mode management ---

  const enterEditMode = (slug) => {
    editingSlug = slug;
    editModeBanner.classList.remove("hidden");
    editingSlugLabel.textContent = slug;
    deleteBtn.classList.remove("hidden");
    formHeading.textContent = "Edit Entry";
    saveBtn.textContent = "Update on Server";
    slugInput.readOnly = true;
    // Highlight active item in list
    entryListItems.querySelectorAll(".entry-list-item").forEach(item => {
      item.classList.toggle("is-active", item.dataset.slug === slug);
    });
  };

  const exitEditMode = () => {
    editingSlug = null;
    editModeBanner.classList.add("hidden");
    deleteBtn.classList.add("hidden");
    formHeading.textContent = "Add New Entry";
    saveBtn.textContent = "Save to Server";
    slugInput.readOnly = false;
    serverImages = [];
    serverImagesSection.classList.add("hidden");
    serverImagesEl.innerHTML = "";
    entryListItems.querySelectorAll(".entry-list-item").forEach(item => {
      item.classList.remove("is-active");
    });
  };

  cancelEditBtn.addEventListener("click", () => {
    exitEditMode();
    clearForm();
  });

  // --- Entry list ---

  const loadEntryList = async () => {
    try {
      const res = await fetch("/api/admin/entries");
      if (res.status === 401) {
        entryListItems.innerHTML = '<div class="entry-list-empty">Authentication required. Reload page.</div>';
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const entries = await res.json();
      renderEntryList(entries);
    } catch (err) {
      entryListItems.innerHTML = `<div class="entry-list-empty">Could not load entries: ${err.message}</div>`;
    }
  };

  const renderEntryList = (entries) => {
    if (!entries.length) {
      entryListItems.innerHTML = '<div class="entry-list-empty">No entries yet.</div>';
      return;
    }
    entryListItems.innerHTML = "";
    entries.forEach(entry => {
      const item = document.createElement("div");
      item.className = "entry-list-item";
      item.dataset.slug = entry.slug;
      if (editingSlug === entry.slug) item.classList.add("is-active");
      const typeIcon = entry.type === "note" ? "📝" : "🐄";
      item.innerHTML = `
        <span>${typeIcon} ${entry.slug}<span class="entry-slug">${entry.type}</span></span>
        <span class="entry-type">${entry.type}</span>
      `;
      item.addEventListener("click", () => loadEntry(entry.slug));
      entryListItems.appendChild(item);
    });
  };

  // --- Load single entry for editing ---

  const loadEntry = async (slug) => {
    try {
      showStatus("Loading entry...");
      const res = await fetch(`/api/admin/entry?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Clear form first
      clearForm();
      enterEditMode(slug);

      const manifest = data.manifest;
      const html = data.html || "";

      // Set type
      typeSelect.value = manifest.type || "cattle";
      slugInput.value = manifest.slug;
      slugInput.dataset.manual = "true";

      // Parse HTML to extract form fields
      if (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const titleEl = doc.querySelector(".journal-title");
        const subtitleEl = doc.querySelector(".journal-subtitle");
        const dateEl = doc.querySelector(".journal-date");
        const captionEl = doc.querySelector(".photo-caption");
        const emojiEl = doc.querySelector(".photo-icon");
        const signatureEl = doc.querySelector(".journal-signature");
        const doodle1El = doc.querySelector(".journal-doodle-1");
        const doodle2El = doc.querySelector(".journal-doodle-2");

        if (titleEl) titleInput.value = titleEl.textContent.trim();
        if (subtitleEl) subtitleInput.value = subtitleEl.textContent.trim();
        if (dateEl) dateInput.value = dateEl.textContent.trim();
        if (captionEl) captionInput.value = captionEl.textContent.trim();
        if (emojiEl) emojiInput.value = emojiEl.textContent.trim();
        if (signatureEl) {
          let sig = signatureEl.textContent.trim();
          if (sig.startsWith("~")) sig = sig.slice(1).trim();
          signatureInput.value = sig;
        }
        if (doodle1El) doodle1Input.value = doodle1El.textContent.trim();
        if (doodle2El) doodle2Input.value = doodle2El.textContent.trim();

        // Extract paragraphs
        const paragraphs = doc.querySelectorAll(".journal-content p");
        contentInput.value = Array.from(paragraphs).map(p => p.textContent.trim()).join("\n\n");

        // Extract facts
        const facts = doc.querySelectorAll(".journal-facts li");
        factsInput.value = Array.from(facts).map(li => li.textContent.trim()).join("\n");
      }

      // Set animal tags for notes
      if (manifest.animals && manifest.animals.length) {
        document.querySelectorAll('#animalTags input[type="checkbox"]').forEach(cb => {
          cb.checked = manifest.animals.includes(cb.value);
        });
      }

      // Display existing server images
      serverImages = manifest.images || [];
      if (serverImages.length) {
        serverImagesSection.classList.remove("hidden");
        serverImagesEl.innerHTML = "";
        serverImages.forEach((img, idx) => {
          const path = typeof img === "string" ? img : img.path;
          const div = document.createElement("div");
          div.className = "server-image";
          div.innerHTML = `
            <img src="stories/${path}" alt="Server image ${idx + 1}" />
            <div class="label">server</div>
          `;
          serverImagesEl.appendChild(div);
        });
      }

      // Trigger type change to show/hide sections
      typeSelect.dispatchEvent(new Event("change"));
      updatePreview();
      showStatus(`Loaded "${slug}" for editing`);
    } catch (err) {
      showStatus(`Failed to load entry: ${err.message}`, "error");
    }
  };

  // --- Save entry (create or update) ---

  const saveEntry = async () => {
    const slug = slugInput.value || slugify(titleInput.value);
    if (!slug) {
      showStatus("Please enter a title or slug", "error");
      return;
    }
    if (!titleInput.value.trim()) {
      showStatus("Please enter a title", "error");
      return;
    }

    const html = generateHtml();
    const entryType = typeSelect.value;

    // Build manifest extras
    const manifestExtra = {};
    if (entryType === "note") {
      const checked = [...document.querySelectorAll('#animalTags input:checked')].map(cb => cb.value);
      if (checked.length) manifestExtra.animals = checked;
      const dateVal = dateInput.value.trim();
      if (dateVal) {
        const match = dateVal.match(/(\w+ \d+, \d{4})/);
        if (match) {
          const parsed = new Date(match[1]);
          if (!isNaN(parsed)) manifestExtra.date = parsed.toISOString().split("T")[0];
        }
      }
    }

    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("type", entryType);
    fd.append("html", html);
    fd.append("manifest", JSON.stringify(manifestExtra));

    // Send kept server images during update
    if (editingSlug && serverImages.length) {
      fd.append("kept_images", JSON.stringify(serverImages));
    }

    // Append new image files
    uploadedImages.forEach((img, idx) => {
      if (img.file) {
        fd.append(`image_${idx}`, img.file);
      }
    });

    const isUpdate = !!editingSlug;
    const url = isUpdate
      ? `/api/admin/entry?slug=${encodeURIComponent(editingSlug)}`
      : "/api/admin/entries";
    const method = isUpdate ? "PUT" : "POST";

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) {
        showStatus(data.error || "Save failed", "error");
        return;
      }

      showStatus(isUpdate ? `Updated "${slug}" successfully!` : `Created "${slug}" successfully!`);
      loadEntryList();
      if (!isUpdate) {
        enterEditMode(slug);
      }
    } catch (err) {
      showStatus(`Save failed: ${err.message}`, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = isUpdate ? "Update on Server" : "Save to Server";
    }
  };

  saveBtn.addEventListener("click", saveEntry);

  // --- Delete entry ---

  const deleteEntry = async () => {
    if (!editingSlug) return;
    if (!confirm(`Delete "${editingSlug}"? This removes the HTML file and manifest entry.`)) return;

    try {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";
      const res = await fetch(`/api/admin/entry?slug=${encodeURIComponent(editingSlug)}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (!res.ok) {
        showStatus(data.error || "Delete failed", "error");
        return;
      }

      showStatus(`Deleted "${editingSlug}"`);
      exitEditMode();
      clearForm();
      loadEntryList();
    } catch (err) {
      showStatus(`Delete failed: ${err.message}`, "error");
    } finally {
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Delete Entry";
    }
  };

  deleteBtn.addEventListener("click", deleteEntry);

  // --- Clear form helper ---

  const clearForm = () => {
    form.reset();
    slugInput.dataset.manual = "";
    uploadedImages = [];
    serverImages = [];
    renderImagePreviews();
    serverImagesSection.classList.add("hidden");
    serverImagesEl.innerHTML = "";
    previewContent.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 40px;">Fill out the form to see a preview</p>';
    manifestOutput.textContent = "{}";
    htmlOutput.textContent = "";
  };

  // Auto-generate slug from title
  titleInput.addEventListener("input", () => {
    if (!slugInput.dataset.manual) {
      slugInput.value = slugify(titleInput.value);
    }
    updatePreview();
  });

  slugInput.addEventListener("input", () => {
    slugInput.dataset.manual = slugInput.value ? "true" : "";
  });

  // Update defaults when type changes
  typeSelect.addEventListener("change", () => {
    const type = typeSelect.value;
    const defaults = typeDefaults[type];

    if (!emojiInput.value) emojiInput.value = defaults.emoji;
    if (!doodle1Input.value) doodle1Input.value = defaults.doodle1;
    if (!doodle2Input.value) doodle2Input.value = defaults.doodle2;

    // Show/hide sections based on type
    animalTagGroup.classList.toggle("hidden", type !== "note");
    imageUploadGroup.classList.toggle("hidden", type === "note");

    updatePreview();
  });

  // Live preview on all inputs
  const inputElements = [
    subtitleInput, dateInput, emojiInput, captionInput,
    contentInput, factsInput, signatureInput, doodle1Input, doodle2Input
  ];
  inputElements.forEach(el => {
    el.addEventListener("input", updatePreview);
  });
  document.querySelectorAll('#animalTags input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", updatePreview);
  });

  // Image upload handling
  imageUploadArea.addEventListener("click", () => imageInput.click());

  imageUploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    imageUploadArea.classList.add("dragover");
  });

  imageUploadArea.addEventListener("dragleave", () => {
    imageUploadArea.classList.remove("dragover");
  });

  imageUploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    imageUploadArea.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });

  imageInput.addEventListener("change", () => {
    handleFiles(imageInput.files);
  });

  const handleFiles = (files) => {
    const remaining = MAX_IMAGES - uploadedImages.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach(file => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedImages.push({
          file,
          dataUrl: e.target.result,
          processed: null
        });
        renderImagePreviews();
        processImage(uploadedImages.length - 1);
      };
      reader.readAsDataURL(file);
    });
  };

  const renderImagePreviews = () => {
    imagePreviews.innerHTML = "";
    uploadedImages.forEach((img, idx) => {
      const preview = document.createElement("div");
      preview.className = "image-preview";
      preview.innerHTML = `
        <img src="${img.dataUrl}" alt="Preview ${idx + 1}" />
        <button type="button" data-idx="${idx}">&times;</button>
      `;
      preview.querySelector("button").addEventListener("click", () => {
        uploadedImages.splice(idx, 1);
        renderImagePreviews();
        updatePreview();
      });
      imagePreviews.appendChild(preview);
    });
    updatePreview();
  };

  const processImage = async (idx) => {
    const img = uploadedImages[idx];
    if (!img) return;

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate new dimensions
      const ratio = TARGET_WIDTH / image.width;
      canvas.width = TARGET_WIDTH;
      canvas.height = Math.round(image.height * ratio);

      // Draw resized image
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Try webp first, fallback to jpeg
      canvas.toBlob((blob) => {
        if (blob) {
          img.processed = {
            blob,
            type: "webp",
            ext: "webp"
          };
        }
      }, "image/webp", 0.85);

      // Fallback to jpeg if webp not supported
      setTimeout(() => {
        if (!img.processed) {
          canvas.toBlob((blob) => {
            img.processed = {
              blob,
              type: "jpeg",
              ext: "jpg"
            };
          }, "image/jpeg", 0.85);
        }
      }, 100);
    };
    image.src = img.dataUrl;
  };

  // Generate HTML template
  const generateHtml = () => {
    const type = typeSelect.value;
    const defaults = typeDefaults[type];
    const slug = slugInput.value || slugify(titleInput.value) || "untitled";
    const title = escapeHtml(titleInput.value || "Untitled");
    const subtitle = escapeHtml(subtitleInput.value || "");
    const date = escapeHtml(dateInput.value || `${defaults.datePrefix} · ${defaults.dateSuffix} 01`);
    const emoji = emojiInput.value || defaults.emoji;
    const caption = escapeHtml(captionInput.value || `${title} in the pasture`);
    const signature = escapeHtml(signatureInput.value || "Logged by the field crew");
    const doodle1 = doodle1Input.value || defaults.doodle1;
    const doodle2 = doodle2Input.value || defaults.doodle2;

    // Parse content into paragraphs
    const paragraphs = (contentInput.value || "")
      .split(/\n\s*\n/)
      .filter(p => p.trim())
      .map(p => `    <p>${escapeHtml(p.trim())}</p>`)
      .join("\n");

    // Parse facts into list items
    const facts = (factsInput.value || "")
      .split("\n")
      .filter(f => f.trim())
      .map(f => `      <li>${escapeHtml(f.trim())}</li>`)
      .join("\n");

    return `<div class="journal-entry" data-tone="${slug}">
  <div class="journal-date">${date}</div>

  <div class="journal-photo placeholder" aria-hidden="true">
    <div class="photo-icon">${emoji}</div>
    <div class="photo-caption">${caption}</div>
  </div>

  <h2 class="journal-title">${title}</h2>
  <p class="journal-subtitle">${subtitle}</p>

  <div class="journal-content">
${paragraphs}
  </div>

  <div class="journal-facts">
    <h3>${defaults.factsHeader}</h3>
    <ul>
${facts}
    </ul>
  </div>

  <div class="journal-signature">
    ~ ${signature}
  </div>

  <div class="journal-doodle journal-doodle-1">${doodle1}</div>
  <div class="journal-doodle journal-doodle-2">${doodle2}</div>
</div>
`;
  };

  // Generate manifest entry
  const generateManifest = () => {
    const type = typeSelect.value;
    const slug = slugInput.value || slugify(titleInput.value) || "untitled";

    const entry = {
      slug,
      type
    };

    // Add animals for notes
    if (type === "note") {
      const checked = [...document.querySelectorAll('#animalTags input:checked')].map(cb => cb.value);
      if (checked.length) entry.animals = checked;
      // Extract date from date line if possible
      const dateVal = dateInput.value.trim();
      if (dateVal) {
        const match = dateVal.match(/(\w+ \d+, \d{4})/);
        if (match) {
          const parsed = new Date(match[1]);
          if (!isNaN(parsed)) entry.date = parsed.toISOString().split("T")[0];
        }
      }
    }

    // Add images for cattle if any
    if (type === "cattle" && uploadedImages.length > 0) {
      const titleForFile = titleInput.value ?
        titleInput.value.replace(/[^a-zA-Z0-9]/g, "") :
        slug.replace(/-/g, "_");

      entry.images = uploadedImages.map((img, idx) => {
        const ext = img.processed?.ext || "webp";
        return `images/optimized/${titleForFile}_${idx + 1}-1600w.${ext}`;
      });
    }

    return JSON.stringify(entry, null, 2);
  };

  // Update preview (function declaration for hoisting)
  function updatePreview() {
    const html = generateHtml();
    previewContent.innerHTML = html;
    htmlOutput.textContent = html;
    manifestOutput.textContent = generateManifest();
  }

  // Generate button
  generateBtn.addEventListener("click", () => {
    if (!titleInput.value.trim()) {
      showStatus("Please enter a title", "error");
      return;
    }
    updatePreview();
    showStatus("Generated! Copy the outputs or download files.");
  });

  // Download HTML
  downloadHtmlBtn.addEventListener("click", () => {
    const slug = slugInput.value || slugify(titleInput.value) || "untitled";
    const html = generateHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(`Downloaded ${slug}.html`);
  });

  // Download images
  downloadImagesBtn.addEventListener("click", async () => {
    if (uploadedImages.length === 0) {
      showStatus("No images to download", "error");
      return;
    }

    const titleForFile = titleInput.value ?
      titleInput.value.replace(/[^a-zA-Z0-9]/g, "") :
      (slugInput.value || "image").replace(/-/g, "_");

    // Wait for all images to be processed
    await new Promise(resolve => setTimeout(resolve, 500));

    uploadedImages.forEach((img, idx) => {
      if (img.processed?.blob) {
        const url = URL.createObjectURL(img.processed.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${titleForFile}_${idx + 1}-1600w.${img.processed.ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    showStatus(`Downloaded ${uploadedImages.length} image(s). Place in stories/images/optimized/`);
  });

  // Clear form
  clearBtn.addEventListener("click", () => {
    exitEditMode();
    clearForm();
    showStatus("Form cleared");
  });

  // Load from localStorage on init
  const loadDraft = () => {
    const draft = localStorage.getItem("thornyknolls_admin_draft");
    if (draft) {
      try {
        const data = JSON.parse(draft);
        typeSelect.value = data.type || "cattle";
        slugInput.value = data.slug || "";
        titleInput.value = data.title || "";
        subtitleInput.value = data.subtitle || "";
        dateInput.value = data.date || "";
        emojiInput.value = data.emoji || "";
        captionInput.value = data.caption || "";
        contentInput.value = data.content || "";
        factsInput.value = data.facts || "";
        signatureInput.value = data.signature || "";
        doodle1Input.value = data.doodle1 || "";
        doodle2Input.value = data.doodle2 || "";
        if (data.slug) slugInput.dataset.manual = "true";
        if (data.animals && data.animals.length) {
          document.querySelectorAll('#animalTags input[type="checkbox"]').forEach(cb => {
            cb.checked = data.animals.includes(cb.value);
          });
        }
        updatePreview();
      } catch (e) {
        // Ignore
      }
    }
  };

  // Save to localStorage on changes
  const saveDraft = () => {
    const data = {
      type: typeSelect.value,
      slug: slugInput.value,
      title: titleInput.value,
      subtitle: subtitleInput.value,
      date: dateInput.value,
      emoji: emojiInput.value,
      caption: captionInput.value,
      content: contentInput.value,
      facts: factsInput.value,
      signature: signatureInput.value,
      doodle1: doodle1Input.value,
      doodle2: doodle2Input.value,
      animals: [...document.querySelectorAll('#animalTags input:checked')].map(cb => cb.value)
    };
    localStorage.setItem("thornyknolls_admin_draft", JSON.stringify(data));
  };

  // Debounced save
  let saveTimeout;
  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveDraft, 1000);
  };

  // Add save listener to all inputs
  [typeSelect, slugInput, ...inputElements].forEach(el => {
    el.addEventListener("input", debouncedSave);
    el.addEventListener("change", debouncedSave);
  });

  // Initialize
  loadDraft();
  typeSelect.dispatchEvent(new Event("change"));
  loadEntryList();
})();
