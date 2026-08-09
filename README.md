# findas-web

Public assets for the [FinDaS](https://www.findas.org) website: stylesheet, scripts, and the
HTML fragments that fill the site's custom-code blocks.

Served by GitHub Pages at `https://hpiyankov.github.io/findas-web/`. A push is a deploy.

## Why this exists

The site runs on Softr, which has no API for pages — page code is pasted by hand in Softr
Studio and there is no way around that. The plan in use also exposes no page-head custom code,
only blocks. So the **first custom-code block on a page** carries a bootstrap:

```html
<script>
(function(){var s=document.createElement('script');
s.src='https://hpiyankov.github.io/findas-web/assets/loader.js';
document.head.appendChild(s);})();
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
