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
