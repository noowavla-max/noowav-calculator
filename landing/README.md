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
| `assets/logos/wavrx.png` | WAV RX card (white + purple, made for dark backgrounds) |
| `assets/logos/nooworld.webp` (added) | NOOWAV HQ tile (shown as a circle) |

Until a file is there, the card shows the brand name as plain text (or an icon for tiles).
For a profile photo, add e.g. `assets/logos/profile.jpg` and set `profile.avatar`.

## Free hosting

**Option A: GitHub Pages from this repo (quickest).** Repo → Settings → Pages → Deploy from branch → `main` / root.
Calculator: `https://noowavla-max.github.io/noowav-calculator/`, landing: `https://noowavla-max.github.io/noowav-calculator/landing/`.

**Option B: shortest free URL.** Create a repo named `noowavla-max.github.io`, copy the *contents* of `landing/` into it, and enable Pages. The page is then at `https://noowavla-max.github.io/`.

**Option C: your own domain** (e.g. `links.noowav.com`). Works with A or B (add a custom domain in Pages settings + a CNAME record), or drag this folder into Cloudflare Pages / Netlify (both free).

**After deploying**, put the final address in:
1. `config.js` → `siteUrl`
2. `index.html` → the `canonical`, `og:url`, `og:image` and `twitter:image` tags (the image tags must be full `https://` addresses)

Then check the share preview with a tool like opengraph.xyz.

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
