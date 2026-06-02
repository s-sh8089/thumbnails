/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // GitHub Actions環境ではリポジトリ名をbasePath/assetPrefixに設定
  ...(process.env.GITHUB_ACTIONS === "true" && {
    basePath: "/thumbnails",
    assetPrefix: "/thumbnails",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
