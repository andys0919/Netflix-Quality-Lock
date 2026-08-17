(() => {
  "use strict";

  const STATUS_EVENT = "netflix-quality-lock-status";
  const WATCH_PAGE = /^https:\/\/www\.netflix\.com\/watch\//;
  const POLL_INTERVAL_MS = 500;

  let lockedSessionId = null;
  let lockingSessionId = null;

  const report = (state, detail = {}) => {
    window.dispatchEvent(new CustomEvent(STATUS_EVENT, {
      detail: { state, ...detail }
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

  const chooseHighestOption = (select) => {
    const options = Array.from(select.options).filter(
      (option) => option.textContent.trim() !== ""
    );

    if (options.length === 0) {
      return null;
    }

    for (const option of select.options) {
      option.selected = false;
      option.removeAttribute("selected");
    }

    const highest = options.at(-1);
    highest.selected = true;
    highest.setAttribute("selected", "selected");
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));

    return highest.textContent.trim() || highest.value;
  };

  const getActivePlayer = () => {
    const videoPlayer = window.netflix?.appContext?.state?.playerApp
      ?.getAPI?.().videoPlayer;
    const sessionId = videoPlayer?.getAllPlayerSessionIds?.()[0];
    const player = sessionId
      ? videoPlayer.getVideoPlayerBySessionId(sessionId)
      : null;

    return { player, sessionId };
  };

  const lockHighestBitrate = (sessionId) => {
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

    const highestVideo = chooseHighestOption(videoSelect);
    if (!highestVideo) {
      return false;
    }

    lockingSessionId = sessionId;
    report("locking", { video: highestVideo });

    setTimeout(() => {
      if (!overrideButton.isConnected) {
        lockingSessionId = null;
        return;
      }

      overrideButton.click();
      lockedSessionId = sessionId;
      lockingSessionId = null;
      report("locked", { video: highestVideo });
    }, 250);

    return true;
  };

  setInterval(() => {
    if (!WATCH_PAGE.test(window.location.href)) {
      lockedSessionId = null;
      lockingSessionId = null;
      return;
    }

    const { player, sessionId } = getActivePlayer();
    if (!sessionId || !player?.isPlaying?.()) {
      return;
    }

    if (sessionId === lockedSessionId || sessionId === lockingSessionId) {
      return;
    }

    lockHighestBitrate(sessionId);
  }, POLL_INTERVAL_MS);
})();
