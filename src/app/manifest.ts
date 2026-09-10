import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "당근",
    short_name: "당근",
    description: "중고거래와 동네 생활을 연결하는 당근 모바일 프로토타입",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
