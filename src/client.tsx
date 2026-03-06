// src/client.tsx
import { initClient } from "rwsdk/client";

const FRAME_COUNT = 7;
const BASE_PATH = "/favicons/icon";
const INTERVAL = 150;

let frame = 0;
const link = document.createElement("link");
link.rel = "icon";
link.type = "image/png";
document.head.appendChild(link);

setInterval(() => {
  frame = (frame % FRAME_COUNT) + 1;
  link.href = `${BASE_PATH}${String(frame).padStart(2, "0")}.png`;
}, INTERVAL);

// Initialize the base client (required for RSC hydration)
initClient();
