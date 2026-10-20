/**
 * The stylesheets, as text so the content script can inject them at
 * document_start — before YouTube paints its first row.
 *
 * They are kept apart on purpose: the grid must apply whether or not Shorts
 * blocking is on, while the Shorts hiding is attached and detached by the
 * toggle.
 */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  /**
   * Grid columns. YouTube sizes a card with
   *   width: calc(100%/var(--ytd-rich-grid-items-per-row) - var(--ytd-rich-grid-item-margin))
   * so overriding the two per-row variables is enough to pin the layout, with
   * no DOM work at all. The min/max-width variables are deliberately left
   * alone: they only affect ads, banners and link-card shelves, never cards.
   */
  YTC.GRID_STYLE_TEXT = `
:root {
  --ytc-columns: 4;
}

ytd-rich-grid-renderer {
  --ytd-rich-grid-items-per-row: var(--ytc-columns) !important;
  --ytd-rich-grid-posts-per-row: var(--ytc-columns) !important;
}
`.trim();

  /**
   * Hides Shorts the instant they are parsed, so nothing flashes even if the
   * removal pass in shorts.js has not run for a given node yet. Removing them
   * from the DOM is still what makes them unreachable; this only covers the
   * frames in between.
   */
  YTC.SHORTS_STYLE_TEXT = `
ytd-reel-shelf-renderer,
ytd-rich-shelf-renderer[is-shorts],
ytd-reel-item-renderer,
ytd-rich-item-renderer[is-shorts-grid],
ytm-shorts-lockup-view-model,
ytm-shorts-lockup-view-model-v2,
ytd-shorts,
ytd-reel-video-renderer {
  display: none !important;
}

.ytGridShelfViewModelGridShelfItem:has(ytm-shorts-lockup-view-model-v2),
.ytGridShelfViewModelGridShelfItem:has(a[href*="/shorts"]) {
  display: none !important;
}
`.trim();

  YTC.WATCH_PAGE_STYLES = {
    hideComments: `ytd-watch-flexy #comments, ytd-watch-flexy ytd-comments { display: none !important; }`,
    hideRecommendations: `ytd-watch-flexy #secondary { display: none !important; } ytd-watch-flexy #primary { width: 100% !important; max-width: 100% !important; }`,
    hideEndScreen: `.ytp-endscreen-content, .ytp-ce-element { display: none !important; }`,
    hideFilterChips: [
      // The chip bar itself, on every surface YouTube has used for it.
      // Keep this to chips only: collapsing the whole search header also hides
      // the Filters button, which must stay visible.
      'ytd-feed-filter-chip-bar-renderer',
      'ytd-feed-filter-chip-bar-renderer #chips-wrapper',
      'ytd-feed-filter-chip-bar-renderer #chips-content',
      'ytd-feed-filter-chip-bar-renderer #scroll-container',
      'ytd-feed-filter-chip-bar-renderer #chips',
      'yt-chip-cloud-renderer',
      'yt-chip-cloud-renderer #scroll-container',
      'yt-chip-cloud-renderer #chips',
      'yt-chip-bar-view-model',
      '.ytChipBarViewModelHost',
      '.ytChipBarViewModelChipBarScrollContainer',
      'ytd-search-filter-chip-bar-renderer',
      'div#chip-bar',
    ].join(', ') + ' { display: none !important; } ' + [
      // Home/feed headers that only wrapped the bar collapse away entirely.
      // Search is deliberately excluded: its header also holds the Filters
      // button, which must stay visible.
      "ytd-rich-grid-renderer #header:has(ytd-feed-filter-chip-bar-renderer)",
      "ytd-rich-grid-renderer #header:has(yt-chip-cloud-renderer)",
      "ytd-browse[page-subtype='home'] #header:has(ytd-feed-filter-chip-bar-renderer)",
      "ytd-browse[page-subtype='home'] #header:has(yt-chip-cloud-renderer)",
      'ytd-search-header-renderer:has(div#chip-bar):not(:has(#filter-button))',
      "ytd-search div#header:has(> ytd-search-header-renderer > div#chip-bar):not(:has(#filter-button))",
    ].join(', ') + ' { display: none !important; height: 0 !important; min-height: 0 !important; max-height: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; margin-top: 0 !important; margin-bottom: 0 !important; border: 0 !important; overflow: hidden !important; } ' + [
      // YouTube stretches the sticky masthead backdrop to 112px while chips are
      // present; pin it back to toolbar height so no strip is left behind.
      // Height only — YouTube's own backdrop paint is left untouched, so the
      // header keeps its normal background (overriding it blanked the bar).
      'ytd-app #frosted-glass.with-chipbar',
      'ytd-app #frosted-glass.loading-with-chipbar',
      '#frosted-glass.with-chipbar',
      '#frosted-glass.loading-with-chipbar',
    ].join(', ') + ' { height: var(--ytd-toolbar-height, 56px) !important; }',
    hideSidebar: [
      ':root, ytd-app { --ytd-mini-guide-width: 0px !important; }',
      'ytd-mini-guide-renderer { display: none !important; }',
      [
        'ytd-app[mini-guide-visible] ytd-page-manager.ytd-app',
        'ytd-app[mini-guide-visible] #page-manager',
        'ytd-app[mini-guide-visible] ytd-two-column-browse-results-renderer.ytd-browse',
      ].join(', ') + ' { margin-left: 0 !important; }',
    ].join(' '),
  };

  YTC.NAVBAR_STYLES = {
    hideVoiceSearch: 'ytd-masthead #voice-search-button { display: none !important; }',
    hideCreateButton: [
      'ytd-masthead #buttons > ytd-button-renderer:has(button[aria-label*="Create"])',
      'ytd-masthead #buttons > yt-button-view-model:has(button[aria-label*="Create"])',
      'ytd-masthead #buttons > yt-button-shape:has(button[aria-label*="Create"])',
      'ytd-masthead #buttons > ytd-button-renderer:has(a[href*="/upload"])',
      'ytd-masthead #buttons > yt-button-view-model:has(a[href*="/upload"])',
      'ytd-masthead #buttons > ytd-topbar-menu-button-renderer:has(button[aria-label*="Create"])',
      'ytd-masthead ytd-creator-button-renderer',
      'ytd-masthead #create-icon',
    ].join(', ') + ' { display: none !important; }',
    hideNotifications: [
      'ytd-masthead #notifications',
      'ytd-masthead ytd-notification-topbar-button-renderer',
      'ytd-masthead #buttons > ytd-notification-topbar-button-renderer',
    ].join(', ') + ' { display: none !important; }',
    hideCountryCode: 'ytd-masthead #country-code { display: none !important; }',
  };

  YTC.NAVBAR_BUTTON_STYLE = `
#ytc-navbar-settings {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  margin: 0 4px;
  background: transparent;
  color: #0f0f0f;
  cursor: pointer;
  position: relative;
  transition: background-color 150ms ease, transform 120ms ease;
  vertical-align: middle;
  flex: none;
  box-sizing: border-box;
  text-decoration: none;
  outline: none;
}

html[dark] #ytc-navbar-settings,
html[dark="true"] #ytc-navbar-settings,
[dark] #ytc-navbar-settings,
ytd-app[dark] #ytc-navbar-settings,
ytd-masthead[dark] #ytc-navbar-settings {
  color: #f1f1f1 !important;
}

html:not([dark]) #ytc-navbar-settings {
  color: #0f0f0f;
}

@media (prefers-color-scheme: dark) {
  html:not([dark="false"]) #ytc-navbar-settings {
    color: #f1f1f1 !important;
  }
}

#ytc-navbar-settings:hover {
  background-color: var(--yt-spec-badge-chip-background, rgba(128, 128, 128, 0.2));
}

#ytc-navbar-settings:active {
  transform: scale(0.92);
}

#ytc-navbar-settings svg {
  width: 24px;
  height: 24px;
  fill: currentColor !important;
  display: block;
  pointer-events: none;
}
`.trim();

  /** Kept for callers that want both in one go. */
  YTC.STYLE_TEXT = `${YTC.GRID_STYLE_TEXT}\n\n${YTC.SHORTS_STYLE_TEXT}`;
})(window);
