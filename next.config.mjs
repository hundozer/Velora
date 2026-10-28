/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/media/[id]/complete": ["./node_modules/ffmpeg-static/ffmpeg"],
    },
  },
  // Keep legacy links working without redirecting the new Dating Ads section.
  async redirects() {
    return [
      { source: "/dating/create", destination: "/personal-ads/new", permanent: false },
      // People v3 (P1-05) replaced the separate Discovery screen.
      { source: "/discovery", destination: "/people", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
