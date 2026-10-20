/** Blocks Shorts at the network layer using declarativeNetRequest. */

const RULE_ID = 1;
const BLOCK_SHORTS_KEY = 'blockShorts';
let syncQueue = Promise.resolve();

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

  if (existing.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map((rule) => rule.id),
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [buildRule()] });
}

function runSync() {
  syncQueue = syncQueue
    .then(syncRules)
    .catch((error) => console.error('[youtube-refined] rule sync failed', error));
  return syncQueue;
}

chrome.runtime.onInstalled.addListener(runSync);
chrome.runtime.onStartup.addListener(runSync);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && BLOCK_SHORTS_KEY in changes) runSync();
});

runSync();
