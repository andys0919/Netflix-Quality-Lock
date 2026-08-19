(() => {
  "use strict";

  const STATUS_EVENT = "netflix-quality-lock-status";
  const TARGET_EVENT = "netflix-quality-lock-target";
  const WATCH_PAGE = /^https:\/\/www\.netflix\.com\/watch\//;
  const POLL_INTERVAL_MS = 500;
  const RESOLUTION_PATTERN = /\[(\d+)x(\d+)\]/;
  const TARGET_HEIGHTS = {
    "720p": 720,
    "1080p": 1080,
    "1440p": 1440,
    "2160p": 2160
  };
  const VALID_TARGETS = new Set(["highest", ...Object.keys(TARGET_HEIGHTS)]);

  let targetQuality = "highest";
  let lockedPlaybackKey = null;
  let lockingPlaybackKey = null;
  let lockGeneration = 0;

  const normalizeTarget = (target) => VALID_TARGETS.has(target)
    ? target
    : "highest";

  const report = (state, detail = {}) => {
    window.dispatchEvent(new CustomEvent(STATUS_EVENT, {
      detail: { state, target: targetQuality, ...detail }
    }));
  };

  const findControl = (text, selector) => Array.from(
    document.querySelectorAll(selector)
  ).find((element) => element.textContent === text) ?? null;

  const findVideoSelect = () => findControl(
    "Video Bitrate / VMAF",
    "div"
  )?.parentElement?.querySelector("select") ?? null;

  const findOverrideButton = () => findControl("Override", "button");

  const openOverrideMenu = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", {
      key: "b",
      code: "KeyB",
      keyCode: 66,
      which: 66,
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      bubbles: true
    }));
  };

  const resolutionTier = (width, height) => {
    if (width >= 3840 || height >= 2160) {
      return 2160;
    }

    if (width >= 2560 || height >= 1440) {
      return 1440;
    }

    if (width >= 1920 || height >= 1080) {
      return 1080;
    }

    if (width >= 1280 || height >= 720) {
      return 720;
    }

    return height;
  };

  const describeOption = (option) => {
    const caption = option.textContent.trim();
    const resolution = caption.match(RESOLUTION_PATTERN);
    const width = Number(resolution?.[1]) || 0;
    const height = Number(resolution?.[2]) || 0;

    return {
      option,
      bitrate: Number(option.value) || 0,
      caption: caption.replace(/\s*\[\d+x\d+\]/, ""),
      width,
      height,
      tier: resolutionTier(width, height)
    };
  };

  const highestBitrate = (options) => options.reduce(
    (highest, option) => option.bitrate >= highest.bitrate ? option : highest
  );

  const chooseTargetOption = (select) => {
    const options = Array.from(select.options)
      .filter((option) => option.textContent.trim() !== "")
      .map(describeOption);

    if (options.length === 0) {
      return null;
    }

    const optionsWithResolution = options.filter((option) => option.tier > 0);
    if (optionsWithResolution.length === 0) {
      return highestBitrate(options);
    }

    if (targetQuality === "highest") {
      const highestTier = Math.max(
        ...optionsWithResolution.map((option) => option.tier)
      );
      return highestBitrate(
        optionsWithResolution.filter((option) => option.tier === highestTier)
      );
    }

    const targetHeight = TARGET_HEIGHTS[targetQuality];
    const atOrBelowTarget = optionsWithResolution.filter(
      (option) => option.tier <= targetHeight
    );

    if (atOrBelowTarget.length > 0) {
      const closestTier = Math.max(
        ...atOrBelowTarget.map((option) => option.tier)
      );
      return highestBitrate(
        atOrBelowTarget.filter((option) => option.tier === closestTier)
      );
    }

    const lowestTier = Math.min(
      ...optionsWithResolution.map((option) => option.tier)
    );
    return highestBitrate(
      optionsWithResolution.filter((option) => option.tier === lowestTier)
    );
  };

  const selectOnly = (select, selectedOption) => {
    for (const option of select.options) {
      option.selected = false;
      option.removeAttribute("selected");
    }

    selectedOption.selected = true;
    selectedOption.setAttribute("selected", "selected");
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const getActivePlayer = () => {
    const videoPlayer = window.netflix?.appContext?.state?.playerApp
      ?.getAPI?.().videoPlayer;
    for (const sessionId of videoPlayer?.getAllPlayerSessionIds?.() ?? []) {
      const player = videoPlayer.getVideoPlayerBySessionId(sessionId);
      if (player?.isPlaying?.()) {
        return { player, sessionId };
      }
    }

    return { player: null, sessionId: null };
  };

  const getPlaybackKey = (sessionId, player) => {
    const movieId = player?.getMovieId?.();
    return `${sessionId}:${movieId ?? window.location.href}`;
  };

  const getCurrentPlaybackKey = () => {
    const { player, sessionId } = getActivePlayer();
    return sessionId ? getPlaybackKey(sessionId, player) : null;
  };

  const lockSelectedQuality = (sessionId, playbackKey) => {
    let videoSelect = findVideoSelect();
    let overrideButton = findOverrideButton();

    if (!videoSelect || !overrideButton) {
      openOverrideMenu();
      videoSelect = findVideoSelect();
      overrideButton = findOverrideButton();
    }

    if (!videoSelect || !overrideButton) {
      return false;
    }

    const selected = chooseTargetOption(videoSelect);
    if (!selected) {
      return false;
    }

    selectOnly(videoSelect, selected.option);
    lockingPlaybackKey = playbackKey;
    const generation = lockGeneration;
    const requestedHeight = TARGET_HEIGHTS[targetQuality];
    const exactMatch = targetQuality === "highest"
      || selected.tier === requestedHeight;
    const detail = {
      video: selected.caption,
      width: selected.width,
      height: selected.height,
      exactMatch
    };
    report("locking", detail);

    setTimeout(() => {
      if (
        generation !== lockGeneration
        || playbackKey !== getCurrentPlaybackKey()
        || !overrideButton.isConnected
      ) {
        if (generation === lockGeneration) {
          lockingPlaybackKey = null;
        }
        return;
      }

      overrideButton.click();
      lockedPlaybackKey = playbackKey;
      lockingPlaybackKey = null;
      report("locked", detail);
    }, 250);

    return true;
  };

  window.addEventListener(TARGET_EVENT, (event) => {
    targetQuality = normalizeTarget(event.detail?.target);
    lockGeneration += 1;
    lockedPlaybackKey = null;
    lockingPlaybackKey = null;
    report("waiting");
  });

  setInterval(() => {
    if (!WATCH_PAGE.test(window.location.href)) {
      lockedPlaybackKey = null;
      lockingPlaybackKey = null;
      return;
    }

    const { player, sessionId } = getActivePlayer();
    if (!sessionId || !player) {
      return;
    }

    const playbackKey = getPlaybackKey(sessionId, player);
    if (playbackKey === lockedPlaybackKey || playbackKey === lockingPlaybackKey) {
      return;
    }

    lockSelectedQuality(sessionId, playbackKey);
  }, POLL_INTERVAL_MS);
})();
