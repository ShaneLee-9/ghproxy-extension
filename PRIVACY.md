# Privacy Policy

GitHub Accelerator lets you configure one fixed HTTP or HTTPS proxy URL. The extension stores that URL locally with `storage.local`.

The extension does not fetch a proxy list, test proxy latency, detect your location, or download GitHub files itself. When a proxy URL is configured, supported GitHub download navigations are redirected to a URL built from your proxy base and the transformed GitHub URL. The proxy service receives the request and the information normally sent by your browser. Review the proxy provider’s privacy policy and use a service you trust.

## Local data

| Data | Storage | Purpose |
| --- | --- | --- |
| `proxyUrl` | `storage.local` | The fixed proxy address you entered |
| `gh_accelerator_usage_log` | `storage.local` | A local history of recent proxy actions |
| Privacy consent and aggregate counters | `storage.local` | Remember consent and, when consented, report aggregate extension counts |

The extension does not sync these values between devices.

## Optional aggregate statistics

After you accept the privacy page, the extension maintains aggregate counts of installs/updates and proxy redirects. It may send those counts, browser type, extension version, and timestamp to the analytics service below. It does not send the GitHub URL, file name, or proxy URL in this report. The local action history is not uploaded.

## Permissions and network requests

| Permission or destination | Purpose |
| --- | --- |
| `storage` | Save the proxy URL, consent, and local counters |
| `contextMenus` | Offer copy/open proxy-link actions from the right-click menu |
| `scripting` | Show a small in-page result message for context-menu actions |
| `webNavigation` | Detect supported GitHub download navigation |
| GitHub domains | Recognize and intercept supported GitHub download links |
| `hubp.tbedu.top` | Fetch announcements shown on the extension options page |
| `addon-analytics.hubp.org` | Submit optional aggregate usage counts |
| `addon-analytics-hubp.tbedu.top` | Fallback endpoint for aggregate usage counts |
| Your configured proxy host | Receive redirected requests for supported GitHub download links |

The extension does not require host permissions for your proxy provider; the browser performs the navigation.

## Changes

The extension code is open source. You can inspect the current implementation in this repository.
