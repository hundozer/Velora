/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dating became Tonight (P1-07); keep old links working.
  async redirects() {
    return [
      { source: "/dating", destination: "/tonight", permanent: true },
      { source: "/dating/create", destination: "/tonight/new", permanent: true },
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
