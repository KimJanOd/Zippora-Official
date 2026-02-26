/* =========================================================
   ZIPPORA — INTERACTIONS (no frameworks, class toggles)
========================================================= */

(function () {
  const header = document.querySelector("header");
  const nav = document.querySelector("header nav");
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const sections = Array.from(document.querySelectorAll("main section[id]"));

  // ---------- Helpers ----------
  function setHeaderOffsetVar() {
    if (!header) return;
    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-h", `${h}px`);
    document.documentElement.style.scrollPaddingTop = `${Math.ceil(h) + 8}px`;
  }

  function setHeaderScrolledClass() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 1);
  }

  function setActiveNavById(id) {
    if (!id) return;

    // Contact is a CTA, not a section indicator
    if (id === "contact") {
      navLinks.forEach((a) => {
        a.classList.remove("is-active");
        a.removeAttribute("aria-current");
      });
      return;
    }

    navLinks.forEach((a) => {
      const isMatch = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("is-active", isMatch);

      if (isMatch) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  

  // ---------- Smooth scroll ----------
  function setupSmoothScroll() {
    if (!navLinks.length) return;

    navLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        const target = href ? document.querySelector(href) : null;
        if (!target) return;

        e.preventDefault();

        setHeaderOffsetVar();
        const headerH = header ? header.getBoundingClientRect().height : 0;
        const y =
          window.scrollY + target.getBoundingClientRect().top - (headerH + 8);

        window.scrollTo({ top: y, behavior: "smooth" });
      });
    });
  }

  // ---------- Scroll spy ----------
  function setupScrollSpy() {
    if (!("IntersectionObserver" in window) || !sections.length) return;

    const headerH = header ? header.getBoundingClientRect().height : 0;
    let currentId = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            currentId = entry.target.id;
          }
        });

        if (currentId) {
          setActiveNavById(currentId);
        }
      },
      {
        root: null,
        rootMargin: `-${headerH + 8}px 0px -80% 0px`,
        threshold: 0,
      }
    );
    sections.forEach((section) => observer.observe(section));
  }



  // ---------- Music horizontal scroll arrows ----------
  function setupMusicScrollControls() {
    const musicSection = document.querySelector("#music");
    if (!musicSection) return;

    const container = musicSection.querySelector(".container");
    const list = musicSection.querySelector(".music-list");
    const items = list ? Array.from(list.querySelectorAll(".music-item")) : [];

    if (container && items.length === 1) {
      container.classList.add("has-single-music");
    }

    function isOverflowing(el) {
      return el.scrollWidth > el.clientWidth + 2;
    }

    function buildControls() {
      if (!container || !list) return;

      const existing = container.querySelector(".music-scroll-controls");
      if (existing) existing.remove();

      if (!isOverflowing(list)) return;

      const controls = document.createElement("div");
      controls.className = "music-scroll-controls";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "music-scroll-btn music-scroll-btn--prev";
      prev.innerHTML = "<span>‹</span>";

      const next = document.createElement("button");
      next.type = "button";
      next.className = "music-scroll-btn music-scroll-btn--next";
      next.innerHTML = "<span>›</span>";

      controls.appendChild(prev);
      controls.appendChild(next);

      list.insertAdjacentElement("afterend", controls);

      const scrollByAmount = () => Math.round(list.clientWidth * 0.8);

      function updateDisabled() {
        const maxScroll = list.scrollWidth - list.clientWidth;
        prev.disabled = list.scrollLeft <= 2;
        next.disabled = list.scrollLeft >= maxScroll - 2;
      }

      prev.addEventListener("click", () => {
        list.scrollBy({ left: -scrollByAmount(), behavior: "smooth" });
      });

      next.addEventListener("click", () => {
        list.scrollBy({ left: scrollByAmount(), behavior: "smooth" });
      });

      list.addEventListener("scroll", updateDisabled, { passive: true });
      updateDisabled();
    }

    buildControls();
    window.addEventListener("resize", buildControls);
  }

  // ---------- News: "day and date" ----------

