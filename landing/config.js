/* =====================================================================
   MR. NOOWAV — LINK-IN-BIO CONFIG
   This is the only file you need to edit to change the page.
   - Leave a URL as "" to hide that item (socials) or show it as
     "Coming soon" (cards).
   - Logos: put the official files in assets/logos/ and set the path.
     If a path is empty or the file is missing, the brand name shows
     as plain text instead.
   ===================================================================== */
window.NOOWAV_CONFIG = {
  // The public address of THIS page. Used for the QR code, copy link and
  // share. Leave "" to use whatever address the page is opened at.
  siteUrl: "",

  profile: {
    name: "Mr. NOOWAV",
    title: "Founder | Peptides & Wellness",
    bio: "Exploring the world of peptides, wellness, and research. Connecting curiosity with education and resources.",
    tagline: "Know your options. Ride the WAV.",
    avatar: "",            // e.g. "assets/logos/profile.jpg"; empty = "N" mark
  },

  /* ---------------------------------------------------------------
     LINKS
     size:  "feature" = big card, "tile" = small half-width card
     theme: "noowav" | "wavrx" | "hq" | "lab" | "default"
     Add new links by copying a block. Order here = order on the page.
     --------------------------------------------------------------- */
  links: [
    {
      id: "noowav",
      size: "feature",
      theme: "noowav",
      name: "NOOWAV SOLUTIONS",
      logo: "assets/logos/noowav-solutions.png",
      logoPlate: true,     // shows the logo on a light panel (logo has black outlines)
      badge: "Research use only",
      tagline: "Research materials. Transparency. Community.",
      description: "Third-party tested, research-use-only laboratory materials with COAs available.",
      notice: "For laboratory research use only. Not for human or veterinary use.",
      button: "Explore NOOWAV",
      url: "https://noowav.com",
    },
    {
      id: "wavrx",
      size: "feature",
      theme: "wavrx",
      name: "WAV RX",
      logo: "assets/logos/wavrx.png",
      badge: "Telehealth",
      tagline: "A new wave of care.",
      description: "Modern telehealth. Built around you. Personalized treatment, when prescribed.",
      notice: "Treatment is only available if prescribed by a licensed provider.",
      button: "Explore WAV RX",
      url: "https://wavrx.whoosh.health",
    },
    {
      id: "hq",
      size: "tile",
      theme: "hq",
      name: "NOOWAV HQ",
      logo: "assets/logos/nooworld.png",
      logoRound: true,
      description: "Your all-access pass to the NOOWAV community. Rewards, updates, orders, and more.",
      button: "Access HQ",
      url: "",             // TODO: paste the HQ app URL here
    },
    {
      id: "calculator",
      size: "tile",
      theme: "lab",
      name: "Peptide Calculator",
      icon: "calculator",
      description: "A simple laboratory research calculation tool.",
      button: "Open Calculator",
      // Unverified guess at the calculator's GitHub Pages address. Confirm it.
      url: "https://noowavla-max.github.io/noowav-calculator/",
    },
  ],

  // Shows a "Research use vs. prescribed" explainer under the brand cards.
  showComparison: true,

  /* Socials: leave "" to hide. Supported: instagram, tiktok, youtube,
     telegram, discord, x, facebook, threads, email */
  socials: {
    instagram: "",
    tiktok: "",
    youtube: "",
    telegram: "",
    discord: "",
    email: "noowavla@gmail.com",
  },

  /* Privacy-conscious analytics (optional).
     Uses GoatCounter: free, no cookies, no personal data.
     1. Sign up at goatcounter.com and pick a code, e.g. "mrnoowav"
     2. Put that code below. Leave "" to turn analytics off.
     Visitors with Do Not Track / Global Privacy Control are never counted. */
  analytics: {
    goatcounter: "",
  },

  // Adds ?utm_source=... to brand links so your own sites can see
  // traffic that came from this page. Set to "" to turn off.
  utmSource: "mrnoowav_links",

  disclaimer:
    "NOOWAV Solutions materials are sold for laboratory research use only and are not intended for human or veterinary use. " +
    "WAV RX telehealth is separate from NOOWAV research materials; any treatment requires evaluation and a prescription from a licensed provider. " +
    "Nothing on this page is medical advice.",
};
