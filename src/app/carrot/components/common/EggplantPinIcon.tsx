"use client";

import React from "react";

export function EggplantPinIcon({
  size = 31,
  active = false,
}: {
  size?: number;
  active?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="eggplant-pin-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--eggplant-pin-top, #078452)" />
          <stop offset="30%" stopColor="var(--eggplant-pin-top, #078452)" />
          <stop offset="30%" stopColor="var(--eggplant-pin-bottom, #ff6f0f)" />
          <stop offset="100%" stopColor="var(--eggplant-pin-bottom, #ff6f0f)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={active ? "url(#eggplant-pin-gradient)" : "none"}
        stroke={active ? "none" : "currentColor"}
        strokeWidth={active ? "0" : "1.7"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
