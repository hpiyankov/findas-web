/* =====================================================================
   site.js — page behaviour, loaded on every page from the global footer.

   Every listener is delegated from `document`, because fragments are
   injected by loader.js at an unpredictable moment and anything bound to
   a specific element at load time would bind to nothing. Delegation also
   means the handlers are inert on pages that have none of these elements,
   which is what makes this safe to load site-wide.
   ===================================================================== */
(function () {
  "use strict";

  // Hard requirement, not defensive habit. Two copies of this file on one
  // page used to make the FAQ accordion impossible to open: both click
  // handlers fire for the same event, the second reads the class state the
  // first just wrote, and inverts it back. Net result — the answer never
  // appears, with no console error and no visual cue. A duplicate load is
  // reachable whenever this file is referenced from more than one place.
  if (window.__findasSite) return;
  window.__findasSite = true;

  // -------- FAQ accordion. One open at a time; clicking the open one closes it.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".faq-acc-q");
    if (!btn) return;

    var item = btn.parentElement;
    var accordion = btn.closest(".faq-accordion");
    if (!accordion) return;

    var wasOpen = item.classList.contains("open");
    var open = accordion.querySelectorAll(".faq-acc-item.open");
    for (var i = 0; i < open.length; i++) open[i].classList.remove("open");
    if (!wasOpen) item.classList.add("open");
  });

  // -------- Logo alt text. Softr renders the nav and footer logos without one.
  function fixLogoAlt() {
    var imgs = document.querySelectorAll("img.softr-nav-logo, footer a img");
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].alt !== "FinDaS Logo") imgs[i].alt = "FinDaS Logo";
    }
  }

  // -------- Cursor-tracking grid highlight. Desktop only; the mask follows
  // the pointer via two custom properties on #bgGridHighlight.
  function bindGridHighlight() {
    var grid = document.getElementById("bgGridHighlight");
    if (!grid || grid.__bound) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;
    grid.__bound = true;

    document.addEventListener("mousemove", function (e) {
      grid.style.setProperty("--mx", e.clientX + "px");
      grid.style.setProperty("--my", e.clientY + "px");
    });
    document.addEventListener("mouseleave", function () {
      grid.style.setProperty("--mx", "-200px");
      grid.style.setProperty("--my", "-200px");
    });
  }

  function init() {
    fixLogoAlt();
    bindGridHighlight();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Softr mounts its chrome client-side, so the logo and the grid element can
  // both appear after DOMContentLoaded. Both functions are idempotent, so
  // re-running them on mutation is free; the flag on the grid element keeps
  // the pointer listeners registered exactly once.
  var queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; init(); }, 0);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
