import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nobaglagi Soccer League",
    short_name: "NSL",
    start_url: "/",
    display: "standalone",
    background_color: "#080B12",
    theme_color: "#080B12",
    icons: [
      { src: "/logos/nsl_logo.png", sizes: "1080x1080", type: "image/png" },
    ],
  };
}
