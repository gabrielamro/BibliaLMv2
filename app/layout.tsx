import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Lora, Inter, Great_Vibes, Oswald, Cinzel, Playfair_Display, Merriweather, Montserrat, Lato, Roboto_Slab } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Layout from '../components/Layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', style: ['normal', 'italic'] });
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], variable: '--font-great-vibes', preload: false });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', preload: false });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', preload: false });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', preload: false });
const merriweather = Merriweather({ weight: ['300', '400', '700'], subsets: ['latin'], variable: '--font-merriweather', preload: false });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', preload: false });
const lato = Lato({ weight: ['300', '400', '700'], subsets: ['latin'], variable: '--font-lato', preload: false });
const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-roboto-slab', preload: false });

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#c5a059',
};

export const metadata: Metadata = {
    title: 'BíbliaLM - Estudo Bíblico com Inteligência Artificial',
    description: 'Sua plataforma de estudo bíblico profundo com IA, inspirada no NotebookLM. Devocionais, planos de leitura e suporte teológico.',
    manifest: '/manifest.json',
    icons: {
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23c5a059" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/%3E%3Cpath d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/%3E%3C/svg%3E',
        apple: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23c5a059"%3E%3Cpath d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/%3E%3Cpath d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/%3E%3C/svg%3E',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" className={`dark h-full ${inter.variable} ${lora.variable} ${greatVibes.variable} ${oswald.variable} ${cinzel.variable} ${playfair.variable} ${merriweather.variable} ${montserrat.variable} ${lato.variable} ${robotoSlab.variable}`}>
            <body className="h-full bg-bible-paper text-bible-ink dark:bg-bible-darkPaper dark:text-bible-darkInk transition-colors duration-300 font-sans">
                <Providers>
                    <Layout>
                        {children}
                    </Layout>
                </Providers>
            </body>
        </html>
    );
}
