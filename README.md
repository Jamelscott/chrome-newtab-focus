# Nu Home

A Chrome extension that replaces the new tab page with a clean, minimal dashboard — with the URL bar autofocused so you can start typing immediately.

## Features

### 🔍 URL Bar

- Autofocused on every new tab — start typing immediately, no click required
- Inline ghost-text completion from your browsing history and top sites
- Keyboard navigation through suggestions (↑ ↓ Tab → to accept, Esc to dismiss)
- Smart input: bare domains, full URLs, or plain text searches all work

### 🕐 Clock

- Displays current time in 12h or 24h format (configurable)
- Shows the full date (day, month, date)
- Time-of-day background gradient that shifts colour from midnight through sunrise, golden hour, and back — in both top corners

### ⭐ Favourites

- Up to 12 quick-access link tiles with favicons
- Inline **+** button to add a new favourite directly on the page without opening settings
- Configurable labels and URLs

### 🌤 Weather

- Live current conditions for up to 2 configurable locations
- Shows temperature, weather description, humidity, wind speed
- Today and tomorrow forecast with hi/lo temperatures
- Powered by the Open-Meteo API (no API key required)

### 🗒 Sticky Notes

- Up to 6 persistent notes saved across sessions
- Draggable and resizable
- 5 colour themes: Default, Indigo, Teal, Rose, Amber
- **Markdown rendering** — write in Markdown while editing, see rendered output when not focused (headings, bold, italic, lists, code, links, blockquotes, and more)
- **Auto-arrange** button stacks notes into columns from the top-left, wrapping to a new column when the viewport height is exceeded

## Project Structure

```
nuhome-page/    # The new tab dashboard (clock, weather, favourites, notes)
nuhome-relay/   # Thin redirect shim — tricks Chrome into not stealing omnibox focus
nuhome-ext/     # Extension popup & options page for configuring settings
```

> **Why the relay?** Chrome hijacks omnibox focus on the registered new-tab page. The relay immediately redirects to `nuhome-page.html` before Chrome can steal focus, so the URL input wins.

## Installation

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

## Requirements

- Chrome 88+
- Permissions used: `storage`, `history`, `topSites`
