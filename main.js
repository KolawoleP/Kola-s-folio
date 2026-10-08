// Live Berlin clock in the sidebar
const clock = document.querySelector("[data-berlin-clock]");

if (clock) {
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const tick = () => {
    const now = new Date();
    clock.textContent = format.format(now);
    clock.dateTime = now.toISOString();
  };

  tick();
  setInterval(tick, 10_000);
}

// Nav icons: straighten a tilted icon as soon as its item is clicked
document.querySelectorAll(".nav__item").forEach((item) => {
  item.addEventListener("click", () => item.classList.add("is-clicked"));
  item.addEventListener("mouseleave", () => item.classList.remove("is-clicked"));
});

// Contact menu (home): click to open; copy the email address or open the mail app
const contactMenu = document.querySelector("[data-contact-menu]");

if (contactMenu) {
  const toggle = contactMenu.querySelector("[data-contact-toggle]");
  const dropdown = contactMenu.querySelector("[data-contact-dropdown]");
  const label = contactMenu.querySelector("[data-contact-label]");
  const status = contactMenu.querySelector("[data-contact-status]");
  const email = contactMenu.dataset.email;
  let copiedTimer;

  const open = () => {
    dropdown.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => dropdown.classList.add("is-open"));
  };

  const close = () => {
    dropdown.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      if (toggle.getAttribute("aria-expanded") === "false") dropdown.hidden = true;
    }, 150);
  };

  toggle.addEventListener("click", () => (dropdown.hidden ? open() : close()));

  document.addEventListener("click", (event) => {
    if (!contactMenu.contains(event.target) && !dropdown.hidden) close();
  });

  contactMenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dropdown.hidden) {
      close();
      toggle.focus();
    }
  });

  contactMenu.querySelector("[data-contact-copy]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Clipboard API unavailable (e.g. insecure context): fall back to a temporary selection
      const field = Object.assign(document.createElement("textarea"), { value: email });
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    close();
    contactMenu.classList.add("is-copied");
    label.textContent = "Email copied";
    status.textContent = `Copied ${email} to the clipboard`;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      contactMenu.classList.remove("is-copied");
      label.textContent = "Contact me";
      status.textContent = "";
    }, 2000);
  });

  contactMenu.querySelector("a.contact-menu__item").addEventListener("click", close);
}

// Video players: show a play button over the poster; switch to native controls once playing
document.querySelectorAll("[data-video-player]").forEach((player) => {
  const video = player.querySelector("video");
  const play = player.querySelector("[data-video-play]");

  play.addEventListener("click", () => {
    video.controls = true;
    video.play();
  });
  video.addEventListener("play", () => player.classList.add("is-playing"));
  video.addEventListener("ended", () => {
    player.classList.remove("is-playing");
    video.controls = false;
    video.currentTime = 0;
  });
});

// Photo lightbox: click a [data-lightbox] link to open its full-size image
const lightbox = document.querySelector(".lightbox");
const photoLinks = [...document.querySelectorAll("[data-lightbox]")];

