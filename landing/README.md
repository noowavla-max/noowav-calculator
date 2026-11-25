# Mr. NOOWAV — link-in-bio page

A self-contained static page. Everything it needs lives in this `landing/` folder, so it can be deployed on its own. The peptide calculator (`../index.html`) is untouched.

```
landing/
  index.html        page structure + social preview tags
  config.js         ← edit this: profile, links, socials, analytics
  styles.css        design
  app.js            builds the page from config.js
  assets/
    logos/          ← put the official logo files here
    fonts/          self-hosted Inter + Unbounded (no Google requests)
    vendor/qrcode.js  QR generator (MIT, Kazuhiko Arase)
    og-image.png    1200×630 image shown when the link is shared
```

## Editing

Open `config.js`.

- **Change text**: edit `profile` and each item in `links`.
- **Add a link**: copy a block in `links`. Use `size: "feature"` for a big card or `"tile"` for a half-width card, and `theme: "default"` (or `noowav`, `wavrx`, `hq`, `lab`).
- **Coming soon**: leave `url: ""` and the card shows "Coming soon" and can't be tapped (that's how NOOWAV HQ is set until you have its URL).
- **Socials**: paste a URL to show an icon; leave `""` to hide it.

## Logos

Save the official files with these names (PNG with a transparent background is best):

| File | Used on |
|---|---|
| `assets/logos/noowav-solutions.webp` (added) | NOOWAV SOLUTIONS card (banner across the top) |
| `assets/logos/wavrx.webp` (added) | WAV RX card |
| `assets/logos/nooworld.webp` (added) | NOOWAV HQ tile (shown as a circle) |

Until a file is there, the card shows the brand name as plain text (or an icon for tiles).
For a profile photo, add e.g. `assets/logos/profile.jpg` and set `profile.avatar`.

## Hosting

Live at **https://mrnoowav.noowavla.workers.dev** (Cloudflare Workers, free for static assets).

Cloudflare is connected to this repo: every push to `main` that changes `landing/` deploys automatically
(Worker `mrnoowav`, root directory `landing`, settings in `wrangler.jsonc`).
Files listed in `.assetsignore` are never published.

If the address changes (e.g. a custom domain like `links.noowav.com`), update:
1. `config.js` → `siteUrl`
2. `index.html` → the `canonical`, `og:url`, `og:image` and `twitter:image` tags

## Analytics (optional, privacy-conscious)

Uses [GoatCounter](https://www.goatcounter.com): free for personal use, no cookies, no personal data, no consent banner needed.
1. Sign up and choose a code (e.g. `mrnoowav`).
2. Put it in `config.js` → `analytics.goatcounter`.

It counts page views and clicks on each card, social icon and share action (`click-noowav`, `click-wavrx`, `click-social-instagram`, ...). Visitors with Do Not Track or Global Privacy Control turned on are never counted. Brand links also get `utm_source=mrnoowav_links` so your own sites can see this traffic (turn off with `utmSource: ""`).

## Compliance notes built into the page

- NOOWAV Solutions card: "Research use only" badge + "Not for human or veterinary use" notice.
- WAV RX card: "Treatment is only available if prescribed by a licensed provider."
- An expandable "Research use vs. prescribed" explainer and a footer disclaimer.
- No medical claims. Keep new copy in the same spirit.
