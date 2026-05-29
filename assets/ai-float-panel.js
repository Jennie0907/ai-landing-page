/**
 * MEXC AI 快捷对话浮层
 * - 点击底部浮条发送按钮打开
 * - 快速提示词填入输入框
 * - Esc / 遮罩 / 关闭按钮收起
 */
(function initAiFloatPanel() {
  'use strict';

  var PROMPTS = [
    { icon: '📈', text: 'BTC 现在值得投资吗？' },
    { icon: '📉', text: '降息对币价有什么影响？' },
    { icon: '🔥', text: '预测 BTC 接下来的价格走势' },
    { icon: '📰', text: '最近 BTC 有什么新闻？' },
    { icon: '📊', text: '美联储的决策对 BTC 有什么影响？' }
  ];

  var PLACEHOLDERS = [
    'BTC 这段时间在走什么行情？',
    '帮我限价买入 0.001 个 BTC',
    'SOL 有什么交易机会？',
    '如何参与打新？'
  ];

  var panel = null;
  var panelInput = null;
  var floatInput = null;
  var floatForm = null;
  var lastFocus = null;

  function buildPanel() {
    if (document.getElementById('ai-panel')) return;

    var chipsHtml = PROMPTS.map(function (item, i) {
      return (
        '<button type="button" class="ai-panel__chip" data-prompt="' +
        escapeAttr(item.text) +
        '" style="--chip-i:' +
        i +
        '">' +
        '<span class="ai-panel__chip-icon" aria-hidden="true">' +
        item.icon +
        '</span>' +
        '<span>' +
        escapeHtml(item.text) +
        '</span>' +
        '</button>'
      );
    }).join('');

    var html =
      '<div class="ai-panel" id="ai-panel" aria-hidden="true">' +
      '<div class="ai-panel__backdrop" data-ai-panel-close tabindex="-1" aria-hidden="true"></div>' +
      '<div class="ai-panel__dialog" role="dialog" aria-modal="true" aria-labelledby="ai-panel-title">' +
      '<div class="ai-panel__glow" aria-hidden="true"></div>' +
      '<div class="ai-panel__glow-pulse" aria-hidden="true"></div>' +
      '<header class="ai-panel__header">' +
      '<div class="ai-panel__brand">' +
      '<span class="ai-panel__brand-icon" aria-hidden="true">' +
      '<img src="./assets/icons/ai-follow.png" alt="" width="20" height="20" />' +
      '</span>' +
      '<h2 class="ai-panel__title" id="ai-panel-title">MEXC <span class="ai-panel__title-ai">AI</span></h2>' +
      '</div>' +
      '<button type="button" class="ai-panel__close" data-ai-panel-close aria-label="关闭">' +
      '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>' +
      '</button>' +
      '</header>' +
      '<div class="ai-panel__prompts" role="group" aria-label="快速提问">' +
      chipsHtml +
      '</div>' +
      '<div class="ai-panel__footer">' +
      '<form class="ai-panel__form" action="#" method="get">' +
      '<input type="text" class="ai-panel__input" name="q" placeholder="输入你的问题…" aria-label="向 MEXC AI 提问" autocomplete="off" data-ai-panel-input />' +
      '<button type="submit" class="ai-panel__send" aria-label="发送">' +
      '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<path d="M9 15V3M9 3L5 7M9 3l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '</button>' +
      '</form>' +
      '</div>' +
      '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    panel = document.getElementById('ai-panel');
    panelInput = panel.querySelector('[data-ai-panel-input]');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }

  function isOpen() {
    return panel && panel.classList.contains('is-open');
  }

  function syncToPanel() {
    if (!floatInput || !panelInput) return;
    if (floatInput.value.trim()) {
      panelInput.value = floatInput.value;
    }
  }

  function syncToFloat() {
    if (!floatInput || !panelInput) return;
    floatInput.value = panelInput.value;
  }

  function openPanel() {
    if (!panel) return;
    syncToPanel();
    lastFocus = document.activeElement;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ai-panel-open');
    window.requestAnimationFrame(function () {
      if (panelInput) panelInput.focus();
    });
  }

  function closePanel() {
    if (!panel || !isOpen()) return;
    syncToFloat();
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ai-panel-open');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  function bindEvents() {
    buildPanel();

    floatForm = document.querySelector('.ai-float-bar__form');
    floatInput = document.querySelector('[data-ai-float-input]');

    if (floatForm) {
      floatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        openPanel();
      });
    }

    panel.querySelectorAll('[data-ai-panel-close]').forEach(function (el) {
      el.addEventListener('click', closePanel);
    });

    panel.querySelector('.ai-panel__prompts').addEventListener('click', function (e) {
      var chip = e.target.closest('.ai-panel__chip');
      if (!chip || !panelInput) return;
      var text = chip.getAttribute('data-prompt') || chip.textContent.trim();
      panelInput.value = text;
      panelInput.focus();
      syncToFloat();
    });

    var panelForm = panel.querySelector('.ai-panel__form');
    if (panelForm) {
      panelForm.addEventListener('submit', function (e) {
        e.preventDefault();
        syncToFloat();
        if (panelInput) panelInput.focus();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        closePanel();
      }
    });

    initPlaceholderRotate();
  }

  function initPlaceholderRotate() {
    if (!floatInput) return;

    var reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || PLACEHOLDERS.length < 2) return;

    var index = 0;

    setInterval(function () {
      if (isOpen()) return;
      if (document.activeElement === floatInput || floatInput.value.trim()) return;
      index = (index + 1) % PLACEHOLDERS.length;
      floatInput.placeholder = PLACEHOLDERS[index];
    }, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
