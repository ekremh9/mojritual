import type { NextConfig } from "next";

const r2Hostname = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      ...(r2Hostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2Hostname,
              pathname: "/**",
            },
          ]
        : []),
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
