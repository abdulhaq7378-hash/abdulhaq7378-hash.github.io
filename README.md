# Mohammed Abdul Haq — Portfolio

Personal portfolio of Mohammed Abdul Haq, B.Tech Biomedical Engineering, Manipal Institute of Technology.

**Live:** https://abdulhaq7378-hash.github.io

## Structure

```
index.html   page markup and content
styles.css   design system and layout
main.js      oscilloscope trace, nav state, scroll reveal
docs/        original certificates linked from the site
```

Plain HTML, CSS and JavaScript — no build step. Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Updating content

- Text lives directly in `index.html`, one `<section>` per block.
- Add a certificate: drop the file into `docs/` and copy an existing `<article class="cred">` block.
- Colours and type are CSS variables at the top of `styles.css`.

## Deploy

Hosted on GitHub Pages from the `main` branch root. Every push to `main` redeploys.
