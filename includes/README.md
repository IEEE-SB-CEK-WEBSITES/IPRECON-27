# /includes — shared fragments

Pieces that appear on every page, kept in one place so a change is made once
instead of 26 times. They are stitched into each page at Cloudflare's edge by
`multi-site-esi-worker` before the browser ever sees the HTML.

## The files

| File | What it is |
|---|---|
| `header.html` | The two-row page header: thin top bar (location / dates / contact + register) and the white brand row with the conference and sponsor logos. |
| `navbar.html` | The dark sticky nav: brand logo, desktop menu with dropdowns, in-navbar mobile ticker, hamburger — **plus the script that highlights the current page**. |
| `mobile-nav.html` | The slide-out phone menu, its scrim, and the one copy of the open/close script. |
| `marquee-content.html` | **The announcement text.** Edit here → changes site-wide. |
| `marquee-content-nav.html` | The same announcements, in the classes the in-navbar ticker uses. |
| `marquee.html` | Desktop strip wrapper — pulls in `marquee-content.html` twice. |
| `marquee-mobile.html` | Mobile strip wrapper — same content, pinned under the nav on scroll. |
| `nav-marquee.html` | Stand-alone in-navbar ticker wrapper. `navbar.html` carries this markup inline instead of including it, to keep nesting shallow. |
| `footer.html` | Footer: brand blurb, socials, link columns, credit line. |

## What a page looks like now

```html
<body>
<div id="scroll-bar"></div>

<esi:include src="/includes/header.html" />
<esi:include src="/includes/navbar.html" />
<esi:include src="/includes/marquee-mobile.html" />
<esi:include src="/includes/mobile-nav.html" />

  … the page's own content …

<esi:include src="/includes/marquee.html" />
<esi:include src="/includes/footer.html" />
</body>
```

Every page except `coming_soon.html` (a standalone splash with no chrome)
follows this shape.

## Changing the menu

The menu exists twice — `navbar.html` for desktop, `mobile-nav.html` for the
drawer — because the two renderings need different markup. **Add, rename or
remove an item in both files.** Nothing else on the site has to change.

## Changing the announcements

Edit **`marquee-content.html`** and **`marquee-content-nav.html`**. Both carry
the same words; they exist separately only because the navbar sits on the dark
bar and needs different classes than the light strips. Keep them in step.

The content is included **twice** by each wrapper. That is deliberate — the
track animates to `translateX(-50%)`, so it needs two identical halves to loop
without a visible jump. Do not remove one of the two includes.

## Which page is "current"

Do **not** put `class="active"` on a link in `navbar.html` or
`mobile-nav.html` — a hardcoded one would light up on all 26 pages. The script
at the bottom of `navbar.html` compares each link against the current URL and
adds the class itself, in the desktop nav, the dropdowns and the drawer. Adding
a new page needs nothing beyond the menu entry.

The matching styles live in each page's `<style>` block under
`/* Current page highlight */`. A new page copied from an existing one carries
them along.

## Markup here, styling and behaviour elsewhere

These fragments are **markup only**, like the ones on the 2026 site:

| What | Where |
|---|---|
| The markup | `/includes/*.html` (this folder) |
| How it looks | `/css/chrome.css` |
| What it does | `/scripts/nav.js` |

`nav.js` owns the hamburger, the scrim, the close buttons, Escape, the resize
reset, and the active-link marking. Every page loads both files with one line
each in `<head>`.

**A page must not declare its own `menuBtn` / `mobileNav` handlers.** Two
top-level `const menuBtn` declarations on the same assembled page throw a
`SyntaxError`, and that kills every other script on the page — carousel,
reveals, GSAP, the lot. The old per-page copies were removed when these
fragments were introduced; do not paste them back.

## Rules that are easy to break

**Self-close every tag.** The worker matches `<esi:include … />`. Written as
`<esi:include src="…">` it is silently ignored — no error, no fragment, and the
raw tag sits invisibly in the page. This is the most common mistake.

**Paths must start with `/`.** These files are injected into pages at every URL
depth. `assets/img/logo.png` resolves relative to wherever the visitor happens
to be, so paths stack into ever-deeper nonsense and crawlers walk them forever.
Always `/assets/img/logo.png`.

**`src` must start with an allowed include path.** The worker only accepts
`/includes/`, `/_includes/` and `/components/`. Anything else is rejected, so a
stray tag cannot be used to pull in arbitrary URLs.

## Nesting

`marquee.html` includes `marquee-content.html`, so a page that includes
`marquee.html` is two levels deep. `navbar.html` includes
`marquee-content-nav.html` directly — also two levels — which is why it inlines
the ticker wrapper instead of including `nav-marquee.html`. The worker allows
three. Do not add another layer without checking `maxRecursionDepth` in the
worker config.

## Checking it works

```bash
# the worker is running on the route
curl -sI https://iprecon.org/ | grep -i x-esi
#   → x-esi-processed: true

# no unprocessed tags survived
curl -s https://iprecon.org/ | grep -c "esi:include"
#   → 0

# the chrome actually arrived
curl -s https://iprecon.org/cfp.html | grep -c 'id="mainNav"'
#   → 1
```

Fragment edits are cached at the edge for 10 minutes (`cacheTime`). If a change
does not show up, wait it out rather than assuming it failed.

Note that `esi:include` tags are **not** processed on `*.pages.dev` — that host
sits in front of the worker, not behind it. Missing nav, marquee and footer
there is expected, not a fault. Opening a page straight off disk shows the same
thing: the fragments only appear once the worker has assembled the page.
