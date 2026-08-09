/* =====================================================================
   loader.js — pulls page fragments from this repo into Softr blocks.

   Each Softr custom-code block holds one stub and nothing else:

       <div data-findas-include="portfolio/block-1"></div>

   This script fetches pages/<name>.html and injects it. Paste the stub
   once per block; from then on the content is edited here and goes live
   on push (GitHub Pages, ~10 min cache).

   IMPORTANT — inline <script> inside a fragment will NOT execute.
   innerHTML-inserted scripts are flagged "already started" by the HTML
   parser and never run. This is deliberate and not worked around: page
   behaviour belongs in site.js, which loads normally and binds through
   delegated listeners so it does not care when a fragment arrives.
   <script type="application/ld+json"> is unaffected — it is data, not
   code, and lands in the DOM where crawlers read it.
   ===================================================================== */
(function () {
  "use strict";

  var BASE = "https://hpiyankov.github.io/findas-web/pages/";
  var ATTR = "data-findas-include";
  var DONE = "data-findas-loaded";
  var queued = false;

  function load(el) {
    var name = el.getAttribute(ATTR);
    // Claim the element before the fetch resolves, so a re-scan triggered by
    // Softr mounting another block cannot start a second fetch for the same one.
    el.setAttribute(DONE, "pending");
    fetch(BASE + name + ".html", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        return res.text();
      })
      .then(function (html) {
        el.innerHTML = html;
        el.setAttribute(DONE, "");
      })
      .catch(function (err) {
        // Leave the stub claimed rather than retrying: a retry loop against a
        // 404 would hammer the CDN and the block would stay empty regardless.
        el.setAttribute(DONE, "error");
        console.error("[findas] include failed:", name, err);
      });
  }

  function scan() {
    queued = false;
    var stubs = document.querySelectorAll("[" + ATTR + "]:not([" + DONE + "])");
    for (var i = 0; i < stubs.length; i++) load(stubs[i]);
  }

  function scheduleScan() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  // Softr mounts blocks client-side, so stubs can appear after DOMContentLoaded.
  // Coalesced to one scan per frame — the observer fires on our own injections too.
  new MutationObserver(scheduleScan).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
