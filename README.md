# Nu Tab — New Tab Focus

A Chrome extension that replaces the new tab page with a clean, minimal dashboard — with the URL bar autofocused so you can start typing immediately.

## Features

- **Autofocused URL bar** — the search/address input is focused on every new tab, no click required
- **Live clock** — displays the current time with 12h or 24h format support
- **Favourites grid** — quick-access links you configure yourself
- **Live weather** — current conditions for up to 2 configurable locations
- **Sticky notes** — persistent notes saved across sessions

## Project Structure

```
nutab-page/     # The new tab dashboard (clock, weather, favourites, notes)
nutab-relay/    # Thin redirect shim — tricks Chrome into not stealing omnibox focus
nutab-ext/      # Extension popup & options page for configuring settings
```

> **Why the relay?** Chrome hijacks omnibox focus on the registered new-tab page. The relay immediately redirects to `nutab-page.html` before Chrome can steal focus, so the URL input wins.

## Installation

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

## Requirements

- Chrome 88+
- Permissions used: `storage`, `history`, `topSites`
