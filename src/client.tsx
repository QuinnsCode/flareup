// src/client.tsx
import { initClient } from "rwsdk/client";

const FRAME_COUNT = 7;
const BASE_PATH = "/favicons/icon";

const link = document.createElement("link");
link.rel = "icon";
link.type = "image/png";
document.head.appendChild(link);

let frame = 0;
const startTime = Date.now();

const FRAME_LENGTH_1 = 300;
const FRAME_LENGTH_2 = 80;
const FRAME_LENGTH_3 = 220;

const TIMESECTION_1 = 5;
const TIMESECTION_2 = 15;
const TIMESECTION_3 = 30
const MILLI_SECOND_THOUSAND = 1000;

function tick() {
  const elapsed = (Date.now() - startTime) / MILLI_SECOND_THOUSAND; // seconds

  let interval: number;

  if (elapsed < TIMESECTION_1) {
    // Ramp up: 300ms → 80ms over 5s
    const t = elapsed / TIMESECTION_1;
    interval = FRAME_LENGTH_1 - (FRAME_LENGTH_3 * t);
  } else if (elapsed < TIMESECTION_2) {
    // Fast: hold at 80ms
    interval = FRAME_LENGTH_2;
  } else if (elapsed < TIMESECTION_3) {
    // Slow down: 80ms → 600ms over 15s
    const t = (elapsed - TIMESECTION_2) / TIMESECTION_2;
    interval = FRAME_LENGTH_2 + ((FRAME_LENGTH_1 + FRAME_LENGTH_3) * t);
  } else {
    // Stop — no more ticks
    return;
  }

  frame = (frame % FRAME_COUNT) + 1;
  link.href = `${BASE_PATH}${String(frame).padStart(2, "0")}.png`;

  setTimeout(tick, interval);
}

tick();

initClient();