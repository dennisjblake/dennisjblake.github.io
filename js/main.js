// Progressive enhancement: only opt into motion when JS runs.
document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Set by initCountUp so the reveal observer can start each counter on appear.
let countUpRun = null;

/* ── Theme toggle (respects OS preference until the user chooses) ── */
function initTheme() {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const effective = () =>
    root.getAttribute("data-theme") || (systemDark.matches ? "dark" : "light");

  btn.addEventListener("click", () => {
    const next = effective() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      /* storage unavailable */
    }
  });
}

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
        const delay = Math.min(i, 5) * 70;
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add("is-visible");
        obs.unobserve(el);

        // Start the metric counter in sync with its card appearing.
        if (countUpRun) {
          const value = el.matches(".metric-value")
            ? el
            : el.querySelector(".metric-value");
          if (value) countUpRun(value, delay);
        }
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
  const values = Array.from(document.querySelectorAll(".metric-value"));
  if (!values.length) return;

  const parse = (raw) => {
    const m = raw.match(/^(\D*)(\d[\d,]*)(.*)$/);
    if (!m) return null;
    return {
      prefix: m[1],
      target: parseInt(m[2].replace(/,/g, ""), 10),
      suffix: m[3],
    };
  };

  const data = new Map();
  values.forEach((el) => {
    const p = parse(el.textContent.trim());
    if (p) data.set(el, p);
  });
  if (!data.size) return;

  const setFinal = (el, p) => {
    el.textContent = `${p.prefix}${p.target.toLocaleString("en-US")}${p.suffix}`;
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    data.forEach(setFinal);
    return;
  }

  // Reset to zero up front so the count is always visible when it runs.
  data.forEach((p, el) => {
    el.textContent = `${p.prefix}0${p.suffix}`;
  });

  const run = (el, delay = 0) => {
    const p = data.get(el);
    if (!p || el.dataset.counted) return;
    el.dataset.counted = "1";

    const duration = 1100;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    let start = null;
    const tick = (now) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / duration, 1);
      const current = Math.round(p.target * easeOut(t));
      el.textContent = `${p.prefix}${current.toLocaleString("en-US")}${p.suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), delay);
  };

  // Expose so the reveal observer can start each counter as its card appears.
  countUpRun = run;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.35 },
  );

  data.forEach((_, el) => observer.observe(el));
}

initMenu();
initCountUp();
initReveal();
initScrollSpy();
initTheme();
