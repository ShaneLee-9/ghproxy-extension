# Handoff

Updated: 2026-11-25

## Current state

- The browser extension now uses a user-configured fixed proxy URL stored as `proxyUrl` in `chrome.storage.local`.
- Supported GitHub download navigations redirect directly to the configured proxy. There is no intermediate confirmation page.
- If no valid proxy URL is configured, the original GitHub navigation continues normally.
- Right-click actions still copy a proxy URL or open it in a new tab.
- The extension version is `2.0.0` in both browser manifests. This is a major version because the automatic node selection flow and confirmation flow were removed.
- The independent Tampermonkey/Violentmonkey script was not migrated; it still has its previous node selection and speed-test behavior.

## Main implementation files

- `src/shared/proxy-url.js`: validates and normalizes proxy URLs, preserves configured path prefixes, transforms supported GitHub URLs, and provides the shared proxy URL builder.
- `src/popup/popup.html` and `src/popup/popup.js`: fixed proxy address form, save feedback, and saved address display.
- `src/background/background.js`: direct navigation redirection, context menus, local usage history, and legacy storage cleanup. Proxy selection, speed tests, location checks, and intercept-page routing have been removed.
- `manifest.json` and `manifest-firefox.json`: synchronized version and removal of node-testing permissions/site bridge; the statistics options page and its announcement permission remain.
- `src/pages/privacy.html`, `PRIVACY.md`, and `README.md`: updated descriptions of the fixed-proxy extension behavior.
- `src/content/site-bridge.js`, `src/pages/intercept.html`, and `src/pages/intercept.js`: removed because the extension no longer uses the site node bridge or confirmation page.

## User verification still needed

No test, build, lint, type-check, or browser verification was run. The user requested to run these checks themselves.

After reloading the extension, manually confirm:

1. Save a proxy URL, close and reopen the popup, and confirm it persists.
2. Try an empty or invalid URL and confirm it is rejected; try a URL with a path prefix and confirm the path is retained.
3. Open Release, Archive/codeload, Raw, and Gist download links and confirm the current tab redirects directly to the expected proxy URL.
4. Confirm a GitHub download continues directly when no proxy is configured.
5. Confirm right-click copy/open and IDM behavior still work in the user's setup.
6. Confirm no node-list or speed-test requests are made by the extension.

## Git submission

The working branch is `main`. `origin` points to the personal fork and `upstream` points to `https://github.com/hubporg/ghproxy-extension.git`. The current changes are uncommitted.

Review the diff and status first. After the user completes their manual verification, stage the intended files and create one cohesive breaking-change commit, for example:

```bash
git status --short
git diff
git add AGENTS.md HANDOFF.md writing-block.md README.md PRIVACY.md manifest.json manifest-firefox.json src/background/background.js src/background/stats.js src/content/site-bridge.js src/pages/intercept.html src/pages/intercept.js src/pages/privacy.html src/popup/popup.html src/popup/popup.js src/shared/proxy-url.js
git commit -m "feat!: use fixed proxy redirects"
```

Before pushing, follow the repository's upstream rebase workflow:

```bash
git fetch upstream
git rebase upstream/main
git push --force-with-lease origin main
```

Rebase rewrites local commit history. Resolve conflicts by preserving both upstream behavior and this fork's fixed-proxy behavior; do not force-push without `--force-with-lease`.
