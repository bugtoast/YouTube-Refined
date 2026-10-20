/** Bridge to extension APIs. All chrome.* calls live here; core modules stay chrome-free. */
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
  const HIDE_VOICE_SEARCH_KEY = 'hideVoiceSearch';
  const HIDE_CREATE_BUTTON_KEY = 'hideCreateButton';
  const HIDE_NOTIFICATIONS_KEY = 'hideNotifications';
  const HIDE_COUNTRY_CODE_KEY = 'hideCountryCode';
  const SHOW_NAVBAR_SETTINGS_KEY = 'showNavbarSettings';
  const GRID_COLUMNS_ENABLED_KEY = 'gridColumnsEnabled';
  const HINT_KEY = 'gridHint';

  let lastHint = '';

  function reportHint(result) {
    const hint = result ? `${result.wanted}:${result.effective}` : '';
    if (hint === lastHint) return;
    lastHint = hint;
    chrome.storage.local.set({ [HINT_KEY]: hint }).catch(() => {});
  }

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
      [HIDE_VOICE_SEARCH_KEY]: YTC.DEFAULT_HIDE_VOICE_SEARCH,
      [HIDE_CREATE_BUTTON_KEY]: YTC.DEFAULT_HIDE_CREATE_BUTTON,
      [HIDE_NOTIFICATIONS_KEY]: YTC.DEFAULT_HIDE_NOTIFICATIONS,
      [HIDE_COUNTRY_CODE_KEY]: YTC.DEFAULT_HIDE_COUNTRY_CODE,
      [SHOW_NAVBAR_SETTINGS_KEY]: YTC.DEFAULT_SHOW_NAVBAR_SETTINGS,
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
      YTC.setHideVoiceSearch(stored[HIDE_VOICE_SEARCH_KEY]);
      YTC.setHideCreateButton(stored[HIDE_CREATE_BUTTON_KEY]);
      YTC.setHideNotifications(stored[HIDE_NOTIFICATIONS_KEY]);
      YTC.setHideCountryCode(stored[HIDE_COUNTRY_CODE_KEY]);
      YTC.setShowNavbarSettings(stored[SHOW_NAVBAR_SETTINGS_KEY]);
    })
    .catch(() => {
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
      YTC.setHideVoiceSearch(YTC.DEFAULT_HIDE_VOICE_SEARCH);
      YTC.setHideCreateButton(YTC.DEFAULT_HIDE_CREATE_BUTTON);
      YTC.setHideNotifications(YTC.DEFAULT_HIDE_NOTIFICATIONS);
      YTC.setHideCountryCode(YTC.DEFAULT_HIDE_COUNTRY_CODE);
      YTC.setShowNavbarSettings(YTC.DEFAULT_SHOW_NAVBAR_SETTINGS);
    });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (STORAGE_KEY in changes) YTC.setColumns(changes[STORAGE_KEY].newValue);
    if (GRID_COLUMNS_ENABLED_KEY in changes) YTC.setGridColumnsEnabled(changes[GRID_COLUMNS_ENABLED_KEY].newValue);
    if (BLOCK_SHORTS_KEY in changes) YTC.setShortsBlock(changes[BLOCK_SHORTS_KEY].newValue);
    if (HIDE_EXPLORE_TOPICS_KEY in changes) YTC.setHideExploreTopics(changes[HIDE_EXPLORE_TOPICS_KEY].newValue);
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
    if (HIDE_VOICE_SEARCH_KEY in changes) YTC.setHideVoiceSearch(changes[HIDE_VOICE_SEARCH_KEY].newValue);
    if (HIDE_CREATE_BUTTON_KEY in changes) YTC.setHideCreateButton(changes[HIDE_CREATE_BUTTON_KEY].newValue);
    if (HIDE_NOTIFICATIONS_KEY in changes) YTC.setHideNotifications(changes[HIDE_NOTIFICATIONS_KEY].newValue);
    if (HIDE_COUNTRY_CODE_KEY in changes) YTC.setHideCountryCode(changes[HIDE_COUNTRY_CODE_KEY].newValue);
    if (SHOW_NAVBAR_SETTINGS_KEY in changes) YTC.setShowNavbarSettings(changes[SHOW_NAVBAR_SETTINGS_KEY].newValue);
  });
})();
