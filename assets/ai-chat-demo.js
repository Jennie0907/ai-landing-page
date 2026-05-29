/**
 * MEXC-AI 卡片：自然语言对话演示动画
 * 时间线（单循环 9s）：
 *   0.00–1.00s  idle（空白，只有输入框）
 *   1.00–1.45s  用户气泡淡入
 *   2.00–2.45s  AI "深度思考中" 淡入
 *   3.60–3.88s  思考淡出
 *   3.90–4.35s  AI 回复容器淡入
 *   4.40–6.40s  回复 5 行逐行淡入（每行 0.5s 间隔，缓动 0.4s）
 *   6.40–8.60s  停留
 *   8.60s       本次循环结束，等待 9.00s 重置
 *
 * 触发：IntersectionObserver 监听 .showcase-card--feature。
 *   - 进入视口 ≥ 30% 时启动循环
 *   - 离开视口暂停（防后台耗 CPU）
 */
(function () {
  'use strict';

  const REPLY_LINE_DELAY = 500;  // ms 每行间隔
  const LEAVE_DURATION = 280;    // ms 与 CSS ai-msg-leave 同步
  const CYCLE_DURATION = 9000;   // ms 总循环

  const STEP_TIMINGS = {
    user: 1000,
    thinking: 2000,
    replyFadeOut: 3600,
    reply: 3900,
    firstLine: 4400,
  };

  function showMsg(el) {
    if (!el) return;
    el.classList.remove('is-leaving', 'is-visible');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('is-visible');
      });
    });
  }

  function hideMsgInstant(el) {
    if (!el) return;
    el.classList.remove('is-visible', 'is-leaving');
  }

  function fadeOutMsg(el, onDone) {
    if (!el) return;
    el.classList.remove('is-visible');
    el.classList.add('is-leaving');
    setTimeout(() => {
      el.classList.remove('is-leaving');
      if (onDone) onDone();
    }, LEAVE_DURATION);
  }

  function startDemo(demo) {
    if (demo._aiChatRunning) return;
    demo._aiChatRunning = true;

    const lines = demo.querySelectorAll('.ai-chat-demo__reply-line');
    const userMsg = demo.querySelector('[data-msg="user"]');
    const thinkingMsg = demo.querySelector('[data-msg="thinking"]');
    const replyMsg = demo.querySelector('[data-msg="reply"]');

    const thinkingText = thinkingMsg ? thinkingMsg.querySelector('.ai-chat-demo__thinking-text') : null;

    function reset() {
      demo.dataset.state = 'idle';
      hideMsgInstant(userMsg);
      hideMsgInstant(thinkingMsg);
      hideMsgInstant(replyMsg);
      lines.forEach((l) => l.classList.remove('is-visible'));
      if (thinkingMsg) thinkingMsg.classList.remove('is-done');
      if (thinkingText) thinkingText.textContent = '深度思考中';
    }

    function runCycle() {
      reset();

      const timers = [];

      timers.push(setTimeout(() => {
        demo.dataset.state = 'user';
        showMsg(userMsg);
      }, STEP_TIMINGS.user));

      timers.push(setTimeout(() => {
        demo.dataset.state = 'thinking';
        showMsg(thinkingMsg);
      }, STEP_TIMINGS.thinking));

      timers.push(setTimeout(() => {
        if (thinkingText) thinkingText.textContent = '已完成思考';
        if (thinkingMsg) thinkingMsg.classList.add('is-done');
      }, STEP_TIMINGS.replyFadeOut));

      timers.push(setTimeout(() => {
        demo.dataset.state = 'reply';
        showMsg(replyMsg);
      }, STEP_TIMINGS.reply));

      lines.forEach((line, i) => {
        timers.push(setTimeout(() => {
          line.classList.add('is-visible');
        }, STEP_TIMINGS.firstLine + i * REPLY_LINE_DELAY));
      });

      demo._aiChatTimers = timers;
    }

    runCycle();
    demo._aiChatInterval = setInterval(runCycle, CYCLE_DURATION);
  }

  function stopDemo(demo) {
    if (demo._aiChatInterval) {
      clearInterval(demo._aiChatInterval);
      demo._aiChatInterval = null;
    }
    if (demo._aiChatTimers) {
      demo._aiChatTimers.forEach((t) => clearTimeout(t));
      demo._aiChatTimers = null;
    }
    demo._aiChatRunning = false;
  }

  function init() {
    const demos = document.querySelectorAll('.ai-chat-demo');
    if (!demos.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      demos.forEach(startDemo);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const demo = entry.target.querySelector('.ai-chat-demo') || entry.target;
        if (!demo) return;
        if (entry.isIntersecting) {
          startDemo(demo);
        } else {
          stopDemo(demo);
        }
      });
    }, { threshold: 0.3 });

    demos.forEach((demo) => {
      const card = demo.closest('.showcase-card') || demo;
      io.observe(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
