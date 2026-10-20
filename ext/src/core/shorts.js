/** Detection and removal of YouTube Shorts elements and links. */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  const SHORTS_SEGMENT = /(?:^|\/)(?:shorts|reel)(?:\/|$)/i;

  const SHORTS_ELEMENTS = [
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-item-renderer',
    'ytd-rich-item-renderer[is-shorts-grid]',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
  ].join(', ');

  const ENTRY_ELEMENTS = [
    'ytd-guide-entry-renderer',
    'ytd-menu-service-item-renderer',
  ].join(', ');

  const ITEM_ELEMENTS = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-playlist-video-renderer',
    'ytd-video-preview',
    'yt-lockup-view-model',
    '.ytGridShelfViewModelGridShelfItem',
  ].join(', ');

  const REMOVE_TARGET = `${ENTRY_ELEMENTS}, ${ITEM_ELEMENTS}`;

  const SHELF_ELEMENTS = [
    'grid-shelf-view-model',
    'ytd-rich-shelf-renderer',
    'ytd-reel-shelf-renderer',
    'ytd-shelf-renderer',
    'ytd-item-section-renderer',
    '.ytd-item-section-renderer',
    '.ytGridShelfViewModelGridShelfRow',
    'ytd-rich-section-renderer',
  ].join(', ');

  const LABEL_ELEMENTS = [
    'ytd-guide-entry-renderer',
    'ytd-guide-collapsible-entry-renderer',
    'ytd-topbar-menu-button-renderer',
    'yt-tab-shape',
    'tp-yt-paper-tab',
  ].join(', ');

  const SHORTS_LINK = 'a[href*="/shorts"], a[href*="/reel"]';

  function pathOf(href) {
    if (typeof href !== 'string' || href === '') return null;
    const value = href.trim();
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      try {
        return new URL(value).pathname.toLowerCase();
      } catch {
        return null;
      }
    }
    const prefixed = value.startsWith('//') ? `https:${value}` : value;
    try {
      return new URL(prefixed, 'https://www.youtube.com/').pathname.toLowerCase();
    } catch {
      return value.split(/[?#]/)[0].toLowerCase();
    }
  }

  function isShortsHref(href) {
    const path = pathOf(href);
    return path !== null && SHORTS_SEGMENT.test(path);
  }

  function isShortsLocation(location) {
    return isShortsHref(location && location.pathname);
  }

  function isShortsEntry(element) {
    const label = (element.getAttribute('tab-title')
      || element.textContent
      || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (label !== 'shorts') return false;

    const anchor = element.querySelector('a');
    const href = anchor && anchor.getAttribute('href');
    return !href || isShortsHref(href);
  }

  function removeNode(node) {
    if (!node || !node.isConnected) return false;
    try {
      node.remove();
    } catch {
      node.style.setProperty('display', 'none', 'important');
      node.setAttribute('aria-hidden', 'true');
    }
    return true;
  }

  function isShortsElement(node) {
    return Boolean(node) && node.nodeType === 1 && node.matches(SHORTS_ELEMENTS);
  }

  function isEmpty(element) {
    return element.childElementCount === 0 && (element.textContent || '').trim() === '';
  }

  /** Removes empty shelf containers left behind after card removal. */
  function pruneFrom(parent) {
    let current = parent;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.querySelector(ITEM_ELEMENTS)) return;

      const next = current.parentElement;
      if (current.matches(SHELF_ELEMENTS) || isEmpty(current)) removeNode(current);
      current = next;
    }
  }

  function removeShorts(root) {
    if (!root || root.nodeType !== 1) return 0;
    let removed = 0;

    if (isShortsElement(root)) {
      removeNode(root);
      return 1;
    }

    if (root.matches(LABEL_ELEMENTS) && isShortsEntry(root)) {
      removeNode(root);
      return 1;
    }

    for (const element of root.querySelectorAll(SHORTS_ELEMENTS)) {
      const parent = element.parentElement;
      if (!parent || !removeNode(element)) continue;
      removed += 1;
      pruneFrom(parent);
    }

    for (const element of root.querySelectorAll(LABEL_ELEMENTS)) {
      if (isShortsEntry(element) && removeNode(element)) removed += 1;
    }

    for (const anchor of root.querySelectorAll(SHORTS_LINK)) {
      if (!isShortsHref(anchor.getAttribute('href'))) continue;
      const target = anchor.closest(REMOVE_TARGET) || anchor;
      const parent = target.parentElement;
      if (!parent || !removeNode(target)) continue;
      removed += 1;
      pruneFrom(parent);
    }

    return removed;
  }

  YTC.shorts = {
    isShortsHref,
    isShortsLocation,
    isShortsEntry,
    isShortsElement,
    removeNode,
    removeShorts,
    SHORTS_ELEMENTS,
    ITEM_ELEMENTS,
  };
})(window);
