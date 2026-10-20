/** Computes and applies grid column count based on available viewport width. */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  const CONTENTS_SELECTOR = 'ytd-rich-grid-renderer #contents';

  function availableWidth() {
    const contents = document.querySelector(CONTENTS_SELECTOR);
    const width = contents ? contents.clientWidth : 0;
    if (width > 0) return width;
    const root = document.documentElement;
    return root ? root.clientWidth : 0;
  }

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
