# YouTube Refined

A lightweight, distraction-free Chrome extension built to clean up YouTube's cluttered UI. Pick your exact video grid layout, ditch Shorts, customize the top navigation bar, hide unwanted shelves, remove sidebars, and browse YouTube without algorithmic noise.

No trackers, no heavy frameworks, and zero tab reloads required.

---

## Preview

<p align="left">
  <img src="screenshots/preview.png" alt="YouTube Refined popup preview" width="360" />
</p>

---

## Why YouTube Refined?

Over the years, YouTube's homepage has shifted from a simple subscription grid into an endless scroll of Shorts shelves, algorithmic topic carousels, sponsor promos, and cramped 3-4 video rows on wide monitors.

YouTube Refined gives you control over the layout. If you want 6 or 8 video columns on an ultrawide display, want Shorts gone completely, or just want to turn off comments and sidebar recommendations while studying, you can toggle exactly what you want with one click.

---

## Features

### Video Grid Columns
- **Custom Column Count:** Choose anywhere between **1 to 10 columns per row** using the stepper buttons, range slider, or direct number input.
- **Master Feature Toggle:** Flip custom columns on or off anytime. When switched off, YouTube reverts to its native responsive grid without losing your saved column setting.
- **Smart Responsive Clamping:** If your window or split-screen is too narrow to comfortably fit your requested column count, the grid automatically adapts so thumbnails never collapse, displaying an informational note in the popup.

### Navigation Bar Customization
- **In-Navbar Settings Shortcut:** Adds a gear button directly to YouTube's top header (to the right of your profile avatar) for instant one-click access to YouTube settings without digging through the account menu.
- **Hide Create Button:** Removes the “+ Create” button from the top navigation bar.
- **Hide Voice Search:** Removes the microphone button next to the search input.
- **Hide Notifications:** Cleans up the notification bell icon from the top bar.
- **Hide Country Code:** Removes the regional country badge (e.g. `US`, `IN`) next to the YouTube logo.

### Left Sidebar & Navigation
- **Hide Mini-Sidebar:** Removes the collapsed left navigation strip (Home, Shorts, Subscriptions, You) and reclaims screen space so feeds span edge-to-edge, while keeping the top-left hamburger menu fully functional to open the sidebar drawer whenever you need it.

### Feed Decluttering
- **Block Shorts:** Removes Shorts shelves, chips, and grid cards from your feed. Any Shorts links you click (or open via bookmarks) are automatically redirected straight to the homepage.
- **Hide Topic Sections:** Cleans out "Explore more topics" shelves.
- **Hide Membership Sections:** Removes "Get more from memberships" promotion blocks.
- **Hide Mixes:** Filters out auto-generated YouTube Mix playlists.
- **Hide Filter Chips:** Removes the top topic pill bar (*All, Gaming, Music...*) and reclaims header space while keeping search filters intact.

### Feed Filters
- **Hide Live Streams:** Strips live broadcasts and upcoming stream cards from feeds.
- **Hide Started Videos:** Automatically hides videos you've already started watching (with red progress bars) to keep feeds fresh.
- **Hide Playlists:** Removes playlist cards so your feeds focus purely on individual videos.

### Watch Page
- **Hide Comments:** Removes the comments area on video watch pages.
- **Hide Recommendations:** Hides the right-hand recommendation column / live chat beside the player, expanding the player for a distraction-free watch experience.
- **Hide End-Screen Cards:** Removes video suggestion tiles that pop up over the player near the end of a video.

---

## How It Works

- **Zero Tab Reloads:** All preferences are listened to via `chrome.storage.onChanged`. When you toggle a setting in the popup, your open YouTube tabs update immediately in real time.
- **Fast First Paints:** Core CSS overrides are injected at `document_start`, so pages render clean without awkward layout pops or flashes of hidden content.
- **Network-Level Redirects:** Shorts blocking uses Chrome's native `declarativeNetRequest` rules to redirect navigation before network requests are ever sent.
- **Cloud Sync:** Uses `chrome.storage.sync` so your preferences stay synchronized across all your Chrome browsers automatically.
- **Pure Vanilla Code:** Built with standard JavaScript and CSS. No React, no bundle bloat, and minimal memory usage.

---

## Installation

### Load Unpacked (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/bugtoast/YouTube-Refined.git
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the **`ext`** folder in this project (or **`dist/youtube-refined`** if you ran the build script).
6. Pin **YouTube Refined** from Chrome's extensions puzzle menu for quick access.

---

## Development & Building

The repository is structured with the raw extension code in `ext/` and packaging helpers in `tools/`:

```
YouTube-Refined/
├── ext/               # Active extension files (Manifest V3)
│   ├── manifest.json
│   ├── icons/
│   ├── public/
│   └── src/
├── screenshots/       # Project screenshots and previews
├── tools/             # Build and packaging utilities
│   ├── build.sh       # Packages dist/ and creates release zip
│   └── make_icons.py  # Generates icon sizes using macOS sips
└── README.md
```

To build a fresh distribution folder and release `.zip`:

```bash
bash tools/build.sh
```

This creates a clean unpacked build in `dist/youtube-refined` and an archive in `dist/youtube-refined-1.2.0.zip`.

---

## Privacy

YouTube Refined is completely private and local:
- **No telemetry, analytics, or external API calls.**
- **No tracking of your watch history or viewing habits.**
- All preferences are stored strictly inside your browser's local and synced extension storage.

---

## License

Released under the [MIT License](LICENSE). Feel free to use, modify, and distribute.