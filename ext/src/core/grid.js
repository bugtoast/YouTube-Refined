/**
 * Column control. The layout itself lives in the stylesheet (see style.js);
 * this module only decides how many columns the current viewport can carry
 * and publishes it as the `--ytc-columns` custom property. Changing the
 * setting is therefore one property write, with no DOM churn.
 */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  const CONTENTS_SELECTOR = 'ytd-rich-grid-renderer #contents';

  /**
   * Width available to the grid. Measured on the grid itself so the collapsed
   * sidebar and page margins are already excluded; falls back to the viewport
   * while the grid is still rendering.
   */
  function availableWidth() {
    const contents = document.querySelector(CONTENTS_SELECTOR);
    const width = contents ? contents.clientWidth : 0;
    if (width > 0) return width;
    const root = document.documentElement;
    return root ? root.clientWidth : 0;
  }

  /**
   * Publishes the column count and reports what was asked for versus what the
   * viewport allowed, so the popup can explain a clamped layout.
   */
  function applyColumns(desired) {
    const wanted = YTC.sanitizeColumns(desired);
    const effective = YTC.effectiveColumns(wanted, availableWidth());
    const root = document.documentElement;
    if (root) root.style.setProperty('--ytc-columns', String(effective));
    return { wanted, effective };
  }

  YTC.grid = {
    availableWidth,
    applyColumns,
    CONTENTS_SELECTOR,
    observeTarget: () => document.querySelector(CONTENTS_SELECTOR),
  };
})(window);