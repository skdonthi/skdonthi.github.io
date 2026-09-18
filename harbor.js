/* HARBOR v2 - site behaviour. Hand-written, no framework.
   Motion is opt-out via prefers-reduced-motion; the page reads fine without JS. */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var narrow = window.matchMedia("(max-width: 900px)");

  /* ------------------------------------------------------------
     theme: system / light / dark, persisted (shared with posts)
     ------------------------------------------------------------ */
  var THEME_KEY = "skd-theme";
  var media = window.matchMedia("(prefers-color-scheme: light)");
  var themeToggle = doc.getElementById("theme-toggle");
  var themeSeg = doc.querySelectorAll("[data-theme-set]");

  function themePref() {
    try {
      var p = localStorage.getItem(THEME_KEY);
      return p === "light" || p === "dark" ? p : "system";
    } catch (e) { return "system"; }
  }

  function applyTheme() {
    var pref = themePref();
    var resolved = pref === "system" ? (media.matches ? "light" : "dark") : pref;
    root.dataset.theme = resolved;
    var label = pref === "system" ? "AUTO" : pref === "light" ? "DAY" : "NIGHT";
    if (themeToggle) {
      themeToggle.textContent = label;
      themeToggle.setAttribute("aria-label", "Theme: " + label.toLowerCase() + ". Click to switch.");
    }
    themeSeg.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.themeSet === pref));
    });
  }

  function setTheme(next) {
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch (e) { /* storage unavailable */ }
    applyTheme();
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      setTheme({ system: "light", light: "dark", dark: "system" }[themePref()]);
    });
  }
  themeSeg.forEach(function (b) {
    b.addEventListener("click", function () { setTheme(b.dataset.themeSet); });
  });
  media.addEventListener("change", function () { if (themePref() === "system") applyTheme(); });
  applyTheme();

  /* ------------------------------------------------------------
     ship's clock - Hamburg local time (topbar + menu)
     ------------------------------------------------------------ */
  var clocks = doc.querySelectorAll("[data-clock]");
  function tickClock() {
    if (!clocks.length) return;
    var t = new Date().toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour12: false });
    clocks.forEach(function (el) {
      if (el.dataset.clock === "split") {
        el.innerHTML = t.slice(0, 5) + '<span class="sec">' + t.slice(5) + "</span>";
      } else {
        el.textContent = t;
      }
    });
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ------------------------------------------------------------
     smooth scroll (Lenis, optional) + one scroll pump
     ------------------------------------------------------------ */
  var lenis = null;
  if (!reduced && typeof window.Lenis === "function") {
    try {
      lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false });
      root.classList.add("lenis", "lenis-smooth");
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    } catch (e) { lenis = null; }
  }

  var scrollY = window.scrollY;
  var scrollHandlers = [];
  function onScroll(fn) { scrollHandlers.push(fn); }
  function pump() {
    scrollY = lenis ? lenis.scroll : window.scrollY;
    for (var i = 0; i < scrollHandlers.length; i++) scrollHandlers[i](scrollY);
  }
  if (lenis) lenis.on("scroll", pump);
  else window.addEventListener("scroll", pump, { passive: true });
  window.addEventListener("resize", function () { measureAll(); pump(); });

  function scrollTo(target, opts) {
    if (lenis) lenis.scrollTo(target, opts || {});
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  /* in-page anchors go through the smoother */
  doc.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var el = id ? doc.getElementById(id) : doc.body;
    if (!el) return;
    e.preventDefault();
    closeMenu();
    var barH = parseInt(getComputedStyle(root).getPropertyValue("--bar-h")) || 76;
    scrollTo(id ? el.getBoundingClientRect().top + scrollY - barH + 1 : 0);
    if (history.pushState) history.pushState(null, "", id ? "#" + id : location.pathname);
  });

  /* ------------------------------------------------------------
     top bar
     ------------------------------------------------------------ */
  var topbar = doc.getElementById("topbar");
  onScroll(function (y) { if (topbar) topbar.classList.toggle("scrolled", y > 24); });

  /* ------------------------------------------------------------
     menu overlay
     ------------------------------------------------------------ */
  var menu = doc.getElementById("menu");
  var menuBtn = doc.getElementById("menu-btn");
  var menuOpen = false;

  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    menu.classList.add("open");
    menu.removeAttribute("inert");
    menu.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.querySelector(".menu-text").textContent = "CLOSE";
    if (lenis) lenis.stop(); else doc.body.style.overflow = "hidden";
    var first = menu.querySelector("a, button");
    setTimeout(function () { if (first) first.focus({ preventScroll: true }); }, 350);
  }

  function closeMenu() {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove("open");
    menu.setAttribute("inert", "");
    menu.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.querySelector(".menu-text").textContent = "MENU";
    if (lenis) lenis.start(); else doc.body.style.overflow = "";
    menuBtn.focus({ preventScroll: true });
  }

  if (menu && menuBtn) {
    menu.setAttribute("inert", "");
    menuBtn.addEventListener("click", function () { menuOpen ? closeMenu() : openMenu(); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) closeMenu(); });
  }

  /* ------------------------------------------------------------
     marquee: duplicate tracks so the loop is seamless
     ------------------------------------------------------------ */
  doc.querySelectorAll(".manifest-track").forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ------------------------------------------------------------
     hero: pinned verb sequence
     ------------------------------------------------------------ */
  var hero = doc.getElementById("hero");
  var verbs = doc.querySelectorAll(".verb");
  var railItems = doc.querySelectorAll(".rail-list li");
  var railFill = doc.querySelector(".rail-fill");
  var caps = doc.querySelectorAll(".verb-cap");
  var heroTop = 0, heroRange = 1, heroIdx = -1;

  function measureHero() {
    if (!hero) return;
    var r = hero.getBoundingClientRect();
    heroTop = r.top + scrollY;
    heroRange = Math.max(1, hero.offsetHeight - window.innerHeight);
  }

  function setVerb(i) {
    if (i === heroIdx) return;
    heroIdx = i;
    verbs.forEach(function (v, k) {
      v.dataset.state = k < i ? "past" : k > i ? "next" : "active";
    });
    railItems.forEach(function (li, k) { li.classList.toggle("on", k === i); });
    caps.forEach(function (c, k) { c.classList.toggle("on", k === i); });
  }

  if (hero && verbs.length) {
    requestAnimationFrame(function () { hero.classList.add("hero-in"); });
    setTimeout(function () {
      var route = hero.querySelector(".route");
      if (route && !reduced) route.classList.add("dashed");
    }, 2300);

    if (reduced) {
      verbs.forEach(function (v) { v.dataset.state = "active"; });
    } else {
      setVerb(0);
      onScroll(function (y) {
        var p = Math.min(1, Math.max(0, (y - heroTop) / heroRange));
        setVerb(Math.min(verbs.length - 1, Math.floor(p * verbs.length)));
        if (railFill) {
          railFill.style.height = (p * 100).toFixed(1) + "%";
          railFill.style.setProperty("--rail", (p * 100).toFixed(1) + "%");
        }
      });
    }
  }

  /* ------------------------------------------------------------
     word splitting (compass pinned reveal, logbook + about stagger)
     ------------------------------------------------------------ */
  function splitWords(el) {
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var parts = node.textContent.split(/(\s+)/);
        var frag = doc.createDocumentFragment();
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
          var s = doc.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
          out.push(s);
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        if (node.tagName === "BR") return;
        out = out.concat(splitWords(node));
      }
    });
    return out;
  }

  var compass = doc.getElementById("compass");
  var cqWords = [];
  var cqTop = 0, cqRange = 1;
  var cqBar = doc.querySelector(".cq-progress .bar span");

  if (compass) {
    compass.querySelectorAll(".cq-line").forEach(function (line) { cqWords = cqWords.concat(splitWords(line)); });
    if (reduced) {
      cqWords.forEach(function (w) { w.classList.add("on"); });
    } else {
      onScroll(function (y) {
        var p = Math.min(1, Math.max(0, (y - cqTop) / cqRange));
        var n = Math.round(p * 1.15 * cqWords.length);
        cqWords.forEach(function (w, k) { w.classList.toggle("on", k < n); });
        if (cqBar) cqBar.style.width = (p * 100).toFixed(1) + "%";
      });
    }
  }

  function measureCompass() {
    if (!compass) return;
    cqTop = compass.getBoundingClientRect().top + scrollY - window.innerHeight * 0.25;
    cqRange = Math.max(1, compass.offsetHeight - window.innerHeight * 0.75);
  }

  doc.querySelectorAll(".words").forEach(function (el) {
    splitWords(el).forEach(function (w, i) { w.style.setProperty("--i", i); });
  });

  /* ------------------------------------------------------------
     voyage: pinned horizontal scroll with drag
     ------------------------------------------------------------ */
  var voyage = doc.getElementById("log-voyage");
  var track = doc.getElementById("voyage-track");
  var vBar = doc.querySelector(".voyage-progress .bar span");
  var vKnob = doc.querySelector(".voyage-progress .bar i");
  var vCurrent = doc.getElementById("voyage-current");
  var vTop = 0, vRange = 1, vMax = 0;
  var voyageActive = false;

  function measureVoyage() {
    if (!voyage || !track) return;
    voyageActive = !reduced && !narrow.matches;
    if (!voyageActive) {
      voyage.style.height = "";
      track.style.transform = "";
      return;
    }
    track.style.transform = "";
    var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    vMax = Math.max(0, track.scrollWidth - window.innerWidth + pad);
    voyage.style.height = (window.innerHeight + vMax) + "px";
    vTop = voyage.getBoundingClientRect().top + scrollY;
    vRange = Math.max(1, vMax);
  }

  if (voyage && track) {
    var cards = track.querySelectorAll(".wp");
    onScroll(function (y) {
      if (!voyageActive) return;
      var p = Math.min(1, Math.max(0, (y - vTop) / vRange));
      track.style.transform = "translate3d(" + (-p * vMax).toFixed(1) + "px,0,0)";
      if (vBar) vBar.style.width = (p * 100).toFixed(1) + "%";
      if (vKnob) vKnob.style.left = (p * 100).toFixed(1) + "%";
      if (vCurrent && cards.length) {
        var idx = Math.min(cards.length - 1, Math.round(p * (cards.length - 1)));
        var id = cards[idx].dataset.wp;
        if (id && vCurrent.textContent !== id) vCurrent.textContent = id;
      }
    });

    /* drag: horizontal pointer movement becomes vertical scroll while pinned */
    var dragging = false, lastX = 0;
    track.addEventListener("pointerdown", function (e) {
      if (!voyageActive || e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      track.classList.add("dragging");
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      var target = (lenis ? lenis.targetScroll : window.scrollY) - dx * 1.4;
      if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
      else window.scrollTo(0, target);
    });
    function endDrag() { dragging = false; track.classList.remove("dragging"); }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("click", function (e) { if (Math.abs(e.movementX) > 4) e.preventDefault(); });
  }

  /* ------------------------------------------------------------
     reveal on scroll
     ------------------------------------------------------------ */
  var revealTargets = doc.querySelectorAll(
    ".log-title, .about-text, .stats, .principle, .port, .cargo, .stack-group, .drow, .cert, .contact-title, .magnet, .contact-bottom, .lb-quote, .lb-cite, .words"
  );
  revealTargets.forEach(function (el) { if (!el.classList.contains("words")) el.classList.add("reveal"); });
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0, rootMargin: "0px 0px -60px 0px" });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ------------------------------------------------------------
     custom cursor + magnetic buttons (fine pointers only)
     ------------------------------------------------------------ */
  var cursor = doc.getElementById("cursor");
  var cursorLabel = doc.getElementById("cursor-label");
  var mx = -100, my = -100, cx = -100, cy = -100;
  var useCursor = cursor && finePointer && !reduced;

  if (useCursor) {
    root.classList.add("has-cursor");
    window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    doc.addEventListener("pointerleave", function () { mx = -100; my = -100; });

    doc.addEventListener("pointerover", function (e) {
      var t = e.target.closest("[data-cursor], a, button, .voyage-track");
      if (!t) { cursor.className = "cursor"; return; }
      var label = t.dataset.cursor || (t.matches(".voyage-track") ? "DRAG" : "OPEN");
      cursorLabel.textContent = label;
      cursor.className = "cursor is-link" + (t.dataset.cursorFill !== undefined ? " is-fill" : "");
    });
    doc.addEventListener("pointerout", function (e) {
      if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest("[data-cursor], a, button, .voyage-track")) cursor.className = "cursor";
    });

    /* magnetic pull */
    doc.querySelectorAll(".magnet, .menu-btn, .theme-toggle").forEach(function (el) {
      var strength = el.classList.contains("magnet") ? 0.35 : 0.2;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (dx * strength).toFixed(1) + "px," + (dy * strength).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)";
        el.style.transform = "";
        setTimeout(function () { el.style.transition = ""; }, 500);
      });
    });
  }

  /* ------------------------------------------------------------
     dispatch image trail
     ------------------------------------------------------------ */
  var trail = doc.getElementById("trail");
  var trailImg = doc.getElementById("trail-img");
  var tx = 0, ty = 0, tvx = 0, trailOn = false;

  if (trail && finePointer && !reduced) {
    doc.querySelectorAll(".drow[data-img]").forEach(function (row) {
      row.addEventListener("pointerenter", function () {
        if (trailImg.getAttribute("src") !== row.dataset.img) trailImg.src = row.dataset.img;
        trailOn = true;
        trail.classList.add("on");
      });
      row.addEventListener("pointerleave", function () { trailOn = false; trail.classList.remove("on"); });
    });
  }

  /* ------------------------------------------------------------
     frame loop: cursor + trail lerp
     ------------------------------------------------------------ */
  function lerp(a, b, t) { return a + (b - a) * t; }
  if (useCursor || (trail && finePointer && !reduced)) {
    (function frame() {
      if (useCursor) {
        cx = lerp(cx, mx, 0.35);
        cy = lerp(cy, my, 0.35);
        cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0) translate(-50%,-50%)";
      }
      if (trail) {
        var ntx = lerp(tx, mx + 40, 0.12);
        tvx = lerp(tvx, ntx - tx, 0.2);
        tx = ntx;
        ty = lerp(ty, my + 30, 0.12);
        var rot = Math.max(-4, Math.min(4, tvx * 0.25));
        trail.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) rotate(" + rot.toFixed(2) + "deg)";
      }
      requestAnimationFrame(frame);
    })();
  }

  /* ------------------------------------------------------------
     contact: address assembled at runtime, kept out of the HTML
     ------------------------------------------------------------ */
  var addr = ["skdonthi", "outlook.com"].join("@");
  doc.querySelectorAll("[data-mail]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "mailto:" + addr;
    });
  });

  /* ------------------------------------------------------------
     open principle (P-06): visitor-editable, stored locally
     ------------------------------------------------------------ */
  var card = doc.getElementById("open-principle");
  if (card) {
    var view = doc.getElementById("open-principle-view");
    var edit = doc.getElementById("open-principle-edit");
    var titleEl = doc.getElementById("open-principle-title");
    var descEl = doc.getElementById("open-principle-desc");
    var inputTitle = doc.getElementById("open-input-title");
    var inputDesc = doc.getElementById("open-input-desc");
    var KEY = "skd-open-principle";

    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && saved.title) { titleEl.textContent = saved.title; descEl.textContent = saved.desc || ""; }
    } catch (e) { /* ignore bad stored data */ }

    card.addEventListener("click", function (e) {
      if (edit.hidden === false || e.target.closest("button, input, textarea")) return;
      inputTitle.value = titleEl.textContent === "Your principle" ? "" : titleEl.textContent;
      inputDesc.value = descEl.textContent;
      view.hidden = true;
      edit.hidden = false;
      inputTitle.focus();
    });
    doc.getElementById("open-save").addEventListener("click", function (e) {
      e.stopPropagation();
      var t = inputTitle.value.trim(), d = inputDesc.value.trim();
      if (t) {
        titleEl.textContent = t;
        descEl.textContent = d;
        try { localStorage.setItem(KEY, JSON.stringify({ title: t, desc: d })); } catch (err) { /* storage unavailable */ }
      }
      edit.hidden = true;
      view.hidden = false;
    });
    doc.getElementById("open-cancel").addEventListener("click", function (e) {
      e.stopPropagation();
      edit.hidden = true;
      view.hidden = false;
    });
  }

  /* ------------------------------------------------------------
     measure + first paint
     ------------------------------------------------------------ */
  function measureAll() {
    scrollY = lenis ? lenis.scroll : window.scrollY;
    measureHero();
    measureCompass();
    measureVoyage();
  }
  narrow.addEventListener("change", function () { measureAll(); pump(); });
  measureAll();
  pump();
  window.harbor = { scrollTo: scrollTo, measure: measureAll, get lenis() { return lenis; } };
  window.addEventListener("load", function () { measureAll(); pump(); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measureAll(); pump(); });
})();
