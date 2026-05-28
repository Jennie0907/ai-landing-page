(function initStrategyTabs() {
  const tablists = document.querySelectorAll('.strategy-preview__tabs');
  if (!tablists.length) return;

  tablists.forEach((list) => {
    const tabs = list.querySelectorAll('.strategy-tab');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      if (!tab.hasAttribute('tabindex')) {
        tab.setAttribute('tabindex', '0');
      }

      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(tab);
        }
      });
    });

    function activate(target) {
      tabs.forEach((t) => {
        const isActive = t === target;
        t.classList.toggle('strategy-tab--active', isActive);
        if (isActive) {
          t.setAttribute('aria-selected', 'true');
        } else {
          t.removeAttribute('aria-selected');
        }
      });
    }
  });
})();
