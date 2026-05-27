(function initHeroTypewriter() {
  const el = document.getElementById('hero-typewriter');
  if (!el) return;

  const text = el.dataset.text || '即可下单';
  const speed = parseInt(el.dataset.speed || '140', 10);
  const startDelay = parseInt(el.dataset.delay || '600', 10);
  const pauseEnd = parseInt(el.dataset.pauseEnd || '2200', 10);
  const pauseStart = parseInt(el.dataset.pauseStart || '600', 10);
  const deleteSpeed = parseInt(el.dataset.deleteSpeed || '80', 10);

  function showFull() {
    el.textContent = text;
    el.classList.add('is-done');
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showFull();
    return;
  }

  let index = 0;
  let deleting = false;

  function step() {
    el.textContent = text.slice(0, index);

    if (!deleting) {
      if (index < text.length) {
        index += 1;
        window.setTimeout(step, speed);
        return;
      }
      deleting = true;
      window.setTimeout(step, pauseEnd);
      return;
    }

    if (index > 0) {
      index -= 1;
      window.setTimeout(step, deleteSpeed);
      return;
    }

    deleting = false;
    window.setTimeout(step, pauseStart);
  }

  window.setTimeout(step, startDelay);
})();
