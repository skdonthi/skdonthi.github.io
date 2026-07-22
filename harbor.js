/* HARBOR - homepage behaviour */
(function () {
  "use strict";

  /* ship's clock - Hamburg local time */
  var clockEl = document.getElementById("clock");
  function tickClock() {
    if (!clockEl) return;
    clockEl.textContent = new Date().toLocaleTimeString("de-DE", {
      timeZone: "Europe/Berlin",
      hour12: false,
    });
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* top bar background on scroll */
  var topbar = document.getElementById("topbar");
  function onScroll() {
    topbar.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* mobile nav */
  var burger = document.getElementById("nav-burger");
  var nav = document.getElementById("topnav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* duplicate marquee track so the loop is seamless */
  var track = document.querySelector(".manifest-track");
  if (track) track.innerHTML += track.innerHTML;

  /* reveal sections on scroll */
  var revealTargets = document.querySelectorAll(
    ".log-title, .about-grid, .principle, .waypoint, .stack-group, .dispatch, .cert, .contact-mail"
  );
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* contact button - address assembled at runtime, kept out of the HTML source */
  var mail = document.getElementById("contact-mail");
  if (mail) {
    var addr = ["skdonthi", "outlook.com"].join("@");
    mail.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "mailto:" + addr;
    });
  }

  /* open principle (P-06): visitor-editable, stored locally */
  var card = document.getElementById("open-principle");
  if (!card) return;
  var view = document.getElementById("open-principle-view");
  var edit = document.getElementById("open-principle-edit");
  var titleEl = document.getElementById("open-principle-title");
  var descEl = document.getElementById("open-principle-desc");
  var inputTitle = document.getElementById("open-input-title");
  var inputDesc = document.getElementById("open-input-desc");
  var KEY = "skd-open-principle";

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.title) {
      titleEl.textContent = saved.title;
      descEl.textContent = saved.desc || "";
    }
  } catch (e) {
    /* ignore bad stored data */
  }

  card.addEventListener("click", function (e) {
    if (edit.hidden === false || e.target.closest("button, input, textarea")) return;
    inputTitle.value = titleEl.textContent === "Your principle" ? "" : titleEl.textContent;
    inputDesc.value = descEl.textContent;
    view.hidden = true;
    edit.hidden = false;
    inputTitle.focus();
  });

  document.getElementById("open-save").addEventListener("click", function (e) {
    e.stopPropagation();
    var t = inputTitle.value.trim();
    var d = inputDesc.value.trim();
    if (t) {
      titleEl.textContent = t;
      descEl.textContent = d;
      try {
        localStorage.setItem(KEY, JSON.stringify({ title: t, desc: d }));
      } catch (err) {
        /* storage unavailable */
      }
    }
    edit.hidden = true;
    view.hidden = false;
  });

  document.getElementById("open-cancel").addEventListener("click", function (e) {
    e.stopPropagation();
    edit.hidden = true;
    view.hidden = false;
  });
})();
