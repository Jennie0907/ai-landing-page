/**
 * AI 快讯卡片：快讯流演示动画
 * 节奏：每 5s 从顶部插入一条新快讯，旧条目随之向下推移，
 *      超出可视区域的部分通过底部 mask 自然渐隐淡出。
 *
 * 触发：IntersectionObserver 监听 .news-flash-mock，
 *   - 进入视口 ≥ 25% 时启动循环
 *   - 离开视口暂停（防后台耗 CPU）
 */
(function () {
  'use strict';

  const INTERVAL = 5000;
  const MAX_ITEMS = 5;

  const POOL = [
    { text: 'BTC 突破 $70,000，链上活跃度持续放大',                tone: 'up'   },
    { text: 'ETH 现货 ETF 单日净流入创近 5 周新高',                 tone: 'up'   },
    { text: 'Polymarket 通过检测内幕交易、支持透明的区块链执法行动', tone: 'up'   },
    { text: 'Solana 链上 Memecoin 24h 涨幅领跑主流公链',           tone: 'up'   },
    { text: 'USDT 流通市值站稳 1200 亿美元关口',                   tone: 'up'   },
    { text: '美 SEC 主席公开表态，支持推进稳定币立法',              tone: 'up'   },
    { text: '某 Layer2 协议遭闪电贷攻击，初步损失约 320 万美元',     tone: 'down' },
    { text: '全球加密 ETF 出现连续两日资金净流出',                 tone: 'down' },
    { text: 'BNB Chain 完成 Maxwell 硬分叉升级，主网平稳运行',     tone: 'up'   },
    { text: '山寨币市值 24h 缩水超 80 亿美元，多头杠杆遭清算',      tone: 'down' },
    { text: '哥斯达黎加反洗钱法律对加密服务商实施严格合规标准',     tone: 'up'   },
  ];

  const root = document.querySelector('[data-news-flash]');
  if (!root) return;

  const list = root.querySelector('[data-news-flash-list]');
  const dateEl = root.querySelector('[data-news-flash-date]');
  if (!list) return;

  let cursor = 0;
  let timer = null;
  let running = false;

  function pad(n) { return String(n).padStart(2, '0'); }

  function stampAt(offsetSeconds) {
    const d = new Date(Date.now() - offsetSeconds * 1000);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function dateString() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function pickNext() {
    const item = POOL[cursor % POOL.length];
    cursor++;
    return item;
  }

  function createItem(data, timeText) {
    const li = document.createElement('li');
    li.className = 'news-flash-mock__item';
    li.innerHTML =
      '<div class="news-flash-mock__item-time">' + timeText + '</div>' +
      '<div class="news-flash-mock__item-title">' +
        '<span class="news-flash-mock__item-title-text">' + data.text + '</span>' +
        '<svg class="news-flash-mock__item-link" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
          '<path d="M19.7872 14.1264C22.5209 11.3928 22.5209 6.96068 19.7872 4.22701C17.0536 1.49334 12.6215 1.49334 9.88781 4.22701L8.4591 5.65572L9.51964 6.71627L10.9484 5.28756C13.0962 3.13967 16.5788 3.13968 18.7267 5.28756C20.8746 7.43544 20.8746 10.918 18.7267 13.0659L17.298 14.4946L18.3585 15.5551L19.7872 14.1264Z" fill="currentColor"/>' +
          '<path d="M16.1056 9.01314L15.0441 7.95162L7.96496 15.0317L9.0255 16.0922L16.1056 9.01314Z" fill="currentColor"/>' +
          '<path d="M4.23351 19.7807C6.96718 22.5144 11.4002 22.5144 14.1339 19.7807L15.5441 18.3696L14.4835 17.309L13.0724 18.7192C10.9245 20.8671 7.44292 20.8671 5.29503 18.7192C3.14715 16.5713 3.14715 13.0897 5.29503 10.9419L6.70519 9.53072L5.64464 8.47018L4.23351 9.88033C1.49984 12.614 1.49984 17.0471 4.23351 19.7807Z" fill="currentColor"/>' +
        '</svg>' +
      '</div>' +
      '<span class="news-flash-mock__item-badge news-flash-mock__item-badge--' + data.tone + '">' +
        (data.tone === 'up' ? '看涨' : '看跌') +
      '</span>';
    return li;
  }

  function seedInitial() {
    if (dateEl) dateEl.textContent = dateString();
    list.innerHTML = '';
    // 初始化：最新一条在顶部（30s 前），其余依次往前 4-8 分钟
    const offsets = [30, 60 * 4 + 12, 60 * 7 + 41, 60 * 18 + 5, 60 * 38 + 27];
    for (let i = 0; i < MAX_ITEMS; i++) {
      const data = pickNext();
      list.appendChild(createItem(data, stampAt(offsets[i] || (i * 120))));
    }
  }

  function pushNew() {
    const data = pickNext();
    const node = createItem(data, stampAt(0));
    node.classList.add('is-entering');
    list.prepend(node);
    while (list.children.length > MAX_ITEMS) {
      list.removeChild(list.lastElementChild);
    }
  }

  function start() {
    if (running) return;
    running = true;
    timer = setInterval(pushNew, INTERVAL);
  }

  function stop() {
    running = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  seedInitial();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          start();
        } else {
          stop();
        }
      });
    }, { threshold: [0, 0.25, 0.5] });
    io.observe(root);
  } else {
    start();
  }
})();
