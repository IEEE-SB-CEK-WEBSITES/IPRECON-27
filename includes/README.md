# /includes — shared fragments

Pieces that appear on every page, kept in one place so a change is made once
instead of 27 times. They are stitched into each page at Cloudflare's edge by
`multi-site-esi-worker` before the browser ever sees the HTML.

## The files

| File | What it is |
|---|---|
| `marquee-content.html` | **The announcement text.** Edit here → changes site-wide. |
| `marquee-content-nav.html` | The same announcements, in the classes the in-navbar ticker uses. |
| `marquee.html` | Desktop strip wrapper — pulls in `marquee-content.html` twice. |
| `marquee-mobile.html` | Mobile strip wrapper — same content, pinned under the nav on scroll. |
| `nav-marquee.html` | In-navbar ticker wrapper — pulls in `marquee-content-nav.html` twice. |
| `footer.html` | Footer: brand blurb, socials, link columns, credit line. |

## Changing the announcements

Edit **`marquee-content.html`** and **`marquee-content-nav.html`**. Both carry the
same words; they exist separately only because the navbar sits on the dark bar
and needs different classes than the light strips. Keep them in step.

The content is included **twice** by each wrapper. That is deliberate — the
track animates to `translateX(-50%)`, so it needs two identical halves to loop
without a visible jump. Do not remove one of the two includes.

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
`marquee.html` is two levels deep. The worker allows three. Do not add another
layer without checking `maxRecursionDepth` in the worker config.

## Checking it works

```bash
# the worker is running on the route
curl -sI https://iprecon.org/ | grep -i x-esi
#   → x-esi-processed: true

# no unprocessed tags survived
curl -s https://iprecon.org/ | grep -c "esi:include"
#   → 0
```

Fragment edits are cached at the edge for 10 minutes (`cacheTime`). If a change
does not show up, wait it out rather than assuming it failed.

Note that `esi:include` tags are **not** processed on `*.pages.dev` — that host
sits in front of the worker, not behind it. Missing marquee and footer there is
expected, not a fault.
