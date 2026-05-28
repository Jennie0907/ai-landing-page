/**
 * 底部固定 AI 快捷聊天框
 * - 占位文案轮播（参考 Gate AI 情境化提示）
 * - 阻止表单默认提交（演示页）
 */
(function () {
  'use strict';

  const PLACEHOLDERS = [
    'BTC 这段时间在走什么行情？',
    '帮我限价买入 0.001 个 BTC',
    'SOL 有什么交易机会？',
    '如何参与打新？'
  ];

  const ROTATE_INTERVAL = 5000;

  function init() {
    const form = document.querySelector('.ai-float-bar__form');
    const input = document.querySelector('[data-ai-float-input]');
    if (!form || !input) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
    });

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || PLACEHOLDERS.length < 2) return;

    let index = 0;

    setInterval(function () {
      if (document.activeElement === input || input.value.trim()) return;
      index = (index + 1) % PLACEHOLDERS.length;
      input.placeholder = PLACEHOLDERS[index];
    }, ROTATE_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
