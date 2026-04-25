/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "files.catbox.moe",
      },
      {
        protocol: "https",
        hostname: "catbox.moe",
      },
    ],
  },
};

export default nextConfig;
