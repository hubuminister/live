/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["antd-mobile"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.bldimg.com",
        port: "",
        pathname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
