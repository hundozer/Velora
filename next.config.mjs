/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/media/[id]/complete": ["./node_modules/ffmpeg-static/ffmpeg"],
    },
  },
  // Dating became Tonight (P1-07); keep old links working.
  async redirects() {
    return [
      { source: "/dating", destination: "/tonight", permanent: true },
      { source: "/dating/create", destination: "/tonight/new", permanent: true },
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
