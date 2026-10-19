/**
 * The only file that talks to extension APIs. Everything else works against
 * a plain page, which keeps the interesting logic in the core modules.
 */
(function () {
  const YTC = window.YTC;

  const STORAGE_KEY = 'columns';
  const BLOCK_SHORTS_KEY = 'blockShorts';
  const HIDE_EXPLORE_TOPICS_KEY = 'hideExploreTopics';
  const HIDE_MEMBERSHIPS_KEY = 'hideMemberships';
  const HIDE_MIXES_KEY = 'hideMixes';
  const HIDE_LIVE_STREAMS_KEY = 'hideLiveStreams';
  const HIDE_STARTED_VIDEOS_KEY = 'hideStartedVideos';
  const HIDE_PLAYLISTS_KEY = 'hidePlaylists';
  const HIDE_COMMENTS_KEY = 'hideComments';
  const HIDE_RECOMMENDATIONS_KEY = 'hideRecommendations';
  const HIDE_END_SCREEN_KEY = 'hideEndScreen';
  const HIDE_FILTER_CHIPS_KEY = 'hideFilterChips';
  const HIDE_SIDEBAR_KEY = 'hideSidebar';
  const GRID_COLUMNS_ENABLED_KEY = 'gridColumnsEnabled';
  /** Reported by the page so the popup can explain a clamped layout. */
  const HINT_KEY = 'gridHint';

  let lastHint = '';

  function reportHint(result) {
    const hint = result ? `${result.wanted}:${result.effective}` : '';
    if (hint === lastHint) return;
    lastHint = hint;
    chrome.storage.local.set({ [HINT_KEY]: hint }).catch(() => {});
  }

  // The grid applies immediately on the default so the first paint is already
  // laid out. Blocking is deliberately left unset: storage resolves in a few
  // milliseconds, and assuming "on" in the meantime would redirect a page the
  // user has switched Shorts off.
  YTC.start({ columns: YTC.DEFAULT_COLUMNS, onColumnsApplied: reportHint });

  chrome.storage.sync
    .get({
      [STORAGE_KEY]: YTC.DEFAULT_COLUMNS,
      [BLOCK_SHORTS_KEY]: YTC.DEFAULT_BLOCK_SHORTS,
      [HIDE_EXPLORE_TOPICS_KEY]: YTC.DEFAULT_HIDE_EXPLORE_TOPICS,
      [HIDE_MEMBERSHIPS_KEY]: YTC.DEFAULT_HIDE_MEMBERSHIPS,
      [HIDE_MIXES_KEY]: YTC.DEFAULT_HIDE_MIXES,
      [HIDE_LIVE_STREAMS_KEY]: YTC.DEFAULT_HIDE_LIVE_STREAMS,
      [HIDE_STARTED_VIDEOS_KEY]: YTC.DEFAULT_HIDE_STARTED_VIDEOS,
      [HIDE_PLAYLISTS_KEY]: YTC.DEFAULT_HIDE_PLAYLISTS,
      [HIDE_COMMENTS_KEY]: YTC.DEFAULT_HIDE_COMMENTS,
      [HIDE_RECOMMENDATIONS_KEY]: YTC.DEFAULT_HIDE_RECOMMENDATIONS,
      [HIDE_END_SCREEN_KEY]: YTC.DEFAULT_HIDE_END_SCREEN,
      [HIDE_FILTER_CHIPS_KEY]: YTC.DEFAULT_HIDE_FILTER_CHIPS,
      [HIDE_SIDEBAR_KEY]: YTC.DEFAULT_HIDE_SIDEBAR,
      [GRID_COLUMNS_ENABLED_KEY]: YTC.DEFAULT_GRID_COLUMNS_ENABLED,
    })
    .then((stored) => {
      YTC.setColumns(stored[STORAGE_KEY]);
      YTC.setGridColumnsEnabled(stored[GRID_COLUMNS_ENABLED_KEY]);
      YTC.setShortsBlock(stored[BLOCK_SHORTS_KEY]);
      YTC.setHideExploreTopics(stored[HIDE_EXPLORE_TOPICS_KEY]);
      YTC.setHideMemberships(stored[HIDE_MEMBERSHIPS_KEY]);
      YTC.setHideMixes(stored[HIDE_MIXES_KEY]);
      YTC.setHideLiveStreams(stored[HIDE_LIVE_STREAMS_KEY]);
      YTC.setHideStartedVideos(stored[HIDE_STARTED_VIDEOS_KEY]);
      YTC.setHidePlaylists(stored[HIDE_PLAYLISTS_KEY]);
      YTC.setHideComments(stored[HIDE_COMMENTS_KEY]);
      YTC.setHideRecommendations(stored[HIDE_RECOMMENDATIONS_KEY]);
      YTC.setHideEndScreen(stored[HIDE_END_SCREEN_KEY]);
      YTC.setHideFilterChips(stored[HIDE_FILTER_CHIPS_KEY]);
      YTC.setHideSidebar(stored[HIDE_SIDEBAR_KEY]);
    })
    .catch(() => {
      // Storage unavailable: fall back to the defaults rather than leaving the
      // page without any blocking at all.
      YTC.setColumns(YTC.DEFAULT_COLUMNS);
      YTC.setGridColumnsEnabled(YTC.DEFAULT_GRID_COLUMNS_ENABLED);
      YTC.setShortsBlock(YTC.DEFAULT_BLOCK_SHORTS);
      YTC.setHideExploreTopics(YTC.DEFAULT_HIDE_EXPLORE_TOPICS);
      YTC.setHideMemberships(YTC.DEFAULT_HIDE_MEMBERSHIPS);
      YTC.setHideMixes(YTC.DEFAULT_HIDE_MIXES);
      YTC.setHideLiveStreams(YTC.DEFAULT_HIDE_LIVE_STREAMS);
      YTC.setHideStartedVideos(YTC.DEFAULT_HIDE_STARTED_VIDEOS);
      YTC.setHidePlaylists(YTC.DEFAULT_HIDE_PLAYLISTS);
      YTC.setHideComments(YTC.DEFAULT_HIDE_COMMENTS);
      YTC.setHideRecommendations(YTC.DEFAULT_HIDE_RECOMMENDATIONS);
      YTC.setHideEndScreen(YTC.DEFAULT_HIDE_END_SCREEN);
      YTC.setHideFilterChips(YTC.DEFAULT_HIDE_FILTER_CHIPS);
      YTC.setHideSidebar(YTC.DEFAULT_HIDE_SIDEBAR);
    });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (STORAGE_KEY in changes) YTC.setColumns(changes[STORAGE_KEY].newValue);
    if (GRID_COLUMNS_ENABLED_KEY in changes) YTC.setGridColumnsEnabled(changes[GRID_COLUMNS_ENABLED_KEY].newValue);
    if (BLOCK_SHORTS_KEY in changes) YTC.setShortsBlock(changes[BLOCK_SHORTS_KEY].newValue);
    if (HIDE_EXPLORE_TOPICS_KEY in changes) {
      YTC.setHideExploreTopics(changes[HIDE_EXPLORE_TOPICS_KEY].newValue);
    }
    if (HIDE_MEMBERSHIPS_KEY in changes) YTC.setHideMemberships(changes[HIDE_MEMBERSHIPS_KEY].newValue);
    if (HIDE_MIXES_KEY in changes) YTC.setHideMixes(changes[HIDE_MIXES_KEY].newValue);
    if (HIDE_LIVE_STREAMS_KEY in changes) YTC.setHideLiveStreams(changes[HIDE_LIVE_STREAMS_KEY].newValue);
    if (HIDE_STARTED_VIDEOS_KEY in changes) YTC.setHideStartedVideos(changes[HIDE_STARTED_VIDEOS_KEY].newValue);
    if (HIDE_PLAYLISTS_KEY in changes) YTC.setHidePlaylists(changes[HIDE_PLAYLISTS_KEY].newValue);
    if (HIDE_COMMENTS_KEY in changes) YTC.setHideComments(changes[HIDE_COMMENTS_KEY].newValue);
    if (HIDE_RECOMMENDATIONS_KEY in changes) YTC.setHideRecommendations(changes[HIDE_RECOMMENDATIONS_KEY].newValue);
    if (HIDE_END_SCREEN_KEY in changes) YTC.setHideEndScreen(changes[HIDE_END_SCREEN_KEY].newValue);
    if (HIDE_FILTER_CHIPS_KEY in changes) YTC.setHideFilterChips(changes[HIDE_FILTER_CHIPS_KEY].newValue);
    if (HIDE_SIDEBAR_KEY in changes) YTC.setHideSidebar(changes[HIDE_SIDEBAR_KEY].newValue);
  });
})();
