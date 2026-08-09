# findas-web

Public assets for the [FinDaS](https://www.findas.org) website: stylesheet, scripts, and the
HTML fragments that fill the site's custom-code blocks.

Served by GitHub Pages at `https://hpiyankov.github.io/findas-web/`. A push is a deploy.

## Why this exists

The site runs on Softr, which has no API for pages — page code is pasted by hand in Softr
Studio and there is no way around that. So each block is pasted **once**, as a stub:

```html
<div data-findas-include="portfolio/block-1"></div>
```

`assets/loader.js` finds the stub and injects `pages/portfolio/block-1.html` from this repo.
After that the content is edited here and goes live on push.

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
