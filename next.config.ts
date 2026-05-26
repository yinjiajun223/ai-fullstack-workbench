import type { NextConfig } from "next";

const configuredDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: configuredDevOrigins ?? [
    "localhost",
    "127.0.0.1",
    "192.168.40.60",
  ],
};

export default nextConfig;
