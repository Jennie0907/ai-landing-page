/**
 * Hero AI 演示动效流
 *
 * 时间线（单循环 ~13.4s）：
 *   0.30s  用户气泡淡入，开始打字
 *   2.30s  打字完成，光标停止闪烁
 *   2.80s  "MEXC AI正在思考中"（图标 + 文字）淡入
 *   5.80s  文案替换为 "已为你生成订单"（思考约 3s）
 *   6.40s  订单确认弹窗淡入上移
 *  13.40s  下一轮
 *
 * 触发：IntersectionObserver 监听 .hero__demo
 *   - 进入视口 ≥ 25% 时启动循环
 *   - 离开视口暂停（防后台耗 CPU）
 *   - 用户启用 prefers-reduced-motion 时直接显示最终状态，不做动画
 */
(function () {
  'use strict';

  const TYPING_CHAR_DELAY = 55;     // ms 每个字符
  const CURSOR_FADE_DELAY = 500;    // ms 打字结束后多久移除光标
  const CYCLE_DURATION = 13400;     // ms 总循环

  const THINKING_TEXT = 'MEXC AI正在思考中';
  const ORDER_DONE_TEXT = '已为你生成订单';
  const THINKING_DURATION = 3000;   // ms 思考态停留时长

  const TIMINGS = {
    userIn: 300,
    thinkingIn: 2800,
    thinkingDone: 2800 + THINKING_DURATION,
    modalIn: 2800 + THINKING_DURATION + 600
  };

  function showStep(el) {
    if (!el) return;
    el.classList.remove('is-leaving');
    void el.offsetWidth;
    el.classList.add('is-visible');
  }

  function hideStepInstant(el) {
    if (!el) return;
    el.classList.remove('is-visible', 'is-leaving', 'is-typing');
  }

  function leaveStep(el) {
    if (!el) return;
    el.classList.remove('is-visible');
    el.classList.add('is-leaving');
  }

  function setThinkingText(thinkingEl, text) {
    if (!thinkingEl) return;
    const textEl = thinkingEl.querySelector('.demo__thinking-text');
    if (textEl) textEl.textContent = text;
    thinkingEl.classList.toggle('is-done', text === ORDER_DONE_TEXT);
  }

  function typeText(textEl, fullText, charDelay, onDone) {
    let i = 0;
    textEl.textContent = '';
    function tick() {
      if (i >= fullText.length) {
        if (onDone) onDone();
        return;
      }
      textEl.textContent = fullText.slice(0, ++i);
      textEl._typingTimer = setTimeout(tick, charDelay);
    }
    tick();
  }

  function cancelTyping(textEl) {
    if (textEl && textEl._typingTimer) {
      clearTimeout(textEl._typingTimer);
      textEl._typingTimer = null;
    }
  }

  function startFlow(root) {
    if (root._demoFlowRunning) return;
    root._demoFlowRunning = true;

    const userMsg = root.querySelector('[data-demo-step="user"]');
    const thinking = root.querySelector('[data-demo-step="thinking"]');
    const modal = root.querySelector('[data-demo-step="modal"]');

    const userText = userMsg ? userMsg.querySelector('.demo__msg-text') : null;
    const userPhrase = userMsg ? userMsg.getAttribute('data-demo-text') || '' : '';

    function reset() {
      cancelTyping(userText);
      [userMsg, thinking, modal].forEach(hideStepInstant);
      if (userText) userText.textContent = '';
      setThinkingText(thinking, THINKING_TEXT);
    }

    function runCycle() {
      reset();
      const timers = [];

      // 1. 用户气泡淡入并开始打字
      timers.push(setTimeout(() => {
        if (!userMsg) return;
        userMsg.classList.add('is-typing');
        showStep(userMsg);
        typeText(userText, userPhrase, TYPING_CHAR_DELAY, () => {
          // 打字完成 → 短暂停留后移除光标
          timers.push(setTimeout(() => {
            userMsg.classList.remove('is-typing');
          }, CURSOR_FADE_DELAY));
        });
      }, TIMINGS.userIn));

      // 2. "MEXC AI正在思考中" 淡入
      timers.push(setTimeout(() => showStep(thinking), TIMINGS.thinkingIn));

      // 3. 思考完成，文案替换为 "已为你生成订单"
      timers.push(setTimeout(() => {
        setThinkingText(thinking, ORDER_DONE_TEXT);
      }, TIMINGS.thinkingDone));

      // 4. 订单弹窗淡入上移
      timers.push(setTimeout(() => showStep(modal), TIMINGS.modalIn));

      root._demoFlowTimers = timers;
    }

    runCycle();
    root._demoFlowInterval = setInterval(runCycle, CYCLE_DURATION);
  }

  function stopFlow(root) {
    if (root._demoFlowInterval) {
      clearInterval(root._demoFlowInterval);
      root._demoFlowInterval = null;
    }
    if (root._demoFlowTimers) {
      root._demoFlowTimers.forEach((t) => clearTimeout(t));
      root._demoFlowTimers = null;
    }
    const userText = root.querySelector('.demo__msg-text');
    cancelTyping(userText);
    root._demoFlowRunning = false;
  }

  function showFinalStateNoAnim(root) {
    root.querySelectorAll('[data-demo-step]').forEach((el) => {
      el.classList.add('is-visible');
      el.classList.remove('is-leaving', 'is-typing');
    });
    const userMsg = root.querySelector('[data-demo-step="user"]');
    const userText = userMsg ? userMsg.querySelector('.demo__msg-text') : null;
    if (userText && userMsg) {
      userText.textContent = userMsg.getAttribute('data-demo-text') || '';
    }
    const thinking = root.querySelector('[data-demo-step="thinking"]');
    setThinkingText(thinking, ORDER_DONE_TEXT);
  }

  /** 按最终态（三步全开 + 完整用户文案）锁定舞台高度，避免订单弹窗出现时卡片增高 */
  function lockStageHeight(root) {
    if (root.dataset.demoStageLocked === 'true') return;
    const steps = root.querySelectorAll('[data-demo-step]');
    const prev = [];
    steps.forEach((el) => {
      prev.push({
        el,
        visible: el.classList.contains('is-visible'),
        typing: el.classList.contains('is-typing')
      });
    });
    showFinalStateNoAnim(root);
    const height = Math.ceil(root.getBoundingClientRect().height);
    root.style.setProperty('--demo-stage-height', height + 'px');
    root.dataset.demoStageLocked = 'true';
    prev.forEach(({ el, visible, typing }) => {
      el.classList.toggle('is-visible', visible);
      el.classList.toggle('is-typing', typing);
      el.classList.remove('is-leaving');
    });
    const userMsg = root.querySelector('[data-demo-step="user"]');
    const userText = userMsg ? userMsg.querySelector('.demo__msg-text') : null;
    if (userText && !prev.find((p) => p.el === userMsg && p.visible)) {
      userText.textContent = '';
    }
    const thinking = root.querySelector('[data-demo-step="thinking"]');
    setThinkingText(thinking, THINKING_TEXT);
  }

  function init() {
    const roots = document.querySelectorAll('[data-demo-flow]');
    if (!roots.length) return;

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    roots.forEach(lockStageHeight);

    if (reduceMotion) {
      roots.forEach(showFinalStateNoAnim);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      roots.forEach(startFlow);
      return;
    }

    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startFlow(entry.target);
          } else {
            stopFlow(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    roots.forEach(function (root) {
      io.observe(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
