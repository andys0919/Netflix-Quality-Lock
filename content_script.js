(() => {
  "use strict";

  const root = document.documentElement;
  if (!root || document.getElementById("netflix-quality-lock-runtime")) {
    return;
  }

  window.addEventListener("netflix-quality-lock-status", (event) => {
    const detail = event.detail ?? {};
    root.dataset.netflixQualityLock = detail.state ?? "unknown";

    if (detail.state !== "locked") {
      return;
    }

    root.dataset.netflixQualityLockVideo = detail.video ?? "";
    document.getElementById("netflix-quality-lock-toast")?.remove();

    const toast = document.createElement("div");
    toast.id = "netflix-quality-lock-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = `Netflix 畫質已鎖定最高：${detail.video}`;
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
  runtime.addEventListener("load", () => runtime.remove(), { once: true });
  root.appendChild(runtime);
})();
