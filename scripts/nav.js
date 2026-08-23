/* ══════════════════════════════════════════════════════════════
   /scripts/nav.js

   Everything the shared navigation does: marking the current page
   in the menu, and opening/closing the mobile drawer.

   This used to be two <script> blocks inside /includes/navbar.html
   and /includes/mobile-nav.html. It lives here so those fragments
   are pure markup, and so a page that is not assembled by the ESI
   worker still loads it.

   Every page loads this with `defer`, so the DOM is parsed before
   it runs. A page must NOT declare its own menuBtn / mobileNav
   handlers — two top-level declarations of the same name throw a
   SyntaxError and take the rest of the page's scripts down.
   ══════════════════════════════════════════════════════════════ */
/* ── Active page highlighting ───────────────────────────────────
   Marks the link for the current page in the desktop navbar and in
   the mobile drawer, and lights up the parent dropdown label. This
   lives here so no page has to hardcode class="active" any more. */
(function () {
  function leaf(path) {
    path = (path || '').split('?')[0].split('#')[0];
    path = path.substring(path.lastIndexOf('/') + 1);
    return (path === '' || path === 'index.htm') ? 'index.html' : path;
  }
  function mark() {
    var here = leaf(window.location.pathname);
    ['mainNav', 'mobileNav'].forEach(function (id) {
      var root = document.getElementById(id);
      if (!root) return;
      Array.prototype.forEach.call(root.querySelectorAll('a[href]'), function (a) {
        var href = a.getAttribute('href') || '';
        if (a.classList.contains('brand-logo-wrap')) return;
        if (/^(https?:|mailto:|tel:|\/\/|#)/i.test(href)) return;
        if (leaf(href) !== here) return;
        a.classList.add('active');
        var item = a.closest ? a.closest('.nav-item') : null;
        if (item) {
          var label = item.querySelector('.nav-link');
          if (label) label.classList.add('active');
        }
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mark);
  } else {
    mark();
  }
})();
/* ── Mobile drawer ──────────────────────────────────────────────
   One copy of the open/close behaviour for the whole site. Pages
   must NOT declare their own menuBtn / mobileNav handlers: two
   top-level `const menuBtn` declarations on the same page throw a
   SyntaxError and take the rest of that page's script down with
   them. Everything is guarded, so this is safe on pages that leave
   out the scrim or a close button. */
(function () {
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;

  var scrim = document.getElementById('mobileNavOverlay');

  function setOpen(open) {
    nav.classList.toggle('open', open);
    if (scrim) scrim.classList.toggle('open', open);
    btn.classList.toggle('active', open);
    document.body.classList.toggle('nav-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function close() { setOpen(false); }

  btn.addEventListener('click', function () {
    setOpen(!nav.classList.contains('open'));
  });

  if (scrim) scrim.addEventListener('click', close);

  ['mobClose', 'menuClose'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', close);
  });

  Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
    a.addEventListener('click', close);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) close();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) close();
  });
})();


/* ── The bar's scrolled state ───────────────────────────────────
   Adds .scrolled to #mainNav past 80px, which is what brings the
   brand logo in on the left and moves the menu to the right.

   Every page also toggles this in its own scroll handler, but that
   handler sits after `gsap.registerPlugin(ScrollTrigger)` — if the
   GSAP CDN is slow or blocked, that whole script throws and the
   navbar stops responding to scroll. Doing it here as well means
   the bar behaves no matter what happens to the page's own script.
   Both set the same class at the same threshold, so running twice
   is harmless. */
(function () {
  var nav = document.getElementById('mainNav');
  if (!nav) return;
  function update() {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();   // correct on load if the browser restored a scroll position
})();


/* ── Collapsible groups in the mobile drawer ────────────────────
   ABOUT / FOR AUTHORS / PROGRAM behave like the desktop dropdowns:
   closed until tapped, and only opened by a tap.

   The open/closed state is applied as an inline max-height rather
   than by a class alone. /css/chrome.css is a separate file that can
   lag a deploy or sit in a browser cache, and if its .mob-group rule
   is missing, a class-only approach leaves every group expanded with
   no way to close it — which is exactly what it looked like. Inline
   styles cannot be missing.

   Same reasoning for the small structural reset on the label: a
   <button> with the browser's default styling is a narrow white box,
   not a full-width menu row. */
(function () {
  var nav = document.getElementById('mobileNav');
  if (!nav) return;

  function resetButton(btn) {
    var st = btn.style;
    st.display = 'flex';
    st.alignItems = 'center';
    st.justifyContent = 'space-between';
    st.width = '100%';
    st.textAlign = 'left';
    st.background = 'none';
    st.border = '0';
    st.borderRadius = '0';
    /* only the family — an inline `font` shorthand would beat the
       font-size in chrome.css and blow the labels up */
    st.fontFamily = 'inherit';
    st.cursor = 'pointer';
    st.appearance = 'none';
    st.webkitAppearance = 'none';
  }

  /* The drawer fragment is cached at the edge for ~10 minutes, so a deploy
     can leave NEW nav.js running against the OLD flat markup — a plain
     <div class="mob-section"> followed by loose .mob-sub links, with no
     button and no group to open. Build the missing structure here so the
     two can never get out of step. */
  function buildMissingGroups() {
    var labels = nav.querySelectorAll('.mob-section:not([aria-controls])');
    Array.prototype.forEach.call(labels, function (label, i) {
      if (label.tagName === 'BUTTON') return;
      var id = 'mobg-auto-' + i;
      var group = document.createElement('div');
      group.className = 'mob-group';
      group.id = id;

      var node = label.nextSibling;
      while (node) {
        var next = node.nextSibling;
        if (node.nodeType === 1) {
          if (!node.classList || !node.classList.contains('mob-sub')) break;
          group.appendChild(node);
        } else if (node.nodeType === 3 && !node.textContent.trim()) {
          if (node.parentNode) node.parentNode.removeChild(node);
        } else {
          break;
        }
        node = next;
      }
      if (!group.children.length) return;

      label.parentNode.insertBefore(group, label.nextSibling);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mob-section';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', id);
      var text = document.createElement('span');
      text.textContent = label.textContent.trim();
      var chev = document.createElement('i');
      chev.className = 'fas fa-chevron-down';
      chev.setAttribute('aria-hidden', 'true');
      btn.appendChild(text);
      btn.appendChild(chev);
      label.parentNode.replaceChild(btn, label);
    });
  }
  buildMissingGroups();

  var buttons = nav.querySelectorAll('.mob-section[aria-controls]');
  if (!buttons.length) return;

  function setOpen(btn, group, open) {
    group.style.overflow = 'hidden';
    group.style.maxHeight = open ? group.scrollHeight + 'px' : '0px';
    group.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    var chev = btn.querySelector('i');
    if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
  }

  Array.prototype.forEach.call(buttons, function (btn) {
    var group = document.getElementById(btn.getAttribute('aria-controls'));
    if (!group) return;
    resetButton(btn);
    group.style.transition = 'max-height 0.3s ease';
    setOpen(btn, group, false);          // everything starts closed
    btn.addEventListener('click', function () {
      setOpen(btn, group, btn.getAttribute('aria-expanded') !== 'true');
    });
  });

  /* Closing the drawer resets the groups, so it always reopens tidy. */
  var closers = [document.getElementById('menuBtn'), document.getElementById('mobClose'),
                 document.getElementById('mobileNavOverlay')];
  closers.forEach(function (el) {
    if (!el) return;
    el.addEventListener('click', function () {
      if (nav.classList.contains('open')) return;   // it is opening, not closing
      Array.prototype.forEach.call(buttons, function (btn) {
        var g = document.getElementById(btn.getAttribute('aria-controls'));
        if (g) setOpen(btn, g, false);
      });
    });
  });
})();


/* ── Top bar on one line ────────────────────────────────────────
   The header fragment carries a short wording for each of the three
   facts (.htb-short), shown below 768px so they fit on one line.

   /includes/ is cached at the edge and can lag a deploy, leaving the
   long strings, which wrap onto a second line. If the short spans are
   not in the markup, shorten the text here instead. Self-disabling:
   the moment the fragment updates, this does nothing. */
(function () {
  var bar = document.querySelector('.header-top-bar');
  if (!bar || bar.querySelector('.htb-short')) return;   // fragment is current

  var span = bar.querySelector('span');
  if (!span) return;

  var SHORT = [
    [/College of Engineering Karunagappally,\s*Kerala,\s*India/i, 'Karunagappally, Kerala'],
    [/(\d{1,2}\s*[\u2013-]\s*\d{1,2})\s+October\s+(\d{4})/i, '$1 Oct $2'],
    [/Hybrid Conference/i, 'Hybrid']
  ];

  var nodes = [];
  Array.prototype.forEach.call(span.childNodes, function (n) {
    if (n.nodeType === 3 && n.textContent.trim()) {
      nodes.push({ node: n, full: n.textContent });
    }
  });
  if (!nodes.length) return;

  function apply(short) {
    nodes.forEach(function (rec) {
      if (!short) { rec.node.textContent = rec.full; return; }
      var t = rec.full;
      SHORT.forEach(function (p) { t = t.replace(p[0], p[1]); });
      rec.node.textContent = t;
    });
    span.style.flexWrap = short ? 'nowrap' : '';
    span.style.whiteSpace = short ? 'nowrap' : '';
  }

  var mq = window.matchMedia('(max-width: 768px)');
  apply(mq.matches);
  if (mq.addEventListener) {
    mq.addEventListener('change', function (e) { apply(e.matches); });
  } else if (mq.addListener) {
    mq.addListener(function (e) { apply(e.matches); });
  }
})();
