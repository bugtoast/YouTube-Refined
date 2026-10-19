/**
 * Recognising and removing YouTube Shorts.
 *
 * YouTube ships Shorts through several unrelated renderers, and which one is
 * used depends on the surface (home shelf, search grid, sidebar, history…).
 * So detection is driven by two signals that cover all of them:
 *
 *   a) known Shorts shelf/lockup elements, and
 *   b) any link whose href points at a Shorts URL.
 *
 * Matching on the URL is what makes this survive YouTube A/B tests; matching
 * on the label is what catches the sidebar entry, which has no href at all.
 */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  /**
   * Matches a `/shorts` or `/reel` path segment, wherever it appears:
   * /shorts/ID, /reel/ID, /shorts, and channel tabs like /@name/shorts.
   * Query strings are never part of the tested string, so a search for the
   * word "shorts" can never trip this.
   */
  const SHORTS_SEGMENT = /(?:^|\/)(?:shorts|reel)(?:\/|$)/i;

  /** Whole Shorts containers: shelves and standalone lockups. */
  const SHORTS_ELEMENTS = [
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-item-renderer',
    'ytd-rich-item-renderer[is-shorts-grid]',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
  ].join(', ');

  /** Nav entries (sidebar, drawer, menus) that should vanish entirely. */
  const ENTRY_ELEMENTS = [
    'ytd-guide-entry-renderer',
    'ytd-menu-service-item-renderer',
  ].join(', ');

  /** Single video/Shorts cards inside a grid, feed or search shelf. */
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

  /** Closest ancestor of a Shorts link that should be removed as a whole. */
  const REMOVE_TARGET = `${ENTRY_ELEMENTS}, ${ITEM_ELEMENTS}`;

  /**
   * Containers to collapse once their last card is gone. Shady DOM stamps a
   * `<name>` class onto elements *inside* a component, so the class forms are
   * listed too — YouTube's grid shelf rows are plain divs carrying one.
   */
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

  /**
 * Elements whose visible text identifies them as the Shorts entry: the
 * sidebar and drawer links, and the "Shorts" tab on a channel page (which
 * carries no href at all, only tab-title="Shorts").
 */
  const LABEL_ELEMENTS = [
    'ytd-guide-entry-renderer',
    'ytd-guide-collapsible-entry-renderer',
    'ytd-topbar-menu-button-renderer',
    'yt-tab-shape',
    'tp-yt-paper-tab',
  ].join(', ');

  /**
   * Attribute pre-filter so the engine does the scanning: every real Shorts
   * href contains /shorts or /reel. Anything surviving is verified properly.
   */
  const SHORTS_LINK = 'a[href*="/shorts"], a[href*="/reel"]';

  /** Lower-cased path of a link, or null when it cannot be understood. */
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

  /** True when the href points at Shorts (or a channel's Shorts tab). */
  function isShortsHref(href) {
    const path = pathOf(href);
    return path !== null && SHORTS_SEGMENT.test(path);
  }

  /** True when a location object (window.location) is a Shorts page. */
  function isShortsLocation(location) {
    return isShortsHref(location && location.pathname);
  }

  /**
   * The sidebar/drawer Shorts entry and the channel "Shorts" tab ship without
   * an href and are identified by their label. A real link to something else
   * — a channel genuinely named "Shorts", say — is left alone.
   */
  function isShortsEntry(element) {
    const label = (element.getAttribute('tab-title')
      || element.textContent
      || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (label !== 'shorts') return false;

    const anchor = element.querySelector('a');
    const href = anchor && anchor.getAttribute('href');
    return !href || isShortsHref(href);
  }

  /**
   * Detaches a node. Returns true when something was actually removed, which
   * is what callers use to decide whether a shelf needs collapsing.
   */
  function removeNode(node) {
    if (!node || !node.isConnected) return false;
    try {
      node.remove();
    } catch {
      // Falling back to hiding keeps the Shorts unreachable either way.
      node.style.setProperty('display', 'none', 'important');
      node.setAttribute('aria-hidden', 'true');
    }
    return true;
  }

  /** True when the element itself is a Shorts shelf or lockup. */
  function isShortsElement(node) {
    return Boolean(node) && node.nodeType === 1 && node.matches(SHORTS_ELEMENTS);
  }

  /** True when an element holds nothing a viewer would ever see. */
  function isEmpty(element) {
    return element.childElementCount === 0 && (element.textContent || '').trim() === '';
  }

  /**
   * Cleans up after a card was removed: walks up and removes the containers it
   * emptied, stopping at the first ancestor that still holds a real card.
   * Without this, a removed Short leaves an empty grid cell and a dangling
   * "Shorts" header behind.
   *
   * Takes the removed node's parent, because remove() clears parentElement.
   */
  function pruneFrom(parent) {
    let current = parent;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.querySelector(ITEM_ELEMENTS)) return; // still holds a real card

      const next = current.parentElement;
      // A shelf with nothing in it goes; a plain wrapper is only walked past,
      // because it may still hold the shelf's own header.
      if (current.matches(SHELF_ELEMENTS) || isEmpty(current)) removeNode(current);
      current = next;
    }
  }

  /**
   * Removes every Short found under `root`, including `root` itself.
   */
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