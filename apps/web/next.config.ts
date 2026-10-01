import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/tidepool", destination: "/scrappyboy", permanent: false },
      // The earlier pet app is paused. Its pages stay in the tree, but the site is one product: SCRAPPY BOY.
      { source: "/app", destination: "/scrappyboy", permanent: false },
      { source: "/app/:path*", destination: "/scrappyboy", permanent: false },
    ];
  },
};

export default nextConfig;
