"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "netflix_max_bitrate.js"),
  "utf8"
);

let currentPath = "/watch/episode-1";
let currentMovieId = "episode-1";
let overrideClicks = 0;
let selectionChangeEvents = 0;
let intervalCallback;
const listeners = new Map();

const options = [
  {
    textContent: "720p [1280x720]",
    value: "1000",
    selected: false,
    setAttribute() {},
    removeAttribute() {}
  },
  {
    textContent: "1080p [1920x1080]",
    value: "2000",
    selected: false,
    setAttribute() {},
    removeAttribute() {}
  }
];
const option = options[0];
const select = {
  options,
  dispatchEvent: () => { selectionChangeEvents += 1; }
};
const targetEvent = {
  type: "netflix-quality-lock-target",
  detail: { target: "720p" }
};
const bitrateLabel = {
  textContent: "Video Bitrate / VMAF",
  parentElement: {
    querySelector: () => select
  }
};
const overrideButton = {
  textContent: "Override",
  isConnected: true,
  click: () => { overrideClicks += 1; }
};

const backgroundPlayer = { isPlaying: () => false };
const activePlayer = {
  isPlaying: () => true,
  getMovieId: () => currentMovieId
};
const videoPlayer = {
  getAllPlayerSessionIds: () => ["background", "active"],
  getVideoPlayerBySessionId: (sessionId) => ({
    background: backgroundPlayer,
    active: activePlayer
  }[sessionId])
};

class Event {
  constructor(type, init = {}) {
    this.type = type;
    Object.assign(this, init);
  }
}

class CustomEvent extends Event {}

const window = {
  location: {
    get href() { return `https://www.netflix.com${currentPath}`; },
    get pathname() { return currentPath; }
  },
  netflix: {
    appContext: {
      state: {
        playerApp: {
          getAPI: () => ({ videoPlayer })
        }
      }
    }
  },
  addEventListener: (type, listener) => {
    listeners.set(type, listener);
  },
  dispatchEvent: (event) => {
    listeners.get(event.type)?.(event);
  }
};

const document = {
  querySelectorAll: (selector) => {
    if (selector === "div") return [bitrateLabel];
    if (selector === "button") return [overrideButton];
    return [];
  }
};

vm.runInNewContext(source, {
  window,
  document,
  Event,
  CustomEvent,
  KeyboardEvent: Event,
  setInterval: (callback) => { intervalCallback = callback; },
  setTimeout: (callback) => { callback(); }
});

window.dispatchEvent(targetEvent);
intervalCallback();
assert.equal(overrideClicks, 1, "locks the active player on first playback");
assert.equal(option.selected, true, "uses the saved 720p target");
assert.equal(selectionChangeEvents, 2, "selects the saved target on first playback");

currentMovieId = "episode-2";
intervalCallback();
assert.equal(overrideClicks, 2, "re-locks when autoplay advances to the next episode");
assert.equal(selectionChangeEvents, 4, "reselects the target for the next episode");

console.log("automatic playback locking checks passed");
