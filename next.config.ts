import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "52mb",
    },
  },
  // Ensure the extraction knowledge file is bundled into Vercel serverless
  // functions — fs.readFileSync won't find it in production without this.
  outputFileTracingIncludes: {
    "/api/**": ["./lib/ai/extraction-knowledge.md"],
  },
};

export default nextConfig;
