import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@react-pdf/renderer", "bcryptjs"],
};

export default nextConfig;
