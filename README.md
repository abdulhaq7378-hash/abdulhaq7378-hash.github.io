# Mohammed Abdul Haq — Portfolio

Personal portfolio of Mohammed Abdul Haq, B.Tech Biomedical Engineering, Manipal Institute of Technology.

**Live:** https://abdulhaq7378-hash.github.io

## Structure

```
index.html      page markup and content
styles.css      design system, layout, responsive rules
js/app.js       boot sequence, smooth scroll, scroll-driven motion, cursor, lightbox
js/field.js     hero background — iso-contour field, WebGL2 fragment shader
js/sim.js       GuardianBand detection simulation (canvas)
assets/         project screenshots and certificate previews
docs/           original certificates linked from the site
```

Plain HTML, CSS and JavaScript — no build step. Motion uses GSAP + ScrollTrigger and Lenis
(loaded from CDN); without them the page still renders as a complete static document.

Run locally with any static server, for example:

```bash
npx serve .
```

## Updating content

- Text lives directly in `index.html`, one `<section>` per block.
- Add a credential: put the file in `docs/`, a preview image in `assets/`, and copy an existing `<li class="ledger__row">`.
- Colours and type are CSS variables at the top of `styles.css`.

## Deploy

Hosted on GitHub Pages from the `main` branch root. Every push to `main` redeploys.
