# findas-web

Public assets for the [FinDaS](https://www.findas.org) website: stylesheet, scripts, and the
HTML fragments that fill the site's custom-code blocks.

Served by GitHub Pages at `https://assets.findas.org/`, behind the Cloudflare that already
fronts findas.org. A push is a deploy.

## Deploying

1. Push. GitHub Pages rebuilds in roughly 45 seconds.
2. **Purge Cloudflare** (Caching → Configuration → Purge Everything), or wait out the
   600-second edge TTL.

Skipping step 2 is the failure that has already happened once: Cloudflare kept serving the
previous `loader.js`, which still pointed at the old origin, and the fragments failed CORS on
a redirect. It presents as a CORS error and is not one.

Two things that make it hard to diagnose, both worth knowing before you start debugging:

- **A cache-busting query string proves nothing.** `?v=123` is a different cache key, so it
  fetches fresh while the real URL keeps serving stale. Always verify the exact URL the page
  requests.
- **A Cloudflare purge does not clear browser caches.** Anyone who loaded a file before the
  Cache Rule existed holds it under the old 4-hour `max-age` until it expires. New visitors are
  unaffected; hard-reload to test.

A Cache Rule scoped to `assets.findas.org` is required, not optional — it restores the origin's
600-second TTL over Cloudflare's legacy 4-hour Browser Cache TTL, and makes the `.html`
fragments cacheable at all (Cloudflare treats HTML as dynamic by default).

## Why this exists

The site runs on Softr, which has no API for pages — page code is pasted by hand in Softr
Studio and there is no way around that. The plan in use also exposes no page-head custom code,
only blocks. So the **first custom-code block on a page** carries a bootstrap:

```html
<script>
(function () {
  var root = 'https://assets.findas.org/';
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = root + 'assets/findas.css';
  css.setAttribute('data-findas', 'css');
  document.head.appendChild(css);
  var js = document.createElement('script');
  js.src = root + 'assets/loader.js';
  document.head.appendChild(js);
})();
</script>
<div data-findas-include="portfolio/block-1"></div>
```

and **every other block on that page** carries the stub line alone:

```html
<div data-findas-include="portfolio/block-2"></div>
```

`loader.js` pulls in `findas.css` and `site.js` itself, then fills each stub from `pages/`.
Adding a font or another script later needs no re-paste. The bootstrap is inline because Softr
is known to execute inline block scripts; `<script src>` in a block is unverified.

## Layout

```
assets/findas.css   stylesheet for every page
assets/loader.js    fetches and injects the fragments
assets/site.js      page behaviour (delegated listeners only)
pages/<page>/       the fragments, one per Softr block
```

## Two rules

**Inline `<script>` in a fragment will not run.** Scripts inserted via `innerHTML` are never
executed by the browser. Page behaviour goes in `assets/site.js`, bound through delegated
listeners so it works whenever a fragment happens to arrive. `<script type="application/ld+json">`
is fine — it is data, and lands in the DOM where crawlers read it.

**Everything here is public the moment it is pushed.** This repo holds only what already ships
to visitors. Nothing internal, nothing client-confidential, no working notes.
