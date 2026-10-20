/** Core runtime: navigation guards, mutation sweep, resize handling and public API. */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  const HOME_URL = 'https://www.youtube.com/';
  const GRID_PROBES = [250, 750, 1500, 3000];

  let columns = YTC.DEFAULT_COLUMNS;
  let blockShorts = YTC.DEFAULT_BLOCK_SHORTS;
  let hideExploreTopics = YTC.DEFAULT_HIDE_EXPLORE_TOPICS;
  let hideMemberships = YTC.DEFAULT_HIDE_MEMBERSHIPS;
  let hideMixes = YTC.DEFAULT_HIDE_MIXES;
  let hideLiveStreams = YTC.DEFAULT_HIDE_LIVE_STREAMS;
  let hideStartedVideos = YTC.DEFAULT_HIDE_STARTED_VIDEOS;
  let hidePlaylists = YTC.DEFAULT_HIDE_PLAYLISTS;
  let hideComments = YTC.DEFAULT_HIDE_COMMENTS;
  let hideRecommendations = YTC.DEFAULT_HIDE_RECOMMENDATIONS;
  let hideEndScreen = YTC.DEFAULT_HIDE_END_SCREEN;
  let hideFilterChips = YTC.DEFAULT_HIDE_FILTER_CHIPS;
  let hideSidebar = YTC.DEFAULT_HIDE_SIDEBAR;
  let hideVoiceSearch = YTC.DEFAULT_HIDE_VOICE_SEARCH;
  let hideCreateButton = YTC.DEFAULT_HIDE_CREATE_BUTTON;
  let hideNotifications = YTC.DEFAULT_HIDE_NOTIFICATIONS;
  let hideCountryCode = YTC.DEFAULT_HIDE_COUNTRY_CODE;
  let showNavbarSettings = YTC.DEFAULT_SHOW_NAVBAR_SETTINGS;
  let gridColumnsEnabled = YTC.DEFAULT_GRID_COLUMNS_ENABLED;
  let onColumnsApplied = null;
  let lastWidth = -1;
  let pending = new Set();
  let flushScheduled = false;
  let bootstrapped = false;
  let mutationObserver = null;
  let resizeObserver = null;
  const swept = new WeakSet();

  /* ----------------------------------------------------------------- utils */

  const isElement = (node) => Boolean(node) && node.nodeType === 1;

  function injectStyle(id, css) {
    if (document.getElementById(id)) return true;
    const parent = document.head || document.documentElement;
    if (!parent) return false;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    parent.appendChild(style);
    return true;
  }

  const removeStyle = (id) => document.getElementById(id)?.remove();

  function hasFeedCleanup() {
    return blockShorts || hideExploreTopics || hideMemberships || hideMixes
      || hideLiveStreams || hideStartedVideos || hidePlaylists;
  }

  function stopObservingIfIdle() {
    if (!hasFeedCleanup()) stopObservingMutations();
  }

  function syncWatchPageStyles() {
    const styles = [
      ['ytc-hide-comments', hideComments, YTC.WATCH_PAGE_STYLES.hideComments],
      ['ytc-hide-recommendations', hideRecommendations, YTC.WATCH_PAGE_STYLES.hideRecommendations],
      ['ytc-hide-end-screen', hideEndScreen, YTC.WATCH_PAGE_STYLES.hideEndScreen],
      ['ytc-hide-filter-chips', hideFilterChips, YTC.WATCH_PAGE_STYLES.hideFilterChips],
      ['ytc-hide-sidebar', hideSidebar, YTC.WATCH_PAGE_STYLES.hideSidebar],
      ['ytc-hide-voice-search', hideVoiceSearch, YTC.NAVBAR_STYLES.hideVoiceSearch],
      ['ytc-hide-create-button', hideCreateButton, YTC.NAVBAR_STYLES.hideCreateButton],
      ['ytc-hide-notifications', hideNotifications, YTC.NAVBAR_STYLES.hideNotifications],
      ['ytc-hide-country-code', hideCountryCode, YTC.NAVBAR_STYLES.hideCountryCode],
    ];
    for (const [id, enabled, css] of styles) {
      if (enabled) injectStyle(id, css);
      else removeStyle(id);
    }
  }

  /* -------------------------------------------------------- navbar settings */

  const NAVBAR_BUTTON_ID = 'ytc-navbar-settings';
  let navbarObserver = null;

  function syncButtonTheme(btn) {
    if (!btn) return;
    const masthead = document.querySelector('ytd-masthead');
    const mastheadBg = masthead ? window.getComputedStyle(masthead).backgroundColor : '';
    const isDark =
      document.documentElement.hasAttribute('dark') ||
      document.documentElement.getAttribute('dark') === 'true' ||
      document.querySelector('ytd-app[dark], ytd-masthead[dark]') !== null ||
      (mastheadBg && mastheadBg !== 'rgb(255, 255, 255)' && mastheadBg !== 'rgba(0, 0, 0, 0)') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    btn.style.setProperty('color', isDark ? '#f1f1f1' : '#0f0f0f', 'important');
  }

  function getProfileContainer(container) {
    const avatarTarget = container.querySelector(
      '#avatar-btn, yt-avatar-button, yt-img-shadow#avatar, ytd-topbar-menu-button-renderer:has(#avatar-btn, #avatar, img)'
    );
    if (avatarTarget) {
      let node = avatarTarget;
      while (node && node.parentElement !== container) {
        node = node.parentElement;
      }
      if (node && node.parentElement === container) {
        return node;
      }
    }

    const directChildren = Array.from(container.children).filter(
      (el) => el.id !== NAVBAR_BUTTON_ID && el.localName !== 'style'
    );
    if (directChildren.length > 0) {
      return directChildren[directChildren.length - 1];
    }
    return null;
  }

  function syncNavbarSettingsButton() {
    let existing = document.getElementById(NAVBAR_BUTTON_ID);
    if (!showNavbarSettings) {
      existing?.remove();
      navbarObserver?.disconnect();
      navbarObserver = null;
      removeStyle('ytc-navbar-btn-style');
      return false;
    }

    injectStyle('ytc-navbar-btn-style', YTC.NAVBAR_BUTTON_STYLE);

    const container =
      document.querySelector('ytd-masthead #end #buttons') ||
      document.querySelector('ytd-masthead #end') ||
      document.querySelector('ytd-masthead #container #end');
    if (!container) {
      if (!navbarObserver) {
        navbarObserver = new MutationObserver(() => {
          if (syncNavbarSettingsButton()) {
            navbarObserver?.disconnect();
            navbarObserver = null;
          }
        });
        const target = document.querySelector('ytd-masthead') || document.body || document.documentElement;
        if (target) navbarObserver.observe(target, { childList: true, subtree: true });
      }
      return false;
    }

    if (existing && existing.localName !== 'a') {
      existing.remove();
      existing = null;
    }

    const btn = existing || document.createElement('a');
    if (!existing) {
      btn.id = NAVBAR_BUTTON_ID;
      btn.href = '/account';
      btn.className = 'yt-simple-endpoint';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', 'Settings');
      btn.title = 'Settings';
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.44.17-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
      btn.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        try {
          const navEvent = new CustomEvent('yt-navigate', {
            bubbles: true,
            composed: true,
            detail: { endpoint: { commandMetadata: { webCommandMetadata: { url: '/account' } } } },
          });
          window.dispatchEvent(navEvent);
        } catch {
          // Fallback: standard href handles navigation
        }
      });
    }

    syncButtonTheme(btn);

    const profileTarget = getProfileContainer(container);
    if (profileTarget && profileTarget.parentElement === container) {
      if (btn.previousElementSibling !== profileTarget || btn.parentElement !== container) {
        container.insertBefore(btn, profileTarget.nextSibling);
      }
    } else if (btn.parentElement !== container) {
      container.appendChild(btn);
    }

    if (!navbarObserver) {
      navbarObserver = new MutationObserver(() => {
        if (!showNavbarSettings) return;
        const currentContainer =
          document.querySelector('ytd-masthead #end #buttons') ||
          document.querySelector('ytd-masthead #end');
        if (!currentContainer) return;
        const currentBtn = document.getElementById(NAVBAR_BUTTON_ID);
        if (!currentBtn) {
          syncNavbarSettingsButton();
          return;
        }
        const profile = getProfileContainer(currentContainer);
        if (profile && currentBtn.previousElementSibling !== profile) {
          currentContainer.insertBefore(currentBtn, profile.nextSibling);
        }
        syncButtonTheme(currentBtn);
      });
      const obsTarget = document.querySelector('ytd-masthead') || document.documentElement;
      if (obsTarget) navbarObserver.observe(obsTarget, { childList: true, subtree: true });
    }

    return true;
  }

  /* ------------------------------------------------------------ navigation */

  function redirectToHome() {
    try {
      location.replace(HOME_URL);
    } catch {
      location.href = HOME_URL;
    }
  }

  function guardLocation() {
    if (!blockShorts) return false;
    if (!YTC.shorts.isShortsLocation(location)) return false;
    redirectToHome();
    return true;
  }

  function anchorFromEvent(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
    if (path) {
      for (const node of path) {
        if (isElement(node) && node.localName === 'a') return node;
      }
    }
    const target = event.target;
    return isElement(target) && typeof target.closest === 'function' ? target.closest('a[href]') : null;
  }

  function onClick(event) {
    if (!blockShorts) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = anchorFromEvent(event);
    if (!anchor || !YTC.shorts.isShortsHref(anchor.getAttribute('href'))) return;

    event.preventDefault();
    event.stopPropagation();
    redirectToHome();
  }

  /* ------------------------------------------------------------------ grid */

  function updateColumns(force) {
    if (!gridColumnsEnabled) return null;
    const width = YTC.grid.availableWidth();
    if (!force && width === lastWidth) return null;
    lastWidth = width;
    const result = YTC.grid.applyColumns(columns);
    if (onColumnsApplied) onColumnsApplied(result);
    return result;
  }

  function observeSizes() {
    resizeObserver = new ResizeObserver(() => updateColumns(false));
  }

  function observeGrid() {
    const grid = YTC.grid.observeTarget();
    if (grid) resizeObserver.observe(grid);
  }

  function bootstrap() {
    if (bootstrapped) return true;
    const root = document.documentElement;
    if (!root) return false;

    bootstrapped = true;
    if (gridColumnsEnabled) {
      injectStyle('ytc-style', YTC.GRID_STYLE_TEXT);
    }
    syncWatchPageStyles();
    syncNavbarSettingsButton();
    resizeObserver.observe(root);
    observeGrid();
    updateColumns(true);
    return true;
  }

  /* ---------------------------------------------------------------- sweep  */

  /** Uses setTimeout instead of rAF so sweeps run even in background tabs. */
  function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    setTimeout(flush, 0);
  }

  function flush() {
    flushScheduled = false;
    const nodes = pending;
    pending = new Set();

    for (const node of nodes) {
      if (!isElement(node) || swept.has(node) || !node.isConnected) continue;
      swept.add(node);

      if (blockShorts && (YTC.shorts.isShortsElement(node) || node.childElementCount > 0)) {
        YTC.shorts.removeShorts(node);
      }
      if (hideExploreTopics && (
        node.childElementCount > 0
        || node.matches('h1, h2, h3, [role="heading"], yt-section-header-view-model, #title')
      )) {
        YTC.topics.removeExploreMoreTopics(node);
      }
      if (hideMemberships && (
        node.childElementCount > 0
        || node.matches('h1, h2, h3, [role="heading"], yt-section-header-view-model, #title')
      )) {
        YTC.memberships.removeMemberships(node);
      }
      if (hideMixes && (node.childElementCount > 0 || node.matches(YTC.mixes.BADGE_ELEMENTS))) {
        YTC.mixes.removeMixes(node);
      }
      if (node.childElementCount > 0) {
        if (hideLiveStreams) YTC.feedFilters.removeLiveVideos(node);
        if (hideStartedVideos) YTC.feedFilters.removeStartedVideos(node);
        if (hidePlaylists) YTC.feedFilters.removePlaylists(node);
      } else {
        if (hideLiveStreams && node.matches(YTC.feedFilters.LIVE_MARKERS)) YTC.feedFilters.removeLiveVideos(node);
        if (hideStartedVideos && node.matches(YTC.feedFilters.STARTED_MARKERS)) YTC.feedFilters.removeStartedVideos(node);
        if (hidePlaylists && node.matches(YTC.feedFilters.PLAYLIST_MARKERS)) YTC.feedFilters.removePlaylists(node);
      }
    }

    if (pending.size) scheduleFlush();
  }

  function observeMutations() {
    if (!hasFeedCleanup()) return;
    if (mutationObserver) return;

    mutationObserver = new MutationObserver((records) => {
      bootstrap();
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (isElement(node)) pending.add(node);
        }
      }
      if (pending.size) scheduleFlush();
    });
    mutationObserver.observe(document, { childList: true, subtree: true });
  }

  function stopObservingMutations() {
    mutationObserver?.disconnect();
    mutationObserver = null;
    pending = new Set();
    flushScheduled = false;
  }

  /* ------------------------------------------------------------ navigation */

  function onNavigate() {
    observeGrid();
    updateColumns(true);
    if (blockShorts) {
      guardLocation();
      YTC.shorts.removeShorts(document.body || document.documentElement);
    }
    if (hideExploreTopics) YTC.topics.removeExploreMoreTopics(document.body || document.documentElement);
    if (hideMemberships) YTC.memberships.removeMemberships(document.body || document.documentElement);
    if (hideMixes) YTC.mixes.removeMixes(document.body || document.documentElement);
    if (hideLiveStreams) YTC.feedFilters.removeLiveVideos(document.body || document.documentElement);
    if (hideStartedVideos) YTC.feedFilters.removeStartedVideos(document.body || document.documentElement);
    if (hidePlaylists) YTC.feedFilters.removePlaylists(document.body || document.documentElement);
    syncWatchPageStyles();
    syncNavbarSettingsButton();
  }

  /* ----------------------------------------------------------------- api   */

  YTC.setShortsBlock = function setShortsBlock(enabled) {
    blockShorts = YTC.sanitizeBlockShorts(enabled);
    if (blockShorts) {
      injectStyle('ytc-shorts-style', YTC.SHORTS_STYLE_TEXT);
      observeMutations();
      guardLocation();
      YTC.shorts.removeShorts(document.body || document.documentElement);
    } else {
      removeStyle('ytc-shorts-style');
      stopObservingIfIdle();
    }
    return blockShorts;
  };

  YTC.setHideExploreTopics = function setHideExploreTopics(enabled) {
    hideExploreTopics = YTC.sanitizeHideExploreTopics(enabled);
    if (hideExploreTopics) {
      observeMutations();
      YTC.topics.removeExploreMoreTopics(document.body || document.documentElement);
    } else stopObservingIfIdle();
    return hideExploreTopics;
  };

  YTC.setHideMemberships = function setHideMemberships(enabled) {
    hideMemberships = YTC.sanitizeHideMemberships(enabled);
    if (hideMemberships) {
      observeMutations();
      YTC.memberships.removeMemberships(document.body || document.documentElement);
    } else stopObservingIfIdle();
    return hideMemberships;
  };

  YTC.setHideMixes = function setHideMixes(enabled) {
    hideMixes = YTC.sanitizeHideMixes(enabled);
    if (hideMixes) {
      observeMutations();
      YTC.mixes.removeMixes(document.body || document.documentElement);
    } else stopObservingIfIdle();
    return hideMixes;
  };

  YTC.setHideLiveStreams = function setHideLiveStreams(enabled) {
    hideLiveStreams = YTC.sanitizeHideLiveStreams(enabled);
    if (hideLiveStreams) {
      observeMutations();
      YTC.feedFilters.removeLiveVideos(document.body || document.documentElement);
    } else stopObservingIfIdle();
    return hideLiveStreams;
  };

  YTC.setHideStartedVideos = function setHideStartedVideos(enabled) {
    hideStartedVideos = YTC.sanitizeHideStartedVideos(enabled);
    if (hideStartedVideos) {
      observeMutations();
      YTC.feedFilters.removeStartedVideos(document.body || document.documentElement);
    } else stopObservingIfIdle();
    return hideStartedVideos;
  };

  YTC.setHidePlaylists = function setHidePlaylists(enabled) {
    hidePlaylists = YTC.sanitizeHidePlaylists(enabled);
    if (hidePlaylists) {
      observeMutations();
      YTC.feedFilters.removePlaylists(document.body || document.documentElement);
    } else stopObservingIfIdle();
    return hidePlaylists;
  };

  YTC.setHideComments = function setHideComments(enabled) {
    hideComments = YTC.sanitizeHideComments(enabled);
    syncWatchPageStyles();
    return hideComments;
  };

  YTC.setHideRecommendations = function setHideRecommendations(enabled) {
    hideRecommendations = YTC.sanitizeHideRecommendations(enabled);
    syncWatchPageStyles();
    return hideRecommendations;
  };

  YTC.setHideEndScreen = function setHideEndScreen(enabled) {
    hideEndScreen = YTC.sanitizeHideEndScreen(enabled);
    syncWatchPageStyles();
    return hideEndScreen;
  };

  YTC.setHideFilterChips = function setHideFilterChips(enabled) {
    hideFilterChips = YTC.sanitizeHideFilterChips(enabled);
    syncWatchPageStyles();
    return hideFilterChips;
  };

  YTC.setHideSidebar = function setHideSidebar(enabled) {
    hideSidebar = YTC.sanitizeHideSidebar(enabled);
    syncWatchPageStyles();
    return hideSidebar;
  };

  YTC.setHideVoiceSearch = function setHideVoiceSearch(enabled) {
    hideVoiceSearch = YTC.sanitizeHideVoiceSearch(enabled);
    syncWatchPageStyles();
    return hideVoiceSearch;
  };

  YTC.setHideCreateButton = function setHideCreateButton(enabled) {
    hideCreateButton = YTC.sanitizeHideCreateButton(enabled);
    syncWatchPageStyles();
    return hideCreateButton;
  };

  YTC.setHideNotifications = function setHideNotifications(enabled) {
    hideNotifications = YTC.sanitizeHideNotifications(enabled);
    syncWatchPageStyles();
    return hideNotifications;
  };

  YTC.setHideCountryCode = function setHideCountryCode(enabled) {
    hideCountryCode = YTC.sanitizeHideCountryCode(enabled);
    syncWatchPageStyles();
    return hideCountryCode;
  };

  YTC.setShowNavbarSettings = function setShowNavbarSettings(enabled) {
    showNavbarSettings = YTC.sanitizeShowNavbarSettings(enabled);
    syncNavbarSettingsButton();
    return showNavbarSettings;
  };

  YTC.setGridColumnsEnabled = function setGridColumnsEnabled(enabled) {
    gridColumnsEnabled = YTC.sanitizeGridColumnsEnabled(enabled);
    if (gridColumnsEnabled) {
      injectStyle('ytc-style', YTC.GRID_STYLE_TEXT);
      if (bootstrapped) updateColumns(true);
    } else {
      removeStyle('ytc-style');
      const root = document.documentElement;
      if (root) root.style.removeProperty('--ytc-columns');
      if (onColumnsApplied) onColumnsApplied(null);
    }
    return gridColumnsEnabled;
  };

  YTC.start = function start(options = {}) {
    columns = YTC.sanitizeColumns(options.columns);
    onColumnsApplied = options.onColumnsApplied || null;

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', guardLocation);
    document.addEventListener('yt-navigate-finish', onNavigate);
    document.addEventListener('yt-page-data-updated', onNavigate);
    document.addEventListener('readystatechange', bootstrap);

    observeSizes();
    bootstrap();

    for (const delay of GRID_PROBES) {
      setTimeout(() => {
        bootstrap();
        observeGrid();
        updateColumns(false);
      }, delay);
    }
  };

  YTC.setColumns = function setColumns(value) {
    columns = YTC.sanitizeColumns(value);
    return bootstrapped && gridColumnsEnabled ? updateColumns(true) : null;
  };

  YTC.HOME_URL = HOME_URL;
})(window);
