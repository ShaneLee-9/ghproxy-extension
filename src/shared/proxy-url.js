const PROXY_STORAGE_KEY = 'proxyUrl';

export function normalizeProxyUrl(value) {
  const input = String(value || '').trim();
  if (!input) throw new Error('请输入代理地址。');
  if (!/^https?:\/\//i.test(input)) {
    throw new Error('请输入以 http:// 或 https:// 开头的地址。');
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error('请输入完整的 HTTP 或 HTTPS 地址。');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('代理地址必须使用 HTTP 或 HTTPS。');
  }
  if (!url.hostname || url.username || url.password) {
    throw new Error('代理地址格式无效。');
  }
  if (url.search || url.hash) {
    throw new Error('代理地址不能包含查询参数或片段。');
  }

  const path = url.pathname.replace(/\/+$/, '');
  return `${url.origin}${path}`;
}

export async function getSavedProxyUrl() {
  const result = await browser.storage.local.get(PROXY_STORAGE_KEY);
  if (!result[PROXY_STORAGE_KEY]) return '';
  try {
    return normalizeProxyUrl(result[PROXY_STORAGE_KEY]);
  } catch {
    return '';
  }
}

export async function saveProxyUrl(value) {
  const proxyUrl = normalizeProxyUrl(value);
  await browser.storage.local.set({ [PROXY_STORAGE_KEY]: proxyUrl });
  return proxyUrl;
}

export function transformGitHubUrl(originalUrl) {
  try {
    const url = new URL(originalUrl);
    const { hostname, pathname } = url;

    if (hostname === 'codeload.github.com') {
      const match = pathname.match(/^\/([^/]+)\/([^/]+)\/(zip|tar\.gz)\/(.+)$/);
      if (!match) return null;
      const [, user, repo, format, ref] = match;
      const extension = format === 'zip' ? '.zip' : '.tar.gz';
      return `https://github.com/${user}/${repo}/archive/${ref}${extension}`;
    }

    if (hostname === 'github.com' && pathname.includes('/blob/')) {
      return `https://github.com${pathname.replace('/blob/', '/raw/')}${url.search}${url.hash}`;
    }

    if (hostname === 'raw.githubusercontent.com' || hostname === 'gist.githubusercontent.com') {
      return originalUrl;
    }

    if (hostname === 'github.com' && (
      pathname.includes('/releases/download/') ||
      pathname.includes('/releases/latest/download/') ||
      pathname.includes('/archive/') ||
      pathname.includes('/raw/')
    )) {
      return originalUrl;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getProxyUrl(originalUrl) {
  const proxyBase = await getSavedProxyUrl();
  if (!proxyBase) return null;

  const transformed = transformGitHubUrl(originalUrl);
  if (transformed) return `${proxyBase}/${transformed}`;

  try {
    const url = new URL(originalUrl);
    const hostname = url.hostname.toLowerCase();
    const isGitHubHost = hostname === 'github.com' || hostname.endsWith('.github.com') ||
      hostname === 'codeload.github.com' || hostname === 'raw.githubusercontent.com' ||
      hostname === 'gist.githubusercontent.com';
    if ((url.protocol === 'http:' || url.protocol === 'https:') && isGitHubHost) {
      return `${proxyBase}/${originalUrl}`;
    }
  } catch {
    return null;
  }
  return null;
}
