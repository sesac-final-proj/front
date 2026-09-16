"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      // An offline production shell must not mask a stopped or updated dev server.
      void (async () => {
        const workerUrl = new URL("/sw.js", window.location.origin).href;
        const registration = await navigator.serviceWorker.getRegistration("/");
        const worker = registration?.active ?? registration?.waiting ?? registration?.installing;
        if (worker?.scriptURL !== workerUrl) return;
        const wasControlled = navigator.serviceWorker.controller?.scriptURL === workerUrl;
        const removed = await registration!.unregister();
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("gaji-market-")).map((key) => caches.delete(key)));
        if (removed && wasControlled) window.location.reload();
      })().catch((error) => console.warn("Development service worker cleanup failed", error));
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
