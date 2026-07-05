import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Inline at build time so CI/Netlify builds embed auth config into middleware + API routes.
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET ?? "",
    AUTH_USERNAME: process.env.AUTH_USERNAME ?? "",
    AUTH_PASSWORD: process.env.AUTH_PASSWORD ?? "",
    AUTH_USERS: process.env.AUTH_USERS ?? "",
  },
};

export default nextConfig;
