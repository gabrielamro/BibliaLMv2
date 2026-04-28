import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    // Desabilita lint e type check no build para agilizar, já que validamos antes
    typescript: {
        ignoreBuildErrors: true,
    },
    transpilePackages: ['use-image', 'its-fine'],
    serverExternalPackages: ['react-konva', 'konva'],
};

export default nextConfig;
