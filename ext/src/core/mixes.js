/** Finds Mix badges on video cards and removes those cards from feeds. */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  const BADGE_ELEMENTS = [
    'ytd-thumbnail-overlay-bottom-panel-renderer',
    'ytd-thumbnail-overlay-side-panel-renderer',
    'yt-thumbnail-badge-view-model',
    'yt-badge-shape',
    '[aria-label="Mix" i]',
    '[title="Mix" i]',
  ].join(', ');

  const CARD_ELEMENTS = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-playlist-renderer',
    'ytd-grid-playlist-renderer',
    'ytd-compact-playlist-renderer',
    'yt-lockup-view-model',
  ].join(', ');

  const SHELF_ELEMENTS = [
    'grid-shelf-view-model',
    'ytd-rich-shelf-renderer',
    'ytd-shelf-renderer',
    'ytd-item-section-renderer',
    'ytd-rich-section-renderer',
  ].join(', ');

  function normalizedLabel(element) {
    return [element.getAttribute('aria-label'), element.getAttribute('title'), element.textContent]
      .filter(Boolean)
      .map((label) => label.replace(/[^a-z0-9]/gi, '').toLowerCase());
  }

  function isMixBadge(element) {
    return normalizedLabel(element).some((label) => label === 'mix');
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

  function pruneEmptyShelf(parent) {
    let current = parent;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.querySelector(CARD_ELEMENTS)) return;
      const next = current.parentElement;
      if (current.matches(SHELF_ELEMENTS) || (current.childElementCount === 0 && !(current.textContent || '').trim())) {
        removeNode(current);
      }
      current = next;
    }
  }

  function removeMixes(root) {
    if (!root || root.nodeType !== 1) return 0;
    const badges = [];
    if (root.matches(BADGE_ELEMENTS)) badges.push(root);
    badges.push(...root.querySelectorAll(BADGE_ELEMENTS));

    const cards = new Set();
    for (const badge of badges) {
      if (!isMixBadge(badge)) continue;
      const card = badge.closest(CARD_ELEMENTS);
      if (card) cards.add(card);
    }

    let removed = 0;
    for (const card of cards) {
      const parent = card.parentElement;
      if (!parent || !removeNode(card)) continue;
      removed += 1;
      pruneEmptyShelf(parent);
    }
    return removed;
  }

  YTC.mixes = { removeMixes, BADGE_ELEMENTS };
})(window);
