/**
 * Stats 数字递增动效 — 区块进入视口时从 0 滚到目标值
 */
(function initStatsCounter() {
  'use strict';

  var section = document.querySelector('.stats');
  if (!section) return;

  var values = section.querySelectorAll('.stats__value[data-count]');
  if (!values.length) return;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) return;

  var DURATION = 1800;
  var STAGGER = 120;
  var started = false;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function format(value, decimals, suffix) {
    if (decimals > 0) {
      return value.toFixed(decimals) + suffix;
    }
    return Math.round(value).toLocaleString('en-US') + suffix;
  }

  function animateEl(el, index) {
    var target = parseFloat(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-count-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-count-decimals'), 10);
    if (isNaN(decimals)) decimals = 0;
    if (!Number.isFinite(target)) return;

    var delay = index * STAGGER;
    el.classList.add('is-counting');
    el.textContent = format(0, decimals, suffix);

    var startAt = null;

    function tick(now) {
      if (startAt === null) startAt = now + delay;
      if (now < startAt) {
        requestAnimationFrame(tick);
        return;
      }

      var t = Math.min((now - startAt) / DURATION, 1);
      var current = target * easeOutCubic(t);
      el.textContent = format(current, decimals, suffix);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = format(target, decimals, suffix);
        el.classList.remove('is-counting');
        el.classList.add('is-counted');
      }
    }

    requestAnimationFrame(tick);
  }

  function start() {
    if (started) return;
    started = true;
    values.forEach(function (el, i) {
      animateEl(el, i);
    });
  }

  var io = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          start();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.25, rootMargin: '0px 0px -5% 0px' }
  );

  io.observe(section);
})();
