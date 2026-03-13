# Privacy Policy — Nu Tab

**Last updated: March 13, 2026**

## Overview

Nu Tab is a Chrome browser extension that replaces your new tab page with a personal dashboard featuring a clock, favourite links, live weather, sticky notes, and a URL search bar.

We are committed to your privacy. This policy explains exactly what data is accessed, how it is used, and what is never done with it.

---

## Data We Access

### Browser History (`history` permission)

- **What:** Your local browsing history is queried as you type in the URL bar.
- **Why:** To provide autocomplete suggestions relevant to sites you have previously visited.
- **How:** Queries are made in real time using Chrome's built-in `chrome.history.search` API. Results are displayed in the dropdown and immediately discarded — they are never stored, transmitted, or logged.

### Top Sites (`topSites` permission)

- **What:** Chrome's list of your most frequently visited sites (up to 20 entries).
- **Why:** To seed the URL bar autocomplete with relevant suggestions.
- **How:** The list is fetched once per page load, held in memory for the duration of that tab session, and never written to disk or sent anywhere.

### Extension Storage (`storage` permission)

- **What:** Your extension settings (clock format, favourite links, weather locations) and sticky note content.
- **Why:** To persist your configuration and notes across new tab sessions.
- **How:** All data is stored locally on your device using `chrome.storage.local`. It never leaves your browser.

---

## Data We Do NOT Collect

- We do not collect, transmit, or share any personal data.
- We do not have any servers, analytics pipelines, or telemetry.
- We do not track browsing behaviour.
- We do not use cookies.
- We do not sell or monetise any data in any form.

---

## Third-Party Services

| Service                                                      | Purpose                              | Data sent                                         |
| ------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------- |
| [Open-Meteo](https://open-meteo.com)                         | Live weather data                    | Latitude & longitude of your configured locations |
| [Google Favicon Service](https://www.google.com/s2/favicons) | Site icons in favourites and URL bar | Domain name of the site whose icon is requested   |

Both are read-only requests. No personal identifiers are included.

---

## Data Storage & Retention

All user data (settings, notes) is stored exclusively in `chrome.storage.local` on your own device. Uninstalling the extension removes all stored data. We have no ability to access, retrieve, or delete your data because we never receive it.

---

## Children's Privacy

This extension does not knowingly collect data from anyone, including children under 13.

---

## Changes to This Policy

If this policy changes, the updated version will be published here with a revised date at the top. Continued use of the extension after changes constitutes acceptance.

---

## Contact

If you have questions about this privacy policy, please open an issue on the project repository.
