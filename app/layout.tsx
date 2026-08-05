import React from 'react';

import type { Metadata, Viewport } from 'next';
import { Lora, Inter, Great_Vibes, Oswald, Cinzel, Playfair_Display, Merriweather, Montserrat, Lato, Roboto_Slab } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Layout from '../components/Layout';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter', display: 'swap' });
const lora = Lora({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-lora', style: ['normal', 'italic'], display: 'swap' });
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
    title: 'Culto+ - Bíblia, comunidade e igreja em um só lugar',
    description: 'Sua plataforma de estudo bíblico profundo com IA, inspirada no NotebookLM. Devocionais, planos de leitura e suporte teológico.',
    manifest: '/manifest.json',
    icons: {
        icon: [{ url: '/icon.svg?v=3', type: 'image/svg+xml' }],
        shortcut: '/icon.svg?v=3',
        apple: '/icon.svg?v=3',
    },
};

const themeInitScript = `
(() => {
  try {
    const saved = localStorage.getItem('bible_app_settings');
    const parsed = saved ? JSON.parse(saved) : null;
    const theme = parsed?.theme === 'light' ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();
`;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning lang="pt-BR" className={`h-full ${inter.variable} ${lora.variable} ${greatVibes.variable} ${oswald.variable} ${cinzel.variable} ${playfair.variable} ${merriweather.variable} ${montserrat.variable} ${lato.variable} ${robotoSlab.variable}`}>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
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
