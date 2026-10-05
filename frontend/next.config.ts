import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  turbopack: {
    root: path.join(process.cwd(), ".."),
  },
  async redirects() {
    return [
      {
        source: '/farmer',
        destination: '/farmer/farmerHub/dashboard',
        permanent: false,
      },
      {
        source: '/processor',
        destination: '/processor/processorHub/dashboard',
        permanent: false,
      },

      {
        source: '/distributor',
        destination: '/distributor/distributorHub/dashboard',
        permanent: false,
      },
      {
        source: '/retailer',
        destination: '/retailer/retailerHub/dashboard',
        permanent: false,
      },

    ];
  },
};

export default nextConfig;
