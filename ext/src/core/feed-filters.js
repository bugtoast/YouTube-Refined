/** Removes selected kinds of feed cards while preserving mixed shelves. */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  const CARD_ELEMENTS = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-playlist-renderer',
    'ytd-grid-playlist-renderer',
    'ytd-compact-playlist-renderer',
    'ytd-radio-renderer',
    'yt-lockup-view-model',
  ].join(', ');

  const LIVE_MARKERS = [
    'ytd-thumbnail-overlay-time-status-renderer',
    'ytd-badge-supported-renderer',
    'yt-badge-shape',
    '[aria-label="LIVE" i]',
    '[title="LIVE" i]',
  ].join(', ');

  const STARTED_MARKERS = [
    'ytd-thumbnail-overlay-resume-playback-renderer',
    'ytd-thumbnail-overlay-progress-bar-renderer',
    '.ytThumbnailOverlayProgressBarHostWatched',
    '[class*="ThumbnailOverlayProgressBarHostWatched"]',
  ].join(', ');

  const PLAYLIST_MARKERS = [
    'ytd-playlist-renderer',
    'ytd-grid-playlist-renderer',
    'ytd-compact-playlist-renderer',
    'ytd-radio-renderer',
    'a[href^="/playlist?list="]',
    'a[href*="/playlist?list="]',
  ].join(', ');

  const SHELF_ELEMENTS = [
    'grid-shelf-view-model',
    'ytd-rich-shelf-renderer',
    'ytd-reel-shelf-renderer',
    'ytd-shelf-renderer',
    'ytd-item-section-renderer',
    'ytd-rich-section-renderer',
  ].join(', ');

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

  function closestCard(element) {
    return element.closest('ytd-rich-item-renderer') || element.closest(CARD_ELEMENTS);
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

  function removeCards(root, markerSelector, predicate = () => true) {
    if (!root || root.nodeType !== 1) return 0;
    const markers = [];
    if (root.matches(markerSelector)) markers.push(root);
    markers.push(...root.querySelectorAll(markerSelector));

    const cards = new Set();
    for (const marker of markers) {
      if (!predicate(marker)) continue;
      const card = closestCard(marker);
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

  function isLiveMarker(element) {
    const overlayStyle = (element.getAttribute('overlay-style') || '').toLowerCase();
    if (overlayStyle === 'live') return true;
    const labels = [element.getAttribute('aria-label'), element.getAttribute('title'), element.textContent]
      .filter(Boolean)
      .map((label) => label.replace(/\s+/g, ' ').trim().toLowerCase());
    return labels.some((label) => label === 'live' || label === 'live now');
  }

  function removeLiveVideos(root) {
    return removeCards(root, LIVE_MARKERS, isLiveMarker);
  }

  function removeStartedVideos(root) {
    return removeCards(root, STARTED_MARKERS);
  }

  function removePlaylists(root) {
    return removeCards(root, PLAYLIST_MARKERS);
  }

  YTC.feedFilters = {
    removeLiveVideos,
    removeStartedVideos,
    removePlaylists,
    LIVE_MARKERS,
    STARTED_MARKERS,
    PLAYLIST_MARKERS,
  };
})(window);
