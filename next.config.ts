import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "bcryptjs"],
  },
  serverExternalPackages: ["mongoose", "bcryptjs"],
};

export default nextConfig;