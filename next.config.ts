import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    async redirects() {
        return [
            { source: '/gestao-igreja/equipes', destination: '/gestao-igreja/pessoas?panel=teams', permanent: false },
            { source: '/gestao-igreja/designacoes', destination: '/gestao-igreja/pessoas?panel=assignments', permanent: false },
            { source: '/gestao-igreja/voluntariado', destination: '/gestao-igreja/pessoas?panel=volunteers', permanent: false },
            { source: '/gestao-igreja/qrcodes', destination: '/gestao-igreja/pessoas?panel=invites', permanent: false },
            { source: '/gestao-igreja/permissoes', destination: '/gestao-igreja/pessoas?panel=permissions', permanent: false },
            { source: '/minha-igreja', destination: '/meus-cultos', permanent: false },
            { source: '/minha-igreja/acompanhamento', destination: '/meus-cultos#solicitacoes', permanent: false },
            { source: '/minha-igreja/designacoes', destination: '/meus-cultos#escala', permanent: false },
            { source: '/minha-igreja/equipes', destination: '/meus-cultos#equipes', permanent: false },
            { source: '/minha-igreja/insignias', destination: '/meus-cultos', permanent: false },
            { source: '/minha-igreja/jornada-obreiro', destination: '/meus-cultos', permanent: false },
        ];
    },
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
