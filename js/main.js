// Progressive enhancement: only opt into motion when JS runs.
document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ── Mobile menu (morphs the burger into an X) ── */
function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("active");
    toggle.classList.toggle("active", open);
  });

  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("active");
      toggle.classList.remove("active");
    }),
  );
}

/* ── Scroll reveal with staggered delays ── */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      // Stagger only siblings entering together, capped so nothing lags.
      const revealing = entries.filter((e) => e.isIntersecting);
      revealing.forEach((entry, i) => {
        const el = entry.target;
        el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
        el.classList.add("is-visible");
        obs.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  items.forEach((el) => observer.observe(el));
}

/* ── Scrollspy: highlight the active nav link ── */
function initScrollSpy() {
  const links = Array.from(
    document.querySelectorAll(".nav-links a[href^='#']"),
  );
  if (!links.length || !("IntersectionObserver" in window)) return;

  const map = new Map();
  links.forEach((link) => {
    const id = link.getAttribute("href").slice(1);
    const section = document.getElementById(id);
    if (section) map.set(section, link);
  });
  if (!map.size) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.remove("active"));
        const active = map.get(entry.target);
        if (active) active.classList.add("active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );

  map.forEach((_, section) => observer.observe(section));
}

/* ── Count-up for impact metrics (first-time delight) ── */
function initCountUp() {
  const values = document.querySelectorAll(".metric-value");
  if (!values.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const animate = (el) => {
    const raw = el.textContent.trim();
    const match = raw.match(/^(\D*)(\d[\d,]*)(.*)$/);
    if (!match) return;
    const [, prefix, digits, suffix] = match;
    const target = parseInt(digits.replace(/,/g, ""), 10);
    if (!Number.isFinite(target)) return;

    const duration = 1100;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const current = Math.round(target * easeOut(t));
      el.textContent = `${prefix}${current.toLocaleString("en-US")}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.6 },
  );

  values.forEach((el) => observer.observe(el));
}

initMenu();
initReveal();
initScrollSpy();
initCountUp();
