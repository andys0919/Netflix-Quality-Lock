# Netflix Quality Lock

A focused Chromium extension that locks every Netflix playback session to a
chosen quality tier. It defaults to the highest stream Netflix makes available.

When the connection cannot sustain the selected stream, playback buffers
instead of automatically switching to a lower video bitrate.

## What it does

- Detects each new Netflix player session automatically.
- Opens Netflix's internal manual bitrate override.
- Lets you choose Highest, 720p, 1080p, 2K/1440p, or 4K/2160p from the
  extension popup.
- Remembers the selected quality and applies it to each new playback session.
- Selects only the highest-bitrate stream in the requested resolution tier.
- Applies the override without user interaction.
- Shows a short green confirmation with the selected bitrate and VMAF value.
- Shows the current decoded resolution, quality tier, lock state, and selected
  bitrate/VMAF when you click the extension button.

It does not bypass household verification, alter subtitles, skip content,
force a codec, collect data, or communicate with an external service.

The bundled player core is Netflix Cadmium `6.0060.979.911`. Its test-account
gate for Netflix's existing manual bitrate menu is enabled, and the menu's
video entries expose their existing width and height so the selected tier can
be matched to the correct stream.

## Install locally for development

1. Download or clone this repository and keep the folder in a permanent
   location.
2. Open the browser's extensions page.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this repository folder.
5. Reload an open Netflix playback page once.

The extension then applies the saved quality automatically whenever a Netflix
player session starts or changes. The default is **Highest**.

## One-click distribution

For normal end-user installation, publish this package to the **Chrome Web
Store** and/or **Microsoft Edge Add-ons**. Use an unlisted Chrome Web Store
listing when you want to share a direct installation link without making the
extension searchable.

GitHub downloads and unpacked extension folders are development installation
paths. They do not provide a normal one-click installation on Windows or
macOS. Increase the version in `manifest.json` for every store upload. The
repository does not have a store listing yet.

## Verify

After playback begins, a green confirmation appears in the upper-right corner
with the requested quality, selected resolution, bitrate, and VMAF value.

You can also press `Control + Option + Shift + B` on macOS while Netflix is
playing. Netflix's hidden bitrate menu should show one video entry selected for
the saved quality tier. Press the same shortcut again to close it.

Click the extension button to switch between **Highest**, **720p**, **1080p**,
**2K**, and **4K**, and to see the resolution Netflix is currently decoding,
for example `1920 × 1080` and `Full HD / 1080p`. The value updates while the
popup is open and reports the actual video frame size rather than inferring it
from the selected bitrate.

If Netflix does not expose the requested tier for the current account, title,
browser, display, DRM session, or codec, the extension locks the closest
available tier at or below the request and shows that fallback in the popup.

## Limitations

The extension locks the highest stream Netflix actually exposes to the current
account, title, browser, operating system, display, DRM session, and codec. It
cannot create a 1080p or 4K stream when Netflix does not offer one.

Netflix can change its player implementation without notice. If playback stops
working after a Netflix update, the bundled player core and its small manual
quality-menu patches may need to be updated.

## Permissions

The manifest requests `declarativeNetRequest`, local extension storage, and
access to Netflix player domains. These are required to expose and apply
Netflix's manual bitrate override and remember the selected quality locally.

## License

The extension code is MIT licensed. See [LICENSE](LICENSE).
`cadmium-playercore.js` is Netflix player code and is excluded from the MIT
license; its embedded copyright and license notice applies.
