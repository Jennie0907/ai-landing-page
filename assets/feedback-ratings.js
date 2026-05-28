/**
 * 用户评价星级 —— 随机渲染 4.5 或 5 星
 *
 * 规则：
 *   - 每张原始卡片随机分配一个评分（4.5 或 5）
 *   - 4.5 分 = 4 颗全填充星 + 1 颗半填充星（左黄右灰）
 *   - 5 分   = 5 颗全填充星
 *   - 复制卡片（aria-hidden="true"）继承同序号原始卡片的评分，
 *     确保 marquee 无缝滚动时同一人的评分一致
 *
 * 比例：默认 60% 概率 4.5 分、40% 概率 5 分，保持评分参差感。
 */
(function () {
  'use strict';

  const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
  const RATING_45_PROBABILITY = 0.6;

  function fullStarSVG() {
    return (
      '<svg class="feedback__star" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="currentColor" d="' + STAR_PATH + '"/>' +
      '</svg>'
    );
  }

  function halfStarSVG() {
    return (
      '<svg class="feedback__star feedback__star--half" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path class="feedback__star-bg" d="' + STAR_PATH + '"/>' +
        '<path class="feedback__star-fill" d="' + STAR_PATH + '"/>' +
      '</svg>'
    );
  }

  function buildStarsHTML(rating) {
    const fullCount = Math.floor(rating);
    const hasHalf = rating - fullCount === 0.5;
    let html = '';
    for (let i = 0; i < fullCount; i++) html += fullStarSVG();
    if (hasHalf) html += halfStarSVG();
    return html;
  }

  function randomRating() {
    return Math.random() < RATING_45_PROBABILITY ? 4.5 : 5;
  }

  function init() {
    document.querySelectorAll('.feedback__runner').forEach(function (runner) {
      const cards = Array.from(runner.querySelectorAll('.feedback__card'));
      if (!cards.length) return;

      // 假定前半段为原始卡片、后半段为镜像复制卡片
      // 若数量为奇数，则后半段按 originalCount 个数对齐
      const originalCount = Math.ceil(cards.length / 2);
      const ratings = [];
      for (let i = 0; i < originalCount; i++) {
        ratings.push(randomRating());
      }

      cards.forEach(function (card, idx) {
        const starsEl = card.querySelector('.feedback__stars');
        if (!starsEl) return;
        const rating = ratings[idx % originalCount];
        starsEl.innerHTML = buildStarsHTML(rating);
        if (!card.hasAttribute('aria-hidden')) {
          starsEl.setAttribute('aria-label', rating + ' 星好评');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
