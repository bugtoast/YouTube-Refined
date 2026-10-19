/**
 * Blocks Shorts at the network layer.
 *
 * declarativeNetRequest redirects Shorts navigations to the homepage before a
 * request is ever sent, which covers bookmarks, shared links, middle-click and
 * any route the page script might miss. The content script still guards the
 * same URLs, so the extension degrades safely if this rule is unavailable.
 */

const RULE_ID = 1;
const BLOCK_SHORTS_KEY = 'blockShorts';
let syncQueue = Promise.resolve();

/**
 * Matches /shorts/…, /reel/… and channel Shorts tabs such as /@name/shorts
 * on any youtube.com host, but not a search for the word "shorts".
 */
const SHORTS_URL_REGEX =
  '^https?://([a-z0-9-]+\\.)*youtube\\.com/(?:[^/?#]+/)*(?:shorts|reel)(?:/|[?#]|$)';

function buildRule() {
  return {
    id: RULE_ID,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        transform: {
          scheme: 'https',
          host: 'www.youtube.com',
          path: '/',
          query: '',
        },
      },
    },
    condition: { regexFilter: SHORTS_URL_REGEX, resourceTypes: ['main_frame'] },
  };
}

/** Installs or removes the rule to match the stored preference. */
async function syncRules() {
  const { [BLOCK_SHORTS_KEY]: blockShorts = true } = await chrome.storage.sync.get({
    [BLOCK_SHORTS_KEY]: true,
  });

  const existing = await chrome.declarativeNetRequest.getDynamicRules();

  if (!blockShorts) {
    if (existing.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map((rule) => rule.id),
      });
    }
    return;
  }

  const current = existing.find((rule) => rule.id === RULE_ID);
  const transform = current?.action?.redirect?.transform;
  const ruleIsCurrent =
    existing.length === 1 &&
    current?.priority === 1 &&
    current.action?.type === 'redirect' &&
    transform?.scheme === 'https' &&
    transform.host === 'www.youtube.com' &&
    transform.path === '/' &&
    transform.query === '' &&
    current.condition?.regexFilter === SHORTS_URL_REGEX &&
    current.condition.resourceTypes?.length === 1 &&
    current.condition.resourceTypes[0] === 'main_frame';
  if (ruleIsCurrent) return;

  // Dynamic rules persist across extension updates. Remove the persisted rule
  // in a completed update before reusing RULE_ID, so Chrome cannot reject a
  // replacement as a duplicate.
  if (existing.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map((rule) => rule.id),
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [buildRule()] });
}

/** Serializes lifecycle and preference events so they cannot race on rule IDs. */
function runSync() {
  syncQueue = syncQueue
    .then(syncRules)
    .catch((error) => console.error('[youtube-refined] rule sync failed', error));
  return syncQueue;
}

chrome.runtime.onInstalled.addListener(runSync);
chrome.runtime.onStartup.addListener(runSync);

// Flipping the popup toggle has to reach the network rule too.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && BLOCK_SHORTS_KEY in changes) runSync();
});

runSync();
