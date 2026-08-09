/* =====================================================================
   loader.js — pulls page fragments from this repo into Softr blocks,
   and bootstraps everything else the page needs.

   The FinDaS Softr plan exposes no page-head custom code, only blocks.
   So this file is the single entry point: the first custom-code block on
   a page carries a three-line inline bootstrap that loads this script,
   and this script pulls in the stylesheet and site.js itself. Adding a
   font or another script later therefore needs no re-paste anywhere.

   Per page, block 1 (see README for the exact paste): the bootstrap
   injects the stylesheet AND this script. The stylesheet is in the
   bootstrap rather than left to this file on purpose — measured on the
   live page, it lands at 4ms that way against ~150ms if it waits for
   loader.js to arrive first. This file still injects it if absent, so an
   older bootstrap keeps working; the guards below make both paths safe.

   Every other block: the stub line alone.

   Origin is assets.findas.org: GitHub Pages behind the Cloudflare that
   already fronts findas.org. Same-domain, so the browser reuses the
   connection it has open rather than doing a second DNS + TLS handshake,
   and Cloudflare serves from an edge node near the visitor. Measured
   76ms cold against 187ms direct to GitHub. A Cache Rule scoped to this
   hostname keeps the origin's 10-minute TTL; without it Cloudflare's
   legacy 4-hour Browser Cache TTL overrides it and edits go unseen.

   The origin appears in exactly one place per page — the bootstrap — so
   changing it costs one re-paste per migrated page.

   The bootstrap is INLINE on purpose. Softr is known to execute inline
   scripts in a custom-code block (the pre-migration accordion did); it is
   unverified whether it executes <script src>. Inline is the case with
   evidence behind it.

   IMPORTANT — inline <script> inside a FRAGMENT will NOT execute.
   innerHTML-inserted scripts are flagged "already started" by the HTML
   parser and never run. This is deliberate and not worked around: page
   behaviour belongs in site.js, which loads normally and binds through
   delegated listeners so it does not care when a fragment arrives.
   <script type="application/ld+json"> is unaffected — it is data, not
   code, and lands in the DOM where crawlers read it.
   ===================================================================== */
(function () {
  "use strict";

  // A page can legitimately end up with the bootstrap in more than one block
  // (pasted twice, or a page assembled from parts). Second run does nothing:
  // a duplicate MutationObserver would double the scan work for no gain.
  if (window.__findasLoader) return;
  window.__findasLoader = true;

  var ROOT = "https://assets.findas.org/";
  var BASE = ROOT + "pages/";
  var ATTR = "data-findas-include";
  var DONE = "data-findas-loaded";
  var queued = false;

  // --- bootstrap -------------------------------------------------------
  // Stylesheet first and synchronously requested, so it is in flight before
  // any fragment lands and injected markup is styled on arrival rather than
  // flashing unstyled. Both guards make a second copy of the bootstrap on
  // the same page harmless.
  function need(selector, make) {
    if (document.querySelector(selector)) return;
    document.head.appendChild(make());
  }

  need('link[data-findas="css"]', function () {
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = ROOT + "assets/findas.css";
    l.setAttribute("data-findas", "css");
    return l;
  });

  need('script[data-findas="site"]', function () {
    var s = document.createElement("script");
    s.src = ROOT + "assets/site.js";
    s.setAttribute("data-findas", "site");
    return s;
  });

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

  // setTimeout, NOT requestAnimationFrame. rAF does not fire at all while the
  // document is hidden, so a page opened in a background tab (middle-click,
  // session restore) or rendered by a headless client that reports hidden would
  // load only the block whose stub existed at the first synchronous scan — the
  // rest stay empty until the tab is focused. Measured on the live page: rAF
  // never fired, setTimeout did. Timers are throttled in background tabs but
  // they do run, which is the property this needs.
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

  // Softr mounts blocks client-side, so stubs can appear after DOMContentLoaded.
  // Coalesced to one scan per frame — the observer fires on our own injections too.
  new MutationObserver(scheduleScan).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
