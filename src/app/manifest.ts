import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "가지마켓",
    short_name: "가지마켓",
    description: "지역 거래와 생활을 연결하는 가지마켓",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    icons: [
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
