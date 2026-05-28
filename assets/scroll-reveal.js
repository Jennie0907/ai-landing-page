/**
 * Scroll Reveal —— 滚动到视口时的入场动画
 *
 * 用法：在 HTML 元素上加属性
 *   data-reveal              元素自身淡入 + 上移
 *   data-reveal-children     容器的所有直接子元素错落淡入（按 DOM 顺序）
 *   data-reveal-delay="200"  自定义延迟（毫秒）
 *
 * 行为：
 *   - 元素 15% 进入视口时触发，触发后即停止监听（不会反复出现）
 *   - 尊重 prefers-reduced-motion：用户禁用动画时直接显示
 *   - 不支持 IntersectionObserver 的浏览器降级为直接显示
 */
(function () {
  'use strict';

  const REVEAL_SELECTOR = '[data-reveal], [data-reveal-children]';

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealAll() {
    document.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  function init() {
    // 给 data-reveal-children 的直接子元素打上序号变量，用于 CSS 错落延迟
    document.querySelectorAll('[data-reveal-children]').forEach(function (container) {
      const children = container.children;
      for (let i = 0; i < children.length; i++) {
        children[i].style.setProperty('--reveal-i', i);
      }
    });

    // 给 data-reveal 元素读取自定义延迟
    document.querySelectorAll('[data-reveal][data-reveal-delay]').forEach(function (el) {
      const delay = parseInt(el.getAttribute('data-reveal-delay'), 10);
      if (!isNaN(delay)) {
        el.style.setProperty('--reveal-delay', delay + 'ms');
      }
    });

    const io = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    document.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
      io.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
