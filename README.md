# Netflix Quality Lock

A focused Chromium extension that automatically locks every Netflix playback
session to the highest video bitrate Netflix makes available.

When the connection cannot sustain the selected stream, playback buffers
instead of automatically switching to a lower video bitrate.

## What it does

- Detects each new Netflix player session automatically.
- Opens Netflix's internal manual bitrate override.
- Selects only the highest available video entry.
- Applies the override without user interaction.
- Shows a short green confirmation with the selected bitrate and VMAF value.

It does not bypass household verification, alter subtitles, skip content,
force a codec, collect data, or communicate with an external service.

The bundled player core is Netflix Cadmium `6.0060.979.911`, with only the
test-account gate for Netflix's existing manual bitrate menu enabled.

## Install in Brave, Chrome, or Edge

1. Download or clone this repository and keep the folder in a permanent
   location.
2. Open the browser's extensions page.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this repository folder.
5. Reload an open Netflix playback page once.

The extension then applies the highest available video bitrate automatically
whenever a Netflix player session starts or changes.

## Verify

After playback begins, a green message appears in the upper-right corner:

```text
Netflix 畫質已鎖定最高：<bitrate> / <VMAF>
```

You can also press `Control + Option + Shift + B` on macOS while Netflix is
playing. Netflix's hidden bitrate menu should show only the last and highest
video entry selected. Press the same shortcut again to close it.

## Limitations

The extension locks the highest stream Netflix actually exposes to the current
account, title, browser, operating system, display, DRM session, and codec. It
cannot create a 1080p or 4K stream when Netflix does not offer one.

Netflix can change its player implementation without notice. If playback stops
working after a Netflix update, the bundled player core and its one-line menu
gate patch may need to be updated.

## Permissions

The manifest requests only `declarativeNetRequest` and access to Netflix player
domains. These are required to expose and apply Netflix's manual bitrate
override.

## License

The extension code is MIT licensed. See [LICENSE](LICENSE).
`cadmium-playercore.js` is Netflix player code and is excluded from the MIT
license; its embedded copyright and license notice applies.
