(() => {
  "use strict";

  const STATUS_REQUEST = "netflix-quality-lock:get-status";
  const SET_TARGET_REQUEST = "netflix-quality-lock:set-target";
  const TARGET_EVENT = "netflix-quality-lock-target";
  const TARGET_STORAGE_KEY = "qualityTarget";
  const WATCH_PAGE = /^https:\/\/www\.netflix\.com\/watch\//;
  const VALID_TARGETS = new Set([
    "highest",
    "720p",
    "1080p",
    "1440p",
    "2160p"
  ]);
  const TARGET_LABELS = {
    highest: "Highest",
    "720p": "720p",
    "1080p": "1080p",
    "1440p": "2K / 1440p",
    "2160p": "4K / 2160p"
  };

  const root = document.documentElement;
  if (!root || document.getElementById("netflix-quality-lock-runtime")) {
    return;
  }

  let targetCommandRevision = 0;

  const normalizeTarget = (target) => VALID_TARGETS.has(target)
    ? target
    : "highest";

  const getActiveVideo = () => {
    const videos = Array.from(document.querySelectorAll("video"));

    return videos.find((video) => !video.paused && video.videoWidth > 0)
      ?? videos.find((video) => video.videoWidth > 0)
      ?? null;
  };

  const getPlaybackStatus = () => {
    const onWatchPage = WATCH_PAGE.test(window.location.href);
    const video = onWatchPage ? getActiveVideo() : null;
    const exactMatch = root.dataset.netflixQualityLockExactMatch;

    return {
      onNetflix: true,
      onWatchPage,
      state: onWatchPage
        ? (root.dataset.netflixQualityLock ?? "waiting")
        : "inactive",
      target: normalizeTarget(root.dataset.netflixQualityLockTarget),
      lockedVideo: onWatchPage
        ? (root.dataset.netflixQualityLockVideo ?? "")
        : "",
      selectedWidth: Number(root.dataset.netflixQualityLockSelectedWidth) || 0,
      selectedHeight: Number(root.dataset.netflixQualityLockSelectedHeight) || 0,
      exactMatch: exactMatch === undefined ? null : exactMatch === "true",
      width: video?.videoWidth ?? 0,
      height: video?.videoHeight ?? 0
    };
  };

  const applyTarget = (target) => {
    const normalizedTarget = normalizeTarget(target);
    targetCommandRevision += 1;
    root.dataset.netflixQualityLockTarget = normalizedTarget;
    root.dataset.netflixQualityLock = WATCH_PAGE.test(window.location.href)
      ? "locking"
      : "inactive";
    delete root.dataset.netflixQualityLockVideo;
    delete root.dataset.netflixQualityLockSelectedWidth;
    delete root.dataset.netflixQualityLockSelectedHeight;
    delete root.dataset.netflixQualityLockExactMatch;

    window.dispatchEvent(new CustomEvent(TARGET_EVENT, {
      detail: { target: normalizedTarget }
    }));

    return normalizedTarget;
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === STATUS_REQUEST) {
      sendResponse(getPlaybackStatus());
      return false;
    }

    if (message?.type === SET_TARGET_REQUEST) {
      sendResponse({ ok: true, target: applyTarget(message.target) });
      return false;
    }

    return false;
  });

  window.addEventListener("netflix-quality-lock-status", (event) => {
    const detail = event.detail ?? {};
    root.dataset.netflixQualityLock = detail.state ?? "unknown";
    root.dataset.netflixQualityLockTarget = normalizeTarget(detail.target);

    if (detail.video) {
      root.dataset.netflixQualityLockVideo = detail.video;
    }

    if (Number(detail.width) > 0 && Number(detail.height) > 0) {
      root.dataset.netflixQualityLockSelectedWidth = String(detail.width);
      root.dataset.netflixQualityLockSelectedHeight = String(detail.height);
    }

    if (typeof detail.exactMatch === "boolean") {
      root.dataset.netflixQualityLockExactMatch = String(detail.exactMatch);
    }

    if (detail.state !== "locked") {
      return;
    }

    document.getElementById("netflix-quality-lock-toast")?.remove();

    const target = normalizeTarget(detail.target);
    const resolution = Number(detail.width) > 0 && Number(detail.height) > 0
      ? ` (${detail.width} × ${detail.height})`
      : "";
    const toast = document.createElement("div");
    toast.id = "netflix-quality-lock-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = `Netflix quality locked to ${TARGET_LABELS[target]}${resolution}: ${detail.video}`;
    Object.assign(toast.style, {
      position: "fixed",
      top: "18px",
      right: "18px",
      zIndex: "2147483647",
      padding: "10px 14px",
      borderRadius: "8px",
      background: "rgba(18, 112, 48, 0.94)",
      color: "white",
      font: "600 14px -apple-system, BlinkMacSystemFont, sans-serif",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
      pointerEvents: "none"
    });
    root.appendChild(toast);
    setTimeout(() => toast.remove(), 8000);
  });

  const runtime = document.createElement("script");
  runtime.id = "netflix-quality-lock-runtime";
  runtime.src = chrome.runtime.getURL("netflix_max_bitrate.js");
  runtime.async = false;
  runtime.addEventListener("load", async () => {
    runtime.remove();
    const revisionBeforeRead = targetCommandRevision;

    try {
      const stored = await chrome.storage.local.get(TARGET_STORAGE_KEY);
      if (revisionBeforeRead === targetCommandRevision) {
        applyTarget(stored[TARGET_STORAGE_KEY]);
      }
    } catch (_error) {
      if (revisionBeforeRead === targetCommandRevision) {
        applyTarget("highest");
      }
    }
  }, { once: true });
  root.appendChild(runtime);
})();
