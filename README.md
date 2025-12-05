# WebCleaner Extension

A powerful Chrome extension to permanently hide unwanted elements from any website.

## Features

- **Edit Mode**: Select any element on a page to hide it.
- **Persistent Cleaning**: Hiding rules are saved per domain and applied automatically on next visit.
- **Management**: View stats and reset rules for specific sites or globally.
- **Lightweight**: Built with vanilla JavaScript, no external dependencies.

## Installation

1. **Download/Clone** this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the `extension` folder from this project.

## Usage

1. Click the **WebCleaner** icon in your browser toolbar.
2. Click **Enable Edit Mode**.
3. Hover over any element on the page (it will be highlighted in blue).
4. Click the element to hide it permanently.
5. To undo, open the popup and click **Reset This Site**.

## Project Structure

```
extension/
├── manifest.json        # Extension configuration
├── src/
│   ├── content/         # Scripts running on web pages
│   │   ├── selector.js    # Handles selection logic
│   │   ├── highlighter.js # Visual feedback
│   │   ├── hider.js       # Applies hiding rules
│   │   └── content.css    # Styles
│   ├── background/      # Service worker
│   ├── storage/         # Storage management
│   ├── popup/           # Popup UI
│   └── utils/           # Shared utilities
└── assets/              # Icons
```

## Privacy

All data is stored locally in your browser (`chrome.storage.local`). No data is sent to external servers.
