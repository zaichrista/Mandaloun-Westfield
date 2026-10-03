/* Mandaloun Redo: small, dependency-free behaviours */

/* ONE place to change the booking link. Every "Book" button reads from here.
   Two different Dojo links were found on the old site; this is the header one. */
var BOOKING_URL = "https://restaurant-1790935816.resos.com/booking";

(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* booking links */
  $$("[data-book]").forEach(function (a) { a.href = BOOKING_URL; a.target = "_blank"; a.rel = "noopener"; });


  /* slow, eased scrolling for in-page links and programmatic jumps */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var glide = function (top, ms) {
    var from = window.scrollY, dist = top - from, t0 = null;
    if (reduceMotion || Math.abs(dist) < 2) { window.scrollTo(0, top); return; }
    ms = ms || Math.min(1800, Math.max(900, Math.abs(dist) * 0.9));
    var ease = function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / ms);
      window.scrollTo(0, from + dist * ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  $$('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (!id || a.hasAttribute("data-menu")) return;
    a.addEventListener("click", function (e) {
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      glide(target.getBoundingClientRect().top + window.scrollY - 90);
      history.replaceState(null, "", "#" + id);
    });
  });

  /* gentle reveal as sections arrive */
  if ("IntersectionObserver" in window) {
    var rvSel = ".page-hero .wrap>*,.band-rule,.discover .left,.discover .right,.split .copy,.split .media,.story .box,.tile,.quote,.pkg,.step,.figure,.visit>*,.prose>*,.formbox,.menu-hero,.msec .dishes,.legend,.foot-grid>*";
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); rvIO.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(rvSel).forEach(function (el) {
      if (el.closest(".hero") || el.closest(".site-header")) return;
      var sibs = Array.prototype.slice.call(el.parentNode.children).filter(function (c) { return c.matches(rvSel); });
      el.style.setProperty("--d", Math.min(sibs.indexOf(el), 4) * 0.14 + "s");
      el.classList.add("rv");
      rvIO.observe(el);
    });
  }

  /* page transitions: gentle fade out before leaving */
  window.addEventListener("pageshow", function () { document.documentElement.classList.remove("leaving"); });
  $$("a[href]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var h = a.getAttribute("href");
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === "_blank") return;
      if (!h || h.charAt(0) === "#" || /^(mailto:|tel:|https?:|\/\/)/i.test(h) || a.hasAttribute("download")) return;
      if (a.pathname === location.pathname && a.hash) return;
      e.preventDefault();
      document.documentElement.classList.add("leaving");
      setTimeout(function () { location.href = a.href; }, reduceMotion ? 0 : 450);
    });
  });
  /* header scroll state */
  var heroEl = $(".hero");
  var onScroll = function () {
    document.body.classList.toggle("scrolled", window.scrollY > 40);
    document.body.classList.toggle("past-hero", !heroEl || window.scrollY > heroEl.offsetHeight - 90);
  };
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* mobile panel */
  var panel = $("#mpanel"), burger = $(".burger");
  if (panel && burger) {
    var setP = function (on) { panel.classList.toggle("open", on); document.body.classList.toggle("menu-open", on); burger.setAttribute("aria-expanded", on ? "true" : "false"); burger.setAttribute("aria-label", on ? "Close menu" : "Open menu"); document.body.style.overflow = on ? "hidden" : ""; };
    var closeP = function () { setP(false); };
    burger.addEventListener("click", function () { setP(!panel.classList.contains("open")); });
    $(".close", panel).addEventListener("click", closeP);
    $$("a", panel).forEach(function (a) { a.addEventListener("click", closeP); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeP(); });
  }

  /* open now / today's hours (London time) */
  var pills = $$("[data-open]");
  if (pills.length) {
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "numeric", minute: "numeric", hour12: false, day: "numeric", month: "numeric" })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) { parts = null; }
    if (parts) {
      var sun = parts.weekday === "Sun";
      var xmas = parts.day === "25" && parts.month === "12";
      var h = parseInt(parts.hour, 10) % 24, m = parseInt(parts.minute, 10);
      var mins = h * 60 + m;
      var closeMins = sun ? 23 * 60 : 24 * 60;
      var open = !xmas && mins >= 11 * 60 && mins < closeMins;
      var todayTxt = xmas ? "Closed today" : (sun ? "Today 11am to 11pm" : "Today 11am to midnight");
      pills.forEach(function (el) {
        el.textContent = "";
        var i = document.createElement("i"); el.appendChild(i);
        el.appendChild(document.createTextNode(open ? "Open now. " + todayTxt : todayTxt));
        if (!open) el.classList.add("closed");
      });
    }
  }

  /* reserve bar tabs */
  $$(".reserve").forEach(function (box) {
    var tabs = $$(".tab", box), panels = $$(".panel", box);
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x, j) { x.setAttribute("aria-selected", j === i ? "true" : "false"); });
        panels.forEach(function (p, j) { p.classList.toggle("on", j === i); });
      });
    });
  });

  /* menu slider on home */
  var slider = $("[data-slider]");
  if (slider) {
    var slides = $$(".slide", slider), idx = 0;
    var show = function (n) { idx = (n + slides.length) % slides.length; slides.forEach(function (s, i) { s.classList.toggle("on", i === idx); }); };
    show(0);
    $$("[data-prev]").forEach(function (b) { b.addEventListener("click", function () { show(idx - 1); }); });
    $$("[data-next]").forEach(function (b) { b.addEventListener("click", function () { show(idx + 1); }); });
  }

  /* menus page: show one menu at a time, deep-linkable by hash */
  var tabsWrap = $("[data-menutabs]");
  if (tabsWrap) {
    var links = $$("a[data-menu]", tabsWrap), panes = $$(".mpanel-menu");
    var activate = function (id, push) {
      var found = false;
      panes.forEach(function (p) { var on = p.id === "menu-" + id; p.classList.toggle("on", on); if (on) found = true; });
      if (!found) { id = links[0].getAttribute("data-menu"); panes.forEach(function (p) { p.classList.toggle("on", p.id === "menu-" + id); }); }
      links.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("data-menu") === id ? "true" : "false"); });
      if (push) { history.replaceState(null, "", "#" + id); var t = $(".menus-wrap"); if (t && window.innerWidth < 1100) glide(t.offsetTop - 70); }
    };
    links.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); activate(a.getAttribute("data-menu"), true); }); });
    activate((location.hash || "").replace("#", "") || links[0].getAttribute("data-menu"), false);
    window.addEventListener("hashchange", function () { activate((location.hash || "").replace("#", ""), false); });
    document.documentElement.classList.add("js");
  }

  /* gallery lightbox */
  var lb = $("#lb");
  if (lb) {
    var items = $$("[data-lb]"), cur = 0, img = $("img", lb), cap = $(".cap", lb);
    var open = function (i) { cur = (i + items.length) % items.length; var a = items[cur]; img.src = a.getAttribute("href"); img.alt = a.querySelector("img").alt; cap.textContent = a.querySelector("img").alt; lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    var close = function () { lb.classList.remove("open"); document.body.style.overflow = ""; };
    items.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); open(i); }); });
    $(".x", lb).addEventListener("click", close);
    $(".pv", lb).addEventListener("click", function () { open(cur - 1); });
    $(".nx", lb).addEventListener("click", function () { open(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) { if (!lb.classList.contains("open")) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") open(cur - 1); if (e.key === "ArrowRight") open(cur + 1); });
  }

})();
