import '../lib/browser-polyfill.js';
import '../shared/link-patterns.js';
import { getProxyUrl } from '../shared/proxy-url.js';
import * as stats from './stats.js';

const LINK_PATTERNS = globalThis.__GHX_LINK_PATTERNS__;
const USAGE_LOG_KEY = 'gh_accelerator_usage_log';
const USAGE_LOG_MAX = 50;

let coreFeaturesStarted = false;
const recentlyHandled = new Map();
let usageLogQueue = Promise.resolve();

function parseTarget(url) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const hostname = parsed.hostname.toLowerCase();
    let repo;
    if (hostname === 'gist.githubusercontent.com') {
      repo = segments[0] ? `gist/${segments[0]}` : 'gist';
    } else if (hostname === 'github.com' || hostname.endsWith('.github.com') || hostname === 'raw.githubusercontent.com') {
      repo = segments.length >= 2 ? `${segments[0]}/${segments[1]}` : (segments[0] || hostname);
    } else {
      repo = hostname;
    }
    const file = segments.length ? decodeURIComponent(segments[segments.length - 1]) : repo;
    return { repo, file };
  } catch {
    return { repo: '', file: url || '' };
  }
}

function appendUsageLog(entry) {
  usageLogQueue = usageLogQueue.then(async () => {
    const stored = await browser.storage.local.get(USAGE_LOG_KEY);
    const log = Array.isArray(stored[USAGE_LOG_KEY]) ? stored[USAGE_LOG_KEY] : [];
    const parsed = parseTarget(entry.url || '');
    log.unshift({
      ts: Date.now(),
      type: entry.type || 'unknown',
      repo: entry.repo || parsed.repo,
      file: entry.file || parsed.file,
      url: entry.url || '',
      ok: entry.ok !== false
    });
    if (log.length > USAGE_LOG_MAX) log.length = USAGE_LOG_MAX;
    await browser.storage.local.set({ [USAGE_LOG_KEY]: log });
  }).catch((error) => console.warn('[GitHub Accelerator] 记录使用日志失败:', error));
  return usageLogQueue;
}

async function routeDownload(tabId, url) {
  if (!coreFeaturesStarted) return 'replay';

  const now = Date.now();
  const proxyUrl = await getProxyUrl(url);
  if (!proxyUrl) return 'replay';

  const dedupeKey = `${tabId === undefined ? 'unknown' : tabId}:${url}`;
  const lastHandled = recentlyHandled.get(dedupeKey);
  if (lastHandled && now - lastHandled < 800) return 'done';
  if (recentlyHandled.size > 500) recentlyHandled.clear();
  recentlyHandled.set(dedupeKey, now);

  if (tabId === undefined) return 'replay';
  await browser.tabs.update(tabId, { url: proxyUrl });
  stats.incrementJumpCount().catch(error => console.warn('[Stats] 计数失败:', error));
  appendUsageLog({ type: 'accelerate', url });
  return 'done';
}

function isDownloadUrl(value) {
  try {
    const parsed = new URL(value);
    return LINK_PATTERNS.isGitHubHostname(parsed.hostname) && LINK_PATTERNS.isGitHubDownloadUrl(value);
  } catch {
    return false;
  }
}

function isGitHubUrl(value) {
  try {
    return LINK_PATTERNS.isGitHubHostname(new URL(value).hostname);
  } catch {
    return false;
  }
}

function setupNavigationListener() {
  browser.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId !== 0 || !isDownloadUrl(details.url)) return;
    routeDownload(details.tabId, details.url).catch(error => {
      console.warn('[GitHub Accelerator] 拦截处理失败:', error);
    });
  });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return false;

  if (message.type === 'PRIVACY_ACCEPTED') {
    startCoreFeatures();
    sendResponse({ success: true });
    return false;
  }
  if (message.type === 'PRIVACY_REJECTED') {
    sendResponse({ success: true });
    return false;
  }
  if (message.type === 'GET_INTERCEPT_STATE') {
    sendResponse({ active: coreFeaturesStarted });
    return false;
  }
  if (message.type === 'LOG_USAGE') {
    appendUsageLog(message.entry || {});
    sendResponse({ success: true });
    return false;
  }
  if (message.type === 'INTERCEPT_DOWNLOAD') {
    const tabId = sender.tab && sender.tab.id;
    if (tabId === undefined || !isDownloadUrl(message.url)) {
      sendResponse({ action: 'replay' });
      return false;
    }
    routeDownload(tabId, message.url)
      .then(action => sendResponse({ action }))
      .catch(() => sendResponse({ action: 'replay' }));
    return true;
  }
  return false;
});

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    stats.incrementInstallCount().catch(error => console.warn('[Stats] 安装计数失败:', error));
  }
});

