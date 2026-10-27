import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Confirmation links contain one-time tokens. Do not log request URLs here.
  logging: { incomingRequests: { ignore: [/\/auth\/confirm/] } },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
