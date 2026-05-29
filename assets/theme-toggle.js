/**
 * MEXC AI 落地页 — 明/暗主题切换
 * 激活方式: html[data-theme="dark"]
 * 持久化: localStorage key mexc-theme
 */
(function initThemeToggle() {
  var STORAGE_KEY = 'mexc-theme';
  var THEME_DARK = 'dark';
  var THEME_LIGHT = 'light';
  var META_COLORS = {
    light: '#ffffff',
    dark: '#0f1015',
  };

  var root = document.documentElement;
  var toggleBtn = null;
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  function isDark() {
    return root.getAttribute('data-theme') === THEME_DARK;
  }

  function readStoredTheme() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored === THEME_DARK || stored === THEME_LIGHT ? stored : THEME_LIGHT;
    } catch (e) {
      return THEME_LIGHT;
    }
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function updateMetaThemeColor(theme) {
    if (!metaTheme) return;
    metaTheme.setAttribute('content', META_COLORS[theme] || META_COLORS.light);
  }

  function swapThemeIcons(theme) {
    document.querySelectorAll('[data-theme-src-light][data-theme-src-dark]').forEach(function (img) {
      var next =
        theme === THEME_DARK
          ? img.getAttribute('data-theme-src-dark')
          : img.getAttribute('data-theme-src-light');
      if (next && img.getAttribute('src') !== next) {
        img.setAttribute('src', next);
      }
    });
  }

  function updateToggleUi(theme) {
    if (!toggleBtn) return;
    var dark = theme === THEME_DARK;
    toggleBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', dark ? '切换至浅色模式' : '切换至深色模式');
  }

  function applyTheme(theme, options) {
    var opts = options || {};
    var dark = theme === THEME_DARK;

    if (dark) {
      root.setAttribute('data-theme', THEME_DARK);
    } else {
      root.removeAttribute('data-theme');
    }

    if (opts.persist !== false) {
      persistTheme(theme);
    }

    updateMetaThemeColor(theme);
    swapThemeIcons(theme);
    updateToggleUi(theme);

    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: { theme: theme, dark: dark },
      })
    );
  }

  function toggleTheme() {
    applyTheme(isDark() ? THEME_LIGHT : THEME_DARK);
  }

  /* 同步 UI（head 内联脚本可能已提前设置 data-theme） */
  function syncFromDom() {
    var theme = isDark() ? THEME_DARK : THEME_LIGHT;
    updateMetaThemeColor(theme);
    swapThemeIcons(theme);
    updateToggleUi(theme);
  }

  function bindToggle() {
    toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    syncFromDom();
    toggleBtn.addEventListener('click', toggleTheme);
  }

  /* 供 head 内联脚本调用，避免 FOUC */
  window.MexcTheme = {
    apply: applyTheme,
    toggle: toggleTheme,
    isDark: isDark,
    readStored: readStoredTheme,
    STORAGE_KEY: STORAGE_KEY,
    THEME_DARK: THEME_DARK,
    THEME_LIGHT: THEME_LIGHT,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggle);
  } else {
    bindToggle();
  }
})();
