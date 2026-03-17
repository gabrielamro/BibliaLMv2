import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    // Desabilita lint e type check no build para agilizar, já que validamos antes
    // Na v16.1.6 o campo eslint parece ter sido alterado ou removido do config base
    // eslint: {
    //     ignoreDuringBuilds: true,
    // },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
