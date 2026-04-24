import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  poweredByHeader: false,
};

export default nextConfig;
