import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },
  // Kategorije više nemaju zasebnu stranicu — katalog ih pokriva kroz filter.
  // Stari linkovi (indeksirani, podijeljeni) ostaju živi kroz trajni redirect.
  async redirects() {
    return [
      {
        source: "/kategorija/:slug",
        destination: "/shop?kategorija=:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
