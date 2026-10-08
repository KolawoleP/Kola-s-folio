// Live prototype: Talabat partner portal, "Create a new campaign"
(() => {
  const stage = document.querySelector("[data-proto-stage]");
  const proto = document.querySelector("[data-proto]");
  if (!stage || !proto) return;

  // Render at design size (962px) and scale down to fit narrower layouts
  const DESIGN_WIDTH = 962;
  const fit = () => {
    const scale = Math.min(1, stage.clientWidth / DESIGN_WIDTH);
    stage.style.setProperty("--proto-scale", scale);
  };
  fit();
  new ResizeObserver(fit).observe(stage);

  // Expand / collapse "Advanced settings" rows
  proto.querySelectorAll("[data-proto-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
    });
  });

  // Budget: the custom amount is only editable when "Custom" is selected
  const budgetInput = proto.querySelector("[data-proto-budget-input]");
  const syncBudget = () => {
    const custom = proto.querySelector('input[name="proto-budget"][value="custom"]').checked;
    budgetInput.disabled = !custom;
    if (!custom) budgetInput.value = "10,000";
  };
  proto.querySelectorAll('input[name="proto-budget"]').forEach((radio) => radio.addEventListener("change", syncBudget));
  syncBudget();

  // Toast for steps that aren't built yet
  const toast = proto.querySelector("[data-proto-toast]");
  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  // ---------- Creative studio overlay ----------
  const studio = proto.querySelector("[data-studio]");
  const banner = studio.querySelector("[data-studio-banner]");
  const addBtn = studio.querySelector("[data-studio-add]");
  const nameInput = studio.querySelector("[data-studio-name]");
  const titleInput = studio.querySelector('[data-studio-input="title"]');
  const subtitleInput = studio.querySelector('[data-studio-input="subtitle"]');
  const scale = studio.querySelector("[data-studio-scale]");
  const phoneBanner = proto.querySelector(".proto-phone__banner");
  const createBtn = proto.querySelector('.proto-btn[data-proto-action="open-studio"]');
  const submitBtn = proto.querySelector("[data-proto-submit]");
  const terms = proto.querySelector(".proto-terms input");

  const LANGS = {
    en: { name: "English", locale: "English (UAE)", dir: "ltr" },
    ckb: { name: "Central Kurdish", locale: "Central Kurdish (Iraq)", dir: "rtl" },
    ar: { name: "Arabic", locale: "Arabic (UAE)", dir: "rtl" },
  };
  const DEFAULT_COPY = { title: "Title appears here. Up to 3 lines.", subtitle: "Subtitle comes here" };
  const copyByLang = { en: { title: "", subtitle: "" }, ckb: { title: "", subtitle: "" }, ar: { title: "", subtitle: "" } };
  let lang = "en";
  let added = false;
  let lastFocus = null;

  const renderCopy = () => {
    const current = copyByLang[lang];
    studio.querySelector('[data-studio-out="title"]').textContent = current.title || DEFAULT_COPY.title;
    studio.querySelector('[data-studio-out="subtitle"]').textContent = current.subtitle || DEFAULT_COPY.subtitle;
    studio.querySelector('[data-studio-count="title"]').textContent = `${current.title.length}/28`;
    studio.querySelector('[data-studio-count="subtitle"]').textContent = `${current.subtitle.length}/40`;
    addBtn.disabled = !copyByLang.en.title.trim();
  };

  const setLang = (next) => {
    lang = next;
    studio.querySelectorAll("[data-studio-lang]").forEach((chip) => {
      const on = chip.dataset.studioLang === next;
      chip.classList.toggle("is-selected", on);
      chip.setAttribute("aria-selected", String(on));
    });
    const { name, locale, dir } = LANGS[next];
    studio.querySelector('[data-studio-label="title"]').textContent = `${name} title`;
    studio.querySelector('[data-studio-label="subtitle"]').textContent = `${name} subtitle`;
    studio.querySelector("[data-studio-locale]").textContent = locale;
    [titleInput, subtitleInput].forEach((input) => (input.dir = dir));
    banner.dir = dir;
    titleInput.value = copyByLang[next].title;
    subtitleInput.value = copyByLang[next].subtitle;
    renderCopy();
  };

  studio.querySelectorAll("[data-studio-lang]").forEach((chip) => {
    chip.addEventListener("click", () => setLang(chip.dataset.studioLang));
  });

  [titleInput, subtitleInput].forEach((input) => {
    input.addEventListener("input", () => {
      copyByLang[lang][input.dataset.studioInput] = input.value;
      renderCopy();
    });
  });

  // Uploads: preview the chosen file in the banner straight away; once uploaded, the chip deletes it
  const photo = studio.querySelector("[data-studio-photo]");
  const FILE_LABELS = { logo: "Upload your logo", image: "Upload your product image" };
  const UPLOADED_LABELS = { logo: "Logo uploaded", image: "Image uploaded" };
  const uploaded = { logo: false, image: false };
  const pan = { x: 0, y: 0, s: 1 };

  const applyPan = () => {
    photo.style.setProperty("--x", `${pan.x}px`);
    photo.style.setProperty("--y", `${pan.y}px`);
    photo.style.setProperty("--s", pan.s);
  };

  const setUpload = (kind, file) => {
    // Object URLs aren't revoked: the campaign preview's copy of the banner may still be showing them
    const preview = studio.querySelector(`[data-studio-preview="${kind}"]`);
    uploaded[kind] = Boolean(file);
    if (file) preview.src = URL.createObjectURL(file);
    else preview.removeAttribute("src");

    if (kind === "logo") {
      preview.hidden = !file;
      studio.querySelector("[data-studio-logo-text]").hidden = Boolean(file);
    } else {
      photo.hidden = !file;
      pan.x = 0;
      pan.y = 0;
      applyPan();
    }
    studio.querySelector(`[data-studio-file-label="${kind}"]`).textContent = file ? UPLOADED_LABELS[kind] : FILE_LABELS[kind];
    studio.querySelector(`[data-studio-file-action="${kind}"]`).textContent = file ? "Delete" : "Upload";
    if (!file) studio.querySelector(`[data-studio-file="${kind}"]`).value = "";
  };

  studio.querySelectorAll("[data-studio-file]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.files[0]) setUpload(input.dataset.studioFile, input.files[0]);
    });
  });

  studio.querySelectorAll("[data-studio-file-chip]").forEach((chip) => {
    chip.addEventListener("click", (event) => {
      const kind = chip.dataset.studioFileChip;
      if (!uploaded[kind]) return; // no file yet: let the label open the file picker
      event.preventDefault();
      setUpload(kind, null);
    });
  });

  // Drag the photo around inside its container
  let drag = null;
  photo.addEventListener("pointerdown", (event) => {
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: pan.x, y: pan.y };
    photo.setPointerCapture(event.pointerId);
    photo.classList.add("is-dragging");
  });
  photo.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    // The whole prototype may be scaled down on small screens; convert screen pixels back to design pixels
    const ratio = photo.offsetWidth / photo.getBoundingClientRect().width || 1;
    pan.x = drag.x + (event.clientX - drag.startX) * ratio;
    pan.y = drag.y + (event.clientY - drag.startY) * ratio;
    applyPan();
  });
  const endDrag = () => {
    drag = null;
    photo.classList.remove("is-dragging");
  };
  photo.addEventListener("pointerup", endDrag);
  photo.addEventListener("pointercancel", endDrag);

  // Colours: text, image container and banner background
  const COLOR_VARS = { text: "--banner-ink", container: "--container", background: "--banner-bg" };
  studio.querySelectorAll("[data-studio-color]").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      const group = swatch.dataset.studioColor;
      studio.querySelectorAll(`[data-studio-color="${group}"]`).forEach((s) => {
        s.classList.toggle("is-selected", s === swatch);
        s.setAttribute("aria-pressed", String(s === swatch));
      });
      banner.style.setProperty(COLOR_VARS[group], swatch.dataset.value);
    });
  });

  // Scale image: zooms only the photo. 55 (the design default) = 100%, 0 = 50%, 100 = 200%
  const syncScale = () => {
    const v = Number(scale.value);
    scale.style.setProperty("--fill", `${v}%`);
    pan.s = v <= 55 ? 0.5 + (v / 55) * 0.5 : 1 + (v - 55) / 45;
    applyPan();
  };
  scale.addEventListener("input", syncScale);
  syncScale();

  const openStudio = () => {
    lastFocus = document.activeElement;
    proto.querySelectorAll(".proto-hint").forEach((el) => el.classList.remove("proto-hint"));
    studio.hidden = false;
    studio.querySelector(".studio__scroll").scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => studio.classList.add("is-open")));
    setTimeout(() => nameInput.focus({ preventScroll: true }), 350);
  };

  const closeStudio = () => {
    studio.classList.remove("is-open");
    setTimeout(() => {
      studio.hidden = true;
      lastFocus?.focus({ preventScroll: true });
    }, 300);
  };

  const syncSubmit = () => {
    submitBtn.disabled = !(added && terms.checked);
  };

  proto.querySelectorAll('[data-proto-action="open-studio"]').forEach((button) => button.addEventListener("click", openStudio));
  studio.querySelector("[data-studio-close]").addEventListener("click", closeStudio);
  studio.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeStudio();
  });

  // Campaign preview: one banner per language. A language with no copy of its own shows the English banner.
  const pager = proto.querySelector("[data-proto-pager]");
  const pagerLabel = pager.querySelector("[data-proto-pager-label]");
  const pagerDots = pager.querySelector("[data-proto-pager-dots]");
  const LANG_KEYS = Object.keys(LANGS);
  let previews = [];
  let page = 0;

  pagerDots.replaceChildren(...LANG_KEYS.map(() => Object.assign(document.createElement("span"), { className: "proto-pager__dot" })));

  const showPage = (i) => {
    page = i;
    const key = LANG_KEYS[i];
    phoneBanner.replaceChildren(previews[i]);
    pagerLabel.textContent = `${LANGS[key].name} Banner`;
    [...pagerDots.children].forEach((dot, d) => dot.classList.toggle("is-active", d === i));
    pager.querySelector('[data-proto-pager-step="-1"]').disabled = i === 0;
    pager.querySelector('[data-proto-pager-step="1"]').disabled = i === LANG_KEYS.length - 1;
  };

  pager.querySelectorAll("[data-proto-pager-step]").forEach((btn) => {
    btn.addEventListener("click", () => showPage(page + Number(btn.dataset.protoPagerStep)));
  });

  const buildPreviews = () => {
    // Snapshot of the finished banner (logo, photo position/zoom, colours), without the studio's hooks
    const template = banner.cloneNode(true);
    template.querySelectorAll("[data-studio-photo], [data-studio-preview], [data-studio-out], [data-studio-copy], [data-studio-art], [data-studio-logo-text]").forEach((el) => {
      [...el.attributes].filter((a) => a.name.startsWith("data-studio")).forEach((a) => el.removeAttribute(a.name));
    });
    template.removeAttribute("data-studio-banner");
    template.setAttribute("aria-hidden", "true");

    return LANG_KEYS.map((key) => {
      const own = copyByLang[key].title.trim() || copyByLang[key].subtitle.trim();
      const source = own ? key : "en";
      const el = template.cloneNode(true);
      el.dir = LANGS[source].dir;
      el.querySelector(".studio-banner__title").textContent = copyByLang[source].title || DEFAULT_COPY.title;
      el.querySelector(".studio-banner__subtitle").textContent = copyByLang[source].subtitle || DEFAULT_COPY.subtitle;
      return el;
    });
  };

  // Adding the banner updates the campaign screen: preview, button label and submit state
  addBtn.addEventListener("click", () => {
    added = true;
    previews = buildPreviews();
    phoneBanner.classList.add("has-banner");
    phoneBanner.setAttribute("aria-label", "Edit banner");
    pager.hidden = false;
    showPage(0);
    createBtn.textContent = "Edit banner";
    syncSubmit();
    closeStudio();
    setTimeout(() => showToast("Banner added to campaign"), 320);
  });

  terms.addEventListener("change", syncSubmit);
  submitBtn.addEventListener("click", () => showToast("Campaign sent for approval"));
})();