function formatNewsDates() {
  const times = document.querySelectorAll("#news time.news-date[datetime]");
  if (!times.length) return;

  const fmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Amsterdam", // 🔒 locked to Amsterdam
  });

  times.forEach((t) => {
    const iso = t.getAttribute("datetime");
    if (!iso) return;

    // Parse safely as date-only
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));

    const parts = fmt.formatToParts(date);
    const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const mon = parts.find((p) => p.type === "month")?.value ?? "";

    t.textContent = `${wd.toUpperCase()} ${day} ${mon.toUpperCase()}`;
  });
}
  
  // ---------- News: "Load more" ----------
  function setupNewsLoadMore() {
    const news = document.querySelector("#news");
    if (!news) return;

    const container = news.querySelector(".container");
    const list = news.querySelector(".news-list");
    const items = list ? Array.from(list.querySelectorAll(".news-item")) : [];
    const button = document.querySelector("#newsLoadMore");
    const actions = news.querySelector(".news-actions");

    if (container && items.length === 1) container.classList.add("has-single-news");

    if (!items.length || !button || !actions) return;

    const PAGE_SIZE = 3;

    if (items.length <= PAGE_SIZE) {
      actions.style.display = "none";
      return;
    }

    items.forEach((item, idx) => {
      item.style.display = idx < PAGE_SIZE ? "" : "none";
    });

    let shown = PAGE_SIZE;

    button.addEventListener("click", () => {
      const nextShown = Math.min(shown + PAGE_SIZE, items.length);
      for (let i = shown; i < nextShown; i++) items[i].style.display = "";
      shown = nextShown;

      if (shown >= items.length) actions.style.display = "none";
    });
  }

  // ---------- Contact form: validate + mailto ----------
  function setupContactForm() {
    const form = document.querySelector("#contactForm");
    if (!form) return;

    const nameEl = form.querySelector('input[name="name"]');
    const emailEl = form.querySelector('input[name="email"]');
    const msgEl = form.querySelector('textarea[name="message"]');

    let errorEl = form.querySelector(".form-error");
    if (!errorEl) {
      errorEl = document.createElement("p");
      errorEl.className = "form-error is-hidden";
      errorEl.setAttribute("role", "alert");
      form.appendChild(errorEl);
    }

    form.setAttribute("novalidate", "novalidate");

    function showError(message) {
      errorEl.textContent = message;
      errorEl.classList.remove("is-hidden");
    }

    function clearError() {
      errorEl.textContent = "";
      errorEl.classList.add("is-hidden");
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    [nameEl, emailEl, msgEl].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", clearError);
    });

    form.addEventListener("submit", (e) => {
      if (!nameEl || !emailEl || !msgEl) return;

      e.preventDefault();
      clearError();

      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const message = msgEl.value.trim();

      if (!name) return showError("Please enter your name.");
      if (!email) return showError("Please enter your email.");
      if (!isValidEmail(email)) return showError("Please enter a valid email.");
      if (!message) return showError("Please enter a message.");

      const to = "zippora__@live.nl";
      const subject = encodeURIComponent(`Website message from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }

// ---------- Clear nav dot at end of page (Contact area) ----------
function clearNavAtPageEnd() {
  const atPageEnd =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;

  if (atPageEnd) {
    setActiveNavById("contact"); // clears dot for contact
  }
}

  // ---------- Init ----------
  function init() {
    setHeaderOffsetVar();
    setHeaderScrolledClass();
    clearNavAtPageEnd();

    window.addEventListener("scroll", setHeaderScrolledClass, { passive: true });
    window.addEventListener("resize", setHeaderOffsetVar);
    window.addEventListener("scroll", clearNavAtPageEnd, { passive: true });

    setupSmoothScroll();
    setupScrollSpy();
    setupMusicScrollControls();
    setupNewsLoadMore();
    setupContactForm();
    formatNewsDates();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
