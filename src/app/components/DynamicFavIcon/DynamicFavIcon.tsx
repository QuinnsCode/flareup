"use client";

import { useEffect, useRef } from "react";

interface DynamicFavIconProps {
  frameCount?: number;
  basePath?: string;
  interval?: number;
}

export function DynamicFavIcon({
  frameCount = 9,
  basePath = "/favicons/icon",
  interval = 150,
}: DynamicFavIconProps) {
  const countRef = useRef(0);

  useEffect(() => {

    console.log("DynamicFavicon mounted");
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      document.head.appendChild(link);
    }

    const id = setInterval(() => {
      countRef.current = (countRef.current % frameCount) + 1;
      const frame = String(countRef.current).padStart(2, "0");
      link!.href = `${basePath}${frame}.png`;
    }, interval);

    return () => clearInterval(id);
  }, [frameCount, basePath, interval]);

  return null;
}