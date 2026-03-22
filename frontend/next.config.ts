import type { NextConfig } from "next";

// 后端地址：开发环境默认 localhost:8000，容器部署时通过环境变量注入
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // 启用 standalone 模式，用于 Docker 生产部署
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
