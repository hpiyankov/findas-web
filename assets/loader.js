/* =====================================================================
   loader.js — fills [data-findas-include] stubs with HTML fragments from
   this repo. Nothing else.

   It deliberately does NOT inject the stylesheet or site.js. It used to,
   and that made it unsafe to run site-wide: on any page without a stub it
   would still append findas.css, whose `html { font-size: 12px }` under
   768px would shrink every rem-sized element on a page that never asked
   for it. Injecting site.js had a worse failure — see site.js's guard.

   Deployment:
     Global footer (once, whole site): loads this file and site.js.
     Each migrated page's first block:  the stylesheet <link> + a stub.
     Every other block on that page:    the stub line alone.

       <link rel="stylesheet" href="https://assets.findas.org/assets/findas.css">
       <div data-findas-include="portfolio/block-1"></div>

   The <link> stays in the page rather than being injected here so it is
   requested in parallel with everything else: measured 4ms that way
   against ~150ms when it waited on this file to arrive first.

   IMPORTANT — an inline <script> inside a FRAGMENT will not execute.
   innerHTML-inserted scripts are flagged "already started" by the HTML
   parser and never run. Page behaviour belongs in site.js, bound through
   delegated listeners so it does not care when a fragment arrives.
   <script type="application/ld+json"> is unaffected — it is data, not
   code, and lands in the DOM where crawlers read it.
   ===================================================================== */
(function () {
  "use strict";

  // A page can end up with this file loaded twice (footer plus a leftover
  // per-page bootstrap). Second run does nothing; a duplicate
  // MutationObserver would double the scan work for no gain.
  if (window.__findasLoader) return;
  window.__findasLoader = true;

  var ROOT = "https://assets.findas.org/";
  var BASE = ROOT + "pages/";
  var ATTR = "data-findas-include";
  var DONE = "data-findas-loaded";
  var ATTEMPTS = 3;      // total tries per fragment
  var TIMEOUT_MS = 8000; // a hung request is as fatal as a failed one
  var queued = false;

  // site.js, but never the stylesheet. The stylesheet carries rules with
  // whole-document effect and must only reach pages that opted in; site.js is
  // delegated listeners that are inert wherever their selectors do not match,
  // so loading it is safe anywhere. Matching on the src rather than a marker
  // attribute means a copy loaded from the global footer is also detected.
  // A duplicate would be harmless regardless — site.js guards its own body —
  // this only avoids a pointless second request.
  if (!document.querySelector('script[src$="/assets/site.js"]')) {
    var sj = document.createElement("script");
    sj.src = ROOT + "assets/site.js";
    document.head.appendChild(sj);
  }

  function fetchFragment(url) {
    // No `cache: "no-cache"`. Freshness is handled by the 600s TTL these
    // files carry plus an explicit purge on deploy; forcing revalidation
    // here put a network round trip in front of the LCP element on every
    // single page view, including repeat views inside the TTL.
    if (typeof AbortController !== "function") return fetch(url);
    var ac = new AbortController();
    var timer = setTimeout(function () { ac.abort(); }, TIMEOUT_MS);
    return fetch(url, { signal: ac.signal }).then(
      function (res) { clearTimeout(timer); return res; },
      function (err) { clearTimeout(timer); throw err; }
    );
  }

  function load(el, attempt) {
    var name = el.getAttribute(ATTR);
    if (!name) { el.setAttribute(DONE, "error"); return; }

    // Claim the element before the fetch resolves, so a rescan triggered by
    // Softr mounting another block cannot start a second fetch for this one.
    el.setAttribute(DONE, "pending");

    fetchFragment(BASE + name + ".html")
      .then(function (res) {
        if (!res.ok) {
          var err = new Error(res.status + " " + res.statusText);
          // 404 means the fragment does not exist: retrying only hammers the
          // CDN. Anything else — network drop, 5xx, the ~45s window after a
          // push while Pages rebuilds — is worth another go.
          err.permanent = res.status === 404;
          throw err;
        }
        return res.text();
      })
      .then(function (html) {
        el.innerHTML = html;
        el.setAttribute(DONE, "");
      })
      .catch(function (err) {
        if (!err.permanent && attempt < ATTEMPTS) {
          // "retrying" still matches [DONE], so a concurrent rescan skips this
          // element and the timer below is the only thing that revives it.
          el.setAttribute(DONE, "retrying");
          setTimeout(function () { load(el, attempt + 1); }, 400 * attempt * attempt);
          return;
        }
        el.setAttribute(DONE, "error");
        console.error("[findas] include failed after " + attempt + " attempt(s):", name, err);
      });
  }

  function scan() {
    queued = false;
    var stubs = document.querySelectorAll("[" + ATTR + "]:not([" + DONE + "])");
    for (var i = 0; i < stubs.length; i++) load(stubs[i], 1);
  }

  // setTimeout, NOT requestAnimationFrame. rAF does not fire at all while the
  // document is hidden, so a page opened in a background tab, restored from a
  // session, or rendered by a headless client reporting hidden would load only
  // the block whose stub existed at the first synchronous scan. Measured on the
  // live page: rAF never fired, setTimeout did. Timers are throttled in
  // background tabs but they run, which is the property this needs.
  function scheduleScan() {
    if (queued) return;
    queued = true;
    setTimeout(scan, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  // Softr mounts blocks client-side, so stubs appear after DOMContentLoaded.
  // Coalesced to one scan per task — the observer fires on our own writes too.
  new MutationObserver(scheduleScan).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
