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
      ':root, ytd-app { --ytd-mini-guide-width: 0px !important; --app-drawer-width: 0px !important; --ytd-guide-width: 0px !important; }',
      [
        'ytd-mini-guide-renderer',
        'ytd-app #guide',
        'ytd-app #guide-wrapper',
        'ytd-guide-renderer',
        'tp-yt-app-drawer#guide',
        'app-drawer#guide',
        '#guide-button',
        'ytd-masthead #guide-button',
      ].join(', ') + ' { display: none !important; }',
      [
        'ytd-app[guide-persistent-and-visible] ytd-page-manager.ytd-app',
        'ytd-app[mini-guide-visible] ytd-page-manager.ytd-app',
        'ytd-app[guide-persistent-and-visible] #page-manager',
        'ytd-app[mini-guide-visible] #page-manager',
        'ytd-app[guide-persistent-and-visible] ytd-two-column-browse-results-renderer.ytd-browse',
        'ytd-app[mini-guide-visible] ytd-two-column-browse-results-renderer.ytd-browse',
        '#page-manager.ytd-app',
        'ytd-page-manager.ytd-app',
        '#content.ytd-app',
      ].join(', ') + ' { margin-left: 0 !important; padding-left: 0 !important; }',
    ].join(' '),
  };

  /** Kept for callers that want both in one go. */
  YTC.STYLE_TEXT = `${YTC.GRID_STYLE_TEXT}\n\n${YTC.SHORTS_STYLE_TEXT}`;
})(window);