async function initialize() {
  try {
    const oldUsage = await browser.storage.local.get(USAGE_LOG_KEY);
    if (Array.isArray(oldUsage[USAGE_LOG_KEY]) && oldUsage[USAGE_LOG_KEY].some((entry) => (
      entry && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, 'node')
    ))) {
      const cleanedUsage = oldUsage[USAGE_LOG_KEY].map((entry) => {
        if (!entry || typeof entry !== 'object') return entry;
        const clean = { ...entry };
        delete clean.node;
        return clean;
      });
      await browser.storage.local.set({ [USAGE_LOG_KEY]: cleanedUsage });
    }
    await browser.storage.local.remove([
      'gh_accelerator_best_node',
      'gh_accelerator_node_list',
      'gh_accelerator_node_list_at',
      'gh_accelerator_custom_nodes',
      'gh_accelerator_always_accelerate'
    ]);
    const result = await browser.storage.local.get('privacy_accepted');
    if (result.privacy_accepted === undefined) {
      await browser.tabs.create({ url: browser.runtime.getURL('src/pages/privacy.html') });
    }
    if (result.privacy_accepted === true) startCoreFeatures();
    stats.startReportScheduler();
  } catch (error) {
    console.error('[GitHub Accelerator] 初始化失败:', error);
  }
}

function startCoreFeatures() {
  if (coreFeaturesStarted) return;
  coreFeaturesStarted = true;
  createContextMenus().catch(error => console.warn('[GitHub Accelerator] 创建右键菜单失败:', error));
  setupNavigationListener();
  setupContextMenuHandler();
}

async function createContextMenus() {
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({
    id: 'github-accelerator-copy',
    title: '复制 GitHub 代理链接',
    contexts: ['link', 'selection']
  });
  browser.contextMenus.create({
    id: 'github-accelerator-open',
    title: '打开 GitHub 代理链接（新标签页）',
    contexts: ['link', 'selection']
  });
}

function setupContextMenuHandler() {
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const originalUrl = info.linkUrl || info.selectionText;
    if (!originalUrl || !isGitHubUrl(originalUrl)) {
      if (tab && tab.id !== undefined) showNotification(tab.id, '请选择 GitHub 下载链接', 'error');
      return;
    }

    const proxyUrl = await getProxyUrl(originalUrl).catch(() => null);
    if (!proxyUrl) {
      if (tab && tab.id !== undefined) showNotification(tab.id, '请先在扩展弹窗中设置代理地址', 'error');
      return;
    }

    if (info.menuItemId === 'github-accelerator-copy') {
      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: (value) => {
            const fallback = () => {
              const textarea = document.createElement('textarea');
              textarea.value = value;
              textarea.style.cssText = 'position:fixed;left:-9999px;top:0';
              document.body.appendChild(textarea);
              textarea.select();
              const copied = document.execCommand('copy');
              textarea.remove();
              if (!copied) throw new Error('clipboard unavailable');
            };
            return navigator.clipboard && navigator.clipboard.writeText
              ? navigator.clipboard.writeText(value).catch(fallback)
              : fallback();
          },
          args: [proxyUrl]
        });
        showNotification(tab.id, '代理链接已复制', 'success');
        appendUsageLog({ type: 'copy', url: originalUrl });
      } catch (error) {
        showNotification(tab.id, '复制失败', 'error');
      }
    } else if (info.menuItemId === 'github-accelerator-open') {
      await browser.tabs.create({ url: proxyUrl });
      if (tab && tab.id !== undefined) showNotification(tab.id, '正在打开代理链接', 'info');
      appendUsageLog({ type: 'open', url: originalUrl });
    }
  });
}

function showNotification(tabId, message, type) {
  if (tabId === undefined) return;
  const colors = { success: '#176b4b', error: '#a33a32', info: '#355b76' };
  browser.scripting.executeScript({
    target: { tabId },
    func: (text, color) => {
      const old = document.getElementById('ghx-proxy-toast');
      if (old) old.remove();
      const toast = document.createElement('div');
      toast.id = 'ghx-proxy-toast';
      toast.textContent = text;
      toast.style.cssText = `position:fixed;z-index:2147483647;top:20px;right:20px;padding:12px 16px;border-radius:8px;background:${color};color:#fff;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 16px #0003`;
      document.documentElement.appendChild(toast);
      setTimeout(() => toast.remove(), 2400);
    },
    args: [message, colors[type] || colors.info]
  }).catch(() => {});
}

initialize();
