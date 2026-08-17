(() => {
  "use strict";

  const STATUS_REQUEST = "netflix-quality-lock:get-status";
  const SET_TARGET_REQUEST = "netflix-quality-lock:set-target";
  const TARGET_STORAGE_KEY = "qualityTarget";
  const REFRESH_INTERVAL_MS = 750;
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

  const elements = {
    version: document.getElementById("version"),
    status: document.getElementById("status"),
    resolution: document.getElementById("resolution"),
    quality: document.getElementById("quality"),
    lockState: document.getElementById("lock-state"),
    bitrate: document.getElementById("bitrate"),
    hint: document.getElementById("hint"),
    targetButtons: Array.from(document.querySelectorAll("[data-target]"))
  };

  let selectedTarget = "highest";
  let refreshing = false;

  const normalizeTarget = (target) => VALID_TARGETS.has(target)
    ? target
    : "highest";

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

  const qualityLabel = (width, height) => {
    const tier = resolutionTier(width, height);

    if (tier >= 2160) {
      return "4K / 2160p";
    }

    if (tier >= 1440) {
      return "2K / 1440p";
    }

    if (tier >= 1080) {
      return "Full HD / 1080p";
    }

    if (tier >= 720) {
      return "HD / 720p";
    }

    if (tier >= 480) {
      return "SD / 480p";
    }

    return height > 0 ? `${height}p` : "Waiting for video output";
  };

  const setSelectedTarget = (target) => {
    selectedTarget = normalizeTarget(target);
    for (const button of elements.targetButtons) {
      const selected = button.dataset.target === selectedTarget;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
    }
  };

  const setStatus = (state, text) => {
    elements.status.className = `status status-${state}`;
    elements.status.textContent = text;
  };

  const renderUnavailable = () => {
    setStatus("unavailable", "Unavailable");
    elements.resolution.textContent = "—";
    elements.quality.textContent = "Open this on a Netflix playback page";
    elements.lockState.textContent = `Saved: ${TARGET_LABELS[selectedTarget]}`;
    elements.bitrate.textContent = "—";
    elements.hint.textContent = "If the extension was just reloaded, refresh the Netflix tab once.";
  };

  const render = (status) => {
    if (!status?.onNetflix) {
      renderUnavailable();
      return;
    }

    setSelectedTarget(status.target);

    if (!status.onWatchPage) {
      setStatus("inactive", "Not playing");
      elements.resolution.textContent = "—";
      elements.quality.textContent = "This is not a Netflix playback page";
      elements.lockState.textContent = `Waiting to apply ${TARGET_LABELS[selectedTarget]}`;
      elements.bitrate.textContent = "—";
      elements.hint.textContent = "Start any title to apply the selected quality automatically.";
      return;
    }

    const width = Number(status.width) || 0;
    const height = Number(status.height) || 0;
    const selectedWidth = Number(status.selectedWidth) || 0;
    const selectedHeight = Number(status.selectedHeight) || 0;
    elements.resolution.textContent = width > 0 && height > 0
      ? `${width} × ${height}`
      : "—";
    elements.quality.textContent = qualityLabel(width, height);
    elements.bitrate.textContent = status.lockedVideo || "—";

    if (status.state === "locked" && status.exactMatch === false) {
      const appliedQuality = qualityLabel(selectedWidth, selectedHeight);
      elements.hint.textContent = `Netflix does not offer ${TARGET_LABELS[selectedTarget]}; locked to the available ${appliedQuality}.`;
    } else {
      elements.hint.textContent = "Updates live from the video currently decoded by the player.";
    }

    switch (status.state) {
      case "locked":
        setStatus("locked", "Locked");
        elements.lockState.textContent = status.exactMatch === false
          ? "Locked to the nearest available quality"
          : `Locked to ${TARGET_LABELS[selectedTarget]}`;
        break;
      case "locking":
        setStatus("locking", "Applying");
        elements.lockState.textContent = `Applying ${TARGET_LABELS[selectedTarget]}`;
        break;
      default:
        setStatus("waiting", "Waiting");
        elements.lockState.textContent = `Waiting to apply ${TARGET_LABELS[selectedTarget]}`;
        break;
    }
  };

  const activeTab = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    return tab;
  };

  const chooseTarget = async (target) => {
    const normalizedTarget = normalizeTarget(target);
    setSelectedTarget(normalizedTarget);
    await chrome.storage.local.set({
      [TARGET_STORAGE_KEY]: normalizedTarget
    });

    try {
      const tab = await activeTab();
      if (!tab?.id) {
        renderUnavailable();
        return;
      }

      await chrome.tabs.sendMessage(tab.id, {
        type: SET_TARGET_REQUEST,
        target: normalizedTarget
      });
      setStatus("locking", "Applying");
      elements.lockState.textContent = `Applying ${TARGET_LABELS[normalizedTarget]}`;
      elements.bitrate.textContent = "—";
    } catch (_error) {
      renderUnavailable();
    }
  };

  const refresh = async () => {
    if (refreshing) {
      return;
    }

    refreshing = true;
    try {
      const tab = await activeTab();
      if (!tab?.id) {
        renderUnavailable();
        return;
      }

      const status = await chrome.tabs.sendMessage(tab.id, {
        type: STATUS_REQUEST
      });
      render(status);
    } catch (_error) {
      renderUnavailable();
    } finally {
      refreshing = false;
    }
  };

  for (const button of elements.targetButtons) {
    button.addEventListener("click", () => chooseTarget(button.dataset.target));
  }

  elements.version.textContent = `v${chrome.runtime.getManifest().version}`;

  chrome.storage.local.get(TARGET_STORAGE_KEY).then((stored) => {
    setSelectedTarget(stored[TARGET_STORAGE_KEY]);
    return refresh();
  }).catch(() => {
    setSelectedTarget("highest");
    return refresh();
  });

  setInterval(refresh, REFRESH_INTERVAL_MS);
})();
