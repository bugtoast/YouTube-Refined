/**
 * Column limits, defaults and the responsive maths.
 *
 * Pure values with no DOM or extension API dependency, so the popup, the
 * content script and the tests all share one source of truth.
 */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  YTC.MIN_COLUMNS = 1;
  YTC.MAX_COLUMNS = 10;
  YTC.DEFAULT_COLUMNS = 4;

  /** Blocking is on unless the stored value says otherwise. */
  YTC.DEFAULT_BLOCK_SHORTS = true;

  /** Anything that isn't explicitly false leaves blocking on. */
  YTC.sanitizeBlockShorts = (value) => value !== false;

  /** Topic shelves stay visible unless the user explicitly opts out. */
  YTC.DEFAULT_HIDE_EXPLORE_TOPICS = false;
  YTC.sanitizeHideExploreTopics = (value) => value === true;

  /** Membership shelves stay visible unless the user explicitly opts out. */
  YTC.DEFAULT_HIDE_MEMBERSHIPS = false;
  YTC.sanitizeHideMemberships = (value) => value === true;

  /** Mix playlists stay visible unless the user explicitly opts out. */
  YTC.DEFAULT_HIDE_MIXES = false;
  YTC.sanitizeHideMixes = (value) => value === true;

  YTC.DEFAULT_HIDE_LIVE_STREAMS = false;
  YTC.sanitizeHideLiveStreams = (value) => value === true;

  YTC.DEFAULT_HIDE_STARTED_VIDEOS = false;
  YTC.sanitizeHideStartedVideos = (value) => value === true;

  YTC.DEFAULT_HIDE_PLAYLISTS = false;
  YTC.sanitizeHidePlaylists = (value) => value === true;

  YTC.DEFAULT_HIDE_COMMENTS = false;
  YTC.sanitizeHideComments = (value) => value === true;

  YTC.DEFAULT_HIDE_RECOMMENDATIONS = false;
  YTC.sanitizeHideRecommendations = (value) => value === true;

  YTC.DEFAULT_HIDE_END_SCREEN = false;
  YTC.sanitizeHideEndScreen = (value) => value === true;

  /** Filter chip bar stays visible unless the user explicitly opts out. */
  YTC.DEFAULT_HIDE_FILTER_CHIPS = false;
  YTC.sanitizeHideFilterChips = (value) => value === true;

  /** Left sidebar stays visible unless the user explicitly opts out. */
  YTC.DEFAULT_HIDE_SIDEBAR = false;
  YTC.sanitizeHideSidebar = (value) => value === true;

  /** Grid column override is on by default. */
  YTC.DEFAULT_GRID_COLUMNS_ENABLED = true;
  YTC.sanitizeGridColumnsEnabled = (value) => value !== false;

  /** Navbar customizations. */
  YTC.DEFAULT_HIDE_VOICE_SEARCH = false;
  YTC.sanitizeHideVoiceSearch = (value) => value === true;

  YTC.DEFAULT_HIDE_CREATE_BUTTON = false;
  YTC.sanitizeHideCreateButton = (value) => value === true;

  YTC.DEFAULT_HIDE_NOTIFICATIONS = false;
  YTC.sanitizeHideNotifications = (value) => value === true;

  YTC.DEFAULT_HIDE_COUNTRY_CODE = false;
  YTC.sanitizeHideCountryCode = (value) => value === true;

  YTC.DEFAULT_SHOW_NAVBAR_SETTINGS = false;
  YTC.sanitizeShowNavbarSettings = (value) => value === true;

  /** Below this card width thumbnails stop being recognisable, so we clamp. */
  YTC.MIN_CARD_WIDTH = 150;

  /** Coerces anything (undefined, NaN, "6", 4.6, 99) into a legal column count. */
  YTC.sanitizeColumns = function sanitizeColumns(value) {
    const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(n)) return YTC.DEFAULT_COLUMNS;
    return Math.min(YTC.MAX_COLUMNS, Math.max(YTC.MIN_COLUMNS, Math.round(n)));
  };

  /**
   * The number of columns actually shown for a given grid width: the requested
   * count, lowered when the grid is too narrow to keep cards readable.
   * Always returns at least one column so the layout can never collapse.
   */
  YTC.effectiveColumns = function effectiveColumns(desired, availableWidth) {
    const columns = YTC.sanitizeColumns(desired);
    const width = Number(availableWidth);
    if (!Number.isFinite(width) || width <= 0) return columns;
    const maxThatFit = Math.floor(width / YTC.MIN_CARD_WIDTH);
    return Math.max(YTC.MIN_COLUMNS, Math.min(columns, maxThatFit));
  };
})(window);