if (lightbox && photoLinks.length) {
  const img = lightbox.querySelector(".lightbox__img");
  const stage = lightbox.querySelector(".lightbox__stage");
  const count = lightbox.querySelector(".lightbox__count");
  const prevBtn = lightbox.querySelector("[data-lightbox-prev]");
  const nextBtn = lightbox.querySelector("[data-lightbox-next]");
  let index = 0;

  const preload = (i) => {
    if (photoLinks[i]) new Image().src = photoLinks[i].href;
  };

  const show = (i, direction) => {
    index = i;
    const link = photoLinks[i];
    img.src = link.href;
    img.alt = link.querySelector("img").alt;
    count.textContent = `${i + 1} / ${photoLinks.length}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === photoLinks.length - 1;

    img.classList.remove("is-next", "is-prev");
    if (direction) {
      void img.offsetWidth; // restart the slide-in animation
      img.classList.add(direction === 1 ? "is-next" : "is-prev");
    }
    preload(i + 1);
    preload(i - 1);
  };

  const step = (direction) => {
    const next = index + direction;
    if (next >= 0 && next < photoLinks.length) show(next, direction);
  };

  const open = (i) => {
    show(i);
    lightbox.showModal();
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
  };

  const cleanUp = () => {
    if (!lightbox.classList.contains("is-open") && !document.documentElement.style.overflow) return;
    lightbox.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    photoLinks[index].focus({ preventScroll: true });
  };

  const close = () => {
    lightbox.close();
    cleanUp();
  };

  // Also covers closing with the Escape key
  lightbox.addEventListener("close", cleanUp);

  photoLinks.forEach((link, i) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      open(i);
    });
  });

  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  lightbox.querySelector("[data-lightbox-close]").addEventListener("click", close);

  let touchStartX = null;
  let swiped = false;

  // Clicking anywhere outside the photo and the buttons closes the viewer
  lightbox.addEventListener("click", (event) => {
    if (swiped) {
      swiped = false;
      return;
    }
    if (event.target === lightbox || event.target === stage) close();
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  });

  // Swipe left/right on touch screens
  stage.addEventListener("pointerdown", (event) => {
    swiped = false;
    if (event.pointerType !== "mouse") touchStartX = event.clientX;
  });
  stage.addEventListener("pointerup", (event) => {
    if (touchStartX === null) return;
    const dx = event.clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 50) {
      swiped = true;
      step(dx < 0 ? 1 : -1);
    }
  });
}

// Screen galleries: clicking a thumbnail swaps the large screen above it
document.querySelectorAll("[data-gallery]").forEach((gallery) => {
  const main = gallery.querySelector("[data-gallery-main]");
  const thumbs = [...gallery.querySelectorAll("[data-src]")];

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener("click", () => {
      if (thumb.classList.contains("is-active")) return;
      thumbs.forEach((t) => {
        t.classList.toggle("is-active", t === thumb);
        t.setAttribute("aria-pressed", String(t === thumb));
      });
      main.classList.add("is-swapping");
      setTimeout(() => {
        main.src = thumb.dataset.src;
        main.alt = main.alt.replace(/\d+ of/, `${i + 1} of`);
        main.classList.remove("is-swapping");
      }, 150);
    });
  });
});

// Scroll reveal: blocks ease in as they enter the viewport (modelled on ndidigreat.com).
// Text fades; media and cards also rise by 30% of their height (capped at 80px).
(() => {
  const root = document.documentElement;
  const done = () => root.classList.remove("reveal-pending");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }

  const SKIP = ".sidebar, .proto, .lightbox, .kuda-gallery__thumbs";
  const SLIDE = [
    ".card", ".work-card", ".cs-card", ".est-points li", ".kuda-panel", ".proto-stage", ".cs-hero", ".kuda-hero", ".cs-photo",
    ".cs-phones img", ".cs-v2", ".photo", ".polaroid", ".about-polaroid", ".book", ".record",
    ".kuda-styleguide img", ".kuda-phones", ".est-figure img", ".est-board", ".est-options figure", ".est-final",
  ].join(", ");
  const FADE = [
    "h1", "h2", "h3", ".cs-header__date", ".cs-header__summary", ".cs-tags", ".contact-menu", ".hero__text",
    ".eyebrow", ".work-page__intro", ".work-page__divider", ".cs-meta", ".cs-divider", ".cs-text", ".cs-quote", ".cs-caption", ".cs-bullets li",
    ".kuda-flow-caption", ".est-figure figcaption", ".page-header__text", ".about__bio p",
    ".timeline__item", ".stack__row", ".cs-next",
  ].join(", ");

  const main = document.querySelector(".main");
  if (!main) return done();

  const tagged = [];
  const tag = (el, kind) => {
    if (el.closest(SKIP) || el.closest(".reveal")) return;
    el.classList.add("reveal", `reveal--${kind}`);
    tagged.push(el);
  };
  main.querySelectorAll(SLIDE).forEach((el) => tag(el, "slide"));
  main.querySelectorAll(FADE).forEach((el) => tag(el, "fade"));
  done();

  const STEP = 70; // ms between blocks that enter together
  const MAX_STEPS = 5;

  const show = (el, delay) => {
    el.style.setProperty("--reveal-delay", `${delay}ms`);
    el.classList.add("is-revealed");
    // Hand transitions back to the element's own styles (hover effects etc.) once it's in
    setTimeout(() => {
      el.classList.remove("reveal", "reveal--slide", "reveal--fade", "is-revealed");
      el.style.removeProperty("--reveal-delay");
    }, 900 + delay + 100);
  };

  // Don't slide in an empty box: wait for the image (up to 1.5s) before revealing it
  const whenLoaded = (el) => {
    const img = el.tagName === "IMG" ? el : null;
    if (!img || img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
      setTimeout(resolve, 1500);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const entering = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);

      entering.forEach((entry, i) => {
        const el = entry.target;
        observer.unobserve(el);
        const delay = Math.min(i, MAX_STEPS) * STEP + (el.classList.contains("reveal--slide") ? 100 : 0);
        whenLoaded(el).then(() => {
          // Next frame so the hidden state is painted first; the timer covers tabs that aren't rendering frames
          let shown = false;
          const go = () => {
            if (shown) return;
            shown = true;
            show(el, delay);
          };
          requestAnimationFrame(go);
          setTimeout(go, 100);
        });
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );

  tagged.forEach((el) => observer.observe(el));
})();

// Theme switch: Light or Dark (dark by default). The choice is remembered on this device.
(() => {
  const footer = document.querySelector(".footer");
  if (!footer) return;
  const root = document.documentElement;
  const ICONS = {
    light: '<circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9"/>',
    dark: '<path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z"/>',
  };
  const LABELS = { light: "Light", dark: "Dark" };

  const group = document.createElement("div");
  group.className = "theme-switch";
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", "Colour theme");
  const buttons = Object.keys(LABELS).map((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-switch__option";
    button.setAttribute("role", "radio");
    button.dataset.theme = key;
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key]}</svg>${LABELS[key]}`;
    button.addEventListener("click", () => set(key));
    group.append(button);
    return button;
  });
  footer.append(group);

  // Arrow keys move between options, like other radio groups
  group.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const next = buttons.find((b) => b.dataset.theme !== root.dataset.theme);
    set(next.dataset.theme);
    next.focus();
  });

  function sync() {
    buttons.forEach((b) => {
      const on = b.dataset.theme === root.dataset.theme;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
  }

  function set(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    sync();
  }

  sync();
})();
