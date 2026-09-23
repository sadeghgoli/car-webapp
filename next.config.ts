import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server otherwise returns 403 for /_next assets and HMR when the
  // browser host is not localhost (cars.sabzevar.ir behind the reverse proxy).
  allowedDevOrigins: ["cars.sabzevar.ir"],
};

export default nextConfig;
